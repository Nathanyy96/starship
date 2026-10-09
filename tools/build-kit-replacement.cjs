// Converts the reviewed character-kit table into browser/CommonJS metadata.
// Runtime behavior lives in src/battle.js; this keeps displayed text in sync.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'character-kit-replacement-spec-20261009.md'), 'utf8');
const names = {
  '瑟蕾雅':'celesia','雷恩':'reyn','莉亞':'lia','伊薩爾':'isar',
  'Chodan':'chodan','Magenta':'magenta','Hina':'hina','Siyeon':'siyeon',
  '岑霧':'cenwu','芮妲':'ruida','榆安':'yuan','薇珂':'veyra',
  '赫洛':'harlow','蕾娜':'rena','艾洛娜':'elorna','艾妲':'eda',
  '梅芙':'mave','羅薇恩':'rovienne','璃珊':'risan','曜澤':'yaoze',
  '瑪洛':'maro','伊芙琳':'evelyn','澪歌':'mirea','菲芮':'ferye',
  '諾芮亞':'noreia','奧薇拉':'orivelle','洛恩':'lorne'
};
const rows = {};
for (const line of source.split(/\r?\n/)) {
  if (!line.startsWith('| ')) continue;
  const fields = line.split('|').slice(1, -1).map(s => s.trim());
  if (fields.length !== 3) continue;
  const name = fields[0].replace(/（.*$/, '');
  const id = names[name];
  if (!id) continue;
  const constellationText = /C1[： ]/.test(fields[2]) ? fields[2] : /C1[： ]/.test(fields[1]) ? fields[1] : null;
  if (!constellationText) continue;
  const constellation = [];
  for (let n = 1; n <= 6; n++) {
    const match = constellationText.match(new RegExp(`C${n}[： ]([\\s\\S]*?)(?=；C${n+1}[： ]|$)`));
    if (!match) throw Error(`${name} C${n} missing`);
    constellation.push(`C${n} ${match[1].trim().replace(/[。；]+$/, '')}。`);
  }
  rows[id] = { skillEffect: fields[1].replace(/^C0[： ]/, '').split(/ C1[： ]/)[0], constellations: constellation };
}
if (Object.keys(rows).length !== 27) throw Error(`Expected 27 kits, found ${Object.keys(rows).length}`);
const out = '(function(root,factory){if(typeof module === "object" && module.exports) module.exports=factory(); else root.StarshipReplacementKits=factory();}(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";return Object.freeze(' + JSON.stringify(rows, null, 2) + ');}));\n';
fs.writeFileSync(path.join(root, 'src', 'replacement-kits.js'), out);
console.log(`Wrote ${Object.keys(rows).length} replacement kits`);
