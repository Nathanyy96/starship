(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StarshipStoryWorldMap = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  return {
    title: "1.0 旅程地圖",
    subtitle: "上方為北；南驛山谷位於獸靈森地南緣，位移至村外後西行白鐘，再北上商路",
    viewBox: "0 0 1200 760",
    regions: [{ id: "origin-forest", name: "第一季旅程", terrain: "山谷・森林・白鐘城", color: "#70e9df" }],
    locations: [
      { id: "south-valley", name: "南驛山谷", regionId: "origin-forest", x: 900, y: 560, terrain: "舊祭壇與山谷", versionRange: "1.0", description: "界痕先出現，負傷的黑晶巨獸隨後落入祭壇；瑟蕾雅被位移帶走。" },
      { id: "beast-village", name: "獸靈之村", regionId: "origin-forest", x: 900, y: 420, terrain: "森林村落", versionRange: "1.0", description: "雷恩、莉亞與伊薩爾協助瑟蕾雅療傷、守村；離村時雷恩自願同行。" },
      { id: "whitebell-city", name: "白鐘城", regionId: "origin-forest", x: 520, y: 400, terrain: "東門、城西分會與工坊", versionRange: "1.0", description: "兩日徒步抵達東門；在城西工坊危機中與 Chodan、Magenta 合作救援。" },
      { id: "north-road", name: "北方商路", regionId: "origin-forest", x: 520, y: 210, terrain: "白鐘北門外的商路", versionRange: "1.0", description: "四人從北門出發。霧橋鎮與 ER 的本人登場留待後續版本。" }
    ],
    routes: [
      { from: "south-valley", to: "beast-village", label: "界痕位移", direction: "位移" },
      { from: "beast-village", to: "whitebell-city", label: "西行商路・兩日徒步", direction: "西" },
      { from: "whitebell-city", to: "north-road", label: "出城北行", direction: "北" }
    ],
    chapterLocations: { "main-1-0": ["south-valley", "beast-village", "whitebell-city", "north-road"] },
    terrainShapes: [{ regionId: "origin-forest", points: "64,580 85,350 232,222 443,190 640,250 875,210 1130,265 1142,570 925,611 688,540 447,620 235,602" }]
  };
}));


