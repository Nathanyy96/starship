const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const world=require('../src/first-major-world');
const presentation=require('../src/world-presentation');
test('anonymous residents have unique paired art and local names without replacing story cast',()=>{
 const names={city:'白鐘城',village:'獸靈之村',mistbridge:'霧橋鎮',lotin:'洛汀港',south:'南驛山谷',banksWest:'北斷橋西岸聚落'};
 const residents=Object.keys(world.maps).flatMap(map=>presentation.npcs(map).filter(n=>n.genericResident).map(n=>({...n,map})));
 assert.equal(residents.length,12);
 assert.equal(new Set(residents.map(n=>n.spriteId)).size,12);
 for(const n of residents){
  assert.ok(n.name.startsWith(names[n.map]+'・'));
  assert.ok(n.role.length>1);
  assert.equal(n.wander,true);
  assert.equal(n.portraitSrc,'./assets/exploration/'+n.spriteId+'-portrait-v1.png');
  for(const suffix of ['chibi','portrait']){
   const b=fs.readFileSync(require('node:path').join(__dirname,'../assets/exploration/'+n.spriteId+'-'+suffix+'-v1.png'));
   assert.equal(b.readUInt32BE(0),0x89504e47);assert.equal(b[25],6,'RGBA alpha '+n.id);
  }
 }
 for(const id of ['town-trader','town-grower','town-caretaker','town-harbor'])assert.equal(fs.existsSync(require('node:path').join(__dirname,'../assets/exploration/'+id+'-chibi-v1.png')),false);
 assert.ok(presentation.npcs('city').some(n=>n.name==='米菈'));
 assert.ok(presentation.npcs('village').some(n=>!n.genericResident));
});

test('residents take distinct collision-safe walks around their home streets',()=>{
 const moving=Object.keys(world.maps).flatMap(map=>presentation.npcs(map).filter(n=>n.genericResident).map(n=>{
  const p=world.mapPoint(map,n.x,n.y),actor={...n,...p,wanderRange:n.wanderRange*(world.maps[map].scale||1)};
  const positions=[0,2000,4000,6000,8000].map(time=>presentation.position(actor,time,false,(x,y)=>world.passable(map,x,y)));
  for(const position of positions)assert.ok(world.passable(map,position.x,position.y),`${n.id} left walkable ground`);
  return Math.max(...positions.map(position=>Math.hypot(position.x-p.x,position.y-p.y)))>8;
 }));
 assert.ok(moving.filter(Boolean).length>=8,`only ${moving.filter(Boolean).length} residents moved`);
});

test('nearby dialogue follows a walking resident instead of the former home position',()=>{
 const map='mistbridge',npc=presentation.npcs(map).find(n=>n.id==='resident-03'),home=world.mapPoint(map,npc.x,npc.y),actor={...npc,...home,wanderRange:npc.wanderRange*(world.maps[map].scale||1)},time=6000;
 const at=presentation.position(actor,time,false,(x,y)=>world.passable(map,x,y));
 const found=world.nearby({...world.initial(2),map,x:at.x,y:at.y,roaming:true},time,false);
 assert.equal(found.kind,'npc');
 assert.equal(found.value.id,npc.id);
});
