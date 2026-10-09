"use strict";
// The old C0–C6 assertions described the retired 2026-10-05 kits. Keep their
// historical source in test-legacy and run the replacement contract here.
require("./replacement-kits.test.js");

const test = require("node:test");
const assert = require("node:assert/strict");
const { characterBattleStats, trialStages } = require("../src/data.js");
const { simulateBattle, buildEffectiveStats } = require("../src/battle.js");

const firstMajor = ["celesia", "reyn", "lia", "isar", "chodan", "magenta", "hina", "siyeon", "cenwu", "ruida", "yuan", "veyra", "harlow", "rena", "elorna", "eda", "mave", "rovienne"];

test("all 18 first-major characters use the replacement contract", () => {
  assert.equal(firstMajor.length, 18);
  for (const id of firstMajor) {
    assert.equal(characterBattleStats[id].signature.type, "replacement", id);
    assert.equal(characterBattleStats[id].constellations.length, 6, id);
  }
});

test("five distinct first-major formations finish a midgame trial at C0 and C6", () => {
  const formations = [
    ["magenta", "hina", "chodan", "siyeon"],
    ["isar", "reyn", "lia", "rena"],
    ["mave", "veyra", "chodan", "elorna"],
    ["rovienne", "ruida", "yuan", "rena"],
    ["celesia", "reyn", "lia", "isar"]
  ];
  for (const c of [0, 6]) {
    const progress = Object.fromEntries(firstMajor.map(id => [id, { level: 70, constellation: c }]));
    const stats = buildEffectiveStats(characterBattleStats, { characterProgress: progress });
    for (const team of formations) {
      const result = simulateBattle({ team, stats, stage: trialStages[9], rng: () => .5 });
      assert.ok(["won", "defeat"].includes(result.status), `${team} C${c}: ${result.status}`);
      assert.ok(result.logs.some(line => line.includes("使用「")), team.join("/"));
    }
  }
});
