# 劇情角色圖來源

本目錄的八張圖取自 [《星界之律劇情》Google Doc](https://docs.google.com/document/d/1uQqP1G_oKEoX_XtGNj9Lk5uZgU1KLSf26oC_iCqOvp4) 的「角色圖鑑｜單人完整立繪」分頁（2026-09-22 讀取）。同時將該分頁 11 張標準尺寸角色圖與「角色圖鑑｜第二大版本」的八張圖更新至 `assets/cards`。瑟蕾雅、伊薩爾三星原稿與蕾娜原本的乾淨立繪和文件畫作相同，保留原圖以免文件上的卡面文字重疊到 UI。

圖片依文件內圖像物件的正文順序對應：`isar-ascended.png` 為伊薩爾四星升格卡面；其後依序是 `sevin.png`、`seifra.png`、`noyas.png`、`kailin.png`、`oun.png`、`mila.png`、`vark.png`。原有三星伊薩爾與遊戲角色 PNG 保留；劇情 NPC 不加入抽卡池。

文件圖片最下方 210px 是卡面資訊帶；匯入時只取上方 1024×1536 的畫作區域。部分原圖畫面內仍帶有美術字樣，保留原圖內容。劇情素材只作立繪／圖鑑預覽；可抽角色卡依 `src/data.js` 的 `characterAssets` 使用 PNG，名稱、星級、元素與「星律」標識由遊戲 UI 繪製。
