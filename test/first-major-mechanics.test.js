"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { characterBattleStats } = require("../src/data.js");

// Read the production battle module and expose its internal effect operations
// only inside this test. Assertions observe real combat state, not source text.
const source = fs.readFileSync(require.resolve("../src/battle.js"), "utf8").replace(
  "    simulateBattle: simulateBattle,",
  "    audit: { setCombat: function (value) { combat = value; }, useSignatureSkill: useSignatureSkill, hit: hit, heal: heal, giveShield: giveShield, tickUnit: tickUnit, expireEffects: expireEffects, afterHit: afterHit, addEffect: addEffect }, simulateBattle: simulateBattle,"
);
const sandbox = { module: { exports: {} } };
vm.runInNewContext(source, sandbox);
const battle = sandbox.module.exports.audit;
const firstMajor = ["celesia", "reyn", "lia", "isar", "chodan", "magenta", "hina", "siyeon", "cenwu", "ruida", "yuan", "veyra", "harlow", "rena", "elorna", "eda", "mave", "rovienne"];

function actor(id, constellation = 0, extra = {}) {
  return { ...characterBattleStats[id], id, constellation, hp: 1000, maxHp: 1000, attack: 100, defense: 0, shield: 0, guard: 0, effects: [], skillCooldown: 2, ...extra };
}
function ally(id = "ally", extra = {}) {
  return { id, hp: 1000, maxHp: 1000, attack: 100, defense: 0, shield: 0, effects: [], ...extra };
}
function enemy(id = "enemy", extra = {}) {
  return { id, isEnemy: true, hp: 10000, maxHp: 10000, attack: 100, defense: 0, shield: 0, effects: [], skillCooldown: 1, skillCooldownMax: 3, ...extra };
}
function setup(owner, friends = [], foes = [enemy()]) {
  const state = { round: 1, team: [owner, ...friends], enemies: foes, logs: [], activeActor: owner, followup: false };
  battle.setCombat(state);
  return state;
}
function cast(state, owner = state.team[0]) { return battle.useSignatureSkill(owner, state.team, state.enemies, state.logs); }
function effect(unit, name) { return unit.effects.find(value => value.name === name); }

test("18 名角色均有專屬技能與六個不重複的命座規格", () => {
  for (const id of firstMajor) {
    const kit = characterBattleStats[id];
    assert.ok(kit.signature, id);
    assert.equal(kit.constellations.length, 6, id);
    for (let i = 0; i < 6; i++) assert.match(kit.constellations[i], new RegExp(`^C${i + 1} `), id);
  }
});

for (const id of ["cenwu", "veyra", "rena", "elorna", "mave"]) {
  test(`${id} 標記系 C0–C6：倍率、期限、附加、全隊增益、擊倒轉標`, () => {
    const base = characterBattleStats[id];
    const values = [];
    for (let c = 0; c <= 6; c++) {
      const owner = actor(id, c);
      const friend = ally();
      const primary = enemy();
      const second = enemy("second");
      const state = setup(owner, [friend], [primary, second]);
      assert.equal(cast(state), true);
      values.push(10000 - primary.hp);
      assert.equal(effect(primary, "damageTaken").turns, c >= 1 ? 3 : 2);
      assert.equal(effect(primary, "damageTaken").value, 1 + (base.signature.markBonus || .06) * (c >= 5 ? 1.35 : 1));
      if (base.signature.defenseDown) assert.equal(effect(primary, "defenseMultiplier").value, base.signature.defenseDown * (c >= 5 ? .94 : 1));
      if (base.signature.slow) assert.equal(effect(primary, "speedMultiplier").value, base.signature.slow * (c >= 5 ? .95 : 1));
      if (c >= 2 && id === "veyra") assert.equal(effect(second, "defenseMultiplier").value, .9);
      if (c >= 2 && ["cenwu", "elorna"].includes(id)) assert.equal(effect(primary, "attackMultiplier").value, .9);
      if (c >= 2 && id === "mave") assert.equal(second.skillCooldown, 2);
      if (id === "mave") assert.equal(primary.skillCooldown, 2);
      if (c >= 4) assert.equal(effect(friend, ["cenwu", "rena"].includes(id) ? "speedMultiplier" : "defenseMultiplier").value, 1.06);
    }
    assert.ok(values[3] > values[2], `${id} C3 must increase direct damage`);
    const owner = actor(id, 6, { attack: 500 });
    const victim = enemy("victim", { hp: 100, maxHp: 10000 });
    const survivor = enemy("survivor", { hp: 8000 });
    const state = setup(owner, [], [victim, survivor]);
    cast(state);
    assert.equal(victim.hp, 0);
    assert.equal(effect(survivor, "damageTaken").turns, 3);
    assert.equal(effect(survivor, "damageTaken").value, 1 + (base.signature.markBonus || .06));
    assert.equal(effect(survivor, "defenseMultiplier")?.value, id === "veyra" ? .9 : undefined);
  });
}

for (const id of ["ruida", "harlow", "rovienne"]) {
  test(`${id} 防護系 C0–C6：護盾、期限、反制、減傷、額外護盾`, () => {
    const kit = characterBattleStats[id].signature;
    for (let c = 0; c <= 6; c++) {
      const owner = actor(id, c);
      const friend = ally("friend", { hp: 600 });
      const target = enemy();
      const state = setup(owner, [friend], [target]);
      cast(state);
      assert.equal(friend.shield, Math.round(owner.maxHp * kit.shield * (c >= 1 ? 1.08 : 1) * (c >= 3 ? 1.08 : 1)));
      assert.equal(friend.escort.until, 1 + kit.duration + (c >= 1 ? 1 : 0));
      assert.equal(friend.escort.ratio, id === "rovienne" ? .32 : .3);
      assert.equal(owner.guard, kit.guard);
      assert.equal(target.maxHp - target.hp, c >= 5 ? 80 : c >= 2 ? 55 : 0);
      if (c >= 4) assert.equal(effect(friend, "damageTaken").value, .94);
      if (id === "harlow") assert.equal(effect(target, "attackMultiplier").value, .85 * (c >= 5 ? .94 : 1));
      if (id === "rovienne") assert.equal(owner.hp, 1000 - (c >= 5 ? 56 : 80));
    }
    const owner = actor(id, 6);
    const friend = ally("friend", { hp: 300 });
    const state = setup(owner, [friend], [enemy()]);
    cast(state);
    assert.equal(friend.shield, Math.round(owner.maxHp * kit.shield * 1.08 * 1.08) + 60);
    assert.ok(friend.shield <= friend.maxHp * .28);
  });
}

test("蕾娜 C2/C5 的殘血追加攻擊與斬殺倍率依施放前後條件分別計算", () => {
  const first = [];
  for (const c of [0, 2, 5]) {
    const owner = actor("rena", c);
    const victim = enemy("victim", { hp: 3900 });
    cast(setup(owner, [], [victim]));
    first.push(3900 - victim.hp);
    assert.equal(effect(victim, "attackMultiplier")?.value, c >= 2 ? .9 : undefined);
  }
  assert.deepEqual(first, [175, 195, 223]);
  const owner = actor("rena", 2);
  const victim = enemy("victim", { hp: 4300 });
  cast(setup(owner, [], [victim]));
  assert.equal(4300 - victim.hp, 148);
  assert.equal(effect(victim, "attackMultiplier"), undefined);
});

test("防護系 C6 額外護盾只給施放時低於 35% 的受保護者", () => {
  for (const id of ["ruida", "harlow", "rovienne"]) {
    const owner = actor(id, 6);
    const low = ally("low", { hp: 300 });
    const high = ally("high", { hp: 500 });
    cast(setup(owner, [low, high]));
    const base = Math.round(owner.maxHp * owner.signature.shield * 1.08 * 1.08);
    assert.equal(low.shield, base + 60);
    assert.equal(high.shield, id === "rovienne" ? base : 0);
  }
});

test("榆安 C0–C6：即時與逐輪治療、溢出護盾、淨化、急救", () => {
  const hp = [];
  for (let c = 0; c <= 6; c++) {
    const owner = actor("yuan", c);
    const patient = ally("patient", { hp: 100, effects: [{ name: "attackMultiplier", value: .8, turns: 2 }] });
    const state = setup(owner, [patient]);
    cast(state);
    hp.push(patient.hp);
    assert.equal(effect(patient, "healOverTime").value, c >= 5 ? 68.75 : 55);
    assert.equal(effect(patient, "healOverTime").turns, c >= 1 ? 4 : 3);
    if (c >= 4) assert.equal(effect(patient, "attackMultiplier"), undefined);
  }
  assert.equal(hp[0], 260);
  assert.equal(hp[3], 273);
  assert.equal(hp[6], 353);
  const owner = actor("yuan", 2);
  const patient = ally("patient", { hp: 900 });
  cast(setup(owner, [patient]));
  assert.equal(patient.hp, 1000);
  assert.equal(patient.shield, 30);
});

test("艾妲 C0–C6：淨化、護盾與攻擊增益、雙目標、滿血全隊盾", () => {
  for (let c = 0; c <= 6; c++) {
    const owner = actor("eda", c);
    const first = ally("first", { hp: 700, effects: [{ name: "attackMultiplier", value: .8, turns: 2 }] });
    const second = ally("second", { hp: 900 });
    const state = setup(owner, [first, second]);
    cast(state);
    assert.equal(first.shield, Math.round(90 * (c >= 1 ? 1.08 : 1) * (c >= 3 ? 1.08 : 1)));
    assert.equal(effect(first, "attackMultiplier")?.value, c >= 5 ? 1.12 : c >= 2 ? 1.08 : undefined);
    assert.equal(second.shield > 0, c >= 4);
    assert.equal(effect(first, "attackMultiplier")?.value < 1, false);
  }
  const owner = actor("eda", 6);
  const first = ally("first");
  const second = ally("second");
  cast(setup(owner, [first, second]));
  assert.equal(first.shield, 145);
  assert.equal(second.shield, 40);
});

test("艾洛娜深水 C0–C6：雙人治療、持續回復、溢出護盾、淨化及敵方易傷", () => {
  const hp = [];
  for (let c = 0; c <= 6; c++) {
    const owner = actor("elorna", c, { activeForm: "deepwater" });
    const first = ally("first", { hp: 100, effects: [{ name: "attackMultiplier", value: .8, turns: 2 }] });
    const second = ally("second", { hp: 200 });
    const foe = enemy();
    cast(setup(owner, [first, second], [foe]));
    hp.push(first.hp);
    assert.equal(second.hp > 200, true);
    assert.equal(Boolean(effect(first, "healOverTime")), c >= 1);
    if (c >= 1) assert.equal(effect(first, "healOverTime").turns, 4);
    if (c >= 4) assert.equal(effect(first, "attackMultiplier"), undefined);
    if (c >= 6) assert.equal(effect(foe, "damageTaken").value, 1.05);
  }
  assert.equal(hp[0], 195);
  assert.equal(hp[3], 203);
  assert.equal(hp[5], 218);
  const owner = actor("elorna", 2, { activeForm: "deepwater" });
  const first = ally("first", { hp: 990 });
  cast(setup(owner, [first]));
  assert.ok(first.shield > 0);
  assert.ok(first.shield <= 80);
});

test("雷恩 C0–C6：掩護、速度、反擊、分擔、護盾與致命保護", () => {
  for (let c = 0; c <= 6; c++) {
    const owner = actor("reyn", c);
    const friend = ally("friend", { hp: 300 });
    const foe = enemy();
    const state = setup(owner, [friend], [foe]);
    cast(state);
    assert.equal(friend.cover.until, 3);
    assert.equal(effect(friend, "speedMultiplier")?.value, c >= 1 ? 1.08 : undefined);
    assert.equal(friend.shield, c >= 4 ? 80 : 0);
    state.activeActor = null;
    battle.hit(friend, 100);
    const remaining = c >= 4 ? 20 : 100;
    const shared = Math.round(remaining * .4);
    assert.equal(friend.hp, 300 - remaining + shared);
    assert.equal(owner.hp, 1000 - Math.round(shared * (c >= 3 ? .68 : .75)));
    assert.equal(foe.hp < foe.maxHp, c >= 2);
    if (c >= 5) assert.equal(effect(foe, "attackMultiplier").value, .9);
  }
  const owner = actor("reyn", 6);
  const friend = ally("friend", { hp: 100 });
  const state = setup(owner, [friend]);
  cast(state);
  state.activeActor = null;
  battle.hit(friend, 200);
  assert.equal(friend.hp, 100);
  assert.equal(owner.hp, 940);
  assert.equal(friend.cover, null);
});

test("莉亞 C0–C6：即時治療、持續輪數、溢出盾、淨化與一次性急救", () => {
  const healed = [];
  for (let c = 0; c <= 6; c++) {
    const owner = actor("lia", c);
    const friend = ally("friend", { hp: 100, effects: [{ name: "attackMultiplier", value: .8, turns: 2 }] });
    const state = setup(owner, [friend]);
    cast(state);
    healed.push(friend.hp);
    assert.equal(effect(friend, "healOverTime").value, c >= 5 ? 80 : 60);
    assert.equal(effect(friend, "healOverTime").turns, c >= 1 ? 4 : 3);
    if (c >= 4) {
      assert.equal(effect(friend, "attackMultiplier"), undefined);
      assert.equal(effect(owner, "speedMultiplier").value, 1.1);
    }
  }
  assert.equal(healed[0], 280);
  assert.equal(healed[3], 320);
  const owner = actor("lia", 2);
  const friend = ally("friend", { hp: 950 });
  cast(setup(owner, [friend]));
  assert.equal(friend.shield, 65);
  const savior = actor("lia", 6);
  const injured = ally("injured", { hp: 400 });
  const state = setup(savior, [injured]);
  state.activeActor = null;
  battle.hit(injured, 120);
  assert.equal(injured.hp, 380);
  assert.equal(effect(injured, "healOverTime").value, 80);
  battle.hit(injured, 120);
  assert.equal(injured.hp, 260);
});

test("伊薩爾 C0–C6：高生命狩獵、減傷、反擊、低血防禦與隔輪攔截", () => {
  const damages = [];
  for (let c = 0; c <= 6; c++) {
    const owner = actor("isar", c);
    const foe = enemy();
    const state = setup(owner, [ally()], [foe]);
    cast(state);
    damages.push(10000 - foe.hp);
    assert.equal(effect(owner, "damageTaken").value, c >= 1 ? .8 : .85);
    assert.equal(owner.huntCounterUntil, c >= 2 ? 2 : undefined);
    if (c >= 2) {
      state.activeActor = null;
      const before = foe.hp;
      battle.hit(owner, 100);
      assert.ok(foe.hp < before);
      if (c >= 5) assert.equal(effect(foe, "attackMultiplier").value, .9);
    }
  }
  assert.equal(damages[0], 198);
  assert.equal(damages[1], 206);
  assert.equal(damages[3], 244);
  const owner = actor("isar", 6, { hp: 400 });
  const friend = ally("friend", { hp: 400 });
  const foe = enemy();
  const state = setup(owner, [friend], [foe]);
  state.activeActor = null;
  battle.hit(friend, 100);
  assert.equal(friend.hp, 330);
  assert.equal(owner.hp, 370);
  assert.ok(foe.hp < foe.maxHp);
  battle.hit(owner, 10);
  assert.equal(effect(owner, "defenseMultiplier").value, 1.15);
  assert.equal(effect(owner, "healingMultiplier").value, 1.1);
});

test("瑟蕾雅 C0–C6：星痕倍率、同輪協同、追擊、轉標與冷卻", () => {
  const damages = [];
  for (let c = 0; c <= 6; c++) {
    const owner = actor("celesia", c);
    const friends = [ally("a"), ally("b"), ally("c")];
    const foe = enemy();
    const state = setup(owner, friends, [foe]);
    cast(state);
    damages.push(10000 - foe.hp);
    assert.equal(foe.coreMarks.celesia.until, 1 + (c >= 1 ? 3 : 2));
    assert.equal(effect(foe, "damageTaken").value, c >= 5 ? 1.12 : 1.08);
    state.activeActor = null;
    const before = foe.hp;
    battle.afterHit(friends[0], foe, false, 100);
    assert.equal(before - foe.hp, Math.round((c >= 5 ? 65 : c >= 3 ? 55 : 45) * (c >= 5 ? 1.12 : 1.08)));
    battle.afterHit(friends[1], foe, false, 100);
    assert.equal(state.logs.some(line => line.includes("同輪第二位")), c >= 2);
    battle.afterHit(friends[2], foe, false, 100);
    assert.equal(state.logs.some(line => line.includes("同輪三人協同追擊")), c >= 6);
  }
  assert.equal(damages[0], 140);
  assert.equal(damages[3], 170);
  const owner = actor("celesia", 4);
  const victim = enemy("victim", { hp: 100 });
  const next = enemy("next", { hp: 8000 });
  const state = setup(owner, [ally("a")], [victim, next]);
  cast(state);
  state.activeActor = null;
  battle.afterHit(state.team[1], victim, false, 100);
  assert.equal(next.coreMarks.celesia.until, 3);
  assert.equal(effect(next, "damageTaken").value, 1.08);
  assert.equal(owner.skillCooldown, 1);
});

test("Chodan C0–C6：速度、合拍次數、治療防護、冷卻與三人合拍", () => {
  for (let c = 0; c <= 6; c++) {
    const owner = actor("chodan", c);
    const friend = ally("friend", { hp: 500 });
    const state = setup(owner, [friend]);
    cast(state);
    assert.equal(effect(friend, "speedMultiplier").value, c >= 3 ? 1.11 : 1.1);
    assert.equal(state.beat.remaining, c >= 1 ? 3 : 2);
    assert.equal(state.beat.bonus, c >= 5 ? .14 : .1);
    state.activeActor = friend;
    battle.heal(friend, 100);
    assert.equal(friend.hp, 500 + Math.round(100 * (c >= 5 ? 1.14 : 1.1)));
    assert.equal(effect(friend, "damageTaken")?.value, c >= 2 ? .92 : undefined);
  }
  const { simulateBattle } = require("../src/battle.js");
  const stats = Object.fromEntries(["chodan", "magenta", "hina", "isar"].map(id => [id, { ...characterBattleStats[id], maxHp: 10000, attack: 200, defense: 1000, speed: id === "chodan" ? 200 : 100, constellation: 6 }]));
  const stage = { id: 998, name: "合拍驗證", trialRule: "basic", enemies: [{ name: "稽核獸", maxHp: 5000, attack: 1, defense: 0, speed: 1, count: 1 }] };
  const result = simulateBattle({ team: ["chodan", "magenta", "hina", "isar"], stats, stage, maxRounds: 60, rng: () => .5 });
  assert.ok(result.logs.some(line => line.includes("首次合拍，月式鼓點冷卻縮短")));
  assert.ok(result.logs.some(line => line.includes("三位不同隊友完成合拍")));
});

test("Magenta C0–C6：群傷、降防、負面加成、轉標及隊友追擊", () => {
  for (let c = 0; c <= 6; c++) {
    const owner = actor("magenta", c);
    const first = enemy();
    const second = enemy("second");
    const state = setup(owner, [ally()], [first, second]);
    cast(state);
    assert.equal(10000 - first.hp, c >= 3 ? 210 : 175);
    assert.equal(10000 - second.hp, c >= 3 ? 125 : 110);
    assert.equal(effect(first, "defenseMultiplier").value, c >= 1 ? .85 : .88);
    assert.equal(first.coreMarks.magenta.until, 3);
  }
  const damage = [];
  for (const c of [0, 2, 5]) {
    const owner = actor("magenta", c);
    const first = enemy("first", { effects: [{ name: "attackMultiplier", value: .9, turns: 2 }] });
    const second = enemy("second");
    cast(setup(owner, [], [first, second]));
    damage.push([10000 - first.hp, 10000 - second.hp]);
  }
  assert.deepEqual(damage, [[210, 110], [210, 145], [273, 160]]);
  const owner = actor("magenta", 6);
  const first = enemy("first", { hp: 100 });
  const second = enemy("second", { hp: 8000 });
  const state = setup(owner, [ally()], [first, second]);
  cast(state);
  state.activeActor = null;
  battle.afterHit(state.team[1], first, false, 100);
  assert.equal(second.coreMarks.magenta.until, 3);
  assert.equal(effect(second, "defenseMultiplier").value, .85);
  const before = second.hp;
  battle.afterHit(state.team[1], second, false, 100);
  assert.equal(before - second.hp, 70);
  assert.equal(second.coreMarks.magenta.until, 4);
});

test("Hina C0–C6：標記倍率、速度、追擊、減速、轉標與追擊", () => {
  for (let c = 0; c <= 6; c++) {
    const owner = actor("hina", c);
    const foe = enemy();
    const friend = ally();
    const state = setup(owner, [friend], [foe]);
    cast(state);
    assert.equal(10000 - foe.hp, c >= 3 ? 180 : 150);
    assert.equal(foe.coreMarks.hina.until, 1 + (c >= 1 ? 3 : 2));
    assert.equal(effect(owner, "speedMultiplier")?.value, c >= 1 ? 1.05 : undefined);
    assert.equal(effect(foe, "speedMultiplier")?.value, c >= 4 ? .9 : undefined);
    state.activeActor = null;
    const before = foe.hp;
    battle.afterHit(friend, foe, false, 100);
    assert.equal(before - foe.hp, Math.round((c >= 5 ? 65 : c >= 2 ? 45 : 0) * 1.08));
  }
  const owner = actor("hina", 6);
  const victim = enemy("victim", { hp: 100 });
  const next = enemy("next", { hp: 8000 });
  const state = setup(owner, [ally()], [victim, next]);
  cast(state);
  state.activeActor = null;
  battle.afterHit(state.team[1], victim, false, 100);
  assert.equal(next.coreMarks.hina.until, 3);
  assert.equal(effect(next, "damageTaken").value, 1.08);
  assert.equal(effect(next, "speedMultiplier").value, .9);
  assert.equal(next.hp, 7914);
});

test("Siyeon C0–C6：雙人即時治療、記錄、延遲上限、溢出、淨化及提前結算", () => {
  for (let c = 0; c <= 6; c++) {
    const owner = actor("siyeon", c);
    const first = ally("first", { hp: 500 });
    const second = ally("second", { hp: 600 });
    const state = setup(owner, [first, second]);
    cast(state);
    assert.equal(first.hp, 500 + (c >= 3 ? 110 : 80));
    assert.equal(second.hp, 600 + (c >= 3 ? 110 : 80));
    assert.equal(first.echoRecord.ratio, c >= 5 ? .4 : .3);
    assert.equal(first.echoRecord.cap, c >= 5 ? .2 : c >= 1 ? .18 : .14);
    assert.equal(first.echoRecord.settleRound, 3);
  }
  const owner = actor("siyeon", 4);
  const first = ally("first", { hp: 500 });
  const state = setup(owner, [first]);
  cast(state);
  state.activeActor = null;
  state.round = 2;
  battle.addEffect(first, "attackMultiplier", .8, 2);
  first.echoRecord.amount = 500;
  state.round = 3;
  battle.tickUnit(first);
  assert.equal(first.echoRecord, null);
  assert.equal(effect(first, "attackMultiplier"), undefined);
  assert.equal(first.shield, 80);
  const singer = actor("siyeon", 6);
  const patient = ally("patient", { hp: 300 });
  const other = ally("other", { hp: 400 });
  const emergency = setup(singer, [patient, other]);
  cast(emergency);
  emergency.activeActor = null;
  battle.hit(patient, 200);
  assert.equal(patient.echoRecord, null);
  assert.equal(effect(patient, "damageTaken")?.value, .9);
  battle.hit(other, 200);
  assert.ok(other.echoRecord);
});
