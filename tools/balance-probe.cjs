"use strict";
const { characterBattleStats, trialStages } = require("../src/data.js");
const { buildEffectiveStats, simulateBattle, teamPower } = require("../src/battle.js");

const teams = {
  launch: ["celesia", "chodan", "magenta", "lia"],
  quartet: ["chodan", "magenta", "hina", "siyeon"],
  guard: ["celesia", "harlow", "ruida", "eda"],
  hunter: ["reyn", "veyra", "harlow", "lia"],
  mixed: ["celesia", "magenta", "hina", "lia"],
  huntSupport: ["harlow", "veyra", "magenta", "siyeon"],
  versionLate: ["rovienne", "mave", "elorna", "eda"],
  village: ["reyn", "isar", "magenta", "lia"],
  healHeavy: ["lia", "yuan", "siyeon", "elorna"]
};
const variants = [
  [70, 0, 20], [80, 2, 25], [85, 3, 29],
  [90, 0, 30], [90, 2, 30], [90, 3, 30], [90, 4, 30], [90, 6, 30]
];
for (const [level, constellation, stageId] of variants) {
  for (const [name, team] of Object.entries(teams)) {
    const progress = Object.fromEntries(team.map((id) => [id, { level, constellation }]));
    const stats = buildEffectiveStats(characterBattleStats, { characterProgress: progress });
    const results = [.4, .5, .6].map((luck) => {
      const battle = simulateBattle({ team, stats, stage: trialStages[stageId - 1], rng: () => luck });
      return battle.status[0] + battle.rounds;
    });
    console.log([stageId, level, constellation, name, teamPower(team, stats), results.join("/")].join("\t"));
  }
}
