'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const eq=require('../src/equipment'),{GachaGame}=require('../src/gacha'),data=require('../src/data'),battle=require('../src/battle');
function state(){return new GachaGame({banners:data.banners,state:{collection:{celesia:1,lia:1},resources:{characterExp:100000},characterProgress:{celesia:{level:40},lia:{level:40}}}}).getState();}
function act(s,options){return eq.action(s,{expectedRevision:s.equipment.revision,...options});}
test('legacy saves preserve resources, pity, collection and story while starting an empty equipment inventory',()=>{
 const old=state();delete old.equipment;old.storyProgress.completedScenes={retained:{completedAt:'old'}};old.pity.limited={pullsSince4Star:33,guaranteedFeatured:true};
 const restored=new GachaGame({banners:data.banners,state:old}).getState();
 for(const key of ['resources','collection','pity','characterProgress'])assert.deepEqual(restored[key],old[key]);
 assert.deepEqual(restored.equipment,eq.initial());
});
test('all equipment difficulty tiers follow their exact rarity bands and higher tiers increase cherished drops',()=>{
 for(let tier=1;tier<=3;tier++){
  const counts=[0,0,0];for(let i=0;i<10000;i++){let calls=0;const item=eq.roll({id:'boss',bossLevel:tier},()=>calls++?0:(i+.5)/10000);counts[item.rarity-1]++;assert.equal(item.level,0);}
  assert.deepEqual(counts,eq.getRates(tier).map(p=>p*100));
 }
 assert.ok(eq.getRates(3)[2]>eq.getRates(1)[2]);assert.deepEqual(eq.rarityNames,["普通","稀有","珍藏"]);
 assert.throws(()=>eq.roll({id:'boss'},()=>1),/隨機值/);
});
test('one inventory item cannot occupy two characters or duplicate a slot; all six slots and set bonuses work',()=>{
 const s=state();for(let i=0;i<6;i++){let n=0;const item=eq.grantBossDrop(s,{id:'boss'},()=>[0,(i+.1)/6,0][n++]);act(s,{action:'equip',itemId:item.id,cardId:'celesia'});}
 assert.equal(new Set(s.equipment.items.map(i=>i.slot)).size,6);
 assert.equal(eq.bonuses(s,'celesia').sets[0].count,6);
 assert.equal(eq.bonuses(s,'celesia').percent.attack,.12);assert.equal(eq.bonuses(s,'celesia').percent.maxHp,0);assert.equal(eq.bonuses(s,'celesia').percent.defense,0);
 act(s,{action:'equip',itemId:'relic-1',cardId:'lia'});assert.equal(s.equipment.items.filter(i=>i.equippedBy==='celesia').length,5);assert.equal(eq.bonuses(s,'celesia').percent.defense,0);
 let n=0;const replacement=eq.grantBossDrop(s,{id:'boss'},()=>[0,0,0][n++]);act(s,{action:'equip',itemId:replacement.id,cardId:'lia'});assert.equal(s.equipment.items[0].equippedBy,null);
 act(s,{action:'unequip',itemId:replacement.id});assert.equal(eq.bonuses(s,'lia').flat.maxHp,0);
});
test('equipment upgrades charge increasing character experience, enforce caps and reject replayed or invalid actions atomically',()=>{
 const s=state(),item=eq.grantBossDrop(s,{id:'boss'},()=>0),revision=s.equipment.revision,exp=s.resources.characterExp;
 act(s,{action:'upgrade',itemId:item.id});assert.equal(s.resources.characterExp,exp-120);assert.equal(s.equipment.items[0].level,1);
 const before=structuredClone(s);assert.throws(()=>eq.action(s,{action:'upgrade',itemId:item.id,expectedRevision:revision}),/已變更/);assert.deepEqual(s,before);
 for(let i=1;i<20;i++)act(s,{action:'upgrade',itemId:item.id});assert.equal(s.resources.characterExp,exp-120*210);
 const capped=structuredClone(s);assert.throws(()=>act(s,{action:'upgrade',itemId:item.id}),/上限/);assert.deepEqual(s,capped);
 assert.throws(()=>act(s,{action:'equip',itemId:item.id,cardId:'not-owned'}),/已取得/);assert.deepEqual(s,capped);
 const poor=state(),p=eq.grantBossDrop(poor,{id:'boss'},()=>0);poor.resources.characterExp=0;const empty=structuredClone(poor);assert.throws(()=>act(poor,{action:'upgrade',itemId:p.id}),/經驗不足/);assert.deepEqual(poor,empty);
});
test('normalization rejects fabricated slots, duplicate IDs and duplicate slot bindings; equipped items survive all game normalization',()=>{
 const s=state(),item=eq.grantBossDrop(s,{id:'boss'},()=>0);act(s,{action:'equip',itemId:item.id,cardId:'celesia'});
 const restored=new GachaGame({banners:data.banners,state:s}).getState();assert.deepEqual(restored.equipment,s.equipment);
 const broken=structuredClone(s.equipment);broken.items.push({...broken.items[0]},{...broken.items[0],id:'relic-2'},{...broken.items[0],id:'relic-3',slot:'fake'});
 const normalized=eq.normalize(broken,s.collection);assert.equal(normalized.items.length,2);assert.equal(normalized.items[1].equippedBy,null);assert.equal(normalized.nextId,3);
});
test('equipment changes effective battle stats and power equally in browser and server; removing it restores baseline',()=>{
 const s=state(),before=battle.buildEffectiveStats(data.characterBattleStats,s),item=eq.grantBossDrop(s,{id:'boss'},()=>.99999);
 act(s,{action:'equip',itemId:item.id,cardId:'celesia'});act(s,{action:'upgrade',itemId:item.id});
 const speed=battle.buildEffectiveStats(data.characterBattleStats,s);assert.ok(speed.celesia.speed>before.celesia.speed);
 const core=eq.grantBossDrop(s,{id:'boss'},()=>0);act(s,{action:'equip',itemId:core.id,cardId:'celesia'});
 const after=battle.buildEffectiveStats(data.characterBattleStats,s);assert.ok(battle.teamPower(['celesia'],after)>battle.teamPower(['celesia'],before));
 const browser=vm.createContext({});for(const file of ['equipment','battle'])vm.runInContext(fs.readFileSync(require.resolve('../src/'+file),'utf8'),browser);
 assert.deepEqual(JSON.parse(JSON.stringify(browser.StarshipBattle.buildEffectiveStats(data.characterBattleStats,s))),after);
 act(s,{action:'unequip',itemId:item.id});act(s,{action:'unequip',itemId:core.id});assert.deepEqual(battle.buildEffectiveStats(data.characterBattleStats,s),before);
});
