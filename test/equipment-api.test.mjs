import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import net from 'node:net';import {spawn} from 'node:child_process';import {setTimeout as delay} from 'node:timers/promises';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),data=require('../src/data'),{GachaGame}=require('../src/gacha'),eq=require('../src/equipment');
test('Boss grants one server-owned drop only on rewarded victory; equipment mutations isolate accounts and concurrent/replayed upgrades charge once',{timeout:30000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'starship-equipment-api-')),listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const child=spawn(process.execPath,['serve.mjs'],{cwd:path.resolve(import.meta.dirname,'..'),env:{...process.env,DATABASE_URL:'',NODE_ENV:'production',STARSHIP_DATA_DIR:dir,STARSHIP_TEST_REWARDS:'false',STARSHIP_MAINTENANCE:'false',HOST:'127.0.0.1',PORT:String(port)},stdio:'ignore'}),url='http://127.0.0.1:'+port;
 async function post(route,body){const response=await fetch(url+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return {status:response.status,body:await response.json()};}
 try{
  for(let i=0;i<100;i++){try{await fetch(url+'/api/health');break;}catch{await delay(40);}}
  const a=(await post('/api/player/register',{name:'equipment-alice',password:'equipment-test-123'})).body,b=(await post('/api/player/register',{name:'equipment-bob',password:'equipment-test-123'})).body;
  const boss=data.bossStages[0],team=['celesia','magenta','hina','siyeon'];
  const dbPath=path.join(dir,'players.json'),db=JSON.parse(fs.readFileSync(dbPath,'utf8')),seed=db.players['equipment-alice'].state;
  for(const id of team){seed.collection[id]=1;seed.characterProgress[id]={level:90,constellation:6,breakthrough:true};}
  seed.resources.characterExp=100000;seed.bossProgress.attempts[boss.id]=data.bossMaxRewards-2;db.players['equipment-alice'].state=new GachaGame({banners:data.banners,state:seed}).getState();fs.writeFileSync(dbPath,JSON.stringify(db));
  const loss=await post('/api/player/boss-battle',{token:b.token,bossId:boss.id,team:['celesia']});assert.equal(loss.status,200);assert.equal(loss.body.battle.won,false);assert.equal(loss.body.state.equipment.items.length,0);
  const request={token:a.token,bossId:boss.id,team,rarity:5,requestId:'equipment-boss-request-001'};
  const won=await post('/api/player/boss-battle',request);assert.equal(won.status,200);assert.equal(won.body.battle.won,true);assert.equal(won.body.state.equipment.items.length,1);assert.deepEqual(won.body.battle.equipmentDrop,won.body.state.equipment.items[0]);
  assert.equal((await post('/api/player/boss-battle',request)).status,400);assert.equal((await post('/api/player/session',{token:a.token})).body.state.equipment.items.length,1);
  const second=await post('/api/player/boss-battle',{...request,requestId:'equipment-boss-request-002'});assert.equal(second.body.battle.won,true);assert.equal(second.body.state.equipment.items.length,2);
  const item=won.body.state.equipment.items[0],revision=second.body.state.equipment.revision;
  const capped=await post('/api/player/boss-battle',{token:a.token,bossId:boss.id,team});assert.equal(capped.status,400);assert.equal((await post('/api/player/session',{token:a.token})).body.state.equipment.items.length,2);
  assert.equal((await post('/api/player/equipment',{action:'equip',itemId:item.id,cardId:'celesia',expectedRevision:revision})).status,400);
  assert.equal((await post('/api/player/equipment',{token:b.token,action:'equip',itemId:item.id,cardId:'celesia',expectedRevision:0})).status,400);
  assert.equal((await post('/api/player/equipment',{token:a.token,action:'equip',itemId:item.id,cardId:'missing',expectedRevision:revision})).status,400);
  const equip=await post('/api/player/equipment',{token:a.token,action:'equip',itemId:item.id,cardId:'celesia',expectedRevision:revision,rarity:5,level:20});assert.equal(equip.status,200);assert.equal(equip.body.item.rarity,item.rarity);assert.equal(equip.body.item.level,0);
  const exp=equip.body.state.resources.characterExp,upgradeRequest={token:a.token,action:'upgrade',itemId:item.id,expectedRevision:equip.body.state.equipment.revision};
  const concurrent=await Promise.all([post('/api/player/equipment',upgradeRequest),post('/api/player/equipment',upgradeRequest)]);assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,400]);
  const saved=(await post('/api/player/login',{name:'equipment-alice',password:'equipment-test-123'})).body.state;
  assert.equal(saved.equipment.items[0].level,1);assert.equal(saved.resources.characterExp,exp-eq.cost(item));assert.equal(saved.equipment.items[0].equippedBy,'celesia');assert.equal(saved.equipment.items.length,2);
  const other=(await post('/api/player/session',{token:b.token})).body.state;assert.equal(other.equipment.items.length,0);
 }finally{child.kill();}
});
