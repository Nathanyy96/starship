(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StarshipTrial12 = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // Active 1.2 trial catalogue. It replaces the older trial list in the game.
  var image = {
    hunter: "./assets/enemies/black-crystal-spine-beast.webp",
    shadow: "./assets/enemies/folding-shadow-beast.webp",
    shell: "./assets/enemies/black-crystal-beast.webp",
    spider: "./assets/enemies/spider-mother.webp",
    small: "./assets/enemies/resonant-spider.webp"
  };
  var rows = [
    ["風隙入口", 1000, "pounce", "疾撲", "首輪提前行動；技能優先攻前排。", [["風隙巡獸", "hunter", 2100, 105, 55, 110]]],
    ["晶殼裂口", 1700, "shell", "結殼", "開場 12% 護盾，破盾後只重整一次。", [["晶殼衛獸", "shell", 3900, 150, 85, 86]]],
    ["分岔夾擊", 2500, "flank", "雙線追擊", "技能攻最低血者，另一人承受 45% 追擊。", [["雙棘獵獸", "hunter", 3300, 185, 95, 103], ["側翼獵獸", "hunter", 3000, 165, 90, 100]]],
    ["鳴棘蛛網", 3400, "web", "織網", "技能使一人冷卻增加 1；巢母每次技能延後目標冷卻一輪。", [["鳴棘蛛巢母", "spider", 8100, 205, 135, 85], ["鳴棘蛛", "small", 2400, 145, 85, 101]]],
    ["黑晶護區", 4500, "transfer", "護區轉移", "前排倒下時，預留護區餘能轉給後排一次並反擊；上限後排最大生命 10%。", [["護區晶獸", "shell", 8200, 250, 155, 85], ["晶棘後衛", "hunter", 5400, 205, 125, 96]]],
    ["複寫哨站", 5700, "reflect", "折射", "複寫當輪最強的攻擊或防禦增益，上限 15%，維持一輪。", [["折射哨獸", "shell", 12500, 300, 175, 90], ["哨站巡獸", "hunter", 4400, 225, 130, 105]]],
    ["低鳴追獵", 7000, "hunt", "換獵", "先追最低血後排；護盾擋下超過一半後改追最高攻擊者。", [["低鳴追獵獸", "hunter", 11600, 365, 180, 110], ["追獵副獸", "hunter", 9300, 315, 150, 107]]],
    ["回聲孵巢", 8300, "brood", "育殼", "巢母最多三次為低血小獸回復 10% 生命並加 6% 護盾；擊倒巢母可阻止回護。", [["孵巢母獸", "spider", 17500, 390, 190, 82], ["鳴棘蛛", "small", 5600, 265, 140, 100], ["鳴棘蛛", "small", 5600, 265, 140, 99]]],
    ["逆拍晶庭", 9700, "charge", "預充", "蓄力兩次技能後攻兩人；蓄力時破盾可減傷 25%。", [["逆拍晶核", "shell", 24300, 510, 215, 91], ["晶庭護獸", "hunter", 7200, 315, 150, 103]]],
    ["雙相鏡核", 11200, "phase", "鏡殼／裸核", "有盾時防禦升高；破盾提前換相並反擊，裸核攻擊提高。", [["雙相終端", "shell", 28350, 2660, 230, 94], ["鏡核巡獸", "hunter", 18900, 2310, 195, 108], ["鏡棘援獸", "shadow", 8500, 1550, 145, 102]]],
    ["鏡潮雙線", 12000, "flank", "雙線圍獵", "上下半場分開出戰；側翼獵獸會追擊低血目標，另一敵人同步追擊。", [["鏡潮獵獸", "shadow", 14200, 2480, 205, 108], ["鏡棘巡獸", "hunter", 11800, 2200, 185, 101]]],
    ["回聲孵巢", 12400, "brood", "巢群回護", "巢母最多三次為低血小獸回復 10% 生命並加 6% 護盾；擊倒巢母可阻止回護。", [["回聲巢母", "spider", 16000, 2260, 210, 88], ["回聲幼獸", "small", 7800, 1980, 155, 104]]],
    ["折光哨站", 12800, "copy", "增益複寫", "上下半場分派不同隊伍；首領會複寫我方最強增益，複寫期間拆增益可破局。", [["折光守衛獸", "shell", 17600, 2360, 225, 92], ["折光獵獸", "shadow", 9200, 2050, 170, 110]]],
    ["黑晶追獵", 13200, "hunt", "換獵追擊", "上下半場各自鎖定目標；護盾承傷過半後追擊會轉向高攻角色。", [["黑晶追獵獸", "hunter", 18800, 2520, 205, 112], ["裂影伏獸", "shadow", 10600, 2180, 180, 105]]],
    ["終端裂界", 13800, "copy", "雙核共鳴", "上下半場各有首領；首領會複寫我方最強增益，分散增益或抓複寫空檔反擊。", [["裂界鏡核", "shell", 21000, 2740, 230, 96], ["終端獵獸", "hunter", 11800, 2350, 195, 110]]]
  ];
  var sand = [100, 110, 120, 130, 140, 150, 160, 170, 180, 200, 210, 220, 230, 240, 250];
  var exp = [2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3400, 3500, 3600, 3700, 3800, 4000];
  var firstExp = [12000, 12000, 14000, 14000, 16000, 16000, 18000, 18000, 20000, 24000, 24000, 25000, 26000, 27000, 28000];
  var counterplay = [
    "前排承傷與治療；首輪先手不會額外增加行動次數。", "集中輸出破盾；只有一次重整，不需指定破盾角色。",
    "雙人治療、群盾或短減傷保護兩個目標。", "優先擊倒巢母可停止織網；其他小獸仍會進攻。",
    "群攻先削後衛或擊倒前排後準備承受一次反擊。", "拆除敵方複寫增益，或利用持續一輪的短窗口。",
    "後排站位、救援和減傷；盾吸收過半時會明示下次追擊目標。", "先處理小獸；育殼不復活、不召喚，最多使用三次。",
    "預充時破盾可使下次爆發減傷 25%；也可存盾、治療或延後敵技。", "每兩輪出現裸核窗口；破盾可以提前開窗口。"
  ];
  var teamHints = [
    "建議配置：主攻＋前排防護＋治療。疾撲先打前排，將承傷較穩的角色放在前兩格。",
    "建議配置：持續輸出＋防護或治療；破盾角色可加快通關。晶殼只重整一次，保留爆發在盾破後使用。",
    "建議配置：主攻＋雙人治療、全隊盾或短減傷。敵人會追低血者並波及另一人，只保護前排容易漏掉第二目標。",
    "建議配置：多次命中輸出＋不完全依賴主動技能的續航。優先擊倒巢母可停止織網；技能冷卻延後無法直接靠淨化還原。",
    "建議配置：群攻或可先拆後衛的輸出＋防護。單體集火也可用，但前排倒下後要接住轉盾後衛的一次反擊。",
    "建議配置：輸出＋防護，拆增益角色可作對策。敵人會複寫攻擊或防禦增益，過度依賴疊增益的隊伍須留意折射窗口。",
    "建議配置：主攻＋單人救援或減傷＋治療。先保低血後排；護盾擋下過半傷害後，下一次追擊會轉向高攻角色。",
    "建議配置：群攻或先拆小獸的主攻＋續航。先處理小獸能消除育殼收益，無須等孵巢母獸用完四次技能。",
    "建議配置：破盾或延後敵技的對策位＋雙人防護或治療。預充會打兩人，純單人保護容易漏接。",
    "養成基準：滿級四名四星、平均 C3，合理分配主攻、副攻或輔助、防護、治療。三隻敵人各有行動；先處理巡獸或援獸可降低敵方出手機會。準備裸核點名的救援，抓換相窗口輸出；此配置是難度參考，不是入場人數或星級限制。",
    "上下半場各派不同角色，建議兩隊都配置輸出與承傷/續航；側翼技能會同時壓低血角色與其隊友，避免把保護集中在另一隊。",
    "上下半場各派不同角色，建議把群攻和續航平均分配；巢母每場最多回護三次，優先擊倒巢母可停止治療與加盾。",
    "上下半場各派不同角色，建議兩隊都保留穩定輸出；指揮增益可用於短爆發，留意折光守衛的複寫。",
    "上下半場各派不同角色，兩隊都要有承傷或救援；低血角色會被追擊，護盾和治療需分配到兩隊。",
    "上下半場各派不同角色，建議每隊都有主攻與防護/治療；留意增益複寫，抓複寫空檔反擊。"
  ];
  var stages = rows.map(function (row, index) {
    return {
      id: index + 1, name: row[0], region: "試煉圖鑑", trialEdition: "1.2", trialRule: row[2],
      recommendedPower: row[1], environment: "星界試煉", environmentEffect: "依速度行動；擊倒援獸可減少敵方每回合的行動數。",
      enemyTrait: row[3], enemyTraitEffect: row[4], maxRewardClaims: 3,
      counterplay: counterplay[index] || teamHints[index], previewOnly: false,
      teamHint: teamHints[index],
      difficultyTier: index >= 9 ? "apex" : "progression",
      calibration: index >= 9 ? { benchmark: "legacy-final-challenge", level: 90, rarity: 4, averageConstellation: 3 } : undefined,
      enemies: row[5].map(function (entry, position) { return {
        name: entry[0], image: image[entry[1]], maxHp: entry[2], attack: entry[3], defense: entry[4], speed: entry[5], count: 1,
        role: position === 0 ? "首領" : "副獸", skillName: position === 0 || ["flank", "hunt"].includes(row[2]) ? row[3] : "側翼突擊",
        traitKey: position === 0 || ["flank", "hunt"].includes(row[2]) ? row[2] : "basic", row: position === 0 ? "front" : "back"
      }; }),
      reward: { starSand: sand[index], characterExp: exp[index] }, firstClearReward: { starSand: 0, characterExp: firstExp[index] }
    };
  });
  stages.slice(10).forEach(function (stage) {
    // 11–15 share the level-90, average-C3 four-star benchmark from stage 10.
    // Each half supports 1–4 distinct characters, without reuse between halves.
    if (stage.id < 15) stage.enemies.forEach(function (enemy) {
      enemy.maxHp = Math.round(enemy.maxHp * 1.45);
      enemy.attack = Math.round(enemy.attack * 1.12);
      enemy.defense = Math.round(enemy.defense * 1.05);
    });
    else stage.trialRule = "copy";
    var source = stage.enemies;
    var split = Math.max(1, Math.ceil(source.length / 2));
    stage.halves = [
      { id: "upper", name: "上半場", enemies: source.slice(0, split).map(function (enemy) { return Object.assign({}, enemy); }) },
      { id: "lower", name: "下半場", enemies: source.slice(split).map(function (enemy) { return Object.assign({}, enemy); }) }
    ];
    if (!stage.halves[1].enemies.length) stage.halves[1].enemies = source.slice(0, 1).map(function (enemy) { return Object.assign({}, enemy, { maxHp: Math.round(enemy.maxHp * .78), attack: Math.round(enemy.attack * 1.08) }); });
    stage.halves.forEach(function (half, index) {
      var support = Object.assign({}, source[index === 0 ? 1 : 0], {
        name: source[index === 0 ? 1 : 0].name + "・援獸",
        maxHp: Math.round(source[index === 0 ? 1 : 0].maxHp * .2),
        attack: Math.round(source[index === 0 ? 1 : 0].attack * .35),
        defense: Math.round(source[index === 0 ? 1 : 0].defense * .65),
        role: "援護魔物", skillName: "側翼突擊", traitKey: "basic", row: "back"
      });
      half.enemies.push(support);
      // Each half is a full-party encounter; fewer characters are allowed as a challenge.
      half.enemies.forEach(function (enemy) { enemy.maxHp = Math.round(enemy.maxHp * 1.8); enemy.attack = Math.round(enemy.attack * 1.1); });
      support.maxHp = Math.round(support.maxHp * 1.5); support.attack = Math.round(support.attack * 2);
      half.enemies.push(Object.assign({}, support, { name: support.name + "・側翼", maxHp: Math.round(support.maxHp * .75), attack: Math.round(support.attack * 1.1) }));
    });
    stage.enemies = stage.halves[0].enemies.concat(stage.halves[1].enemies);
  });
  return stages;
}));
