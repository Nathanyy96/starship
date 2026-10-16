"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const data = require("../src/data.js");
const battle = require("../src/battle.js");
const teams = [["magenta", "siyeon", "chodan", "hina"], ["mave", "harlow", "elorna", "celesia"]];
const progress = Object.fromEntries(teams.flat().map(id => [id, { level: 90, constellation: 3 }]));
const stats = battle.buildEffectiveStats(data.characterBattleStats, { characterProgress: progress });
function seeded(seed) { return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296); }
test("1.2 exposes only 1–15 with complete rewards, three attempts and real monster art", () => {
  assert.deepEqual(data.trialStages.map(s => s.id), Array.from({length:15}, (_,i)=>i+1));
  for (const stage of data.trialStages) {
    assert.equal(stage.maxChallengeAttempts, 3);
    assert.ok(stage.reward.starSand > 0 && stage.reward.characterExp > 0);
    assert.ok(stage.teamHint && stage.counterplay);
    for (const enemy of stage.enemies) assert.ok(fs.existsSync(require("node:path").resolve(__dirname,"..",enemy.image)));
  }
});
test("C3 four-star parties complete high trials with live monster snapshots", () => {
  for (const stage of data.trialStages.slice(9)) {
    const halves = stage.halves || [{enemies:stage.enemies}];
    for (let seed=1; seed<=5; seed++) halves.forEach((half,index) => {
      assert.ok(half.enemies.length >= 3);
      const result = battle.simulateBattle({team:teams[index],stats,stage:{...stage,enemies:half.enemies},rng:seeded(seed),captureTimeline:true});
      assert.equal(result.timedOut, false, `stage ${stage.id}, half ${index}`);
      assert.equal(result.won, true, `stage ${stage.id}, half ${index}, seed ${seed}`);
      assert.ok(result.timeline.length > 2);
      assert.ok(result.timeline[0].enemies.every(e => e.image.endsWith(".webp")));
      assert.ok(result.timeline.some(f => f.enemies.some(e => e.hp < e.maxHp)));
    });
  }
});
test("brood recovery is bounded and belongs to the brood monster", () => {
  const stage=data.trialStages[11];
  const result=battle.simulateBattle({team:teams[0],stats,stage:{...stage,enemies:stage.halves[0].enemies},rng:seeded(7),captureTimeline:true});
  const events=result.timeline.flatMap(f=>f.events).filter(line=>line.includes("使用「巢群回護」替"));
  assert.ok(events.length>0 && events.length<=3);
  assert.ok(events.every(line=>line.startsWith("回聲巢母 ")));
});
