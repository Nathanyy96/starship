const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const atlas = require('../src/interactive-map.js');

test('atlas images, links, and positioned pins remain valid', () => {
  for (const [id, map] of Object.entries(atlas.maps)) {
    if (map.image) assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'maps', map.image)), `${id} image`);
    if (map.parent) assert.ok(atlas.maps[map.parent], `${id} parent`);
    for (const point of [...(map.points || []), ...(map.offMap || []), ...(map.authorOffMap || [])]) {
      if (!point[0].startsWith('#')) assert.ok(atlas.maps[point[0]], `${id} → ${point[0]}`);
      if (point.length > 2) {
        assert.ok(point[2] >= 0 && point[2] <= 100, `${id} x`);
        assert.ok(point[3] >= 0 && point[3] <= 100, `${id} y`);
      }
    }
  }
});

test('new child maps appear only in author preview and retain their parent route', () => {
  assert.equal(atlas.maps['A1-108'].parent, 'A1-107');
  assert.equal(atlas.maps['C2-201'].parent, 'R2-000');
  assert.equal(atlas.maps['C2-202'].parent, 'R2-000');
  assert.equal(atlas.maps['C2-203'].parent, 'R2-000');
  assert.equal(atlas.maps['C2-204'].parent, 'R2-000');
  assert.equal(atlas.maps['A2-205'].parent, 'R2-000');
  for (const id of ['C3-301', 'C3-302', 'A3-303']) {
    assert.equal(atlas.maps[id].parent, 'R3-000');
    assert.equal(atlas.maps[id].previewOnly, true);
    assert.match(atlas.render('R3-000', '', {authorPreview: true}), new RegExp(`data-map-go="${id}"`));
  }
  assert.doesNotMatch(atlas.render('R3-000'), /data-map-go="C3-301"/);
  assert.match(atlas.maps['C3-302'].orientation, /白榆河沿東側/);
  assert.match(atlas.maps['A3-303'].orientation, /與白榆河分流/);
  for (const id of ['C4-401', 'C4-402', 'C4-403']) {
    assert.equal(atlas.maps[id].parent, 'R4-000');
    assert.equal(atlas.maps[id].previewOnly, true);
    assert.match(atlas.render('R4-000', '', {authorPreview: true}), new RegExp(`data-map-go="${id}"`));
  }
  assert.doesNotMatch(atlas.render('R4-000'), /data-map-go="C4-401"/);
  assert.match(atlas.maps['C4-401'].orientation, /不是白鐘主河/);
  assert.match(atlas.maps['C4-402'].orientation, /內陸約兩日/);
  assert.ok(atlas.maps['C4-403'].offMap.some(point => point[0] === 'S5-201'));
  for (const [id, parent] of [['C5-501', 'R5-000'], ['A5-502', 'R5-000'], ['C6-601', 'R6-000']]) {
    assert.equal(atlas.maps[id].parent, parent);
    assert.equal(atlas.maps[id].previewOnly, true);
    assert.match(atlas.render(parent, '', {authorPreview: true}), new RegExp(`data-map-go="${id}"`));
    assert.doesNotMatch(atlas.render(parent), new RegExp(`data-map-go="${id}"`));
  }
  assert.match(atlas.maps['A5-502'].orientation, /谷底泉區/);
  assert.match(atlas.maps['C6-601'].note, /舊跨界線永久關閉/);
  assert.match(atlas.render('A1-107', '', {authorPreview: true}), /data-map-go="A1-108"/);
  assert.doesNotMatch(atlas.render('A1-107'), /data-map-go="A1-108"/);
  assert.match(atlas.render('R2-000', '', {authorPreview: true}), /data-map-go="C2-201"/);
  assert.match(atlas.render('C2-202', '', {authorPreview: true}), /東側礁盤/);
  assert.doesNotMatch(atlas.render('C2-202'), /class="atlas-pin/);
});

test('southern maps keep the world-level river plain and northward mountain transition', () => {
  const points = Object.fromEntries(atlas.maps['R1-000'].points.map(point => [point[0], point]));
  assert.ok(points['C1-101'][2] < points['C1-102'][2], 'White Bell stays west of the village');
  assert.ok(points['C1-103'][3] < points['C1-101'][3], 'Mistbridge stays north of White Bell');
  assert.ok(points['C1-104'][3] > points['C1-101'][3], 'South Post Valley stays south of White Bell');
  assert.match(atlas.maps['R1-000'].orientation, /開闊內陸河谷/);
  assert.match(atlas.maps['C1-101'].orientation, /並非海港/);
  assert.match(atlas.maps['C1-102'].orientation, /不是港灣或大湖/);
  assert.match(atlas.maps['C1-103'].orientation, /丘陵河谷/);
});

test('region and child maps agree on basin terrain and special connection ancestry', () => {
  assert.match(atlas.maps['W-001'].orientation, /星井內陸盆地，不是大湖/);
  assert.match(atlas.maps['R3-000'].orientation, /白榆河沿東側山壁/);
  assert.match(atlas.maps['C3-302'].orientation, /白榆河沿東側/);
  assert.equal(atlas.maps['S5-201'].parent, 'C4-403');
  assert.equal(atlas.maps['S5-201'].level, 3);
  assert.ok(atlas.maps['S5-201'].image);
  assert.match(atlas.maps['S5-201'].orientation, /非新曙或根冠相鄰地形/);
  assert.ok(atlas.maps['C4-403'].offMap.some(point => point[0] === 'S5-201'));
  assert.equal(atlas.maps['R5-000'].offMap, undefined);
  const outerRing = atlas.render('S5-201', '', {authorPreview: true});
  assert.match(outerRing, /s5-201-rainbow-outer-ring-concept\.png/);
  assert.match(outerRing, /候審子圖/);
  assert.doesNotMatch(outerRing, /atlas-diagram/);
});

test('off-map special connections and author-only maps keep their boundaries', () => {
  assert.ok(atlas.maps['A1-106'].offMap.some(point => point[0] === 'S1-201'));
  assert.equal(atlas.maps['S6-001'].previewOnly, true);
  assert.match(atlas.render('S6-001', '', {authorPreview: true}), /西緣石岸/);
  assert.doesNotMatch(atlas.render('S6-001'), /class="atlas-pin/);
  assert.match(atlas.render('R6-000', '', {authorPreview: true}), /舊連結永久關閉/);
  assert.match(atlas.render('S5-201', '', {authorPreview: true}), /無共同羅盤比例/);
});

test('world map exposes the offshore route and both bell-court review paths', () => {
  const world = atlas.render('W-001', '', {authorPreview: true});
  assert.ok(atlas.maps['W-001'].points.some(point => point[0] === 'R6-000' && point[2] > 80));
  assert.match(world, /class="atlas-pin child offshore"/);
  assert.match(world, /東側近海/);
  assert.match(world, /無曉高原｜後續規劃/);
  assert.match(world, /data-map-go="S1-201"/);
  assert.ok(atlas.maps['A1-106'].offMap.some(point => point[0] === 'S1-201'));
  assert.match(atlas.render('R6-000', '', {authorPreview: true}), /西北方圖外是艾珥汀本土/);
  assert.equal(atlas.maps['R6-000'].offMap, undefined);
  assert.equal(atlas.maps['C6-601'].offMap, undefined);
  assert.ok(atlas.maps['A6-602'].offMap.some(point => point[0] === 'S6-001'));
  assert.ok(atlas.maps['R4-000'].offMap.some(point => point[0] === 'S5-201'));
});

test('map actions explain whether a marker opens a map or shows a place note', () => {
  const region = atlas.render('R1-000', '', {authorPreview: true});
  assert.match(region, /class="atlas-pin child"[^>]*aria-label="進入子地圖：白鐘城"/);
  const city = atlas.render('C1-101', '', {authorPreview: true});
  assert.match(city, /class="atlas-pin detail"[^>]*aria-label="查看地點說明：/);
  assert.match(city, /查看說明｜/);
  assert.match(atlas.render('A1-106', '', {authorPreview: true}), /查看特殊連結圖｜彼岸鐘庭/);
});

test('map has its own view and two explicit entry buttons', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(html, /id="open-world-map"/);
  assert.match(html, /id="story-open-world-map"/);
  assert.match(html, /id="map-view"/);
  assert.match(html, /id="map-view"[\s\S]*id="story-world-map"/);
  assert.doesNotMatch(html.match(/<section id="story-view"[\s\S]*?<\/section>/)?.[0] || '', /id="story-world-map"/);
});

test('new inland and outer-shore maps follow their parent terrain', () => {
  const region = atlas.maps['R3-000'];
  assert.ok(region.points.some(point => point[0] === 'C3-304'));
  assert.ok(region.points.some(point => point[0] === 'A3-305'));
  assert.equal(atlas.maps['C3-304'].parent, 'R3-000');
  assert.match(atlas.maps['C3-304'].orientation, /盆地北緣山脊/);
  assert.match(atlas.maps['A3-305'].orientation, /白榆河與北河不得相連/);
  assert.ok(atlas.maps['C6-601'].points.some(point => point[0] === 'A6-602'));
  assert.equal(atlas.maps['A6-602'].parent, 'C6-601');
  assert.match(atlas.maps['A6-602'].note, /舊連結永久關閉/);
  for (const id of ['C3-304', 'A3-305', 'A6-602']) {
    assert.equal(atlas.maps[id].previewOnly, true);
    assert.doesNotMatch(atlas.render(id), /class="atlas-pin/);
    assert.match(atlas.render(id, '', {authorPreview: true}), /class="atlas-pin/);
  }
});

test('Far-Tide shortcut stays on world map while the regional route passes through the outer shore', () => {
  assert.match(atlas.render('W-001', '', {authorPreview: true}), /class="atlas-switch" data-map-go="S6-001"/);
  assert.doesNotMatch(atlas.render('R6-000', '', {authorPreview: true}), /data-map-go="S6-001"/);
  assert.match(atlas.render('R6-000', '#outer-shore', {authorPreview: true}), /先進入照汐城子圖/);
  assert.match(atlas.render('C6-601', '', {authorPreview: true}), /data-map-go="A6-602"/);
  assert.doesNotMatch(atlas.render('C6-601', '', {authorPreview: true}), /data-map-go="S6-001"/);
  assert.match(atlas.render('A6-602', '', {authorPreview: true}), /data-map-go="S6-001"/);
});
