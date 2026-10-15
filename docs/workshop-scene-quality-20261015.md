# 可玩場景樣板與實際試走紀錄

## 本輪實際操作

透過瀏覽器鍵盤連續移動：獸靈之村往火場、白鐘城工坊前院至門口進入近端、洛汀港市集往岸道。不是只看截圖或只測座標函式。紀錄位於 .tmp-ui-test/terrain-navigation/playtest-results.json。發現洛汀角色可貼到攤棚，證明先前「功能通過」不足以表示場景驗收通過；已補入攤棚／倉庫阻擋並調整繞行。

## 現況問題

既有總覽插畫直接放大會模糊；總覽中的建築、街道不是一致的角色尺度。恢復原圖只解決場景辨識，不能等同完成可玩場景。各區仍需逐段以原圖的地理、地標、道路走向重建角色尺度場景，不能用通用樹屋替代。

## 本輪可操作成果

workshop-scene-preview.html 是獨立的白鐘城工坊街區樣板，不替換正式全城。保留藍瓦工坊、木吊架、白石建築、花牆與沿河街特色，重新繪製1536×1024街區；不把全城縮圖放大。按完成圖描出斜向主街、小巷、前院和河岸階梯，主路約3至5名角色並排的視覺尺度；工坊門口可進入室內並返回前院。屋頂、吊架和水面阻擋共用實際行走資料。樣板只使用記憶體位置，不寫入正式帳號、正文或獎勵。

桌機1280與手機390檢查，實際鍵盤進門／室內／返回流程通過；四個起點都可走到門口，屋頂／吊架／水面不可走。仍須作者確認這個美術清晰度、鏡頭和路幅方向，再擴充正式地圖，不能宣稱所有地圖已達標。

## 參考與素材來源

參考寶可夢官方探索截圖的地形辨識與空間分界：https://www.nintendo.com/ph/switch/bdsp/index.html 。參考八方旅人II官方圖的材質、光影與前後景層次：https://www.nintendo.com/au/games/nintendo-switch/octopath-traveler-ii/ 。只是設計參考，不匯入對方美術資產。

本作原圖：assets/exploration/white-bell-streets-v1.png。新街區圖由內建imagegen以該圖為參考生成，未用對方遊戲圖片作生成素材；原檔 C:/Users/natha/.codex/generated_images/01a11f3a-2174-73c1-bb04-7a3a1a9a91af/exec-442ca2d8-c029-4978-9acd-83ed6853b434.png；專案副本 assets/exploration/workshop-street-playable-sample-v1.png。舊原圖保留。

上線確認：254c69f由Render顯示Live，部署2分03秒。獨立樣板https://starship-5cdv.onrender.com/workshop-scene-preview.html已在線上重新完成桌機／手機顯示及鍵盤門口進出驗證。此為供作者確認的可操作街區樣板，正式全圖品質仍待分區重建。
