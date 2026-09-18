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
  assert.equal(trialMaxRewards, 10);
});

test("星界試煉隊伍戰力只計算資料層中已開放角色", () => {
  assert.equal(teamPower(["celesia", "reyn"], characterBattleStats), 765);
});
