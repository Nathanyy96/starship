const test=require('node:test'),assert=require('node:assert/strict');
const world=require('../src/first-major-world'),opening=require('../src/first-act-game'),dialogue=require('../src/world-story-dialogue');
test('altar has a broad walkable platform and right-hand stairs; the former wall shortcut is blocked',()=>{
 assert.equal(opening.passable('valley',23.5,14.5),true);
 assert.equal(opening.passable('valley',18.5,10),true);
 assert.equal(opening.passable('valley',12.6,12.7),false);
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
 for(const [id,parent]of [['clinic','village'],['observatory','city'],['station','echo']]){
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
