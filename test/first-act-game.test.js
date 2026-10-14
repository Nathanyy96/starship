const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const game = require('../src/first-act-game.js');
const source = require('../src/story-1-0-current.js');

test('first act follows the published scene from South Post to the village', () => {
  assert.equal(source.scenes[0].id, 'signal');
  for (const place of ['南驛山谷・舊祭壇', '獸靈之村外', '獸靈之村・醫療屋']) assert.ok(source.scenes[0].body.includes(place));
  assert.deepEqual([...new Set(game.steps.map(step => step.zone))], ['valley', 'forest']);
  assert.match(game.steps[game.steps.length - 1].text, /村裡/);
});

test('all first act checkpoints have a walkable route and advance in order', () => {
  let state = game.initial();
  for (const [index, step] of game.steps.entries()) {
    assert.equal(state.index, index);
    assert.equal(state.zone, step.zone);
    const path = game.route(state);
    assert.ok(path.length, step.title);
    assert.deepEqual(path.at(-1), [step.x, step.y]);
    for (const [x, y] of path) assert.equal(game.passable(step.zone, x + .5, y + .5), true);
    state.x = step.x + .5; state.y = step.y + .5;
    const result = game.advance(state);
    assert.equal(result.title, step.title);
    state = result.state;
  }
  assert.equal(state.index, game.steps.length);
  assert.equal(game.route(state).length, 0);
  assert.equal(game.normalize(state).index, game.steps.length);
});

test('map cast uses transparent chibi sprites', () => {
  for (const source of Object.values(game.sprites)) {
    const file = path.join(__dirname, '..', source.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(file), source);
    assert.equal(fs.readFileSync(file)[25], 6, source);
  }
});

test('story menu enters the image-backed village and completes through in-game dialogue', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'player-app.js'), 'utf8');
  assert.match(html, /id="play-first-act"/);
  assert.match(html, /id="first-act-view"/);
  assert.ok(html.indexOf('src/first-act-game.js') < html.indexOf('src/player-app.js'));
  assert.match(app, /showView\("first-act-view"\); firstActGame\.open\(\)/);
  assert.match(app, /showVillageExploration\(true\)/);
  assert.match(app, /exploration\.enterStory\(\)/);
  assert.match(html, /id="first-act-dialog-next"/);
  assert.match(html, /id="exploration-dialog-next"/);
  assert.doesNotMatch(html, /閱讀完整第一幕正文/);
  assert.equal(game.scenes.length, game.steps.length);
  assert.ok(game.scenes.every(scene => scene.length >= 3));
});

test('map conversations retain the complete published first act in order', () => {
  const dialogue = require('../src/first-act-scenes.js');
  const body = require('../src/story-1-0-current.js').scenes[0].body;
  assert.equal(dialogue.approach.length, 9);
  assert.equal(dialogue.village.length, 2);
  assert.equal(dialogue.all.flat().map(line => line[1]).join('').replace(/\s/g, ''), body.replace(/\s/g, ''));
  assert.ok(dialogue.all.flat().some(line => line[0] === '伊薩爾'));
});
