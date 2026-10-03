(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StarshipTrial10 = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // 1.0 trial simulations use only identified monsters from the 1.0
  // catalogue. These encounters are combat exercises, not additional story canon.
  var species = {
    giant: { name: "黑晶巨獸（原生型）", image: "./assets/enemies/opening-beast.webp", speed: 72 },
    crystal: { name: "黑晶異變巨獸", image: "./assets/enemies/black-crystal-beast.webp", speed: 78 },
    spine: { name: "黑晶棘背獸", image: "./assets/enemies/black-crystal-spine-beast.webp", speed: 88 },
    horn: { name: "苔角行獸", image: "./assets/enemies/moss-horn-beast.webp", speed: 88 },
    spider: { name: "鳴棘蛛", image: "./assets/enemies/resonant-spider.webp", speed: 104 },
    mother: { name: "鳴棘蛛巢母", image: "./assets/enemies/spider-mother.webp", speed: 76 }
  };
  var route = [
    ["谷口足跡", "南驛山谷", "ambush", "spine", "spine"],
    ["舊祭壇警戒", "南驛山谷", "mark", "giant", "spine"],
    ["黑晶前肢", "南驛山谷", "shield", "crystal", "giant"],
    ["林線轉角", "獸靈之村", "ambush", "spine", "spine"],
    ["巡林回撤", "獸靈之村", "multi", "spine", "crystal"],
    ["晶棘測線", "獸靈之村", "noise", "spine", "spine"],
    ["舊石碑外圈", "獸靈之村", "shield", "giant", "spine"],
    ["村口守備", "獸靈之村", "guard", "crystal", "spine"],
    ["林路分流", "獸靈之村", "mark", "spine", "spine"],
    ["晶棘護區", "獸靈之村", "shield", "crystal", "spine"],
    ["商路接應", "白鐘城", "ambush", "spine", "spine"],
    ["東門警戒", "白鐘城", "multi", "crystal", "spine"],
    ["工坊外緣", "白鐘城", "noise", "spine", "spine"],
    ["救援通道", "白鐘城", "guard", "giant", "spine"],
    ["安全線重測", "白鐘城", "shield", "crystal", "spine"],
    ["夜間輪值", "白鐘城", "mark", "spine", "spine"],
    ["搬運線撤退", "白鐘城", "multi", "giant", "spine"],
    ["黑晶觀察", "白鐘城", "copy", "crystal", "spine"],
    ["疏散窗口", "白鐘城", "guard", "spine", "spine"],
    ["分會聯合演練", "白鐘城", "shield", "crystal", "crystal"],
    ["北門補給", "北方商路", "ambush", "spine", "spine"],
    ["雨後路基", "北方商路", "mark", "giant", "spine"],
    ["失衡林帶", "北方商路", "noise", "spine", "spine"],
    ["同行掩護", "北方商路", "guard", "crystal", "giant"],
    ["臨時撤離線", "北方商路", "shield", "crystal", "spine"],
    ["遠影重驗", "北方商路", "copy", "crystal", "giant"],
    ["多點接應", "北方商路", "multi", "spine", "spine"],
    ["界痕殘留", "北方商路", "mark", "crystal", "spine"],
    ["交接前一夜", "北方商路", "guard", "crystal", "spine"],
    ["第一季圖鑑演練", "北方商路", "finale", "crystal", "crystal"]
  ];
  var effects = {
    ambush: ["先手巡獵", "敵方第一輪速度提高，先安排守衛。"],
    mark: ["追蹤弱點", "敵方優先追擊低生命角色。"],
    shield: ["護區與外殼", "敵方開場帶護盾，先破盾再爆發。"],
    multi: ["集中施壓", "敵方會集中火力，治療與掩護要互相配合。"],
    noise: ["晶棘干擾", "隊伍技能起手延遲一輪。"],
    guard: ["守備輪替", "前排敵人保護後排，先調整目標順序。"],
    copy: ["黑晶折射", "敵方開場護盾會吸收一次爆發。"],
    finale: ["多線回撤", "敵方鎖定虛弱目標，技能削減護盾並短暫壓低治療；必須分配防護與輸出。"]
  };
  // 建議戰力對應一般隊伍可合理通關的面板，並非進場門檻或 50 回合保證值。
  // 以不同等級 C0 隊伍實測校準，避免中後段面板建議遠高於實際通關需求。
  var powerAnchors = [[1, 900], [10, 2000], [15, 2500], [20, 3200], [25, 5500], [29, 7300], [30, 8500]];
  function recommendedPowerFor(id) {
    for (var i = 1; i < powerAnchors.length; i += 1) {
      if (id > powerAnchors[i][0]) continue;
      var previous = powerAnchors[i - 1];
      var next = powerAnchors[i];
      return Math.round((previous[1] + (next[1] - previous[1]) * (id - previous[0]) / (next[0] - previous[0])) / 100) * 100;
    }
    return powerAnchors[powerAnchors.length - 1][1];
  }
  var stages = route.map(function (row, index) {
    var id = index + 1;
    var hp = Math.round((1300 + index * 160 + Math.max(0, 5 - index) * 120) * (1 + index * 0.01));
    var attack = Math.round((72 + index * 8) * (1 + index * 0.3 / 29) * (1 + index * 0.025));
    var defense = 48 + index * 5;
    var boss = id % 5 === 0;
    var bossHp = { 5: 2.5, 10: 3.4, 15: 1.95, 20: 1.8, 25: 1.5, 30: 1.1 };
    // 終段按機制校準有效耐久，使難度逐關逼近終局，而非只在第30關跳升。
    var lateHpScale = { 21: 1.3, 22: 1.45, 23: 1.4, 24: 1.34, 25: 2, 26: 1.32, 27: 1.6, 28: 1.7, 29: 1.62, 30: 2.64 };
    var names = [row[3], row[4]];
    var enemies = names.map(function (key, position) {
      var monster = species[key];
      return {
        name: monster.name, image: monster.image,
        maxHp: Math.round(hp * (boss ? (position === 0 ? bossHp[id] : id === 30 ? 1.1 : 1.3) : 1.5 * (id >= 21 ? 1.35 : id >= 2 && id <= 10 ? 1.18 : 1)) * (lateHpScale[id] || 1) * (1 + index * 0.06) * (id === 30 ? 1.1 : 1)),
        attack: Math.round(attack * (boss && position === 0 ? 1.08 : 1) * (1 + index * 0.045)),
        defense: Math.round(defense * (boss && position === 0 ? 1.12 : 1)),
        speed: monster.speed + Math.min(25, Math.floor(index / 3)), count: 1
      };
    });
    if (names[0] === names[1] && !boss) { enemies[0].count = 2; enemies.pop(); }
    return {
      id: id, name: row[0], region: row[1], recommendedPower: recommendedPowerFor(id), targetPower: id === 30 ? 10500 : undefined,
      environment: "圖鑑模擬場", environmentEffect: "此關為訓練模擬，不代表主線新增遭遇。",
      modifiers: { enemyAttack: id === 30 ? .95 : id === 29 ? .85 : id >= 21 ? (boss ? 1.09 : 1.07) : boss ? 1.04 : id >= 2 && id <= 10 ? 1.08 : 1, enemyDefense: boss ? 1.03 : 1 },
      enemyTrait: effects[row[2]][0], enemyTraitEffect: effects[row[2]][1], trialRule: row[2],
      milestone: id === 10 ? "trial10Choice" : undefined,
      finalStage: id === 30,
      enemies: enemies,
      reward: { starSand: 75, characterExp: 1800 }
    };
  });
  // 首領關有額外機制，但下一關的基礎耐久不能倒退；否則玩家會感到難度重置。
  // 逐關以整隊敵方生命作下限，保留原本攻擊、機制和首領倍率的差異。
  var previousTotalHp = 0;
  stages.forEach(function (stage) {
    var currentTotalHp = stage.enemies.reduce(function (total, enemy) { return total + enemy.maxHp * (enemy.count || 1); }, 0);
    var minimumTotalHp = Math.ceil(previousTotalHp * 1.025);
    if (currentTotalHp < minimumTotalHp) {
      var scale = minimumTotalHp / currentTotalHp;
      stage.enemies.forEach(function (enemy) { enemy.maxHp = Math.ceil(enemy.maxHp * scale); });
      currentTotalHp = stage.enemies.reduce(function (total, enemy) { return total + enemy.maxHp * (enemy.count || 1); }, 0);
    }
    previousTotalHp = currentTotalHp;
  });
  return stages;
}));
