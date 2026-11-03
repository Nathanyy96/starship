'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const pets=require('../src/pet-system'),data=require('../src/data'),{GachaGame}=require('../src/gacha');
const context=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../src/pet-growth-ui'),'utf8'),context);
test('growth previews use real companion rules, preserve saves and stop at the level cap',()=>{
 const g=new GachaGame({banners:data.banners,petDefinitions:data.petDefinitions});
 for(const definition of data.petDefinitions){
  const s=g.getState();s.petProgress.pets[definition.id]={owned:true,level:24,exp:200};s.petSummon.assignments[definition.id]='celesia';
  const before=JSON.stringify(s),view=context.StarshipPetGrowthUI.model(s,definition,pets,Object.values(data.cards));
  assert.equal(view.current.statRate,pets.support(s,definition.id,'celesia').statRate);
  s.petProgress.pets[definition.id].level=25;assert.equal(view.next.statRate,pets.support(s,definition.id,'celesia').statRate);
  s.petProgress.pets[definition.id].level=24;assert.equal(JSON.stringify(s),before);
  s.petProgress.pets[definition.id].level=30;
  const capped=context.StarshipPetGrowthUI.model(s,definition,pets,Object.values(data.cards));assert.equal(capped.level,25);assert.equal(capped.next,null);assert.ok(capped.legacyLevel);
 }
});
