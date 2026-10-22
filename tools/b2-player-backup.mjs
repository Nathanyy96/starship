import crypto from "node:crypto";
import { seal, unseal, projectDatabase } from "./player-backup.mjs";

// Only encrypted snapshots leave the game server. No credentials or player data
// are included in errors, filenames, logs, or the scheduler's response.
function b2Url(value) {
  const url = new URL(value);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".backblazeb2.com") || url.username || url.password) throw new Error("Invalid B2 endpoint");
  return url;
}

export async function backupToB2(database, env = process.env, fetcher = fetch) {
  const { STARSHIP_B2_KEY_ID: keyId, STARSHIP_B2_APPLICATION_KEY: applicationKey,
    STARSHIP_B2_BUCKET_ID: bucketId, STARSHIP_BACKUP_KEY_HEX: keyHex } = env;
  if (!keyId || !applicationKey || !bucketId || !/^[a-fA-F0-9]{64}$/.test(keyHex || "")) throw new Error("B2 backup configuration incomplete");
  const key = Buffer.from(keyHex, "hex");
  const snapshot = projectDatabase(database);
  const envelope = seal(snapshot, key, "postgres-b2");
  const bytes = Buffer.from(JSON.stringify(envelope));
  const sha1 = crypto.createHash("sha1").update(bytes).digest("hex");
  const fileName = "players/players-" + new Date().toISOString().replace(/[:.]/g, "-") + "-" + crypto.randomBytes(6).toString("hex") + ".enc.json";
  const request = async (url, options = {}) => {
    const response = await fetcher(b2Url(url), { ...options, redirect: "error", signal: AbortSignal.timeout(25000) });
    if (!response.ok) throw new Error("B2 request failed (HTTP " + response.status + ")");
    return response;
  };
  const auth = await (await request("https://api.backblazeb2.com/b2api/v4/b2_authorize_account", {
    headers: { authorization: "Basic " + Buffer.from(keyId + ":" + applicationKey).toString("base64") }
  })).json();
  const storage = auth.apiInfo?.storageApi;
  if (!storage?.apiUrl || !storage?.downloadUrl || !auth.authorizationToken) throw new Error("Invalid B2 authorization response");
  if (storage.allowed?.buckets && !storage.allowed.buckets.some(bucket => bucket.id === bucketId)) throw new Error("B2 key cannot access backup bucket");
  const upload = await (await request(new URL("/b2api/v4/b2_get_upload_url?bucketId=" + encodeURIComponent(bucketId), b2Url(storage.apiUrl)), {
    headers: { authorization: auth.authorizationToken }
  })).json();
  const uploaded = await (await request(upload.uploadUrl, {
    method: "POST", headers: { authorization: upload.authorizationToken,
      "X-Bz-File-Name": encodeURIComponent(fileName), "Content-Type": "application/json",
      "Content-Length": String(bytes.length), "X-Bz-Content-Sha1": sha1 }, body: bytes
  })).json();
  if (!uploaded.fileId || uploaded.contentSha1 !== sha1 || uploaded.contentLength !== bytes.length || uploaded.bucketId !== bucketId) throw new Error("B2 upload verification failed");
  const downloaded = await request(new URL("/b2api/v4/b2_download_file_by_id?fileId=" + encodeURIComponent(uploaded.fileId), b2Url(storage.downloadUrl)), {
    headers: { authorization: auth.authorizationToken }
  });
  const restoredBytes = Buffer.from(await downloaded.arrayBuffer());
  if (!restoredBytes.equals(bytes)) throw new Error("B2 downloaded snapshot differs from upload");
  const restored = unseal(JSON.parse(restoredBytes.toString()), key);
  if (JSON.stringify(restored.database) !== JSON.stringify(snapshot)) throw new Error("B2 restore verification failed");
  return { ok: true, destination: "backblaze-b2", verified: true, savedAt: restored.savedAt,
    players: Object.keys(snapshot.players).length, fileName, bytes: bytes.length };
}

// Cron retries may overlap a slow upload; share the operation inside this server.
let pending;
export function scheduledB2Backup(readDatabase) {
  if (!pending) pending = Promise.resolve().then(readDatabase).then(database => backupToB2(database)).finally(() => { pending = null; });
  return pending;
}
