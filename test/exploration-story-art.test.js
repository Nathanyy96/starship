const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const art=require('../src/exploration-story-art'),review=require('../src/story-visual-review'),first=require('../src/first-act-scenes'),world=require('../src/first-major-world');
test('all 44 approved illustrations have an exact exploration dialogue anchor',()=>{
  const found=[];
  first.all.forEach(lines=>found.push(...art.timeline('main-1-0',1,lines)));
  for(const [id,scenes]of Object.entries(world.acts)){const meta=world.storyMeta(Number(id));scenes.forEach(scene=>found.push(...art.timeline(meta.chapterId,meta.index+1,scene.lines)));}
  const expected=review.imagesFor('main-1-0',require('../src/story-1-0-images')).concat(review.imagesFor('main-1-1',require('../src/story-1-1-images')));
  assert.equal(expected.length,44);assert.equal(found.length,44);
  assert.deepEqual(found.map(i=>i.src).sort(),expected.map(i=>i.src).sort());
  for(const image of found)assert.ok(fs.existsSync(path.resolve(__dirname,'..',image.src)));
});
test('pictures appear only once their anchor is reached and persist within the conversation',()=>{
  const lines=first.approach.find(lines=>art.timeline('main-1-0',1,lines).length),entries=art.timeline('main-1-0',1,lines);assert.ok(entries.length);
  assert.deepEqual(art.current(entries,-1),[]);
  for(const entry of entries){assert.ok(art.current(entries,entry.line).some(image=>image.src===entry.src));assert.ok(art.current(entries,entry.line-1).every(image=>image.line<entry.line));}
  assert.deepEqual(art.current([],100),[]);
});
test('illustration anchors may span narrator and character cards without losing the image',()=>{
  const image=require('../src/story-1-0-images').find(i=>i.src.endsWith('1-0-04.webp'));
  const parts=[image.anchor.slice(0,8),image.anchor.slice(8,15),image.anchor.slice(15)];
  const entries=art.timeline('main-1-0',1,parts);assert.ok(entries.some(i=>i.src===image.src&&i.line===0));
});
