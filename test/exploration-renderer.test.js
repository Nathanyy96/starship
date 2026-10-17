const test = require('node:test');
const assert = require('node:assert/strict');
const renderer = require('../src/exploration-renderer.js');
test('mobile camera keeps the character readable and renders at device resolution', () => {
  const old = global.window; global.window = { devicePixelRatio:2 };
  try {
    const canvas = { width:960, height:576, getBoundingClientRect:()=>({width:320,height:400}) };
    const transforms = [], ctx = { setTransform(...args){transforms.push(args);}, clearRect(){} };
    const view = renderer.begin(canvas,ctx,1152,768,500,500);
    assert.equal(canvas.width,640); assert.equal(canvas.height,800);
    assert.ok(view.width >= 350 && view.width < 400);
    assert.ok(44*view.zoom >= 36);
    assert.equal(ctx.imageSmoothingEnabled,true);
    assert.equal(ctx.imageSmoothingQuality,'high');
    assert.equal(transforms.at(-1)[0],2*.9);
  } finally { global.window=old; }
});
test('camera and sprite feet stay inside the scene when close to an edge', () => {
  const canvas={width:960,height:576},ctx={setTransform(){},clearRect(){}};
  const view=renderer.begin(canvas,ctx,1152,768,1152,768);
  assert.ok(view.x>=0 && view.x+view.width<=1152);
  assert.ok(view.y>=0 && view.y+view.height<=768);
});


test('remaining walking atlas uses direction, travelled distance and safe source rectangles',()=>{
  const motion=require('../src/character-motion');
  assert.equal(motion.heading(-8,1,'down'),'left');assert.equal(motion.heading(0,-8,'right'),'up');assert.equal(motion.heading(0,0,'up'),'up');
  for(const direction of ['down','left','up','right']){
    const frames=new Set();for(const distance of [0,23,46,69]){const r=motion.frame(direction,distance,true,false,'reyn');frames.add(r);assert.ok(r[0]>=0&&r[1]>=0&&r[0]+r[2]<=1&&r[1]+r[3]<=1);}
    assert.equal(frames.size,4);assert.deepEqual(motion.frame(direction,92,false,false,'reyn'),motion.frame(direction,400,true,true,'reyn'));
  }
  const calls=[];assert.equal(motion.draw({drawImage(...args){calls.push(args);}},{naturalWidth:1254,naturalHeight:1254},20,30,104,'up',46,true,false,'reyn'),true);assert.equal(calls[0].length,9);assert.ok(Math.abs(calls[0][6]+calls[0][8]-39)<1e-6);
  assert.equal(motion.draw({},null,0,0,104,'down',0,false,false),false);
});

test('illustrated scenery replaces procedural scenery and remains cached at the actual region size',()=>{const vm=require('node:vm'),fs=require('node:fs'),pending=[],draws=[],contexts=[];class Img{constructor(){pending.push(this);}}const context={module:{exports:{}},Image:Img,document:{createElement(){const ctx={fillRect(){},clearRect(){},drawImage(...v){draws.push(v);}};contexts.push(ctx);return {getContext:()=>ctx};}}};vm.runInNewContext(fs.readFileSync(require.resolve('../src/exploration-renderer'),'utf8'),context);const r=context.module.exports;r.terrain('port',16,16,()=>true,{image:'original-port.png'});const source=pending.find(i=>i.src==='original-port.png');assert.ok(source);source.onload();draws.length=0;const first=r.terrain('port',16,16,()=>true,{image:'original-port.png'});assert.equal(draws.length,1);assert.equal(draws[0][0],source);assert.equal(r.terrain('port',16,16,()=>true,{image:'original-port.png'}),first);assert.notEqual(r.terrain('port',32,32,()=>true,{image:'original-port.png'}),first);});

test('a pending scenic image never reveals fallback tiles or enables a false ready state',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),loaded=[],calls=[];
 const context={globalThis:{},Image:class{constructor(){loaded.push(this);}},document:{createElement(){return {getContext(){return {drawImage(){calls.push('image');}};}};}}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../src/exploration-renderer.js'),'utf8'),context);
 const r=context.globalThis.StarshipExplorationRenderer,settings={image:'scene.png'};
 assert.equal(r.terrain('scene',200,200,()=>true,settings),null);
 const pending=loaded.find(i=>i.src==='scene.png');assert.ok(pending);
 pending.onerror();assert.equal(r.terrainFailed('scene.png'),true);
 assert.equal(r.terrain('scene',200,200,()=>true,settings),null);
 pending.onload();assert.ok(r.terrain('scene',200,200,()=>true,settings));assert.deepEqual(calls,['image']);
});
