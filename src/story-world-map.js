(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.StarshipStoryWorldMap = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // 故事地理的單一真實來源。章節仍可保留敘事用的複合地區名稱，
  // 但 UI、文件與稽核都透過 chapterLocations 對應到這份固定地圖。
  var regions = [
    {
      id: "origin-forest",
      name: "起源林線",
      terrain: "森林、峽谷與回覆台",
      versionRange: "1.0–3.2",
      color: "#55c8bb",
      description: "瑟蕾雅從獸靈之村出發，沿著霧橋、移動舞台與白榆河，學會讓每個地方保留自己的回覆。"
    },
    {
      id: "tide-west",
      name: "西部潮線",
      terrain: "港灣、潮汐書庫與鏡潮群島",
      versionRange: "1.3–2.5",
      color: "#78a9ff",
      description: "西側水路把洛汀港、潮汐書庫、鏡潮島與潮眼連成一條由淺入深的測線。"
    },
    {
      id: "inland-forge",
      name: "內陸回覆圈",
      terrain: "驛站、白榆河、鍛路鎮與北門高地",
      versionRange: "3.0–3.5",
      color: "#f0b66e",
      description: "內陸線把村口的共同治理推向鍛路鎮與北門，最後抵達星界終端的第一頁。"
    },
    {
      id: "northern-myth",
      name: "北境神話圈",
      terrain: "新曙港、遠望塔、白夜航路與長冬終端",
      versionRange: "4.0–4.5",
      color: "#c29aff",
      description: "北境把北歐神話意象改寫成根圖、霜火與可撤回的律，不把瑟蕾雅變成唯一神諭。"
    },
    {
      id: "root-deep",
      name: "根系深境",
      terrain: "根冠、命線織庭、深海根門與新曙終端",
      versionRange: "5.0–5.5",
      color: "#f09aa9",
      description: "最北的根系深境收束母親線與世界中心的誘惑，讓星界之律成為可以交班的共同規則。"
    }
  ];

  var locations = [
    { id: "beast-village", name: "獸靈之村", regionId: "origin-forest", x: 136, y: 294, terrain: "森林村落", versionRange: "1.0–3.2", description: "原始開場與瑟蕾雅第一次留下四小節旋律的地方。", aliases: ["獸靈之村"] },
    { id: "mistbridge", name: "霧橋鎮", regionId: "origin-forest", x: 248, y: 252, terrain: "霧橋峽口", versionRange: "1.0–1.1", description: "白鐘城外的橋鎮，保存最早的回覆台與村口消息。", aliases: ["白鐘城・霧橋鎮"] },
    { id: "travel-stage", name: "移動舞台", regionId: "origin-forest", x: 350, y: 292, terrain: "巡迴平台", versionRange: "1.1", description: "沿著舊路移動的臨時舞台，瑟蕾雅在這裡第一次學會聽見不完整的聲音。", aliases: ["移動舞台"] },
    { id: "waterline", name: "水工線", regionId: "origin-forest", x: 414, y: 354, terrain: "地下水工線", versionRange: "1.2", description: "連接森林與港口的舊水工線，橋下遺構藏著早期測線。", aliases: ["水工線"] },
    { id: "lotin-harbor", name: "洛汀港", regionId: "tide-west", x: 416, y: 474, terrain: "潮汐港灣", versionRange: "1.2–1.3", description: "獸靈之村的水路出口，潮線在這裡第一次被寫成共同交班。", aliases: ["洛汀港"] },
    { id: "bell-court", name: "彼岸鐘庭", regionId: "origin-forest", x: 484, y: 224, terrain: "高地鐘庭", versionRange: "1.4", description: "以半小時為單位記錄來訪者的鐘庭，位於森林路線與檔案路線的交界。", aliases: ["鐘庭"] },
    { id: "public-archive", name: "公共檔案庫", regionId: "origin-forest", x: 552, y: 160, terrain: "高架檔案庫", versionRange: "1.4–1.5", description: "存放沒有地址的回覆與空白頁，向北可接潮汐書庫。", aliases: ["公共檔案庫"] },
    { id: "tide-library", name: "潮汐書庫", regionId: "tide-west", x: 588, y: 374, terrain: "潮間書庫", versionRange: "2.0", description: "在海水漲退之間保存沒有地址的書，西側航線的主要轉運點。", aliases: ["潮汐書庫"] },
    { id: "mirror-isle", name: "鏡潮島", regionId: "tide-west", x: 704, y: 454, terrain: "鏡面島嶼", versionRange: "2.0–2.1", description: "潮汐書庫外海的島，回聲會被鏡面分成不同方向。", aliases: ["鏡潮島"] },
    { id: "deep-line", name: "深潮測線", regionId: "tide-west", x: 786, y: 558, terrain: "深海測線", versionRange: "2.2", description: "由鏡潮島向東南下潛的測量線，通往雲脊站與潮眼外圍。", aliases: ["深潮測線"] },
    { id: "cloud-ridge", name: "雲脊站", regionId: "tide-west", x: 772, y: 300, terrain: "雲脊高台", versionRange: "2.2–2.3", description: "位在風廊下方的高台，負責把深潮測線的訊息送往內陸。", aliases: ["風廊", "雲脊站"] },
    { id: "wind-corridor", name: "風廊", regionId: "tide-west", x: 692, y: 210, terrain: "高空風廊", versionRange: "2.3", description: "雲脊改道後的高空通路，讓西部潮線與北方議庭互通。", aliases: ["風廊"] },
    { id: "mist-court", name: "霧鏡議庭", regionId: "tide-west", x: 850, y: 212, terrain: "霧鏡高地", versionRange: "2.4", description: "討論見證權與空白頁歸屬的議庭，位於潮眼北側。", aliases: ["霧鏡議庭"] },
    { id: "tide-eye", name: "潮眼外圍", regionId: "tide-west", x: 912, y: 512, terrain: "潮眼斷崖", versionRange: "2.4–2.5", description: "西部潮線的終點，瑟蕾雅在此面對潮眼之外的第一個世界問題。", aliases: ["潮眼外圍"] },
    { id: "clear-light", name: "霽光廊", regionId: "inland-forge", x: 534, y: 548, terrain: "回聲長廊", versionRange: "3.0", description: "從潮眼回到內陸後遇到的光廊，回聲井把村口的問題帶回隊伍。", aliases: ["霽光廊"] },
    { id: "white-stone", name: "白石驛站", regionId: "inland-forge", x: 186, y: 546, terrain: "內陸驛站", versionRange: "3.0", description: "三面旗的交會點，是獸靈之村與內陸回覆台之間的中繼站。", aliases: ["白石驛站"] },
    { id: "inland-reply", name: "內陸回覆台", regionId: "inland-forge", x: 294, y: 598, terrain: "內陸台地", versionRange: "3.1", description: "把沿線訊息拆成可回覆格式的台站，不再替地方自動補完答案。", aliases: ["內陸回覆台"] },
    { id: "white-elm", name: "白榆河", regionId: "inland-forge", x: 414, y: 658, terrain: "四段河道", versionRange: "3.2", description: "被拆成四段共同治理的河，讓每一段都能保留自己的水路決定。", aliases: ["白榆河"] },
    { id: "forge-town", name: "鍛路鎮", regionId: "inland-forge", x: 592, y: 642, terrain: "火路工鎮", versionRange: "3.3", description: "把集中供能拆成可輪值火路的工鎮，通往北門高地。", aliases: ["鍛路鎮"] },
    { id: "north-gate", name: "北門高地", regionId: "inland-forge", x: 734, y: 642, terrain: "北門山口", versionRange: "3.4", description: "保存艾妲拒絕被帶回去的信，守住通往終端的收件地址。", aliases: ["北門高地"] },
    { id: "star-terminal", name: "星界終端", regionId: "inland-forge", x: 930, y: 630, terrain: "終端台地", versionRange: "3.5", description: "瑟蕾雅留下可拒絕、可撤回、可交班的第一頁，北境根系由此顯影。", aliases: ["星界終端"] },
    { id: "new-dawn-port", name: "新曙港", regionId: "northern-myth", x: 1030, y: 432, terrain: "北境港口", versionRange: "4.0", description: "北境神話篇的入口，根圖在港口被重新畫成多中心路線。", aliases: ["新曙港"] },
    { id: "shard-forge", name: "碎星工坊", regionId: "northern-myth", x: 1060, y: 316, terrain: "碎星工坊", versionRange: "4.1", description: "把霜火拆成雙核輪值的工坊，艾妲的記憶在此被保存而不被佔用。", aliases: ["碎星工坊"] },
    { id: "farwatch", name: "遠望塔", regionId: "northern-myth", x: 1005, y: 210, terrain: "北境觀測塔", versionRange: "4.2", description: "虹徑兩端的觀測點，任何通行都必須保留雙向關閉權。", aliases: ["遠望塔"] },
    { id: "white-night", name: "白夜航路", regionId: "northern-myth", x: 880, y: 120, terrain: "極夜航線", versionRange: "4.3", description: "記憶缺頁與長冬訊號交錯的北境航線。", aliases: ["白夜航路"] },
    { id: "reply-trench", name: "回覆海溝", regionId: "northern-myth", x: 742, y: 92, terrain: "深海海溝口", versionRange: "4.4", description: "深海根門上方的回覆海溝，必須先知道何時上浮才能下潛。", aliases: ["回覆海溝"] },
    { id: "second-law", name: "第二條律終端", regionId: "northern-myth", x: 604, y: 86, terrain: "長冬終端", versionRange: "4.5", description: "把拒絕、撤回與交班寫成共同規則的終端。", aliases: ["第二條律終端"] },
    { id: "root-crown", name: "北境根冠", regionId: "root-deep", x: 466, y: 102, terrain: "根系冠層", versionRange: "5.0", description: "第十盞燈等待有人拒絕，九份根系由此交還各界。", aliases: ["北境根冠"] },
    { id: "frostfire", name: "霜火鍛環", regionId: "root-deep", x: 344, y: 148, terrain: "霜火鍛環", versionRange: "5.1", description: "冷核與熱核被拆成可交班的工具，痛苦不再被燒掉或集中保管。", aliases: ["霜火鍛環"] },
    { id: "rainbow-edge", name: "虹徑外環", regionId: "root-deep", x: 234, y: 212, terrain: "虹橋外環", versionRange: "5.2", description: "虹橋兩端之外的守望區，把通行改為雙方都能說不的約定。", aliases: ["虹徑外環", "虹橋"] },
    { id: "weaving-court", name: "命線織庭", regionId: "root-deep", x: 164, y: 302, terrain: "命線織庭", versionRange: "5.3", description: "三條未來都像真的，空白梭把選擇權還給每條命線的主人。", aliases: ["命線織庭"] },
    { id: "deep-root", name: "深海根門", regionId: "root-deep", x: 164, y: 430, terrain: "深海根門", versionRange: "5.4", description: "艾妲要求瑟蕾雅不要獨自進門，四把鑰匙共同保管並共同叫停。", aliases: ["深海根門"] },
    { id: "new-dawn-terminal", name: "新曙終端", regionId: "root-deep", x: 248, y: 548, terrain: "新曙終端", versionRange: "5.5", description: "瑟蕾雅拒絕唯一王座，成為可被交班的見證人並收到母親回信。", aliases: ["新曙終端"] }
  ];

  var routes = [
    { id: "origin-to-harbor", from: "beast-village", to: "mistbridge", label: "霧橋舊路", direction: "東南" },
    { id: "stage-to-water", from: "mistbridge", to: "travel-stage", label: "巡迴舞台線", direction: "東" },
    { id: "water-to-lotin", from: "travel-stage", to: "waterline", label: "水工線", direction: "東南" },
    { id: "lotin-to-bell", from: "waterline", to: "lotin-harbor", label: "潮線出口", direction: "南" },
    { id: "bell-to-archive", from: "lotin-harbor", to: "bell-court", label: "鐘庭高地路", direction: "北" },
    { id: "archive-to-library", from: "public-archive", to: "tide-library", label: "空白頁航道", direction: "東南" },
    { id: "bell-to-archive", from: "bell-court", to: "public-archive", label: "公共檔案路", direction: "東北" },
    { id: "library-to-mirror", from: "tide-library", to: "mirror-isle", label: "鏡潮渡線", direction: "東南" },
    { id: "mirror-to-deep", from: "mirror-isle", to: "deep-line", label: "深潮測線", direction: "東南" },
    { id: "deep-to-cloud", from: "deep-line", to: "cloud-ridge", label: "雲脊上行線", direction: "北" },
    { id: "cloud-to-wind", from: "cloud-ridge", to: "wind-corridor", label: "風廊改道", direction: "西北" },
    { id: "wind-to-court", from: "wind-corridor", to: "mist-court", label: "議庭北線", direction: "東北" },
    { id: "court-to-eye", from: "mist-court", to: "tide-eye", label: "潮眼外圍線", direction: "南" },
    { id: "eye-to-clear", from: "tide-eye", to: "clear-light", label: "霽光回返線", direction: "西南" },
    { id: "village-to-stone", from: "beast-village", to: "white-stone", label: "三面旗內陸線", direction: "南" },
    { id: "stone-to-reply", from: "white-stone", to: "inland-reply", label: "驛站回覆線", direction: "東南" },
    { id: "reply-to-elm", from: "inland-reply", to: "white-elm", label: "白榆四段水路", direction: "東南" },
    { id: "elm-to-forge", from: "white-elm", to: "forge-town", label: "鍛路火線", direction: "東" },
    { id: "forge-to-gate", from: "forge-town", to: "north-gate", label: "北門火路", direction: "東" },
    { id: "gate-to-terminal", from: "north-gate", to: "star-terminal", label: "第一頁終端線", direction: "東" },
    { id: "terminal-to-dawn", from: "star-terminal", to: "new-dawn-port", label: "北境根圖航道", direction: "北" },
    { id: "dawn-to-forge", from: "new-dawn-port", to: "shard-forge", label: "碎星工坊線", direction: "北" },
    { id: "forge-to-watch", from: "shard-forge", to: "farwatch", label: "遠望塔線", direction: "西北" },
    { id: "watch-to-night", from: "farwatch", to: "white-night", label: "白夜航路", direction: "西北" },
    { id: "night-to-trench", from: "white-night", to: "reply-trench", label: "海溝下行線", direction: "西南" },
    { id: "trench-to-law", from: "reply-trench", to: "second-law", label: "第二條律線", direction: "西" },
    { id: "law-to-root", from: "second-law", to: "root-crown", label: "根冠上行線", direction: "西" },
    { id: "root-to-frost", from: "root-crown", to: "frostfire", label: "霜火鍛環線", direction: "西南" },
    { id: "frost-to-rainbow", from: "frostfire", to: "rainbow-edge", label: "虹徑外環線", direction: "西南" },
    { id: "rainbow-to-weaver", from: "rainbow-edge", to: "weaving-court", label: "命線織庭線", direction: "西南" },
    { id: "weaver-to-deep", from: "weaving-court", to: "deep-root", label: "深海根門線", direction: "南" },
    { id: "deep-to-new-dawn", from: "deep-root", to: "new-dawn-terminal", label: "新曙回信線", direction: "東南" }
  ];

  var terrainShapes = [
    { id: "shape-origin", regionId: "origin-forest", label: "森林／峽谷", points: "42,216 236,112 474,158 548,326 424,520 180,510 62,394" },
    { id: "shape-tide", regionId: "tide-west", label: "潮線／群島", points: "512,302 708,176 1004,216 1036,566 824,620 612,514" },
    { id: "shape-inland", regionId: "inland-forge", label: "內陸／河谷", points: "76,480 264,432 536,474 954,548 1000,706 112,706" },
    { id: "shape-north", regionId: "northern-myth", label: "北境／長冬", points: "526,52 1086,48 1164,286 1022,474 770,392 602,244" },
    { id: "shape-root", regionId: "root-deep", label: "根系／深海", points: "74,72 526,48 672,112 564,300 368,364 100,478 42,270" }
  ];

  var chapterLocations = {
    "main-1-0": ["beast-village"],
    "side-1-0-village": ["beast-village", "mistbridge"],
    "main-1-1": ["travel-stage"],
    "main-1-2": ["waterline"],
    "side-1-2-water": ["beast-village", "lotin-harbor"],
    "main-1-3": ["lotin-harbor"],
    "main-1-4": ["bell-court"],
    "side-1-4-bell": ["bell-court", "public-archive"],
    "main-1-5": ["public-archive"],
    "main-2.0": ["tide-library"],
    "side-2.0-library": ["tide-library", "mirror-isle"],
    "main-2.1": ["mirror-isle"],
    "main-2.2": ["deep-line"],
    "side-2.2-deep": ["deep-line", "cloud-ridge"],
    "main-2.3": ["wind-corridor"],
    "main-2.4": ["mist-court"],
    "side-2.4-witness": ["mist-court", "tide-eye"],
    "main-2.5": ["tide-eye"],
    "main-3-0": ["clear-light"],
    "side-3-0-wind": ["white-stone", "inland-reply", "white-elm"],
    "main-3-1": ["inland-reply"],
    "main-3-2": ["white-elm"],
    "main-3-3": ["forge-town"],
    "side-3-3-forge": ["forge-town", "north-gate", "star-terminal"],
    "main-3-4": ["north-gate"],
    "main-3-5": ["star-terminal"],
    "main-4.0": ["new-dawn-port"],
    "side-4.0-dawn": ["new-dawn-port", "shard-forge", "farwatch"],
    "main-4.1": ["shard-forge"],
    "main-4.2": ["farwatch"],
    "main-4.3": ["white-night"],
    "side-4.3-memory": ["white-night", "reply-trench", "second-law"],
    "main-4.4": ["reply-trench"],
    "main-4.5": ["second-law"],
    "main-5.0": ["root-crown"],
    "side-5.0-root-register": ["root-crown", "frostfire", "rainbow-edge"],
    "main-5.1": ["frostfire"],
    "main-5.2": ["rainbow-edge"],
    "main-5.3": ["weaving-court"],
    "side-5.3-weaver-school": ["weaving-court", "deep-root", "new-dawn-terminal"],
    "main-5.4": ["deep-root"],
    "main-5.5": ["new-dawn-terminal"]
  };

  var regionAliases = {};
  locations.forEach(function (location) {
    (location.aliases || []).forEach(function (alias) { regionAliases[alias] = location.id; });
  });
  regionAliases["獸靈之村・洛汀港"] = "lotin-harbor";
  regionAliases["彼岸鐘庭・公共檔案庫"] = "public-archive";
  regionAliases["潮汐書庫・鏡潮島"] = "mirror-isle";
  regionAliases["深潮測線・雲脊站"] = "cloud-ridge";
  regionAliases["霧鏡議庭・潮眼外圍"] = "tide-eye";
  regionAliases["白石驛站・內陸回覆台・白榆河"] = "white-elm";
  regionAliases["鍛路鎮・北門高地・星界終端"] = "star-terminal";
  regionAliases["新曙港・碎星工坊・遠望塔"] = "farwatch";
  regionAliases["白夜航路・海溝入口・協議庭"] = "second-law";
  regionAliases["北境根冠・霜火鍛環・虹橋"] = "rainbow-edge";
  regionAliases["命線織庭・深海根門・北境新曙"] = "new-dawn-terminal";

  return {
    id: "story-world-map-v1",
    title: "星界之律世界地圖",
    subtitle: "從獸靈之村到新曙終端的地形、方位與故事航線",
    viewBox: "0 0 1200 760",
    liveVersionRange: "1.0–2.5",
    plannedVersionRange: "3.0–5.5",
    regions: regions,
    locations: locations,
    routes: routes,
    terrainShapes: terrainShapes,
    chapterLocations: chapterLocations,
    regionAliases: regionAliases,
    legend: [
      { label: "主線航線", type: "main" },
      { label: "支線／回返路", type: "side" },
      { label: "已開放地區", type: "open" },
      { label: "建檔中的後續地區", type: "locked" }
    ],
    continuityNotes: [
      "1.0 的獸靈之村是固定起點；1.1–2.5 沿霧橋、潮線與潮眼向西部展開。",
      "2.5 結束後由潮眼回返霽光廊，3.0–3.5 沿白榆河、鍛路鎮與北門高地向星界終端推進。",
      "3.5 的第一頁接上 4.0 北境根圖；4.0–4.5 由新曙港繞行遠望塔、白夜航路與第二條律終端。",
      "5.0–5.5 從北境根冠經霜火、虹徑、命線織庭與深海根門抵達新曙終端，完成瑟蕾雅的交班選擇。"
    ]
  };
}));
