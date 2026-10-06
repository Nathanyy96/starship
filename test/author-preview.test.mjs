import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import net from "node:net";

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

test("1.1 author preview is gated and does not alter game resources", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "starship-author-preview-"));
  const port = await freePort();
  const child = spawn(process.execPath, ["serve.mjs"], { cwd: path.resolve(import.meta.dirname, ".."), env: { ...process.env, PORT: String(port), STARSHIP_DATA_DIR: directory, NODE_ENV: "production" }, stdio: "ignore" });
  const url = `http://127.0.0.1:${port}`;
  async function post(endpoint, body) {
    const response = await fetch(url + endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  try {
    let ready = false;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      try { ready = (await fetch(url + "/api/health")).ok; if (ready) break; } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    assert.equal(ready, true);
    const author = (await post("/api/player/register", { name: "Happycow", password: "author-preview-test" })).body;
    const other = (await post("/api/player/register", { name: "OtherPlayer", password: "author-preview-test" })).body;
    assert.equal((await post("/api/author-preview/1-1", { token: other.token })).status, 403);
    assert.equal((await post("/api/author-preview/2-x-battle", { token: other.token, action: "view" })).status, 403);
    assert.equal((await post("/api/author-preview/2-x-battle", { token: other.token, action: "battle", team: ["yaoze"], stageId: 1, level: 90, constellation: 6 })).status, 403);
    const isolatedBefore = (await post("/api/player/session", { token: author.token })).body.state;
    const roster = await post("/api/author-preview/2-x-battle", { token: author.token, action: "view" });
    assert.equal(roster.status, 200);
    assert.ok(roster.body.characters.some((card) => card.id === "yaoze"));
    assert.ok(roster.body.characters.some((card) => card.id === "orivelle"));
    const simulation = await post("/api/author-preview/2-x-battle", { token: author.token, action: "battle", team: ["yaoze", "maro", "celesia"], stageId: 25, level: 90, constellation: 2 });
    assert.equal(simulation.status, 200);
    assert.deepEqual(simulation.body.battle.team.map((unit) => unit.id), ["yaoze", "maro", "celesia"]);
    assert.deepEqual(simulation.body.battle.reward, { starSand: 0, characterExp: 0 });
    assert.equal((await post("/api/author-preview/2-x-battle", { token: author.token, action: "battle", team: ["jiera"], stageId: 1, level: 90, constellation: 0 })).status, 400);
    const isolatedAfter = (await post("/api/player/session", { token: author.token })).body.state;
    assert.deepEqual(isolatedAfter, isolatedBefore);
    let preview = (await post("/api/author-preview/1-1", { token: author.token })).body;
    assert.equal(preview.progress.step, 0);
    preview = (await post("/api/author-preview/1-1", { token: author.token, action: "answer", choice: 0 })).body;
    assert.equal(preview.progress.step, 0);
    assert.equal(preview.progress.mistakes, 1);
    preview = (await post("/api/author-preview/1-1", { token: author.token, action: "answer", choice: 1 })).body;
    assert.equal(preview.progress.step, 1);
    preview = (await post("/api/author-preview/1-1", { token: author.token, action: "answer", choice: 0 })).body;
    assert.equal(preview.progress.step, 1);
    preview = (await post("/api/author-preview/1-1", { token: author.token, action: "answer", choice: 2 })).body;
    assert.equal(preview.progress.step, 2);
    const session = (await post("/api/player/session", { token: author.token })).body;
    assert.deepEqual(session.state.resources, author.state.resources);
    assert.equal(session.state.storyProgress.authorPreview11.step, 2);
    const relogin = (await post("/api/player/login", { name: "Happycow", password: "author-preview-test" })).body;
    assert.equal(relogin.state.storyProgress.authorPreview11.step, 2);
    preview = (await post("/api/author-preview/1-1", { token: relogin.token })).body;
    assert.equal(preview.progress.step, 2);
    preview = (await post("/api/author-preview/1-1", { token: relogin.token, action: "reset" })).body;
    assert.equal(preview.progress.step, 0);
  } finally {
    child.kill();
    await rm(directory, { recursive: true, force: true });
  }
});
