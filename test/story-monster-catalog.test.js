const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../src/story-monster-catalog.js');

test('monster catalog keeps the village source unrevealed until the 1.1 discovery', () => {
  const early = catalog.render(false), learned = catalog.render(true);
  assert.ok(early.includes('riftspine-spawn.webp'));
  assert.ok(!early.includes('folding-shadow-beast.webp'));
  assert.ok(!early.includes('由折影獸召喚'));
  assert.ok(learned.includes('folding-shadow-beast.webp'));
  assert.ok(learned.includes('由折影獸召喚'));
  for (const entry of catalog.entries) assert.ok(fs.existsSync(path.resolve(__dirname, '..', entry.image)));
});
