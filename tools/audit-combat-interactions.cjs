'use strict';
// Existing engine coverage only: regional species use generic attacks here.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const data=require('../src/data'),battle=require('../src/battle'),pets=require('../src/pet-system');
const {GachaGame}=require('../src/gacha'),{monsters}=require('../src/monster-catalog');
const ids=['celesia','reyn','lia','isar','chodan','magenta','hina','siyeon','cenwu','ruida','yuan','veyra','harlow','rena','elorna','eda','mave','rovienne','risan','yaoze','maro','evelyn','mirea','ferye','noreia','orivelle'];
function random(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
let cases=0,replays=0,skillFrames=0,supportFrames=0;const statuses={},timeouts=[];
for(const c of [0,6])for(const id of ids)for(const petId of pets.banner.members){
 const team=[id,...['chodan','magenta','hina','siyeon'].filter(x=>x!==id)].slice(0,4);
 const g=new GachaGame({banners:data.banners,petDefinitions:data.petDefinitions,state:{collection:Object.fromEntries(team.map(x=>[x,1])),characterProgress:Object.fromEntries(team.map(x=>[x,{level:80,constellation:c}]))}});
 g.state.petSummon.assignments[petId]=id;g.state.petProgress.pets[petId]=Object.assign({},g.state.petProgress.pets[petId],{owned:true});g.state.petProgress.pets[petId].level=c?25:1;
 team.filter(x=>x!==id).forEach((x,i)=>{const other=pets.banner.members[(pets.banner.members.indexOf(petId)+i+1)%7];g.state.petSummon.assignments[other]=x;g.state.petProgress.pets[other]=Object.assign({},g.state.petProgress.pets[other],{owned:true,level:c?25:1});});
 const stats=battle.buildEffectiveStats(data.characterBattleStats,g.getState());
 assert.equal(stats[id].companion.id,petId);
 for(const m of [...monsters,...data.trialStages.map((stage,i)=>({id:"trial-"+i,stage})),...data.bossStages.map((stage,i)=>({id:"boss-"+i,stage})),{id:"pressure",stage:{id:"pressure",enemies:[{name:"Pressure fixture",count:4,maxHp:1000000,attack:100000,defense:500,speed:300,traitKey:"pounce"}]}}]){
  const stage=m.stage||{id:'projection-'+m.id,name:m.name,enemies:[{name:m.name,speciesId:m.id,count:1,maxHp:m.stats.hp,attack:m.stats.attack,defense:m.stats.defense,speed:m.stats.speed,skillRate:m.stats.skillRate,skillCooldown:m.stats.cd}]};
  const seed=cases+1,options={team,stats,stage,captureTimeline:true,maxRounds:60};
  const result=battle.simulateBattle({...options,rng:random(seed)});
  assert.ok(['won','defeat','timeout'].includes(result.status),`${id}/${petId}/${m.id}: ${result.status}`);
  assert.ok(result.rounds<=60);assert.ok(result.timeline.length);
  for(const f of result.timeline){
   if(f.actionType==='skill')skillFrames++;if(f.support)supportFrames++;
   for(const u of [...f.team,...f.enemies]){
    assert.ok(Number.isFinite(u.hp)&&u.hp>=0&&u.hp<=u.maxHp,`${id}/${petId}/${m.id}: HP ${u.hp}/${u.maxHp}`);
    assert.ok(Number.isFinite(u.shield)&&u.shield>=0,`${id}/${petId}/${m.id}: shield`);
   }
  }
  if(m.id==='BE-001'){assert.deepEqual(battle.simulateBattle({...options,rng:random(seed)}),result);replays++;}
  if(result.status==='timeout'){const extended=battle.simulateBattle({...options,maxRounds:180,rng:random(seed)});timeouts.push({character:id,petId,constellation:c,stage:stage.id,rounds:result.rounds,atProductionLimit:{status:extended.status,rounds:extended.rounds}});}
  statuses[result.status]=(statuses[result.status]||0)+1;cases++;
 }
}
const report={generatedAt:new Date().toISOString(),scope:'Existing attack/skill engine: 26 characters x 7 target pets x C0/C6, each against 56 generic species projections, 15 existing trials, 6 existing Boss stages and one lethal fixture. Four-unit teams equip four distinct pets.',cases,replays,skillFrames,supportFrames,statuses,timeouts,rulesHash:crypto.createHash('sha256').update(fs.readFileSync(require.resolve('../src/battle'))).digest('hex'),excluded:['New energy/ultimate system','18 planned four-star pets and C4 effects','56 species-specific skills','Full tower balance and art acceptance']};
fs.writeFileSync('docs/combat-interaction-audit-20261102.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
