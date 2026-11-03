> 文件用途（2026-11-02整理）：有日期的工程證據／製作規範；結果限當時範圍。最新狀態見工作區 `CURRENT_PROJECT_STATUS.md`；不從下方舊「現行／未完成／已完成」文字推論今日狀態。

# 場景式角色大廳｜2026-11-01

作者退回2026-10-31的網站式卡片清單。這輪改為全屏場景、左側角色、右側環形挑戰、頂端帳號／資源、側邊輔助入口與底部常用功能列。保持上一輪「先入口，未完成內容保留」的範圍；沒有新增裝備或寵物戰鬥數值，沒有部署。

## 實看參考

- 一代實際橫向大廳：https://www.mustplay.in.th/content/page/5710944274dca67b16f76289 ，頁內UI圖 https://www.mustplay.in.th/static/attachment/2016/3/13/attach-1460541617709 。已下載目視：左側人物、右側環形戰鬥入口、頂端資源、底部功能。
- 二代實際直向大廳：https://www.malavida.com/en/soft/girls-x-battle-2/android/ ，圖 https://imag.malavida.com/mvimgbig/download-fs/girls-x-battle-2-32695-5.jpg 。已下載目視：大型人物、兩側入口、頂端資源、下方挑戰及底部功能。
- 參考圖僅存工作區docs-audit-20261025/hub-v2供研究，不放入遊戲資產，也沒有下載任何遊戲程式。
- MrGuider圖片被Cloudflare攔截，MobyGames無實機截圖，均不當作已實看來源。前輪QooApp廣告圖不代替本輪的實機介面核對。

## 角色與場景素材

- 瑟蕾雅來源：Google03M文件 `1OqnMurq_c4ZkMeHR57VNe6X8rtQRdxHApUcrHG4F8uE`、正式第一版分頁 `t.fovl70njf1oy`、原生圖片 `kix.xabeoqrwqk4a`。已由Google工具讀取並實際下載目視，並非以本地舊素材反推造型。
- 原圖研究副本：`docs-audit-20261025/hub-v2/celesia-03M.png`（工作區根目錄）。
- 使用內建imagegen做背景去除，產物原始保存於Codex generated_images，本輪已複製到遊戲 `assets/ui/celesia-lobby-cutout-v1.png`。此為大廳衍生素材，不回寫或替代03M。
- 已檢視產物：單角色、完整人物與單劍、白藍衣裝及銀髮，透明背景；頭髮細邊尚可能有去背細節差異，不宣稱與原圖逐像素一致。
- 場景沿用既有 `assets/ui/lobby-garden-morning.png`，只作大廳背景，不據此新增世界地理設定。背景本輪沒有重新生成。

### 內建imagegen完整提示詞

Use case: background-extraction. Create a transparent-background cutout from this exact approved anime character illustration for a game lobby. Remove ONLY the white background, floor reflection, and detached floating decorative star/constellation lines outside the character silhouette. Preserve this exact character, face, blue eyes, long silver hair, black hair bow, white/navy/blue dress, gold details, complete single sword, both hands and boots. Do not redesign, change pose or crop any part of hair, costume or sword. Keep original full body proportions and all opaque white clothing and silver hair opaque. Transparent RGBA PNG, full body with small transparent margin. No added elements, no shadow floor, no text.

## 實作與驗證

- src/game-hub.js：角色場景大廳標記與既有入口；籌備中的入口仍明示狀態。
- game-lobby-scene.css：場景、角色、環形按鈕、側列、底部導覽與響應式版面；尊重prefers-reduced-motion。
- src/player-app.js：教學的舊劇情提示改為最新故事書的開放狀態。其他玩法與存檔格式不變。
- index.html：加入場景樣式與快取版號。
- 390×844手機尺寸已實際查看完整截圖，角色名牌與輪盤分開，商店文字不再被底欄遮擋。十四種功能入口往返成功，無瀏覽器error/warn；桌面已恢復預設尺寸並檢視。
- 相關回歸38項全部通過，0略過、0失敗；記錄工作區根目錄 `docs-audit-20261025/hub-v2/regression.log`。
- 前輪完整233項結果保留其日期，不說成本輪重跑完整套件。
- 本輪未改玩家資源、角色數值、卡池規則或Google文件；未登入正式站、未推送、未發布。
