const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const data = require('../src/data.js');
const current11 = require('../src/story-1-1-current.js');
const images11 = require('../src/story-1-1-images.js');

test('1.1 candidate uses the current five-act story and remains closed', () => {
  assert.equal(current11.scenes.length, 5);
  assert.deepEqual(current11.scenes.map(scene => scene.title), [
    '第一幕｜缺兩個人的早餐',
    '第二幕｜近岸的第四個人',
    '第三幕｜把圖攤開',
    '第四幕｜第五個空拍',
    '第五幕｜借來的舞台'
  ]);
  assert.ok(current11.scenes.map(scene => scene.body).join('').length > 10000);
  assert.match(current11.scenes[1].body, /Siyeon/);
  assert.match(current11.scenes[4].body, /岑霧/);
  assert.deepEqual(data.storyChapters.map(chapter => chapter.id), ['main-1-0']);
  assert.equal(data.updateVersion, '1.0');
});

test('1.1 illustrations cover each act and anchor to its actual prose', () => {
  assert.deepEqual(images11.map(image => image.act), [1, 2, 3, 4, 4, 5]);
  for (const image of images11) {
    assert.ok(current11.scenes[image.act - 1].body.includes(image.anchor), image.src + ' anchor');
    assert.ok(fs.existsSync(path.resolve(__dirname, '..', image.src)), image.src + ' asset');
  }
});

test('1.1 character portraits exist without entering the public pool', () => {
  const ids = ['hina', 'siyeon', 'cenwu', 'ruida', 'yuan'];
  assert.deepEqual(data.authorPreviewCards.filter(card => card.releaseVersion === '1.1').map(card => card.id), ids);
  for (const id of ids) {
    const card = data.cards[id];
    assert.ok(fs.existsSync(path.resolve(__dirname, '..', card.image)), `${id} portrait`);
    assert.ok(!data.activeCards.some(active => active.id === id), `${id} public lock`);
  }
});
