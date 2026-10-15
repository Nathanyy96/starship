const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const world = require('../src/first-major-world.js');
const source = require('../src/story-1-0-current.js');
const vm = require('node:vm');

test('exploration retains every published word of acts two and three in order', () => {
  const clean = s => s.replace(/\s/g, '');
  for (const act of [2,3]) assert.equal(clean(world.acts[act].flatMap(s => s.lines).join('')), clean(source.scenes[act-1].body));
});

test('each region uses its own existing or new background', () => {
  for (const map of Object.values(world.maps)) assert.ok(fs.existsSync(path.join(__dirname,'..',map.image.replace(/^\.\//,''))));
  assert.equal(world.maps.city.width,1672);
});

test('every scene, site and regional exit is reachable along the walkable ground', () => {
  for (const [id,map] of Object.entries(world.maps)) {
    const state = {...world.initial(3),map:id,x:map.spawn[0],y:map.spawn[1],index:world.acts[3].length};
    const goals = world.acts[2].concat(world.acts[3]).filter(s => s.map===id).concat(map.sites,map.exits);
    for (const goal of goals) {
      assert.ok(world.passable(id,goal.x,goal.y),id+':'+goal.title);
      const route = world.route(state,goal);
      assert.ok(route.length,id+':'+(goal.title||goal.name));
      let moving=state;
      for(const p of route) moving=world.move(moving,p.x-moving.x,p.y-moving.y);
      moving=world.move(moving,goal.x-moving.x,goal.y-moving.y);
      assert.ok(Math.hypot(moving.x-goal.x,moving.y-goal.y)<35,id+':'+(goal.title||goal.name));
    }
  }
});

test('water and buildings block movement, including a large movement across the creek', () => {
  assert.equal(world.passable('road',760,670),false);
  assert.equal(world.passable('city',837,413),false);
  const atBridge={...world.initial(3),index:4,map:'road',x:676,y:435};
  const next=world.move(atBridge,0,250);
  assert.ok(next.y<550);
});

test('first-major terrain opens independently of story and guidance uses real exits', () => {
  const locked=world.initial(3),exit=world.maps.village.exits[0];
  assert.equal(world.transition({...locked,x:exit.x,y:exit.y},exit).changed,true);
  const ready={...locked,index:3,x:exit.x,y:exit.y};
  const result=world.transition(ready,exit);
  assert.equal(result.changed,true);
  assert.equal(result.state.map,'road');
  assert.equal(world.navigationTarget({...result.state,index:6}).to,'city');
  assert.equal(world.transition(ready,{...exit}).changed,false);
});

test('invalid positions recover and exploration away from the main story resumes', () => {
  assert.equal(world.normalize({...world.initial(2),map:'city',x:800,y:300}).map,'city');
  assert.equal(world.normalize({...world.initial(3),index:7,map:'city',x:Infinity,y:-1}).x,world.maps.city.spawn[0]);
  assert.equal(world.normalize({version:0,act:2,index:100}).index,0);
});

function controllerHarness() {
  const context=vm.createContext({window:{addEventListener(){}},Image:class{},performance:{now:()=>0},requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
  for(const name of ['story-1-0-current','first-act-scenes','exploration-renderer','exploration','world-presentation','first-major-world'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',name+'.js'),'utf8'),context);
  function element(){const handlers={};return {hidden:false,textContent:'',addEventListener(k,f){handlers[k]=f;},click(){handlers.click?.({});},focus(){},querySelectorAll:()=>[]};}
  const options={load:()=>null,save(){},canStart:()=>true,onComplete:()=>Promise.resolve()};
  for(const key of ['canvas','panel','zone','status','objective','distance','position','interact','dialog','dialogTitle','dialogText','dialogNext','reset','sync','next','pad'])options[key]=element();
  options.canvas.width=960;options.canvas.height=576;options.canvas.getContext=()=>new Proxy({},{get:()=>()=>{},set:()=>true});
  return {world:context.StarshipFirstMajorWorld,options};
}

test('last scene commits only after all dialogue cards and a failed sync can retry', async () => {
  const {world:w,options}=controllerHarness(),last=w.acts[2].at(-1);
  const saved={...w.initial(2),index:w.acts[2].length-1,map:last.map,x:last.x,y:last.y};
  options.load=()=>saved;let calls=0;options.onComplete=()=>++calls===1?Promise.reject(new Error('offline')):Promise.resolve();
  const controller=w.create(options);controller.open(2);options.interact.click();
  for(let i=0;i<last.lines.length-1;i++)options.dialogNext.click();
  assert.equal(controller.state().index,w.acts[2].length-1);
  assert.equal(calls,0);
  options.dialogNext.click();await new Promise(setImmediate);
  assert.equal(controller.state().index,w.acts[2].length);
  assert.match(options.status.textContent,/尚未保存/);
  options.sync.click();await new Promise(setImmediate);
  assert.equal(calls,2);assert.match(options.status.textContent,/已保存/);
});

test('formal progress gate blocks later acts and closing twice does not write into a new account', () => {
  const {world:w,options}=controllerHarness();let saves=0;
  options.save=()=>saves++;options.canStart=act=>act===2;
  const controller=w.create(options);assert.equal(controller.open(3),false);assert.equal(saves,0);
  assert.equal(controller.open(2),true);controller.close();const count=saves;
  controller.close();assert.equal(saves,count);
});

 test('all first-major maps are connected without advancing story; ocean and later versions stay closed',()=>{
  const state=world.initial(2),seen=new Set(['village']),queue=['village'];
  for(let i=0;i<queue.length;i++)for(const exit of world.maps[queue[i]].exits){
    const at={...state,map:queue[i],x:exit.x,y:exit.y};const result=world.transition(at,exit);
    assert.equal(result.changed,true);assert.equal(result.state.index,0);assert.equal(result.state.act,2);
    assert.ok(world.passable(result.state.map,result.state.x,result.state.y));
    if(!seen.has(exit.to)){seen.add(exit.to);queue.push(exit.to);}
  }
  assert.equal(seen.size,Object.keys(world.maps).length);
  for(const id of ['south','mistbridge','echo','relic','banksWest','banksEast','bellcourt'])assert.ok(seen.has(id));
  for(const id of ['ocean','R2-000','C2-201','S6-001','__proto__'])assert.equal(world.canVisit(state,id),false);
  assert.equal(world.navigationTarget({...state,map:'relic',x:210,y:890}).to,'echo');
  assert.equal(world.navigationTarget(state,'bellcourt').to,'road');
  assert.equal(world.passable('banksWest',835,240),false);
  assert.equal(world.passable('banksEast',835,240),false);
 });


test('waypoints require nearby activation and preserve story on travel',()=>{
  let state=world.initial(2);assert.equal(world.teleport(state,'city-anchor').changed,false);
  assert.equal(world.activateWaypoint(state,'city-anchor').changed,false);
  assert.equal(world.activateWaypoint({...state,x:300,y:300},'village-anchor').changed,false);
  let result=world.activateWaypoint(state,'village-anchor');assert.equal(result.changed,true);state=result.state;
  assert.equal(world.activateWaypoint(state,'village-anchor').changed,false);
  const p=world.waypoints.find(p=>p.id==='city-plaza');
  state=world.activateWaypoint({...state,map:p.map,x:p.x,y:p.y},p.id).state;
  result=world.teleport({...state,index:2,visited:['city:plaza']},'village-anchor');
  assert.equal(result.changed,true);assert.equal(result.state.map,'village');assert.equal(result.state.index,2);
  assert.deepEqual(result.state.visited,['city:plaza']);assert.deepEqual(result.state.waypoints,['village-anchor','city-plaza']);
  for(const id of ['ocean','R2-000','__proto__'])assert.equal(world.teleport(state,id).changed,false);
  assert.deepEqual(world.normalize({...state,waypoints:['city-plaza','ocean','city-plaza']}).waypoints,['city-plaza']);
});

test('each waypoint can be walked to and arrives on safe ground',()=>{
  for(const p of world.waypoints){const map=world.maps[p.map];let state={...world.initial(2),map:p.map,x:map.spawn[0],y:map.spawn[1]};
    const route=world.route(state,p);assert.ok(route.length,p.id);
    for(const step of route)state=world.move(state,step.x-state.x,step.y-state.y);
    assert.ok(world.activateWaypoint(state,p.id).changed,p.id);
    const landed=world.teleport({...state,waypoints:[p.id]},p.id);assert.equal(landed.changed,true,p.id);
  }
});

test('travel controls share unlocks across acts, reload by account, and block travel during dialogue',()=>{
  const {world:w,options}=controllerHarness();
  for(const key of ['activate','travel','travelHint','travelList'])options[key]={hidden:false,disabled:false,value:'',innerHTML:'',textContent:'',handlers:{},addEventListener(k,f){this.handlers[k]=f;},click(){this.handlers.click?.();}};
  let shared=['city-anchor'];options.loadWaypoints=()=>shared;options.saveWaypoints=ids=>shared=ids;
  const controller=w.create(options);controller.open(2);options.activate.click();assert.deepEqual(Array.from(shared),['city-anchor','village-anchor']);
  options.interact.click();options.travelList.value='city-anchor';options.travel.click();assert.equal(controller.state().map,'village');
  controller.close();controller.open(3);assert.ok(controller.state().waypoints.includes('city-anchor'));
  options.travelList.value='city-anchor';options.travel.click();assert.equal(controller.state().map,'city');assert.equal(controller.state().index,0);
  controller.close();shared=[];controller.open(2);assert.equal(controller.state().waypoints.length,0);
  options.travelList.value='city-anchor';options.travel.click();assert.equal(controller.state().map,'village');
});


test('named NPCs use existing chibi assets, stand on reachable ground and patrol safely',()=>{
  const p=require('../src/world-presentation');
  for(const [id,map] of Object.entries(world.maps))for(const npc of p.npcs(id)){
    assert.ok(fs.existsSync(path.join(__dirname,'../assets/exploration',npc.id+'-chibi-v1.png')));
    assert.ok(world.passable(id,npc.x,npc.y),npc.id);
    assert.ok(world.route({...world.initial(2),map:id,x:map.spawn[0],y:map.spawn[1]},npc).length,npc.id);
    for(const time of [0,2000,5000,10000]){const at=p.position(npc,time,false,(x,y)=>world.passable(id,x,y));assert.ok(world.passable(id,at.x,at.y),npc.id);}
    assert.deepEqual(p.position(npc,5000,true),{x:npc.x,y:npc.y});
  }
});

test('ambient NPC dialogue closes without advancing the story or granting progress',()=>{
  const {world:w,options}=controllerHarness();const original={...w.initial(2),map:'city',x:200,y:620};options.load=()=>original;
  let completions=0;options.onComplete=()=>completions++;
  const controller=w.create(options);controller.open(2);assert.equal(w.nearby(controller.state()).kind,'npc');options.interact.click();assert.equal(options.dialog.hidden,false);assert.equal(options.dialogTitle.textContent,'米菈');options.dialogNext.click();assert.equal(options.dialog.hidden,true);assert.equal(controller.state().index,0);assert.equal(completions,0);assert.equal(controller.state().map,'city');
});
