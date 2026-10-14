const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function harness() {
  const context = vm.createContext({ window: { addEventListener() {} }, Image: class {}, HTMLInputElement: class {}, performance: { now: () => 0 }, requestAnimationFrame: () => 1, cancelAnimationFrame() {} });
  for (const file of ['story-1-0-current', 'first-act-scenes', 'exploration-renderer', 'exploration', 'first-act-game']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', file + '.js'), 'utf8'), context);
  }
  function element() {
    const handlers = {};
    return { hidden: false, textContent: '', addEventListener(event, callback) { handlers[event] = callback; }, click() { handlers.click?.({}); }, focus() {}, querySelectorAll: () => [] };
  }
  const canvas = element(); canvas.width = 960; canvas.height = 576;
  canvas.getContext = () => new Proxy({}, { get: () => () => {}, set: () => true });
  const options = { canvas, load: () => null, save() {} };
  for (const name of ['panel', 'status', 'position', 'discoveries', 'objective', 'distance', 'interact', 'reset', 'read', 'pad', 'dialog', 'dialogTitle', 'dialogText', 'dialogNext', 'zone', 'enter']) options[name] = element();
  return { context, options };
}

test('village story commits only after its last dialogue line and completes in the map', () => {
  const { context, options } = harness(), world = context.StarshipExploration;
  let saved = { ...world.initial(), arrived: true, x: world.storyGoals[0].x, y: world.storyGoals[0].y }, completed = 0;
  options.load = () => saved; options.save = state => { saved = { ...state }; };
  options.onStoryComplete = () => completed++;
  const controller = world.create(options);
  options.interact.click();
  assert.equal(options.dialog.hidden, false);
  assert.equal(controller.state().storyStep, 0);
  assert.equal(options.interact.hidden, true);
  for (let n = 0; n < world.storyScenes[0].length - 1; n++) options.dialogNext.click();
  assert.equal(controller.state().storyStep, 0);
  options.dialogNext.click();
  assert.equal(controller.state().storyStep, 1);
  assert.equal(completed, 0);
  saved.x = world.storyGoals[1].x; saved.y = world.storyGoals[1].y; controller.reload();
  options.interact.click();
  for (const line of world.storyScenes[1]) options.dialogNext.click();
  assert.equal(controller.state().storyStep, 2);
  assert.equal(completed, 1);
  assert.equal(options.dialog.hidden, true);
});

test('first-act destination requires proximity and finishes after the last line', () => {
  const { context, options } = harness(), game = context.StarshipFirstActGame;
  let saved = game.initial(); options.load = () => saved; options.save = state => { saved = { ...state }; };
  const controller = game.create(options);
  assert.equal(options.interact.hidden, true);
  options.interact.click(); assert.equal(controller.state().index, 0);
  saved = { ...saved, x: game.steps[0].x + .5, y: game.steps[0].y + .5 };
  controller.open(); options.interact.click();
  assert.equal(controller.state().index, 0);
  for (const line of game.scenes[0]) options.dialogNext.click();
  assert.equal(controller.state().index, 1);
  assert.equal(options.dialog.hidden, true);
});
