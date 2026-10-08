import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
export function validateDatabase(database) {
  if (![1, 2].includes(database?.version) || !database.players || typeof database.players !== "object" || Array.isArray(database.players)) throw new Error("不是有效的完整玩家存檔");
  for (const [key, record] of Object.entries(database.players)) {
    if (!key || !record || typeof record.name !== "string" || !record.state || typeof record.state !== "object" || Array.isArray(record.state)) throw new Error("玩家存檔缺少帳號或遊戲狀態");
  }
  return database;
}

export function projectDatabase(database) {
  validateDatabase(database);
  const projected = JSON.parse(JSON.stringify(database));
  for (const record of Object.values(projected.players)) {
    if (record.state.trialProgress) delete record.state.trialProgress.lastBattle;
  }
  return projected;
}

export function seal(database, key, source, originalSavedAt) {
  validateDatabase(database);
  if (key.length !== 32) throw new Error("備份金鑰必須為 32 位元組");
  const savedAt = originalSavedAt || new Date().toISOString();
  const payload = Buffer.from(JSON.stringify({ savedAt, source, policy: "no-trial-battle-report-v1", database: projectDatabase(database) }));
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from("starship-player-backup-v1"));
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  return { format: "starship-player-backup-v1", iv: iv.toString("base64"), tag: cipher.getAuthTag().toString("base64"), encrypted: encrypted.toString("base64") };
}

export function unseal(envelope, key) {
  if (envelope?.format !== "starship-player-backup-v1") throw new Error("未知備份格式");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(envelope.iv, "base64"));
  decipher.setAAD(Buffer.from(envelope.format));
  decipher.setAuthTag(Buffer.from(envelope.tag, "base64"));
  const payload = JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.encrypted, "base64")), decipher.final()]).toString());
  validateDatabase(payload.database);
  return payload;
}

export function restoreFile(database, target) {
  validateDatabase(database);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  // Exclusive creation: recovery must never overwrite current progress.
  const fd = fs.openSync(target, "wx", 0o600);
  try { fs.writeFileSync(fd, JSON.stringify(database, null, 2)); } finally { fs.closeSync(fd); }
}

async function withPool(operation) {
  if (!process.env.DATABASE_URL) throw new Error("請在環境變數設定 DATABASE_URL，勿把連線密碼貼入文件");
  const { Pool } = require("pg");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15000, max: 1,
    ssl: process.env.PGSSLMODE === "disable" ? false : { rejectUnauthorized: true } });
  try { return await operation(pool); } finally { await pool.end(); }
}

export async function readPostgres(pool) {
  // A single SELECT sees all players from the same database snapshot.
  const { rows } = await pool.query("SELECT player_key, name, password_hash, created_at, updated_at, last_login_at, state FROM starship_players");
  const database = { version: 2, players: Object.create(null) };
  for (const row of rows) database.players[row.player_key] = {
    name: row.name, passwordHash: row.password_hash, createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(), lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : undefined,
    state: row.state
  };
  return validateDatabase(database);
}

export async function restorePostgres(pool, database) {
  validateDatabase(database);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`CREATE TABLE IF NOT EXISTS starship_players (
      player_key TEXT PRIMARY KEY, name TEXT NOT NULL, password_hash TEXT,
      created_at TIMESTAMPTZ NOT NULL, updated_at TIMESTAMPTZ NOT NULL,
      last_login_at TIMESTAMPTZ, state JSONB NOT NULL)`);
    await client.query("LOCK TABLE starship_players IN ACCESS EXCLUSIVE MODE");
    const { rows } = await client.query("SELECT COUNT(*)::int AS count FROM starship_players");
    if (rows[0].count !== 0) throw new Error("目標資料庫已有玩家；拒絕覆蓋，請先停服並改用全新空資料庫");
    for (const [key, record] of Object.entries(database.players)) {
      await client.query(`INSERT INTO starship_players
        (player_key,name,password_hash,created_at,updated_at,last_login_at,state)
        VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)`,
        [key, record.name, record.passwordHash || null, record.createdAt, record.updatedAt, record.lastLoginAt || null, JSON.stringify(record.state)]);
    }
    await client.query("COMMIT");
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function main(argv) {
  const [command, ...args] = argv;
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!args[index]?.startsWith("--") || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error("參數格式應為 --名稱 值");
    options[args[index].slice(2)] = args[index + 1];
  }
  if (!["export", "verify", "restore-file", "restore-postgres"].includes(command)) throw new Error("用法：export / verify / restore-file / restore-postgres；詳見 PLAYER_BACKUPS.md");
  const directory = path.resolve(options.directory || process.env.STARSHIP_BACKUP_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "starship-player-backups"));
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const withinProject = target => target === projectRoot || target.startsWith(projectRoot + path.sep);
  if (withinProject(directory)) throw new Error("私人備份資料夾必須放在遊戲專案之外，避免被網站下載");
  const keyPath = path.resolve(options.key || path.join(directory, "backup.key"));
  if (withinProject(keyPath)) throw new Error("金鑰必須放在遊戲專案之外");
  if (!fs.existsSync(keyPath)) {
    if (command !== "export") throw new Error("找不到原備份金鑰，不能解密；勿重新產生金鑰");
    fs.mkdirSync(path.dirname(keyPath), { recursive: true });
    fs.writeFileSync(keyPath, crypto.randomBytes(32), { flag: "wx", mode: 0o600 });
  }
  const key = fs.readFileSync(keyPath);
  if (command === "export") {
    if (!["file", "postgres", "remote"].includes(options.source)) throw new Error("請明確指定 --source file、postgres 或 remote，避免誤把本機當線上備份");
    let database;
    if (options.source === "file") {
      if (!options.input) throw new Error("檔案來源必須指定 --input");
      database = validateDatabase(JSON.parse(fs.readFileSync(options.input, "utf8")));
    } else if (options.source === "postgres") database = await withPool(readPostgres);
    else {
      const url = new URL(options.url);
      if (url.protocol !== "https:" || url.username || url.password) throw new Error("線上備份必須使用不含密碼的 HTTPS 網址");
      if (!process.env.STARSHIP_BACKUP_TOKEN) throw new Error("缺少 STARSHIP_BACKUP_TOKEN 環境變數");
      const response = await fetch(new URL("/api/admin/player-backup", url), { method: "POST", redirect: "error", signal: AbortSignal.timeout(60000),
        headers: { "content-type": "application/json", "authorization": "Bearer " + process.env.STARSHIP_BACKUP_TOKEN }, body: "{}" });
      if (!response.ok) throw new Error("線上備份拒絕或失敗（HTTP " + response.status + "）");
      database = validateDatabase((await response.json()).database);
    }
    database = projectDatabase(database);
    const envelope = seal(database, key, options.source);
    if (JSON.stringify(unseal(envelope, key).database) !== JSON.stringify(database)) throw new Error("備份驗證不一致");
    fs.mkdirSync(directory, { recursive: true });
    const target = path.join(directory, "players-" + new Date().toISOString().replace(/[:.]/g, "-") + "-" + crypto.randomBytes(3).toString("hex") + ".enc.json");
    fs.writeFileSync(target, JSON.stringify(envelope), { flag: "wx", mode: 0o600 });
    unseal(JSON.parse(fs.readFileSync(target, "utf8")), key);
    console.log(JSON.stringify({ ok: true, source: options.source, players: Object.keys(database.players).length, backup: target }));
    return;
  }
  if (!options.input) throw new Error("請指定 --input 加密備份檔");
  const payload = unseal(JSON.parse(fs.readFileSync(options.input, "utf8")), key);
  if (command === "restore-file") {
    if (!options.target) throw new Error("請指定 --target 全新還原檔案");
    if (withinProject(path.resolve(options.target))) throw new Error("還原演練檔案必須放在專案外");
    restoreFile(payload.database, path.resolve(options.target));
  }
  if (command === "restore-postgres") {
    if (options.confirm !== "EMPTY-DATABASE") throw new Error("請確認停服及目標為全新空資料庫，再指定 --confirm EMPTY-DATABASE");
    await withPool(pool => restorePostgres(pool, payload.database));
  }
  console.log(JSON.stringify({ ok: true, action: command, source: payload.source, savedAt: payload.savedAt, players: Object.keys(payload.database.players).length }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch(() => {
    // DB driver messages can include connection details; do not print them.
    console.error("備份操作失敗。請檢查參數、權限、金鑰、連線及目標是否為空；未宣告成功的備份不可當作已完成。");
    process.exitCode = 1;
  });
}
