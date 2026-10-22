import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import data from '../src/data.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('voyage resumes after login, rejects duplicate/stale nodes, completes all routes, and rewards once',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'starship-voyage-continuation-'));
  const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
  const server=spawn(process.execPath,['serve.mjs'],{cwd:root,env:{...process.env,DATABASE_URL:'',PORT:String(port),HOST:'127.0.0.1',STARSHIP_DATA_DIR:dir,NODE_ENV:'test'},stdio:'ignore'});
  const base='http://127.0.0.1:'+port;
  const post=async(endpoint,body)=>{const r=await fetch(base+endpoint,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});return {status:r.status,...await r.json()};};
  try{
    for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
    const reg=await post('/api/player/register',{name:'VoyageContinuationQA',password:'isolated-test-password'});assert.equal(reg.status,200);
    const file=path.join(dir,'players.json'),db=JSON.parse(fs.readFileSync(file));
    const team=['magenta','siyeon','chodan','hina'];
    const record=Object.values(db.players)[0];
    for(const id of team){record.state.collection[id]=1;record.state.characterProgress[id]={level:90,constellation:6};}
    fs.writeFileSync(file,JSON.stringify(db));
    let token=reg.token;
    const act=body=>post('/api/player/voyage',{token,team,...body});
    let firstReward;
    for(const route of data.voyageConfig.routes.concat([data.voyageConfig.routes[0]])){
      let r=await act({action:'select-route',routeId:route.id});assert.equal(r.status,200);
      r=await act({action:'start',routeId:route.id});assert.equal(r.status,200);assert.equal(r.state.voyageProgress.nodeIndex,0);
      const duplicates=await Promise.all([1,2].map(()=>act({action:'resolve',nodeId:'voyage-start'})));
      assert.deepEqual(duplicates.map(x=>x.status).sort(),[200,400]);
      r=duplicates.find(x=>x.status===200);assert.equal(r.state.voyageProgress.nodeIndex,1);
      const login=await post('/api/player/login',{name:'VoyageContinuationQA',password:'isolated-test-password'});assert.equal(login.status,200);token=login.token;
      assert.equal(login.state.voyageProgress.nodeIndex,1);assert.equal(login.state.voyageProgress.routeId,route.id);
      for(const nodeId of route.nodeIds.slice(1)){
        const node=data.voyageConfig.nodes.find(n=>n.id===nodeId);
        const choice=({'voyage-harmonics':'listen','voyage-rest':'anchor','voyage-market':'pass-market','voyage-signal':'follow','voyage-archive':'read','voyage-secret-gate':'open'})[nodeId];
        r=await act({action:'resolve',nodeId,choice});assert.equal(r.status,200,nodeId);
        if(node.type==='combat'||node.type==='boss')assert.equal(r.battle.won,true,nodeId);
      }
      assert.equal(r.state.voyageProgress.status,'complete');
      if(!firstReward)firstReward=r.ending;
      else if(route.id==='route-echo')assert.equal(r.ending.alreadyClaimed,true);
      assert.equal((await act({action:'resolve',nodeId:'voyage-final'})).status,400);
    }
    assert.equal(firstReward.alreadyClaimed,false);
  }finally{const exited=new Promise(r=>server.once('exit',r));server.kill();await exited;fs.rmSync(dir,{recursive:true,force:true});}
});
