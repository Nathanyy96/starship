"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { simulateBattle, teamPower, damageReductionForDefense } = require("../src/battle.js");
const { cards, characterBattleStats, trialStages, trialReward, trialMaxRewards, bossStages, voyageBattleStages, voyageConfig } = require("../src/data.js");

test("瑟蕾雅 C2 只計同輪不同隊友，C6 保留標記期間的累積人數", () => {
  const fs = require("node:fs");
  const vm = require("node:vm");
  const source = fs.readFileSync(require.resolve("../src/battle.js"), "utf8").replace(
    "    simulateBattle: simulateBattle,",
    "    audit: { setCombat: function (value) { combat = value; }, afterHit: afterHit }, simulateBattle: simulateBattle,"
  );
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(source, sandbox);
  const audit = sandbox.module.exports.audit;
  const owner = { id: "celesia", constellation: 6, hp: 100, maxHp: 100, attack: 100, defense: 0, effects: [], skillCooldown: 2 };
  const a = { id: "a", hp: 100, attack: 10 };
  const b = { id: "b", hp: 100, attack: 10 };
  const c = { id: "c", hp: 100, attack: 10 };
  const enemy = { id: "enemy", isEnemy: true, hp: 10000, maxHp: 10000, defense: 0, shield: 0, effects: [], coreMarks: { celesia: { until: 4, allies: [] } } };
  const combat = { round: 1, team: [owner, a, b, c], enemies: [enemy], logs: [], followup: false, activeActor: null };
  audit.setCombat(combat);
  audit.afterHit(a, enemy, false, 100);
  combat.round = 2;
  audit.afterHit(b, enemy, false, 100);
  assert.equal(combat.logs.filter(line => line.includes("同輪第二位")).length, 0);
  audit.afterHit(c, enemy, false, 100);
  assert.equal(combat.logs.filter(line => line.includes("同輪第二位")).length, 1);
  assert.equal(combat.logs.filter(line => line.includes("同輪三人協同追擊")).length, 1);
  audit.afterHit(c, enemy, false, 100);
  assert.equal(combat.logs.filter(line => line.includes("同輪第二位")).length, 1);
  assert.equal(combat.logs.filter(line => line.includes("同輪三人協同追擊")).length, 1);
});

test("艾妲 C6 須有兩名滿血受校準者才加全隊護盾", () => {
  const fs = require("node:fs");
  const vm = require("node:vm");
  const source = fs.readFileSync(require.resolve("../src/battle.js"), "utf8").replace(
    "    simulateBattle: simulateBattle,",
    "    audit: { setCombat: function (value) { combat = value; }, useSignatureSkill: useSignatureSkill }, simulateBattle: simulateBattle,"
  );
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(source, sandbox);
  const audit = sandbox.module.exports.audit;
  const actor = { id: "eda", hp: 1000, maxHp: 1000, attack: 100, defense: 0, constellation: 6, signature: { type: "support", shield: .09, cleanse: true, duration: 2 }, skillName: "校準", effects: [], shield: 0 };
  const ally = { id: "ally", hp: 1000, maxHp: 1000, effects: [], shield: 0 };
  const combat = { round: 1, team: [actor], enemies: [], logs: [] };
  audit.setCombat(combat);
  audit.useSignatureSkill(actor, combat.team, [], combat.logs);
  assert.equal(actor.shield, 105);
  actor.shield = 0;
  combat.team = [actor, ally];
  audit.useSignatureSkill(actor, combat.team, [], combat.logs);
  assert.equal(actor.shield, 145);
  assert.equal(ally.shield, 145);
});

test.skip("舊版命座敘述使用角色資料中的正式譯名", () => {
  for (const id of ["eda", "ruida", "yuan"]) {
    const description = [characterBattleStats[id].skillEffect, ...characterBattleStats[id].constellations].join(" ");
    assert.ok(description.includes(cards[id].name), id + " 應使用正式名稱「" + cards[id].name + "」");
  }
  const allDescriptions = Object.values(characterBattleStats).flatMap((kit) => [kit.skillEffect || "", ...(kit.constellations || [])]).join(" ");
  assert.doesNotMatch(allDescriptions, /艾達|瑞達|袁最大生命/);
});

test("持續治療按標示輪數結算，護送在期限內可分攤多次傷害", () => {
  const stage = { id: 990, name: "期限驗證", trialRule: "basic", enemies: [{ name: "測試獸", maxHp: 2500, attack: 450, defense: 0, speed: 150, count: 1 }] };
  const stats = {
    ally: { rarity: 3, role: "射手", maxHp: 600, attack: 200, defense: 0, speed: 100, skillPower: 1.1, skillName: "試射" },
    ruida: { ...characterBattleStats.ruida, maxHp: 2000, attack: 200, defense: 0, speed: 180 },
    lia: { ...characterBattleStats.lia, maxHp: 1500, attack: 1, defense: 0, speed: 90 }
  };
  const escorted = simulateBattle({ team: ["ally", "ruida"], stats, stage, rng: () => .5 });
  assert.ok(escorted.logs.filter(line => line.includes("ruida 護送 ally，分攤")).length >= 2);
  const healed = simulateBattle({ team: ["ally", "lia"], stats, stage, rng: () => .5 });
  assert.ok(healed.logs.filter(line => line.includes("持續治療回復")).length >= 2);
});

test("折射敵人只複寫玩家正面增益一次，並記錄複寫結果", () => {
  const stage = { id: 989, name: "折射驗證", trialRule: "copy", enemies: [{ name: "測試獸", maxHp: 2500, attack: 20, defense: 0, speed: 100, count: 1 }] };
  const stats = {
    support: { rarity: 4, role: "指揮", maxHp: 1000, attack: 1, defense: 0, speed: 200, skillName: "號令" },
    hit: { rarity: 4, role: "射手", maxHp: 1000, attack: 700, defense: 0, speed: 150, skillPower: 1.1, skillName: "試射" }
  };
  const result = simulateBattle({ team: ["support", "hit"], stats, stage, rng: () => .5 });
  assert.equal(result.logs.filter(line => line.includes("複寫我方一項增益")).length, 1);
  assert.ok(result.logs.some(line => line.includes("獲得攻擊加成")));
});

test("多點施壓的第二擊命中另一名玩家，而非敵方自己", () => {
  const stage = { id: 988, name: "多點驗證", trialRule: "multi", enemies: [{ name: "測試獸", maxHp: 2500, attack: 100, defense: 0, speed: 200, count: 1 }] };
  const stats = Object.fromEntries(["front", "back"].map(id => [id, { rarity: 3, role: "射手", maxHp: 1000, attack: 1, defense: 0, speed: 1, skillPower: 1, skillName: "試射" }]));
  const result = simulateBattle({ team: ["front", "back"], stats, stage, rng: () => .5 });
  assert.ok(result.logs.some(line => line.includes("多點攻勢波及 back")));
  assert.ok(result.logs.every(line => !line.includes("多點攻勢波及 測試獸")));
});

test("高等防禦超過舊上限後仍能降低傷害，防禦增益有實際收益", () => {
  assert.ok(damageReductionForDefense(565) > damageReductionForDefense(260.4));
  assert.ok(damageReductionForDefense(792) > damageReductionForDefense(565));
  assert.ok(damageReductionForDefense(792 * 1.15) > damageReductionForDefense(792));
  assert.ok(damageReductionForDefense(1200) < .8);
});

test.skip("舊版 Hina C1 的速度增益", () => {
  const stage = { id: 991, name: "速度測試", trialRule: "basic", enemies: [{ name: "測試獸", maxHp: 3000, attack: 1, defense: 0, speed: 103, count: 1 }] };
  const actions = (constellation) => {
    const hina = { ...characterBattleStats.hina, speed: 100, attack: 100, maxHp: 1000, defense: 0, constellation };
    return simulateBattle({ team: ["hina"], stats: { hina }, stage, rng: () => .5 }).logs.filter((line) => /^(hina|測試獸) (使用|發動)/.test(line));
  };
  assert.match(actions(0)[2], /^測試獸 /);
  assert.match(actions(1)[2], /^hina /);
});

test.skip("舊版 Hina C3 技能倍率 180%", () => {
  const stage = { id: 994, name: "倍率測試", trialRule: "basic", enemies: [{ name: "測試獸", maxHp: 1000, attack: 1, defense: 0, speed: 1, count: 1 }] };
  const skillDamage = (constellation) => {
    const hina = { ...characterBattleStats.hina, maxHp: 1000, attack: 100, defense: 0, speed: 200, constellation };
    const line = simulateBattle({ team: ["hina"], stats: { hina }, stage, rng: () => .5 }).logs.find((item) => item.includes("弦音標記"));
    return Number(line.match(/造成 (\d+) 傷害/)[1]);
  };
  assert.equal(skillDamage(0), 147);
  assert.equal(skillDamage(3), 176);
});

test.skip("舊版 Siyeon C2 的延遲回音護盾", () => {
  const stats = {
    siyeon: { ...characterBattleStats.siyeon, maxHp: 2000, attack: 1, defense: 0, speed: 100, constellation: 2 },
    tank: { rarity: 4, role: "重裝", maxHp: 8000, attack: 1, defense: 0, speed: 1, skillName: "防護" },
    other: { rarity: 4, role: "射手", maxHp: 8000, attack: 1, defense: 0, speed: 1 }
  };
  const stage = { id: 995, name: "回音測試", trialRule: "basic", enemies: [{ name: "測試獸", maxHp: 5000, attack: 4000, defense: 0, speed: 200, count: 1 }] };
  const result = simulateBattle({ team: ["tank", "other", "siyeon"], stats, stage, rng: () => .5 });
  assert.ok(result.logs.some((line) => /siyeon 的回音為 tank 回復 \d+ HP，追加 \d+ 護盾/.test(line)));
});

test.skip("舊版 Hina 技能傷害增益", () => {
  const stage = { id: 992, name: "攻擊增益測試", trialRule: "basic", enemies: [{ name: "測試獸", maxHp: 1000, attack: 1, defense: 0, speed: 1, count: 1 }] };
  const stats = {
    support: { rarity: 4, role: "指揮", maxHp: 1000, attack: 1, defense: 0, speed: 200, skillName: "號令" },
    hina: { ...characterBattleStats.hina, maxHp: 1000, attack: 100, defense: 0, speed: 100, constellation: 0 }
  };
  const result = simulateBattle({ team: ["support", "hina"], stats, stage, rng: () => .5 });
  assert.ok(result.logs.includes("hina 使用「弦音標記」，造成 174 傷害。"));
});

test.skip("舊版曜澤減速與 Hina 行動順序", () => {
  const stage = { id: 993, name: "守望測試", trialRule: "basic", enemies: [{ name: "測試獸", maxHp: 1000, attack: 1, defense: 0, speed: 100, count: 1 }] };
  const stats = {
    yaoze: { ...characterBattleStats.yaoze, speed: 200, attack: 1, maxHp: 1000, defense: 0, constellation: 0 },
    hina: { ...characterBattleStats.hina, speed: 95, attack: 100, maxHp: 1000, defense: 0, constellation: 0 }
  };
  const result = simulateBattle({ team: ["yaoze", "hina"], stats, stage, rng: () => .5 });
  assert.ok(result.logs.some((line) => line.includes("白帆守望") && line.includes("yaoze、hina") && line.includes("敵方速度下降")));
  const actions = result.logs.filter((line) => /^(yaoze|hina|測試獸) (使用|發動)/.test(line));
  assert.match(actions[1], /^測試獸 /);
  assert.match(actions[4], /^hina /);
});

test("敵方技能命中玩家前排，戰報保留前後排格位", () => {
  const stats = Object.fromEntries(["front", "second", "rear"].map((id) => [id, { rarity: 3, role: "射手", maxHp: 1000, attack: 1000, defense: 0, speed: 1, skillPower: 2, skillName: "試射" }]));
  const battle = simulateBattle({
    team: ["front", "second", "rear"], stats, rng: () => .5,
    stage: { id: 999, name: "目標檢查", trialRule: "finale", enemies: [{ name: "測試獸", maxHp: 100, attack: 10, defense: 0, speed: 200, count: 1 }] }
  });
  assert.deepEqual(battle.team.map((unit) => [unit.slot, unit.row]), [[1, "front"], [2, "front"], [3, "back"]]);
  assert.ok(battle.logs.some((line) => /測試獸 發動.+對 front 造成/.test(line)));
  assert.ok(battle.logs.every((line) => !/測試獸 發動.+對 測試獸 造成/.test(line)));
});

test("鎖定虛弱目標的敵方技能可越過前排", () => {
  const attacker = { rarity: 3, role: "射手", maxHp: 1000, attack: 1000, defense: 0, speed: 1, skillPower: 2, skillName: "試射" };
  const rear = { rarity: 3, role: "守門", maxHp: 1000, attack: 1, defense: 0, speed: 300, skillName: "負載", signature: { type: "guard", shield: .1, guard: .3, burden: .08, duration: 2, cooldown: 3, targets: 1 } };
  const battle = simulateBattle({
    team: ["front", "second", "rear"], stats: { front: attacker, second: attacker, rear }, rng: () => .5,
    stage: { id: 998, name: "虛弱鎖定檢查", trialRule: "finale", enemies: [{ name: "測試獸", maxHp: 100, attack: 10, defense: 0, speed: 200, count: 1 }] }
  });
  assert.ok(battle.logs.some((line) => /測試獸 發動.+對 rear 造成/.test(line)));
});

test("星界試煉使用最多四名角色並以自動戰鬥回傳戰報", () => {
  const battle = simulateBattle({
    team: ["celesia", "reyn", "lia", "isar", "rena"],
    stats: characterBattleStats,
    stage: trialStages[0],
    rng: () => 0.5
  });
  assert.equal(battle.team.length, 4);
  assert.equal(battle.stageId, 1);
  assert.equal(typeof battle.won, "boolean");
  assert.ok(battle.logs.length > 0);
  assert.equal(battle.reward.starSand, trialReward.starSand);
  assert.equal(battle.reward.characterExp, trialReward.characterExp);
  assert.equal(trialReward.starSand, 75);
  assert.equal(trialReward.characterExp, 1800);
  assert.equal(battle.environment, trialStages[0].environment);
  assert.equal(battle.enemyTrait, trialStages[0].enemyTrait);
  assert.ok(battle.enemies.every((enemy) => enemy.image === trialStages[0].enemies[0].image));
  assert.equal(trialMaxRewards, 20);
});

test("星界試煉隊伍戰力只計算資料層中已開放角色", () => {
  assert.equal(teamPower(["celesia", "reyn"], characterBattleStats), 926);
});

test.skip("舊版 Chodan 合拍提示", () => {
  const stage = { id: 1, name: "合拍測試", trialRule: "basic", enemies: [{ name: "測試敵人", maxHp: 5000, attack: 1, defense: 0, speed: 1, count: 1 }] };
  const team = ["chodan", "reyn", "siyeon", "magenta"];
  const stats = Object.fromEntries(team.map((id) => [id, { ...characterBattleStats[id], constellation: id === "chodan" ? 6 : 0 }]));
  const battle = simulateBattle({ team, stats, stage, rng: () => 0.5, maxRounds: 60 });
  assert.ok(battle.logs.some((line) => line.includes("防護合拍讓")), "治療技能應讓受益隊友獲得 C2 減傷");
  assert.ok(battle.logs.some((line) => line.includes("首次合拍") && line.includes("冷卻縮短")), "C4 應在首次合拍時觸發");
  assert.ok(battle.logs.some((line) => line.includes("三位不同隊友完成合拍")), "C6 應要求三位不同隊友技能");
});

test("星界試煉擴充為 30 關並維持逐關升難", () => {
  assert.equal(trialStages.length, 30);
  assert.deepEqual(trialStages.map((stage) => stage.id), Array.from({ length: 30 }, (_, index) => index + 1));
  assert.ok(trialStages.every((stage, index) => index === 0 || stage.recommendedPower > trialStages[index - 1].recommendedPower));
  const totalHp = (stage) => stage.enemies.reduce((sum, enemy) => sum + enemy.maxHp * (enemy.count || 1), 0);
  const totalAttack = (stage) => stage.enemies.reduce((sum, enemy) => sum + enemy.attack * (enemy.count || 1), 0);
  assert.ok(trialStages.every((stage, index) => index === 0 || totalHp(stage) > totalHp(trialStages[index - 1])), "30 關敵方基礎耐久不可倒退");
  assert.ok(trialStages.every((stage, index) => index === 0 || totalAttack(stage) > totalAttack(trialStages[index - 1])), "30 關敵方攻擊不可倒退");
  assert.equal(trialStages[29].finalStage, true);
  assert.ok(trialStages.every((stage) => stage.environment && stage.enemyTrait && stage.modifiers));
});

test("正式試煉 30 關以角色成長分段校準", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const team = ["celesia", "reyn", "lia", "isar"];
  function run(level, stage) {
    const characterProgress = Object.fromEntries(team.map((id) => [id, { level, constellation: 0 }]));
    return simulateBattle({ team, stats: buildEffectiveStats(characterBattleStats, { characterProgress }), stage, rng: () => 0.5 });
  }
  assert.equal(trialStages[0].recommendedPower, 900);
  assert.equal(trialStages[9].recommendedPower, 2000);
  assert.equal(trialStages[19].recommendedPower, 3200);
  assert.equal(trialStages[24].recommendedPower, 5500);
  assert.equal(trialStages[29].recommendedPower, 8500);
  assert.equal(trialStages[29].targetPower, 10500);
  const stage20Team = ["celesia", "chodan", "magenta", "lia"];
  const stage20Stats = buildEffectiveStats(characterBattleStats, { characterProgress: Object.fromEntries(stage20Team.map((id) => [id, { level: 20, constellation: 0 }])) });
  assert.ok(teamPower(stage20Team, stage20Stats) < trialStages[19].recommendedPower);
  assert.equal(simulateBattle({ team: stage20Team, stats: stage20Stats, stage: trialStages[19], rng: () => .5 }).won, false);
  const grownStats = buildEffectiveStats(characterBattleStats, { characterProgress: Object.fromEntries(stage20Team.map((id) => [id, { level: 40, constellation: id === "lia" ? 5 : 0 }])) });
  assert.equal(simulateBattle({ team: stage20Team, stats: grownStats, stage: trialStages[19], rng: () => .5 }).won, true);
  assert.equal(run(1, trialStages[0]).rounds >= 8, true);
  assert.equal(run(60, trialStages[9]).rounds >= 15 && run(60, trialStages[9]).rounds <= 45, true);
  assert.equal(run(45, trialStages[9]).rounds <= 60, true);
  assert.equal(run(90, trialStages[29]).won, false);
  assert.equal(run(25, trialStages[29]).won, false);
});

test("試煉終段以滿等四星四至五命隊伍校準", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const teams = [
    ["celesia", "magenta", "hina", "siyeon"],
    ["celesia", "harlow", "siyeon", "magenta"],
    ["chodan", "magenta", "hina", "siyeon"]
  ];
  for (const team of teams) {
    const characterProgress = Object.fromEntries(team.map((id) => [id, { level: 90, constellation: 5 }]));
    const stats = buildEffectiveStats(characterBattleStats, { characterProgress });
    const last = simulateBattle({ team, stats, stage: trialStages[29], rng: () => .5 });
    assert.ok(teamPower(team, stats) >= 10000 && teamPower(team, stats) <= 12000);
    assert.equal(last.won, true, team.join(","));
    assert.ok(last.rounds < 180, team.join(",") + " 不得逾時");
    const c4Progress = Object.fromEntries(team.map((id) => [id, { level: 90, constellation: 4 }]));
    const c4Stats = buildEffectiveStats(characterBattleStats, { characterProgress: c4Progress });
    const c4Result = simulateBattle({ team, stats: c4Stats, stage: trialStages[29], rng: () => .5 });
    assert.ok(c4Result.rounds < 180, team.join(",") + " C4 不得逾時");
    assert.ok(last.rounds <= c4Result.rounds || !c4Result.won, team.join(",") + " C5 應有可見收益");
  }
  const lowTeam = teams[0];
  const lowProgress = Object.fromEntries(lowTeam.map((id) => [id, { level: 60, constellation: 0 }]));
  const lowStats = buildEffectiveStats(characterBattleStats, { characterProgress: lowProgress });
  assert.equal(simulateBattle({ team: lowTeam, stats: lowStats, stage: trialStages[29], rng: () => .5 }).won, false);
  const fullProgress = Object.fromEntries(lowTeam.map((id) => [id, { level: 90, constellation: 6 }]));
  const fullStats = buildEffectiveStats(characterBattleStats, { characterProgress: fullProgress });
  for (const seed of [.1, .5, .9]) {
    const result = simulateBattle({ team: lowTeam, stats: fullStats, stage: trialStages[29], rng: () => seed });
    assert.equal(result.won, true);
    assert.ok(result.rounds <= 45, "滿命四星不可拖到演算上限：" + result.rounds);
  }
  const threeStarTeam = ["reyn", "lia", "isar", "cenwu"];
  const threeStarProgress = Object.fromEntries(threeStarTeam.map((id) => [id, { level: 90, constellation: 6 }]));
  const threeStarStats = buildEffectiveStats(characterBattleStats, { characterProgress: threeStarProgress });
  const threeStarResult = simulateBattle({ team: threeStarTeam, stats: threeStarStats, stage: trialStages[29], rng: () => .5 });
  assert.equal(threeStarResult.timedOut, false, "純三星隊伍不應被護盾拖至演算上限");
  const healTeam = ["lia", "yuan", "siyeon", "elorna"];
  const healProgress = Object.fromEntries(healTeam.map((id) => [id, { level: 90, constellation: 6, activeForm: "deepwater" }]));
  const healStats = buildEffectiveStats(characterBattleStats, { characterProgress: healProgress });
  const healOnly = simulateBattle({ team: healTeam, stats: healStats, stage: trialStages[29], rng: () => .1 });
  assert.ok(healOnly.rounds > 120, "偏治療極端隊伍超過 120 回合是正常選擇結果");
  assert.equal(healOnly.roundLimit, 180);
});

test("試煉21–29關循序接近終局，正常編隊不因單一關卡逾時", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const teams = [
    ["celesia", "harlow", "siyeon", "magenta"],
    ["chodan", "magenta", "hina", "siyeon"]
  ];
  for (const team of teams) {
    for (const [stageNumber, level, low, high] of [[21, 75, 14, 45], [25, 80, 24, 65], [29, 90, 25, 70]]) {
      const constellation = stageNumber === 21 ? 1 : 2;
      const characterProgress = Object.fromEntries(team.map((id) => [id, { level, constellation }]));
      const stats = buildEffectiveStats(characterBattleStats, { characterProgress });
      for (const seed of [.1, .5, .9]) {
        const result = simulateBattle({ team, stats, stage: trialStages[stageNumber - 1], rng: () => seed });
        assert.equal(result.won, true, team.join(",") + " stage " + stageNumber + " seed " + seed);
        assert.ok(result.rounds >= low && result.rounds <= high, team.join(",") + " stage " + stageNumber + " rounds " + result.rounds);
      }
    }
  }
});

test("現行三十關在充分培養後都能完成且不會無限拖延", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const team = ["celesia", "chodan", "magenta", "lia"];
  const characterProgress = Object.fromEntries(team.map((id) => [id, { level: 90, constellation: 5 }]));
  const stats = buildEffectiveStats(characterBattleStats, { characterProgress });
  for (const stage of trialStages) {
    const result = simulateBattle({ team, stats, stage, rng: () => .5 });
    assert.equal(result.won, true, "stage " + stage.id + " Lv90 C5");
    assert.ok(result.rounds < 120, "stage " + stage.id + " rounds " + result.rounds);
  }
});

test("現行1.0可取得角色也能組成符合終關基準的隊伍", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const team = ["celesia", "chodan", "magenta", "lia"];
  const characterProgress = Object.fromEntries(team.map((id) => [id, { level: 90, constellation: 5 }]));
  const stats = buildEffectiveStats(characterBattleStats, { characterProgress });
  const result = simulateBattle({ team, stats, stage: trialStages[29], rng: () => .5 });
  assert.equal(result.won, true);
  assert.ok(result.rounds < 120);
});

test("第一大版本同職能替換在終關沒有異常快殺或正常輸出逾時", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const groups = [
    { base: ["celesia", "harlow", "siyeon"], ids: ["magenta", "hina", "isar", "rena"] },
    { base: ["celesia", "magenta", "siyeon"], ids: ["reyn", "ruida", "harlow", "rovienne", "cenwu", "veyra", "eda", "mave", "chodan", "elorna"] },
    { base: ["celesia", "magenta", "harlow"], ids: ["lia", "yuan", "siyeon", "elorna"] }
  ];
  for (const group of groups) for (const id of group.ids) {
    const team = [...group.base, id];
    const characterProgress = Object.fromEntries(team.map((unitId) => [unitId, { level: 90, constellation: 5, activeForm: id === "elorna" && group.base.includes("harlow") ? "deepwater" : "land" }]));
    const stats = buildEffectiveStats(characterBattleStats, { characterProgress });
    const result = simulateBattle({ team, stats, stage: trialStages[29], rng: () => .5 });
    assert.equal(result.won, true, id);
    assert.ok(result.rounds >= 30 && result.rounds < 180, id + "：" + result.rounds);
  }
});

test("突破材料 Boss 隨高等成長調整且低階材料仍可取得", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const team = ["celesia", "chodan", "magenta", "lia"];
  const progress = Object.fromEntries(team.map((id) => [id, { level: 80, constellation: 2 }]));
  const stats = buildEffectiveStats(characterBattleStats, { characterProgress: progress });
  const results = bossStages.map((stage) => simulateBattle({ team, stats, stage, rng: () => .5 }));
  assert.ok(results.every((result) => result.won && result.rounds < 180));
  assert.ok(results[0].rounds >= 8 && results[0].rounds <= 20);
  assert.ok(results.at(-1).rounds >= 20 && results.at(-1).rounds <= 45);
  assert.ok(bossStages[0].recommendedPower < bossStages.at(-1).recommendedPower);
});

test("星海迷航使用獨立休閒敵群，不直接借用高難度試煉終幕", () => {
  const finalNode = voyageConfig.nodes.find((node) => node.id === "voyage-final");
  const voyageFinal = voyageBattleStages.find((stage) => stage.id === finalNode.stageId);
  assert.ok(voyageFinal);
  assert.equal(voyageFinal.recommendedPower, 2600);
  assert.ok(voyageFinal.recommendedPower < trialStages[29].recommendedPower);
  assert.equal(voyageFinal.modifiers.enemyAttack, 0.86);
  assert.equal(voyageFinal.finalStage, true);
});

test("戰鬥達到演算上限時回傳 timeout，不誤判成失敗或通關", () => {
  const battle = simulateBattle({
    team: ["test-unit"],
    stats: { "test-unit": { maxHp: 1000, attack: 1, defense: 999, speed: 1, role: "tank", skillName: "測試", skillPower: 1 } },
    stage: { id: "timeout-test", name: "超時測試", maxRounds: 60, modifiers: { teamAttack: 0.01, enemyAttack: 0.01 }, enemies: [{ name: "護盾核", maxHp: 999999, attack: 1, defense: 99999, speed: 1, count: 1 }] },
    rng: () => 0.5
  });
  assert.equal(battle.won, false);
  assert.equal(battle.status, "timeout");
  assert.equal(battle.timedOut, true);
  assert.equal(battle.rounds, 60);
  assert.match(battle.logs.at(-1), /演算保護上限/);
});

test("試煉全部使用 1.0 已出場的圖鑑魔物與新棘背獸", () => {
  const names = new Set(trialStages.flatMap((stage) => stage.enemies.map((enemy) => enemy.name)));
  assert.deepEqual([...names].sort(), ["黑晶巨獸（原生型）", "黑晶異變巨獸", "黑晶棘背獸"].sort());
  assert.ok(trialStages.every((stage) => stage.enemies.every((enemy) => enemy.image && enemy.image.endsWith(".webp"))));
  assert.ok(trialStages.every((stage) => stage.environmentEffect.includes("訓練模擬")));
});

test("第一大版本後續十名角色有完整技能、命座與受控成長", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const ids = ["cenwu", "ruida", "yuan", "veyra", "harlow", "rena", "elorna", "eda", "mave", "rovienne"];
  assert.ok(ids.every((id) => characterBattleStats[id].signature && characterBattleStats[id].constellations.length === 6));
  const at80 = buildEffectiveStats(characterBattleStats, { characterProgress: Object.fromEntries(ids.map((id) => [id, { level: 80 }])) });
  assert.ok(ids.every((id) => at80[id].maxHp / characterBattleStats[id].maxHp > 2.9 && at80[id].maxHp / characterBattleStats[id].maxHp < 4.3));
  assert.ok(ids.every((id) => at80[id].speed / characterBattleStats[id].speed < 1.4));
  const full = buildEffectiveStats(characterBattleStats, { characterProgress: Object.fromEntries(ids.map((id) => [id, { level: 90, constellation: 6 }])) });
  assert.ok(ids.every((id) => full[id].maxHp > at80[id].maxHp));
});

test.skip("舊版後續技能與艾洛娜效果", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const stage = trialStages[0];
  const make = (id, activeForm) => simulateBattle({ team: [id], stats: buildEffectiveStats(characterBattleStats, { characterProgress: { [id]: { level: 45, constellation: 6, activeForm } } }), stage, rng: () => .5 });
  for (const id of ["cenwu", "ruida", "yuan", "veyra", "harlow", "rena", "eda", "mave", "rovienne"]) {
    const result = make(id);
    assert.ok(result.logs.some((line) => line.includes(characterBattleStats[id].skillName)), id);
  }
  assert.ok(make("elorna", "land").logs.some((line) => line.includes("留下測線")));
  assert.ok(make("elorna", "deepwater").logs.some((line) => line.includes("救援")));
});

test("四星培養成長幅度高於三星，重複角色留下個人命座晶核", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const fourAtZero = buildEffectiveStats(characterBattleStats, { characterProgress: { celesia: { level: 20, constellation: 0 } } }).celesia;
  const threeAtZero = buildEffectiveStats(characterBattleStats, { characterProgress: { reyn: { level: 20, constellation: 0 } } }).reyn;
  const four = buildEffectiveStats(characterBattleStats, { characterProgress: { celesia: { level: 20, constellation: 2 } } }).celesia;
  const three = buildEffectiveStats(characterBattleStats, { characterProgress: { reyn: { level: 20, constellation: 2 } } }).reyn;
  const fourBase = characterBattleStats.celesia;
  const threeBase = characterBattleStats.reyn;
  // 四星仍保有較高的基礎升級帶；三星的命座追趕倍率則另外驗證，不能混成同一條比較。
  assert.ok(fourAtZero.attack / fourBase.attack > threeAtZero.attack / threeBase.attack);
  assert.ok(four.attack > fourAtZero.attack);
  assert.ok(three.attack > threeAtZero.attack);
  const legacyIds = Object.keys(characterBattleStats).filter((id) => characterBattleStats[id].growthModel !== "first-major");
  const fourPowers = legacyIds.filter((id) => characterBattleStats[id].rarity === 4).map((id) => teamPower([id], characterBattleStats));
  const threePowers = legacyIds.filter((id) => characterBattleStats[id].rarity === 3).map((id) => teamPower([id], characterBattleStats));
  assert.ok(Math.min(...fourPowers) > Math.max(...threePowers));
});

test("四星低基礎功能型角色在 70–90 等使用平衡成長帶", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const progress = { characterProgress: Object.fromEntries(Object.keys(characterBattleStats).map((id) => [id, { level: 90 }])) };
  const statsAt90 = buildEffectiveStats(characterBattleStats, progress);
  const fourStarPowers = Object.keys(characterBattleStats).filter((id) => characterBattleStats[id].rarity === 4 && characterBattleStats[id].growthModel !== "first-major").map((id) => teamPower([id], statsAt90));
  assert.ok(Math.min(...fourStarPowers) / Math.max(...fourStarPowers) > 0.8);
  assert.equal(characterBattleStats.elorna.growthBand, "first-major");
  assert.equal(characterBattleStats.elorna.growthRates.main, 0.04);
});

test("命座讓三星維持可用、四星保有較高上限且舊版角色不膨脹", () => {
  const { buildEffectiveStats, constellationGrowth } = require("../src/battle.js");
  const ids = Object.keys(characterBattleStats).filter((id) => characterBattleStats[id].growthModel !== "first-major");
  const threeIds = ids.filter((id) => characterBattleStats[id].rarity === 3);
  const fourIds = ids.filter((id) => characterBattleStats[id].rarity === 4);
  const statsFor = (level, constellation, selectedIds) => buildEffectiveStats(characterBattleStats, {
    characterProgress: Object.fromEntries(selectedIds.map((id) => [id, { level, constellation }]))
  });
  const powerList = (stats, selectedIds) => selectedIds.map((id) => teamPower([id], stats)).sort((a, b) => a - b);
  const fourAt55 = powerList(statsFor(55, 0, fourIds), fourIds);
  const threeAt90C6 = powerList(statsFor(90, 6, threeIds), threeIds);
  const fourAt90C0 = powerList(statsFor(90, 0, fourIds), fourIds);
  const fourAt90C6 = powerList(statsFor(90, 6, fourIds), fourIds);
  const median = (values) => values[Math.floor(values.length / 2)];
  assert.equal(constellationGrowth.threeStar.main, 0.035);
  assert.equal(constellationGrowth.fourStar.main, 0.08);
  assert.ok(median(threeAt90C6) >= median(fourAt55) * 0.8);
  assert.ok(Math.max(...threeAt90C6) >= median(fourAt55) * 0.8);
  assert.ok(Math.max(...threeAt90C6) < Math.min(...fourAt90C6));
  assert.ok(median(fourAt90C6) >= median(fourAt90C0) * 1.07);
  const firstMajorFour = Object.keys(characterBattleStats).filter((id) => characterBattleStats[id].rarity === 4 && characterBattleStats[id].growthModel === "first-major");
  const firstMajorAt90C6 = powerList(statsFor(90, 6, firstMajorFour), firstMajorFour);
  assert.ok(Math.max(...fourAt90C6) <= Math.max(...firstMajorAt90C6) * 1.02);
});

test("滿等四星 C2 戰力明顯高於 C0，滿命回到約三千戰力", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const ids = Object.keys(characterBattleStats).filter((id) => characterBattleStats[id].rarity === 4 && characterBattleStats[id].growthModel === "first-major");
  const powerAt = (constellation) => {
    const stats = buildEffectiveStats(characterBattleStats, { characterProgress: Object.fromEntries(ids.map((id) => [id, { level: 90, constellation }])) });
    return ids.map((id) => teamPower([id], stats));
  };
  const c0 = powerAt(0), c2 = powerAt(2), c6 = powerAt(6);
  assert.ok(Math.min(...c2) > Math.max(...c0));
  assert.ok(Math.min(...c6) >= 2800 && Math.max(...c6) <= 3400);
});

test.skip("舊版三星與四星技能倍率比較", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const ids = ["reyn", "ruida", "lia", "yuan", "cenwu", "rena", "isar", "harlow", "siyeon", "veyra", "hina", "magenta"];
  const progress = Object.fromEntries(ids.map((id) => [id, { level: 90, constellation: characterBattleStats[id].rarity === 3 ? 6 : 0 }]));
  const stats = buildEffectiveStats(characterBattleStats, { characterProgress: progress });
  for (const [three, four] of [["reyn", "harlow"], ["ruida", "harlow"], ["lia", "siyeon"], ["yuan", "siyeon"], ["cenwu", "veyra"], ["rena", "hina"]]) {
    assert.ok(teamPower([three], stats) < teamPower([four], stats), three + " / " + four);
  }
  assert.ok(teamPower(["isar"], stats) >= teamPower(["magenta"], stats));
  assert.ok(characterBattleStats.harlow.signature.shield > characterBattleStats.ruida.signature.shield);
  assert.ok(characterBattleStats.veyra.signature.markBonus > characterBattleStats.cenwu.signature.markBonus);
});

test("第一大版本18名角色均有專屬技能與六個命座，未開放版本仍維持鎖定", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const ids = ["celesia", "reyn", "lia", "isar", "chodan", "magenta", "hina", "siyeon", "cenwu", "ruida", "yuan", "veyra", "harlow", "rena", "elorna", "eda", "mave", "rovienne"];
  assert.equal(ids.length, 18);
  for (const id of ids) {
    const kit = characterBattleStats[id];
    assert.ok(kit.signature && kit.signature.cooldown > 0, id);
    assert.equal(kit.constellations.length, 6, id);
    assert.ok(kit.maxHp > 0 && kit.attack > 0 && kit.defense > 0 && kit.speed > 0, id);
    const c0 = buildEffectiveStats(characterBattleStats, { characterProgress: { [id]: { level: 80, constellation: 0 } } })[id];
    const c6 = buildEffectiveStats(characterBattleStats, { characterProgress: { [id]: { level: 80, constellation: 6 } } })[id];
    assert.ok(teamPower([id], { [id]: c6 }) > teamPower([id], { [id]: c0 }), id);
    const team = [id, ...["celesia", "lia", "isar", "magenta"].filter((candidate) => candidate !== id)].slice(0, 4);
    const battle = simulateBattle({ team, stats: characterBattleStats, stage: trialStages[0], rng: () => .5 });
    assert.ok(battle.team.find((unit) => unit.id === id).skillUses > 0, id);
  }
});

test("第一大版本五類四人隊在C0與C6均可完成中段試煉，且無無限循環", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const teams = [
    ["celesia", "magenta", "reyn", "lia"],
    ["chodan", "magenta", "hina", "siyeon"],
    ["celesia", "harlow", "ruida", "eda"],
    ["reyn", "lia", "isar", "cenwu"],
    ["celesia", "magenta", "hina", "veyra"]
  ];
  for (const constellation of [0, 6]) for (const team of teams) {
    const characterProgress = Object.fromEntries(team.map((id) => [id, { level: 60, constellation }]));
    const stats = buildEffectiveStats(characterBattleStats, { characterProgress });
    const result = simulateBattle({ team, stats, stage: trialStages[9], rng: () => .5 });
    assert.equal(result.won, true, team.join(",") + " C" + constellation);
    assert.ok(result.rounds < 120, team.join(",") + " C" + constellation);
  }
});
