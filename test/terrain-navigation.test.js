const test=require('node:test'),assert=require('node:assert/strict');
const world=require('../src/first-major-world'),opening=require('../src/first-act-game'),dialogue=require('../src/world-story-dialogue');
test('altar has a broad walkable platform and right-hand stairs; the former wall shortcut is blocked',()=>{
 assert.equal(opening.passable('valley',23.5,14.5),true);
 assert.equal(opening.passable('valley',18.5,10),true);
 assert.equal(opening.passable('valley',14,11.5),false,'actual west altar wall');
 assert.equal(opening.passable('valley',12.6,12.7),true,'open ground outside that wall');
 assert.ok(opening.route({...opening.initial(),x:23.5,y:14.5,index:1}).length);
});
test('automatic regional exits connect westward and southward without advancing the story',()=>{
 for(const [from,to]of [['village','road'],['road','city'],['village','south'],['south','riverRoad'],['riverRoad','lotin']]){
  const e=world.maps[from].exits.find(e=>e.to===to),state={...world.initial(2),map:from,x:e.x,y:e.y,roaming:true};
  const result=world.crossExit(state,from,e.x+35,e.y);
  assert.equal(result.changed,true,from+'→'+to);assert.equal(result.state.map,to);assert.equal(result.state.index,0);assert.equal(result.state.roaming,true);
  assert.equal(world.crossExit(result.state,to,result.state.x,result.state.y).changed,false,'no immediate return loop');
 }
});
test('dialogue identifies the actual speakers and preserves complete narration',()=>{
 const scene=world.acts[5][3],pair=scene.lines.map((text,i)=>[scene.speakers[i],text]);
 assert.equal(pair.find(p=>p[1]==='「下次先叫我。」')[0],'雷恩');
 assert.equal(pair.find(p=>p[1]==='「我不太會說自己做不到。話還沒想好，手就先動了。」')[0],'瑟蕾雅');
 const mixed=dialogue.cards(15,require('../src/story-1-1-current').scenes[4].body);
 assert.equal(mixed.find(p=>p.text.startsWith('「我不知道哪一個')).speaker,'Hina');
 assert.equal(mixed.find(p=>p.text.startsWith('「我沒有怪妳')).speaker,'Siyeon');
 for(const scenes of Object.values(world.acts))for(const scene of scenes)assert.equal(scene.lines.length,scene.speakers.length);
});
test('new interiors have solid furniture, reachable floor and a return to their own settlement',()=>{
 for(const [id,parent]of [['clinic','village'],['observatory','city'],['station','echo'],['roadShelter','northRoad'],['southStation','south']]){
  const map=world.maps[id],state={...world.initial(2),map:id,x:map.spawn[0],y:map.spawn[1]};
  assert.ok(world.passable(id,state.x,state.y),id);
  assert.equal(world.passable(id,30,30),false,id+' walls');
  for(const p of map.furniture)assert.equal(world.passable(id,p.x+p.w/2,p.y+p.h/2),false,id+' furniture');
  for(const site of map.sites)assert.ok(world.route(state,site).length,id+':'+site.id);
  const exit=map.exits.find(e=>e.to===parent);assert.ok(exit);
  assert.ok(world.transition({...state,x:exit.x,y:exit.y},exit).changed);
  assert.ok(world.maps[parent].exits.find(e=>e.to===id));
 }
});

test('White Bell is physically larger, workshop roof is blocked, and old positions migrate once',()=>{
 assert.ok(world.maps.city.width>world.maps.village.width*1.4);
 const roof=world.maps.city.buildings[0],center={x:roof.x+roof.w/2,y:roof.y+roof.h/2};
 assert.equal(world.passable('city',center.x,center.y),false);
 assert.deepEqual(world.planWalk({...world.initial(3),map:'city',...world.mapPoint('city',260,650)},center.x,center.y),[]);
 const original={version:1,act:3,index:7,map:'city',x:1280,y:380,visited:[],waypoints:[]},migrated=world.normalize(original);
 assert.equal(migrated.x,1280*2.2);assert.equal(migrated.y,380*2.2);assert.deepEqual(world.normalize(migrated),migrated);
});

test('first-night shelter retains original prose and its story position is reachable',()=>{const g=world.acts[11][1];assert.equal(g.map,'roadShelter');const m=world.maps[g.map],state={...world.initial(11),index:1,map:g.map,x:m.spawn[0],y:m.spawn[1]};assert.ok(world.route(state,g).length);assert.ok(g.lines.join('').includes('第一晚下小雨'));for(const id of ['roadShelter','southStation']){const m=world.maps[id],e=m.exits[0],parent=world.maps[e.to],entry=parent.exits.find(x=>x.to===id);assert.ok(world.passable(e.to,entry.x,entry.y));assert.equal(world.crossExit({...state,map:e.to,x:entry.x,y:entry.y},e.to,entry.x+40,entry.y).state.map,id);}});

test('Lotin follows the original quay and bridge while harbour water and warehouse roofs stay blocked',()=>{const m=world.maps.lotin;assert.equal(m.width,1536*3);for(const p of [[336,531],[650,560],[1100,780],[1450,450],[515,596],[630,671]]){const q=world.mapPoint('lotin',...p);assert.equal(world.passable('lotin',q.x,q.y),false,JSON.stringify(p));}const e=m.exits.find(e=>e.to==='riverRoad');assert.ok(e);const old=world.normalize({...world.initial(2),geometryVersion:2,map:'lotin',x:1100,y:780,waypoints:['lotin-anchor'],visited:['lotin:quay']});assert.equal(old.x,m.spawn[0]);assert.equal(old.y,m.spawn[1]);assert.ok(old.waypoints.includes('lotin-anchor'));assert.deepEqual(world.normalize(old),old);});
test('Vark workshop entrance is at its facade and returning leaves the player outside the door',()=>{const e=world.maps.city.exits.find(e=>e.to==='factoryNear'),door=world.mapPoint('city',355,666);assert.equal(e.x,door.x);assert.equal(e.y,door.y);const back=world.maps.factoryNear.exits.find(e=>e.to==='city');assert.deepEqual(back.spawn,[355*2.2,686*2.2]);const old=world.mapPoint('city',140,580);assert.ok(Math.hypot(e.x-old.x,e.y-old.y)>400);const roof=world.mapPoint('city',375,570);assert.equal(world.passable('city',roof.x,roof.y),false);});
