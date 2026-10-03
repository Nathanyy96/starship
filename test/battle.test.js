"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { simulateBattle, teamPower } = require("../src/battle.js");
const { characterBattleStats, trialStages, trialReward, trialMaxRewards, bossStages, voyageBattleStages, voyageConfig } = require("../src/data.js");

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
  assert.equal(simulateBattle({ team: stage20Team, stats: stage20Stats, stage: trialStages[19], rng: () => .5 }).won, true);
  assert.equal(run(1, trialStages[0]).rounds >= 8, true);
  assert.equal(run(60, trialStages[9]).rounds >= 15 && run(60, trialStages[9]).rounds <= 45, true);
  assert.equal(run(45, trialStages[9]).rounds <= 60, true);
  assert.equal(run(90, trialStages[29]).won, false);
  assert.equal(run(25, trialStages[29]).won, false);
});

test("試煉終段以滿等四星三至四命隊伍校準", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const teams = [
    ["celesia", "magenta", "hina", "siyeon"],
    ["celesia", "harlow", "siyeon", "magenta"],
    ["chodan", "magenta", "hina", "siyeon"]
  ];
  for (const team of teams) {
    const characterProgress = Object.fromEntries(team.map((id) => [id, { level: 90, constellation: 4 }]));
    const stats = buildEffectiveStats(characterBattleStats, { characterProgress });
    const last = simulateBattle({ team, stats, stage: trialStages[29], rng: () => .5 });
    assert.ok(teamPower(team, stats) >= 10000 && teamPower(team, stats) <= 12000);
    assert.equal(last.won, true, team.join(","));
    assert.ok(last.rounds >= 45 && last.rounds <= 65, team.join(",") + "：" + last.rounds);
    if (!team.includes("harlow")) assert.ok(last.team.some((unit) => unit.hp === 0), "終關應對沒有護衛的高戰力隊伍造成實際壓力");
    const c3Progress = Object.fromEntries(team.map((id) => [id, { level: 90, constellation: 3 }]));
    const c3Stats = buildEffectiveStats(characterBattleStats, { characterProgress: c3Progress });
    for (const seed of [.1, .5, .9]) {
      const c3Result = simulateBattle({ team, stats: c3Stats, stage: trialStages[29], rng: () => seed });
      assert.equal(c3Result.won, true, team.join(",") + " C3 seed " + seed);
      assert.ok(c3Result.rounds >= 40 && c3Result.rounds <= 90, team.join(",") + " C3 seed " + seed);
    }
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
  assert.equal(threeStarResult.won, true);
  assert.ok(threeStarResult.rounds <= 180, "滿命三星也不得被護盾無限拖延");
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

test("現行三十關依無裝備、無天賦的培養進度可逐關通關", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const team = ["celesia", "chodan", "magenta", "lia"];
  const rounds = [];
  for (const stage of trialStages) {
    const id = stage.id;
    const level = id <= 20 ? id : id <= 25 ? Math.round(30 + (id - 21) * 7.5) : id <= 29 ? 60 + (id - 25) * 5 : 90;
    const constellation = id <= 25 ? 0 : id <= 29 ? 2 : 3;
    const characterProgress = Object.fromEntries(team.map((unitId) => [unitId, { level, constellation }]));
    const stats = buildEffectiveStats(characterBattleStats, { characterProgress });
    const result = simulateBattle({ team, stats, stage, rng: () => .5 });
    assert.equal(result.won, true, "stage " + id + " Lv" + level + " C" + constellation);
    assert.ok(result.rounds < 120, "stage " + id + " rounds " + result.rounds);
    rounds.push(result.rounds);
  }
  assert.ok(rounds[23] >= 55 && rounds[23] <= 80, "第24關不應突然高於後續首領關");
  assert.ok(rounds[24] > rounds[23], "第25關應為該區段的首領高點");
  assert.ok(rounds[29] >= 45 && rounds[29] <= 70, "終關維持三至四命隊伍的挑戰長度");
});

test("現行1.0可取得角色也能組成符合終關基準的隊伍", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const team = ["celesia", "chodan", "magenta", "lia"];
  const characterProgress = Object.fromEntries(team.map((id) => [id, { level: 90, constellation: 3 }]));
  const stats = buildEffectiveStats(characterBattleStats, { characterProgress });
  const result = simulateBattle({ team, stats, stage: trialStages[29], rng: () => .5 });
  assert.equal(result.won, true);
  assert.ok(result.rounds >= 50 && result.rounds <= 60);
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
    const characterProgress = Object.fromEntries(team.map((unitId) => [unitId, { level: 90, constellation: 4, activeForm: id === "elorna" && group.base.includes("harlow") ? "deepwater" : "land" }]));
    const stats = buildEffectiveStats(characterBattleStats, { characterProgress });
    const result = simulateBattle({ team, stats, stage: trialStages[29], rng: () => .5 });
    assert.equal(result.won, true, id);
    assert.ok(result.rounds >= 30 && result.rounds <= 100, id + "：" + result.rounds);
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

test("後續技能實際進入戰鬥且艾洛娜雙形態採不同效果", () => {
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

test("第一大版本三星滿命仍低於同定位四星上限，伊薩爾保留例外", () => {
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
