# 星界之律：產品脈絡

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
玩家在桌面或手機瀏覽器登入，閱讀劇情、召集角色並遊玩養成與戰鬥內容。

## Product Purpose
將《星界之律》的故事與角色系統整理成可持續遊玩的網頁遊戲。玩家能在大廳確認進度，進入各玩法，並讓進度綁定帳號。

## Operating Context
主要路徑是登入、大廳、劇情、抽卡、角色培養、星界試煉、Boss、星港委託、星海迷航與星伴培育。公告和新手教學提供更新與入門資訊。內容以繁體中文呈現。

## Capabilities and Constraints
- 保留現有遊戲資料、玩家存檔、規則、獎勵與所有玩法入口。
- 前端是現有 HTML、CSS 與 JavaScript，後端是 Node.js。
- 目前開放的劇情與遊戲版本為 1.0–2.5；未開放版本維持鎖定。
- 本次改版涵蓋全部玩家頁面，允許重新設計視覺。

## Brand Commitments
保留「星界之律」名稱、角色與故事內容。此次改版以遊戲氛圍及視覺沉浸感為主要優先順序；文字、控制項和手機操作仍須清楚可用。

## Evidence on Hand
`README.md`、`index.html`、`src/data.js`、`src/player-app.js` 與 `assets/` 是既有內容、互動及美術來源。

## Product Principles
- 玩家應能從大廳迅速辨識目前進度與下一步。
- 每種玩法有自己的氛圍，但使用一致的導覽與操作規則。
- 故事與角色美術應主導畫面，介面不可遮蔽內容。
- 保留玩家對存檔、資源、獎勵與狀態的掌握。
