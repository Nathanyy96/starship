(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipExplorationRenderer = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function begin(canvas, ctx, worldWidth, worldHeight, x, y) {
    var rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
    var cssWidth = rect && rect.width > 0 ? rect.width : canvas._cssWidth || 960;
    var cssHeight = rect && rect.height > 0 ? rect.height : canvas._cssHeight || 576;
    canvas._cssWidth = cssWidth; canvas._cssHeight = cssHeight;
    var ratio = Math.min(2, typeof window !== "undefined" && window.devicePixelRatio || 1);
    var width = Math.round(cssWidth * ratio), height = Math.round(cssHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    var zoom = cssWidth < 600 ? .84 : 1.05;
    var viewWidth = cssWidth / zoom, viewHeight = cssHeight / zoom;
    var cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewWidth), x - viewWidth / 2));
    var cameraY = Math.max(0, Math.min(Math.max(0, worldHeight - viewHeight), y - viewHeight / 2));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.setTransform(ratio * zoom, 0, 0, ratio * zoom, -cameraX * ratio * zoom, -cameraY * ratio * zoom);
    return { x: cameraX, y: cameraY, width: viewWidth, height: viewHeight, ratio: ratio, zoom: zoom };
  }
  function end(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); }
  function sprite(ctx, img, x, y, height, flip, bob) {
    if (!img) return false;
    var width = height * img.naturalWidth / img.naturalHeight;
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -width / 2, -height + 9 + (bob || 0), width, height); ctx.restore(); return true;
  }
  return { begin: begin, end: end, sprite: sprite };
}));
