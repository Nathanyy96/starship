const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const data = require('../src/data.js');

const battlePath = path.resolve(__dirname, '../src/battle.js');
let source = fs.readFileSync(battlePath, 'utf8');
if (!source.includes('var living = alive(targets);\n    if (!living.length) return null;')) throw new Error('Targeting instrumentation point moved');
source = source.replace('var living = alive(targets);\n    if (!living.length) return null;',
  'var living = alive(targets);\n    if (actor.isEnemy && living.some(function (unit) { return unit.isEnemy; })) throw new Error("enemy targeted enemy");\n    if (!actor.isEnemy && living.some(function (unit) { return !unit.isEnemy; })) throw new Error("player targeted player");\n    if (!living.length) return null;');
source = source.replace('var target = chooseTarget(actor, enemies);\n    var damage;\n    if (rule === "shield"',
  'var target = chooseTarget(actor, enemies);\n    if (target && target.isEnemy) throw new Error("enemy skill selected enemy");\n    var damage;\n    if (rule === "shield"');
const auditModule = new Module(battlePath, module);
auditModule.filename = battlePath;
auditModule.paths = module.paths;
auditModule._compile(source, battlePath);
const battle = auditModule.exports;
const stages = [
  ...data.trialStages.map(stage => ({kind:'trial', stage})),
  ...data.bossStages.map(stage => ({kind:'boss', stage})),
  ...data.voyageBattleStages.map(stage => ({kind:'voyage', stage})),
  ...data.dispatchMissions.map(stage => ({kind:'dispatch', stage}))
];
const failures = [];
const enemyResults = [];
for (const {kind,stage} of stages) {
  let skills = 0;
  for (let seed=0; seed<10; seed++) {
    let x=seed+1234; const rng=()=> ((x=(1664525*x+1013904223)>>>0)/4294967296);
    const stats = Object.fromEntries(['celesia','reyn','lia','isar'].map(id => [id, {...data.characterBattleStats[id], maxHp:100000, attack:1, defense:1000, speed:1}]));
    try {
      const result=battle.simulateBattle({team:Object.keys(stats),stats,stage,rng,maxRounds:60});
      skills += result.logs.filter(line=>line.includes('發動「') || line.includes('替首領架起分攤壁壘')).length;
    } catch(error) { failures.push({kind,id:stage.id,seed,error:error.message}); }
  }
  enemyResults.push({kind,id:stage.id,rule:stage.trialRule,observedSkillLogs:skills});
}
const charResults=[];
const probeStage={id:'mechanics-audit',name:'Mechanics audit',trialRule:'basic',enemies:[{name:'測試靶',maxHp:100000,attack:250,defense:100,speed:150,count:2}]};
for (const [id,base] of Object.entries(data.characterBattleStats)) {
  const casts=[];
  for (let c=0;c<=6;c++) {
    const stats=battle.buildEffectiveStats(data.characterBattleStats,{characterProgress:{[id]:{level:90,constellation:c},reyn:{level:90,constellation:0},lia:{level:90,constellation:0},isar:{level:90,constellation:0}}});
    const team=[id,...['reyn','lia','isar'].filter(other=>other!==id)].slice(0,4);
    const result=battle.simulateBattle({team,stats,stage:probeStage,rng:()=>0.5,maxRounds:60});
    const uses=result.team.find(unit=>unit.id===id).skillUses;
    casts.push(uses);
    if (!Number.isFinite(result.rounds) || result.team.some(unit=>!Number.isFinite(unit.hp))) failures.push({kind:'character',id,c,error:'nonfinite output'});
  }
  charResults.push({id,name:data.cards[id].name,version:data.cards[id].plannedGachaVersion,signature:base.signature?.type||'generic',casts});
}
console.log(JSON.stringify({stageCount:stages.length,stageKinds:Object.fromEntries(['trial','boss','voyage','dispatch'].map(kind=>[kind,stages.filter(s=>s.kind===kind).length])),zeroSkillStages:enemyResults.filter(r=>r.observedSkillLogs===0),failures,characterCount:charResults.length,noCastCharacters:charResults.filter(r=>r.casts.some(n=>n===0)),genericCharacters:charResults.filter(r=>r.signature==='generic').map(r=>r.id)},null,2));
