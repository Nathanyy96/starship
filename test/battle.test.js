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

test("星海迷航終幕提供可讀的推薦戰力並降低不必要的爆發傷害", () => {
  const finalStage = trialStages.find((stage) => stage.id === 30);
  assert.equal(finalStage.recommendedPower, 12800);
  assert.match(finalStage.recommendedPowerNote, /12,800/);
  assert.equal(finalStage.modifiers.enemyAttack, 1.08);
  assert.ok(finalStage.enemies.every((enemy) => enemy.attack <= 560));
  const battle = simulateBattle({
    team: ["celesia", "harlow", "lia", "reyn"],
    stats: characterBattleStats,
    stage: finalStage,
    rng: () => 0.5
  });
  assert.equal(battle.recommendedPower, 12800);
  assert.equal(battle.powerRatio, 0.13);
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
