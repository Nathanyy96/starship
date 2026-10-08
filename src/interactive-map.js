(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipInteractiveMap = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Map art comes from 01M. Corrected maps use unlabelled replacement art;
  // navigation labels and travel facts follow the current 01 world/itinerary document.
  var maps = {
    "W-001": { name: "艾珥汀大陸", level: 0, image: "w-001.png", imageVersion: "mainland-20261007", clean: true, note: "北方在上。大陸圖只呈現本土：南部內陸、洛汀灣、中部山河、北境沿岸與根冠高地。鏡潮群島由洛汀灣區域圖呈現；帷海從群島東南外航，遠潮界另用獨立世界圖。", landmarks: [
      ["白鐘城", 43, 66], ["獸靈森地", 56, 70], ["洛汀灣", 68, 72], ["星井盆地", 31, 44], ["根冠高地", 45, 18]
    ], points: [
      ["R1-000", "第一大版本｜南部內陸", 36, 73], ["R2-000", "第二大版本｜洛汀灣與鏡潮群島", 68, 78],
      ["R3-000", "第三大版本｜星井內陸", 38, 49], ["R4-000", "第四大版本｜新曙沿岸", 67, 26],
      ["R5-000", "第五大版本｜根冠高地", 49, 22]
    ], offMap: [["R6-000", "第六大版本｜東南外航至帷海"]] },
    "R1-000": { name: "第一大版本｜南部內陸生活圈", level: 1, parent: "W-001", image: "r1-000.png", note: "白鐘城是內陸核心；獸靈之村在東，霧橋在北，南驛山谷在南。鐘庭採特殊連結。", points: [
      ["C1-101", "白鐘城", 40, 69], ["C1-102", "獸靈之村", 78, 68],
      ["C1-103", "霧橋鎮", 48, 44], ["C1-104", "南驛山谷", 61, 88],
      ["A1-105", "迴音谷／山腰驛站", 48, 23], ["A1-106", "霧橋第七遺構", 62, 16],
      ["A1-107", "北斷橋工區", 66, 35]
    ] },
    "C1-101": { name: "白鐘城", level: 2, parent: "R1-000", image: "c1-101.png", clean: true, note: "東門通獸靈之村：步行兩日；北門通霧橋鎮：步行三日；沿河順流至洛汀港：兩日。", points: [
      ["#central", "中央廣場", 49, 43], ["#observatory", "城西觀測分會", 31, 25],
      ["#workshop", "工坊區", 30, 51], ["#market", "商業區", 65, 50],
      ["#residences", "居民區", 52, 61], ["#north-gate", "北門", 49, 9],
      ["#east-gate", "東門", 88, 45], ["#river", "河岸與橋梁", 77, 70]
    ] },
    "C1-102": { name: "獸靈之村", level: 2, parent: "R1-000", image: "c1-102.png", imageVersion: "west-20261006", clean: true, note: "自治聚落；從西側出口循商路兩日抵白鐘城東門。南驛山谷的開場位移不是常設道路。", points: [
      ["#village", "中央聚落", 50, 40], ["#fire", "共用火場", 58, 49],
      ["#heal", "療養所", 80, 36], ["#rangers", "巡林者據點", 24, 39],
      ["#supplies", "物資倉與工坊", 78, 67], ["#west-road", "西側白鐘商路出口", 9, 47]
    ] },
    "C1-103": { name: "霧橋鎮", level: 2, parent: "R1-000", image: "c1-103.png", clean: true, note: "南返白鐘約三日；經山腰驛站至迴音谷約一日；北斷橋為工程支路。", points: [
      ["#town", "鎮中心", 44, 53], ["#post", "霧橋驛站", 66, 52],
      ["#south", "南路入口", 70, 88], ["#north", "山路入口", 48, 14],
      ["#bridge", "北斷橋支路", 81, 36]
    ] },
    "C1-104": { name: "南驛山谷", level: 2, parent: "R1-000", image: "c1-104.png", clean: true, note: "驛務、農地、商路和聚落構成南側生活圈；開場界痕屬一次性異常。", points: [
      ["#post", "驛站", 45, 43], ["#fields", "農地與聚落", 72, 69],
      ["#forest", "獸靈森地入口", 72, 21], ["#south", "南方商路", 43, 87]
    ] },
    "A1-105": { name: "迴音谷／山腰驛站", level: 2, parent: "R1-000", image: "a1-105.png", clean: true, note: "霧橋外山路的驛站與谷地共用一張區域圖；至第七遺構仍需再走兩日山路。", points: [
      ["#post", "山腰驛站", 45, 41], ["#valley", "迴音谷", 70, 56],
      ["#road", "往第七遺構山路", 65, 8]
    ] },
    "A1-106": { name: "霧橋第七遺構", level: 2, parent: "R1-000", image: "a1-106.png", clean: true, note: "遺構內的彼岸鐘庭是同界錯接，屬特殊連結，不是相鄰城市道路。", points: [
      ["#entrance", "山路入口", 19, 39], ["#outer", "遺構外圍", 34, 35],
      ["#core", "核心連結區", 55, 42], ["#special", "彼岸鐘庭特殊連結", 58, 52]
    ], offMap: [["S1-201", "彼岸鐘庭｜特殊連結示意"]] },
    "A1-107": { name: "霧橋鎮北斷橋工區", level: 2, parent: "R1-000", image: "a1-107.png", note: "施工、封閉與半幅限重通行是劇情狀態；底圖不把未測區畫成安全通道。", points: [
      ["#deck", "斷橋橋面", 54, 42], ["#slow", "居民慢行線", 44, 65],
      ["#spider", "橋下鳴棘蛛區", 64, 58], ["#gather", "工人集合區", 34, 48]
    ] },
    "R2-000": { name: "第二大版本｜洛汀灣與鏡潮群島", level: 1, parent: "W-001", image: "r2-000.png", previewOnly: true, concept: true, note: "河口港灣接多島海域；白帆岬的精確羅盤方位仍待海圖鎖定。", points: [
      ["#lotin", "洛汀港", 18, 50], ["#cape", "白帆岬", 34, 53], ["#isles", "鏡潮群島", 63, 42],
      ["#storm-isle", "雲脊高島", 83, 16], ["#well", "沉脈井", 58, 78], ["#tide-eye", "外緣潮眼", 91, 53]
    ], pointNotes: { lotin: "白鐘主河下游的出海港；順流約兩日，逆流返白鐘約三至四日。", cape: "從洛汀港乘船約半日；精確方位暫不鎖定。", isles: "白帆岬向東航行約一至兩日到達多島生活圈。", "storm-isle": "群島東北的高島；2.3風暴與避難線。", well: "群島南側海域的測站與沉脈井。", "tide-eye": "群島外緣危險潮眼；關閉近航路後仍需保留替代遠航道。" } },
    "R3-000": { name: "第三大版本｜霽光廊・星井盆地・北河走廊", level: 1, parent: "W-001", image: "r3-000.png", previewOnly: true, concept: true, note: "從霧橋往西北入山；星井北門之後沿北河下行至北境，不從洛汀灣直接越圖。", points: [
      ["#corridor", "霽光廊", 74, 70], ["#basin", "星井盆地", 31, 42], ["#elm-river", "白榆河", 53, 45],
      ["#forge-road", "鍛路鎮", 37, 23], ["#north-gate", "星井北門", 14, 12], ["#north-river", "北河走廊", 84, 16]
    ], pointNotes: { corridor: "霧橋向西北進入的山河門檻；白石驛站與岑光聚落位於此段。", basin: "中央山地盆地與地下遺構群，第三季的主要內陸生活圈。", "elm-river": "盆地東側的白榆河；改道前後兩岸仍需局部圖核對。", "forge-road": "盆地北側山脊上的鍛路鎮，接往北門。", "north-gate": "越山入口；星井終端位於附近山腹，並非另一座城市。", "north-river": "越山後沿北河向北境海岸下行。" } },
    "R4-000": { name: "第四大版本｜新曙沿岸", level: 1, parent: "W-001", image: "r4-000.png", previewOnly: true, concept: true, note: "新曙港與內陸工坊、東北遠望塔、北方白夜航路和外海回覆海溝是不同尺度的地點。", points: [
      ["#new-dawn", "新曙港", 42, 34], ["#workshops", "碎星工坊", 23, 69], ["#watchtower", "遠望塔", 69, 30],
      ["#white-night", "白夜航路", 76, 7], ["#trench", "回覆海溝", 89, 57]
    ], pointNotes: { "new-dawn": "星井北門後沿北河與山路下行約七至十日抵達的北境港城。", workshops: "新曙港向內陸約兩日的工坊區。", watchtower: "新曙港沿東北岸約三日到遠望塔生活圈。", "white-night": "遠望塔以北的季節沿海航路；可通狀態由劇情另行標示。", trench: "遠望塔港出船約三日的外海深水區，不貼在岸邊。" } },
    "R5-000": { name: "第五大版本｜根冠高地與北境特殊連結", level: 1, parent: "W-001", image: "r5-000.png", imageVersion: "terrain-20261007", previewOnly: true, concept: true, note: "根冠與霜火谷位於北境內陸；補給路下行至新曙沿岸。虹徑外環須經已測窗口，不在此地形圖上畫成相鄰島城。", points: [
      ["#root-crown", "根冠高地", 48, 17], ["#frostfire", "霜火谷", 43, 48], ["#coast-link", "新曙補給路", 81, 79],
    ], offMap: [["S5-201", "虹徑外環｜特殊連結示意"]], pointNotes: { "root-crown": "新曙港向北約五日山路；高地的根林、長冬與地方守望塑造第五季生活。", frostfire: "根冠下行約一日山路的霜火谷與鍛環；地熱只集中於谷底，不貫穿整座高地。", "coast-link": "沿岸藥物、器具與糧種上高地，木材、熱源材料與季節勞力下港口；雪季通行受山口狀態限制。" } },
    "R6-000": { name: "第六大版本｜帷海外航與照汐城生活圈", level: 1, parent: "W-001", image: "r6-000.png", previewOnly: true, concept: true, note: "從鏡潮群島向東南遠航到帷海諸邦；照汐城不與新曙港或根冠高地直接相鄰。", points: [
      ["#supply-isles", "鏡潮群島補給", 18, 11], ["#outer-route", "帷海外航", 48, 49], ["#choashi", "照汐城", 86, 77],
      ["#outer-shore", "照汐外岸接點", 72, 88]
    ], pointNotes: { "supply-isles": "在既有群島補給後依季風東南外航。", "outer-route": "鏡潮群島至照汐城暫採順季風五至七日、逆風八至十日；替代港與危險海域仍待海圖。", choashi: "帷海諸邦的主要落腳城市，用具體社會逐步帶出諸邦。", "outer-shore": "通往遠潮界的已驗證外岸接點；兩界仍分圖，不能把遠潮界畫成帷海島嶼。" } },
    "S6-001": { name: "遠潮界｜繫舟盆地", level: 0, image: "s6-001.png", imageVersion: "basin-20261007", previewOnly: true, concept: true, note: "獨立世界圖。照汐外岸的已驗證連結落在盆地西緣石岸；6.3舊連結永久關閉，6.6另建受季節與載重限制的新線。", points: [
      ["#west-shore", "西緣石岸", 20, 55], ["#tether-city", "繫舟城", 47, 43], ["#qingxi", "青汐臺地", 78, 24], ["#water", "供水區", 86, 37]
    ], pointNotes: { "west-shore": "照汐外岸已驗證連結的落點；從此至繫舟城步行約一日。", "tether-city": "盆地主要城市；至青汐臺地約半日至一日。", qingxi: "盆地東北的臺地生活圈。", water: "供水區；6.3事件中的傷者集合點與強制裝載地另列，不合併成同一處。" } },
    "S1-201": { name: "彼岸鐘庭｜特殊連結示意", level: 2, parent: "A1-106", previewOnly: true, concept: true, diagram: true, note: "第七遺構的同界錯接；示意連結次序，不代表地理比例或恆常可通行。", points: [
      ["#window", "遺構窗口"], ["#bell-landing", "鐘庭落點"], ["#bell-inner", "內庭待測區"]
    ], pointNotes: { window: "須依1.4劇情校準，不能視為普通道路。", "bell-landing": "已知落點，後續場景細節待正式圖核對。", "bell-inner": "尚未驗證為安全通路。" } },
    "S5-201": { name: "虹徑外環｜特殊連結示意", level: 2, parent: "R5-000", previewOnly: true, concept: true, diagram: true, note: "由遠望塔已測窗口接入；此圖只表達已知連結與劇情開放範圍，不把外環畫在根冠高地旁。", points: [
      ["#window", "遠望塔窗口"], ["#rainbow-landing", "外環落點"], ["#weave-court", "命線織庭"]
    ], pointNotes: { window: "4.2短窗口僅容測試落點附近；兩端可拒絕通行。", "rainbow-landing": "5.2才深入外環；落點至織庭約一日。", "weave-court": "5.2劇情深入的核心地點，具體局部地圖待後續定稿。" } }
  };

  var details = {
    central: "城中公共廣場與城市交通核心。", observatory: "觀測會分會；與城西工坊共同處理量測與工程。",
    workshop: "城西工坊區。", market: "市場、旅店與一般商業帶。", residences: "居民生活區。",
    "north-gate": "往霧橋鎮，正常山路步行三日。", "east-gate": "往獸靈之村，正常商路步行兩日。",
    river: "城內河岸與橋梁；沿河順流兩日到洛汀港。", village: "聚落的日常生活核心。",
    fire: "共同生活與集會的火場。", heal: "醫療與療養空間。", rangers: "巡林與採集的接應點。",
    supplies: "公共物資、修繕與工坊。", "west-road": "村西商路出口；向西步行兩日到白鐘城東門。", road: "主要山路；依行程文件核對步程。",
    town: "霧橋鎮中心。", post: "地方驛站與換班點。", south: "往南方生活圈的商路。",
    north: "往山路與遺構方向。", bridge: "通往北斷橋工區的支路。", fields: "農地與一般聚落。",
    forest: "通往獸靈森地的道路。", valley: "迴音谷與救援區域。", entrance: "遺構山路入口。",
    outer: "遺構外圍及破損通路。", core: "遺構核心連結區。", special: "第七遺構通往彼岸鐘庭的同界錯接窗口；1.4鐘庭校準時成為主要劇情連結，不是可隨時步行的普通道路。",
    deck: "橋面僅在劇情核准後半幅限重通行。", slow: "居民取水與送藥的外側慢行線。",
    spider: "橋下鳴棘蛛活動區，施工需避開。", gather: "工程撤離與集合區。"
  };

  var routePlans = {
    "R2-000": ["洛汀港 → 白帆岬：約半日；圖上岬角在港口偏東，精確羅盤方位待海圖。", "白帆岬 → 鏡潮群島：向東約一至兩日；內側潮路與西側避風迴路均待實測。", "外緣潮眼封閉近航路時須停航或折返已知補給點；替代遠航道尚未驗證。"],
    "R6-000": ["鏡潮群島補給 → 帷海外航 → 照汐城：圖上由西北往東南；順季風暫估五至七日，逆風八至十日。", "惡劣海況先返回已知群島補給點或待航；替代港、危險水域與精確航向待海圖核定。", "照汐外岸的跨界接點與遠潮界西緣石岸分屬兩張世界圖。"]
  };
  var phaseStates = {
    "A1-107": [
      ["施工前", "斷橋封閉；居民慢行線僅供取水與送藥。"], ["核准後", "橋面半幅限重，工區按劇情核准通行；未測橋下區仍封閉。"]
    ],
    "R2-000": [["2.0", "港岬與群島常規航段；精確方位待測。"], ["2.3", "雲脊高島風暴，避難線依事件開放；外緣潮眼不可當捷徑。"], ["2.5", "外緣潮眼近航路關閉；替代遠航道待實測，不標安全通路。"]],
    "R4-000": [["常態", "白夜航路依季節與海況開放。"], ["4.2", "遠望塔短窗口僅到虹徑外環落點附近。"]],
    "R5-000": [["雪季", "根冠山口限行，補給路依雪況核准。"], ["5.2", "虹徑外環已可深入，但仍由窗口兩端核准。"]],
    "R6-000": [["6.2", "照汐外岸至遠潮界西緣石岸的舊連結經驗證可通。"], ["6.3", "舊連結永久關閉；不得再次用作返回線。"], ["6.6", "另建新線有限通行，受季節與載重窗口及雙方管理限制；舊線維持關閉。"]],
    "S6-001": [["6.2", "由照汐外岸抵西緣石岸，再步行至繫舟城。"], ["6.3", "西緣石岸舊連結永久關閉。"], ["6.6", "新線有限通行；不是重開舊落點。"]],
    "S1-201": [["1.4", "鐘庭校準後才可經遺構窗口進入；內庭未測區不開放。"]],
    "S5-201": [["4.2", "短窗口只抵落點附近。"], ["5.2", "可深入外環至織庭；兩端仍可拒絕通行。"]]
  };

  function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
  function lineage(id) { var out = []; var seen = {}; while (maps[id] && !seen[id]) { seen[id] = true; out.unshift(id); id = maps[id].parent; } return out; }
  function render(id, selectedPoint, options) {
    var map = maps[id] || maps["W-001"];
    var canPreview = !!(options && options.authorPreview);
    var locked = map.previewOnly && !canPreview;
    var trail = lineage(id).map(function (key, i, all) { return key === id ? "<span>" + escapeHtml(maps[key].name) + "</span>" : "<button type=\"button\" data-map-go=\"" + key + "\">" + escapeHtml(maps[key].name) + "</button><span aria-hidden=\"true\">›</span>"; }).join("");
    var dots = (locked ? [] : map.points || []).map(function (point) {
      var target = maps[point[0]], unavailable = target && target.pending;
      return "<button type=\"button\" class=\"atlas-pin" + (selectedPoint === point[0] ? " active" : "") + (unavailable ? " pending" : "") + "\" style=\"left:" + point[2] + "%;top:" + point[3] + "%\" data-map-go=\"" + escapeHtml(point[0]) + "\" aria-label=\"查看" + escapeHtml(point[1]) + (unavailable ? "，地圖待製作" : "") + "\"><span>" + escapeHtml(point[1]) + "</span></button>";
    }).join("");
    var selected = (map.points || []).concat(map.offMap || []).find(function (p) { return p[0] === selectedPoint; });
    var localDescription = selected && selected[0].charAt(0) === "#" ? (map.pointNotes && map.pointNotes[selected[0].slice(1)]) || details[selected[0].slice(1)] : "";
    var nav = map.parent ? "<button type=\"button\" class=\"atlas-back\" data-map-go=\"" + map.parent + "\">← 返回上一層</button>" : "";
    var worldSwitch = id === "W-001" ? "<button type=\"button\" class=\"atlas-switch\" data-map-go=\"S6-001\">遠潮界｜獨立世界圖 ↗</button>" : id === "S6-001" ? "<button type=\"button\" class=\"atlas-switch\" data-map-go=\"W-001\">返回艾珥汀大陸</button>" : "";
    var landmarks = (map.landmarks || []).map(function (place) { return "<span class=\"atlas-landmark\" style=\"left:" + place[1] + "%;top:" + place[2] + "%\">" + escapeHtml(place[0]) + "</span>"; }).join("");
    var diagram = map.diagram && !locked ? "<div class=\"atlas-diagram\" aria-label=\"特殊連結拓樸示意\"><small>連結次序示意｜非地理比例或羅盤方位</small><div>" + (map.points || []).map(function (point, i) { return (i ? "<span aria-hidden=\"true\">→</span>" : "") + "<button type=\"button\" data-map-go=\"" + escapeHtml(point[0]) + "\">" + escapeHtml(point[1]) + "</button>"; }).join("") + "</div></div>" : "";
    var visual = diagram || (map.image && !locked ? "<div class=\"atlas-image-wrap atlas-level-" + map.level + (map.concept ? " atlas-concept" : "") + "\"><img src=\"./assets/maps/" + map.image + (map.imageVersion ? "?v=" + map.imageVersion : "") + "\" alt=\"" + escapeHtml(map.name) + "地圖\" loading=\"lazy\">" + landmarks + dots + "</div>" : "<div class=\"atlas-pending\"><strong>" + (locked ? "作者試玩概略圖" : "地圖原圖待製作") + "</strong><p>" + (locked ? "此大版本尚未向一般玩家開放；作者試玩可查看第一層區域概略圖。" : "此區已有層級入口，詳細地圖尚未經地理核對與出圖。") + "</p></div>");
    var destinations = (locked ? [] : (map.points || []).concat(map.offMap || [])).map(function (point) { return "<button type=\"button\" data-map-go=\"" + escapeHtml(point[0]) + "\">" + escapeHtml(point[1]) + (maps[point[0]] && maps[point[0]].pending ? " · 待製作" : " →") + "</button>"; }).join("");
    var routes = canPreview && routePlans[id] ? "<section class=\"atlas-route-plan\"><strong>航路核對</strong><ul>" + routePlans[id].map(function (line) { return "<li>" + escapeHtml(line) + "</li>"; }).join("") + "</ul></section>" : "";
    var phases = canPreview && phaseStates[id] ? "<section class=\"atlas-route-plan\"><strong>劇情通行狀態</strong><ul>" + phaseStates[id].map(function (phase) { return "<li><b>" + escapeHtml(phase[0]) + "：</b>" + escapeHtml(phase[1]) + "</li>"; }).join("") + "</ul></section>" : "";
    return "<div class=\"atlas-heading\"><div><span class=\"eyebrow\">INTERACTIVE ATLAS / L" + map.level + "</span><h3 id=\"story-map-title\">" + escapeHtml(map.name) + "</h3></div><span class=\"story-map-version\">" + (locked ? "作者試玩" : map.pending ? "待製作" : map.concept ? "區域概略圖" : map.clean ? "無字修正版" : "第一版原圖") + "</span></div><nav class=\"atlas-crumbs\" aria-label=\"地圖層級\">" + trail + "</nav><div class=\"atlas-controls\">" + nav + worldSwitch + "</div>" + visual + (destinations ? "<div class=\"atlas-destinations\" aria-label=\"地圖目的地\">" + destinations + "</div>" : "") + routes + phases + "<div class=\"atlas-foot\"><p>" + escapeHtml(localDescription || map.note || "後續區域的正式地圖與節點正在製作。") + "</p><small>" + (locked ? "尚未正式開放。" : map.concept ? "僅供作者校對地形與路線；未標定的距離、方位和第二層局部場景仍待核定。" : map.image ? (map.clean ? "地名、行程與可通行狀態由互動標記和現行設定提供。" : "圖像為第一版概念原圖；地名、行程與可通行狀態以互動標記及現行設定為準。") : "詳細原圖尚未提供；此入口僅顯示規劃中的層級與區域名稱。") + "</small></div>";
  }
  return { maps: maps, lineage: lineage, render: render };
}));
