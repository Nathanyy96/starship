(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.StarshipStoryMonsterCatalog = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var entries = [
    { id: "riftspine-spawn", name: "裂棘幼獸", image: "./assets/enemies/riftspine-spawn.webp", firstSeen: "1.0｜獸靈之村", kind: "召喚型小魔物", appearance: "膝高、三爪、向後彎的黑棘；棘間有紫光，爪印留下灰粉。", behavior: "成群奔襲，離開召喚者後會崩解成棘與灰。牠本身不製造空間錯位。", earlyRecord: "村民只知道牠們突然出現；召喚來源直到 1.1 才確認。", relation: "由折影獸召喚，與村外錯位屬於同一條線索。" },
    { id: "folding-shadow-beast", name: "折影獸", image: "./assets/enemies/folding-shadow-beast.webp", firstSeen: "1.1｜迴音谷上游", kind: "空間型魔物／召喚源頭", appearance: "四足黑甲、頸後紫色裂紋，背上懸浮三塊甲片。", behavior: "製造一定範圍內的假路與錯位，召喚裂棘幼獸。牠被擊敗後，干擾範圍內的錯位消退；並非到處不停新開裂隙。", weakness: "攻擊時甲片張開，頸後核心露出。先辨真身、破甲，再由同伴合力攻擊核心。", relation: "獸人村時未被找到；迴音谷確認牠與幼獸的關係後，消息才送回村裡。" }
  ];
  function escape(text) { return String(text || "").replace(/[&<>"']/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]; }); }
  function render(spoilers) {
    return '<section class="story-monster-catalog"><h3>魔物圖鑑｜村外的線索</h3><p>記錄已見到的特徵，以及後續確認的來源。</p><div class="story-monster-grid">' + entries.map(function (entry, index) {
      if (index && !spoilers) return '<article class="story-monster-entry"><h4>空間異常的源頭</h4><p>1.0 尚未確認；讀完 1.1 第三幕後顯示完整記錄。</p></article>';
      return '<article class="story-monster-entry"><img src="' + escape(entry.image) + '" alt="' + escape(entry.name + '完整魔物設計') + '" loading="lazy"><h4>' + escape(spoilers ? entry.name : "溪溝棘獸（暫記）") + '</h4><p>' + escape((spoilers ? entry.kind : "村外小魔物") + '｜' + entry.firstSeen) + '</p><p>' + escape(entry.appearance) + '</p>' + (spoilers ? '<p>' + escape(entry.behavior) + '</p>' : '') + '<p>' + escape(spoilers ? entry.relation : entry.earlyRecord) + '</p>' + (entry.weakness ? '<p>' + escape(entry.weakness) + '</p>' : '') + '</article>';
    }).join('') + '</div></section>';
  }
  return { entries: entries, render: render };
}));
