const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const motion=require('../src/character-motion');

test('scripted walks follow five original story cues on passable ground in 1.0 and 1.1',()=>{
  const opening=require('../src/first-act-game'),world=require('../src/first-major-world');let count=0;
  function verify(cue,anchor,clear){
    const scene=motion.createScene();assert.equal(scene.cue(cue.text,'line',anchor,100,clear),true,cue.text);
    const start=scene.sample(100)[0],middle=scene.sample(940)[0],end=scene.sample(1780)[0];
    assert.equal(start.walking,true);assert.equal(end.walking,false);assert.equal(start.id,cue.id);
    assert.ok(clear(start,end));assert.ok(Math.abs(Math.hypot(middle.x-start.x,middle.y-start.y)-32)<.01);
    assert.ok(Math.abs(Math.hypot(end.x-anchor.x,end.y-anchor.y)-(cue.approach?30:94))<.01);
    assert.equal(scene.cue(cue.text,'line',anchor,5000,clear),false);assert.equal(scene.sample(10000)[0].walking,false);
    assert.equal(scene.sample(100,true)[0].walking,false);scene.clear();assert.equal(scene.sample(10000).length,0);count++;
  }
  for(const cue of motion.sceneCues){
    opening.scenes.forEach((lines,i)=>{if(!lines.some(l=>l[1].includes(cue.text)))return;const p=opening.steps[i];verify(cue,{x:(p.x+.5)*32,y:(p.y+.5)*32},(a,b)=>opening.clearSegment(p.zone,[a.x/32,a.y/32],[b.x/32,b.y/32]));});
    for(const goals of Object.values(world.acts))for(const p of goals){if(!p.lines.some(l=>l.includes(cue.text)))continue;
      verify(cue,p,(a,b)=>{const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));for(let i=0;i<=steps;i++)for(const dx of [-6,6])for(const dy of [-6,6])if(!world.passable(p.map,a.x+(b.x-a.x)*i/steps+dx,a.y+(b.y-a.y)*i/steps+dy))return false;return true;});
    }
  }
  assert.equal(count,5);
});

test('ordinary dialogue and blocked terrain never create a scripted walk',()=>{
  const scene=motion.createScene();assert.equal(scene.cue('先吃。','a',{x:0,y:0},0,()=>true),false);
  assert.equal(scene.cue(motion.sceneCues[0].text,'b',{x:0,y:0},0,()=>false),false);assert.equal(scene.sample(100).length,0);
});

test('all 1.0–1.1 named characters have sixteen new directional frames and existing PNGs',()=>{
  const roster=require('../docs/character-motion-roster-20261015.json');
  assert.equal(roster.length,18);
  for(const {id} of roster){
    const entry=motion.manifest[id];assert.ok(entry,id);assert.equal(entry.frames.length,16);
    const png=fs.readFileSync(path.join(__dirname,'..',entry.src));
    assert.equal(png.subarray(1,4).toString(),'PNG');
    for(const r of entry.frames)assert.ok(r[0]>=0&&r[1]>=0&&r[2]>0&&r[3]>0&&r[0]+r[2]<=1.000001&&r[1]+r[3]<=1.000001,id);
    assert.equal(new Set(['down','left','up','right'].flatMap(d=>[0,23,46,69].map(s=>motion.frame(d,s,true,false,id)))).size,16);
  }
  assert.equal(motion.canonical('hero'),'celesia');
  assert.equal(fs.existsSync(path.join(__dirname,'../src/hero-motion.js')),false);
  assert.equal(fs.existsSync(path.join(__dirname,'../assets/exploration/hero-walk-atlas-v1.png')),false);
});

test('scene subscribers reuse the same loaded atlas, cancellation and retries work',()=>{
  const created=[];class Img{constructor(){created.push(this);}}
  const delivered=[];
  motion.load('vark',i=>delivered.push(['opening',i]),{ImageClass:Img});
  const cancelled=motion.load('vark',()=>assert.fail('cancelled callback'),{ImageClass:Img});cancelled.cancel();
  motion.load('vark',i=>delivered.push(['world',i]),{ImageClass:Img});
  assert.equal(created.length,1);created[0].onload();
  motion.load('vark',i=>delivered.push(['village',i]),{ImageClass:Img});
  assert.equal(created.length,1);assert.equal(delivered.length,3);assert.ok(delivered.every(v=>v[1]===created[0]));
  motion.load('oun',()=>{},{ImageClass:Img});created[1].onerror();
  motion.load('oun',()=>{},{ImageClass:Img});assert.equal(created.length,3);
});

test('selected explorer uses the new atlas in opening, village and world after scene changes',()=>{
  const loaded=[],draws=[];
  class Img{constructor(){loaded.push(this);this.naturalWidth=1254;this.naturalHeight=1254;}}
  const context=vm.createContext({Image:Img,window:{addEventListener(){}},HTMLInputElement:class{},performance:{now:()=>0},requestAnimationFrame:()=>1,cancelAnimationFrame(){}});
  for(const name of ['story-1-0-current','story-1-1-current','world-story-dialogue','world-story-campaign','first-act-scenes','character-motion-manifest','character-motion','exploration-renderer','exploration','first-act-game','world-presentation','guild-commissions','first-major-world'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../src',name+'.js'),'utf8'),context);
  function options(){
    const element=()=>({hidden:false,textContent:'',addEventListener(){},focus(){},querySelectorAll:()=>[]});
    const o={playerId:'magenta',load:()=>null,save(){},canStart:()=>true,onComplete:()=>Promise.resolve()};
    for(const k of ['canvas','panel','zone','status','objective','distance','position','discoveries','interact','dialog','dialogTitle','dialogText','dialogNext','reset','read','sync','next','pad','enter'])o[k]=element();
    o.canvas.width=960;o.canvas.height=576;o.canvas.getContext=()=>new Proxy({drawImage(...a){draws.push(a);}},{get:(v,k)=>v[k]||(()=>{}),set:()=>true});return o;
  }
  const opening=context.StarshipFirstActGame.create(options());opening.open();
  const atlas=loaded.find(i=>/magenta-walk-v2/.test(i.src));assert.ok(atlas);atlas.onload();opening.close();
  draws.length=0;const village=context.StarshipExploration.create(options());village.open();assert.ok(draws.some(a=>a[0]===atlas&&a.length===9),'village uses the same atlas');village.close();
  draws.length=0;const world=context.StarshipFirstMajorWorld.create(options());world.open(2);assert.ok(draws.some(a=>a[0]===atlas&&a.length===9),'world uses the same atlas');world.close();
  assert.equal(loaded.filter(i=>/magenta-walk-v2/.test(i.src)).length,1);
  assert.ok(draws.some(a=>a[0]===atlas&&a.length===9));
  assert.ok(loaded.every(i=>!/hero-walk-atlas-v1/.test(i.src)));
});
