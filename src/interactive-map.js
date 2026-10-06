(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipInteractiveMap = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Map art comes from 01M. Corrected maps use unlabelled replacement art;
  // navigation labels and travel facts follow the current 01 world/itinerary document.
  var maps = {
    "W-001": { name: "艾珥汀大陸", level: 0, image: "w-001.png", note: "世界總圖｜帷海以東南外航表示；遠潮界屬獨立世界。", points: [
      ["R1-000", "第一大版本", 47, 67], ["R2-000", "第二大版本", 79, 73],
      ["R3-000", "第三大版本", 46, 39], ["R4-000", "第四大版本", 72, 24],
      ["R5-000", "第五大版本", 61, 13], ["R6-000", "第六大版本・帷海", 90, 91]
    ] },
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
    ] },
    "A1-107": { name: "霧橋鎮北斷橋工區", level: 2, parent: "R1-000", image: "a1-107.png", note: "施工、封閉與半幅限重通行是劇情狀態；底圖不把未測區畫成安全通道。", points: [
      ["#deck", "斷橋橋面", 54, 42], ["#slow", "居民慢行線", 44, 65],
      ["#spider", "橋下鳴棘蛛區", 64, 58], ["#gather", "工人集合區", 34, 48]
    ] },
    "R2-000": { name: "第二大版本｜洛汀灣與鏡潮群島", level: 1, parent: "W-001", pending: true },
    "R3-000": { name: "第三大版本｜霽光廊・星井盆地・北河走廊", level: 1, parent: "W-001", pending: true },
    "R4-000": { name: "第四大版本｜新曙沿岸", level: 1, parent: "W-001", pending: true },
    "R5-000": { name: "第五大版本｜根冠高地與虹徑外環", level: 1, parent: "W-001", pending: true },
    "R6-000": { name: "第六大版本｜照汐城與帷海外航區", level: 1, parent: "W-001", pending: true },
    "S6-001": { name: "遠潮界｜繫舟盆地", level: 0, pending: true }
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
    outer: "遺構外圍及破損通路。", core: "遺構核心連結區。", special: "同界錯接窗口；不可當普通道路。",
    deck: "橋面僅在劇情核准後半幅限重通行。", slow: "居民取水與送藥的外側慢行線。",
    spider: "橋下鳴棘蛛活動區，施工需避開。", gather: "工程撤離與集合區。"
  };

  function escapeHtml(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) { return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]; }); }
  function lineage(id) { var out = []; var seen = {}; while (maps[id] && !seen[id]) { seen[id] = true; out.unshift(id); id = maps[id].parent; } return out; }
  function render(id, selectedPoint) {
    var map = maps[id] || maps["W-001"];
    var trail = lineage(id).map(function (key, i, all) { return key === id ? "<span>" + escapeHtml(maps[key].name) + "</span>" : "<button type=\"button\" data-map-go=\"" + key + "\">" + escapeHtml(maps[key].name) + "</button><span aria-hidden=\"true\">›</span>"; }).join("");
    var dots = (map.points || []).map(function (point) {
      var target = maps[point[0]], unavailable = target && target.pending;
      return "<button type=\"button\" class=\"atlas-pin" + (selectedPoint === point[0] ? " active" : "") + (unavailable ? " pending" : "") + "\" style=\"left:" + point[2] + "%;top:" + point[3] + "%\" data-map-go=\"" + escapeHtml(point[0]) + "\" aria-label=\"查看" + escapeHtml(point[1]) + (unavailable ? "，地圖待製作" : "") + "\"><span>" + escapeHtml(point[1]) + "</span></button>";
    }).join("");
    var selected = (map.points || []).find(function (p) { return p[0] === selectedPoint; });
    var localDescription = selected && selected[0].charAt(0) === "#" ? details[selected[0].slice(1)] : "";
    var nav = map.parent ? "<button type=\"button\" class=\"atlas-back\" data-map-go=\"" + map.parent + "\">← 返回上一層</button>" : "";
    var worldSwitch = id === "W-001" ? "<button type=\"button\" class=\"atlas-switch\" data-map-go=\"S6-001\">遠潮界｜獨立世界圖 ↗</button>" : id === "S6-001" ? "<button type=\"button\" class=\"atlas-switch\" data-map-go=\"W-001\">返回艾珥汀大陸</button>" : "";
    var visual = map.image ? "<div class=\"atlas-image-wrap\"><img src=\"./assets/maps/" + map.image + (map.imageVersion ? "?v=" + map.imageVersion : "") + "\" alt=\"" + escapeHtml(map.name) + "地圖\" loading=\"lazy\">" + dots + "</div>" : "<div class=\"atlas-pending\"><strong>地圖原圖待製作</strong><p>此區已有層級入口，詳細地圖尚未經地理核對與出圖。</p></div>";
    var destinations = (map.points || []).map(function (point) { return "<button type=\"button\" data-map-go=\"" + escapeHtml(point[0]) + "\">" + escapeHtml(point[1]) + (maps[point[0]] && maps[point[0]].pending ? " · 待製作" : " →") + "</button>"; }).join("");
    return "<div class=\"atlas-heading\"><div><span class=\"eyebrow\">INTERACTIVE ATLAS / L" + map.level + "</span><h3 id=\"story-map-title\">" + escapeHtml(map.name) + "</h3></div><span class=\"story-map-version\">" + (map.pending ? "待製作" : map.clean ? "無字修正版" : "第一版原圖") + "</span></div><nav class=\"atlas-crumbs\" aria-label=\"地圖層級\">" + trail + "</nav><div class=\"atlas-controls\">" + nav + worldSwitch + "</div>" + visual + (destinations ? "<div class=\"atlas-destinations\" aria-label=\"地圖目的地\">" + destinations + "</div>" : "") + "<div class=\"atlas-foot\"><p>" + escapeHtml(localDescription || map.note || "後續區域的正式地圖與節點正在製作。") + "</p><small>" + (map.image ? (map.clean ? "圖像已替換為無字修正版；地名、行程與可通行狀態由互動標記和現行設定提供。" : "圖像為第一版概念原圖；地名、行程與可通行狀態以互動標記及現行設定為準。") : "詳細原圖尚未提供；此入口僅顯示規劃中的層級與區域名稱。") + "</small></div>";
  }
  return { maps: maps, lineage: lineage, render: render };
}));
