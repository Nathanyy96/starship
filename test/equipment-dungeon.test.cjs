const test=require('node:test'),assert=require('node:assert/strict'),model=require('../src/equipment-dungeon'),eq=require('../src/equipment'),data=require('../src/data'),catalog=require('../src/monster-catalog'),{GachaGame}=require('../src/gacha');
const now=Date.parse('2026-11-02T15:59:59.000Z');
function state(){const s=new GachaGame({banners:data.banners,state:{collection:{celesia:1},resources:{starSand:123,characterExp:456}}}).getState();s.equipmentDungeon=model.normalize(s.equipmentDungeon,now);return s;}
function act(s,extra={},ctx={}){return model.action(s,{level:1,team:['celesia'],requestId:'isolated-domain-request-001',expectedRevision:s.equipmentDungeon.revision,...extra},{now,rng:()=>0,equipment:eq,data,catalog,battle:{buildEffectiveStats:()=>({}),simulateBattle:()=>({won:true,timedOut:false})},...ctx});}
test('server Taipei midnight refills to 100 once, with no carryover or clock rollback refill; normalization preserves it through saves',()=>{
 const s=state();s.equipmentDungeon.stamina=20;const v=s.equipmentDungeon.revision;assert.equal(model.normalize(s.equipmentDungeon,now).stamina,20);
 const next=model.normalize(s.equipmentDungeon,now+1000);assert.equal(next.day,'2026-11-03');assert.equal(next.stamina,100);assert.equal(next.revision,v+1);assert.deepEqual(model.normalize(next,now+1001),next);next.stamina=30;assert.equal(model.normalize(next,now).stamina,30);
 s.equipmentDungeon=next;assert.deepEqual(new GachaGame({banners:data.banners,state:s}).getState().equipmentDungeon,next);
});
test('5, 6, 7, 8 drops each occupy one quarter of count rolls; item sources, zero levels and atomic spending are server owned',()=>{
 for(const [roll,count]of [[0,5],[.25,6],[.5,7],[.999999,8]]){const s=state(),before=structuredClone(s);let calls=0;const r=act(s,{}, {rng:()=>calls++===0?roll:.99});assert.equal(r.items.length,count);assert.equal(r.state.equipmentDungeon.stamina,90);assert.equal(r.staminaSpent,10);assert.equal(new Set(r.items.map(i=>i.id)).size,count);for(const i of r.items){assert.equal(i.rarity,3);assert.equal(i.level,0);assert.equal(i.sourceDungeonId,'equipment-1');assert.equal(i.sourceBossId,undefined);}assert.deepEqual(s,before);for(const key of ['resources','pity','collection','characterProgress','trialProgress','bossProgress','activities'])assert.deepEqual(r.state[key],s[key]);}
});
test('ten victories exhaust 100 stamina; replay, stale revision, forged teams and eleventh battle cannot spend or grant',()=>{
 let s=state();for(let i=0;i<10;i++)s=act(s,{requestId:'isolated-domain-request-'+String(i).padStart(3,'0')}).state;assert.equal(s.equipmentDungeon.stamina,0);assert.equal(s.equipment.items.length,50);assert.throws(()=>act(s,{requestId:'isolated-domain-request-next'}),/體力不足/);
 const fresh=state(),one=act(fresh);assert.throws(()=>act(one.state),/已結算/);assert.throws(()=>act(one.state,{expectedRevision:fresh.equipmentDungeon.revision}),/已變更/);for(const team of [[],['missing'],['celesia','celesia']])assert.throws(()=>act(fresh,{team}),/角色/);assert.throws(()=>act(fresh,{level:99}),/難度/);assert.throws(()=>act(fresh,{requestId:'x'}),/識別/);
});
test('defeat, timeout and invalid random output never consume stamina or grant equipment; midnight stale requests require resync',()=>{
 for(const battle of [{won:false},{won:false,timedOut:true}]){const s=state(),r=act(s,{}, {battle:{buildEffectiveStats:()=>({}),simulateBattle:()=>battle}});assert.equal(r.state.equipmentDungeon.stamina,100);assert.deepEqual(r.items,[]);assert.equal(r.staminaSpent,0);assert.equal(r.state.equipment.items.length,0);assert.equal(r.state.equipmentDungeon.revision,s.equipmentDungeon.revision+1);}
 const s=state(),before=structuredClone(s);assert.throws(()=>act(s,{}, {rng:()=>1}),/隨機值/);assert.deepEqual(s,before);assert.throws(()=>act(s,{}, {now:now+1000}),/已變更/);
});
