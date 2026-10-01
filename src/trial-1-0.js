(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StarshipTrial10 = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // 1.0 trial simulations use only identified monsters from the 1.0
  // catalogue. These encounters are combat exercises, not additional story canon.
  var species = {
    giant: { name: "開場巨獸原生型", image: "./assets/enemies/opening-beast.webp", speed: 72 },
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
    finale: ["多線回撤", "敵方同時護區與追擊，必須分配治療和輸出。"]
  };
  return route.map(function (row, index) {
    var id = index + 1;
    var hp = 1300 + index * 160 + Math.max(0, 5 - index) * 120;
    var attack = Math.round((72 + index * 8) * (1 + index * 0.3 / 29));
    var defense = 48 + index * 5;
    var boss = id % 5 === 0;
    var bossHp = { 5: 3.5, 10: 4.75, 15: 2.7, 20: 2.5, 25: 2.1, 30: 1.5 };
    var names = [row[3], row[4]];
    var enemies = names.map(function (key, position) {
      var monster = species[key];
      return {
        name: monster.name, image: monster.image,
        maxHp: Math.round(hp * (boss ? (position === 0 ? bossHp[id] : 1.3) : 1.5)),
        attack: Math.round(attack * (boss && position === 0 ? 1.08 : 1)),
        defense: Math.round(defense * (boss && position === 0 ? 1.12 : 1)),
        speed: monster.speed + Math.min(25, Math.floor(index / 3)), count: 1
      };
    });
    if (names[0] === names[1] && !boss) { enemies[0].count = 2; enemies.pop(); }
    return {
      id: id, name: row[0], region: row[1], recommendedPower: id <= 10 ? Math.round(2400 + index * 2100 / 9) : Math.round(4500 + (id - 10) * 77),
      environment: "圖鑑模擬場", environmentEffect: "此關為訓練模擬，不代表主線新增遭遇。",
      modifiers: boss ? { enemyAttack: 1.04, enemyDefense: 1.03 } : {},
      enemyTrait: effects[row[2]][0], enemyTraitEffect: effects[row[2]][1], trialRule: row[2],
      milestone: id === 10 ? "trial10Choice" : undefined,
      finalStage: id === 30,
      enemies: enemies,
      reward: { starSand: 75, characterExp: 1800 }
    };
  });
}));
