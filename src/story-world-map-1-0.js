(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StarshipStoryWorldMap = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return {
    title: "第一季旅程地圖",
    subtitle: "1.0 已開放；1.1–1.3 路線依現行劇情建檔，地點間距僅示意",
    viewBox: "0 0 1200 760",
    regions: [{ id: "origin-forest", name: "第一季旅程", terrain: "獸靈森地・白鐘流域・霧橋", color: "#70e9df" }],
    locations: [
      { id: "south-valley", name: "南驛山谷", regionId: "origin-forest", x: 900, y: 560, terrain: "舊祭壇與山谷", versionRange: "1.0", description: "界痕先出現，負傷的黑晶巨獸隨後落入祭壇；瑟蕾雅被位移帶走。" },
      { id: "beast-village", name: "獸靈之村", regionId: "origin-forest", x: 900, y: 420, terrain: "森林村落", versionRange: "1.0", description: "雷恩、莉亞與伊薩爾協助瑟蕾雅療傷、守村；離村時雷恩自願同行。" },
      { id: "whitebell-city", name: "白鐘城", regionId: "origin-forest", x: 520, y: 400, terrain: "東門、城西分會與工坊", versionRange: "1.0", description: "兩日徒步抵達東門；在城西工坊危機中與 Chodan、Magenta 合作救援。" },
      { id: "north-road", name: "北方商路", regionId: "origin-forest", x: 520, y: 310, terrain: "白鐘北門外的商路", versionRange: "1.0", description: "四人從北門出發；抵達霧橋仍須向北步行三日。" },
      { id: "mistbridge", name: "霧橋鎮", regionId: "origin-forest", x: 520, y: 218, terrain: "北方驛鎮", versionRange: "1.1", description: "白鐘北門向北三日抵達。1.1 救援善後與短演後，1.2 才讀完整驛報、接下北側斷橋的測查委託。" },
      { id: "mountain-post", name: "山腰驛站", regionId: "origin-forest", x: 658, y: 175, terrain: "霧橋外山路", versionRange: "1.1", description: "霧橋往迴音谷約一日路程中的驛站；先在此遇見 Hina。" },
      { id: "echo-valley", name: "迴音谷", regionId: "origin-forest", x: 795, y: 150, terrain: "谷口近岸與舊渡站", versionRange: "1.1", description: "在近岸遇見 Siyeon，四人重聚；救援與錯接路段仍需現場核對，不能當作固定捷徑。" },
      { id: "north-bridge", name: "北側斷橋", regionId: "origin-forest", x: 340, y: 148, terrain: "橋面・橋腹・外側慢線", versionRange: "1.2", description: "1.2 測查橋面與橋下鳴棘蛛領域。半幅橋僅限重、限班次試行；居民取水步道和苔角行獸獸徑保留，未測區不得視為安全通路。橋兩岸與聚落的局部幾何仍待實測。", localSites: ["主橋：半幅試行，限重與分班次，雨後重驗", "橋腹：鳴棘蛛巢區外緣禁施工，撤離線由赫洛管理", "外側慢線：居民取水、小橋、送藥與獸徑並行，重車未批准", "未測灰線：不可當作繞行方案或永久封閉的依據"] },
      { id: "lotin-harbor", name: "洛汀港", regionId: "origin-forest", x: 460, y: 605, terrain: "白鐘下游港口", versionRange: "1.3", description: "1.2 下游量測偏差引向此處。自霧橋先向南三日回白鐘，再順流兩日抵港；港口相對白鐘的精確羅盤角尚未定。" }
    ],
    routes: [
      { from: "south-valley", to: "beast-village", label: "界痕位移・非日常道路", direction: "位移", kind: "rift" },
      { from: "beast-village", to: "whitebell-city", label: "西行商路・兩日徒步", direction: "西" },
      { from: "whitebell-city", to: "north-road", label: "出城北行", direction: "北" },
      { from: "north-road", to: "mistbridge", label: "白鐘至霧橋・合計三日步行", direction: "北" },
      { from: "mistbridge", to: "mountain-post", label: "霧橋至迴音谷・合計約一日", direction: "山路" },
      { from: "mountain-post", to: "echo-valley", label: "山腰驛站至迴音谷", direction: "山路" },
      { from: "mistbridge", to: "north-bridge", label: "鎮北斷橋踏查", direction: "北" },
      { from: "whitebell-city", to: "lotin-harbor", label: "順流兩日；逆流返程三至四日", direction: "下游，羅盤角待定" }
    ],
    chapterLocations: {
      "main-1-0": ["south-valley", "beast-village", "whitebell-city", "north-road"],
      "main-1-1": ["mistbridge", "mountain-post", "echo-valley"],
      "main-1-2": ["mistbridge", "north-bridge"],
      "main-1-3": ["lotin-harbor"]
    },
    terrainShapes: [{ regionId: "origin-forest", points: "64,580 85,350 232,222 443,190 640,250 875,210 1130,265 1142,570 925,611 688,540 447,620 235,602" }]
  };
}));


