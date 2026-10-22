# Neon 與 Backblaze B2 維運

## Render 環境變數

- `DATABASE_URL`：Neon production 的 PostgreSQL TLS 連線字串。
- `STARSHIP_BACKUP_TOKEN`：原有獨立備份 token，僅放入排程的 Authorization header。
- `STARSHIP_B2_KEY_ID`、`STARSHIP_B2_APPLICATION_KEY`：限私人備份 bucket 的讀寫 application key。
- `STARSHIP_B2_BUCKET_ID`：私人 B2 bucket ID。
- `STARSHIP_BACKUP_KEY_HEX`：原有私人 `backup.key` 的 32 bytes 十六進位編碼，共 64 字元。

金鑰不寫入本文件、Git 或排程網址。`backup.key` 另存作者私人位置；Render 遺失後仍須能解密。

## cron-job.org

1. 保活：每 14 分鐘 `GET https://starship-5cdv.onrender.com/api/ping`，不加憑證。
2. 備份：每小時 `POST https://starship-5cdv.onrender.com/api/admin/player-backup`。
   Headers：`Content-Type: application/json` 及 `Authorization: Bearer <STARSHIP_BACKUP_TOKEN>`。
   Body：`{"destination":"b2"}`。
3. 開啟失敗通知；成功須為 HTTP 200 且回應包含 `ok:true, verified:true`。

`/api/ping` 不查詢 PostgreSQL，Neon 閒置時仍可休眠；`/api/health` 才會檢查資料庫 schema。
cron-job.org 排程時區依帳號設定，每小時備份不受夏令時間影響。

## 備份與驗證

備份沿用 `starship-player-backup-v1` AES-256-GCM 格式與既有完整玩家投影政策，僅排除試煉詳細戰報。
只有 PostgreSQL 來源可透過 B2 排程備份，避免將 Render 暫存本機資料誤當線上資料。
檔案置於私人 bucket 的 `players/`，名稱只有時間與隨機碼，不含帳號資訊。
每次上傳後核對 B2 回傳雜湊與大小，再下載原檔、逐 byte 比較、解密及逐欄比對；失敗回 HTTP 502。
排程回應只含數量、時間、檔名與大小，不含玩家資料或金鑰。
不自動刪除歷史快照；需持續查看儲存用量與免費額度。

從 B2 下載 `.enc.json` 後，可使用原有 `tools/player-backup.mjs verify` 與 `restore-postgres`。
還原須停服並指向全新空庫，既有工具拒絕覆寫玩家資料。參見 `PLAYER_BACKUPS.md`。

API 依據：[B2 authorize](https://www.backblaze.com/apidocs/b2-authorize-account)、[upload](https://www.backblaze.com/apidocs/b2-upload-file)、[download](https://www.backblaze.com/apidocs/b2-download-file-by-id)。
