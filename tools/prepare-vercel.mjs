import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

// Explicit public allowlist: never publish the repository root, backup tools,
// credentials, player files, tests, or project documents.
const root = path.resolve(import.meta.dirname, '..');
const output = path.join(root, 'public');
fs.mkdirSync(output, { recursive: true });
for (const name of fs.readdirSync(root)) {
  if (name === 'index.html' || name === 'admin.html' || name.endsWith('.css')) {
    fs.copyFileSync(path.join(root, name), path.join(output, name));
  }
}
for (const name of ['src', 'assets']) {
  fs.cpSync(path.join(root, name), path.join(output, name), {
    recursive: true,
    filter: source => !source.includes(`${path.sep}labeled-png`) && !source.includes(`${path.sep}generated`)
  });
}
const require = createRequire(import.meta.url);
const release = require('../src/release-config.js');
fs.writeFileSync(path.join(output, 'src/release-config.js'),
  'globalThis.StarshipReleaseConfig = ' + JSON.stringify(release) + ';\n');
console.log('Prepared public game files; private files excluded.');
