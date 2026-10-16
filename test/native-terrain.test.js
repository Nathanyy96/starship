const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const w=require('../src/first-major-world'),native=require('../src/native-terrain');
test('approved western trade road retains its original illustration and traced bridge corridors',()=>{
 const m=w.maps.road;assert.equal(m.nativeTerrain.overview,true);
 assert.equal(m.image,'./assets/exploration/west-trade-road-v1.png');
 assert.equal(native.objects(m.nativeTerrain).length,0);
 assert.ok(w.passable('road',676,435));assert.equal(w.passable('road',676,650),false);
 assert.equal(m.paths[0].width,30);
});
test('regional landscape modules stay outside every walkable lane',()=>{
 let count=0;
 for(const [id,m]of Object.entries(w.maps))for(const o of m.nativeTerrain?.landscapes||[]){
  assert.ok(o.purpose,id+' has an explicit landscape purpose');count++;
  for(const lane of m.paths)for(let i=1;i<lane.points.length;i++){
   const a=lane.points[i-1],b=lane.points[i],steps=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/6);
   for(let k=0;k<=steps;k++){const x=a[0]+(b[0]-a[0])*k/steps,y=a[1]+(b[1]-a[1])*k/steps,dx=Math.max(o.x-x,0,x-o.x-o.w),dy=Math.max(o.y-y,0,y-o.y-o.h);assert.ok(Math.hypot(dx,dy)>lane.width+10,id+' landscape hides a road');}
  }
 }
 assert.ok(count>=80);
 assert.ok(w.maps.village.nativeTerrain.structures.some(s=>s.sheet==='villageHomes'));
 assert.ok(w.maps.city.nativeTerrain.structures.some(s=>s.sheet==='whiteBell'));
 for(const id of ['echo','relic','banksEast','bellcourt','rescue'])assert.equal(w.maps[id].nativeTerrain.biome,'rocky');
});
test('all outdoor locations use local scene materials at their intended scale',()=>{
  for(const id of['village','city','south','riverRoad','lotin'])assert.ok(w.maps[id].nativeTerrain,id);
  assert.ok(w.maps.road.nativeTerrain);assert.equal(w.maps.road.width,1672);
  for(const [id,file]of Object.entries(native.files)){const data=fs.readFileSync(path.join(__dirname,'../assets/exploration/native',file));assert.ok(data.readUInt32BE(16)>=1024,file);assert.equal(data[25],['ground','detail','refinedGround','tradeRoad'].includes(id)?2:6,file);}
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


test('all currently playable scenes have local geometry',()=>{
 for(const [id,m]of Object.entries(w.maps)){assert.ok(m.nativeTerrain||m.floor,id+' must not use an enlarged overview');if(m.floor){assert.ok(m.furniture.length>=3,id+' authored interior');}else if(!m.nativeTerrain.overview){assert.ok(m.nativeTerrain.structures.length,id+' landmark architecture');}}
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

test('new roadside vignettes keep their full footprints clear of playable roads',()=>{
 for(const [id,m]of Object.entries(w.maps)){if(!m.nativeTerrain||m.nativeTerrain.overview)continue;const props=m.nativeTerrain.scenery;assert.ok(props.length,id);for(const p of props){assert.equal(native.objects(m.nativeTerrain).includes(p),true);for(const lane of m.paths)for(let i=1;i<lane.points.length;i++){const a=lane.points[i-1],b=lane.points[i],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/10);for(let k=0;k<=n;k++){const x=a[0]+(b[0]-a[0])*k/n,y=a[1]+(b[1]-a[1])*k/n;const dx=Math.max(p.x-x,0,x-p.x-p.w),dy=Math.max(p.y-y,0,y-p.y-p.h);assert.ok(Math.hypot(dx,dy)>lane.width,id+' scenery intrudes on road');}}}}
});

test('White Bell and Beast Village have populated street-facing districts',()=>{
 for(const [id,count] of [['city',25],['village',14]]){const m=w.maps[id];assert.ok(m.nativeTerrain.structures.length>=count,id+' has a populated settlement');for(const p of m.nativeTerrain.structures.filter(p=>p.residential)){assert.ok(p.door,id+' street-facing frontage');assert.ok(w.passable(id,...p.door),id+' accessible front walk');}}
});
test('Mistbridge town center has accessible homes and residents',()=>{
 const m=w.maps.mistbridge,homes=m.nativeTerrain.structures.filter(p=>p.residential);
 assert.ok(homes.length>=8);
 assert.ok(homes.filter(p=>Math.hypot(p.x+p.w/2-1181,p.y+p.h/2-685)<500).length>=2);
 for(const home of homes)assert.ok(w.passable('mistbridge',...home.door));
 const residents=require('../src/world-presentation').npcs('mistbridge');
 assert.ok(residents.length>=3);
 for(const person of residents)assert.ok(w.passable('mistbridge',person.x*1.6,person.y*1.6),person.name);
});
test('Echo Valley keeps one river crossing and the far workshop road reaches its facade',()=>{
 const echo=w.maps.echo,river=echo.nativeTerrain.water[0].points;
 function riverX(y){for(let i=1;i<river.length;i++)if(y<=river[i][1]){const a=river[i-1],b=river[i],t=(y-a[1])/(b[1]-a[1]);return a[0]+(b[0]-a[0])*t;}return river.at(-1)[0];}
 let crossings=0;
 for(const lane of echo.paths)for(let i=1;i<lane.points.length;i++){const a=lane.points[i-1],b=lane.points[i];if(a[1]>300&&b[1]>300&&(a[0]-riverX(a[1]))*(b[0]-riverX(b[1]))<0)crossings++;}
 assert.equal(crossings,1,'the station and valley share one clear bridge');
 const far=w.maps.factoryFar,approach=far.paths[0].points.at(-1);
 assert.ok(approach[1]>far.buildings[0].y+far.buildings[0].h,'road reaches the workshop frontage');
 assert.ok(w.planWalk({...w.initial(2),map:'factoryFar',x:far.spawn[0],y:far.spawn[1]},...approach).length);
});
test('guidance to Vark avoids automatically entering the recovery house on the way',()=>{
 const m=w.maps.city,target=m.exits.find(e=>e.to==='factoryNear'),other=m.exits.find(e=>e.to==='recovery'),route=w.planWalk({...w.initial(2),map:'city',x:m.spawn[0],y:m.spawn[1],roaming:true},target.x,target.y);assert.ok(route.length);for(let i=1;i<route.length;i++){const a=route[i-1],b=route[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));for(let k=0;k<=n;k++)assert.ok(Math.hypot(a.x+(b.x-a.x)*k/n-other.x,a.y+(b.y-a.y)*k/n-other.y)>24,'route must not cross another doorway trigger');}
});

test('relocated Mistbridge trees leave the old street clear and keep solid trunks',()=>{assert.equal(w.passable('mistbridge',1121.25,1088),true);assert.equal(w.passable('mistbridge',1121.25,1338),false);const m=w.maps.mistbridge;const route=w.planWalk({...w.initial(2),map:'mistbridge',x:985,y:1100,roaming:true},1400,1100);assert.ok(route.length);let s={...w.initial(2),map:'mistbridge',x:985,y:1100,roaming:true};for(const p of route){s=w.move(s,p.x-s.x,p.y-s.y);assert.ok(Math.hypot(s.x-p.x,s.y-p.y)<.1);}});
