import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { backupToB2 } from "../tools/b2-player-backup.mjs";
import { unseal } from "../tools/player-backup.mjs";

const env = { STARSHIP_B2_KEY_ID: "key-id", STARSHIP_B2_APPLICATION_KEY: "secret", STARSHIP_B2_BUCKET_ID: "bucket", STARSHIP_BACKUP_KEY_HEX: "ab".repeat(32) };
const database = { version: 2, players: { player: { name: "private-name", passwordHash: "private-hash", state: { starSand: 100, unknownFutureField: { keep: true }, trialProgress: { cleared: 4, lastBattle: { large: true } } } } } };
function mockB2({ corrupt = false, uploadFailure = false, hostile = false } = {}) {
  let uploaded;
  const calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url: String(url), options });
    if (String(url).includes("b2_authorize_account")) return Response.json({ authorizationToken: "auth", apiInfo: { storageApi: { apiUrl: hostile ? "https://attacker.example" : "https://api001.backblazeb2.com", downloadUrl: "https://f001.backblazeb2.com", allowed: { buckets: [{ id: "bucket" }] } } } });
    if (String(url).includes("b2_get_upload_url")) return Response.json({ uploadUrl: "https://pod-001.backblaze.com/upload", authorizationToken: "upload-auth" });
    if (String(url).endsWith("/upload")) {
      if (uploadFailure) return new Response("secret diagnostics", { status: 503 });
      uploaded = Buffer.from(options.body);
      assert.ok(!uploaded.toString().includes("private-name"));
      assert.ok(!uploaded.toString().includes("private-hash"));
      const restored = unseal(JSON.parse(uploaded), Buffer.from(env.STARSHIP_BACKUP_KEY_HEX, "hex"));
      assert.equal(restored.database.players.player.state.trialProgress.lastBattle, undefined);
      assert.deepEqual(restored.database.players.player.state.unknownFutureField, { keep: true });
      return Response.json({ fileId: "file", bucketId: "bucket", contentLength: uploaded.length, contentSha1: crypto.createHash("sha1").update(uploaded).digest("hex") });
    }
    return new Response(corrupt ? Buffer.from("corrupt") : uploaded);
  };
  return { fetcher, calls };
}
test("B2 backup encrypts, uploads, downloads and verifies complete projected state", async () => {
  const mock = mockB2();
  const result = await backupToB2(database, env, mock.fetcher);
  assert.equal(result.verified, true);
  assert.equal(result.players, 1);
  assert.equal(mock.calls.length, 4);
  assert.ok(!JSON.stringify(result).includes("private-name"));
  assert.ok(!JSON.stringify(result).includes("secret"));
  assert.deepEqual(database.players.player.state.trialProgress.lastBattle, { large: true });
});
test("corrupted remote download is never reported as successful", async () => {
  await assert.rejects(backupToB2(database, env, mockB2({ corrupt: true }).fetcher), /differs/);
});
test("upload failure does not leak upstream response or credentials", async () => {
  await assert.rejects(backupToB2(database, env, mockB2({ uploadFailure: true }).fetcher), { message: "B2 request failed (HTTP 503)" });
});
test("reject unconfigured encryption and untrusted API destinations", async () => {
  await assert.rejects(backupToB2(database, { ...env, STARSHIP_BACKUP_KEY_HEX: "" }), /configuration/);
  const mock = mockB2({ hostile: true });
  await assert.rejects(backupToB2(database, env, mock.fetcher), /endpoint/);
  assert.equal(mock.calls.length, 1);
});
