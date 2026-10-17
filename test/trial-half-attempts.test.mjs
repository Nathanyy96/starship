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

test("trial 11 settles its upper and lower halves as one attempt", async () => {
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
    const teamUpper = ["celesia", "reyn", "lia", "isar"];
    const teamLower = ["chodan", "magenta", "hina", "siyeon"];
    for (const id of teamUpper.concat(teamLower)) state.collection[id] = 1;
    state.trialProgress.version = data.updateCycle;
    state.trialProgress.clearedStages = Array.from({ length: 10 }, (_, index) => index + 1);
    state.trialProgress.bestStage = 10;
    state.trialProgress.attempts = {};
    fs.writeFileSync(file, JSON.stringify(database));
    const result = await post("/api/player/trial-battle", { token: registration.token, stageId: 11, teamUpper, teamLower });
    assert.equal(result.battle.halfResults.length, 2);
    assert.equal(result.battle.challengeComplete, true);
    assert.equal(result.state.trialProgress.attempts[11], 1);
    assert.equal(result.reward.attemptsUsed, 1);
    assert.equal(result.reward.attemptsRemaining, 2);
    assert.equal(result.battle.won, result.battle.halfResults.every(half => half.won));
  } finally {
    server.kill();
    if (server.exitCode === null) await new Promise(resolve => server.once("exit", resolve));
    assert.ok(directory.startsWith(os.tmpdir()));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
