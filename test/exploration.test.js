const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const world = require('../src/exploration.js');

test('village story plays through character dialogue and narration', () => {
  assert.equal(world.storyScenes.length, world.storyGoals.length);
  for (const scene of world.storyScenes) {
    assert.ok(scene.length >= 3);
    assert.ok(scene.every(line => line.length === 2 && line[0] && line[1]));
  }
});

test('village world uses the existing image and transparent Q-version cast', () => {
  assert.ok(fs.existsSync(path.join(__dirname, '..', world.mapImage.replace(/^\.\//, ''))));
  for (const source of Object.values(world.spriteSources)) {
    const file = path.join(__dirname, '..', source.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(file), source);
    assert.equal(fs.readFileSync(file)[25], 6, `${source} must be RGBA PNG`);
  }
});

test('roads and bridges are walkable while scenery and water block movement', () => {
  const state = world.initial();
  assert.equal(world.passable(state.x, state.y), true);
  for (const site of [...world.sites, ...world.storyGoals]) assert.equal(world.passable(site.x, site.y), true, site.id);
  for (const point of [[900,800], [700,90], [1370,350], [832,395]]) assert.equal(world.passable(...point), false, point.join(','));
  const atWater = world.move({ ...state, x: 704, y: 655 }, 200, 200);
  assert.notDeepEqual([atWater.x, atWater.y], [904,855]);
});

test('every optional and main-story target has a traversable route from the entrance', () => {
  const state = world.initial();
  for (const target of [...world.sites, ...world.storyGoals]) {
    const route = world.route(state, target);
    assert.ok(route.length > 0, target.id);
    assert.equal(world.passable(route.at(-1).x, route.at(-1).y), true, target.id);
    for (const point of route) assert.equal(world.passable(point.x, point.y), true);
  }
});

test('free exploration and first-act objectives progress independently', () => {
  const free = world.initial();
  assert.equal(world.objective(free).id, 'fire');
  const optional = world.interact({ ...free, x: 841, y: 453 });
  assert.equal(optional.state.discovered.includes('fire'), true);
  assert.equal(optional.state.storyStep, 0);
  const arrived = { ...free, arrived: true, x: 1335, y: 467 };
  assert.equal(world.objective(arrived).id, 'isar');
  const first = world.interact(arrived);
  assert.equal(first.state.storyStep, 1);
  assert.equal(first.state.discovered.length, 0);
  const second = world.interact({ ...first.state, x: 1405, y: 479 });
  assert.equal(second.state.storyStep, 2);
  assert.equal(world.objective(second.state), null);
  assert.equal(world.normalize({ x: 19.5, y: 15.5 }).mapVersion, 2);
});
