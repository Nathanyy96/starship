import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
process.env.NODE_ENV = "test";
process.env.STARSHIP_RELEASE_11_TEST = "true";
const require = createRequire(import.meta.url);
const data = require("../src/data.js");
const workflow = require("../src/story-release-progress.js");
const missions = require("../src/story-1-1-missions.js");
const { GachaGame } = require("../src/gacha.js");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const chapter10 = data.storyChapters.find(c => c.id === "main-1-0");
const chapter11 = data.storyChapters.find(c => c.id === "main-1-1");
function fresh() { return new GachaGame({ banners: data.banners }).getState(); }

test("1.1 候選卡池、章節、公告一致；2.x 不進正式卡池", () => {
  assert.equal(data.updateVersion, "1.1");
  assert.equal(chapter11.scenes.length, 5);
  assert.equal(data.announcements[0].id, "release-1-1");
  for (const id of ["hina", "siyeon", "cenwu", "ruida", "yuan"]) assert.ok(data.activeCards.some(c => c.id === id), id);
  assert.ok(data.activeCards.every(c => Number(c.releaseVersion) <= 1.1));
  assert.deepEqual(data.banners[0].featured4Stars.map(c => c.id), ["hina", "siyeon"]);
});

test("正式環境不能用測試旗標提前開放 1.1", () => {
  const result = spawnSync(process.execPath, ["-e", "const d=require('./src/data.js');console.log(d.updateVersion);"], {
    cwd: root, env: { ...process.env, NODE_ENV: "production", STARSHIP_RELEASE_11_TEST: "true" }, encoding: "utf8" });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "1.0");
});

test("本機正式五幕逐步解鎖、錯選重試、保留作者試玩與獨立一次性領獎", () => {
  let state = fresh();
  state.storyProgress.authorPreview11 = { act: 5, step: 0, facts: ["author only"] };
  assert.throws(() => workflow.apply(state, chapter11, { action: "complete", sceneId: chapter11.scenes[0].id }), /1.0/);
  for (const scene of chapter10.scenes) state = workflow.apply(state, chapter10, { action: "complete", sceneId: scene.id }).state;
  const before = structuredClone(state);
  assert.throws(() => workflow.apply(state, chapter11, { action: "claim", sceneId: chapter11.scenes[4].id }));
  for (let act = 0; act < 5; act++) {
    const sceneId = chapter11.scenes[act].id;
    assert.throws(() => workflow.apply(state, chapter11, { action: "answer", sceneId, act, step: 0, choice: missions.acts[act].steps[0].answer }), /已讀/);
    state = workflow.apply(state, chapter11, { action: "complete", sceneId }).state;
    for (let step = 0; step < missions.acts[act].steps.length; step++) {
      const body = { action: "answer", sceneId, act, step, choice: missions.acts[act].steps[step].answer };
      const wrong = workflow.apply(state, chapter11, { ...body, choice: (body.choice + 1) % 3 });
      assert.equal(wrong.correct, false);
      assert.equal(workflow.progress(wrong.state).act, act);
      assert.equal(workflow.progress(wrong.state).step, step);
      state = workflow.apply(wrong.state, chapter11, body).state;
      const retry = workflow.apply(state, chapter11, body);
      assert.equal(retry.alreadyClaimed, true);
      assert.deepEqual(retry.state.resources, before.resources);
    }
  }
  const claimed = workflow.apply(state, chapter11, { action: "claim", sceneId: chapter11.scenes[4].id });
  assert.deepEqual(claimed.reward, { starSand: 1600, characterExp: 3600, starMarks: 1 });
  const retry = workflow.apply(claimed.state, chapter11, { action: "claim", sceneId: chapter11.scenes[4].id });
  assert.deepEqual(retry.state.resources, claimed.state.resources);
  assert.equal(retry.alreadyClaimed, true);
  assert.deepEqual(retry.state.storyProgress.authorPreview11, before.storyProgress.authorPreview11);
  assert.deepEqual(retry.state.collection, before.collection);
});

test("正式 API 舊帳號遷移、逐幕任務、併發重送、防重領與重登续做", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "starship-release11-"));
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const server = spawn(process.execPath, ["serve.mjs"], { cwd: root, env: { ...process.env, DATABASE_URL: "", PORT: String(port), HOST: "127.0.0.1", STARSHIP_DATA_DIR: directory }, stdio: "ignore" });
  const url = `http://127.0.0.1:${port}`;
  async function post(route, body, expected = 200) {
    const response = await fetch(url + route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    assert.equal(response.status, expected, payload.error);
    return payload;
  }
  try {
    let ready = false;
    for (let i = 0; i < 80; i++) { try { ready = (await fetch(url + "/api/health")).ok; } catch {} if (ready) break; await delay(100); }
    assert.ok(ready);
    const registration = await post("/api/player/register", { name: "ReleaseTester", password: "test-password" });
    const file = path.join(directory, "players.json"), database = JSON.parse(fs.readFileSync(file));
    const record = database.players.releasetester;
    record.state.resources = { starSand: 4321, characterExp: 9876, starMarks: 17 };
    record.state.updateRewards.claimedVersions[data.compensationCycle] = { starSand: 6000, characterExp: 6000, starMarks: 3 };
    record.state.trialProgress = { version: data.compensationCycle, clearedStages: [1, 10], bestStage: 10, attempts: { 1: 2 }, selectedTeam: ["celesia"], lastBattle: { won: true } };
    record.state.characterProgress.celesia = { level: 25, constellation: 2, affinity: 3, constellationCore: 0, breakthrough: false };
    record.state.pity.limited = { pullsSince4Star: 31, guaranteedFeatured: true };
    record.state.bannerExchanges["limited-1-0-to-2-0"] = true;
    record.state.cosmetics.skins["skin-mave-summer-beach-party"] = { source: "existing" };
    const seeded = structuredClone(record.state);
    fs.writeFileSync(file, JSON.stringify(database));
    const migrated = await post("/api/player/session", { token: registration.token });
    assert.deepEqual(migrated.state.resources, seeded.resources);
    assert.deepEqual(migrated.state.collection, seeded.collection);
    assert.deepEqual(migrated.state.characterProgress, seeded.characterProgress);
    assert.deepEqual(migrated.state.cosmetics, seeded.cosmetics);
    assert.deepEqual(migrated.state.pity, seeded.pity);
    assert.deepEqual(migrated.state.bannerExchanges, seeded.bannerExchanges);
    assert.equal(migrated.state.trialProgress.version, data.updateCycle);
    assert.deepEqual(migrated.state.trialProgress.clearedStages, []);
    let token = registration.token;
    for (const scene of chapter10.scenes) await post("/api/player/story-progress", { token, chapterId: chapter10.id, sceneId: scene.id, action: "complete" });
    const baseline = (await post("/api/player/session", { token })).state.resources;
    for (let act = 0; act < 5; act++) {
      const sceneId = chapter11.scenes[act].id;
      await post("/api/player/story-progress", { token, chapterId: chapter11.id, sceneId, action: "complete" });
      for (let step = 0; step < missions.acts[act].steps.length; step++) {
        const body = { token, chapterId: chapter11.id, sceneId, action: "answer", act, step, choice: missions.acts[act].steps[step].answer };
        const wrong = await post("/api/player/story-progress", { ...body, choice: (body.choice + 1) % 3 });
        assert.equal(wrong.correct, false);
        const results = await Promise.all([post("/api/player/story-progress", body), post("/api/player/story-progress", body)]);
        assert.equal(results.filter(r => r.alreadyClaimed).length, 1);
        assert.deepEqual(results[1].state.resources, baseline);
      }
      token = (await post("/api/player/login", { name: "ReleaseTester", password: "test-password" })).token;
      assert.equal((await post("/api/player/session", { token })).state.storyProgress.missions11.act, act + 1);
    }
    const claims = await Promise.all([0, 1, 2].map(() => post("/api/player/story-progress", { token, chapterId: chapter11.id, sceneId: chapter11.scenes[4].id, action: "claim" })));
    assert.equal(claims.filter(c => c.reward.starSand === 1600).length, 1);
    const final = (await post("/api/player/session", { token })).state;
    assert.deepEqual(final.resources, { starSand: baseline.starSand + 1600, characterExp: baseline.characterExp + 3600, starMarks: baseline.starMarks + 1 });
    assert.equal(final.storyProgress.missions11.facts.length, 12);
    assert.ok(final.storyProgress.claimedVersions["1.0"]);
    assert.ok(final.storyProgress.claimedVersions["1.1"]);
  } finally {
    const exited = new Promise(resolve => server.once("exit", resolve)); server.kill(); await exited;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test("維護模式阻止玩家寫入，健康檢查與授權備份仍可使用", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "starship-release-maintenance-"));
  const file = path.join(directory, "players.json");
  fs.writeFileSync(file, JSON.stringify({ version: 2, players: {} }));
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const server = spawn(process.execPath, ["serve.mjs"], { cwd: root, env: { ...process.env, DATABASE_URL: "", PORT: String(port), HOST: "127.0.0.1", STARSHIP_DATA_DIR: directory,
    STARSHIP_MAINTENANCE: "true", STARSHIP_BACKUP_TOKEN: "maintenance-test-token" }, stdio: "ignore" });
  try {
    const url = `http://127.0.0.1:${port}`;
    let health;
    for (let i = 0; i < 80; i++) { try { health = await (await fetch(url + "/api/health")).json(); } catch {} if (health) break; await delay(100); }
    assert.equal(health.maintenance, true);
    const blocked = await fetch(url + "/api/player/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "NoWrite", password: "test-password" }) });
    assert.equal(blocked.status, 503);
    const backup = await fetch(url + "/api/admin/player-backup", { method: "POST", headers: { "content-type": "application/json", authorization: "Bearer maintenance-test-token" }, body: "{}" });
    assert.equal(backup.status, 200);
    assert.deepEqual((await backup.json()).database.players, {});
    assert.deepEqual(JSON.parse(fs.readFileSync(file)).players, {});
  } finally {
    const exited = new Promise(resolve => server.once("exit", resolve)); server.kill(); await exited;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
