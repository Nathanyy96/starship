import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

// Lossy delivery encoding only: no repainting, cropping or background removal.
// Originals remain in the authoring workspace; no expiring Google URLs are shipped.
const root = path.resolve(import.meta.dirname, '..');
const input = path.resolve(process.argv[2] || path.join(root, '../../art-production-20261103'));
const require = createRequire(import.meta.url);
const sharp = process.env.STARSHIP_SHARP_MODULE ? require(process.env.STARSHIP_SHARP_MODULE) : require('sharp');
const manifest = JSON.parse(fs.readFileSync(path.join(input, 'delivery-manifest.json')));
const names = ['celesia','skin-celesia-fluffy-white-cat','reyn','lia','isar','chodan','skin-chodan-qwer','magenta','skin-magenta-qwer','hina','skin-hina-qwer','siyeon','skin-siyeon-qwer','veyra','harlow','rena','elorna','skin-elorna-purple-jellyfish','skin-elorna-jellyfish-gown','elorna-deepwater','eda','mave','seifra','kailin','noyas','oun','mila','vark','cenwu','ruida','yuan','rovienne','musa','dori','kerida','wenlan','risan','yaoze','maro','lifan','evelyn','mirea','weina','ferye','noreia','orivelle'];
const base = './assets/portraits/standing-20261103/';
const out = path.join(root, 'assets/portraits/standing-20261103');
fs.mkdirSync(out, {recursive:true});
const entries=[];
for (const m of manifest) {
  const source=fs.readFileSync(path.join(input,m.file));
  if(crypto.createHash('sha256').update(source).digest('hex')!==m.sha256) throw Error('Source mismatch: '+m.n);
  const id=names[m.n-1];
  if(!id) throw Error('Unmapped source');
  const output=await sharp(source).webp({quality:90,effort:6}).toBuffer();
  const meta=await sharp(output).metadata();
  fs.writeFileSync(path.join(out,id+'.webp'),output);
  entries.push({id,name:m.name,kind:id.startsWith('skin-')?'skin':id==='elorna-deepwater'?'form':m.classification==='卡池角色'?'character':'story',tab:m.n<=36?'t.fovl70njf1oy':'t.h5vfauv9xzbl',image:base+id+'.webp',sourceSha256:m.sha256,sha256:crypto.createHash('sha256').update(output).digest('hex'),width:meta.width,height:meta.height,bytes:output.length});
}
const js='(function(root,factory){if(typeof module==="object"&&module.exports)module.exports=factory();else root.StarshipCharacterAtlas=factory();})(typeof globalThis!=="undefined"?globalThis:this,function(){"use strict";\nvar entries='+JSON.stringify(entries,null,2)+';\nvar byId={};entries.forEach(function(e){byId[e.id]=Object.freeze(e);});return Object.freeze({version:"standing-20261103",documentId:"1OqnMurq_c4ZkMeHR57VNe6X8rtQRdxHApUcrHG4F8uE",entries:Object.freeze(entries),byId:Object.freeze(byId)});\n});\n';
fs.writeFileSync(path.join(root,'src/character-atlas.js'),js);
console.log(JSON.stringify({count:entries.length,bytes:entries.reduce((n,e)=>n+e.bytes,0),maxBytes:Math.max(...entries.map(e=>e.bytes))}));
