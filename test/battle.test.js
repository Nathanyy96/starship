"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { simulateBattle, teamPower } = require("../src/battle.js");
const { characterBattleStats, trialStages, trialReward, trialMaxRewards, voyageBattleStages, voyageConfig } = require("../src/data.js");

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
  assert.equal(trialMaxRewards, 20);
});

test("星界試煉隊伍戰力只計算資料層中已開放角色", () => {
  assert.equal(teamPower(["celesia", "reyn"], characterBattleStats), 866);
});

test("星界試煉擴充為 30 關並維持逐關升難", () => {
  assert.equal(trialStages.length, 30);
  assert.deepEqual(trialStages.map((stage) => stage.id), Array.from({ length: 30 }, (_, index) => index + 1));
  assert.ok(trialStages.every((stage, index) => index === 0 || stage.recommendedPower > trialStages[index - 1].recommendedPower));
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
  assert.equal(trialStages[29].recommendedPower, 6040);
  assert.equal(run(1, trialStages[0]).rounds >= 8, true);
  assert.equal(run(60, trialStages[9]).rounds >= 18 && run(60, trialStages[9]).rounds <= 28, true);
  assert.equal(run(45, trialStages[9]).rounds <= 40, true);
  assert.equal(run(90, trialStages[29]).rounds <= 30, true);
  assert.equal(run(25, trialStages[29]).won, false);
});

test("星海迷航使用獨立休閒敵群，不直接借用高難度試煉終幕", () => {
  const finalNode = voyageConfig.nodes.find((node) => node.id === "voyage-final");
  const voyageFinal = voyageBattleStages.find((stage) => stage.id === finalNode.stageId);
  assert.ok(voyageFinal);
  assert.equal(voyageFinal.recommendedPower, 5400);
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
  assert.deepEqual([...names].sort(), ["開場巨獸原生型", "黑晶異變巨獸", "黑晶棘背獸"].sort());
  assert.ok(trialStages.every((stage) => stage.enemies.every((enemy) => enemy.image && enemy.image.endsWith(".webp"))));
  assert.ok(trialStages.every((stage) => stage.environmentEffect.includes("訓練模擬")));
});

test("第一大版本後續十名角色有完整技能、命座與受控成長", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const ids = ["cenwu", "ruida", "yuan", "veyra", "harlow", "rena", "elorna", "eda", "mave", "rovienne"];
  assert.ok(ids.every((id) => characterBattleStats[id].signature && characterBattleStats[id].constellations.length === 6));
  const at80 = buildEffectiveStats(characterBattleStats, { characterProgress: Object.fromEntries(ids.map((id) => [id, { level: 80 }])) });
  assert.ok(ids.every((id) => at80[id].maxHp / characterBattleStats[id].maxHp > 1.8 && at80[id].maxHp / characterBattleStats[id].maxHp < 2));
  assert.ok(ids.every((id) => at80[id].speed / characterBattleStats[id].speed < 1.08));
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
  assert.equal(characterBattleStats.elorna.growthRates.main, 0.0114);
});

test("命座成長讓三星滿命滿等接近四星 55 等，四星滿命也有明顯回饋", () => {
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
  assert.equal(constellationGrowth.threeStar.main, 0.4);
  assert.equal(constellationGrowth.fourStar.main, 0.12);
  assert.ok(median(threeAt90C6) >= median(fourAt55) * 0.8);
  assert.ok(Math.max(...threeAt90C6) >= median(fourAt55) * 0.95);
  assert.ok(Math.max(...threeAt90C6) < Math.min(...fourAt90C6));
  assert.ok(median(fourAt90C6) >= median(fourAt90C0) * 1.1);
});
