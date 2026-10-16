"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {GachaGame}=require("../src/gacha.js");
const {banners,characterBreakthroughs}=require("../src/data.js");
function game(id="magenta",exp=1000000,level=1,breakthrough=false){return new GachaGame({banners,breakthroughRequirements:characterBreakthroughs,state:{collection:{[id]:1},resources:{characterExp:exp},characterProgress:{[id]:{level,breakthrough}},breakthroughMaterials:{"universal-core":100}}});}
test("bulk stops at breakthrough and resumes to level 90 after explicit breakthrough",()=>{
 const g=game(),before=g.getState(),plan=g.getDevelopmentPlan("magenta");
 assert.equal(plan.toLevel,80);assert.deepEqual(g.getState(),before);
 const result=g.developCharacter({cardId:"magenta",bulk:true});
 assert.equal(result.progress.level,80);assert.equal(result.levelsGained,79);assert.equal(result.progress.breakthrough,false);
 assert.equal(result.state.resources.characterExp,before.resources.characterExp-plan.characterExp);
 assert.equal(result.state.breakthroughMaterials["universal-core"],100);
 assert.throws(()=>g.developCharacter({cardId:"magenta",bulk:true}),/突破/);
 g.breakthroughCharacter({cardId:"magenta"});
 assert.equal(g.developCharacter({cardId:"magenta",bulk:true}).progress.level,90);
 const full=g.getState();assert.throws(()=>g.developCharacter({cardId:"magenta",bulk:true}),/最高/);assert.deepEqual(g.getState(),full);
});
test("bulk has exactly the same cost, progress and affinity as single-level upgrades",()=>{
 for(const id of ["magenta","lia"]){const a=game(id,3000),b=game(id,3000);const plan=a.getDevelopmentPlan(id);
 const result=a.developCharacter({cardId:id,bulk:true});for(let i=0;i<plan.levelsGained;i++)b.developCharacter({cardId:id});
 assert.deepEqual(a.getState(),b.getState());assert.equal(result.progress.level,plan.toLevel);assert.ok(result.state.resources.characterExp>=0);
 assert.throws(()=>a.developCharacter({cardId:id}),/經驗不足/);}
});
test("insufficient experience and unowned characters never mutate state",()=>{
 const g=game("magenta",69),before=g.getState();assert.equal(g.getDevelopmentPlan("magenta").levelsGained,0);
 assert.throws(()=>g.developCharacter({cardId:"magenta",bulk:true}),/經驗不足/);assert.deepEqual(g.getState(),before);
 assert.throws(()=>g.developCharacter({cardId:"siyeon",bulk:true}),/尚未取得/);assert.deepEqual(g.getState(),before);
 const exact=game("magenta",70);assert.equal(exact.developCharacter({cardId:"magenta",bulk:true}).state.resources.characterExp,0);
});
