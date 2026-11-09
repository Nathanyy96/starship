import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import os from 'node:os';import net from 'node:net';import {spawn} from 'node:child_process';import {setTimeout as delay} from 'node:timers/promises';import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),data=require('../src/data'),{GachaGame}=require('../src/gacha');
test('ascension API isolates accounts, charges concurrent requests once, grants real pull overflow and retains stars on login',{timeout:30000},async()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'starship-star-api-')),listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const child=spawn(process.execPath,['serve.mjs'],{cwd:path.resolve(import.meta.dirname,'..'),env:{...process.env,DATABASE_URL:'',NODE_ENV:'production',STARSHIP_DATA_DIR:dir,STARSHIP_TEST_REWARDS:'false',STARSHIP_MAINTENANCE:'false',HOST:'127.0.0.1',PORT:String(port)},stdio:'ignore'}),url='http://127.0.0.1:'+port;
 async function post(route,body){const r=await fetch(url+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return {status:r.status,body:await r.json()};}
 try{
  for(let i=0;i<100;i++){try{await fetch(url+'/api/health');break;}catch{await delay(40);}}
  const a=(await post('/api/player/register',{name:'star-alice',password:'star-test-123'})).body,b=(await post('/api/player/register',{name:'star-bob',password:'star-test-123'})).body;
  const p=path.join(dir,'players.json'),db=JSON.parse(fs.readFileSync(p)),fixture=db.players['star-alice'].state;fixture.collection.isar=1;fixture.collection.veyra=7;fixture.resources.starSand=10000;fixture.resources.characterExp=1000000;fixture.characterProgress.celesia={level:90,breakthrough:true};
  fixture.starAscension={version:1,revision:0,marks:{lower:3,upper:0},characters:{}};fixture.pity.limited={pullsSince4Star:69,guaranteedFeatured:true};fixture.selectedFeatured['limited-1-2']='veyra';db.players['star-alice'].state=new GachaGame({banners:data.banners,state:fixture}).getState();fs.writeFileSync(p,JSON.stringify(db));
  const route='/api/player/star-ascension',request={token:a.token,cardId:'celesia',expectedRevision:0,stars:6,cost:0,marks:{upper:999}};
  assert.equal((await post(route,{...request,token:undefined})).status,400);assert.equal((await post(route,{...request,token:b.token})).status,400);
  const pair=await Promise.all([post(route,request),post(route,request)]);assert.deepEqual(pair.map(r=>r.status).sort(),[200,400]);const won=pair.find(r=>r.status===200).body;assert.equal(won.stars,5);assert.equal(won.cost,2);assert.equal(won.state.starAscension.marks.lower,1);
  const fiveLevel=await post('/api/player/character-development',{token:a.token,cardId:'celesia',bulk:true});assert.equal(fiveLevel.status,200);assert.equal(fiveLevel.body.state.characterProgress.celesia.level,95);assert.equal((await post('/api/player/character-development',{token:a.token,cardId:'celesia'})).status,400);
  const draw=await post('/api/player/pull',{token:a.token,bannerId:'limited-1-2',count:1,payment:'starSand'});assert.equal(draw.status,200);assert.equal(draw.body.results[0].card.id,'veyra');assert.deepEqual(draw.body.results[0].duplicateReward.ascensionMark,{key:'upper',amount:1});assert.equal(draw.body.state.starAscension.marks.upper,1);assert.equal(draw.body.state.starAscension.characters.celesia,5);
  assert.equal((await post(route,{...request,expectedRevision:1})).status,400);
  const six=await post(route,{...request,expectedRevision:draw.body.state.starAscension.revision});assert.equal(six.status,200);assert.equal(six.body.stars,6);assert.equal(six.body.cost,1);assert.equal(six.body.state.starAscension.marks.upper,0);
  const sixLevel=await post('/api/player/character-development',{token:a.token,cardId:'celesia',bulk:true});assert.equal(sixLevel.status,200);assert.equal(sixLevel.body.state.characterProgress.celesia.level,100);assert.equal((await post('/api/player/character-development',{token:a.token,cardId:'celesia'})).status,400);
  const isar=await post(route,{token:a.token,cardId:'isar',expectedRevision:six.body.state.starAscension.revision});assert.equal(isar.status,200);assert.equal(isar.body.stars,4);assert.equal(isar.body.state.starAscension.marks.lower,0);
  assert.equal((await post(route,{token:a.token,cardId:'isar',expectedRevision:isar.body.state.starAscension.revision})).status,400);
  const saved=(await post('/api/player/login',{name:'star-alice',password:'star-test-123'})).body.state;assert.deepEqual(saved.starAscension,isar.body.state.starAscension);assert.equal(saved.collection.celesia,1);assert.equal(saved.characterProgress.celesia.level,100);assert.equal(saved.characterProgress.celesia.constellation,0);assert.equal(saved.collection.veyra,8);assert.equal(saved.characterProgress.veyra.constellation,6);
  const other=(await post('/api/player/session',{token:b.token})).body.state;assert.equal(other.starAscension.marks.upper,0);assert.deepEqual(other.starAscension.characters,{});
  assert.deepEqual(JSON.parse(fs.readFileSync(p)).players['star-alice'].state.starAscension,saved.starAscension);
 }finally{child.kill();}
});

