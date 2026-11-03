import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import net from 'node:net';import {spawn} from 'node:child_process';import {setTimeout as delay} from 'node:timers/promises';
test('pet API authenticates, isolates saves, rejects concurrent spend replay and persists real draws and bindings',{timeout:30000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'starship-pet-api-')),listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const child=spawn(process.execPath,['serve.mjs'],{cwd:path.resolve(import.meta.dirname,'..'),env:{...process.env,DATABASE_URL:'',NODE_ENV:'production',STARSHIP_DATA_DIR:dir,STARSHIP_TEST_REWARDS:'false',STARSHIP_MAINTENANCE:'false',HOST:'127.0.0.1',PORT:String(port)},stdio:'ignore'}),url='http://127.0.0.1:'+port;
 async function post(route,body){const response=await fetch(url+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};}
 const route='/api/player/pet-summon';
 try{
  for(let i=0;i<100;i++){try{await fetch(url+'/api/health');break;}catch{await delay(40);}}
  const a=(await post('/api/player/register',{name:'pet-alice',password:'pet-test-123'})).body,b=(await post('/api/player/register',{name:'pet-bob',password:'pet-test-123'})).body;
  const request={token:a.token,bannerId:'legacy-pets-1',action:'draw',count:1,expectedRevision:0,petId:'cloud-whale',rarity:5,rank:5,results:[{petId:'cloud-whale'}]};
  assert.equal((await post(route,{...request,token:undefined})).status,400);
  const old=a.state,draws=await Promise.all([post(route,request),post(route,request)]);assert.deepEqual(draws.map(r=>r.status).sort(),[200,400]);
  let state=draws.find(r=>r.status===200).body.state;assert.equal(state.resources.starSand,old.resources.starSand-120);assert.equal(state.petSummon.totalPulls,1);assert.equal(state.petSummon.history.length,1);assert.deepEqual(state.pity,old.pity);assert.deepEqual(state.history,old.history);
  assert.ok(Object.values(state.petSummon.ranks).every(r=>r===1));
  assert.equal((await post(route,{...request,action:'assign',petId:'star-fox',cardId:'fake',expectedRevision:1})).status,400);
  const assigned=await post(route,{...request,action:'assign',petId:'star-fox',cardId:'celesia',expectedRevision:1});assert.equal(assigned.status,200);assert.equal(assigned.body.state.petSummon.assignments['star-fox'],'celesia');
  const ten=await post(route,{...request,count:10,expectedRevision:2});assert.equal(ten.status,200);assert.equal(ten.body.results.length,10);assert.equal(ten.body.cost,1200);state=ten.body.state;
  const saved=(await post('/api/player/login',{name:'pet-alice',password:'pet-test-123'})).body.state;assert.deepEqual(saved.petSummon,state.petSummon);assert.deepEqual(saved.petProgress,state.petProgress);assert.equal(saved.resources.starSand,old.resources.starSand-1320);
  const other=(await post('/api/player/session',{token:b.token})).body.state;assert.equal(other.petSummon.totalPulls,0);assert.deepEqual(other.petSummon.assignments,{});assert.equal(other.resources.starSand,b.state.resources.starSand);
  const disk=JSON.parse(fs.readFileSync(path.join(dir,'players.json'),'utf8'));assert.deepEqual(disk.players['pet-alice'].state.petSummon,saved.petSummon);
 }finally{child.kill();}
});
