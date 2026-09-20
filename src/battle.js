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
  function addEffect(unit, name, value, turns) {
    unit.effects = unit.effects || [];
    unit.effects.push({ name: name, value: value, turns: Math.max(1, turns || 1) });
  }
  function removeEffects(unit, names) {
    var list = Array.isArray(names) ? names : [names];
    unit.effects = (unit.effects || []).filter(function (effect) { return list.indexOf(effect.name) < 0; });
  }
  function tickUnit(unit) {
    unit.effects = (unit.effects || []).map(function (effect) {
      return { name: effect.name, value: effect.value, turns: effect.turns - 1 };
    }).filter(function (effect) { return effect.turns > 0; });
    if (unit.skillCooldown > 0) unit.skillCooldown -= 1;
  }

  function expandEnemies(stage) {
    var result = [];
    stage.enemies.forEach(function (template, groupIndex) {
      for (var index = 0; index < template.count; index += 1) {
        result.push({
          id: "enemy-" + groupIndex + "-" + index,
          name: template.name + (template.count > 1 ? " " + (index + 1) : ""),
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

  function buildEffectiveStats(baseStats, state) {
    var progressMap = state && state.characterProgress ? state.characterProgress : {};
    var result = {};
    Object.keys(baseStats || {}).forEach(function (id) {
      var base = clone(baseStats[id]);
      var progress = progressMap[id] || {};
      var level = Math.max(1, Number(progress.level) || 1);
      var constellation = Math.max(0, Number(progress.constellation) || 0);
      var isFourStar = base.rarity === 4;
      // 低基礎戰力的四星使用資料層標記的平衡成長帶，讓功能型角色在 70–90 等
      // 不會因初始面板較低而被永久拉開；這是角色定位平衡，不使用性別判定。
      var growth = base.growthRates || {};
      var mainGrowth = Number(growth.main) || (isFourStar ? 0.04 : 0.03);
      var defenseGrowth = Number(growth.defense) || (isFourStar ? 0.03 : 0.022);
      var speedGrowth = Number(growth.speed) || (isFourStar ? 0.012 : 0.009);
      var multiplier = 1 + (level - 1) * mainGrowth + constellation * (isFourStar ? 0.05 : 0.03);
      base.maxHp = Math.round(base.maxHp * multiplier);
      base.attack = Math.round(base.attack * multiplier);
      base.defense = Math.round(base.defense * (1 + (level - 1) * defenseGrowth + constellation * (isFourStar ? 0.045 : 0.027)));
      base.speed = Math.round(base.speed * (1 + (level - 1) * speedGrowth + constellation * (isFourStar ? 0.016 : 0.01)));
      base.level = level;
      base.constellation = constellation;
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
    if (damage > 0) target.hp = Math.max(0, target.hp - damage);
    return damage;
  }

  function heal(target, rawAmount) {
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

  function useCharacterSkill(actor, allies, enemies, logs) {
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
      if (modifiers.healing !== 1) addEffect(unit, "healingMultiplier", modifiers.healing, 999);
      return unit;
    });
    var enemies = expandEnemies(stage);
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
          var usedSkill = isTeam ? useCharacterSkill(actor, allies, targets, logs) : useEnemySkill(actor, allies, targets, logs, stage);
          if (usedSkill) {
            actor.skillUses += 1;
            actor.skillCooldown = actor.skillCooldownMax;
            return;
          }
        }
        var target = chooseTarget(actor, targets);
        if (!target) return;
        var attackMultiplier = effectValue(actor, "attackMultiplier", 1);
        var damage = hit(target, actor.attack * attackMultiplier);
        logs.push(displayName(actor) + " 使用「" + (actor.attackName || "基本攻擊") + "」攻擊 " + displayName(target) + "，造成 " + damage + " 傷害。" );
        if (!isTeam && stage.trialRule === "corrosion") addEffect(target, "healingMultiplier", .72, 2);
        if (!isTeam && (stage.trialRule === "multi" || stage.trialRule === "mark")) addEffect(target, "marked", 1, 2);
        if (target.hp <= 0) logs.push(displayName(target) + " 已離場。" );
      });
    }
    var won = alive(enemies).length === 0 && alive(team).length > 0;
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
      enemies: enemies.map(function (unit) { return { name: unit.name, hp: unit.hp, maxHp: unit.maxHp, shield: unit.shield }; }),
      logs: logs.slice(-100),
      reward: won ? clone(stage.reward || {}) : { starSand: 0, characterExp: 0 }
    };
  }

  return { simulateBattle: simulateBattle, teamPower: teamPower, buildEffectiveStats: buildEffectiveStats, synergyScore: synergyScore };
}));
