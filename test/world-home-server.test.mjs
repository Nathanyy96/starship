import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import net from 'node:net';import {spawn} from 'node:child_process';import {setTimeout as delay} from 'node:timers/promises';
test('authenticated world position saves isolate accounts, reject obstacles and ignore stale writes',async()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'starship-home-api-')),listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const server=spawn(process.execPath,['serve.mjs'],{cwd:path.resolve(import.meta.dirname,'..'),env:{...process.env,DATABASE_URL:'',STARSHIP_DATA_DIR:directory,PORT:String(port),HOST:'127.0.0.1'},stdio:'ignore'}),url='http://127.0.0.1:'+port;
 async function post(route,body){const res=await fetch(url+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return {status:res.status,body:await res.json()};}
 try{for(let i=0;i<100;i++){try{await fetch(url+'/api/health');break;}catch{await delay(50);}}
 const alice=(await post('/api/player/register',{name:'world-alice',password:'home-api-123'})).body,bob=(await post('/api/player/register',{name:'world-bob',password:'home-api-123'})).body;
 const position={version:1,kind:'world',state:{map:'city',x:3454,y:858,roaming:true}};
 assert.notEqual((await post('/api/player/world-position',{position})).status,200);
 assert.equal((await post('/api/player/world-position',{token:alice.token,position,sequence:2})).status,200);
 const stale={version:1,kind:'opening',state:{zone:'valley',index:0,x:10.5,y:8.5}};
 assert.equal((await post('/api/player/world-position',{token:alice.token,position:stale,sequence:1})).body.position.state.map,'city');
 assert.equal((await post('/api/player/world-position',{token:alice.token,position:{...position,state:{...position.state,x:680,y:1460}},sequence:3})).status,400);
 const session=(await post('/api/player/session',{token:alice.token})).body;
 assert.deepEqual(session.state.resources,alice.state.resources);assert.deepEqual(session.state.collection,alice.state.collection);assert.equal(session.state.worldPosition.state.map,'city');
 assert.equal((await post('/api/player/session',{token:bob.token})).body.state.worldPosition,null);
 const login=(await post('/api/player/login',{name:'world-alice',password:'home-api-123'})).body;assert.equal(login.state.worldPosition.state.map,'city');
 assert.equal(JSON.parse(fs.readFileSync(path.join(directory,'players.json'),'utf8')).players['world-alice'].state.worldPosition.state.map,'city');
 }finally{server.kill();}
});
