import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';

test('static server protects configured storage and hidden paths and survives malformed URLs',async()=>{
 const root=path.resolve(import.meta.dirname,'..');
 // Only generated synthetic fixtures; never inspect actual player storage.
 const dir=fs.mkdtempSync(path.join(root,'static-boundary-fixture-'));
 fs.writeFileSync(path.join(dir,'synthetic-marker.txt'),'synthetic-only');
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));
 const port=listener.address().port;await new Promise(r=>listener.close(r));
 const child=spawn(process.execPath,['serve.mjs'],{cwd:root,env:{...process.env,DATABASE_URL:'',NODE_ENV:'production',STARSHIP_DATA_DIR:dir,HOST:'127.0.0.1',PORT:String(port)},stdio:'ignore'});
 const url='http://127.0.0.1:'+port;
 try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch(url+'/api/health')).ok){ready=true;break;}}catch{}await delay(30);}assert.ok(ready);
  const storage='/'+path.basename(dir)+'/synthetic-marker.txt';
  assert.equal((await fetch(url+storage)).status,403);
  assert.equal((await fetch(url+storage.replaceAll('/', '/%2F'))).status,403);
  if(process.platform==='win32')assert.equal((await fetch(url+storage.toUpperCase())).status,403);
  assert.equal((await fetch(url+'/.git',{method:'HEAD'})).status,403);
  assert.equal((await fetch(url+'/%E0%A4%A')).status,400);
  assert.equal((await fetch(url+'/%00')).status,400);
  assert.equal((await fetch(url+'/')).status,200);
  assert.equal((await fetch(url+'/src/data.js')).status,200);
 }finally{
  if(child.exitCode===null){const exited=new Promise(r=>child.once('exit',r));child.kill();await exited;}
  assert.equal(path.dirname(dir),root);fs.rmSync(dir,{recursive:true,force:true});
 }
});
