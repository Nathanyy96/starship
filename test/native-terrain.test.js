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

test('front steps remain in front of the building at the collision boundary',()=>{
 for(const m of Object.values(w.maps)){if(!m.nativeTerrain)continue;for(const p of m.nativeTerrain.structures){const b=m.buildings[m.nativeTerrain.structures.indexOf(p)];assert.ok(native.depth(p)<=b.y+b.h+.001);if(p.door)assert.ok(native.depth(p)<p.door[1]-12);}}
});
test('all 24 maps have traversable guidance to every exit and landmark, in both directions',()=>{
 let count=0;for(const [id,m] of Object.entries(w.maps)){const start={...w.initial(2),map:id,x:m.spawn[0],y:m.spawn[1],roaming:true};for(const target of [...m.exits,...m.sites]){for(const [from,to] of [[start,target],[{...start,x:target.x,y:target.y},{x:start.x,y:start.y}]]){const route=w.planWalk(from,to.x,to.y);assert.ok(route.length,id+':'+target.name);let s=from;for(const point of route){s=w.move(s,point.x-s.x,point.y-s.y);assert.ok(Math.hypot(s.x-point.x,s.y-point.y)<.1,id+':'+target.name+' blocked guidance');}}count++;}}assert.equal(count,93);
});

test('the workshop side foundation cannot be mistaken for its open doorway',()=>{assert.equal(w.passable('city',680,1460),false);assert.equal(w.passable('city',781,1465),true);});


test('all currently playable scenes have local geometry except the approved west trade road',()=>{
 for(const [id,m]of Object.entries(w.maps)){if(id==='road')continue;assert.ok(m.nativeTerrain||m.floor,id+' must not use an enlarged overview');if(m.floor){assert.ok(m.furniture.length>=3,id+' authored interior');}else{assert.ok(m.nativeTerrain.structures.length,id+' landmark architecture');}}
});


test('native road centerlines do not pass through building footprints',()=>{
 for(const [id,m]of Object.entries(w.maps)){if(!m.nativeTerrain)continue;for(const lane of m.paths)for(let i=1;i<lane.points.length;i++){const a=lane.points[i-1],b=lane.points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/8));for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,y=a[1]+(b[1]-a[1])*k/n;assert.ok(!m.buildings.some(p=>x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h),id+' road through building at '+x+','+y);}}}
 const inn=w.maps.mistbridge.exits.find(e=>e.to==='mistInn');assert.deepEqual([inn.x,inn.y],[1460,350]);assert.deepEqual(w.maps.mistInn.exits.find(e=>e.to==='mistbridge').spawn,[1460,394]);
});

test('hand placed roadside scenery stays off the road, door and building collision lanes',()=>{
 const ids=['city','village','south','mistbridge','echo','relic','banksWest','banksEast','bellcourt','northRoad'];
 for(const id of ids){const m=w.maps[id],p=m.nativeTerrain;assert.ok(p.scatter.length>=10,id+' has natural ground detail');for(const t of p.trees){const x=t[0]+t[3]*.475,y=t[1]+t[3]*.92;let roadClearance=Infinity;for(const lane of m.paths)for(let i=1;i<lane.points.length;i++){const a=lane.points[i-1],b=lane.points[i],dx=b[0]-a[0],dy=b[1]-a[1],q=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));roadClearance=Math.min(roadClearance,Math.hypot(x-a[0]-q*dx,y-a[1]-q*dy)-lane.width);}assert.ok(roadClearance>=t[3]*.14+14,id+' tree trunk keeps road clearance');assert.equal(m.buildings.some(b=>x>b.x-30&&x<b.x+b.w+30&&y>b.y-t[3]*.8&&y<b.y+b.h+20),false,id+' tree clears buildings');}}
 assert.ok(w.maps.south.nativeTerrain.fields.length>0);assert.ok(w.maps.south.nativeTerrain.fields.some(f=>f[4]));
});
