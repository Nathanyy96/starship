'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const context=vm.createContext({});vm.runInContext(fs.readFileSync(require.resolve('../src/game-scene-shell'),'utf8'),context);const ui=context.StarshipSceneShell;
test('journey overview counts actual saved progress without changing gameplay or inventing rewards',()=>{
 const state={resources:{starSand:1234},collection:{celesia:1,lia:2,locked:0},trialProgress:{clearedStages:[1,2],attempts:{1:3}},equipment:{items:[{equippedBy:'lia'},{equippedBy:null}]},petProgress:{pets:{'star-fox':{owned:true,level:7},'tide-otter':{owned:false}}},petSummon:{totalPulls:8,assignments:{'star-fox':'celesia'}},totalPulls:5};
 const before=JSON.stringify(state),p=ui.progress(state);assert.equal(p.roles,2);assert.equal(p.relics,2);assert.equal(p.worn,1);assert.equal(p.trial,2);assert.equal(p.pets,1);assert.equal(p.bound,1);assert.equal(p.pulls,5);assert.equal(p.petPulls,8);
 const goals=ui.goals(state);assert.ok(goals.find(g=>g.view==='pet-banner-view').status.includes('配屬 1'));assert.ok(goals.find(g=>g.view==='boss-view').copy.includes('已有裝備'));assert.equal(JSON.stringify(state),before);
});
test('older saves get useful first-equipment and first-binding guidance with no prerequisite story progress',()=>{
 const goals=ui.goals({collection:{celesia:1}});assert.ok(goals.find(g=>g.view==='boss-view').copy.includes('第一件'));assert.equal(goals.find(g=>g.view==='pet-banner-view').action,'召集與配屬星伴');assert.ok(goals.every(g=>ui.scenes[g.view]));
});
