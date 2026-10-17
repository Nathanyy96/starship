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

test("stage 10 replay provides actor and target changes for portrait combat", () => {
  const stage = data.trialStages[9];
  const result = battle.simulateBattle({team:teams[0], stats, stage, rng:seeded(10), captureTimeline:true});
  assert.ok(result.timeline.length > 5);
  assert.ok(result.timeline.some((frame, index) => index > 0 && frame.actorId && frame.team.concat(frame.enemies).some(unit => String(unit.id) === String(frame.actorId))));
  assert.ok(result.timeline.some((frame, index) => index > 0 && frame.enemies.some(unit => {
    const prior = result.timeline[index - 1].enemies.find(other => other.id === unit.id);
    return prior && (unit.hp < prior.hp || unit.shield < prior.shield);
  })));
  assert.ok(result.timeline.some(frame => frame.enemies.every(unit => unit.image.endsWith(".webp"))));
});

test("normal-proportion action atlases cover every active trial character and monster", () => {
  const path = require("node:path");
  const combat = id => path.resolve(__dirname, "..", "assets", "combat", id);
  const active = ["celesia", "reyn", "lia", "isar", "chodan", "magenta", "hina", "siyeon", "cenwu", "ruida", "yuan"];
  for (const id of active) assert.ok(fs.existsSync(combat(`${id}-normal-actions-v2.webp`)), id);
  const monsters = new Map([
    ["black-crystal-beast.webp", "crystal-beast"],
    ["black-crystal-spine-beast.webp", "spine-beast"],
    ["folding-shadow-beast.webp", "folding-shadow"],
    ["spider-mother.webp", "spider-mother"],
    ["resonant-spider.webp", "resonant-spider"]
  ]);
  for (const stage of data.trialStages) for (const enemy of stage.enemies) {
    const file = monsters.get(path.basename(enemy.image));
    assert.ok(file && fs.existsSync(combat(`${file}-actions-v2.webp`)), `stage ${stage.id}: ${enemy.name}`);
  }
  const css = fs.readFileSync(path.resolve(__dirname, "..", "styles.css"), "utf8");
  for (const id of [...active, ...monsters.values()]) assert.match(css, new RegExp(`${id}-(?:normal-)?actions-v2\\.webp`));
});

test("equipped normal-proportion costumes have matching combat frames", () => {
  const path = require("node:path");
  const css = fs.readFileSync(path.resolve(__dirname, "..", "styles.css"), "utf8");
  for (const id of ["celesia", "magenta", "hina", "chodan", "siyeon"]) {
    const asset = `${id}-skin-normal-actions-v2.webp`;
    assert.ok(fs.existsSync(path.resolve(__dirname, "..", "assets", "combat", asset)), id);
    assert.ok(css.includes(asset), id);
  }
});

test("1.2–1.3 characters have their own normal-proportion combat poses", () => {
  const path = require("node:path");
  const css = fs.readFileSync(path.resolve(__dirname, "..", "styles.css"), "utf8");
  const player = fs.readFileSync(path.resolve(__dirname, "..", "src", "player-app.js"), "utf8");
  for (const id of ["veyra", "harlow", "rena", "elorna"]) {
    const asset = `${id}-normal-actions-v1.webp`;
    const file = path.resolve(__dirname, "..", "assets", "combat", asset);
    assert.ok(fs.statSync(file).size > 100_000, asset);
    assert.ok(css.includes(asset), asset);
    assert.match(player, new RegExp(`${id}: "(?:survey|barrier|dagger|guard)"`));
  }
});
