const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),motion=require('../src/character-motion');
const base='./assets/portraits/standing-20261103/celesia.webp';
test('drawn combat eligibility uses native rarity and preserves equipped skins',()=>{
  assert.ok(motion.clipFor(Object.freeze({id:'celesia',rarity:4}),base));
  assert.equal(motion.clipFor({id:'celesia',rarity:3,stars:6},base),null);
  assert.equal(motion.clipFor({id:'reyn',rarity:3,stars:6},base),null);
  assert.equal(motion.clipFor({id:'celesia',rarity:4},'./assets/skins/celesia-new.png'),null);
  assert.equal(motion.clipFor({id:'chodan',rarity:4},base),null);
  assert.equal(motion.markup({id:'celesia',rarity:4},base,'attack','ultimate'),'');
  assert.match(motion.markup({id:'celesia',rarity:4},base,'attack','basic'),/playing/);
});
test('Celesia basic has 24 distinct drawings and fits the replay action window',()=>{
  const manifest=require('../assets/combat/frames-20261108/celesia-basic-right-v1.json');
  assert.equal(manifest.direction,"right");assert.equal(motion.clips.celesia.direction,"right");assert.equal(manifest.frames,24);assert.equal(new Set(manifest.frameHashes).size,24);
  assert.equal(manifest.frames,manifest.columns*manifest.rows);
  assert.ok(manifest.durationMs<=680);assert.equal(manifest.durationMs,manifest.frameMs*manifest.frames);
  const payload=fs.readFileSync(require.resolve('../assets/combat/frames-20261108/celesia-basic-right-v1.webp'));
  assert.equal(payload.subarray(0,4).toString(),'RIFF');assert.equal(payload.subarray(8,12).toString(),'WEBP');
  assert.equal(payload.length,manifest.bytes);assert.ok(payload.length<1000000);
});
