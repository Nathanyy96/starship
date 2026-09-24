import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { updateCycle, updateVersion, storySceneAliases } = (await import("../src/data.js")).default;

async function freePort() {
  const listener = net.createServer();
  await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  return port;
}

test("維護更新保留玩家資源、重置可領戰鬥獎勵且只發放一次補給", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "starship-maintenance-"));
  const port = await freePort();
  const server = spawn(process.execPath, ["serve.mjs"], {
    cwd: root,
    env: { ...process.env, DATABASE_URL: "", STARSHIP_DATA_DIR: directory, PORT: String(port), HOST: "127.0.0.1" },
    stdio: "ignore"
  });
  const endpoint = `http://127.0.0.1:${port}`;
  async function post(route, body) {
    const response = await fetch(endpoint + route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const result = await response.json();
    assert.equal(response.status, 200, JSON.stringify(result));
    return result;
  }
  try {
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt += 1) {
      if (server.exitCode !== null) break;
      try { await fetch(endpoint); ready = true; break; } catch { await delay(50); }
    }
    assert.equal(ready, true, "測試伺服器應啟動");
    const registration = await post("/api/player/register", { name: "舊玩家", password: "maintenance-test-password" });
    const databasePath = path.join(directory, "players.json");
    const database = JSON.parse(fs.readFileSync(databasePath, "utf8"));
    const original = database.players["舊玩家"].state;
    original.resources = { starSand: 4200, starMarks: 17, echoPowder: 23, characterExp: 9850 };
    original.breakthroughMaterials = { "universal-core": 9 };
    original.collection.lia = 2;
    original.characterProgress.lia = { level: 21, affinity: 4, constellation: 1, constellationCore: 1, breakthrough: false };
    original.storyProgress.completedScenes["main-1-0:signal"] = { starSand: 100 };
    original.storyProgress.completedScenes["main-1-1:pickup"] = { starSand: 100 };
    original.updateRewards.claimedVersions = { [updateVersion]: { starSand: 3200 } };
    original.trialProgress = { version: updateVersion, selectedTeam: ["lia"], clearedStages: [1, 10], attempts: { 1: 10 }, bestStage: 10, lastBattle: { won: true } };
    original.bossProgress = { version: updateVersion, selectedBossId: "boss-star-warden", selectedTeam: ["lia"], attempts: { "boss-star-warden": 10 }, lastBattle: { won: true } };
    original.dispatchProgress = { version: updateVersion, selectedTeam: ["lia"], claimed: { mission: true }, lastMission: "mission" };
    original.voyageProgress.version = updateVersion;
    original.voyageProgress.status = "active";
    original.voyageProgress.claimedRewards = { ending: true };
    original.petProgress.version = "2.1-companion-workshop";
    original.petProgress.resources.petFood = 14;
    original.petProgress.exploreCount = 8;
    original.petProgress.daily.challengeCount = 3;
    original.petProgress.pets["star-fox"].level = 4;
    original.petProgress.pets["star-fox"].bond = 11;
    fs.writeFileSync(databasePath, JSON.stringify(database), "utf8");

    const first = (await post("/api/player/session", { token: registration.token })).state;
    assert.equal(first.resources.starSand, 7400);
    assert.equal(first.resources.starMarks, 17);
    assert.equal(first.resources.echoPowder, 23);
    assert.equal(first.resources.characterExp, 9850);
    assert.equal(first.breakthroughMaterials["universal-core"], 9);
    assert.equal(first.collection.lia, 2);
    assert.equal(first.characterProgress.lia.level, 21);
    assert.ok(first.storyProgress.completedScenes["main-1-0:signal"]);
    assert.ok(first.storyProgress.completedScenes[storySceneAliases["main-1-1:pickup"]]);
    assert.ok(first.storyProgress.completedScenes["main-1-1:pickup"]);
    assert.ok(first.updateRewards.claimedVersions[updateVersion]);
    assert.ok(first.updateRewards.claimedVersions[updateCycle]);
    assert.deepEqual(first.trialProgress.clearedStages, []);
    assert.deepEqual(first.trialProgress.attempts, {});
    assert.equal(first.trialProgress.bestStage, 0);
    assert.deepEqual(first.bossProgress.attempts, {});
    assert.deepEqual(first.dispatchProgress.claimed, {});
    assert.deepEqual(first.voyageProgress.claimedRewards, {});
    assert.equal(first.voyageProgress.status, "idle");
    assert.equal(first.petProgress.exploreCount, 8);
    assert.equal(first.petProgress.daily.challengeCount, 3);
    assert.equal(first.petProgress.resources.petFood, 14);
    assert.equal(first.petProgress.pets["star-fox"].level, 4);
    assert.equal(first.petProgress.pets["star-fox"].bond, 11);
    const second = (await post("/api/player/login", { name: "舊玩家", password: "maintenance-test-password" })).state;
    assert.equal(second.resources.starSand, first.resources.starSand);
    assert.deepEqual(second.updateRewards.claimedVersions, first.updateRewards.claimedVersions);
  } finally {
    server.kill();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
