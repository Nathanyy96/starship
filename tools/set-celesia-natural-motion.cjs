const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '..', 'src', 'character-motion-manifest.js');
const manifest = require(file);
manifest.celesia.src = './assets/exploration/motion/celesia-walk-natural-v1.png';
manifest.celesia.bodyHeight = 0.25;
manifest.celesia.displayScale = 1.55;
manifest.celesia.frames = Array.from({ length: 16 }, (_, index) => [
  (index % 4) / 4, Math.floor(index / 4) / 4, 0.25, 0.25
]);
const source = '(function(root){var manifest=' + JSON.stringify(manifest) + ';' +
  'if(typeof module==="object"&&module.exports)module.exports=manifest;' +
  'root.StarshipCharacterMotionManifest=manifest;' +
  '}(typeof globalThis!=="undefined"?globalThis:this));\n';
fs.writeFileSync(file, source);
