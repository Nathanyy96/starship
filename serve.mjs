import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { GachaGame } = require("./src/gacha.js");
const { banners, storyChapters, characterBattleStats, trialStages } = require("./src/data.js");
const { simulateBattle } = require("./src/battle.js");

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const configuredDataDirectory = process.env.STARSHIP_DATA_DIR || path.join(root, "data");
const dataDirectory = path.resolve(configuredDataDirectory);
const playerDatabasePath = path.join(dataDirectory, "players.json");
const port = Number(process.env.PORT || 8080);
const host = process.env.HOST || (process.env.PORT ? "0.0.0.0" : "127.0.0.1");
const sessionLifetimeMs = 30 * 24 * 60 * 60 * 1000;
const sessions = new Map();
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

fs.mkdirSync(dataDirectory, { recursive: true });

function emptyDatabase() {
  return { version: 2, players: {} };
}

function readDatabase() {
  try {
    const value = JSON.parse(fs.readFileSync(playerDatabasePath, "utf8"));
    return value && value.players ? Object.assign({ version: 2 }, value) : emptyDatabase();
  } catch (error) {
    return emptyDatabase();
  }
}

function writeDatabase(database) {
  const temporaryPath = playerDatabasePath + ".tmp";
  fs.writeFileSync(temporaryPath, JSON.stringify(database, null, 2), "utf8");
  fs.renameSync(temporaryPath, playerDatabasePath);
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
  const state = new GachaGame({ banners }).getState();
  state.collection.celesia = 1;
  state.recruitment.starterGranted = true;
  return new GachaGame({ banners, state }).getState();
}

function ensurePlayerMilestones(currentState) {
  const state = new GachaGame({ banners, state: currentState || freshPlayerState() }).getState();
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
  if (state.trialProgress.version !== "1.0-1.5") {
    state.trialProgress.version = "1.0-1.5";
    state.trialProgress.attempts = {};
  }
  return new GachaGame({ banners, state }).getState();
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

function integerOrCurrent(value, current) {
  if (value === undefined) return current;
  if (!Number.isInteger(value) || value < 0) throw new Error("資源與保底數值必須是非負整數");
  return value;
}

function updateAdminState(currentState, body) {
  const state = JSON.parse(JSON.stringify(currentState));
  if (body.resources) {
    ["starSand", "tickets", "starMarks", "echoPowder"].forEach((key) => {
      state.resources[key] = integerOrCurrent(body.resources[key], state.resources[key]);
    });
  }
  if (body.resourceDelta) {
    ["starSand", "tickets", "starMarks", "echoPowder"].forEach((key) => {
      const delta = body.resourceDelta[key] === undefined ? 0 : body.resourceDelta[key];
      if (!Number.isInteger(delta)) throw new Error("資源增減必須是整數");
      state.resources[key] += delta;
      if (state.resources[key] < 0) throw new Error("資源不能低於 0：" + key);
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
  return new GachaGame({ banners, state }).getState();
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
  if (body.action === "select") {
    state.storyProgress.currentChapter = chapter.id;
    return { state: new GachaGame({ banners, state }).getState(), alreadyClaimed: false, reward: { starSand: 0 }, chapter, scene: null };
  }
  const scene = storySceneById(chapter, body.sceneId);
  const key = chapter.id + ":" + scene.id;
  state.storyProgress = state.storyProgress || { currentChapter: chapter.id, completedScenes: {} };
  state.storyProgress.completedScenes = state.storyProgress.completedScenes || {};
  state.storyProgress.currentChapter = chapter.id;
  if (state.storyProgress.completedScenes[key]) {
    return { state, alreadyClaimed: true, reward: { starSand: 0 }, chapter, scene };
  }
  state.storyProgress.completedScenes[key] = { completedAt: new Date().toISOString(), starSand: 100 };
  state.resources.starSand += 100;
  if (chapter.id === "main-1-0" && !state.recruitment.story10ChoiceClaimed) {
    state.recruitment.story10ChoiceAvailable = true;
  }
  return { state: new GachaGame({ banners, state }).getState(), alreadyClaimed: false, reward: { starSand: 100 }, chapter, scene };
}

function trialStageById(stageId) {
  const numericId = Number(stageId);
  const stage = trialStages.find((item) => item.id === numericId);
  if (!stage) throw new Error("找不到星界試煉關卡");
  return stage;
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
  const battle = simulateBattle({ team, stats: characterBattleStats, stage, rng: Math.random });
  state.trialProgress.selectedTeam = team;
  state.trialProgress.lastBattle = battle;
  if (battle.won) {
    state.trialProgress.attempts[stage.id] = attempts + 1;
    if (state.trialProgress.clearedStages.indexOf(stage.id) < 0) {
      state.trialProgress.clearedStages.push(stage.id);
    }
    state.resources.starSand += 100;
    state.resources.tickets += 1;
    state.trialProgress.bestStage = Math.max(state.trialProgress.bestStage, stage.id);
    if (stage.id === 10 && !state.recruitment.trial10ChoiceClaimed) state.recruitment.trial10ChoiceAvailable = true;
  }
  return { state: new GachaGame({ banners, state }).getState(), battle, reward: battle.won ? { starSand: 100, tickets: 1, attemptsUsed: state.trialProgress.attempts[stage.id], attemptsRemaining: 10 - state.trialProgress.attempts[stage.id] } : { starSand: 0, tickets: 0, attemptsUsed: attempts, attemptsRemaining: 10 - attempts } };
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
  const game = new GachaGame({ banners, state });
  const result = game.grantCharacter(cardId);
  const nextState = result.state;
  nextState.recruitment[availableKey] = false;
  nextState.recruitment[claimedKey] = true;
  return { state: new GachaGame({ banners, state: nextState }).getState(), card: result.card, rewardKey };
}

async function handleApi(request, response, requestUrl) {
  if (requestUrl.pathname === "/api/health" && request.method === "GET") {
    sendJson(response, 200, { ok: true, service: "starship-gacha", persistence: "server" });
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
  const database = readDatabase();
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
      writeDatabase(database);
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
      writeDatabase(database);
      existing.record.state = ensurePlayerMilestones(existing.record.state);
      writeDatabase(database);
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
      writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state, alreadyClaimed: completed.alreadyClaimed, reward: completed.reward, chapter: { id: completed.chapter.id, title: completed.chapter.title }, scene: completed.scene ? { id: completed.scene.id, title: completed.scene.title } : null });
      return;
    }

    if (requestUrl.pathname === "/api/player/claim-character") {
      const player = playerFromSession(database, body.token);
      const result = claimCharacterChoice(player.record.state, body);
      player.record.state = result.state;
      player.record.updatedAt = new Date().toISOString();
      writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state, card: result.card, rewardKey: result.rewardKey });
      return;
    }

    if (requestUrl.pathname === "/api/player/trial-battle") {
      const player = playerFromSession(database, body.token);
      const result = runTrial(player.record.state, body);
      player.record.state = result.state;
      player.record.updatedAt = new Date().toISOString();
      writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state, battle: result.battle, reward: result.reward });
      return;
    }

    if (requestUrl.pathname === "/api/player/open") {
      throw new Error("請先使用「第一次登入」建立帳號，或使用「我登入過」登入");
    }

    if (requestUrl.pathname === "/api/player/pull" || requestUrl.pathname === "/api/player/select-featured" || requestUrl.pathname === "/api/player/exchange-featured") {
      const player = playerFromSession(database, body.token);
      const game = new GachaGame({ banners, state: player.record.state });
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
      writeDatabase(database);
      sendJson(response, 200, Object.assign({ ok: true, player: publicPlayer(player.record), state: player.record.state }, result || {}));
      return;
    }

    if (requestUrl.pathname === "/api/player/character-development") {
      const player = playerFromSession(database, body.token);
      const game = new GachaGame({ banners, state: player.record.state });
      const result = game.developCharacter({ cardId: body.cardId });
      player.record.state = game.getState();
      player.record.updatedAt = new Date().toISOString();
      writeDatabase(database);
      sendJson(response, 200, Object.assign({ ok: true, player: publicPlayer(player.record) }, result));
      return;
    }

    if (requestUrl.pathname === "/api/admin/lookup") {
      assertAdmin(body);
      const player = getPlayer(database, body.name);
      writeDatabase(database);
      sendJson(response, 200, { ok: true, player: publicPlayer(player.record), state: player.record.state });
      return;
    }

    if (requestUrl.pathname === "/api/admin/update") {
      assertAdmin(body);
      const player = getPlayer(database, body.name);
      player.record.state = updateAdminState(player.record.state, body);
      player.record.updatedAt = new Date().toISOString();
      writeDatabase(database);
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

  if (relativePath.startsWith("/data/") || (filePath !== root && !filePath.startsWith(root + path.sep))) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(error.code === "ENOENT" ? 404 : 500, { "Content-Type": "text/plain; charset=utf-8" });
      response.end(error.code === "ENOENT" ? "Not found" : "Server error");
      return;
    }
    response.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
    response.end(content);
  });
});

server.listen(port, host, () => {
  console.log("星界之律抽卡系統：http://" + host + ":" + port + "/");
  if (!process.env.STARSHIP_ADMIN_KEY && process.env.NODE_ENV !== "production") {
    console.log("開發模式管理密鑰：dev-admin-key；公開部署前請設定 STARSHIP_ADMIN_KEY。");
  }
});
