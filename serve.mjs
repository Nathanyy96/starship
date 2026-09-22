import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { GachaGame } = require("./src/gacha.js");
const { banners, storyChapters, characterBattleStats, trialStages, dispatchMissions, tutorialReward, bossStages, bossVersion, bossMaxRewards, characterBreakthroughs, voyageConfig, voyageBattleStages, voyageVersion, petDefinitions, petVersion, petOutfits, petEffects, petChallenges } = require("./src/data.js");
const { simulateBattle, buildEffectiveStats } = require("./src/battle.js");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const retiredLabeledPortraitRoot = path.resolve(root, "assets", "cards", "labeled-png");
const configuredDataDirectory = process.env.STARSHIP_DATA_DIR || path.join(root, "data");
const dataDirectory = path.resolve(configuredDataDirectory);
const playerDatabasePath = path.join(dataDirectory, "players.json");
const playerDatabaseBackupPath = playerDatabasePath + ".bak";
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const currentUpdateVersion = "2.0-2.5";
const updateReward = Object.freeze({ starSand: 3200 });
const starLawTestReward = Object.freeze({ starSand: 100000, characterExp: 3000000 });
const sessions = new Map();
const databaseBaselines = new WeakMap();
function createGame(state) {
  return new GachaGame({ banners, state, breakthroughRequirements: characterBreakthroughs, voyageConfig, petDefinitions, petOutfits, petEffects, petChallenges });
}
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4"
};

function parseByteRange(rangeHeader, fileSize) {
  if (!rangeHeader) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(String(rangeHeader).trim());
  if (!match || (!match[1] && !match[2]) || fileSize <= 0) return false;

  let start = match[1] ? Number(match[1]) : Math.max(0, fileSize - Number(match[2]));
  let end = match[2] ? Number(match[2]) : fileSize - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= fileSize) return false;
  end = Math.min(end, fileSize - 1);
  return { start, end };
}

fs.mkdirSync(dataDirectory, { recursive: true });

const usePostgres = Boolean(process.env.DATABASE_URL);
let postgresPool = null;
let postgresSchemaPromise = null;

function getPostgresPool() {
  if (!postgresPool) {
    const { Pool } = require("pg");
    postgresPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
      max: 5
    });
  }
  return postgresPool;
}

async function ensurePostgresSchema() {
  if (!usePostgres) return;
  if (!postgresSchemaPromise) {
    postgresSchemaPromise = getPostgresPool().query(`
      CREATE TABLE IF NOT EXISTS starship_players (
        player_key TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        password_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL,
        last_login_at TIMESTAMPTZ,
        state JSONB NOT NULL
      )
    `).catch((error) => {
      postgresSchemaPromise = null;
      throw error;
    });
  }
  await postgresSchemaPromise;
}

function emptyDatabase() {
  return { version: 2, players: {} };
}

function parseFileDatabase(filePath) {
  try {
    const value = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return value && value.players ? Object.assign({ version: 2 }, value) : null;
  } catch (error) {
    return null;
  }
}

function readFileDatabase() {
  const primary = parseFileDatabase(playerDatabasePath);
  const backup = parseFileDatabase(playerDatabaseBackupPath);
  if (!primary && backup) return backup;
  if (!primary) return emptyDatabase();
  // 沒有刪除玩家的功能；若主檔因部署中斷少了帳號，從上一份備份補回。
  if (backup) {
    Object.entries(backup.players || {}).forEach(([key, record]) => {
      if (!primary.players[key]) primary.players[key] = record;
    });
  }
  return primary;
}

function writeFileDatabase(database) {
  const temporaryPath = playerDatabasePath + ".tmp";
  if (fs.existsSync(playerDatabasePath)) fs.copyFileSync(playerDatabasePath, playerDatabaseBackupPath);
  fs.writeFileSync(temporaryPath, JSON.stringify(database, null, 2), "utf8");
  fs.renameSync(temporaryPath, playerDatabasePath);
}

function cloneDatabase(database) {
  return JSON.parse(JSON.stringify(database || emptyDatabase()));
}

function assertPlayerStateContinuity(previousState, nextState, playerKey) {
  if (!previousState || !nextState) return;
  const oldCollection = previousState.collection && typeof previousState.collection === "object" ? previousState.collection : {};
  const nextCollection = nextState.collection && typeof nextState.collection === "object" ? nextState.collection : {};
  Object.entries(oldCollection).forEach(([cardId, oldCopies]) => {
    const oldCount = Math.max(0, Number(oldCopies) || 0);
    const nextCount = Math.max(0, Number(nextCollection[cardId]) || 0);
    if (oldCount > nextCount) throw new Error("更新保護中止：玩家 " + playerKey + " 的角色持有數量不可被降低");
  });

  const oldProgress = previousState.characterProgress && typeof previousState.characterProgress === "object" ? previousState.characterProgress : {};
  const nextProgress = nextState.characterProgress && typeof nextState.characterProgress === "object" ? nextState.characterProgress : {};
  ["level", "affinity", "constellation", "constellationCore"].forEach((field) => {
    Object.entries(oldProgress).forEach(([cardId, progress]) => {
      const oldValue = Math.max(0, Number(progress && progress[field]) || 0);
      const nextValue = Math.max(0, Number(nextProgress[cardId] && nextProgress[cardId][field]) || 0);
      if (oldValue > nextValue) throw new Error("更新保護中止：玩家 " + playerKey + " 的角色培養進度不可被降低");
    });
  });
  Object.entries(oldProgress).forEach(([cardId, progress]) => {
    if (progress && progress.breakthrough === true && !(nextProgress[cardId] && nextProgress[cardId].breakthrough === true)) {
      throw new Error("更新保護中止：玩家 " + playerKey + " 的角色突破狀態不可被降低");
    }
  });

  const oldScenes = previousState.storyProgress && previousState.storyProgress.completedScenes && typeof previousState.storyProgress.completedScenes === "object" ? previousState.storyProgress.completedScenes : {};
  const nextScenes = nextState.storyProgress && nextState.storyProgress.completedScenes && typeof nextState.storyProgress.completedScenes === "object" ? nextState.storyProgress.completedScenes : {};
  Object.keys(oldScenes).forEach((sceneKey) => {
    if (!nextScenes[sceneKey]) throw new Error("更新保護中止：玩家 " + playerKey + " 的已完成劇情不可被移除");
  });
  const oldTutorial = previousState.tutorialProgress && typeof previousState.tutorialProgress === "object" ? previousState.tutorialProgress : {};
  const nextTutorial = nextState.tutorialProgress && typeof nextState.tutorialProgress === "object" ? nextState.tutorialProgress : {};
  if (oldTutorial.rewardClaimed === true && nextTutorial.rewardClaimed !== true) {
    throw new Error("更新保護中止：玩家 " + playerKey + " 的新手教學獎勵狀態不可被移除");
  }
  const oldPets = previousState.petProgress && previousState.petProgress.pets && typeof previousState.petProgress.pets === "object" ? previousState.petProgress.pets : {};
  const nextPets = nextState.petProgress && nextState.petProgress.pets && typeof nextState.petProgress.pets === "object" ? nextState.petProgress.pets : {};
  Object.entries(oldPets).forEach(([petId, oldPet]) => {
    const nextPet = nextPets[petId];
    if (oldPet && oldPet.owned && !(nextPet && nextPet.owned)) throw new Error("更新保護中止：玩家 " + playerKey + " 的寵物不可被移除");
    const oldLevel = Math.max(1, Number(oldPet && oldPet.level) || 1);
    const nextLevel = Math.max(1, Number(nextPet && nextPet.level) || 1);
    if (oldLevel > nextLevel) throw new Error("更新保護中止：玩家 " + playerKey + " 的寵物等級不可被降低");
    ["exp", "bond"].forEach((field) => {
      const oldValue = Math.max(0, Number(oldPet && oldPet[field]) || 0);
      const nextValue = Math.max(0, Number(nextPet && nextPet[field]) || 0);
      // 升級會正常消耗當級經驗；只要等級確實上升，exp 歸零不算資料回溯。
      const consumedForLevelUp = field === "exp" && nextLevel > oldLevel;
      if (oldValue > nextValue && !consumedForLevelUp) throw new Error("更新保護中止：玩家 " + playerKey + " 的寵物培育進度不可被降低");
    });
  });
  const oldSkins = previousState.cosmetics && previousState.cosmetics.skins && typeof previousState.cosmetics.skins === "object" ? previousState.cosmetics.skins : {};
  const nextSkins = nextState.cosmetics && nextState.cosmetics.skins && typeof nextState.cosmetics.skins === "object" ? nextState.cosmetics.skins : {};
  Object.keys(oldSkins).forEach((skinId) => {
    if (!nextSkins[skinId]) throw new Error("更新保護中止：玩家 " + playerKey + " 的已取得裝扮不可被移除");
  });
}

function assertDatabaseContinuity(previousDatabase, nextDatabase) {
  if (!previousDatabase) return;
  Object.entries(previousDatabase.players || {}).forEach(([key, record]) => {
    const nextRecord = nextDatabase.players && nextDatabase.players[key];
    if (!nextRecord) throw new Error("更新保護中止：玩家帳號不可被移除");
    assertPlayerStateContinuity(record.state, nextRecord.state, key);
  });
}

function normalizedTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function readDatabase() {
  if (!usePostgres) return readFileDatabase();
  await ensurePostgresSchema();
  const result = await getPostgresPool().query("SELECT player_key, name, password_hash, created_at, updated_at, last_login_at, state FROM starship_players");
  const database = emptyDatabase();
  result.rows.forEach((row) => {
    database.players[row.player_key] = {
      name: row.name,
      passwordHash: row.password_hash,
      createdAt: normalizedTimestamp(row.created_at),
      updatedAt: normalizedTimestamp(row.updated_at),
      lastLoginAt: row.last_login_at ? normalizedTimestamp(row.last_login_at) : undefined,
      state: row.state || freshPlayerState()
    };
  });
  return database;
}

async function writeDatabase(database, previousDatabase) {
  assertDatabaseContinuity(previousDatabase || databaseBaselines.get(database), database);
  if (!usePostgres) {
    writeFileDatabase(database);
    return;
  }
  await ensurePostgresSchema();
  const client = await getPostgresPool().connect();
  try {
    await client.query("BEGIN");
    for (const [key, record] of Object.entries(database.players || {})) {
      await client.query(`
        INSERT INTO starship_players (player_key, name, password_hash, created_at, updated_at, last_login_at, state)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        ON CONFLICT (player_key) DO UPDATE SET
          name = EXCLUDED.name,
          password_hash = EXCLUDED.password_hash,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at,
          last_login_at = EXCLUDED.last_login_at,
          state = EXCLUDED.state
      `, [
        key,
        record.name,
        record.passwordHash || null,
        normalizedTimestamp(record.createdAt),
        normalizedTimestamp(record.updatedAt),
        record.lastLoginAt ? normalizedTimestamp(record.lastLoginAt) : null,
        JSON.stringify(record.state || freshPlayerState())
      ]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function normalizePlayerName(value) {
  return String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, 24);
}

function playerKey(name) {
  return normalizePlayerName(name).toLowerCase();
}

function newPlayerRecord(name, passwordHash) {
  const now = new Date().toISOString();
  return {
    name,
    passwordHash: passwordHash || null,
    createdAt: now,
    updatedAt: now,
    state: freshPlayerState()
  };
}

function freshPlayerState() {
  const state = createGame().getState();
  state.collection.celesia = 1;
  state.recruitment.starterGranted = true;
  return createGame(state).getState();
}

function snapshotPlayerProgress(currentState) {
  const source = currentState && typeof currentState === "object" ? currentState : {};
  return {
    collection: source.collection && typeof source.collection === "object" ? JSON.parse(JSON.stringify(source.collection)) : {},
    characterProgress: source.characterProgress && typeof source.characterProgress === "object" ? JSON.parse(JSON.stringify(source.characterProgress)) : {}
  };
}

function restorePlayerProgress(state, snapshot) {
  const savedCollection = snapshot && snapshot.collection ? snapshot.collection : {};
  const savedProgress = snapshot && snapshot.characterProgress ? snapshot.characterProgress : {};
  state.collection = state.collection || {};
  state.characterProgress = state.characterProgress || {};
  Object.entries(savedCollection).forEach(([cardId, copies]) => {
    const count = Math.max(0, Number(copies) || 0);
    state.collection[cardId] = Math.max(Number(state.collection[cardId]) || 0, count);
  });
  Object.entries(savedProgress).forEach(([cardId, saved]) => {
    if (!saved || typeof saved !== "object") return;
    const current = state.characterProgress[cardId] && typeof state.characterProgress[cardId] === "object" ? state.characterProgress[cardId] : {};
    state.characterProgress[cardId] = Object.assign({}, current, saved);
    ["level", "affinity", "constellation", "constellationCore"].forEach((field) => {
      const oldValue = Math.max(0, Number(saved[field]) || 0);
      const currentValue = Math.max(0, Number(current[field]) || 0);
      state.characterProgress[cardId][field] = Math.max(oldValue, currentValue);
    });
  });
}

function ensurePlayerMilestones(currentState) {
  const preservedProgress = snapshotPlayerProgress(currentState);
  const state = createGame(currentState || freshPlayerState()).getState();
  restorePlayerProgress(state, preservedProgress);
  state.collection = state.collection || {};
  state.recruitment = state.recruitment || {};
  // 任何登入都要確保主角存在；這也會修復早期建立、但尚未有 starterGranted
  // 標記或標記與角色數量不同步的舊存檔。
  state.collection.celesia = Math.max(1, Number(state.collection.celesia) || 0);
  state.recruitment.starterGranted = true;
  const completedScenes = state.storyProgress && state.storyProgress.completedScenes ? state.storyProgress.completedScenes : {};
  if (Object.keys(completedScenes).some((key) => key.indexOf("main-1-0:") === 0) && !state.recruitment.story10ChoiceClaimed) {
    state.recruitment.story10ChoiceAvailable = true;
  }
  const clearedStages = state.trialProgress && Array.isArray(state.trialProgress.clearedStages) ? state.trialProgress.clearedStages : [];
  if (clearedStages.indexOf(10) >= 0 && !state.recruitment.trial10ChoiceClaimed) {
    state.recruitment.trial10ChoiceAvailable = true;
  }
  state.updateRewards = state.updateRewards || { claimedVersions: {} };
  state.updateRewards.claimedVersions = state.updateRewards.claimedVersions || {};
  if (!state.updateRewards.claimedVersions[currentUpdateVersion]) {
    state.resources.starSand += updateReward.starSand;
    state.updateRewards.claimedVersions[currentUpdateVersion] = { starSand: updateReward.starSand, grantedAt: new Date().toISOString() };
  }
  if (state.trialProgress.version !== currentUpdateVersion) {
    state.trialProgress.version = currentUpdateVersion;
    state.trialProgress.attempts = {};
    state.trialProgress.clearedStages = [];
    state.trialProgress.bestStage = 0;
    state.trialProgress.lastBattle = null;
    state.trialProgress.selectedTeam = [];
  }
  state.bossProgress = state.bossProgress || { version: bossVersion, selectedBossId: "boss-star-warden", selectedTeam: [], attempts: {}, lastBattle: null };
  if (state.bossProgress.version !== bossVersion) {
    state.bossProgress.version = bossVersion;
    state.bossProgress.attempts = {};
    state.bossProgress.lastBattle = null;
    state.bossProgress.selectedTeam = [];
    state.bossProgress.selectedBossId = "boss-star-warden";
  }
  state.dispatchProgress = state.dispatchProgress || { version: currentUpdateVersion, selectedTeam: [], claimed: {}, lastMission: null };
  if (state.dispatchProgress.version !== currentUpdateVersion) {
    state.dispatchProgress.version = currentUpdateVersion;
    state.dispatchProgress.selectedTeam = [];
    state.dispatchProgress.claimed = {};
    state.dispatchProgress.lastMission = null;
  }
  state.voyageProgress = state.voyageProgress || { version: voyageVersion, status: "idle", routeId: null, selectedRouteId: null, route: [], nodeIndex: 0, selectedTeam: [], fragments: 0, buffs: [], flags: {}, claimedRewards: {}, lastBattle: null, lastEnding: null };
  if (state.voyageProgress.version !== voyageVersion) {
    state.voyageProgress.version = voyageVersion;
    state.voyageProgress.status = "idle";
    state.voyageProgress.routeId = null;
    state.voyageProgress.selectedRouteId = null;
    state.voyageProgress.route = [];
    state.voyageProgress.nodeIndex = 0;
    state.voyageProgress.selectedTeam = [];
    state.voyageProgress.fragments = 0;
    state.voyageProgress.buffs = [];
    state.voyageProgress.flags = {};
    state.voyageProgress.claimedRewards = {};
    state.voyageProgress.lastBattle = null;
    state.voyageProgress.lastEnding = null;
  }
  state.petProgress = state.petProgress || { version: petVersion, exploreCount: 0, ratedShowcases: {} };
  if (state.petProgress.version !== petVersion) {
    state.petProgress.version = petVersion;
    state.petProgress.exploreCount = 0;
    state.petProgress.daily = { date: null, groomed: false, challengeCount: 0 };
    state.petProgress.ratedShowcases = {};
    state.petProgress.showcase = state.petProgress.showcase || {};
    state.petProgress.showcase.ratedBy = {};
  }
  const migratedState = createGame(state).getState();
  restorePlayerProgress(migratedState, preservedProgress);
  return createGame(migratedState).getState();
}

function findPlayer(database, name) {
  const normalizedName = normalizePlayerName(name);
  if (!normalizedName) throw new Error("請輸入遊戲名稱");
  const key = playerKey(normalizedName);
  const record = database.players[key];
  return record ? { key, record } : null;
}

function getPlayer(database, name) {
  const normalizedName = normalizePlayerName(name);
  if (!normalizedName) throw new Error("請輸入遊戲名稱");
  const key = playerKey(normalizedName);
  let record = database.players[key];
  let created = false;
  if (!record) {
    record = newPlayerRecord(normalizedName);
    database.players[key] = record;
    created = true;
  }
  record.state = ensurePlayerMilestones(record.state);
  return { key, record, created };
}

function publicPlayer(record) {
  return { name: record.name, createdAt: record.createdAt, updatedAt: record.updatedAt, hasPassword: Boolean(record.passwordHash) };
}

function validatePassword(value) {
  if (typeof value !== "string" || value.length < 6) throw new Error("密碼至少需要 6 個字元");
  if (value.length > 72) throw new Error("密碼不能超過 72 個字元");
  return value;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(validatePassword(password), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 });
  return ["scrypt", "16384", "8", "1", salt.toString("hex"), derived.toString("hex")].join("$");
}

function verifyPassword(password, encoded) {
  try {
    const parts = String(encoded || "").split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const derived = crypto.scryptSync(validatePassword(password), Buffer.from(parts[4], "hex"), 64, { N: Number(parts[1]), r: Number(parts[2]), p: Number(parts[3]), maxmem: 32 * 1024 * 1024 });
    const expected = Buffer.from(parts[5], "hex");
    return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
  } catch (error) {
    return false;
  }
}

function createSession(key) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { key, expiresAt: Date.now() + sessionLifetimeMs });
  return token;
}

function playerFromSession(database, token) {
  const session = sessions.get(String(token || ""));
  if (!session) throw new Error("登入狀態已失效，請重新登入");
  if (session.expiresAt <= Date.now()) {
    sessions.delete(String(token || ""));
    throw new Error("登入狀態已過期，請重新登入");
  }
  const record = database.players[session.key];
  if (!record || !record.passwordHash) throw new Error("找不到登入帳號，請重新登入");
  session.expiresAt = Date.now() + sessionLifetimeMs;
  return { key: session.key, record };
}

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Access-Control-Allow-Origin": "*"
  });
  response.end(JSON.stringify(value));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error("請求內容過大"));
        request.destroy();
      }
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error("請求格式不是有效 JSON"));
      }
    });
    request.on("error", reject);
  });
}

function adminKeyIsValid(value) {
  const configuredKey = process.env.STARSHIP_ADMIN_KEY || (process.env.NODE_ENV === "production" ? "" : "dev-admin-key");
  return Boolean(configuredKey) && value === configuredKey;
}

function assertAdmin(body) {
  if (!adminKeyIsValid(body.adminKey)) {
    throw new Error("管理密鑰錯誤；請在伺服器設定 STARSHIP_ADMIN_KEY");
  }
}

function testRewardsEnabled() {
  const flag = String(process.env.STARSHIP_TEST_REWARDS || "").trim().toLowerCase();
  return process.env.NODE_ENV !== "production" || flag === "1" || flag === "true" || flag === "yes";
}

function claimStarLawTestReward(currentState) {
  if (!testRewardsEnabled()) {
    throw new Error("星律測試補給目前已關閉；測試時請暫時設定 STARSHIP_TEST_REWARDS=true");
  }
  return createGame(currentState).claimStarLawTestReward({ reward: starLawTestReward });
}

function integerOrCurrent(value, current) {
  if (value === undefined) return current;
  if (!Number.isInteger(value) || value < 0) throw new Error("資源與保底數值必須是非負整數");
  return value;
}

function updateAdminState(currentState, body) {
  const state = JSON.parse(JSON.stringify(currentState));
  if (body.resources) {
    ["starSand", "starMarks", "echoPowder", "characterExp"].forEach((key) => {
      state.resources[key] = integerOrCurrent(body.resources[key], state.resources[key]);
    });
  }
  if (body.resourceDelta) {
    ["starSand", "starMarks", "echoPowder", "characterExp"].forEach((key) => {
      const delta = body.resourceDelta[key] === undefined ? 0 : body.resourceDelta[key];
      if (!Number.isInteger(delta)) throw new Error("資源增減必須是整數");
      state.resources[key] += delta;
      if (state.resources[key] < 0) throw new Error("資源不能低於 0：" + key);
    });
  }
  if (body.breakthroughMaterials) {
    if (!body.breakthroughMaterials || typeof body.breakthroughMaterials !== "object" || Array.isArray(body.breakthroughMaterials)) throw new Error("突破材料必須是物件");
    Object.entries(body.breakthroughMaterials).forEach(([materialId, amount]) => {
      state.breakthroughMaterials[materialId] = integerOrCurrent(amount, state.breakthroughMaterials[materialId] || 0);
    });
  }
  if (body.breakthroughMaterialDelta) {
    if (!body.breakthroughMaterialDelta || typeof body.breakthroughMaterialDelta !== "object" || Array.isArray(body.breakthroughMaterialDelta)) throw new Error("突破材料增減必須是物件");
    Object.entries(body.breakthroughMaterialDelta).forEach(([materialId, delta]) => {
      if (!Number.isInteger(delta)) throw new Error("突破材料增減必須是整數");
      state.breakthroughMaterials[materialId] = (Number(state.breakthroughMaterials[materialId]) || 0) + delta;
      if (state.breakthroughMaterials[materialId] < 0) throw new Error("突破材料不能低於 0：" + materialId);
    });
  }
  if (body.pity) {
    ["limited", "standard"].forEach((key) => {
      if (!body.pity[key]) return;
      state.pity[key] = state.pity[key] || { pullsSince4Star: 0, guaranteedFeatured: false };
      state.pity[key].pullsSince4Star = integerOrCurrent(body.pity[key].pullsSince4Star, state.pity[key].pullsSince4Star);
      if (body.pity[key].guaranteedFeatured !== undefined) state.pity[key].guaranteedFeatured = Boolean(body.pity[key].guaranteedFeatured);
    });
  }
  if (body.selectedFeatured) state.selectedFeatured = Object.assign({}, state.selectedFeatured, body.selectedFeatured);
  return createGame(state).getState();
}

function storyChapterById(chapterId) {
  const chapter = storyChapters.find((item) => item.id === chapterId);
  if (!chapter) throw new Error("找不到劇情章節");
  return chapter;
}

function storySceneById(chapter, sceneId) {
  const scene = chapter.scenes.find((item) => item.id === sceneId);
  if (!scene) throw new Error("找不到劇情幕次");
  return scene;
}

function completeStoryScene(currentState, body) {
  const state = ensurePlayerMilestones(currentState);
  const chapter = storyChapterById(body.chapterId);
  if (chapter.releaseOpen === false) throw new Error("這個版本的劇情已建檔，但尚未開放");
  if (body.action === "select") {
    state.storyProgress.currentChapter = chapter.id;
    return { state: createGame(state).getState(), alreadyClaimed: false, reward: { starSand: 0 }, chapter, scene: null };
  }
  const scene = storySceneById(chapter, body.sceneId);
  const key = chapter.id + ":" + scene.id;
  const storyReward = { starSand: 100, characterExp: 650 };
  state.storyProgress = state.storyProgress || { currentChapter: chapter.id, completedScenes: {} };
  state.storyProgress.completedScenes = state.storyProgress.completedScenes || {};
  state.storyProgress.currentChapter = chapter.id;
  if (state.storyProgress.completedScenes[key]) {
    return { state, alreadyClaimed: true, reward: { starSand: 0, characterExp: 0 }, chapter, scene };
  }
  state.storyProgress.completedScenes[key] = { completedAt: new Date().toISOString(), starSand: storyReward.starSand, characterExp: storyReward.characterExp };
  state.resources.starSand += storyReward.starSand;
  state.resources.characterExp += storyReward.characterExp;
  if (chapter.id === "main-1-0" && !state.recruitment.story10ChoiceClaimed) {
    state.recruitment.story10ChoiceAvailable = true;
  }
  return { state: createGame(state).getState(), alreadyClaimed: false, reward: storyReward, chapter, scene };
}

function completeTutorial(currentState) {
  const state = ensurePlayerMilestones(currentState);
  const game = createGame(state);
  return game.completeTutorial({ version: currentUpdateVersion, reward: tutorialReward });
}

function trialStageById(stageId) {
  const numericId = Number(stageId);
  const stage = trialStages.find((item) => item.id === numericId);
  if (!stage) throw new Error("找不到星界試煉關卡");
  return stage;
}

function voyageStageByNode(node) {
  const dedicated = (voyageBattleStages || []).find((item) => item.id === String(node && node.stageId || node && node.id || ""));
  if (dedicated) return dedicated;
  return node && node.stageId ? trialStageById(node.stageId) : null;
}

function runTrial(currentState, body) {
  const state = ensurePlayerMilestones(currentState);
  const stage = trialStageById(body.stageId);
  const team = Array.from(new Set(Array.isArray(body.team) ? body.team.map((id) => String(id)) : [])).slice(0, 4);
  if (!team.length) throw new Error("至少派出 1 名角色才能開始戰鬥");
  if (team.some((id) => !characterBattleStats[id] || !(state.collection[id] > 0))) throw new Error("只能派出已取得且已開放的角色");
  if (stage.id > 1 && state.trialProgress.clearedStages.indexOf(stage.id - 1) < 0) throw new Error("請先通關前一關");
  const attempts = Number(state.trialProgress.attempts[stage.id] || 0);
  if (attempts >= 10) throw new Error("本關在目前版本已完成 10 次，請等待下次遊戲更新重置挑戰次數");
  const effectiveStats = buildEffectiveStats(characterBattleStats, state);
  const battle = simulateBattle({ team, stats: effectiveStats, stage, rng: Math.random });
  const rewardStarSand = Number(stage.reward && stage.reward.starSand || 0);
  const rewardCharacterExp = Number(stage.reward && stage.reward.characterExp || 0);
  state.trialProgress.selectedTeam = team;
  state.trialProgress.lastBattle = battle;
  if (battle.won) {
    state.trialProgress.attempts[stage.id] = attempts + 1;
    if (state.trialProgress.clearedStages.indexOf(stage.id) < 0) {
      state.trialProgress.clearedStages.push(stage.id);
    }
    state.resources.starSand += rewardStarSand;
    state.resources.characterExp += rewardCharacterExp;
    state.trialProgress.bestStage = Math.max(state.trialProgress.bestStage, stage.id);
    if (stage.id === 10 && !state.recruitment.trial10ChoiceClaimed) state.recruitment.trial10ChoiceAvailable = true;
  }
  return { state: createGame(state).getState(), battle, reward: battle.won ? { starSand: rewardStarSand, characterExp: rewardCharacterExp, attemptsUsed: state.trialProgress.attempts[stage.id], attemptsRemaining: 10 - state.trialProgress.attempts[stage.id] } : { starSand: 0, characterExp: 0, attemptsUsed: attempts, attemptsRemaining: 10 - attempts } };
}

function bossStageById(bossId) {
  const stage = bossStages.find((item) => item.id === String(bossId || ""));
  if (!stage) throw new Error("找不到 Boss 關卡");
  return stage;
}

function runBoss(currentState, body) {
  const state = ensurePlayerMilestones(currentState);
  const stage = bossStageById(body.bossId);
  const team = Array.from(new Set(Array.isArray(body.team) ? body.team.map((id) => String(id)) : [])).slice(0, 4);
  if (!team.length) throw new Error("至少派出 1 名角色才能挑戰 Boss");
  if (team.some((id) => !characterBattleStats[id] || !(state.collection[id] > 0))) throw new Error("只能派出已取得且已開放的角色");
  const attempts = Number(state.bossProgress.attempts[stage.id] || 0);
  if (attempts >= bossMaxRewards) throw new Error("這個 Boss 在目前版本已完成 " + bossMaxRewards + " 次，請等待下次更新重置挑戰次數");
  const effectiveStats = buildEffectiveStats(characterBattleStats, state);
  const battle = simulateBattle({ team, stats: effectiveStats, stage, rng: Math.random });
  state.bossProgress.selectedBossId = stage.id;
  state.bossProgress.selectedTeam = team;
  state.bossProgress.lastBattle = battle;
  const reward = stage.reward || {};
  if (battle.won) {
    state.bossProgress.attempts[stage.id] = attempts + 1;
    const materialId = String(reward.materialId || "");
    const amount = Math.max(0, Number(reward.amount) || 0);
    state.breakthroughMaterials[materialId] = (Number(state.breakthroughMaterials[materialId]) || 0) + amount;
    const universalAmount = Math.max(0, Number(reward.universalAmount) || 1);
    state.breakthroughMaterials["universal-core"] = (Number(state.breakthroughMaterials["universal-core"]) || 0) + universalAmount;
    state.resources.characterExp += Math.max(0, Number(reward.characterExp) || 0);
  }
  const attemptsUsed = Number(state.bossProgress.attempts[stage.id] || attempts);
  return {
    state: createGame(state).getState(),
    battle,
    boss: stage,
    reward: battle.won ? { materialId: reward.materialId, materialName: reward.materialName, amount: reward.amount, universalMaterialId: "universal-core", universalMaterialName: "星界通用突破印記", universalAmount: reward.universalAmount || 1, characterExp: reward.characterExp, attemptsUsed, attemptsRemaining: bossMaxRewards - attemptsUsed } : { materialId: reward.materialId, materialName: reward.materialName, amount: 0, universalMaterialId: "universal-core", universalMaterialName: "星界通用突破印記", universalAmount: 0, characterExp: 0, attemptsUsed, attemptsRemaining: bossMaxRewards - attemptsUsed }
  };
}

function dispatchMissionById(missionId) {
  const mission = dispatchMissions.find((item) => item.id === String(missionId || ""));
  if (!mission) throw new Error("找不到星港委託");
  return mission;
}

function runDispatch(currentState, body) {
  const state = ensurePlayerMilestones(currentState);
  const mission = dispatchMissionById(body.missionId);
  const team = Array.from(new Set(Array.isArray(body.team) ? body.team.map((id) => String(id)) : [])).slice(0, 4);
  if (!team.length) throw new Error("至少派出 1 名角色才能執行委託");
  if (team.some((id) => !characterBattleStats[id] || !(state.collection[id] > 0))) throw new Error("只能派出已取得且已開放的角色");
  if (state.dispatchProgress.claimed[mission.id]) throw new Error("這份委託本版本已完成，請等待下次版本更新");
  const effectiveStats = buildEffectiveStats(characterBattleStats, state);
  const battle = simulateBattle({ team, stats: effectiveStats, stage: mission, rng: Math.random });
  state.dispatchProgress.selectedTeam = team;
  state.dispatchProgress.lastMission = { missionId: mission.id, battle };
  const reward = {};
  Object.keys(mission.reward || {}).forEach((key) => {
    const amount = Number(mission.reward[key] || 0);
    if (!Number.isFinite(amount) || amount < 0) return;
    reward[key] = battle.won ? amount : 0;
    if (battle.won && Object.prototype.hasOwnProperty.call(state.resources, key)) state.resources[key] += amount;
  });
  if (battle.won) state.dispatchProgress.claimed[mission.id] = { completedAt: new Date().toISOString() };
  return { state: createGame(state).getState(), battle, reward, mission };
}

function voyageNodeById(nodeId) {
  const node = (voyageConfig.nodes || []).find((item) => item.id === String(nodeId || ""));
  if (!node) throw new Error("找不到星海迷航節點");
  return node;
}

function runVoyage(currentState, body) {
  const state = ensurePlayerMilestones(currentState);
  const game = createGame(state);
  const action = String(body.action || "");
  if (action === "select-route") {
    if (state.voyageProgress.status === "active") throw new Error("目前航程進行中，完成或重新開航後才能更換航線");
    const routeId = String(body.routeId || "");
    const route = (voyageConfig.routes || []).find((item) => item.id === routeId);
    if (!route) throw new Error("找不到這條星海迷航航線");
    state.voyageProgress.selectedRouteId = route.id;
    return { state: createGame(state).getState(), selectedRouteId: route.id, voyageVersion };
  }
  if (action === "start") {
    const team = Array.from(new Set(Array.isArray(body.team) ? body.team.map((id) => String(id)) : [])).slice(0, 4);
    if (team.some((id) => !characterBattleStats[id] || !(state.collection[id] > 0))) throw new Error("只能派出已取得且已開放的角色");
    return game.startVoyage({ routeId: body.routeId || state.voyageProgress.selectedRouteId, team });
  }
  if (action !== "resolve") throw new Error("找不到星海迷航操作");
  const progress = state.voyageProgress;
  if (progress.status !== "active") throw new Error("目前沒有進行中的星海迷航航程");
  const node = voyageNodeById(progress.route[progress.nodeIndex]);
  const team = Array.from(new Set(Array.isArray(body.team) ? body.team.map((id) => String(id)) : progress.selectedTeam)).slice(0, 4);
  let battle = null;
  if (node.type === "combat" || node.type === "boss") {
    if (!team.length) throw new Error("至少派出 1 名角色才能進行星海迷航戰鬥");
    if (team.some((id) => !characterBattleStats[id] || !(state.collection[id] > 0))) throw new Error("只能派出已取得且已開放的角色");
    const stage = voyageStageByNode(node);
    battle = simulateBattle({ team, stats: buildEffectiveStats(characterBattleStats, state), stage, rng: Math.random });
  }
  const result = game.advanceVoyage({ nodeId: node.id, choice: body.choice, team, battle });
  return Object.assign({ state: result.state, node: result.node, nextNode: result.nextNode, battle: result.battle, reward: result.reward, ending: result.ending }, { voyageVersion });
}

function petAction(currentState, body) {
  const state = ensurePlayerMilestones(currentState);
  const game = createGame(state);
  const action = String(body.action || "");
  let result;
  if (action === "customize" || action === "publish") {
    result = game.setPetCustomization({
      petId: body.petId,
      outfitId: body.outfitId,
      effectId: body.effectId,
      isPublic: action === "publish" ? body.isPublic === true : body.isPublic
    });
  } else {
    result = game.petAction({ action, petId: body.petId, focus: body.focus, challengeId: body.challengeId });
  }
  return result;
}

function publicPetShowcase(key, record) {
  const state = createGame(record.state).getState();
  const progress = state.petProgress || {};
  const showcase = progress.showcase || {};
  if (showcase.isPublic !== true) return null;
  const pet = progress.pets && progress.pets[showcase.featuredPetId];
  const definition = petDefinitions.find((item) => item.id === showcase.featuredPetId) || petDefinitions[0];
  const outfit = petOutfits.find((item) => item.id === showcase.outfitId) || petOutfits[0];
  const effect = petEffects.find((item) => item.id === showcase.effectId) || petEffects[0];
  if (!pet || !definition) return null;
  return {
    playerKey: key,
    playerName: record.name,
    pet: { id: definition.id, name: definition.name, temperament: definition.temperament, icon: definition.icon, accent: definition.accent, image: definition.image, level: pet.level, bond: pet.bond, mood: pet.mood },
    outfit: { id: outfit.id, name: outfit.name, description: outfit.description, accent: outfit.accent },
    effect: { id: effect.id, name: effect.name, description: effect.description, icon: effect.icon, color: effect.color },
    ratingCount: Number(showcase.ratingCount || 0),
    ratingAverage: showcase.ratingCount ? Math.round(Number(showcase.ratingTotal || 0) / showcase.ratingCount * 10) / 10 : 0
  };
}

function runPetShowcase(database, player, body) {
  const action = String(body.action || "browse");
  if (action === "browse") {
    const list = Object.entries(database.players || {}).map(([key, record]) => key === player.key ? null : publicPetShowcase(key, record)).filter(Boolean).sort((a, b) => b.ratingAverage - a.ratingAverage || b.ratingCount - a.ratingCount).slice(0, 30);
    return { state: player.record.state, showcases: list };
  }
  if (action === "publish") {
    const result = petAction(player.record.state, body);
    player.record.state = result.state;
    player.record.updatedAt = new Date().toISOString();
    return { state: player.record.state, showcase: publicPetShowcase(player.key, player.record), reward: { petFood: 0 } };
  }
  if (action !== "rate") throw new Error("找不到星伴展示操作");
  const targetKey = String(body.targetKey || "");
  if (!targetKey || targetKey === player.key) throw new Error("不能評分自己的寵物展示");
  const target = database.players[targetKey];
  if (!target) throw new Error("找不到這個公開展示");
  const targetState = ensurePlayerMilestones(target.state);
  const targetShowcase = targetState.petProgress && targetState.petProgress.showcase;
  if (!targetShowcase || targetShowcase.isPublic !== true) throw new Error("這個玩家目前沒有公開寵物");
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("評分必須是 1 到 5 顆星");
  const currentState = ensurePlayerMilestones(player.record.state);
  currentState.petProgress.ratedShowcases = currentState.petProgress.ratedShowcases || {};
  if (currentState.petProgress.ratedShowcases[targetKey] && currentState.petProgress.ratedShowcases[targetKey].version === petVersion) throw new Error("本期已經評分過這個寵物展示");
  targetShowcase.ratedBy = targetShowcase.ratedBy || {};
  if (targetShowcase.ratedBy[player.key] && targetShowcase.ratedBy[player.key].version === petVersion) throw new Error("本期已經評分過這個寵物展示");
  targetShowcase.ratingTotal = Number(targetShowcase.ratingTotal || 0) + rating;
  targetShowcase.ratingCount = Number(targetShowcase.ratingCount || 0) + 1;
  targetShowcase.ratedBy[player.key] = { version: petVersion, rating, ratedAt: new Date().toISOString() };
  targetState.petProgress.resources.petToys = Number(targetState.petProgress.resources.petToys || 0) + 1;
  currentState.petProgress.ratedShowcases[targetKey] = { version: petVersion, rating, ratedAt: new Date().toISOString() };
  currentState.petProgress.resources.petFood = Number(currentState.petProgress.resources.petFood || 0) + 1;
  target.state = createGame(targetState).getState();
  player.record.state = createGame(currentState).getState();
  target.updatedAt = new Date().toISOString();
  player.record.updatedAt = target.updatedAt;
  return { state: player.record.state, showcases: [publicPetShowcase(targetKey, target)], reward: { petFood: 1 }, ownerReward: { petToys: 1 } };
}

function claimCharacterChoice(currentState, body) {
  const state = ensurePlayerMilestones(currentState);
  const rewardKey = String(body.rewardKey || "");
  const cardId = String(body.cardId || "");
  if (!["story-1-0", "trial-10"].includes(rewardKey)) throw new Error("找不到角色自選獎勵");
  if (!["reyn", "lia"].includes(cardId)) throw new Error("只能選擇雷恩或莉亞");
  const availableKey = rewardKey === "story-1-0" ? "story10ChoiceAvailable" : "trial10ChoiceAvailable";
  const claimedKey = rewardKey === "story-1-0" ? "story10ChoiceClaimed" : "trial10ChoiceClaimed";
  if (!state.recruitment[availableKey] || state.recruitment[claimedKey]) throw new Error("這份角色自選獎勵目前不可領取");
  if (rewardKey === "trial-10" && state.collection[cardId] > 0) throw new Error("第 10 關獎勵請選擇尚未取得的角色");
  const game = createGame(state);
  const result = game.grantCharacter(cardId);
  const nextState = result.state;
  nextState.recruitment[availableKey] = false;
  nextState.recruitment[claimedKey] = true;
  return { state: createGame(nextState).getState(), card: result.card, rewardKey };
}

async function handleApi(request, response, requestUrl) {
  if (requestUrl.pathname === "/api/health" && request.method === "GET") {
    await ensurePostgresSchema();
    sendJson(response, 200, {
      ok: true,
      service: "starship-gacha",
      persistence: usePostgres ? "postgres" : "file",
      testRewardsEnabled: testRewardsEnabled()
    });
    return;
  }
  if (request.method === "OPTIONS") {
    response.writeHead(204, { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" });
    response.end();
    return;
  }
  if (request.method !== "POST") {
    sendJson(response, 405, { ok: false, error: "此 API 只接受 POST" });
    return;
  }

  const body = await readBody(request);
  const database = await readDatabase();
  databaseBaselines.set(database, cloneDatabase(database));
  try {
    if (requestUrl.pathname === "/api/player/register") {
      const name = normalizePlayerName(body.name);
      if (!name) throw new Error("請輸入遊戲名稱");
      const passwordHash = hashPassword(body.password);
      const existing = findPlayer(database, name);
      if (existing && existing.record.passwordHash) throw new Error("這個遊戲名稱已經有帳號，請改用登入");
      const record = existing ? existing.record : newPlayerRecord(name, passwordHash);
      const migrated = Boolean(existing);
      record.name = record.name || name;
      record.passwordHash = passwordHash;
      record.updatedAt = new Date().toISOString();
      record.state = ensurePlayerMilestones(record.state);
      database.players[playerKey(name)] = record;
      await writeDatabase(database);
      sendJson(response, 200, { ok: true, created: !existing, migrated, token: createSession(playerKey(name)), player: publicPlayer(record), state: record.state });
      return;
    }

    if (requestUrl.pathname === "/api/player/login") {
      const name = normalizePlayerName(body.name);
      const existing = findPlayer(database, name);
      if (!existing) throw new Error("找不到這個遊戲名稱；第一次登入請選擇建立帳號");
      if (!existing.record.passwordHash) throw new Error("這是尚未設定密碼的舊存檔，請改選「第一次登入」完成密碼設定");
      if (!verifyPassword(body.password, existing.record.passwordHash)) throw new Error("遊戲名稱或密碼不正確");
      existing.record.lastLoginAt = new Date().toISOString();
      existing.record.updatedAt = existing.record.lastLoginAt;
      await writeDatabase(database);
      existing.record.state = ensurePlayerMilestones(existing.record.state);
      await writeDatabase(database);
      sendJson(response, 200, { ok: true, token: createSession(existing.key), player: publicPlayer(existing.record), state: existing.record.state });
      return;
    }

    if (requestUrl.pathname === "/api/player/session") {
      const player = playerFromSession(database, body.token);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state });
      return;
    }

    if (requestUrl.pathname === "/api/player/story-progress") {
      const player = playerFromSession(database, body.token);
      const completed = completeStoryScene(player.record.state, body);
      player.record.state = completed.state;
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state, alreadyClaimed: completed.alreadyClaimed, reward: completed.reward, chapter: { id: completed.chapter.id, title: completed.chapter.title }, scene: completed.scene ? { id: completed.scene.id, title: completed.scene.title } : null });
      return;
    }

    if (requestUrl.pathname === "/api/player/tutorial-complete") {
      const player = playerFromSession(database, body.token);
      const result = completeTutorial(player.record.state);
      player.record.state = result.state;
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state, alreadyClaimed: result.alreadyClaimed, reward: result.reward });
      return;
    }

    if (requestUrl.pathname === "/api/player/star-law-test-reward") {
      const player = playerFromSession(database, body.token);
      const result = claimStarLawTestReward(player.record.state);
      player.record.state = result.state;
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state, alreadyClaimed: result.alreadyClaimed, reward: result.reward });
      return;
    }

    if (requestUrl.pathname === "/api/player/claim-character") {
      const player = playerFromSession(database, body.token);
      const result = claimCharacterChoice(player.record.state, body);
      player.record.state = result.state;
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state, card: result.card, rewardKey: result.rewardKey });
      return;
    }

    if (requestUrl.pathname === "/api/player/trial-battle") {
      const player = playerFromSession(database, body.token);
      const result = runTrial(player.record.state, body);
      player.record.state = result.state;
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state, battle: result.battle, reward: result.reward });
      return;
    }

    if (requestUrl.pathname === "/api/player/boss-battle") {
      const player = playerFromSession(database, body.token);
      const result = runBoss(player.record.state, body);
      player.record.state = result.state;
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state, battle: result.battle, reward: result.reward, boss: result.boss });
      return;
    }

    if (requestUrl.pathname === "/api/player/dispatch") {
      const player = playerFromSession(database, body.token);
      const result = runDispatch(player.record.state, body);
      player.record.state = result.state;
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state, battle: result.battle, reward: result.reward, mission: result.mission });
      return;
    }

    if (requestUrl.pathname === "/api/player/voyage") {
      const player = playerFromSession(database, body.token);
      const result = runVoyage(player.record.state, body);
      player.record.state = result.state;
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, Object.assign({ ok: true, player: publicPlayer(player.record) }, result));
      return;
    }

    if (requestUrl.pathname === "/api/player/pet-action") {
      const player = playerFromSession(database, body.token);
      const result = petAction(player.record.state, body);
      player.record.state = result.state;
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, Object.assign({ ok: true, player: publicPlayer(player.record) }, result));
      return;
    }

    if (requestUrl.pathname === "/api/player/pet-showcase") {
      const player = playerFromSession(database, body.token);
      const result = runPetShowcase(database, player, body);
      await writeDatabase(database);
      sendJson(response, 200, Object.assign({ ok: true, player: publicPlayer(player.record) }, result));
      return;
    }

    if (requestUrl.pathname === "/api/player/open") {
      throw new Error("請先使用「第一次登入」建立帳號，或使用「我登入過」登入");
    }

    if (requestUrl.pathname === "/api/player/pull" || requestUrl.pathname === "/api/player/select-featured" || requestUrl.pathname === "/api/player/exchange-featured") {
      const player = playerFromSession(database, body.token);
      const game = createGame(player.record.state);
      let result;
      if (requestUrl.pathname === "/api/player/pull") {
        result = game.pull({ bannerId: body.bannerId, count: body.count, payment: body.payment });
      } else if (requestUrl.pathname === "/api/player/select-featured") {
        result = game.selectFeatured({ bannerId: body.bannerId, cardId: body.cardId });
      } else {
        result = game.exchangeFeatured({ bannerId: body.bannerId });
      }
      player.record.state = game.getState();
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, Object.assign({ ok: true, player: publicPlayer(player.record), state: player.record.state }, result || {}));
      return;
    }

    if (requestUrl.pathname === "/api/player/character-development") {
      const player = playerFromSession(database, body.token);
      const game = createGame(player.record.state);
      const result = game.developCharacter({ cardId: body.cardId });
      player.record.state = game.getState();
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, Object.assign({ ok: true, player: publicPlayer(player.record) }, result));
      return;
    }

    if (requestUrl.pathname === "/api/player/character-breakthrough") {
      const player = playerFromSession(database, body.token);
      const game = createGame(player.record.state);
      const result = game.breakthroughCharacter({ cardId: body.cardId });
      player.record.state = game.getState();
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, Object.assign({ ok: true, player: publicPlayer(player.record) }, result));
      return;
    }

    if (requestUrl.pathname === "/api/player/character-constellation") {
      const player = playerFromSession(database, body.token);
      const game = createGame(player.record.state);
      const result = game.enhanceConstellation({ cardId: body.cardId });
      player.record.state = game.getState();
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, Object.assign({ ok: true, player: publicPlayer(player.record) }, result));
      return;
    }

    if (requestUrl.pathname === "/api/admin/lookup") {
      assertAdmin(body);
      const player = getPlayer(database, body.name);
      await writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state });
      return;
    }

    if (requestUrl.pathname === "/api/admin/update") {
      assertAdmin(body);
      const player = getPlayer(database, body.name);
      player.record.state = updateAdminState(player.record.state, body);
      player.record.updatedAt = new Date().toISOString();
      await writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state });
      return;
    }

    sendJson(response, 404, { ok: false, error: "找不到 API" });
  } catch (error) {
    sendJson(response, 400, { ok: false, error: error.message || "操作失敗" });
  }
}

const server = http.createServer((request, response) => {
  const requestUrl = new URL(request.url || "/", "http://localhost");
  if (requestUrl.pathname.startsWith("/api/")) {
    handleApi(request, response, requestUrl).catch((error) => sendJson(response, 500, { ok: false, error: error.message || "伺服器錯誤" }));
    return;
  }
  const relativePath = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
  const filePath = path.resolve(root, "." + relativePath);

  if (filePath === retiredLabeledPortraitRoot || filePath.startsWith(retiredLabeledPortraitRoot + path.sep)) {
    response.writeHead(410, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
    response.end("Retired portrait source");
    return;
  }

  if (relativePath.startsWith("/data/") || (filePath !== root && !filePath.startsWith(root + path.sep))) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.stat(filePath, (error, fileStats) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }
    const extension = path.extname(filePath).toLowerCase();
    const cacheControl = [".html", ".css", ".js"].includes(extension) ? "no-cache, must-revalidate" : "public, max-age=31536000, immutable";
    const headers = {
      "Content-Type": mime[extension] || "application/octet-stream",
      "Cache-Control": cacheControl,
      "Content-Length": fileStats.size
    };
    const rangeHeader = extension === ".mp4" ? request.headers.range : null;
    const byteRange = parseByteRange(rangeHeader, fileStats.size);
    if (rangeHeader && !byteRange) {
      response.writeHead(416, {
        "Content-Type": headers["Content-Type"],
        "Cache-Control": headers["Cache-Control"],
        "Content-Length": 0,
        "Content-Range": `bytes */${fileStats.size}`
      });
      response.end();
      return;
    }
    headers["Accept-Ranges"] = "bytes";
    if (byteRange) {
      headers["Content-Range"] = `bytes ${byteRange.start}-${byteRange.end}/${fileStats.size}`;
      headers["Content-Length"] = byteRange.end - byteRange.start + 1;
    }
    response.writeHead(byteRange ? 206 : 200, headers);
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    const streamOptions = byteRange ? { start: byteRange.start, end: byteRange.end } : undefined;
    fs.createReadStream(filePath, streamOptions).on("error", () => {
      if (!response.headersSent) response.writeHead(500);
      response.destroy();
    }).pipe(response);
  });
});

server.listen(port, host, () => {
  console.log("星界之律抽卡系統：http://" + host + ":" + port + "/");
  if (!process.env.STARSHIP_ADMIN_KEY && process.env.NODE_ENV !== "production") {
    console.log("開發模式管理密鑰：dev-admin-key；公開部署前請設定 STARSHIP_ADMIN_KEY。");
  }
});
