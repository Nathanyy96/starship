const test = require('node:test');
const assert = require('node:assert/strict');
const renderer = require('../src/exploration-renderer.js');
test('mobile camera keeps the character readable and renders at device resolution', () => {
  const old = global.window; global.window = { devicePixelRatio:2 };
  try {
    const canvas = { width:960, height:576, getBoundingClientRect:()=>({width:320,height:400}) };
    const transforms = [], ctx = { setTransform(...args){transforms.push(args);}, clearRect(){} };
    const view = renderer.begin(canvas,ctx,1152,768,500,500);
    assert.equal(canvas.width,640); assert.equal(canvas.height,800);
    assert.ok(view.width < 400);
    assert.ok(104*view.zoom >= 80);
    assert.equal(ctx.imageSmoothingEnabled,true);
    assert.equal(ctx.imageSmoothingQuality,'high');
    assert.equal(transforms.at(-1)[0],2*.84);
  } finally { global.window=old; }
});
test('camera and sprite feet stay inside the scene when close to an edge', () => {
  const canvas={width:960,height:576},ctx={setTransform(){},clearRect(){}};
  const view=renderer.begin(canvas,ctx,1152,768,1152,768);
  assert.ok(view.x>=0 && view.x+view.width<=1152);
  assert.ok(view.y>=0 && view.y+view.height<=768);
});
