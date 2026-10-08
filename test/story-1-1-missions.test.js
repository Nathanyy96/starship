const test = require('node:test');
const assert = require('node:assert/strict');
const missions = require('../src/story-1-1-missions.js');

test('five-act rescue sequence retains confirmed facts on retries', () => {
  let progress = missions.normalize();
  assert.equal(missions.acts.length, 5);
  assert.deepEqual(missions.acts.map(act => act.steps.length), [2, 2, 3, 3, 2]);
  for (const [actIndex, act] of missions.acts.entries()) {
    for (const [stepIndex, step] of act.steps.entries()) {
      const wrong = (step.answer + 1) % step.choices.length;
      const rejected = missions.advance(progress, wrong);
      assert.equal(rejected.correct, false);
      assert.equal(rejected.progress.act, actIndex);
      assert.equal(rejected.progress.step, stepIndex);
      assert.deepEqual(rejected.progress.facts, progress.facts);
      const accepted = missions.advance(rejected.progress, step.answer);
      assert.equal(accepted.correct, true);
      progress = accepted.progress;
    }
  }
  assert.equal(progress.act, 5);
  assert.equal(progress.facts.length, 12);
  assert.match(progress.facts.join(' '), /車身與部分樂器留在遠岸/);
  assert.match(progress.facts.join(' '), /1.2 踏查留待完整驛報/);
  assert.equal(missions.advance(progress, 0).progress.act, 5);
});
