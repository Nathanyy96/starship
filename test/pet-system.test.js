'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const pets=require('../src/pet-system'),{GachaGame}=require('../src/gacha'),data=require('../src/data'),battle=require('../src/battle');
function game(){return new GachaGame({banners:data.banners,petDefinitions:data.petDefinitions,state:{collection:{celesia:1,lia:1,siyeon:1},resources:{starSand:100000}}});}
function act(g,options,rng){g.rng=rng||(()=>0);return g.petSummonAction({bannerId:pets.banner.id,expectedRevision:g.getState().petSummon.revision,...options});}
test('old pet growth, workshop inventory and character pity survive duplicates and save migration',()=>{
 const g=game();g.state.petProgress.pets['star-fox']={owned:true,level:12,exp:37,bond:42,mood:81,training:{care:4,play:5,focus:6}};
 const old=g.getState();act(g,{action:'draw',count:1});const s=g.getState();
 assert.deepEqual(s.petProgress,old.petProgress);assert.deepEqual(s.pity,old.pity);assert.deepEqual(s.history,old.history);assert.equal(s.totalPulls,old.totalPulls);
 assert.equal(s.petSummon.fragments['star-fox'],10);assert.equal(s.resources.starSand,old.resources.starSand-120);
 assert.deepEqual(new GachaGame({banners:data.banners,state:s}).getState().petSummon,s.petSummon);
 delete old.petSummon;assert.equal(new GachaGame({banners:data.banners,state:old}).getState().petSummon.totalPulls,0);
});
test('seven equal probability bands, separate 20-pull wish guarantee and changing wishes preserves count',()=>{
 for(let i=0;i<7;i++){const g=game();const out=act(g,{action:'draw',count:1},()=> (i+.5)/7);assert.equal(out.results[0].petId,pets.banner.members[i]);}
 const g=game();act(g,{action:'draw',count:10},()=>.2);assert.equal(g.state.petSummon.pityGroups['companion-shared'],10);
 act(g,{action:'target',petId:'cloud-whale'});assert.equal(g.state.petSummon.pityGroups['companion-shared'],10);
 const out=act(g,{action:'draw',count:10},()=>.2);assert.equal(out.cost,1200);assert.equal(out.results[9].petId,'cloud-whale');assert.equal(out.results[9].hardPity,true);assert.equal(g.state.petSummon.pityGroups['companion-shared'],0);
 act(g,{action:'draw',count:1},()=>.2);act(g,{action:'draw',count:1},()=>.99);assert.equal(g.state.petSummon.pityGroups['companion-shared'],0);
});
test('invalid, insufficient, stale and interrupted draws are atomic',()=>{
 const g=game(),before=g.getState();for(const options of [{count:2},{count:1,bannerId:'fake'},{count:1,expectedRevision:999}]){assert.throws(()=>act(g,{action:'draw',...options}));assert.deepEqual(g.getState(),before);}
 let calls=0;assert.throws(()=>act(g,{action:'draw',count:10},()=>++calls===5?1:0),/隨機值/);assert.deepEqual(g.getState(),before);
 g.state.resources.starSand=119;const poor=g.getState();assert.throws(()=>act(g,{action:'draw',count:1}),/星砂不足/);assert.deepEqual(g.getState(),poor);
});
test('awakening and breakthrough remain closed without consuming duplicate fragments or growth',()=>{
 const g=game();for(let i=0;i<2;i++)act(g,{action:'draw',count:10});
 const before=g.getState();for(const action of ['awaken','breakthrough']){assert.throws(()=>act(g,{action,petId:'star-fox'}),/尚未開放/);assert.deepEqual(g.getState(),before);}
});

test('one pet per role, transfers, unbinding, resonance and browser/server effective stats agree',()=>{
 const g=game(),baseline=battle.buildEffectiveStats(data.characterBattleStats,g.getState());act(g,{action:'draw',count:1},()=>.5);
 act(g,{action:'assign',petId:'star-fox',cardId:'celesia'});let stats=battle.buildEffectiveStats(data.characterBattleStats,g.getState());assert.ok(stats.celesia.attack>baseline.celesia.attack);assert.equal(stats.celesia.companion.resonance,true);
 assert.equal(pets.support(g.getState(),'star-fox','celesia').statRate,pets.support(g.getState(),'star-fox','lia').statRate*1.2);
 act(g,{action:'assign',petId:'star-fox',cardId:'lia'});assert.equal(g.state.petSummon.assignments['star-fox'],'lia');
 act(g,{action:'assign',petId:'mirror-sprout',cardId:'lia'});assert.equal(g.state.petSummon.assignments['star-fox'],undefined);
 const browser=vm.createContext({});for(const file of ['equipment','pet-system','battle'])vm.runInContext(fs.readFileSync(require.resolve('../src/'+file),'utf8'),browser);
 assert.deepEqual(JSON.parse(JSON.stringify(browser.StarshipBattle.buildEffectiveStats(data.characterBattleStats,g.getState()))),battle.buildEffectiveStats(data.characterBattleStats,g.getState()));
 act(g,{action:'unassign',petId:'mirror-sprout'});assert.deepEqual(battle.buildEffectiveStats(data.characterBattleStats,g.getState()),baseline);
 assert.throws(()=>act(g,{action:'assign',petId:'cloud-whale',cardId:'lia'}),/尚未擁有/);assert.throws(()=>act(g,{action:'assign',petId:'star-fox',cardId:'fake'}),/已取得/);
});
test('legacy workshop leveling raises support and retains awakening and battle assignment',()=>{
 const g=game();act(g,{action:'assign',petId:'star-fox',cardId:'celesia'});const before=pets.support(g.getState(),'star-fox','celesia');
 g.state.petProgress.pets['star-fox'].exp=99;g.petAction({action:'feed',petId:'star-fox'});
 assert.ok(pets.support(g.getState(),'star-fox','celesia').statRate>before.statRate);assert.equal(g.state.petSummon.assignments['star-fox'],'celesia');
});
test('periodic healing targets living allies only, stops on owner death and skips full HP',()=>{
 const owner={name:'owner',hp:90,maxHp:100,companion:{name:'鹿',kind:'ally-heal',skill:'回復',skillRate:.1}},dead={name:'dead',hp:0,maxHp:100},weak={name:'weak',hp:20,maxHp:100},logs=[];
 const heal=(u,n)=>{const old=u.hp;u.hp=Math.min(u.maxHp,u.hp+Math.round(n));return u.hp-old;};
 pets.round([owner,dead,weak],2,logs,heal);assert.equal(weak.hp,20);pets.round([owner,dead,weak],3,logs,heal);assert.equal(weak.hp,30);assert.equal(dead.hp,0);
 owner.hp=0;pets.round([owner,dead,weak],6,logs,heal);assert.equal(weak.hp,30);
 owner.hp=100;weak.hp=100;logs.length=0;pets.round([owner,dead,weak],9,logs,heal);assert.equal(logs.length,0);
});
test('engine records real companion shields, periodic support frames and respects antiheal',()=>{
 const g=game();act(g,{action:'draw',count:1},()=>.5);act(g,{action:'assign',petId:'mirror-sprout',cardId:'siyeon'});
 const shielded=battle.simulateBattle({team:['siyeon'],stats:battle.buildEffectiveStats(data.characterBattleStats,g.getState()),stage:data.bossStages[0],rng:()=>.5,captureTimeline:true});
 assert.equal(shielded.companions[0].petId,'mirror-sprout');assert.ok(shielded.logs.some(l=>l.includes('霧鏡芽')&&l.includes('護盾')));assert.ok(shielded.timeline[0].team[0].shield>0);assert.ok(shielded.timeline[0].team[0].shield<=Math.round(shielded.timeline[0].team[0].maxHp*.28));
 act(g,{action:'draw',count:1},()=>.2);act(g,{action:'assign',petId:'tide-otter',cardId:'lia'});
 const stats={lia:{name:'測試',maxHp:100000,attack:1,defense:100,speed:10,role:'守衛',companion:pets.support(g.getState(),'tide-otter','lia')}};
 const stage={id:'pet-test',name:'持續戰鬥',enemies:[{id:'enemy',name:'測試敵人',count:1,maxHp:100000,attack:1000,defense:100,speed:10}],modifiers:{healing:1}};
 const run=healing=>battle.simulateBattle({team:['lia'],stats,stage:{...stage,modifiers:{healing}},rng:()=>.5,captureTimeline:true,maxRounds:60});
 const normal=run(1),blocked=run(0);assert.ok(normal.timeline.some(f=>f.support));assert.ok(normal.logs.some(l=>l.includes('潮泡獸 的潮泡回復')));assert.ok(!blocked.logs.some(l=>l.includes('潮泡獸 的潮泡回復')));
});
