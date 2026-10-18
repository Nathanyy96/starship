const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const motion=require('../src/character-motion');
test('named 1.0–1.1 characters use authored normal-proportion cutouts',()=>{
  const art=require('../src/exploration-characters');
  for(const id of ['celesia','reyn','lia','isar','mila','vark','seifra','harlow','chodan','magenta','hina','siyeon','cenwu','ruida','yuan','sevin','noyas','kailin','oun']){
    const source=art.worldSource(id);
    assert.equal(motion.supports(id),false,id);
    assert.ok(source&&fs.existsSync(path.join(__dirname,'..',source)),id);
    assert.equal(fs.readFileSync(path.join(__dirname,'..',source))[25],6,id);
  }
});

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

test('obsolete Q-style walking atlases are removed while resident art remains',()=>{
  const roster=require('../docs/character-motion-roster-20261015.json');
  assert.equal(roster.length,0);
  assert.equal(Object.keys(motion.manifest).length,0);
  for(let i=1;i<=12;i++) assert.ok(fs.existsSync(path.join(__dirname,'../assets/exploration','resident-'+String(i).padStart(2,'0')+'-chibi-v1.png')));
  assert.equal(motion.canonical('hero'),'celesia');
  assert.equal(fs.existsSync(path.join(__dirname,'../src/hero-motion.js')),false);
  assert.equal(fs.existsSync(path.join(__dirname,'../assets/exploration/hero-walk-atlas-v1.png')),false);
});
