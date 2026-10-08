const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const atlas = require('../src/interactive-map.js');

test('atlas images, links, and positioned pins remain valid', () => {
  for (const [id, map] of Object.entries(atlas.maps)) {
    if (map.image) assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'maps', map.image)), `${id} image`);
    if (map.parent) assert.ok(atlas.maps[map.parent], `${id} parent`);
    for (const point of [...(map.points || []), ...(map.offMap || [])]) {
      if (!point[0].startsWith('#')) assert.ok(atlas.maps[point[0]], `${id} → ${point[0]}`);
      if (point.length > 2) {
        assert.ok(point[2] >= 0 && point[2] <= 100, `${id} x`);
        assert.ok(point[3] >= 0 && point[3] <= 100, `${id} y`);
      }
    }
  }
});

test('off-map special connections and author-only maps keep their boundaries', () => {
  const r5 = atlas.maps['R5-000'];
  assert.ok(r5.offMap.some(point => point[0] === 'S5-201'));
  assert.ok(atlas.maps['A1-106'].offMap.some(point => point[0] === 'S1-201'));
  assert.equal(atlas.maps['S6-001'].previewOnly, true);
  assert.match(atlas.render('S6-001', '', {authorPreview: true}), /西緣石岸/);
  assert.doesNotMatch(atlas.render('S6-001'), /class="atlas-pin/);
  assert.match(atlas.render('R6-000', '', {authorPreview: true}), /舊連結永久關閉/);
  assert.match(atlas.render('S5-201', '', {authorPreview: true}), /非地理比例/);
});
