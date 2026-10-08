import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { seal, unseal, restoreFile, restorePostgres, validateDatabase } from "../tools/player-backup.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const database = { version: 2, players: { tester: { name: "備份測試玩家", passwordHash: "hash-for-login",
  createdAt: "2026-10-01T00:00:00.000Z", updatedAt: "2026-10-08T00:00:00.000Z",
  state: { resources: { starSand: 9823, starMarks: 4, characterExp: 7200 }, collection: { hina: 5 },
    characterProgress: { hina: { level: 80, constellation: 4 } }, storyProgress: { claimedVersions: { "1.0": true } },
    trialProgress: { bestStage: 27 }, futureUnknownField: { nested: [1, "kept"] } } } } };

test("加密快照完整保留登入、資源、命座與未知欄位；不洩漏明文", () => {
  const key = crypto.randomBytes(32);
  const envelope = seal(database, key, "file");
  assert.deepEqual(unseal(envelope, key).database, database);
  const legacy = { ...database, version: 1 };
  assert.deepEqual(unseal(seal(legacy, key, "file"), key).database, legacy);
  assert.equal(JSON.stringify(envelope).includes("備份測試玩家"), false);
  assert.equal(JSON.stringify(envelope).includes("hash-for-login"), false);
  assert.throws(() => unseal(envelope, crypto.randomBytes(32)));
  const damaged = structuredClone(envelope);
  const ciphertext = Buffer.from(damaged.encrypted, "base64");
  ciphertext[0] ^= 1;
  damaged.encrypted = ciphertext.toString("base64");
  assert.throws(() => unseal(damaged, key));
  assert.throws(() => validateDatabase({ version: 2, players: { broken: {} } }));
});

test("檔案還原保持完整存檔，並拒絕覆蓋現有玩家", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "starship-backup-"));
  try {
    const target = path.join(directory, "players.json");
    restoreFile(database, target);
    assert.deepEqual(JSON.parse(fs.readFileSync(target)), database);
    assert.throws(() => restoreFile({ version: 2, players: {} }, target), { code: "EEXIST" });
    assert.deepEqual(JSON.parse(fs.readFileSync(target)), database);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("PG 回復只寫空表，保留所有欄位，拒絕覆蓋時回滾並釋放連線", async () => {
  for (const count of [0, 1]) {
    const calls = [];
    const client = { query: async (sql, args) => { calls.push({ sql, args }); return { rows: [{ count }] }; }, release: () => calls.push({ sql: "RELEASE" }) };
    const pool = { connect: async () => client };
    if (count) await assert.rejects(restorePostgres(pool, database), /已有玩家/);
    else await restorePostgres(pool, database);
    assert.ok(calls.some(call => call.sql.includes("ACCESS EXCLUSIVE")));
    assert.equal(calls.at(-1).sql, "RELEASE");
    assert.equal(calls.at(-2).sql, count ? "ROLLBACK" : "COMMIT");
    const inserts = calls.filter(call => call.sql.startsWith("INSERT"));
    assert.equal(inserts.length, count ? 0 : 1);
    if (!count) {
      assert.deepEqual(JSON.parse(inserts[0].args[6]), database.players.tester.state);
      assert.equal(inserts[0].args[2], database.players.tester.passwordHash);
    }
  }
});

test("CLI 寫出可驗證的私人快照，還原演練成功；錯誤金鑰退出失敗", () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "starship-backup-cli-"));
  const run = args => spawnSync(process.execPath, ["tools/player-backup.mjs", ...args], { cwd: root, encoding: "utf8" });
  try {
    const input = path.join(directory, "source.json");
    fs.writeFileSync(input, JSON.stringify(database));
    const exported = run(["export", "--source", "file", "--input", input, "--directory", directory]);
    assert.equal(exported.status, 0, exported.stderr);
    const result = JSON.parse(exported.stdout);
    assert.equal(result.source, "file");
    assert.equal(result.players, 1);
    assert.equal(run(["verify", "--input", result.backup, "--directory", directory]).status, 0);
    const target = path.join(directory, "restored.json");
    assert.equal(run(["restore-file", "--input", result.backup, "--target", target, "--directory", directory]).status, 0);
    assert.deepEqual(JSON.parse(fs.readFileSync(target)), database);
    const badKey = path.join(directory, "wrong.key");
    fs.writeFileSync(badKey, crypto.randomBytes(32));
    assert.equal(run(["verify", "--input", result.backup, "--key", badKey, "--directory", directory]).status, 1);
    assert.equal(run(["export", "--source", "file", "--input", input, "--directory", path.join(root, "private-backup")]).status, 1);
  } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});

test("線上備份入口要求獨立 token、未授權拒絕、唯讀且完整匯出", async () => {
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "starship-backup-api-"));
  fs.writeFileSync(path.join(directory, "players.json"), JSON.stringify(database));
  const source = fs.readFileSync(path.join(directory, "players.json"), "utf8");
  const server = spawn(process.execPath, ["serve.mjs"], { cwd: root, env: { ...process.env,
    DATABASE_URL: "", STARSHIP_DATA_DIR: directory, PORT: String(port), HOST: "127.0.0.1",
    NODE_ENV: "production", STARSHIP_BACKUP_TOKEN: "test-read-only-token", STARSHIP_ADMIN_KEY: "test-admin" }, stdio: "ignore" });
  try {
    let ready = false;
    for (let index = 0; index < 80; index++) {
      try { ready = (await fetch(`http://127.0.0.1:${port}/api/health`)).ok; } catch {}
      if (ready) break;
      await delay(100);
    }
    assert.ok(ready, "server must start");
    const request = token => fetch(`http://127.0.0.1:${port}/api/admin/player-backup`, {
      method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + token }, body: "{}" });
    assert.equal((await request("")).status, 403);
    assert.equal((await request("test-admin")).status, 403);
    const response = await request("test-read-only-token");
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual((await response.json()).database, database);
    assert.equal(fs.readFileSync(path.join(directory, "players.json"), "utf8"), source);
  } finally {
    const exited = new Promise(resolve => server.once("exit", resolve));
    server.kill();
    await exited;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
