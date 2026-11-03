'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const model=require('../src/star-ascension'),{GachaGame}=require('../src/gacha'),data=require('../src/data'),battle=require('../src/battle'),eq=require('../src/equipment');
function game(options={}){return new GachaGame({banners:data.banners,...options,state:{collection:{celesia:1,reyn:1,isar:1,lia:1,hina:1},resources:{starSand:100000,characterExp:10000},...options.state}});}
function ascend(g,id){return g.ascendCharacter({cardId:id,expectedRevision:g.state.starAscension.revision});}
const banner=game().banners.find(b=>b.active&&b.poolKey==='limited');
test('new saves and legacy full constellations start with no retroactive marks and preserve all previous progress',()=>{
 const g=game({state:{collection:{reyn:30,hina:20},characterProgress:{reyn:{level:55,constellation:6}}}}),old=g.getState();delete old.starAscension;
 const restored=game({state:old}).getState();assert.deepEqual(restored.starAscension,model.initial());for(const key of ['collection','resources','characterProgress','equipment','petProgress','petSummon','pity','history'])assert.deepEqual(restored[key],old[key]);
});
test('three-star C5 to C6 gives no mark; later copies give one shared lower mark and retain old overflow rewards',()=>{
 const g=game({rng:(()=>{let n=0;return ()=>++n%3===1?0.999:0;})(),state:{collection:{reyn:6},resources:{starSand:10000}}});const a=g.pull({bannerId:banner.id,count:1});assert.equal(a.results[0].card.id,'reyn');assert.equal(g.state.characterProgress.reyn.constellation,6);assert.equal(g.state.starAscension.marks.lower,0);
 const b=g.pull({bannerId:banner.id,count:1});assert.deepEqual(b.results[0].duplicateReward.ascensionMark,{key:'lower',amount:1});assert.equal(b.results[0].duplicateReward.characterExp,400);assert.equal(b.results[0].duplicateReward.starSand,60);assert.equal(g.state.starAscension.marks.lower,1);
});
test('ten pulls crossing C6 settle each copy separately; native four-star overflow gives upper marks only',()=>{
 const g=game({rng:(()=>{let n=0;return ()=>++n%3===1?0.999:0;})(),state:{collection:{reyn:6},resources:{starSand:10000}}});const ten=g.pull({bannerId:banner.id,count:10});assert.equal(ten.results[0].duplicateReward.ascensionMark,undefined);assert.equal(g.state.starAscension.marks.lower,9);
 const four=game({rng:()=>0,rules:{noEarlyFourStarPulls:0,pityStartPull:1,pityStartRate:1},state:{collection:{[banner.defaultFeaturedId]:6},resources:{starSand:10000}}});four.pull({bannerId:banner.id,count:1});assert.equal(four.state.starAscension.marks.upper,0);
 const out=four.pull({bannerId:banner.id,count:1});assert.equal(out.results[0].card.id,banner.defaultFeaturedId);assert.deepEqual(out.results[0].duplicateReward.ascensionMark,{key:'upper',amount:1});assert.equal(out.results[0].duplicateReward.starMarks,1);assert.equal(out.results[0].duplicateReward.starSand,210);assert.equal(out.results[0].duplicateReward.characterExp,600);assert.equal(four.state.starAscension.marks.upper,1);assert.equal(four.state.starAscension.marks.lower,0);
});
test('shared marks from Reyn can ascend another role, ordinary threes cap at four, Isar and native fours reach six at 1/2/1 costs',()=>{
 const g=game({rng:(()=>{let n=0;return ()=>++n%3===1?0.999:0;})(),state:{collection:{reyn:7,isar:1,lia:1,celesia:1},resources:{starSand:10000}}});g.pull({bannerId:banner.id,count:10});g.state.starAscension.marks.upper=2;const before=g.getState();
 assert.equal(ascend(g,'lia').cost,1);assert.equal(model.stars(g.state,data.cards.lia),4);const capped=g.getState();assert.throws(()=>ascend(g,'lia'),/上限/);assert.deepEqual(g.getState(),capped);
 assert.equal(ascend(g,'isar').cost,1);assert.equal(ascend(g,'isar').cost,2);assert.equal(ascend(g,'isar').cost,1);assert.equal(model.stars(g.state,data.cards.isar),6);
 assert.equal(ascend(g,'celesia').cost,2);assert.equal(ascend(g,'celesia').cost,1);assert.equal(model.stars(g.state,data.cards.celesia),6);assert.equal(g.state.starAscension.marks.lower,4);assert.equal(g.state.starAscension.marks.upper,0);
 for(const key of ['resources','collection','characterProgress','equipment','petProgress','petSummon','pity','history'])assert.deepEqual(g.state[key],before[key]);assert.equal(data.cards.isar.rarity,3);assert.equal(data.cards.celesia.rarity,4);
 assert.deepEqual(game({state:g.getState()}).getState().starAscension,g.state.starAscension);
});
test('ascended native threes still give lower marks; gifts and exchanges never generate overflow marks',()=>{
 const g=game({rng:(()=>{let n=0;return ()=>++n%3===1?0.999:0;})(),state:{collection:{reyn:7,isar:7},resources:{starSand:10000,starMarks:100}}});g.state.starAscension.characters.reyn=4;g.pull({bannerId:banner.id,count:1});assert.equal(g.state.starAscension.marks.lower,1);assert.equal(g.state.starAscension.marks.upper,0);
 g.state.starAscension.characters.isar=6;g.grantCharacter('isar');g.grantCharacter(banner.defaultFeaturedId);g.exchangeFeatured({bannerId:banner.id});assert.equal(g.state.starAscension.marks.upper,0);assert.equal(g.state.starAscension.marks.lower,1);
});
test('stale, insufficient, unowned and invalid star state cannot spend marks or increase stars',()=>{
 const g=game(),before=g.getState();assert.throws(()=>ascend(g,'reyn'),/不足/);assert.deepEqual(g.getState(),before);g.state.starAscension.marks.lower=3;ascend(g,'reyn');const saved=g.getState();assert.throws(()=>g.ascendCharacter({cardId:'celesia',expectedRevision:0}),/已變更/);assert.throws(()=>ascend(g,'not-owned'),/已取得/);assert.deepEqual(g.getState(),saved);
 const invalid=model.normalize({marks:{lower:-2,upper:1.1},characters:{reyn:6,celesia:3,isar:6,missing:6}},g.state.collection,data.cards);assert.equal(invalid.characters.reyn,undefined);assert.equal(invalid.characters.celesia,undefined);assert.equal(invalid.characters.isar,6);assert.equal(invalid.characters.missing,undefined);assert.deepEqual(invalid.marks,{lower:0,upper:0});
});
test('star multipliers affect base stats before relics and pets, preserve speed/skills, and agree in browser and server',()=>{
 const g=game();g.state.starAscension.marks.lower=2;g.state.starAscension.marks.upper=1;const s=g.state;s.petSummon.assignments['star-fox']='celesia';const item=eq.grantBossDrop(s,{id:'boss'},()=>0);eq.action(s,{action:'equip',itemId:item.id,cardId:'celesia',expectedRevision:s.equipment.revision});
 const plain=battle.buildEffectiveStats(data.characterBattleStats,{...s,equipment:eq.initial(),petSummon:{}}).celesia;ascend(g,'celesia');ascend(g,'celesia');const naked=battle.buildEffectiveStats(data.characterBattleStats,{...g.state,equipment:eq.initial(),petSummon:{}}).celesia;assert.equal(naked.maxHp,Math.round(plain.maxHp*1.06*1.08));assert.equal(naked.attack,Math.round(plain.attack*1.06*1.08));assert.equal(naked.speed,plain.speed);assert.deepEqual(naked.signature,plain.signature);assert.equal(naked.rarity,4);
 const effective=battle.buildEffectiveStats(data.characterBattleStats,g.state);assert.ok(effective.celesia.maxHp>naked.maxHp);assert.ok(effective.celesia.attack>naked.attack);
 const browser=vm.createContext({});for(const name of ['equipment','pet-system','star-ascension','battle'])vm.runInContext(fs.readFileSync(require.resolve('../src/'+name),'utf8'),browser);assert.deepEqual(JSON.parse(JSON.stringify(browser.StarshipBattle.buildEffectiveStats(data.characterBattleStats,g.state))),effective);
});
test('promoted threes and fives unlock level 95; six stars unlock 100; bulk and single costs match and stop exactly at each cap',()=>{
 const g=game({state:{collection:{celesia:1,lia:1,isar:1},resources:{characterExp:1000000},characterProgress:{celesia:{level:90,breakthrough:true},lia:{level:90,breakthrough:true},isar:{level:95,breakthrough:true}}}});g.state.starAscension.marks={lower:6,upper:2};
 assert.equal(g.getDevelopmentPlan('celesia').levelCap,90);assert.throws(()=>g.developCharacter({cardId:'celesia'}),/最高/);
 ascend(g,'celesia');assert.equal(g.getDevelopmentPlan('celesia').levelCap,95);const singles=game({state:g.getState()}),cost=g.getDevelopmentPlan('celesia').characterExp;const exp=g.state.resources.characterExp;
 g.developCharacter({cardId:'celesia',bulk:true});for(let i=0;i<5;i++)singles.developCharacter({cardId:'celesia'});assert.deepEqual(g.getState(),singles.getState());assert.equal(g.state.resources.characterExp,exp-cost);assert.equal(g.state.characterProgress.celesia.level,95);assert.throws(()=>g.developCharacter({cardId:'celesia'}),/最高/);
 ascend(g,'celesia');assert.equal(g.getDevelopmentPlan('celesia').levelCap,100);g.developCharacter({cardId:'celesia',bulk:true});assert.equal(g.state.characterProgress.celesia.level,100);assert.throws(()=>g.developCharacter({cardId:'celesia'}),/最高/);
 ascend(g,'lia');g.developCharacter({cardId:'lia',bulk:true});assert.equal(g.state.characterProgress.lia.level,95);assert.equal(g.getDevelopmentPlan('lia').levelCap,95);assert.throws(()=>g.developCharacter({cardId:'lia'}),/最高/);
 ascend(g,'isar');assert.equal(g.getDevelopmentPlan('isar').levelCap,95);ascend(g,'isar');assert.equal(g.getDevelopmentPlan('isar').levelCap,95);assert.throws(()=>g.developCharacter({cardId:'isar'}),/最高/);ascend(g,'isar');g.developCharacter({cardId:'isar',bulk:true});assert.equal(g.state.characterProgress.isar.level,100);
 assert.equal(game({state:g.getState()}).state.characterProgress.celesia.level,100);
});
test('star ascension never bypasses the existing level-80 Boss material breakthrough',()=>{
 const g=game({breakthroughRequirements:data.characterBreakthroughs,state:{collection:{lia:1},resources:{characterExp:1000000},characterProgress:{lia:{level:80,breakthrough:false}},breakthroughMaterials:{'universal-core':20}}});g.state.starAscension.marks.lower=1;ascend(g,'lia');assert.equal(g.getDevelopmentPlan('lia').levelCap,80);assert.throws(()=>g.developCharacter({cardId:'lia',bulk:true}),/突破/);g.breakthroughCharacter({cardId:'lia'});assert.equal(g.getDevelopmentPlan('lia').levelCap,95);g.developCharacter({cardId:'lia',bulk:true});assert.equal(g.state.characterProgress.lia.level,95);
});
