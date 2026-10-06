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
    ["celesia", "hina", "magenta"].forEach(function (id) {
      var owner = coreAlly(id), mark = target.coreMarks && target.coreMarks[id];
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
    var hasSupport = roles.some(function (role) { return hasRole(role, ["指揮", "支援", "節奏", "校準", "測量", "編譯", "仲裁"]); });
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
    if (combat && combat.activeActor && !combat.activeActor.isEnemy && target.isEnemy) rawDamage *= effectValue(combat.activeActor, "attackMultiplier", 1);
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
    }
    if (combat && !target.isEnemy && damage > 0) {
      if (target.id === "isar" && target.constellation >= 4 && target.hp < target.maxHp * .5) {
        damage = Math.round(damage * .85);
      }
      var reyn = coreAlly("reyn"), cover = target.cover;
      if (reyn && cover && cover.until >= combat.round && reyn !== target) {
        var share = Math.round(damage * (reyn.constellation >= 6 && damage >= target.hp ? 1 : .4));
        damage -= share;
        reyn.hp = Math.max(1, reyn.hp - Math.round(share * (reyn.constellation >= 6 && share >= target.hp ? .5 : reyn.constellation >= 3 ? .68 : .75)));
        if (reyn.constellation >= 2 && cover.counterRound !== combat.round) {
          var counterTarget = alive(combat.enemies)[0];
          coreFollowup(reyn, counterTarget, reyn.constellation >= 5 ? .9 : .7);
          if (reyn.constellation >= 5 && counterTarget) addEffect(counterTarget, "attackMultiplier", .9, 2);
          cover.counterRound = combat.round;
        }
        if (reyn.constellation >= 6 && share >= target.hp) target.cover = null;
      }
      var escort = target.escort, escorter = escort && coreAlly(escort.by);
      if (escorter && escort.until >= combat.round && escorter !== target) {
        var redirected = Math.round(damage * escort.ratio); damage -= redirected;
        escorter.hp = Math.max(1, escorter.hp - redirected);
        // Escort remains active for the stated round window.
        if (redirected > 0) combat.logs.push(displayName(escorter) + " 護送 " + displayName(target) + "，分攤 " + redirected + " 傷害。");
      }
      var isar = coreAlly("isar");
      if (isar && isar !== target && isar.constellation >= 6 && target.hp < target.maxHp * .5 && combat.round - (isar.lastInterceptRound || -2) >= 2) {
        var intercepted = Math.round(damage * .3); damage -= intercepted; isar.hp = Math.max(1, isar.hp - intercepted); coreFollowup(isar, alive(combat.enemies)[0], .8); isar.lastInterceptRound = combat.round;
      }
      if (target.echoRecord) target.echoRecord.amount += damage * target.echoRecord.ratio;
      if (target.id === "isar" && target.constellation >= 2 && target.huntCounterUntil >= combat.round && target.huntCounterRound !== combat.round) {
        var hunterTarget = alive(combat.enemies)[0];
        coreFollowup(target, hunterTarget, target.constellation >= 5 ? 1.1 : .8);
        if (target.constellation >= 5 && hunterTarget) addEffect(hunterTarget, "attackMultiplier", .9, 2);
        target.huntCounterRound = combat.round;
      }
    }
    if (damage > 0) target.hp = Math.max(0, target.hp - damage);
    if (combat && target.id === "isar" && target.constellation >= 4 && target.hp > 0 && target.hp < target.maxHp * .5) {
      addEffect(target, "defenseMultiplier", 1.15, 2);
      addEffect(target, "healingMultiplier", 1.1, 2);
    }
    if (combat && !target.isEnemy && target.hp > 0 && target.hp < target.maxHp * .3) {
      var lia = coreAlly("lia"); lia && (lia.emergencyUsed = lia.emergencyUsed || {});
      if (lia && lia.constellation >= 6 && !lia.emergencyUsed[target.id]) { heal(target, lia.maxHp * .1); addEffect(target, "healOverTime", lia.maxHp * .08, 2); lia.emergencyUsed[target.id] = true; }
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

  function useSignatureSkill(actor, allies, enemies, logs) {
    var kit = actor.signature;
    if (!kit) return false;
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
    combat = { team: team, enemies: enemies, round: 0, followup: false, beat: null };
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
          combat.activeActor = isTeam ? actor : null;
          var usedSkill = isTeam ? useCharacterSkill(actor, allies, targets, logs) : useEnemySkill(actor, allies, targets, logs, stage);
          combat.activeActor = null;
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
        var attackMultiplier = effectValue(actor, "attackMultiplier", 1);
        var damage = hit(target, actor.attack * attackMultiplier);
        if (isTeam) afterHit(actor, target, false, damage);
        logs.push(displayName(actor) + " 使用「" + (actor.attackName || "基本攻擊") + "」攻擊 " + displayName(target) + "，造成 " + damage + " 傷害。" );
        if (!isTeam && (stage.trialRule === "corrosion" || stage.trialRule === "finale")) addEffect(target, "healingMultiplier", stage.trialRule === "finale" ? .85 : .72, 2);
        if (!isTeam && (stage.trialRule === "multi" || stage.trialRule === "mark")) addEffect(target, "marked", 1, 2);
        if (target.hp <= 0) logs.push(displayName(target) + " 已離場。" );
      });
      team.concat(enemies).forEach(expireEffects);
    }
    var won = alive(enemies).length === 0 && alive(team).length > 0;
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
