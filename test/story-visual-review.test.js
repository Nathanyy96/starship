const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const review = require('../src/story-visual-review.js');
const stories = { 'main-1-0': require('../src/story-1-0-current.js'), 'main-1-1': require('../src/story-1-1-current.js') };
const images = { 'main-1-0': require('../src/story-1-0-images.js'), 'main-1-1': require('../src/story-1-1-images.js') };

test('review portraits and illustrations have exact prose anchors and real assets', () => {
  for (const chapter of Object.keys(stories)) {
    const entries = review.imagesFor(chapter, images[chapter]).concat(review.portraits.filter(p => p.chapter === chapter));
    for (const entry of entries) {
      const body = stories[chapter].scenes[entry.act - 1].body;
      assert.equal(body.split(entry.anchor).length - 1, 1, entry.src + ' must appear at one matching paragraph');
      assert.ok(fs.existsSync(path.resolve(__dirname, '..', entry.src)), entry.src + ' exists');
    }
  }
});

test('review keeps the published image manifests intact and separates named people', () => {
  const before = JSON.stringify(images);
  assert.equal(review.imagesFor('main-1-0', images['main-1-0']).length, 39);
  assert.equal(review.imagesFor('main-1-1', images['main-1-1']).length, 7);
  assert.equal(JSON.stringify(images), before);
  assert.equal(review.portraits.length, 11);
  assert.equal(new Set(review.portraits.map(p => p.id)).size, 11);
  assert.notEqual(review.portraits.find(p => p.id === 'kailin').src, review.portraits.find(p => p.id === 'mila').src);
  assert.equal(review.status, 'author-review-for-1.1');
});
