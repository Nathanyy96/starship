"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { simulateBattle, teamPower } = require("../src/battle.js");
const { characterBattleStats, trialStages, trialReward, trialMaxRewards } = require("../src/data.js");

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
  assert.equal(trialReward.starSand, 50);
  assert.equal(trialReward.characterExp, 1500);
  assert.equal(battle.environment, trialStages[0].environment);
  assert.equal(battle.enemyTrait, trialStages[0].enemyTrait);
  assert.equal(trialMaxRewards, 10);
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

test("試煉 21–30 使用北境神話篇原創敵群與獨立敵人圖像標記", () => {
  const mythicStages = trialStages.filter((stage) => stage.id >= 21);
  assert.equal(mythicStages.length, 10);
  assert.ok(mythicStages.every((stage) => stage.mythicArc === "northern-myth-arc" && stage.mythicTheme));
  assert.ok(mythicStages.every((stage) => stage.enemies.every((enemy) => enemy.mythicClass)));
  assert.ok(mythicStages.some((stage) => stage.enemies.some((enemy) => enemy.name === "世界根鎧獸")));
});

test("四星培養成長幅度高於三星，重複角色留下個人命座晶核", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const four = buildEffectiveStats(characterBattleStats, { characterProgress: { celesia: { level: 20, constellation: 2 } } }).celesia;
  const three = buildEffectiveStats(characterBattleStats, { characterProgress: { reyn: { level: 20, constellation: 2 } } }).reyn;
  const fourBase = characterBattleStats.celesia;
  const threeBase = characterBattleStats.reyn;
  assert.ok(four.attack / fourBase.attack > three.attack / threeBase.attack);
  const fourPowers = Object.keys(characterBattleStats).filter((id) => characterBattleStats[id].rarity === 4).map((id) => teamPower([id], characterBattleStats));
  const threePowers = Object.keys(characterBattleStats).filter((id) => characterBattleStats[id].rarity === 3).map((id) => teamPower([id], characterBattleStats));
  assert.ok(Math.min(...fourPowers) > Math.max(...threePowers));
});

test("四星低基礎功能型角色在 70–90 等使用平衡成長帶", () => {
  const { buildEffectiveStats } = require("../src/battle.js");
  const progress = { characterProgress: Object.fromEntries(Object.keys(characterBattleStats).map((id) => [id, { level: 90 }])) };
  const statsAt90 = buildEffectiveStats(characterBattleStats, progress);
  const fourStarPowers = Object.keys(characterBattleStats).filter((id) => characterBattleStats[id].rarity === 4).map((id) => teamPower([id], statsAt90));
  assert.ok(Math.min(...fourStarPowers) / Math.max(...fourStarPowers) > 0.8);
  assert.equal(characterBattleStats.mave.growthBand, "parity");
  assert.equal(characterBattleStats.mave.growthRates.main, 0.05);
});
