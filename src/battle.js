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
  function hasRole(role, roles) { return roles.indexOf(role) >= 0; }
  function effectValue(unit, name, fallback) {
    return (unit.effects || []).filter(function (effect) { return effect.name === name; }).reduce(function (value, effect) { return value * effect.value; }, fallback);
  }
  function hasEffect(unit, name) {
    return (unit.effects || []).some(function (effect) { return effect.name === name; });
  }
  var combat = null;
  function coreAlly(id) { return combat && combat.team.find(function (unit) { return unit.id === id && unit.hp > 0; }); }
  function coreFollowup(source, target, multiplier) {
    if (!source || !target || target.hp <= 0) return;
    var previous = combat.followup;
    var previousActor = combat.activeActor;
    combat.followup = true;
    combat.activeActor = null;
    hit(target, source.attack * multiplier * effectValue(source, "attackMultiplier", 1));
    combat.activeActor = previousActor;
    combat.followup = previous;
  }
  function afterHit(source, target, skill, dealt) {
    if (!combat || combat.followup || !source || source.isEnemy || !target || !target.isEnemy) return;
    var round = combat.round;
    ["celesia", "hina", "magenta", "risan", "mirea", "veyra"].forEach(function (id) {
      var owner = replaced(id), mark = target.coreMarks && target.coreMarks[id];
      if (!owner || !mark || mark.until < round || owner === source || dealt <= 0) return;
      var c = owner.constellation || 0;
      if (id === "celesia") {
        if (mark.triggerRound !== round) { mark.triggerRound = round; mark.triggerCount = 0; }
        mark.triggerCount += 1;
        if (mark.triggerCount === 1 && target.hp > 0) coreFollowup(owner, target, c >= 5 ? .6 : c >= 3 ? .5 : .4);
        if (c >= 2 && mark.triggerCount === 2 && target.hp > 0) { var extra = Math.round(dealt * .12); target.hp = Math.max(0, target.hp - extra); combat.logs.push("瑟蕾雅星痕協同追加 " + extra + " 傷害。"); }
        if (c >= 6 && mark.triggerCount === 3 && target.hp > 0) coreFollowup(owner, target, .7);
      } else if (id === "hina") {
        if (mark.triggerRound !== round && target.hp > 0) { mark.triggerRound = round; coreFollowup(owner, target, c >= 5 ? .5 : .3); }
      } else if (id === "risan") {
        if (mark.triggerRound !== round && target.hp > 0) { mark.triggerRound = round; coreFollowup(owner, target, c >= 2 ? .6 : .45); if (c >= 4) addEffect(target, "damageTaken", 1.08, 1); }
      } else if (id === "mirea") {
        if (mark.triggerRound !== round && target.hp > 0) { mark.triggerRound = round; coreFollowup(owner, target, c >= 5 ? .6 : c >= 2 ? .45 : .35); if (c >= 6) addEffect(source, "attackMultiplier", 1.08, 1); }
      } else if (id === "veyra") {
        if (mark.triggerRound !== round && target.hp > 0) { mark.triggerRound = round; coreFollowup(owner, target, .2); }
      }
    });
    var magenta = replaced("magenta");
    if (magenta && magenta.constellation >= 6 && hasMark(target, "magenta") && source !== magenta && target.hp > 0 && target.coreMarks.magenta.chaseRound !== round) {
      target.coreMarks.magenta.chaseRound = round;
      coreFollowup(magenta, target, .65);
    }
    if (magenta && hasMark(target, "magenta") && source !== magenta && source.element === "燕" && target.hp > 0) {
      var reaction = target.coreMarks.magenta;
      var maxTriggers = magenta.constellation >= 4 && new Set(alive(combat.team).map(function (unit) { return unit.element; })).size >= 2 ? 2 : 1;
      if (reaction.reactionRound !== round) { reaction.reactionRound = round; reaction.reactionCount = 0; }
      if (reaction.reactionCount < maxTriggers) {
        reaction.reactionCount += 1;
        coreFollowup(magenta, target, magenta.constellation >= 2 ? .5625 : .45);
        combat.logs.push("交鳴觸發：" + displayName(source) + " 引爆 " + displayName(magenta) + " 的灼印。");
        var hinaSupport = replaced("hina");
        if (hinaSupport && hinaSupport.constellation >= 1 && hasMark(target, "hina")) target.coreMarks.hina.fireBonusAvailable = true;
        if (magenta.constellation >= 2 && source.id === "hina" && reaction.reactionCount === 1 && nextEnemy(target)) coreFollowup(magenta, nextEnemy(target), .25);
        var hina = replaced("hina");
        if (hina && hina.constellation >= 3 && target.hp > 0) { coreFollowup(hina, target, .45); if (magenta && nextEnemy(target)) coreFollowup(hina, nextEnemy(target), .1125); }
        var chodan = replaced("chodan");
        if (chodan && chodan.constellation >= 1 && chodan.lastReactionRound !== round) {
          alive(combat.team).forEach(function (friend) { replacementShield(chodan, friend, source.id === "hina" || source.id === "magenta" ? .04 : .03); });
          chodan.lastReactionRound = round;
        }
        var siyeon = replaced("siyeon");
        if (siyeon && siyeon.constellation >= 4 && siyeon.lastReactionRound !== round) {
          var rescued = weakest(combat.team); replacementHeal(siyeon, rescued, .04);
          if (coreAlly("hina") || coreAlly("magenta")) cleanseOne(rescued, 0);
          siyeon.lastReactionRound = round;
        }
        if (magenta.constellation >= 4 && siyeon && reaction.reactionCount === 2) replacementHeal(siyeon, weakest(combat.team), .03);
      }
    }
    ["celesia", "hina", "magenta"].forEach(function (id) {
      var owner = coreAlly(id), mark = target.coreMarks && target.coreMarks[id];
      if (owner && owner.signature && owner.signature.type === "replacement") return;
      if (!owner || !mark || mark.until < round || owner === source || target.hp <= 0) return;
      if (id === "celesia") {
        if (mark.alliesRound !== round) { mark.alliesRound = round; mark.roundAllies = []; }
        mark.roundAllies = mark.roundAllies || [];
        if (mark.roundAllies.indexOf(source.id) < 0) mark.roundAllies.push(source.id);
        mark.allies = mark.allies || [];
        if (mark.allies.indexOf(source.id) < 0) mark.allies.push(source.id);
        if (owner.constellation >= 2 && mark.roundAllies.length === 2 && mark.secondBonusRound !== round && dealt > 0) {
          var bonus = Math.round(dealt * .15);
          target.hp = Math.max(0, target.hp - bonus);
          mark.secondBonusRound = round;
          combat.logs.push(displayName(owner) + " 的同輪第二位隊友協同，追加 " + bonus + " 傷害。");
        }
        if (mark.followRound !== round && target.hp > 0) { coreFollowup(owner, target, owner.constellation >= 5 ? .65 : owner.constellation >= 3 ? .55 : .45); mark.followRound = round; }
        if (owner.constellation >= 6 && mark.allies.length >= 3 && mark.finalRound !== round && target.hp > 0) { coreFollowup(owner, target, .9); mark.finalRound = round; owner.skillCooldown = Math.max(0, owner.skillCooldown - 1); combat.logs.push(displayName(owner) + " 的同輪三人協同追擊已觸發。"); }
      } else if (id === "hina" && owner.constellation >= 2 && mark.followRound !== round) {
        coreFollowup(owner, target, owner.constellation >= 5 ? .65 : .45); mark.followRound = round;
      } else if (id === "magenta" && owner.constellation >= 6 && mark.followRound !== round) {
        coreFollowup(owner, target, .7); mark.followRound = round; mark.until += 1;
      }
    });
    if (target.hp <= 0 && target.coreMarks) {
      var next = alive(combat.enemies).slice().sort(function (a, b) { return b.hp - a.hp; })[0];
      if (next) ["celesia", "hina", "magenta"].forEach(function (id) {
        var owner = coreAlly(id), mark = target.coreMarks[id];
        if (owner && owner.signature && owner.signature.type === "replacement") {
          if (!mark || owner.constellation < 4 || id === "magenta") return;
          if (id === "hina" && owner.constellation < 6) return;
          markTarget(next, id, id === "hina" ? 2 : 2);
          if (id === "hina") coreFollowup(owner, next, .7);
          else addEffect(next, "damageTaken", owner.constellation >= 5 ? 1.12 : 1.08, 2);
          return;
        }
        if (!owner || !mark || owner.constellation < 4) return;
        next.coreMarks = next.coreMarks || {}; next.coreMarks[id] = { until: round + 2, allies: [] };
        if (id === "celesia") {
          addEffect(next, "damageTaken", owner.constellation >= 5 ? 1.12 : 1.08, 2);
          owner.skillCooldown = Math.max(0, owner.skillCooldown - 1);
        }
        if (id === "hina") {
          addEffect(next, "damageTaken", 1.08, 2);
          addEffect(next, "speedMultiplier", .9, 2);
          if (owner.constellation >= 6) coreFollowup(owner, next, .8);
        }
        if (id === "magenta") addEffect(next, "defenseMultiplier", .85, 2);
      });
      var recipient = nextEnemy(target);
      if (recipient) ["cenwu", "veyra", "elorna", "rena", "mirea"].forEach(function (id) {
        var owner = replaced(id);
        if (!owner || owner.constellation < 6 || !hasMark(target, id)) return;
        markTarget(recipient, id, 2);
        if (id === "cenwu" || id === "elorna") addEffect(recipient, "damageTaken", 1.08, 2);
        if (id === "veyra") addEffect(recipient, "defenseMultiplier", .9, 2);
        if (id === "rena") coreFollowup(owner, recipient, .6);
        if (id === "mirea") addEffect(recipient, "attackMultiplier", .92, 1);
      });
    }
  }
  function addEffect(unit, name, value, turns) {
    unit.effects = unit.effects || [];
    // Keep the strongest effect in each direction, but allow a buff and a
    // debuff to counteract one another instead of silently discarding one.
    var previous = unit.effects.find(function (effect) {
      return effect.name === name && (effect.value - 1) * (value - 1) >= 0;
    });
    if (previous) {
      if (Math.abs(value - 1) > Math.abs(previous.value - 1)) previous.value = value;
      previous.turns = Math.max(previous.turns, Math.max(1, turns || 1));
      previous.appliedRound = combat ? combat.round : 0;
      return;
    }
    unit.effects.push({ name: name, value: value, turns: Math.max(1, turns || 1), appliedRound: combat ? combat.round : 0 });
  }
  function removeEffects(unit, names) {
    var list = Array.isArray(names) ? names : [names];
    unit.effects = (unit.effects || []).filter(function (effect) { return list.indexOf(effect.name) < 0; });
  }
  function tickUnit(unit) {
    if (combat && unit.replacementShields) {
      unit.replacementShields = unit.replacementShields.filter(function (entry) {
        if (entry.until >= combat.round) return true;
        unit.shield = Math.max(0, unit.shield - entry.amount);
        var chodan = entry.by === "chodan" ? replaced("chodan") : null;
        if (chodan && chodan.constellation >= 5 && entry.amount > 0) addEffect(unit, "damageTaken", .95, 1);
        return false;
      });
    }
    (unit.effects || []).filter(function (effect) { return effect.name === "healOverTime"; }).forEach(function (effect) {
      var recovered = heal(unit, effect.value);
      if (recovered > 0 && combat) combat.logs.push(displayName(unit) + " 持續治療回復 " + recovered + " HP。");
    });
    if (unit.skillCooldown > 0) unit.skillCooldown -= 1;
    if (combat && unit.echoRecord && unit.echoRecord.settleRound <= combat.round) {
      var singer = coreAlly("siyeon");
      if (singer && unit.hp > 0) {
        settleEcho(unit, singer);
        if (singer.constellation >= 4) cleanseOne(unit, unit.echoRecord.startRound);
      }
      unit.echoRecord = null;
    }
  }
  function expireEffects(unit) {
    unit.effects = (unit.effects || []).map(function (effect) {
      return Object.assign({}, effect, { turns: effect.turns - (effect.appliedRound < combat.round ? 1 : 0) });
    }).filter(function (effect) { return effect.turns > 0; });
  }

  function expandEnemies(stage) {
    var result = [];
    stage.enemies.forEach(function (template, groupIndex) {
      for (var index = 0; index < template.count; index += 1) {
        result.push({
          id: "enemy-" + groupIndex + "-" + index,
          name: template.name + (template.count > 1 ? " " + (index + 1) : ""),
          image: template.image || "",
          maxHp: template.maxHp,
          hp: template.maxHp,
          attack: template.attack,
          defense: template.defense,
          speed: template.speed,
          role: template.role || "敵人",
          attackName: template.attackName || "界痕攻擊",
          skillName: template.skillName || stage.enemyTrait || "敵方特技",
          trait: template.trait || stage.enemyTrait || "一般",
          traitKey: template.traitKey || stage.trialRule || "basic",
          guard: 0,
          shield: 0,
          effects: [],
          isEnemy: true,
          isBoss: false,
          skillCooldown: 0,
          skillCooldownMax: stage.trialRule === "time" ? 2 : 3,
          skillUses: 0
        });
      }
    });
    // 每組最高生命的單位視為首領，讓護盾與終局姿態不依賴名稱硬編碼。
    var boss = result.slice().sort(function (a, b) { return b.maxHp - a.maxHp; })[0];
    if (boss) boss.isBoss = true;
    return result;
  }

  function teamPower(teamIds, stats) {
    return teamIds.reduce(function (sum, id) {
      var item = stats[id];
      return sum + (item ? Math.round(item.maxHp / 10 + item.attack + item.defense) : 0);
    }, 0);
  }

  // 命座乘在等級後的面板上，避免高等級時 C2 與 C0 幾乎沒有差距。
  // 三星仍低於同定位四星；伊薩爾由資料層給較高的等級曲線。
  var CONSTELLATION_GROWTH = Object.freeze({
    threeStar: Object.freeze({ main: 0.035, defense: 0.035, speed: 0.004, skill: 0.018 }),
    fourStar: Object.freeze({ main: 0.08, defense: 0.08, speed: 0.004, skill: 0.01 })
  });

  function constellationGrowthFor(rarity) {
    return Number(rarity) === 4 ? CONSTELLATION_GROWTH.fourStar : CONSTELLATION_GROWTH.threeStar;
  }

  function buildEffectiveStats(baseStats, state) {
    var progressMap = state && state.characterProgress ? state.characterProgress : {};
    var result = {};
    Object.keys(baseStats || {}).forEach(function (id) {
      var base = clone(baseStats[id]);
      var progress = progressMap[id] || {};
      var level = Math.max(1, Number(progress.level) || 1);
      var constellation = clamp(Math.max(0, Number(progress.constellation) || 0), 0, 6);
      var isFourStar = base.rarity === 4;
      // 低基礎戰力的四星使用資料層標記的平衡成長帶，讓功能型角色在 70–90 等
      // 不會因初始面板較低而被永久拉開；這是角色定位平衡，不使用性別判定。
      var growth = base.growthRates || {};
      var mainGrowth = Number(growth.main) || (isFourStar ? 0.04 : 0.03);
      var defenseGrowth = Number(growth.defense) || (isFourStar ? 0.03 : 0.022);
      var speedGrowth = Number(growth.speed) || (isFourStar ? 0.012 : 0.009);
      var constellationGrowth = constellationGrowthFor(base.rarity);
      var multiplier = (1 + (level - 1) * mainGrowth) * (1 + constellation * constellationGrowth.main);
      base.maxHp = Math.round(base.maxHp * multiplier);
      base.attack = Math.round(base.attack * multiplier);
      base.defense = Math.round(base.defense * (1 + (level - 1) * defenseGrowth) * (1 + constellation * constellationGrowth.defense));
      base.speed = Math.round(base.speed * (1 + (level - 1) * speedGrowth + constellation * constellationGrowth.speed));
      if (Number.isFinite(Number(base.skillPower))) {
        base.skillPower = Number((Number(base.skillPower) * (1 + constellation * constellationGrowth.skill)).toFixed(4));
      }
      base.level = level;
      base.constellation = constellation;
      base.activeForm = progress.activeForm === "deepwater" ? "deepwater" : "land";
      result[id] = base;
    });
    return result;
  }

  function synergyScore(teamIds, stats) {
    var roles = teamIds.map(function (id) { return stats[id] && stats[id].role; }).filter(Boolean);
    var score = 0;
    var hasHealer = roles.some(function (role) { return hasRole(role, ["治療", "拾音", "修復"]); });
    var hasGuard = roles.some(function (role) { return hasRole(role, ["守衛", "重裝", "守門"]); });
    var hasSupport = roles.some(function (role) { return hasRole(role, ["指揮", "支援", "輔助", "節奏", "校準", "測量", "編譯", "仲裁"]); });
    var hasDamage = roles.some(function (role) { return hasRole(role, ["獵人", "斥候", "射手", "爆發", "鍛路"]); });
    if (hasHealer) score += 0.12;
    if (hasGuard) score += 0.1;
    if (hasSupport) score += 0.08;
    if (hasDamage) score += 0.08;
    if (new Set(roles).size >= 3) score += 0.08;
    if (hasHealer && hasGuard) score += 0.05;
    if (hasSupport && hasDamage) score += 0.05;
    if (roles.length >= 4 && new Set(roles).size === 1) score -= 0.12;
    return clamp(score, -0.12, 0.38);
  }

  function damageReductionForDefense(defense) {
    var threshold = 420 * .62;
    if (defense <= threshold) return clamp(defense / 420, 0, .62);
    // Keep the familiar low-level curve, then give late-game defense diminishing
    // returns instead of making every point above 260.4 completely inert.
    return .62 + .18 * (1 - Math.exp(-(defense - threshold) / 600));
  }

  function hit(target, rawDamage) {
    var shieldAtStart = target.shield || 0;
    var accelerateHot = null, lorneEmergency = null;
    if (combat && combat.activeActor && combat.activeActor.isEnemy && !target.isEnemy) {
      if (combat.activeActor.nextAttackReduction) { rawDamage *= 1 - combat.activeActor.nextAttackReduction; combat.activeActor.nextAttackReduction = 0; }
      if (combat.groupAttack && combat.activeActor.groupAttackReduction) rawDamage *= 1 - combat.activeActor.groupAttackReduction;
    }
    if (combat && combat.activeActor && !combat.activeActor.isEnemy && target.isEnemy) rawDamage *= effectValue(combat.activeActor, "attackMultiplier", 1);
    if (combat && combat.activeActor && !combat.activeActor.isEnemy && target.isEnemy && target.coreMarks) {
      var attacking = combat.activeActor;
      var reynMark = target.coreMarks.reyn;
      if (reynMark && reynMark.until >= combat.round && reynMark.charges > 0) { rawDamage *= 1.08; reynMark.charges -= 1; }
      var hinaMark = target.coreMarks.hina;
      if (hinaMark && hinaMark.until >= combat.round && (attacking.element === "烈" || attacking.element === "燕")) {
        rawDamage *= replaced("hina") && replaced("hina").constellation >= 4 ? 1.13 : 1.1;
        if (attacking.element === "烈" && hinaMark.fireBonusAvailable) { rawDamage *= 1.08; hinaMark.fireBonusAvailable = false; }
      }
      if (target.nextAllyBonus && attacking.id !== "rena") { rawDamage *= 1 + target.nextAllyBonus; target.nextAllyBonus = 0; }
    }
    if (combat && combat.activeActor && !combat.activeActor.isEnemy && target.isEnemy && combat.beat && combat.beat.remaining > 0 && combat.beat.until >= combat.round && combat.beat.owner !== combat.activeActor) rawDamage *= 1 + combat.beat.bonus;
    var defense = target.defense * effectValue(target, "defenseMultiplier", 1);
    var damage = Math.max(1, Math.round(rawDamage * effectValue(target, "damageTaken", 1) * (1 - damageReductionForDefense(defense))));
    if (hasEffect(target, "marked")) {
      damage = Math.round(damage * 1.18);
      removeEffects(target, "marked");
    }
    if (target.guard) {
      damage = Math.max(1, Math.round(damage * (1 - target.guard)));
      target.guard = 0;
    }
    if (target.shield > 0) {
      var absorbed = Math.min(target.shield, damage);
      target.shield -= absorbed;
      damage -= absorbed;
      var remainingAbsorb = absorbed;
      (target.replacementShields || []).forEach(function (entry) { var taken = Math.min(entry.amount, remainingAbsorb); entry.amount -= taken; remainingAbsorb -= taken; });
      if (combat && absorbed > 0 && !target.isEnemy) combat.logs.push(displayName(target) + " 的護盾吸收 " + absorbed + " 傷害。");
      if (combat && !target.isEnemy && target.shield === 0 && target.shieldBreakHeal && !target.shieldBreakHeal.used) {
        var shieldHealer = replaced(target.shieldBreakHeal.by);
        if (shieldHealer) { replacementHeal(shieldHealer, target, target.shieldBreakHeal.ratio); target.shieldBreakHeal.used = true; }
      }
      if (combat && !target.isEnemy && target.shield === 0 && target.guardHeal && !target.guardHeal.used) {
        var breakHealer = replaced(target.guardHeal.by);
        if (breakHealer) { replacementHeal(breakHealer, target, target.guardHeal.ratio); target.guardHeal.used = true; }
      }
    }
    if (combat && !target.isEnemy && damage > 0) {
      if (target.id === "isar" && target.constellation >= 4 && target.hp < target.maxHp * .5) {
        damage = Math.round(damage * (target.signature && target.signature.type === "replacement" ? .9 : .85));
      }
      var reyn = coreAlly("reyn"), cover = target.cover;
      if (reyn && cover && cover.until >= combat.round && reyn !== target) {
        var share = Math.round(damage * (reyn.signature && reyn.signature.type === "replacement" ? reyn.constellation >= 6 && damage >= target.hp ? .6 : cover.ratio || .2 : reyn.constellation >= 6 && damage >= target.hp ? 1 : .4));
        damage -= share;
        reyn.hp = Math.max(1, reyn.hp - Math.round(share * (reyn.signature && reyn.signature.type === "replacement" ? 1 : reyn.constellation >= 6 && share >= target.hp ? .5 : reyn.constellation >= 3 ? .68 : .75)));
        if (reyn.constellation >= 2 && cover.counterRound !== combat.round) {
          var counterTarget = alive(combat.enemies)[0];
          coreFollowup(reyn, counterTarget, reyn.signature && reyn.signature.type === "replacement" ? reyn.constellation >= 5 ? .75 : .55 : reyn.constellation >= 5 ? .9 : .7);
        if (reyn.constellation >= 5 && counterTarget) addEffect(counterTarget, "attackMultiplier", reyn.signature && reyn.signature.type === "replacement" ? .92 : .9, reyn.signature && reyn.signature.type === "replacement" ? 1 : 2);
          cover.counterRound = combat.round;
        }
        if (reyn.constellation >= 6 && share >= target.hp) target.cover = null;
      }
      var escort = target.escort, escorter = escort && coreAlly(escort.by);
      if (escorter && escort.until >= combat.round && escorter !== target) {
        var redirected = Math.round(damage * escort.ratio); damage -= redirected;
        escorter.hp = Math.max(1, escorter.hp - redirected);
        if (escorter.signature && escorter.signature.type === "replacement") {
          if (escorter.id === "harlow" && escort.healRound !== combat.round) { replacementHeal(escorter, escorter, .04); escort.healRound = combat.round; }
          if (escort.counter && escort.counterRound !== combat.round) { coreFollowup(escorter, alive(combat.enemies)[0], escort.counter); escort.counterRound = combat.round; if (escorter.id === "harlow" && escorter.constellation >= 4) addEffect(target, "attackMultiplier", 1.08, 1); }
        }
        // Escort remains active for the stated round window.
        if (redirected > 0) combat.logs.push(displayName(escorter) + " 護送 " + displayName(target) + "，分攤 " + redirected + " 傷害。");
      }
      var chodanWard = target.chodanWard && replaced("chodan");
      if (chodanWard && chodanWard.constellation >= 6 && !chodanWard.wardRescueUsed && target.chodanWard.until >= combat.round && shieldAtStart > 0 && damage >= target.hp) {
        damage = Math.max(0, target.hp - 1); chodanWard.wardRescueUsed = true; target.shield = 0;
        combat.logs.push("Chodan 的防護讓 " + displayName(target) + " 保留 1 HP。");
      }
      if (escorter && escorter.id === "harlow" && escorter.constellation >= 6 && !escorter.escortRescueUsed && damage >= target.hp) {
        damage = Math.max(0, target.hp - 1); escorter.escortRescueUsed = true; target.escort = null;
        combat.logs.push("赫洛的護送讓 " + displayName(target) + " 保留 1 HP。");
      }
      var isar = coreAlly("isar");
      if (isar && isar !== target && isar.constellation >= 6 && target.hp < target.maxHp * .5 && combat.round - (isar.lastInterceptRound || -2) >= 2) {
        var intercepted = Math.round(damage * (isar.signature && isar.signature.type === "replacement" ? .25 : .3)); damage -= intercepted; isar.hp = Math.max(1, isar.hp - intercepted); if (!isar.signature || isar.signature.type !== "replacement") coreFollowup(isar, alive(combat.enemies)[0], .8); isar.lastInterceptRound = combat.round;
      }
      if (target.echoRecord) target.echoRecord.amount += damage * target.echoRecord.ratio;
      var siyeonGuard = replaced("siyeon");
      if (siyeonGuard && siyeonGuard.constellation >= 2 && target.shield > 0 && coreAlly("chodan") && target.siyeonGuardRound !== combat.round) { replacementHeal(siyeonGuard, target, .03); target.siyeonGuardRound = combat.round; }
      if (target.guardHeal && target.guardHeal.until >= combat.round && !target.guardHeal.used && target.hp - damage < target.maxHp * .35 && target.guardHeal.lowTrigger) {
        var guardHealer = replaced(target.guardHeal.by);
        if (guardHealer) { replacementHeal(guardHealer, target, target.guardHeal.ratio); target.guardHeal.used = true; }
      }
      var siyeonReplacement = replaced("siyeon");
      if (siyeonReplacement && target.hotAcceleration && target.hotAcceleration.by === "siyeon" && !target.hotAcceleration.used && target.hp - damage > 0 && target.hp - damage < target.maxHp * (siyeonReplacement.constellation >= 6 ? .4 : .3)) accelerateHot = siyeonReplacement;
      var lorneReplacement = replaced("lorne");
      if (lorneReplacement && lorneReplacement.constellation >= 6 && !lorneReplacement.emergencyUsed && target.hp - damage <= 0) lorneEmergency = lorneReplacement;
      if (target.id === "rovienne" && target.signature && target.signature.type === "replacement" && target.constellation >= 6 && !target.lastRescueUsed && damage >= target.hp) {
        damage = Math.max(0, target.hp - 1); target.lastRescueUsed = true; replacementShield(target, target, .08);
      }
      if (target.id === "isar" && target.constellation >= 2 && target.huntCounterUntil >= combat.round && target.huntCounterRound !== combat.round) {
        var hunterTarget = alive(combat.enemies)[0];
        coreFollowup(target, hunterTarget, target.signature && target.signature.type === "replacement" ? target.constellation >= 5 ? .85 : .65 : target.constellation >= 5 ? 1.1 : .8);
        if (target.constellation >= 5 && hunterTarget) addEffect(hunterTarget, "attackMultiplier", target.signature && target.signature.type === "replacement" ? .92 : .9, target.signature && target.signature.type === "replacement" ? 1 : 2);
        target.huntCounterRound = combat.round;
      }
    }
    if (damage > 0) target.hp = Math.max(0, target.hp - damage);
    if (accelerateHot && target.hp > 0) {
      replacementHeal(accelerateHot, target, accelerateHot.constellation >= 5 ? .07 : accelerateHot.constellation >= 1 ? .06 : .05);
      target.hotAcceleration.used = true;
      if (accelerateHot.constellation >= 6) addEffect(target, "damageTaken", .9, 1);
    }
    if (lorneEmergency && target.hp <= 0) { replacementHeal(lorneEmergency, target, .1); lorneEmergency.emergencyUsed = true; combat.logs.push("洛恩急救已觸發。"); }
    if (combat && target.id === "isar" && target.constellation >= 4 && (!target.signature || target.signature.type !== "replacement") && target.hp > 0 && target.hp < target.maxHp * .5) {
      addEffect(target, "defenseMultiplier", 1.15, 2);
      addEffect(target, "healingMultiplier", 1.1, 2);
    }
    if (combat && !target.isEnemy && target.hp > 0 && target.hp < target.maxHp * .3) {
      var lia = coreAlly("lia"); lia && (lia.emergencyUsed = lia.emergencyUsed || {});
      if (lia && lia.constellation >= 6 && !lia.emergencyUsed[target.id]) { heal(target, lia.maxHp * (lia.signature && lia.signature.type === "replacement" ? .06 : .1)); if (!lia.signature || lia.signature.type !== "replacement") addEffect(target, "healOverTime", lia.maxHp * .08, 2); lia.emergencyUsed[target.id] = true; }
      var siyeon = coreAlly("siyeon");
      if (siyeon && siyeon.constellation >= 6 && target.hp < target.maxHp * .25 && target.echoRecord && !target.echoRecord.early && siyeon.earlyEchoCastId !== target.echoRecord.castId) {
        siyeon.earlyEchoCastId = target.echoRecord.castId;
        var remaining = Math.max(1, target.echoRecord.settleRound - combat.round);
        var recordStart = target.echoRecord.startRound;
        combat.logs.push(displayName(siyeon) + " 的回音對 " + displayName(target) + " 提前結算。");
        settleEcho(target, siyeon);
        if (siyeon.constellation >= 4) cleanseOne(target, recordStart);
        target.echoRecord = null;
        addEffect(target, "damageTaken", .9, remaining);
      }
    }
    return damage;
  }

  function heal(target, rawAmount) {
    if (combat && combat.activeActor && !combat.activeActor.isEnemy && combat.beat && combat.beat.remaining > 0 && combat.beat.until >= combat.round && combat.beat.owner !== combat.activeActor) {
      rawAmount *= 1 + combat.beat.bonus;
      if (combat.beat.owner.constellation >= 2) { addEffect(target, "damageTaken", .92, 2); combat.logs.push(displayName(combat.beat.owner) + " 的防護合拍讓 " + displayName(target) + " 短暫減傷。"); }
    }
    var amount = Math.max(0, Math.round(rawAmount * effectValue(target, "healingMultiplier", 1)));
    var before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + amount);
    return target.hp - before;
  }
  function settleEcho(unit, singer) {
    var recorded = unit.echoRecord.amount;
    var cap = singer.maxHp * unit.echoRecord.cap;
    var healed = heal(unit, Math.min(recorded, cap));
    var beforeShield = unit.shield || 0;
    if (singer.constellation >= 2 && recorded > cap) giveShield(unit, Math.min(singer.maxHp * .08, (recorded - cap) * .5));
    var shielded = (unit.shield || 0) - beforeShield;
    if (combat) combat.logs.push(displayName(singer) + " 的回音為 " + displayName(unit) + " 回復 " + healed + " HP" + (shielded > 0 ? "，追加 " + shielded + " 護盾" : "") + "。");
  }

  function chooseTarget(actor, targets) {
    var living = alive(targets);
    if (!living.length) return null;
    if (!actor.isEnemy && hasRole(actor.role, ["斥候", "射手", "獵人"])) {
      return living.slice().sort(function (a, b) { return (a.hp / a.maxHp) - (b.hp / b.maxHp); })[0];
    }
    if (actor.isEnemy && (actor.targetWeakest || hasRole(actor.traitKey, ["mark", "execute", "multi"]))) {
      return living.slice().sort(function (a, b) { return (a.hp / a.maxHp) - (b.hp / b.maxHp); })[0];
    }
    if (actor.isEnemy) return living.find(function (unit) { return unit.row === "front"; }) || living[0];
    return living[0];
  }

  function weakest(units) {
    return alive(units).slice().sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; })[0] || null;
  }
  function giveShield(unit, amount) {
    if (combat && combat.activeActor && !combat.activeActor.isEnemy && combat.beat && combat.beat.remaining > 0 && combat.beat.until >= combat.round && combat.beat.owner !== combat.activeActor) {
      amount *= 1 + combat.beat.bonus;
      if (combat.beat.owner.constellation >= 2) { addEffect(unit, "damageTaken", .92, 2); combat.logs.push(displayName(combat.beat.owner) + " 的防護合拍讓 " + displayName(unit) + " 短暫減傷。"); }
    }
    unit.shield = Math.min(Math.round(unit.maxHp * .28), Math.max(0, unit.shield || 0) + Math.round(amount));
  }
  function cleanse(unit) {
    unit.effects = (unit.effects || []).filter(function (effect) {
      return effect.name !== "marked" && !(["healingMultiplier", "attackMultiplier", "speedMultiplier", "defenseMultiplier"].includes(effect.name) && effect.value < 1);
    });
  }
  function cleanseOne(unit, sinceRound) {
    var index = (unit.effects || []).findIndex(function (effect) {
      return effect.appliedRound >= sinceRound && (effect.name === "marked" || (["healingMultiplier", "attackMultiplier", "speedMultiplier", "defenseMultiplier"].includes(effect.name) && effect.value < 1));
    });
    if (index >= 0) unit.effects.splice(index, 1);
  }

  function replaced(id) { return coreAlly(id) && coreAlly(id).signature && coreAlly(id).signature.type === "replacement" ? coreAlly(id) : null; }
  function replacementHit(actor, target, power) { return target ? hit(target, actor.attack * power) : 0; }
  function replacementHeal(actor, unit, ratio) { return unit ? heal(unit, actor.maxHp * ratio) : 0; }
  function replacementShield(actor, unit, ratio) {
    if (!unit) return;
    var before = unit.shield || 0;
    giveShield(unit, actor.maxHp * ratio);
    var gained = (unit.shield || 0) - before;
    if (gained > 0) {
      unit.replacementShields = unit.replacementShields || [];
      unit.replacementShields.push({ by: actor.id, amount: gained, until: combat.round + 2 });
    }
  }
  function markTarget(target, id, turns) { target.coreMarks = target.coreMarks || {}; target.coreMarks[id] = { until: combat.round + turns }; }
  function hasMark(target, id) { return !!(target.coreMarks && target.coreMarks[id] && target.coreMarks[id].until >= combat.round); }
  function nextEnemy(target) { return alive(combat.enemies).filter(function (unit) { return unit !== target; }).sort(function (a, b) { return b.hp - a.hp; })[0]; }
  function useReplacementSkill(actor, allies, enemies, logs) {
    var id = actor.id, c = actor.constellation || 0, target = chooseTarget(actor, enemies), living = alive(allies);
    var low = weakest(living), second = living.slice().sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; })[1];
    var damage = 0, treated = 0, unit, other, before;
    if (id === "celesia") {
      if (!target) return false;
      damage = replacementHit(actor, target, c >= 3 ? 1.65 : 1.4);
      markTarget(target, id, c >= 1 ? 3 : 2);
      addEffect(target, "damageTaken", c >= 5 ? 1.12 : 1.08, c >= 1 ? 3 : 2);
    } else if (id === "reyn") {
      if (!target) return false;
      markTarget(target, id, 1);
      target.coreMarks.reyn.charges = c >= 1 ? 3 : 2;
      unit = weakest(living.filter(function (friend) { return friend !== actor; }));
      if (unit) {
        unit.cover = { until: combat.round + 1, ratio: c >= 3 ? .25 : .2 };
        if (c >= 4 && unit.hp < unit.maxHp * .4) replacementShield(actor, unit, .07);
      }
    } else if (id === "lia" || id === "yuan" || id === "siyeon" || id === "lorne") {
      if (!low || (id !== "siyeon" && id !== "lorne" && low.hp >= low.maxHp)) return false;
      var recipients = id === "siyeon" || id === "lorne" ? [low, second].filter(Boolean) : [low];
      recipients.forEach(function (friend, index) {
        var ratio = id === "lia" ? c >= 3 ? .15 : .13 : id === "yuan" ? c >= 3 ? .16 : .14 : id === "siyeon" ? c >= 3 ? .13 : .1 : index ? c >= 1 ? .1 : .08 : c >= 3 ? .2 : .16;
        var actual = replacementHeal(actor, friend, ratio); treated += actual;
        if (id === "lia" || id === "yuan" || id === "siyeon") {
          addEffect(friend, "healOverTime", actor.maxHp * (id === "siyeon" ? c >= 5 ? .07 : c >= 1 ? .06 : .05 : c >= 5 ? .05 : .04), (id === "siyeon" ? 2 : c >= 1 ? 3 : 2) + 1);
          if ((id === "lia" || id === "yuan") && c >= 2 && actual < actor.maxHp * ratio) replacementShield(actor, friend, Math.min(id === "lia" ? .06 : .05, (actor.maxHp * ratio - actual) * .4 / actor.maxHp));
          if (id === "yuan" && c >= 4) cleanseOne(friend, 0);
          if (id === "siyeon") friend.hotAcceleration = { by: "siyeon", used: false };
      if (id === "siyeon" && c >= 2 && friend.shield > 0) addEffect(friend, "damageTaken", .95, 2);
          if (id === "siyeon" && c >= 5) cleanseOne(friend, 0);
        } else friend.guardHeal = { by: id, until: combat.round + 2, ratio: c >= 5 ? .06 : .04, lowTrigger: c >= 4, used: false };
      });
      if (id === "lia" && c >= 4) { addEffect(low, "damageTaken", .94, 1); if (target) addEffect(target, "damageTaken", 1.06, 1); }
      if (id === "yuan" && c >= 6 && low.hp < low.maxHp * .3) treated += replacementHeal(actor, low, .05);
      if (id === "lorne" && c >= 2) cleanseOne(low, 0);
    } else if (id === "isar") {
      if (!target) return false;
      damage = replacementHit(actor, target, (c >= 3 ? 1.9 : 1.65) * (target.hp > target.maxHp * .5 ? c >= 1 ? 1.25 : 1.2 : 1));
      addEffect(actor, "damageTaken", c >= 4 && actor.hp < actor.maxHp * .5 ? .75 : .85, 1);
      if (c >= 2) actor.huntCounterUntil = combat.round + 1;
    } else if (id === "chodan" || id === "yaoze") {
      living.forEach(function (friend) {
        replacementShield(actor, friend, id === "chodan" ? c >= 3 && new Set(living.map(function (u) { return u.element; })).size >= 2 ? .14 : .11 : c >= 1 ? .11 : .09);
        if (id === "chodan") addEffect(friend, "damageTaken", c >= 2 ? .89 : .92, c >= 3 && ["chodan", "magenta", "hina", "siyeon"].every(function (member) { return !!coreAlly(member); }) ? 3 : 2);
        if (id === "chodan") friend.chodanWard = { until: combat.round + 2 };
        else friend.shieldBreakHeal = { by: id, ratio: c >= 2 ? .05 : .04, cast: (actor.skillUses || 0) + 1 };
      });
      if (id === "chodan" && c >= 4) cleanseOne(low, 0);
      if (id === "yaoze") alive(enemies).forEach(function (foe) { foe.groupAttackReduction = c >= 3 ? .16 : .12; });
    } else if (id === "magenta") {
      if (!target) return false;
      var debuffed = (target.effects || []).some(function (effect) { return effect.value < 1 || effect.name === "damageTaken"; });
      damage = replacementHit(actor, target, (c >= 3 ? 2 : 1.75) * (debuffed ? c >= 5 ? 1.22 : 1.15 : 1));
      alive(enemies).filter(function (foe) { return foe !== target; }).forEach(function (foe) { replacementHit(actor, foe, c >= 3 ? 1.05 : .9); });
      markTarget(target, "magenta", c >= 1 ? 3 : 2);
    } else if (id === "hina") {
      if (!target) return false;
      damage = replacementHit(actor, target, 1.35);
      markTarget(target, "hina", c >= 2 ? 3 : 2);
    } else if (id === "cenwu") {
      if (!target) return false;
      damage = replacementHit(actor, target, c >= 3 ? 1.25 : 1.12);
      addEffect(target, "damageTaken", c >= 5 ? 1.11 : 1.08, c >= 1 ? 3 : 2);
      addEffect(target, "attackMultiplier", c >= 2 ? .88 : .92, c >= 1 ? 3 : 2);
      if (c >= 4) target.nextAttackReduction = .08;
      markTarget(target, id, c >= 1 ? 3 : 2);
    } else if (id === "ruida" || id === "harlow") {
      unit = low === actor ? second || low : low;
      replacementShield(actor, unit, id === "ruida" ? c >= 3 ? .15 : .13 : c >= 3 ? .2 : .17);
      if (unit !== actor) unit.escort = { by: id, ratio: id === "ruida" ? .3 : .35, until: combat.round + (c >= 1 ? 3 : 2), counter: c >= 2 ? id === "ruida" ? c >= 5 ? .75 : .5 : .65 : 0 };
      actor.guard = id === "ruida" ? .25 : 0;
      if (id === "harlow" && target) addEffect(target, "attackMultiplier", c >= 5 ? .82 : .88, 2);
      if (id === "ruida" && c >= 4) living.forEach(function (friend) { addEffect(friend, "damageTaken", .94, 1); });
      if (c >= 6 && unit.hp < unit.maxHp * .35 && id === "ruida") replacementShield(actor, unit, .05);
    } else if (id === "rena") {
      if (!target) return false;
      damage = replacementHit(actor, target, (c >= 3 ? 1.65 : 1.45) * (target.hp < target.maxHp * .4 ? c >= 5 ? 1.25 : 1.15 : 1));
      markTarget(target, "fire", c >= 1 ? 2 : 1);
      markTarget(target, "rena", c >= 1 ? 2 : 1);
      if (c >= 2 && target.hp > 0 && target.hp < target.maxHp * .4) damage += replacementHit(actor, target, .2);
      if (c >= 4) target.nextAllyBonus = .08;
    } else if (id === "veyra") {
      if (!target) return false;
      damage = replacementHit(actor, target, c >= 3 ? 1.35 : 1.18);
      addEffect(target, "defenseMultiplier", c >= 5 ? .77 : .82, c >= 1 ? 3 : 2);
      markTarget(target, "veyra", 2);
      if (c >= 2 && nextEnemy(target)) addEffect(nextEnemy(target), "defenseMultiplier", .9, 1);
      if (c >= 4) addEffect(target, "damageTaken", 1.08, 1);
    } else if (id === "elorna") {
      if (actor.activeForm === "deepwater") {
        [low, second].filter(Boolean).forEach(function (friend) { treated += replacementHeal(actor, friend, c >= 3 ? .11 : .09); friend.guard = Math.max(friend.guard || 0, c >= 4 ? .12 : .08); if (c >= 2) cleanseOne(friend, 0); if (c >= 1) addEffect(friend, "healOverTime", actor.maxHp * (c >= 5 ? .04 : .03), 2); if (c >= 6 && friend.hp < friend.maxHp * .3) treated += replacementHeal(actor, friend, .05); });
      } else {
        if (!target) return false;
        damage = replacementHit(actor, target, c >= 3 ? 1.25 : 1.1);
        addEffect(target, "damageTaken", c >= 5 ? 1.12 : 1.08, c >= 1 ? 3 : 2);
        if (c >= 2) addEffect(target, "attackMultiplier", .9, 1);
        if (c >= 4) target.nextAllyBonus = .08;
        markTarget(target, id, c >= 1 ? 3 : 2);
      }
    } else if (id === "eda") {
      var cleanPair = [low].concat(c >= 4 && second ? [second] : []);
      var bothClean = cleanPair.length === 2 && !cleanPair.some(function (friend) { return (friend.effects || []).some(function (effect) { return effect.value < 1; }); });
      cleanPair.forEach(function (friend) { cleanse(friend); replacementShield(actor, friend, c >= 1 ? .11 : .09); addEffect(friend, "attackMultiplier", c >= 5 ? 1.16 : c >= 2 ? 1.12 : 1.08, 1); if (c >= 3) addEffect(friend, "damageTaken", .92, 1); });
      if (c >= 6 && bothClean) living.forEach(function (friend) { replacementShield(actor, friend, .04); });
    } else if (id === "mave") {
      if (!target) return false;
      var isBroken = effectValue(target, "defenseMultiplier", 1) < 1;
      damage = replacementHit(actor, target, (c >= 3 ? 1.9 : 1.65) * (isBroken ? c >= 5 ? 1.3 : 1.2 : 1));
      target.skillCooldown = Math.min(target.skillCooldown + 1, target.skillCooldownMax + 1);
      markTarget(target, "mave", 2);
      if (c >= 1) addEffect(actor, "attackMultiplier", 1.1, 1);
      if (c >= 2 && nextEnemy(target)) nextEnemy(target).skillCooldown = Math.min(nextEnemy(target).skillCooldown + 1, nextEnemy(target).skillCooldownMax + 1);
      if (c >= 4) living.forEach(function (friend) { addEffect(friend, "attackMultiplier", 1.1, 1); });
    } else if (id === "rovienne") {
      if (!target) return false;
      var loss = Math.min(actor.hp - 1, Math.round(actor.maxHp * (c >= 1 ? .04 : .06)));
      actor.hp -= loss;
      damage = hit(target, actor.attack * (c >= 3 ? 2.15 : 1.85) * (actor.hp < actor.maxHp * .5 ? 1.25 : 1) + loss * (c >= 5 ? .55 : .35));
      if (c >= 2) replacementShield(actor, actor, .07);
      if (c >= 4 && actor.hp < actor.maxHp * .5) addEffect(actor, "damageTaken", .88, 1);
    } else if (id === "risan") {
      if (!target) return false;
      damage = replacementHit(actor, target, (c >= 3 ? 2.1 : 1.8) * ((target.effects || []).some(function (e) { return e.value < 1; }) ? c >= 5 ? 1.25 : 1.18 : 1));
      markTarget(target, "risan", c >= 1 ? 3 : 2);
    } else if (id === "maro") {
      if (!low) return false;
      before = (low.effects || []).length;
      cleanse(low);
      treated = replacementHeal(actor, low, c >= 3 ? .12 : .1);
      if ((low.effects || []).length === before) low.guard = Math.max(low.guard || 0, c >= 5 ? .15 : .1);
      if (c >= 2 && before > (low.effects || []).length) addEffect(low, "attackMultiplier", 1.06, 1);
    } else if (id === "evelyn") {
      if (!target) return false;
      damage = replacementHit(actor, target, c >= 3 ? 1.35 : 1.15);
      var buff = (target.effects || []).find(function (e) { return e.value > 1; });
      if (buff) { target.effects.splice(target.effects.indexOf(buff), 1); living.forEach(function (friend) { addEffect(friend, "attackMultiplier", c >= 4 ? 1.16 : 1.12, 1); }); if (c >= 2) actor.skillCooldown = Math.max(0, actor.skillCooldown - 1); }
      else addEffect(target, "defenseMultiplier", .9, c >= 1 ? 2 : 1);
    } else if (id === "mirea") {
      if (!target) return false;
      damage = replacementHit(actor, target, c >= 3 ? 1.45 : 1.25);
      markTarget(target, "mirea", c >= 1 ? 3 : 2);
    } else if (id === "ferye") {
      if (!target) return false;
      var back = alive(enemies).find(function (foe) { return foe.row === "back"; });
      if (back) target = back;
      damage = replacementHit(actor, target, (c >= 3 ? 2.2 : 1.9) * (target.missedByTeam ? c >= 5 ? 1.3 : 1.2 : 1) * (back && c >= 2 ? 1.15 : 1));
      if (c >= 6 && back && nextEnemy(target)) replacementHit(actor, nextEnemy(target), .7);
    } else if (id === "noreia") {
      living.forEach(function (friend) { addEffect(friend, "attackMultiplier", c >= 2 ? 1.11 : 1.08, 1); friend.accuracyAid = { by: id, charges: c >= 1 ? 2 : 1, reduction: .04, refund: true }; });
    } else if (id === "orivelle") {
      living.forEach(function (friend) { treated += replacementHeal(actor, friend, c >= 1 ? .06 : .05); addEffect(friend, "damageTaken", c >= 3 ? .91 : .94, c >= 5 ? 2 : 1); });
      alive(enemies).forEach(function (foe) { foe.groupAttackReduction = c >= 2 ? .2 : .15; });
    } else return false;
    logs.push(displayName(actor) + " 使用「" + actor.skillName + "」" + (damage ? "，造成 " + damage + " 傷害" : treated ? "，實際回復 " + treated + " HP" : "，效果已生效") + "。");
    return true;
  }

  function useSignatureSkill(actor, allies, enemies, logs) {
    var kit = actor.signature;
    if (!kit) return false;
    if (kit.type === "replacement") return useReplacementSkill(actor, allies, enemies, logs);
    if (kit.type === "core") return useCoreSkill(actor, allies, enemies, logs);
    var c = actor.constellation || 0;
    var duration = kit.duration + (c >= 1 ? 1 : 0);
    var stronger = c >= 3 ? 1.08 : 1;
    var living = alive(allies);
    var target = chooseTarget(actor, enemies);
    var subject = weakest(living);
    var damage = 0;
    if (kit.type === "mark" || kit.type === "control" || (kit.type === "form" && actor.activeForm !== "deepwater")) {
      if (!target) return false;
      damage = hit(target, actor.attack * (kit.power || 1) * stronger * (kit.execute && target.hp < target.maxHp * .4 ? 1 + kit.execute * (c >= 5 ? 1.5 : 1) : 1));
      var executeFollowup = kit.execute && c >= 2 && target.hp > 0 && target.hp < target.maxHp * .4;
      if (executeFollowup) damage += hit(target, actor.attack * .2);
      addEffect(target, "damageTaken", 1 + (kit.markBonus || .06) * (c >= 5 ? 1.35 : 1), duration);
      if (kit.defenseDown) addEffect(target, "defenseMultiplier", kit.defenseDown * (c >= 5 ? .94 : 1), duration);
      if (kit.slow) addEffect(target, "speedMultiplier", kit.slow * (c >= 5 ? .95 : 1), duration);
      if (kit.type === "control") {
          target.skillCooldown = Math.min(target.skillCooldown + 1, target.skillCooldownMax + 1);
      }
      if (c >= 2) {
        if (kit.type === "control") {
          var delayed = alive(enemies).find(function (unit) { return unit !== target; });
          if (delayed) delayed.skillCooldown = Math.min(delayed.skillCooldown + 1, delayed.skillCooldownMax + 1);
        }
        else if (actor.id === "veyra") {
          var second = alive(enemies).find(function (unit) { return unit !== target; });
          if (second) addEffect(second, "defenseMultiplier", .9, 1);
        } else if (actor.id !== "rena" || (executeFollowup && target.hp > 0)) addEffect(target, "attackMultiplier", .9, 1);
      }
      if (c >= 4) living.forEach(function (unit) { addEffect(unit, actor.id === "cenwu" || actor.id === "rena" ? "speedMultiplier" : "defenseMultiplier", 1.06, 1); });
      if (c >= 6 && target.hp <= 0) {
        var next = weakest(enemies);
        if (next) addEffect(next, "damageTaken", 1 + (kit.markBonus || .06), duration);
      }
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，對 " + displayName(target) + " 造成 " + damage + " 傷害並留下測線。" );
      return true;
    }
    if (kit.type === "guard") {
      var protectedUnits = living.slice().sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; }).slice(0, kit.targets || 1);
      protectedUnits.forEach(function (unit) {
        giveShield(unit, actor.maxHp * kit.shield * stronger * (c >= 1 ? 1.08 : 1));
        if (unit !== actor && kit.escort !== false) unit.escort = { by: actor.id, ratio: kit.burden ? .32 : .3, until: combat.round + duration };
        if (c >= 6 && unit.hp < unit.maxHp * .35) giveShield(unit, actor.maxHp * .06);
      });
      actor.guard = Math.max(actor.guard || 0, kit.guard);
      if (kit.attackDown && target) addEffect(target, "attackMultiplier", kit.attackDown * (c >= 5 ? .94 : 1), duration);
      if (kit.slow) alive(enemies).forEach(function (unit) { addEffect(unit, "speedMultiplier", kit.slow * (c >= 5 ? .95 : 1), duration); });
      if (c >= 2 && target) damage = hit(target, actor.attack * (c >= 5 ? .8 : .55));
      if (c >= 4) living.forEach(function (unit) { addEffect(unit, "damageTaken", .94, 1); });
      if (kit.burden) actor.hp = Math.max(1, actor.hp - Math.round(actor.maxHp * kit.burden * (c >= 5 ? .7 : 1)));
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，保護 " + protectedUnits.map(displayName).join("、") + "。" + (kit.slow ? "敵方速度下降。" : "") + (kit.burden ? "自身承受工程負載。" : ""));
      return true;
    }
    if (kit.type === "heal" || (kit.type === "form" && actor.activeForm === "deepwater")) {
      var healedTargets = living.slice().sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; }).slice(0, kit.targets || (kit.type === "form" ? 2 : 1));
      healedTargets.forEach(function (unit) {
        var requested = actor.maxHp * kit.instant * stronger * (kit.type === "form" && c >= 5 ? 1.15 : 1);
        var effective = heal(unit, requested);
        // The first tick happens next round, so retain one extra interval.
        if (kit.overTime) addEffect(unit, "healOverTime", actor.maxHp * kit.overTime * (c >= 5 ? 1.25 : 1), duration + 1);
        if (kit.type === "form" && c >= 1) addEffect(unit, "healOverTime", actor.maxHp * .03, duration + 1);
        if (c >= 2 && requested > effective) giveShield(unit, Math.min(actor.maxHp * .08, (requested - effective) * .5));
        if (c >= 4 && unit.hp < unit.maxHp * .4) cleanse(unit);
        if (c >= 6 && unit.hp < unit.maxHp * .3) heal(unit, actor.maxHp * .08);
      });
      if (kit.type === "form" && c >= 6 && target) addEffect(target, "damageTaken", 1.05, 1);
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，救援 " + healedTargets.map(displayName).join("、") + "。" );
      return true;
    }
    if (kit.type === "support") {
      var beneficiaries = living.slice().sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; }).slice(0, c >= 4 ? 2 : 1);
      beneficiaries.forEach(function (unit) { if (kit.cleanse) cleanse(unit); giveShield(unit, actor.maxHp * kit.shield * (c >= 1 ? 1.08 : 1) * stronger); if (c >= 2) addEffect(unit, "attackMultiplier", c >= 5 ? 1.12 : 1.08, 1); });
      if (c >= 6 && beneficiaries.length === 2 && !beneficiaries.some(function (unit) { return unit.hp < unit.maxHp; })) living.forEach(function (unit) { giveShield(unit, actor.maxHp * .04); });
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，完成校準與防護。" );
      return true;
    }
    return false;
  }

  function useCoreSkill(actor, allies, enemies, logs) {
    var kind = actor.signature.kind, c = actor.constellation || 0;
    var target = chooseTarget(actor, enemies), subject = weakest(allies), damage = 0;
    if (["star", "hunt", "bass", "string"].includes(kind) && !target) return false;
    if (kind === "star" || kind === "string") {
      damage = hit(target, actor.attack * (kind === "star" ? c >= 3 ? 1.7 : 1.4 : c >= 3 ? 1.8 : 1.5));
      target.coreMarks = target.coreMarks || {};
      target.coreMarks[actor.id] = { until: combat.round + (c >= 1 ? 3 : 2), allies: [] };
      addEffect(target, "damageTaken", kind === "star" && c >= 5 ? 1.12 : 1.08, c >= 1 ? 3 : 2);
      if (kind === "string") { if (c >= 1) addEffect(actor, "speedMultiplier", 1.05, 1); if (c >= 4) addEffect(target, "speedMultiplier", .9, 2); }
    } else if (kind === "cover") {
      subject = weakest(allies.filter(function (unit) { return unit !== actor; }));
      if (!subject) return false;
      subject.cover = { until: combat.round + 2 };
      if (c >= 1) addEffect(subject, "speedMultiplier", 1.08, 2);
      if (c >= 4 && subject.hp < subject.maxHp * .4) giveShield(subject, actor.maxHp * .08);
    } else if (kind === "lia") {
      if (!subject || subject.hp >= subject.maxHp) return false;
      var requested = actor.maxHp * (c >= 3 ? .22 : .18), actual = heal(subject, requested);
      addEffect(subject, "healOverTime", actor.maxHp * (c >= 5 ? .08 : .06), (c >= 1 ? 3 : 2) + 1);
      if (c >= 2 && actual < requested) giveShield(subject, Math.min(actor.maxHp * .1, (requested - actual) * .5));
      if (c >= 4 && subject.hp < subject.maxHp * .4) { cleanse(subject); addEffect(actor, "speedMultiplier", 1.1, 1); }
    } else if (kind === "hunt") {
      var high = target.hp > target.maxHp * .5;
      damage = hit(target, actor.attack * (c >= 3 ? 1.95 : 1.65) * (high ? c >= 1 ? 1.25 : 1.2 : 1));
      addEffect(actor, "damageTaken", c >= 1 ? .8 : .85, 1);
      actor.huntTarget = target.id;
      if (c >= 2) actor.huntCounterUntil = combat.round + 1;
      if (c >= 4 && actor.hp < actor.maxHp * .5) { addEffect(actor, "defenseMultiplier", 1.15, 2); addEffect(actor, "healingMultiplier", 1.1, 2); }
    } else if (kind === "beat") {
      alive(allies).forEach(function (unit) { addEffect(unit, "speedMultiplier", c >= 3 ? 1.11 : 1.1, 2); });
      combat.beat = { owner: actor, remaining: c >= 1 ? 3 : 2, used: [], bonus: c >= 5 ? .14 : .1, until: combat.round + 2 };
    } else if (kind === "bass") {
      var debuffed = (target.effects || []).some(function (effect) { return effect.value < 1 || effect.name === "damageTaken" || effect.name === "marked"; });
      damage = hit(target, actor.attack * (c >= 3 ? 2.1 : 1.75) * (debuffed ? c >= 5 ? 1.3 : 1.2 : 1));
      alive(enemies).filter(function (unit) { return unit !== target; }).forEach(function (unit) { hit(unit, actor.attack * (c >= 3 ? 1.25 : 1.1) + (debuffed && c >= 2 ? actor.attack * .35 : 0)); });
      addEffect(target, "defenseMultiplier", c >= 1 ? .85 : .88, 2);
      target.coreMarks = target.coreMarks || {}; target.coreMarks.magenta = { until: combat.round + 2 };
    } else if (kind === "echo") {
      actor.echoCastCount = (actor.echoCastCount || 0) + 1;
      alive(allies).sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; }).slice(0, 2).forEach(function (unit) {
        heal(unit, actor.maxHp * (c >= 3 ? .11 : .08));
        unit.echoRecord = { amount: 0, ratio: c >= 5 ? .4 : .3, cap: c >= 5 ? .2 : c >= 1 ? .18 : .14, startRound: combat.round, settleRound: combat.round + 2, castId: actor.echoCastCount };
      });
    }
    logs.push(displayName(actor) + " 使用「" + actor.skillName + "」" + (damage ? "，造成 " + damage + " 傷害" : "") + "。");
    return true;
  }

  function useCharacterSkill(actor, allies, enemies, logs) {
    if (actor.signature) return useSignatureSkill(actor, allies, enemies, logs);
    var livingAllies = alive(allies);
    var role = actor.role;
    var target;
    var damage;
    var wounded = livingAllies.filter(function (unit) { return unit.hp < unit.maxHp; });
    if (hasRole(role, ["治療", "拾音", "修復"])) {
      if (!wounded.length) return false;
      var targets = role === "修復" ? wounded.slice(0, 3) : [wounded.slice().sort(function (a, b) { return (a.hp / a.maxHp) - (b.hp / b.maxHp); })[0]];
      var healed = targets.map(function (unit) { return heal(unit, actor.maxHp * (role === "修復" ? .12 : .18) + actor.attack * .45); });
      if (role === "修復") targets.forEach(function (unit) {
        unit.effects = (unit.effects || []).filter(function (effect) { return effect.name !== "healingMultiplier" || effect.value >= 1; });
        addEffect(unit, "damageTaken", .88, 2);
      });
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，回復 " + targets.map(displayName).join("、") + " 共 " + healed.reduce(function (sum, value) { return sum + value; }, 0) + " HP。" + (role === "修復" ? "並整理受損狀態。" : ""));
      return true;
    }
    if (hasRole(role, ["守衛", "重裝", "守門"])) {
      actor.guard = role === "守門" ? .54 : .46;
      livingAllies.forEach(function (unit) { addEffect(unit, "defenseMultiplier", role === "守門" ? 1 / .86 : 1 / .9, 2); });
      if (role === "守門") enemies.forEach(function (unit) {
        unit.effects = (unit.effects || []).filter(function (effect) {
          return !((effect.name === "damageTaken" && effect.value < 1)
            || (["attackMultiplier", "defenseMultiplier", "speedMultiplier"].includes(effect.name) && effect.value > 1));
        });
      });
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，架起防禦壁壘，保護隊伍。" + (role === "守門" ? "並中止敵方增益。" : ""));
      return true;
    }
    if (hasRole(role, ["指揮", "支援", "節奏"])) {
      livingAllies.forEach(function (unit) {
        if (role === "節奏") addEffect(unit, "speedMultiplier", 1.16, 2);
        else if (role === "指揮") addEffect(unit, "attackMultiplier", 1.13, 2);
        else addEffect(unit, "defenseMultiplier", 1 / .88, 2);
      });
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，讓隊伍取得" + (role === "節奏" ? "速度" : role === "指揮" ? "攻擊" : "防禦") + "協同。" );
      return true;
    }
    target = chooseTarget(actor, enemies);
    if (!target) return false;
    damage = hit(target, actor.attack * actor.skillPower);
    if (hasRole(role, ["校準", "測量", "編譯", "仲裁"])) {
      addEffect(target, "defenseMultiplier", .78, 2);
      if (hasRole(role, ["校準", "編譯", "仲裁"])) {
        target.effects = (target.effects || []).filter(function (effect) {
          return !((effect.name === "damageTaken" && effect.value < 1)
            || (["attackMultiplier", "defenseMultiplier", "speedMultiplier"].includes(effect.name) && effect.value > 1));
        });
      }
    }
    if (role === "鍛路") addEffect(target, "attackMultiplier", .74, 2);
    if (hasRole(role, ["射手", "斥候", "獵人"])) addEffect(target, "marked", 1, 2);
    if (role === "爆發") {
      var second = alive(enemies).filter(function (unit) { return unit !== target; })[0];
      if (second) damage += hit(second, actor.attack * actor.skillPower * .45);
    }
    logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，對 " + displayName(target) + " 造成 " + damage + " 傷害。" + (hasRole(role, ["校準", "測量", "編譯", "仲裁"]) ? "敵方防禦被重新整理。" : ""));
    return true;
  }

  function useEnemySkill(actor, allies, enemies, logs, stage) {
    var rule = stage.trialRule || "basic";
    // allies are the enemy formation; enemies are the player's team.
    var target = chooseTarget(actor, enemies);
    var damage;
    if (rule === "copy" && !actor.copiedBuff) {
      var copied = null;
      alive(enemies).forEach(function (unit) {
        (unit.effects || []).forEach(function (effect) {
          if (!["attackMultiplier", "defenseMultiplier", "speedMultiplier"].includes(effect.name) || effect.value <= 1) return;
          if (!copied || effect.value > copied.value) copied = effect;
        });
      });
      if (copied) {
        addEffect(actor, copied.name, Math.min(1.2, copied.value), 2);
        actor.copiedBuff = true;
        logs.push(displayName(actor) + " 複寫我方一項增益，獲得" + ({attackMultiplier:"攻擊",defenseMultiplier:"防禦",speedMultiplier:"速度"}[copied.name]) + "加成。");
      }
    }
    if (rule === "shield" || rule === "copy" || rule === "finale") {
      // 開場護盾外最多重整兩次；護盾仍在或次數耗盡時改為進攻，
      // 避免永久刷新把戰鬥推到演算保護上限。
      if (!actor.shield && (actor.shieldRefreshes || 0) < 2) {
        actor.shield = Math.round(actor.maxHp * (rule === "finale" ? .2 : .14));
        actor.shieldRefreshes = (actor.shieldRefreshes || 0) + 1;
        logs.push(displayName(actor) + " 發動「" + actor.skillName + "」，重新整理終端護盾。" );
        return true;
      }
      if (rule === "finale" && actor.skillUses % 3 === 1) addEffect(actor, "attackMultiplier", 1.24, 2);
      if (rule === "finale" && actor.skillUses % 3 === 2) enemies.forEach(function (unit) { addEffect(unit, "attackMultiplier", .82, 2); });
    }
    if (!target) return false;
    if (rule === "finale" && target.shield > 0) target.shield = Math.round(target.shield * .65);
    if (rule === "guard") {
      actor.guard = .38;
      var boss = alive(allies).filter(function (unit) { return unit.isBoss; })[0];
      if (boss && boss !== actor) boss.guard = Math.max(boss.guard, .24);
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，替首領架起分攤壁壘。" );
      return true;
    }
    damage = hit(target, actor.attack * effectValue(actor, "attackMultiplier", 1) * (rule === "overload" ? 1.42 : 1.2));
    if (rule === "corrosion" || rule === "finale") addEffect(target, "healingMultiplier", rule === "finale" ? .85 : .72, 2);
    if (rule === "noise") target.skillCooldown = Math.max(target.skillCooldown, 1) + 1;
    if (rule === "multi" || rule === "mark" || rule === "execute") addEffect(target, "marked", 1, 2);
    if (rule === "execute" && target.hp < target.maxHp * .35) damage += hit(target, actor.attack * .42);
    if (rule === "multi") {
      var secondTarget = alive(enemies).filter(function (unit) { return unit !== target; })
        .sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; })[0];
      if (secondTarget) {
        var secondDamage = hit(secondTarget, actor.attack * effectValue(actor, "attackMultiplier", 1) * .55);
        logs.push(displayName(actor) + " 的多點攻勢波及 " + displayName(secondTarget) + "，造成 " + secondDamage + " 傷害。");
      }
    }
    if (rule === "decay") addEffect(actor, "attackMultiplier", 1.08, 2);
    logs.push(displayName(actor) + " 發動「" + actor.skillName + "」，對 " + displayName(target) + " 造成 " + damage + " 傷害。" + (rule === "corrosion" ? "附加潮蝕。" : rule === "finale" ? "壓低治療並削弱護盾。" : ""));
    return true;
  }

  function applyStageOpening(stage, team, enemies, logs) {
    var rule = stage.trialRule || "basic";
    if (rule === "shield" || rule === "copy" || rule === "finale") {
      enemies.forEach(function (enemy) { enemy.shield = Math.round(enemy.maxHp * (rule === "finale" ? .2 : .14)); });
      logs.push("敵方開場護盾已啟動，必須先削減護盾再處理生命值。");
    }
    if (rule === "ambush") enemies.forEach(function (enemy) { addEffect(enemy, "speedMultiplier", 1.16, 1); });
    if (rule === "noise") team.forEach(function (unit) { unit.skillCooldown = 1; });
    if (rule === "corrosion") team.forEach(function (unit) { addEffect(unit, "healingMultiplier", 1, 999); });
    if (rule === "mark" || rule === "multi" || rule === "execute" || rule === "finale") enemies.forEach(function (enemy) { enemy.targetWeakest = true; });
    if (rule === "decay") logs.push("邊緣崩解會隨回合增加敵方攻擊，請把握爆發窗口。");
  }

  function simulateBattle(options) {
    options = options || {};
    var teamIds = Array.isArray(options.team) ? options.team.slice(0, 4) : [];
    var stats = options.stats || {};
    var stage = options.stage;
    if (!stage) throw new Error("找不到試煉關卡");
    if (!teamIds.length) throw new Error("至少派出 1 名角色才能開始戰鬥");
    var rng = typeof options.rng === "function" ? options.rng : Math.random;
    var synergy = synergyScore(teamIds, stats);
    var luck = 0.84 + rng() * 0.28;
    var modifiers = Object.assign({ teamAttack: 1, teamDefense: 1, teamSpeed: 1, enemyAttack: 1, enemyDefense: 1, enemySpeed: 1, healing: 1 }, stage.modifiers || {});
    var teamFactor = 0.84 + rng() * 0.24 + synergy * 0.45;
    var enemyFactor = 0.96 + rng() * 0.14 - synergy * 0.15;
    var team = teamIds.map(function (id, slotIndex) {
      var data = stats[id];
      if (!data) throw new Error("找不到角色戰鬥數值：" + id);
      var scaled = clone(data);
      scaled.attack = Math.max(1, Math.round(scaled.attack * teamFactor * luck * modifiers.teamAttack));
      scaled.defense = Math.max(1, Math.round(scaled.defense * (0.94 + synergy * 0.3) * modifiers.teamDefense));
      scaled.maxHp = Math.max(1, Math.round(scaled.maxHp * (0.96 + synergy * 0.18)));
      scaled.speed = Math.max(1, Math.round(scaled.speed * modifiers.teamSpeed));
      var unit = Object.assign({ id: id, name: id, hp: scaled.maxHp, maxHp: scaled.maxHp, guard: 0, shield: 0, effects: [], skillCooldown: 0, skillCooldownMax: stage.trialRule === "echo" ? 2 : 3, skillUses: 0, isEnemy: false, slot: slotIndex + 1, row: slotIndex < 2 ? "front" : "back" }, scaled);
      if (unit.signature && unit.signature.cooldown) unit.skillCooldownMax = unit.signature.cooldown;
      if (modifiers.healing !== 1) addEffect(unit, "healingMultiplier", modifiers.healing, 999);
      return unit;
    });
    var enemies = expandEnemies(stage);
    combat = { team: team, enemies: enemies, round: 0, followup: false, beat: null, rng: rng, misses: { team: 0, enemy: 0 } };
    enemies.forEach(function (enemy) {
      enemy.attack = Math.max(1, Math.round(enemy.attack * enemyFactor * modifiers.enemyAttack));
      enemy.defense = Math.max(1, Math.round(enemy.defense * (0.98 + (1 - luck) * 0.12) * modifiers.enemyDefense));
      enemy.speed = Math.max(1, Math.round(enemy.speed * modifiers.enemySpeed));
    });
    var logs = ["第 " + stage.id + " 關：「" + stage.name + "」自走棋戰鬥開始。", "環境：「" + (stage.environment || "一般試煉") + "」｜" + (stage.environmentEffect || "沒有額外環境效果。"), "敵方特性：「" + (stage.enemyTrait || "一般") + "」｜" + (stage.enemyTraitEffect || "沒有額外特性。"), "隊伍協同 " + Math.round(synergy * 100) + "%，本局變動 " + Math.round(luck * 100) + "%。"];
    combat.logs = logs;
    applyStageOpening(stage, team, enemies, logs);
    var round = 0;
    // 50 回合對有護盾、治療或多階段首領的隊伍過於短，會把尚未結束的戰鬥誤報成失敗。
    // 保留演算保護上限避免真正的永迴圈，但把上限提高並回傳獨立的 timeout 狀態。
    var configuredMaxRounds = Number(options.maxRounds || stage.maxRounds || 180);
    var maxRounds = Number.isFinite(configuredMaxRounds) && configuredMaxRounds >= 60 ? Math.floor(configuredMaxRounds) : 180;
    while (alive(team).length && alive(enemies).length && round < maxRounds) {
      round += 1;
      combat.round = round;
      team.concat(enemies).forEach(function (unit) { if (unit.hp > 0) tickUnit(unit); });
      if (stage.trialRule === "decay" && round > 1) enemies.forEach(function (enemy) { if (enemy.hp > 0) addEffect(enemy, "attackMultiplier", 1.035, 2); });
      var order = alive(team).concat(alive(enemies)).sort(function (a, b) {
        return (b.speed * effectValue(b, "speedMultiplier", 1)) - (a.speed * effectValue(a, "speedMultiplier", 1)) || (rng() - .5);
      });
      order.forEach(function (actor) {
        if (actor.hp <= 0 || !alive(team).length || !alive(enemies).length) return;
        if (hasEffect(actor, "stun")) { logs.push(displayName(actor) + " 被暫停，跳過本次行動。" ); return; }
        var isTeam = !actor.isEnemy;
        var allies = isTeam ? team : enemies;
        var targets = isTeam ? enemies : team;
        if (actor.skillCooldown <= 0) {
          var beat = isTeam && combat.beat && combat.beat.remaining > 0 && combat.beat.until >= round && combat.beat.owner !== actor ? combat.beat : null;
          var prospectiveTarget = isTeam ? chooseTarget(actor, targets) : null;
          var beforeSkillHp = prospectiveTarget ? prospectiveTarget.hp : 0;
          var isReplacementAttack = isTeam && actor.signature && actor.signature.type === "replacement" && !["reyn", "lia", "yuan", "siyeon", "lorne", "chodan", "yaoze", "ruida", "harlow", "eda", "maro", "noreia", "orivelle"].includes(actor.id) && !(actor.id === "elorna" && actor.activeForm === "deepwater");
          if (isReplacementAttack) {
            var missRate = actor.id === "ferye" ? .05 : actor.id === "rena" ? .04 : .02;
            if (prospectiveTarget && hasMark(prospectiveTarget, "reyn")) missRate = Math.max(0, missRate - .03);
            if (actor.accuracyAid && actor.accuracyAid.charges > 0) { missRate = Math.max(0, missRate - actor.accuracyAid.reduction); actor.accuracyAid.charges -= 1; }
            if (rng() < missRate) {
              combat.misses.team += 1;
              actor.skillUses += 1;
              actor.skillCooldown = actor.skillCooldownMax;
              if (prospectiveTarget) prospectiveTarget.missedByTeam = true;
              logs.push(displayName(actor) + " 的「" + actor.skillName + "」失誤，本次造成 0 傷害。");
              if (actor.id === "ferye" && actor.constellation >= 4) actor.skillCooldown = Math.max(0, actor.skillCooldown - 1);
              if (actor.accuracyAid && actor.accuracyAid.refund) actor.skillCooldown = Math.max(0, actor.skillCooldown - 1);
              return;
            }
          }
          combat.activeActor = actor;
          combat.groupAttack = !isTeam && stage.trialRule === "multi";
          var usedSkill = isTeam ? useCharacterSkill(actor, allies, targets, logs) : useEnemySkill(actor, allies, targets, logs, stage);
          if (combat.groupAttack) actor.groupAttackReduction = 0;
          combat.activeActor = null;
          combat.groupAttack = false;
          if (usedSkill) {
            if (isTeam && prospectiveTarget && prospectiveTarget.hp < beforeSkillHp) afterHit(actor, prospectiveTarget, true, beforeSkillHp - prospectiveTarget.hp);
            if (beat) {
              beat.remaining -= 1; beat.used.push(actor.id);
              if (beat.owner.constellation >= 4 && beat.used.length === 1 && !beat.owner.c4RefundUsed) { beat.owner.skillCooldown = Math.max(0, beat.owner.skillCooldown - 1); beat.owner.c4RefundUsed = true; logs.push(displayName(beat.owner) + " 首次合拍，月式鼓點冷卻縮短。"); }
              if (beat.owner.constellation >= 6 && new Set(beat.used).size >= 3 && !beat.finalUsed) { beat.remaining += 1; beat.finalUsed = true; team.forEach(function (unit) { addEffect(unit, "speedMultiplier", 1.05, 2); }); logs.push("三位不同隊友完成合拍，追加一次合拍並提高全隊速度。"); }
            }
            actor.skillUses += 1;
            actor.skillCooldown = actor.skillCooldownMax;
            return;
          }
        }
        var target = chooseTarget(actor, targets);
        if (!target) return;
        var basicMiss = .02;
        if (isTeam && actor.accuracyAid && actor.accuracyAid.charges > 0) { basicMiss = Math.max(0, basicMiss - actor.accuracyAid.reduction); actor.accuracyAid.charges -= 1; }
        if (rng() < basicMiss) {
          combat.misses[isTeam ? "team" : "enemy"] += 1;
          if (isTeam) target.missedByTeam = true;
          logs.push(displayName(actor) + " 的普通攻擊失誤，本次造成 0 傷害。");
          return;
        }
        combat.activeActor = actor;
        var damage = hit(target, actor.attack * (actor.isEnemy ? effectValue(actor, "attackMultiplier", 1) : 1));
        combat.activeActor = null;
        if (!isTeam) {
          var maveOwner = replaced("mave");
          if (maveOwner && maveOwner.constellation >= 6 && hasMark(actor, "mave") && actor.maveFollowRound !== round) {
            coreFollowup(maveOwner, actor, .65); actor.maveFollowRound = round;
          }
        }
        if (isTeam) afterHit(actor, target, false, damage);
        logs.push(displayName(actor) + " 使用「" + (actor.attackName || "基本攻擊") + "」攻擊 " + displayName(target) + "，造成 " + damage + " 傷害。" );
        if (!isTeam && (stage.trialRule === "corrosion" || stage.trialRule === "finale")) addEffect(target, "healingMultiplier", stage.trialRule === "finale" ? .85 : .72, 2);
        if (!isTeam && (stage.trialRule === "multi" || stage.trialRule === "mark")) addEffect(target, "marked", 1, 2);
        if (target.hp <= 0) logs.push(displayName(target) + " 已離場。" );
      });
      team.concat(enemies).forEach(expireEffects);
    }
    var won = alive(enemies).length === 0 && alive(team).length > 0;
    var misses = { team: combat.misses.team, enemy: combat.misses.enemy };
    combat = null;
    var timedOut = !won && alive(team).length > 0 && alive(enemies).length > 0 && round >= maxRounds;
    var status = won ? "won" : timedOut ? "timeout" : "defeat";
    logs.push(won
      ? "試煉通關，隊伍在第 " + round + " 回合完成回覆。"
      : timedOut
        ? "戰鬥達到演算保護上限 " + maxRounds + " 回合，尚未判定通關；本次不會扣除挑戰次數。"
        : "試煉失敗，請調整隊伍或培養角色後再挑戰。" );
    return {
      won: won,
      status: status,
      timedOut: timedOut,
      roundLimit: maxRounds,
      stageId: stage.id,
      stageName: stage.name,
      environment: stage.environment || "一般試煉",
      enemyTrait: stage.enemyTrait || "一般",
      rounds: round,
      teamPower: teamPower(teamIds, stats),
      recommendedPower: Number(stage.recommendedPower || 0),
      powerRatio: stage.recommendedPower ? Math.round(teamPower(teamIds, stats) / Number(stage.recommendedPower) * 100) / 100 : null,
      synergy: synergy,
      luck: luck,
      misses: misses,
      team: team.map(function (unit) { return { id: unit.id, hp: unit.hp, maxHp: unit.maxHp, shield: unit.shield || 0, skillUses: unit.skillUses, slot: unit.slot, row: unit.row }; }),
      enemies: enemies.map(function (unit) { return { name: unit.name, image: unit.image, hp: unit.hp, maxHp: unit.maxHp, shield: unit.shield }; }),
      logs: logs.slice(-100),
      reward: won ? clone(stage.reward || {}) : { starSand: 0, characterExp: 0 }
    };
  }

  return {
    simulateBattle: simulateBattle,
    teamPower: teamPower,
    buildEffectiveStats: buildEffectiveStats,
    synergyScore: synergyScore,
    damageReductionForDefense: damageReductionForDefense,
    constellationGrowth: CONSTELLATION_GROWTH
  };
}));
