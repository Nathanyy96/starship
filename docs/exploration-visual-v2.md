# 探索畫面第二版｜2026-10-14

> 歷史開發紀錄：2026-10-17 起，瑟蕾雅的大世界圖改用作者立繪衍生的透明正常比例圖；下文提及的舊 Q 版主角素材已移除。

本機預覽：`http://127.0.0.1:8091/exploration-visual-preview.html`。提供南驛祭壇、村外森林、獸靈之村三個可操作場景；不寫入正式玩家帳號。

## 畫面改善

- 第一幕的方塊地形改為兩張 1536 × 1024 手繪場景；道路、地點及碰撞沿景物重新描繪。
- 主角原始 Q 版素材保留，取消像素化設定。角色顯示高度由 70–82 世界像素增加至約 102–104；手機鏡頭拉近，並依裝置像素密度繪製。
- 村內、商路及白鐘城共用高解析度鏡頭。探索時收起大廳頁首，讓場景佔據主要畫面。
- 祭壇斷柱、谷口石路、森林泉水及溪橋可額外查看，不改變主線順序。
- 開場巨獸以獨立透明素材取代幾何色塊。

## 素材與提示詞紀錄

使用內建 Imagegen；沒有使用 CLI 或外部圖片 API。新素材皆保存在遊戲專案中。

1. `assets/exploration/south-post-altar-v2.png`：Premium hand-painted anime fantasy JRPG playable overworld, 3:2 landscape, near-orthographic elevated view. South Post Valley abandoned altar, ivory weathered stones, fallen columns, star carvings, moss, wildflowers, leafy cliff perimeter and dappled afternoon light. Broad connected walkable clearing; fork at 21%/35%, altar at 49%/48%, magical-event space at 63%/40%, second clearing at 71%/60%, entrance at 43%/69%. No people, creatures, portals, UI, labels, arrows or grid.
2. `assets/exploration/village-forest-v2.png`：Matching premium painted JRPG local forest at early evening. Emerald and teal canopies, amber light, ferns, mushrooms, rocks and clear creek. Connected wide trail from southwest through central clearing to northeast village lantern posts; healer rest clearing at 82%/52%, spring side glade at 30%/45%, creek confined to lower edge with a timber footbridge. No people, creatures, UI, text, grid or labels.
3. `assets/exploration/opening-beast-map-v2.png`：Reference `assets/enemies/opening-beast.webp`; one isolated full-body transparent overworld sprite of the same white-gray saber-toothed wolf beast, black crystal-spiked mane, muscular legs, broad paws and curved tusks. Elevated three-quarter view, facing left-front, complete feet, compact readable silhouette, crisp painted anime shading. No scenery, floor, ground shadow, labels or additional creatures. Alpha channel retained.

主角使用既有 `assets/exploration/hero-chibi-v1.png`，沒有重新生成角色身分或服裝。

## 驗證

探索、對話、道路、場景資料完整性及手機鏡頭測試通過。瀏覽器實測電腦與 390 × 844 手機版，確認地圖載入、角色比例、移動與進入劇情對話；未觀察到前端錯誤。

正式部署仍須等待 Render 免費服務恢復建置與部署。官方事故：https://status.render.com/incidents/8tsd93r1wbmz 。
