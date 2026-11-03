'use strict';
const fs=require('node:fs'),crypto=require('node:crypto'),battle=require('../src/battle');
function version(){const h=crypto.createHash('sha256');for(const file of fs.readdirSync(require('node:path').join(__dirname,'../src')).filter(f=>f.endsWith('.js')).sort()){h.update(file);h.update(fs.readFileSync(require('node:path').join(__dirname,'../src',file)));}return h.digest('hex');}
function rng(seed){if(!Number.isInteger(seed)||seed<0||seed>4294967295)throw Error('Invalid seed');let x=seed;return ()=>{x=(x+0x6d2b79f5)>>>0;let t=Math.imul(x^(x>>>15),1|x);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296;};}
function record(options,seed){const input=JSON.parse(JSON.stringify(options));return {schema:1,version:version(),seed,input,result:battle.simulateBattle({...input,rng:rng(seed)})};}
function replay(r){if(r.schema!==1||r.version!==version())throw Error('Version mismatch');const result=battle.simulateBattle({...JSON.parse(JSON.stringify(r.input)),rng:rng(r.seed)});if(JSON.stringify(result)!==JSON.stringify(r.result))throw Error('Result mismatch');return result;}
module.exports={record,replay};
