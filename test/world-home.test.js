const test=require('node:test'),assert=require('node:assert/strict'),checkpoint=require('../src/world-checkpoint'),{GachaGame}=require('../src/gacha'),data=require('../src/data');
test('world checkpoints discard gameplay fields and reject invalid locations',()=>{
 assert.equal(checkpoint.clean({version:1,kind:'world',state:{map:'future',x:1,y:2}}),null);
 assert.equal(checkpoint.clean({version:1,kind:'opening',state:{zone:'valley',x:Infinity,y:2}}),null);
 const p=checkpoint.clean({version:1,kind:'world',state:{map:'city',x:3454,y:858,resources:{starSand:999999},collection:{lia:99},waypoints:['city-plaza']}});
 assert.equal(p.state.resources,undefined);assert.equal(p.state.collection,undefined);assert.deepEqual(p.state.waypoints,['city-plaza']);
});
test('account game normalization preserves the independently stored world checkpoint',()=>{
 const original=new GachaGame({banners:data.banners}).getState();original.worldPosition=checkpoint.clean({version:1,kind:'opening',state:{zone:'valley',index:1,x:11,y:8.5},updatedAt:123});
 const restored=new GachaGame({banners:data.banners,state:original}).getState();assert.deepEqual(restored.worldPosition,original.worldPosition);assert.deepEqual(restored.resources,original.resources);
});

test('all published world acts survive location resume, including the 1.1 finale',()=>{const w=require('../src/first-major-world');for(const act of w.storyOrder){const s=w.initial(act);const clean=checkpoint.clean({version:1,kind:'world',state:s});assert.equal(clean.state.act,act);}});
