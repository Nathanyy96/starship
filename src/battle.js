(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.StarshipBattle = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function alive(list) { return list.filter(function (unit) { return unit.hp > 0; }); }
  function displayName(unit) { return unit.name || unit.id; }
  function expandEnemies(stage) {
    var result = [];
    stage.enemies.forEach(function (template, groupIndex) {
      for (var index = 0; index < template.count; index += 1) {
        result.push({ id: "enemy-" + groupIndex + "-" + index, name: template.name + (template.count > 1 ? " " + (index + 1) : ""), maxHp: template.maxHp, hp: template.maxHp, attack: template.attack, defense: template.defense, speed: template.speed, guard: 0 });
      }
    });
    return result;
  }
  function teamPower(teamIds, stats) {
    return teamIds.reduce(function (sum, id) {
      var item = stats[id];
      return sum + (item ? Math.round(item.maxHp / 10 + item.attack + item.defense) : 0);
    }, 0);
  }
  function hit(target, rawDamage) {
    var damage = Math.max(1, Math.round(rawDamage * (1 - clamp(target.defense / 420, 0, .62))));
    if (target.guard) { damage = Math.max(1, Math.round(damage * (1 - target.guard))); target.guard = 0; }
    target.hp = Math.max(0, target.hp - damage);
    return damage;
  }
  function chooseTarget(actor, targets) {
    var living = alive(targets);
    if (!living.length) return null;
    if (actor.role === "斥候" || actor.role === "射手") return living.slice().sort(function (a, b) { return a.hp - b.hp; })[0];
    return living[0];
  }
  function useSkill(actor, allies, enemies, logs) {
    var livingAllies = alive(allies);
    var target;
    if (actor.role === "治療" || actor.role === "拾音") {
      target = livingAllies.slice().sort(function (a, b) { return (a.hp / a.maxHp) - (b.hp / b.maxHp); })[0];
      if (target) {
        var heal = Math.round(actor.maxHp * .16 + actor.attack * .7);
        target.hp = Math.min(target.maxHp, target.hp + heal);
        logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，回復 " + displayName(target) + " " + heal + " HP。");
      }
      return true;
    }
    if (actor.role === "指揮" || actor.role === "節奏" || actor.role === "支援" || actor.role === "校準") {
      livingAllies.forEach(function (unit) { unit.buff = actor.role === "節奏" ? "speed" : "defense"; });
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，讓隊伍獲得支援效果。");
      return true;
    }
    if (actor.role === "守衛" || actor.role === "重裝") {
      actor.guard = .46;
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，架起防禦壁壘。");
      return true;
    }
    target = chooseTarget(actor, enemies);
    if (!target) return false;
    var damage = hit(target, actor.attack * actor.skillPower);
    logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，對 " + displayName(target) + " 造成 " + damage + " 傷害。");
    return true;
  }
  function simulateBattle(options) {
    options = options || {};
    var teamIds = Array.isArray(options.team) ? options.team.slice(0, 4) : [];
    var stats = options.stats || {};
    var stage = options.stage;
    if (!stage) throw new Error("找不到試煉關卡");
    if (!teamIds.length) throw new Error("至少派出 1 名角色才能開始戰鬥");
    var rng = typeof options.rng === "function" ? options.rng : Math.random;
    var team = teamIds.map(function (id) {
      var data = stats[id];
      if (!data) throw new Error("找不到角色戰鬥數值：" + id);
      return Object.assign({ id: id, name: id, hp: data.maxHp, maxHp: data.maxHp, guard: 0, buff: null, skillReady: true }, clone(data));
    });
    var enemies = expandEnemies(stage);
    var logs = ["第 " + stage.id + " 關：" + stage.name + "，自走棋戰鬥開始。"];
    var round = 0;
    var maxRounds = 40;
    while (alive(team).length && alive(enemies).length && round < maxRounds) {
      round += 1;
      var order = alive(team).concat(alive(enemies)).sort(function (a, b) { return (b.speed + (b.buff === "speed" ? 25 : 0)) - (a.speed + (a.buff === "speed" ? 25 : 0)) || (rng() - .5); });
      order.forEach(function (actor) {
        if (actor.hp <= 0 || !alive(team).length || !alive(enemies).length) return;
        var isTeam = team.indexOf(actor) >= 0;
        var allies = isTeam ? team : enemies;
        var targets = isTeam ? enemies : team;
        if (isTeam && actor.skillReady && (round === 1 || round % 3 === 0)) {
          if (useSkill(actor, allies, targets, logs)) { actor.skillReady = false; return; }
        }
        var target = chooseTarget(actor, targets);
        if (!target) return;
        var damage = hit(target, actor.attack);
        logs.push(displayName(actor) + " 攻擊 " + displayName(target) + "，造成 " + damage + " 傷害。");
        if (target.hp <= 0) logs.push(displayName(target) + " 已離場。");
      });
    }
    var won = alive(enemies).length === 0 && alive(team).length > 0;
    logs.push(won ? "試煉通關，隊伍在第 " + round + " 回合完成回覆。" : "試煉失敗，請調整隊伍或培養角色後再挑戰。");
    return {
      won: won,
      stageId: stage.id,
      stageName: stage.name,
      rounds: round,
      teamPower: teamPower(teamIds, stats),
      team: team.map(function (unit) { return { id: unit.id, hp: unit.hp, maxHp: unit.maxHp }; }),
      enemies: enemies.map(function (unit) { return { name: unit.name, hp: unit.hp, maxHp: unit.maxHp }; }),
      logs: logs.slice(-80),
      reward: won ? clone(stage.reward || {}) : { starSand: 0, echoPowder: 0 }
    };
  }

  return { simulateBattle: simulateBattle, teamPower: teamPower };
}));
