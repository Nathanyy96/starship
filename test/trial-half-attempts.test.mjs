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
const data = (await import("../src/data.js")).default;

test("trial charges only victories, refunds provable legacy defeat charges, and preserves successful counters", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "starship-trial-halves-"));
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const server = spawn(process.execPath, ["serve.mjs"], { cwd: root, env: { ...process.env, DATABASE_URL: "", STARSHIP_DATA_DIR: directory, PORT: String(port), HOST: "127.0.0.1" }, stdio: "ignore" });
  const base = `http://127.0.0.1:${port}`;
  async function post(route, body) {
    const response = await fetch(base + route, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const payload = await response.json();
    assert.equal(response.status, 200, JSON.stringify(payload));
    return payload;
  }
  try {
    let ready = false;
    for (let index = 0; index < 80; index++) { try { ready = (await fetch(base + "/api/health")).ok; } catch {} if (ready) break; await delay(100); }
    assert.ok(ready);
    const registration = await post("/api/player/register", { name: "HalfTester", password: "test-password" });
    const file = path.join(directory, "players.json");
    const database = JSON.parse(fs.readFileSync(file, "utf8"));
    const state = database.players.halftester.state;
    const teamUpper = ["magenta", "siyeon", "chodan", "hina"];
    const teamLower = ["mave", "harlow", "elorna", "celesia"];
    for (const id of teamUpper.concat(teamLower)) state.collection[id] = 1;
    state.trialProgress.version = data.trialVersion;
    state.trialProgress.clearedStages = Array.from({ length: 10 }, (_, index) => index + 1);
    state.trialProgress.bestStage = 10;
    state.trialProgress.attempts = { 1: 2, 11: 3 };
    fs.writeFileSync(file, JSON.stringify(database));
    let result = await post("/api/player/trial-battle", { token: registration.token, stageId: 11, teamUpper: ["celesia"], teamLower: ["harlow"] });
    assert.equal(result.battle.halfResults.length, 2);
    assert.equal(result.battle.challengeComplete, true);
    assert.equal(result.battle.won, false);
    assert.equal(result.reward.attemptsUsed, 0);
    assert.equal(result.reward.attemptsRemaining, 3);
    assert.equal(result.reward.starSand, 0);
    assert.equal(result.state.trialProgress.attempts[1], 2);
    const failedSingle = await post("/api/player/trial-battle", { token: registration.token, stageId: 10, team: ["celesia"] });
    assert.equal(failedSingle.battle.won, false);
    assert.equal(failedSingle.reward.attemptsUsed, 0);
    assert.equal(failedSingle.reward.attemptsRemaining, 3);
    const improved = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const id of teamUpper.concat(teamLower)) improved.players.halftester.state.characterProgress[id] = { level: 90, constellation: 3 };
    fs.writeFileSync(file, JSON.stringify(improved));
    result = await post("/api/player/trial-battle", { token: registration.token, stageId: 11, teamUpper, teamLower: ["celesia"] });
    assert.deepEqual(result.battle.halfResults.map(half => half.won), [true, false]);
    assert.equal(result.reward.attemptsUsed, 0);
    result = await post("/api/player/trial-battle", { token: registration.token, stageId: 11, teamUpper, teamLower });
    assert.equal(result.battle.won, true);
    assert.equal(result.state.trialProgress.attempts[11], 1);
    assert.equal(result.reward.attemptsUsed, 1);
    assert.equal(result.reward.attemptsRemaining, 2);
    assert.equal(result.battle.won, result.battle.halfResults.every(half => half.won));
    assert.equal(result.state.trialProgress.attempts[1], 2);
    result = await post("/api/player/trial-battle", { token: registration.token, stageId: 11, teamUpper: ["harlow"], teamLower: ["celesia"] });
    assert.equal(result.battle.won, false);
    assert.equal(result.reward.attemptsUsed, 1);
  } finally {
    server.kill();
    if (server.exitCode === null) await new Promise(resolve => server.once("exit", resolve));
    assert.ok(directory.startsWith(os.tmpdir()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
