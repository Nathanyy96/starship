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
    hit(target, source.attack * multiplier);
    combat.activeActor = previousActor;
    combat.followup = previous;
  }
  function afterHit(source, target, skill) {
    if (!combat || combat.followup || !source || source.isEnemy || !target || !target.isEnemy) return;
    var round = combat.round;
    ["celesia", "hina", "magenta"].forEach(function (id) {
      var owner = coreAlly(id), mark = target.coreMarks && target.coreMarks[id];
      if (!owner || !mark || mark.until < round || owner === source || target.hp <= 0) return;
      if (id === "celesia") {
        mark.allies = mark.allies || [];
        if (mark.allies.indexOf(source.id) < 0) mark.allies.push(source.id);
        if (mark.followRound !== round) { coreFollowup(owner, target, owner.constellation >= 5 ? .65 : owner.constellation >= 3 ? .55 : .45); mark.followRound = round; }
        if (owner.constellation >= 2 && mark.allies.length === 2) coreFollowup(source, target, .15);
        if (owner.constellation >= 6 && mark.allies.length >= 3 && mark.finalRound !== round) { coreFollowup(owner, target, .9); mark.finalRound = round; owner.skillCooldown = Math.max(0, owner.skillCooldown - 1); }
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
        if (id === "celesia") owner.skillCooldown = Math.max(0, owner.skillCooldown - 1);
        if (id === "hina" && owner.constellation >= 6) coreFollowup(owner, next, .8);
        if (id === "magenta") addEffect(next, "defenseMultiplier", .85, 2);
      });
    }
  }
  function addEffect(unit, name, value, turns) {
    unit.effects = unit.effects || [];
    // One active effect per category prevents four supports from multiplying a
    // buff or damage reduction into a permanent, uncapped loop.
    var previous = unit.effects.find(function (effect) { return effect.name === name; });
    if (previous) {
      if (Math.abs(value - 1) > Math.abs(previous.value - 1)) previous.value = value;
      previous.turns = Math.max(previous.turns, Math.max(1, turns || 1));
      return;
    }
    unit.effects.push({ name: name, value: value, turns: Math.max(1, turns || 1) });
  }
  function removeEffects(unit, names) {
    var list = Array.isArray(names) ? names : [names];
    unit.effects = (unit.effects || []).filter(function (effect) { return list.indexOf(effect.name) < 0; });
  }
  function tickUnit(unit) {
    (unit.effects || []).filter(function (effect) { return effect.name === "healOverTime"; }).forEach(function (effect) { heal(unit, effect.value); });
    unit.effects = (unit.effects || []).map(function (effect) {
      return { name: effect.name, value: effect.value, turns: effect.turns - 1 };
    }).filter(function (effect) { return effect.turns > 0; });
    if (unit.skillCooldown > 0) unit.skillCooldown -= 1;
    if (combat && unit.echoRecord && unit.echoRecord.settleRound <= combat.round) {
      var singer = coreAlly("siyeon");
      if (singer && unit.hp > 0) { heal(unit, Math.min(unit.echoRecord.amount, singer.maxHp * unit.echoRecord.cap)); if (singer.constellation >= 4) cleanse(unit); }
      unit.echoRecord = null;
    }
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

  // 命座是角色抽到重複後的主要成長回饋。三星的基礎面板與四星差距較大，
  // 因此三星採用較明顯但仍有上限的追趕倍率；四星則提升每命的存在感，
  // 讓滿命四星在高難度試煉有價值，但不會靠命座把推薦戰力直接打穿。
  var CONSTELLATION_GROWTH = Object.freeze({
    threeStar: Object.freeze({ main: 0.4, defense: 0.13, speed: 0.022, skill: 0.02 }),
    fourStar: Object.freeze({ main: 0.12, defense: 0.08, speed: 0.025, skill: 0.018 })
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
      var constellationGrowth = base.growthModel === "first-major"
        ? (isFourStar ? { main: .03, defense: .02, speed: .004, skill: .018 } : { main: .012, defense: .02, speed: .004, skill: .018 })
        : constellationGrowthFor(base.rarity);
      var multiplier = 1 + (level - 1) * mainGrowth + constellation * constellationGrowth.main;
      base.maxHp = Math.round(base.maxHp * multiplier);
      base.attack = Math.round(base.attack * multiplier);
      base.defense = Math.round(base.defense * (1 + (level - 1) * defenseGrowth + constellation * constellationGrowth.defense));
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

  function hit(target, rawDamage) {
    if (combat && combat.activeActor && !combat.activeActor.isEnemy && target.isEnemy && combat.beat && combat.beat.remaining > 0 && combat.beat.until >= combat.round && combat.beat.owner !== combat.activeActor) rawDamage *= 1 + combat.beat.bonus;
    var defense = target.defense * effectValue(target, "defenseMultiplier", 1);
    var damage = Math.max(1, Math.round(rawDamage * effectValue(target, "damageTaken", 1) * (1 - clamp(defense / 420, 0, .62))));
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
        if (reyn.constellation >= 2 && cover.counterRound !== combat.round) { coreFollowup(reyn, alive(combat.enemies)[0], reyn.constellation >= 5 ? .9 : .7); cover.counterRound = combat.round; }
        if (reyn.constellation >= 6 && share >= target.hp) target.cover = null;
      }
      var escort = target.escort, escorter = escort && coreAlly(escort.by);
      if (escorter && escort.until >= combat.round && escorter !== target) {
        var redirected = Math.round(damage * escort.ratio); damage -= redirected;
        escorter.hp = Math.max(1, escorter.hp - redirected);
        target.escort = null;
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
      if (lia && lia.constellation >= 6 && !lia.emergencyUsed[target.id]) { heal(target, lia.maxHp * .1); addEffect(target, "healOverTime", lia.maxHp * .08, 1); lia.emergencyUsed[target.id] = true; }
      var siyeon = coreAlly("siyeon");
      if (siyeon && siyeon.constellation >= 6 && target.echoRecord && !target.echoRecord.early) { heal(target, Math.min(target.echoRecord.amount, siyeon.maxHp * target.echoRecord.cap)); target.echoRecord.early = true; target.echoRecord.amount = 0; addEffect(target, "damageTaken", .9, 1); }
    }
    return damage;
  }

  function heal(target, rawAmount) {
    if (combat && combat.activeActor && !combat.activeActor.isEnemy && combat.beat && combat.beat.remaining > 0 && combat.beat.until >= combat.round && combat.beat.owner !== combat.activeActor) {
      rawAmount *= 1 + combat.beat.bonus;
      if (combat.beat.owner.constellation >= 2) addEffect(target, "damageTaken", .92, 2);
    }
    var amount = Math.max(0, Math.round(rawAmount * effectValue(target, "healingMultiplier", 1)));
    var before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + amount);
    return target.hp - before;
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
    return living[0];
  }

  function weakest(units) {
    return alive(units).slice().sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; })[0] || null;
  }
  function giveShield(unit, amount) {
    if (combat && combat.activeActor && !combat.activeActor.isEnemy && combat.beat && combat.beat.remaining > 0 && combat.beat.until >= combat.round && combat.beat.owner !== combat.activeActor) {
      amount *= 1 + combat.beat.bonus;
      if (combat.beat.owner.constellation >= 2) addEffect(unit, "damageTaken", .92, 2);
    }
    unit.shield = Math.min(Math.round(unit.maxHp * .28), Math.max(0, unit.shield || 0) + Math.round(amount));
  }
  function cleanse(unit) {
    unit.effects = (unit.effects || []).filter(function (effect) {
      return effect.name !== "marked" && !(["healingMultiplier", "attackMultiplier", "speedMultiplier", "defenseMultiplier"].includes(effect.name) && effect.value < 1);
    });
  }

  function useSignatureSkill(actor, allies, enemies, logs) {
    var kit = actor.signature;
    if (!kit) return false;
    if (kit.type === "core") return useCoreSkill(actor, allies, enemies, logs);
    var c = actor.constellation || 0;
    var duration = kit.duration + (c >= 1 ? 1 : 0);
    var stronger = c >= 3 ? 1.2 : 1;
    var living = alive(allies);
    var target = chooseTarget(actor, enemies);
    var subject = weakest(living);
    var damage = 0;
    if (kit.type === "mark" || kit.type === "control" || (kit.type === "form" && actor.activeForm !== "deepwater")) {
      if (!target) return false;
      damage = hit(target, actor.attack * (kit.power || 1) * stronger * (kit.execute && target.hp < target.maxHp * .4 ? 1 + kit.execute * (c >= 5 ? 1.5 : 1) : 1));
      if (kit.execute && c >= 2 && target.hp > 0 && target.hp < target.maxHp * .4) damage += hit(target, actor.attack * .2);
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
        } else addEffect(target, "attackMultiplier", .9, 1);
      }
      if (c >= 4) living.forEach(function (unit) { addEffect(unit, actor.id === "cenwu" || actor.id === "rena" ? "speedMultiplier" : "defenseMultiplier", actor.id === "cenwu" || actor.id === "rena" ? 1.06 : .94, 1); });
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
        if (unit !== actor) unit.escort = { by: actor.id, ratio: kit.burden ? .32 : .3, until: combat.round + duration };
        if (c >= 6 && unit.hp < unit.maxHp * .35) giveShield(unit, actor.maxHp * .06);
      });
      actor.guard = Math.max(actor.guard || 0, kit.guard);
      if (kit.attackDown && target) addEffect(target, "attackMultiplier", kit.attackDown * (c >= 5 ? .94 : 1), duration);
      if (c >= 2 && target) damage = hit(target, actor.attack * (c >= 5 ? .8 : .55));
      if (c >= 4) living.forEach(function (unit) { addEffect(unit, "damageTaken", .94, 1); });
      if (kit.burden) actor.hp = Math.max(1, actor.hp - Math.round(actor.maxHp * kit.burden * (c >= 5 ? .7 : 1)));
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，保護 " + protectedUnits.map(displayName).join("、") + "。" + (kit.burden ? "自身承受工程負載。" : ""));
      return true;
    }
    if (kit.type === "heal" || (kit.type === "form" && actor.activeForm === "deepwater")) {
      var healedTargets = living.slice().sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; }).slice(0, kit.targets || (kit.type === "form" ? 2 : 1));
      healedTargets.forEach(function (unit) {
        var requested = actor.maxHp * kit.instant * stronger * (kit.type === "form" && c >= 5 ? 1.15 : 1);
        var effective = heal(unit, requested);
        if (kit.overTime) addEffect(unit, "healOverTime", actor.maxHp * kit.overTime * (c >= 5 ? 1.25 : 1), duration);
        if (kit.type === "form" && c >= 1) addEffect(unit, "healOverTime", actor.maxHp * .03, duration);
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
      beneficiaries.forEach(function (unit) { if (kit.cleanse) cleanse(unit); giveShield(unit, actor.maxHp * kit.shield * stronger); if (c >= 2) addEffect(unit, "attackMultiplier", c >= 5 ? 1.12 : 1.08, 1); });
      if (c >= 6 && !beneficiaries.some(function (unit) { return unit.hp < unit.maxHp; })) living.forEach(function (unit) { giveShield(unit, actor.maxHp * .04); });
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
      damage = hit(target, actor.attack * effectValue(actor, "attackMultiplier", 1) * (kind === "star" ? c >= 3 ? 1.7 : 1.4 : c >= 3 ? 1.8 : 1.5));
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
      addEffect(subject, "healOverTime", actor.maxHp * (c >= 5 ? .08 : .06), c >= 1 ? 3 : 2);
      if (c >= 2 && actual < requested) giveShield(subject, Math.min(actor.maxHp * .1, (requested - actual) * .5));
      if (c >= 4 && subject.hp < subject.maxHp * .4) { cleanse(subject); addEffect(actor, "speedMultiplier", 1.1, 1); }
    } else if (kind === "hunt") {
      var high = target.hp > target.maxHp * .5;
      damage = hit(target, actor.attack * effectValue(actor, "attackMultiplier", 1) * (c >= 3 ? 1.95 : 1.65) * (high ? c >= 1 ? 1.25 : 1.2 : 1));
      addEffect(actor, "damageTaken", c >= 1 ? .8 : .85, 1);
      actor.huntTarget = target.id;
      if (c >= 2) actor.huntCounterUntil = combat.round + 1;
      if (c >= 4 && actor.hp < actor.maxHp * .5) { addEffect(actor, "defenseMultiplier", 1.15, 2); addEffect(actor, "healingMultiplier", 1.1, 2); }
    } else if (kind === "beat") {
      alive(allies).forEach(function (unit) { addEffect(unit, "speedMultiplier", c >= 3 ? 1.13 : 1.1, 2); });
      combat.beat = { owner: actor, remaining: c >= 1 ? 3 : 2, used: [], bonus: c >= 5 ? .14 : .1, until: combat.round + 2 };
    } else if (kind === "bass") {
      var debuffed = (target.effects || []).some(function (effect) { return effect.value < 1 || effect.name === "damageTaken" || effect.name === "marked"; });
      damage = hit(target, actor.attack * effectValue(actor, "attackMultiplier", 1) * (c >= 3 ? 2.1 : 1.75) * (debuffed ? c >= 5 ? 1.3 : 1.2 : 1));
      alive(enemies).filter(function (unit) { return unit !== target; }).forEach(function (unit) { hit(unit, actor.attack * effectValue(actor, "attackMultiplier", 1) * (c >= 3 ? 1.25 : 1.1) + (debuffed && c >= 2 ? actor.attack * .35 : 0)); });
      addEffect(target, "defenseMultiplier", c >= 1 ? .85 : .88, 2);
      target.coreMarks = target.coreMarks || {}; target.coreMarks.magenta = { until: combat.round + 2 };
    } else if (kind === "echo") {
      alive(allies).sort(function (a, b) { return a.hp / a.maxHp - b.hp / b.maxHp; }).slice(0, 2).forEach(function (unit) {
        heal(unit, actor.maxHp * (c >= 3 ? .11 : .08));
        unit.echoRecord = { amount: 0, ratio: c >= 5 ? .4 : .3, cap: c >= 5 ? .2 : c >= 1 ? .18 : .14, settleRound: combat.round + 2 };
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
      if (role === "修復") targets.forEach(function (unit) { removeEffects(unit, "healingMultiplier"); addEffect(unit, "damageTaken", .88, 2); });
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，回復 " + targets.map(displayName).join("、") + " 共 " + healed.reduce(function (sum, value) { return sum + value; }, 0) + " HP。" + (role === "修復" ? "並整理受損狀態。" : ""));
      return true;
    }
    if (hasRole(role, ["守衛", "重裝", "守門"])) {
      actor.guard = role === "守門" ? .54 : .46;
      livingAllies.forEach(function (unit) { addEffect(unit, "defenseMultiplier", role === "守門" ? .86 : .9, 2); });
      if (role === "守門") enemies.forEach(function (unit) { removeEffects(unit, ["attackMultiplier", "damageTaken"]); });
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，架起防禦壁壘，保護隊伍。" + (role === "守門" ? "並中止敵方增益。" : ""));
      return true;
    }
    if (hasRole(role, ["指揮", "支援", "節奏"])) {
      livingAllies.forEach(function (unit) {
        if (role === "節奏") addEffect(unit, "speedMultiplier", 1.16, 2);
        else if (role === "指揮") addEffect(unit, "attackMultiplier", 1.13, 2);
        else addEffect(unit, "defenseMultiplier", .88, 2);
      });
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，讓隊伍取得" + (role === "節奏" ? "速度" : role === "指揮" ? "攻擊" : "防禦") + "協同。" );
      return true;
    }
    target = chooseTarget(actor, enemies);
    if (!target) return false;
    damage = hit(target, actor.attack * actor.skillPower);
    if (hasRole(role, ["校準", "測量", "編譯", "仲裁"])) {
      addEffect(target, "defenseMultiplier", .78, 2);
      if (hasRole(role, ["校準", "編譯", "仲裁"])) removeEffects(target, ["attackMultiplier", "damageTaken"]);
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
    var target = chooseTarget(actor, allies);
    var damage;
    if (rule === "shield" || rule === "copy" || rule === "finale") {
      if (!actor.shield) actor.shield = Math.round(actor.maxHp * (rule === "finale" ? .2 : .14));
      if (rule === "finale" && actor.skillUses % 3 === 1) addEffect(actor, "attackMultiplier", 1.24, 2);
      if (rule === "finale" && actor.skillUses % 3 === 2) allies.forEach(function (unit) { addEffect(unit, "attackMultiplier", .82, 2); });
      logs.push(displayName(actor) + " 發動「" + actor.skillName + "」，重新整理終端護盾。" + (rule === "finale" ? "姿態輪換。" : ""));
      return true;
    }
    if (!target) return false;
    if (rule === "guard") {
      actor.guard = .38;
      var boss = alive(enemies).filter(function (unit) { return unit.isBoss; })[0];
      if (boss && boss !== actor) boss.guard = Math.max(boss.guard, .24);
      logs.push(displayName(actor) + " 使用「" + actor.skillName + "」，替首領架起分攤壁壘。" );
      return true;
    }
    damage = hit(target, actor.attack * (rule === "overload" ? 1.42 : 1.2));
    if (rule === "corrosion") addEffect(target, "healingMultiplier", .72, 2);
    if (rule === "noise") target.skillCooldown = Math.max(target.skillCooldown, 1) + 1;
    if (rule === "multi" || rule === "mark" || rule === "execute") addEffect(target, "marked", 1, 2);
    if (rule === "execute" && target.hp < target.maxHp * .35) damage += hit(target, actor.attack * .42);
    if (rule === "decay") addEffect(actor, "attackMultiplier", 1.08, 2);
    logs.push(displayName(actor) + " 發動「" + actor.skillName + "」，對 " + displayName(target) + " 造成 " + damage + " 傷害。" + (rule === "corrosion" ? "附加潮蝕。" : ""));
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
    if (rule === "mark" || rule === "multi" || rule === "execute") enemies.forEach(function (enemy) { enemy.targetWeakest = true; });
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
    var team = teamIds.map(function (id) {
      var data = stats[id];
      if (!data) throw new Error("找不到角色戰鬥數值：" + id);
      var scaled = clone(data);
      scaled.attack = Math.max(1, Math.round(scaled.attack * teamFactor * luck * modifiers.teamAttack));
      scaled.defense = Math.max(1, Math.round(scaled.defense * (0.94 + synergy * 0.3) * modifiers.teamDefense));
      scaled.maxHp = Math.max(1, Math.round(scaled.maxHp * (0.96 + synergy * 0.18)));
      scaled.speed = Math.max(1, Math.round(scaled.speed * modifiers.teamSpeed));
      var unit = Object.assign({ id: id, name: id, hp: scaled.maxHp, maxHp: scaled.maxHp, guard: 0, shield: 0, effects: [], skillCooldown: 0, skillCooldownMax: stage.trialRule === "echo" ? 2 : 3, skillUses: 0, isEnemy: false }, scaled);
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
    applyStageOpening(stage, team, enemies, logs);
    var round = 0;
    // 50 回合對有護盾、治療或多階段首領的隊伍過於短，會把尚未結束的戰鬥誤報成失敗。
    // 保留演算保護上限避免真正的永迴圈，但把上限提高並回傳獨立的 timeout 狀態。
    var configuredMaxRounds = Number(options.maxRounds || stage.maxRounds || 120);
    var maxRounds = Number.isFinite(configuredMaxRounds) && configuredMaxRounds >= 60 ? Math.floor(configuredMaxRounds) : 120;
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
            if (isTeam && prospectiveTarget && prospectiveTarget.hp < beforeSkillHp) afterHit(actor, prospectiveTarget, true);
            if (beat) {
              beat.remaining -= 1; beat.used.push(actor.id);
              if (beat.owner.constellation >= 2 && (!actor.signature || ["heal", "guard", "support"].includes(actor.signature.type))) addEffect(actor, "damageTaken", .92, 2);
              if (beat.owner.constellation >= 4 && beat.used.length === 1) beat.owner.skillCooldown = Math.max(0, beat.owner.skillCooldown - 1);
              if (beat.owner.constellation >= 6 && new Set(beat.used).size >= 3 && !beat.finalUsed) { beat.remaining += 1; beat.finalUsed = true; team.forEach(function (unit) { addEffect(unit, "speedMultiplier", 1.05, 2); }); }
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
        if (isTeam) afterHit(actor, target, false);
        logs.push(displayName(actor) + " 使用「" + (actor.attackName || "基本攻擊") + "」攻擊 " + displayName(target) + "，造成 " + damage + " 傷害。" );
        if (!isTeam && stage.trialRule === "corrosion") addEffect(target, "healingMultiplier", .72, 2);
        if (!isTeam && (stage.trialRule === "multi" || stage.trialRule === "mark")) addEffect(target, "marked", 1, 2);
        if (target.hp <= 0) logs.push(displayName(target) + " 已離場。" );
      });
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
      team: team.map(function (unit) { return { id: unit.id, hp: unit.hp, maxHp: unit.maxHp, skillUses: unit.skillUses }; }),
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
    constellationGrowth: CONSTELLATION_GROWTH
  };
}));
