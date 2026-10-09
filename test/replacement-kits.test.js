"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const data = require("../src/data.js");
const replacement = require("../src/replacement-kits.js");
const liveIds = Object.keys(replacement).filter(id => Number((data.cards || {})[id]?.releaseVersion || data.characterBattleStats[id].releaseVersion || 1) < 2 && id !== "lorne");
const source = fs.readFileSync(require.resolve("../src/battle.js"), "utf8").replace(
  "    simulateBattle: simulateBattle,",
  "    audit: { setCombat: function(value){combat=value;}, useSignatureSkill: useSignatureSkill, afterHit: afterHit, hit: hit, tickUnit: tickUnit }, simulateBattle: simulateBattle,"
);
const sandbox = { module: { exports: {} } };
vm.runInNewContext(source, sandbox);
const audit = sandbox.module.exports.audit;

function actor(id, constellation = 0, extra = {}) {
  return { ...data.characterBattleStats[id], id, constellation, hp: 1000, maxHp: 1000, attack: 100, defense: 0, shield: 0, effects: [], skillCooldown: 0, skillCooldownMax: 3, ...extra };
}
function enemy(id = "enemy", extra = {}) {
  return { id, name: id, hp: 10000, maxHp: 10000, attack: 100, defense: 0, shield: 0, effects: [], skillCooldown: 0, skillCooldownMax: 3, isEnemy: true, ...extra };
}
function setup(actors, enemies = [enemy()]) {
  const state = { team: actors, enemies, round: 1, logs: [], activeActor: actors[0], followup: false, rng: () => .5 };
  audit.setCombat(state);
  return state;
}
function cast(state, unit = state.team[0]) { state.activeActor = unit; return audit.useSignatureSkill(unit, state.team, state.enemies, state.logs); }

test("18 live kits and nine future plans carry six constellations", () => {
  assert.equal(Object.keys(replacement).length, 27);
  assert.equal(liveIds.length, 18);
  for (const [id, kit] of Object.entries(replacement)) {
    if (liveIds.includes(id)) assert.equal(data.characterBattleStats[id].signature.type, "replacement", id);
    assert.equal(kit.constellations.length, 6, id);
    for (let i = 0; i < 6; i++) assert.match(kit.constellations[i], new RegExp(`^C${i + 1} `), id);
  }
});

test("Chodan provides four shields and protection at C0", () => {
  const units = [actor("chodan"), actor("magenta"), actor("hina"), actor("siyeon")];
  const state = setup(units);
  assert.equal(cast(state), true);
  for (const unit of units) {
    assert.equal(unit.shield, 110);
    assert.equal(unit.effects.find(e => e.name === "damageTaken").value, .92);
  }
});

test("Magenta's mark reacts to any wind teammate, once per round", () => {
  const magenta = actor("magenta"), hina = actor("hina"), reyn = actor("reyn");
  const foe = enemy();
  const state = setup([magenta, hina, reyn], [foe]);
  cast(state);
  const before = foe.hp;
  audit.afterHit(reyn, foe, false, 10);
  assert.ok(foe.hp <= before - 45);
  const once = foe.hp;
  audit.afterHit(reyn, foe, false, 10);
  assert.equal(foe.hp, once);
  assert.match(state.logs.join(" "), /交鳴/);
});

test("three-star healers heal one recipient; Siyeon heals two", () => {
  for (const id of ["lia", "yuan", "siyeon"]) {
    const healer = actor(id), first = actor("isar", 0, { hp: 500 }), second = actor("reyn", 0, { hp: 600 });
    const state = setup([healer, first, second]);
    cast(state);
    assert.ok(first.hp > 500, id);
    assert.equal(second.hp > 600, id === "siyeon", id);
  }
});

test("Lorne is reserved as a future primary healer, without opening 3.x", () => {
  assert.match(replacement.lorne.skillEffect, /治療/);
  assert.notEqual(data.characterBattleStats.lorne.signature?.type, "replacement");
});

test("every live replacement skill can be cast at C0 and C6 with finite state", () => {
  for (const id of liveIds) for (const c of [0, 6]) {
    const own = actor(id, c), friend = actor("isar", 0, { hp: 500 }), other = actor("reyn", 0, { hp: 600 });
    const state = setup([own, friend, other], [enemy(), enemy("second")]);
    assert.equal(cast(state), true, `${id} C${c}`);
    for (const unit of state.team.concat(state.enemies)) {
      assert.ok(Number.isFinite(unit.hp), `${id} C${c} hp`);
      assert.ok(Number.isFinite(unit.shield), `${id} C${c} shield`);
    }
  }
});

test("2.x remains locked for ordinary players", () => {
  const card = data.cards && data.cards.risan;
  if (card) assert.equal(card.releaseVersion, "2.0");
  assert.notEqual(data.characterBattleStats.risan.signature?.type, "replacement");
  assert.ok(replacement.risan.constellations.length === 6);
});

test("a replacement shield expires after its two-round window", () => {
  const chodan = actor("chodan"), friend = actor("magenta");
  const state = setup([chodan, friend]);
  cast(state);
  assert.equal(friend.shield, 110);
  state.round = 4;
  audit.tickUnit(friend);
  assert.equal(friend.shield, 0);
});

test("three-star healers do not regain the retired high-constellation healing totals", () => {
  const totals = {};
  for (const id of ["lia", "yuan", "siyeon"]) {
    const healer = actor(id, 6), first = actor("isar", 0, { hp: 300 }), second = actor("reyn", 0, { hp: 400 });
    const state = setup([healer, first, second]);
    cast(state);
    totals[id] = first.hp - 300 + second.hp - 400;
  }
  assert.ok(totals.siyeon > totals.lia * 1.25);
  assert.ok(totals.siyeon > totals.yuan * 1.25);
});

test("Siyeon's accelerated heal follows damage and triggers once", () => {
  const siyeon = actor("siyeon"), friend = actor("isar", 0, { hp: 400, hotAcceleration: { by: "siyeon", used: false } });
  setup([siyeon, friend]);
  audit.hit(friend, 150);
  assert.equal(friend.hp, 300);
  assert.equal(friend.hotAcceleration.used, true);
  audit.hit(friend, 10);
  assert.equal(friend.hp, 290);
});

test("the optional miss roll is visible and does not attach a mark", () => {
  const stage = { id: 998, name: "失誤驗證", trialRule: "basic", enemies: [{ name: "測試敵人", maxHp: 1000, attack: 1, defense: 0, speed: 1, count: 1 }] };
  const hina = { ...data.characterBattleStats.hina, maxHp: 1000, attack: 100, speed: 200 };
  const result = sandbox.module.exports.simulateBattle({ team: ["hina"], stats: { hina }, stage, rng: () => .01 });
  assert.ok(result.logs.some(line => line.includes("失誤，本次造成 0 傷害")));
  assert.ok(result.misses.team > 0);
  assert.ok(result.logs.every(line => !line.includes("交鳴觸發")));
});
