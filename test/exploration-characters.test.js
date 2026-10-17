const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const art = require('../src/exploration-characters.js');
const data = require('../src/data.js');

test('every playable and story character has an exploration identity and existing original', () => {
  const cast = art.catalog(data);
  for (const id of [...Object.keys(data.cards), ...Object.keys(data.storyCharacters)]) assert.ok(cast[id], id);
  for (const entry of Object.values(cast)) {
    assert.ok(fs.existsSync(path.join(__dirname, '..', entry.original)), entry.id);
    const worldSource=art.worldSource(entry.id);
    assert.equal(fs.readFileSync(path.join(__dirname, '..', worldSource || entry.chibi))[25], 6, entry.id + ' RGBA world art');
    assert.equal(art.byName(entry.name, data).id, entry.id);
  }
  assert.equal(art.resolve('hero', data).id, 'celesia');
  for (const id of ['muheng','xuanshuo','lanxi','jingsen','jinglan','beiyin','xiaoyue','anzhu','suoye','lifan','weina']) assert.equal(cast[id], undefined, id);
});

function harness() {
  const images = [], events = [];
  class FakeImage { constructor() { images.push(this); } }
  const handle = art.load('lia', data, (image, meta) => events.push({ image, meta }), { ImageClass: FakeImage });
  return { images, events, handle };
}

test('missing world cutout falls back to original once, and total failure terminates', () => {
  const h = harness();
  assert.match(h.images[0].src, /lia-world-cutout/);
  h.images[0].onerror();
  assert.equal(h.images[1].src, art.catalog(data).lia.original);
  h.images[1].onload();
  assert.equal(h.events[0].meta.displayKind, 'original');
  const failed = harness(); failed.images[0].onerror(); failed.images[1].onerror();
  assert.equal(failed.images.length, 2);
  assert.equal(failed.events[0].meta.displayKind, 'missing');
  assert.equal(failed.events[0].image, null);
});

test('cancelled loads cannot display a previous character or start fallback', () => {
  const h = harness(); h.handle.cancel(); h.images[0].onload(); h.images[0].onerror();
  assert.equal(h.events.length, 0); assert.equal(h.images.length, 1);
});

test('alternate story costumes preserve their original instead of showing the base chibi', () => {
  const result = art.resolve('isar', data, './assets/story-characters/isar-ascended.png');
  assert.deepEqual(result.sources, [{ url: './assets/story-characters/isar-ascended.png', kind: 'original' }]);
});

test('dialogue portraits prefer the authored full-size art', () => {
  const images = [];
  class FakeImage { constructor() { images.push(this); } }
  art.load('celesia', data, () => {}, { ImageClass: FakeImage, preferOriginal: true });
  assert.equal(images[0].src, data.cards.celesia.image + '?v=first-major-author-art-20261017');
});

test('narration clears the previous speaker portrait', () => {
  const classes = new Set(['has-world-portrait']);
  let cancelled = false, removed = false;
  const img = { hidden: false, removeAttribute: () => { removed = true; } };
  const panel = { ownerDocument: {}, querySelector: () => img, _portraitLoad: { cancel: () => { cancelled = true; } }, classList: { remove: name => classes.delete(name) } };
  art.speakerPortrait(panel, '旁白', data);
  assert.ok(cancelled && removed && img.hidden);
  assert.equal(classes.has('has-world-portrait'), false);
});
