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

test('village cannot skip to later regions and route guides travel via actual exits', () => {
  const locked=world.initial(3),exit=world.maps.village.exits[0];
  assert.equal(world.transition({...locked,x:exit.x,y:exit.y},exit).changed,false);
  const ready={...locked,index:3,x:exit.x,y:exit.y};
  const result=world.transition(ready,exit);
  assert.equal(result.changed,true);
  assert.equal(result.state.map,'road');
  assert.equal(world.navigationTarget({...result.state,index:6}).to,'city');
  assert.equal(world.transition(ready,{...exit}).changed,false);
});

test('old or invalid saved positions recover and second act cannot resume in the city', () => {
  assert.equal(world.normalize({...world.initial(2),map:'city',x:800,y:400}).map,'village');
  assert.equal(world.normalize({...world.initial(3),index:7,map:'city',x:Infinity,y:-1}).x,world.maps.city.spawn[0]);
  assert.equal(world.normalize({version:0,act:2,index:100}).index,0);
});

function controllerHarness() {
  const context=vm.createContext({window:{addEventListener(){}},Image:class{},performance:{now:()=>0},requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
  for(const name of ['story-1-0-current','first-act-scenes','exploration-renderer','exploration','first-major-world'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..','src',name+'.js'),'utf8'),context);
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
