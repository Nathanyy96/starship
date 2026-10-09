# 玩家資料備份與還原

## 保存位置與限制

私人備份資料夾：`C:\starship-player-backups`，位於網站專案之外。完整存檔使用 AES-256-GCM 加密，金鑰為資料夾中的 `backup.key`。不要公開上傳備份或金鑰；另外將金鑰保存於私人安全位置，遺失金鑰就無法還原。Windows 請限制此資料夾為作者帳號可存取。

備份包含全部帳號的密碼雜湊（不含明文密碼）、角色／命座／培養、各種資源、隊伍站位、劇情、試煉、Boss、派遣、航行、商店、寵物、裝扮、獎勵已領狀態與帳號時間。依作者要求，移除 `trialProgress.lastBattle` 試煉詳細戰報；通關關卡、最高關卡、領獎次數和隊伍全部保留。其他未知 state 欄位保留，避免後續版本進度漏掉。還原後玩家重新登入，試煉上一場戰報不顯示，不保留記憶體中的登入 session。

Render 免費 PostgreSQL 建立 30 天後到期，14 天寬限期後刪除；免費 Web Service 的本機檔案也無法作持久備份。必須在到期之前匯出，備份不會延長資料庫期限。來源：[Render 免費方案](https://render.com/docs/free)、[資料庫備份限制](https://render.com/docs/postgresql-backups)。

**本機存檔備份不等於線上所有玩家備份。工具完成也不代表自動排程已啟用。**

## 手動備份

於 `C:\starship\gacha-system` 執行：

```powershell
# 只備份本機 players.json，不能用來宣稱備份線上玩家。
node tools/player-backup.mjs export --source file --input data/players.json --directory C:\starship-player-backups

# 直接備份線上 PostgreSQL：先用安全方式設定 DATABASE_URL 環境變數。
# 遠端電腦必須使用 Render External Database URL；不要把密碼寫入本文件。
node tools/player-backup.mjs export --source postgres --directory C:\starship-player-backups

# 或使用網站唯讀備份入口。Render 與本機需設定相同且足夠隨機的
# STARSHIP_BACKUP_TOKEN 環境變數。此入口不使用玩家登入或預設管理密鑰。
# 須先部署新版備份入口，僅使用 HTTPS。
node tools/player-backup.mjs export --source remote --url https://starship-5cdv.onrender.com/ --directory C:\starship-player-backups
```

每次產生獨立加密快照，不自動刪除舊快照。成功輸出包含來源、玩家總數及檔案位置，不顯示玩家名稱、密碼、連線字串或個別資源。失敗退出碼為 1，不能當成成功備份。

## 驗證及還原演練

```powershell
node tools/player-backup.mjs verify --input C:\starship-player-backups\players-時間.enc.json --directory C:\starship-player-backups
node tools/player-backup.mjs restore-file --input C:\starship-player-backups\players-時間.enc.json --target C:\starship-player-backups\restore-drill\players.json --directory C:\starship-player-backups
```

驗證會解密並檢查完整性；金鑰錯誤或內容被修改即失敗。檔案還原只允許建立全新檔案，已有檔案一律拒絕覆蓋。演練檔是私人完整明文存檔，請限權存取，驗證後可由作者刪除。

## 線上資料庫到期後回復

1. 暫停玩家寫入，保留最後成功備份和金鑰；確認快照日期及玩家總數。
2. 建立新 PostgreSQL，將本機 `DATABASE_URL` 設為新資料庫外部連線，先不要讓遊戲連入。
3. 執行下面還原指令。工具會交易鎖表，拒絕有任何玩家的資料庫；有錯即回滾。不使用 upsert 覆蓋現有進度。
4. 將 Render 遊戲服務 `DATABASE_URL` 改為新資料庫內部連線，重啟服務。檢查 `/api/health` 為 postgres，抽驗帳號登入、資源、角色及已領紀錄。
5. 恢復遊玩並立即對新資料庫再次備份。快照之後未備份的遊玩進度無法還原。

```powershell
node tools/player-backup.mjs restore-postgres --input C:\starship-player-backups\players-時間.enc.json --directory C:\starship-player-backups --confirm EMPTY-DATABASE
```

## 自動備份待接設定

### 2026-10-08 最終驗證狀態

已取得 Render 線上全部 4 個帳號的加密快照，來源為授權唯讀 remote API；最新保存時間 2026-10-09T00:13:04.753Z（UTC），並完成檔案還原演練。備份保存於私人專案外資料夾 C:\starship-player-backups，包含資源、角色、命座及進度，排除試煉詳細戰報。6 項備份測試通過。自動排程尚未啟用，真實 PostgreSQL 空庫還原仍未執行。下段為當日較早的初次驗證歷史。

### 初次驗證歷史

已對本機舊版 version 1 存檔的 15 個帳號產生加密快照；解密及檔案還原後，與來源完整逐欄一致。5 項備份測試通過，既有 116 項測試通過。PostgreSQL 還原的空表拒絕／交易回滾已用測試連線驗證，但尚未在真實 PostgreSQL 上完成還原演練。尚無 Render 線上管理連線或備份 token，因此沒有取得線上全部玩家快照，也未啟用自動排程。

備份測試指令：`node --test test/player-backup.test.mjs`。

建議至少每小時一次，版本更新與資料庫換置前額外備份。作者須選定 Render 以外的私人保存位置及管理連線／唯讀 token，才能建立真正的線上自動備份。若使用本機排程，電腦關機、休眠、斷網期間無法備份；雲端排程則需私人儲存與排程服務。排程應記錄成功時間、來源及玩家總數，失败需通知作者；不應把玩家完整資料或備份金鑰提交 GitHub／Google Docs。
