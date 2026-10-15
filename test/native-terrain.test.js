const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const w=require('../src/first-major-world'),native=require('../src/native-terrain');
test('five important locations use native scene materials while west road keeps its approved scale',()=>{
  for(const id of['village','city','south','riverRoad','lotin'])assert.ok(w.maps[id].nativeTerrain,id);
  assert.equal(w.maps.road.nativeTerrain,undefined);
  for(const [id,file]of Object.entries(native.files)){const data=fs.readFileSync(path.join(__dirname,'../assets/exploration/native',file));assert.ok(data.readUInt32BE(16)>=1024,file);assert.equal(data[25],['ground','detail'].includes(id)?2:6,file);}
});
test('every illustrated entry has an accessible door and solid building footprint',()=>{
  for(const [id,m]of Object.entries(w.maps)){if(!m.nativeTerrain)continue;for(const p of m.nativeTerrain.structures){const b=m.buildings[m.nativeTerrain.structures.indexOf(p)];assert.equal(w.passable(id,b.x+b.w/2,b.y+b.h/2),false,id);if(p.door){assert.equal(w.passable(id,...p.door),true,id);const route=w.planWalk({...w.initial(2),map:id,x:m.spawn[0],y:m.spawn[1],roaming:true},...p.door);assert.ok(route.length,id+' door');}}}
});
test('guidance from fractional coordinates never crosses the workshop or a tree trunk',()=>{
  for(const id of['city','village','riverRoad','lotin']){const m=w.maps[id],start={...w.initial(2),map:id,x:m.spawn[0]+.3,y:m.spawn[1]+.1,roaming:true};for(const t of m.exits.concat(m.sites)){const route=w.planWalk(start,t.x,t.y);assert.ok(route.length,id+':'+t.name);let moving=start;for(const p of route){moving=w.move(moving,p.x-moving.x,p.y-moving.y);assert.ok(Math.hypot(moving.x-p.x,moving.y-p.y)<.1,id);}}}
});
test('the legacy village story shares native geometry instead of its old overview painting',()=>{
  const village=require('../src/exploration');for(const p of[[1390,474],[1335,467],[355,399]])assert.equal(village.passable(...p),w.passable('village',p[0]*1.5,p[1]*1.5));
  const state={...village.initial(),x:1335,y:467},moved=village.move(state,20,0);assert.equal(w.passable('village',moved.x*1.5,moved.y*1.5),true);
});
