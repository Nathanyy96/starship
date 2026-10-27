import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {spawn} from 'node:child_process';
import net from 'node:net';
import crypto from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

test('Postgres sessions survive another instance and restart; concurrent saves and sequences remain durable', {
  skip: !process.env.STARSHIP_TEST_DATABASE_URL, timeout: 90000
}, async () => {
  const require = createRequire(import.meta.url);
  const {Pool}=require('pg');
  const schema='vercel_test_'+crypto.randomBytes(8).toString('hex');
  const pool=new Pool({connectionString:process.env.STARSHIP_TEST_DATABASE_URL,max:1});
  const url=new URL(process.env.STARSHIP_TEST_DATABASE_URL);
  url.searchParams.set('options','-c search_path='+schema);
  const children=[];
  async function launch() {
    const listener=net.createServer();
    await new Promise(r=>listener.listen(0,'127.0.0.1',r));
    const port=listener.address().port;
    await new Promise(r=>listener.close(r));
    const child=spawn(process.execPath,['serve.mjs'],{
      cwd:new URL('..',import.meta.url),
      env:{...process.env,VERCEL:'',DATABASE_URL:url.toString(),NODE_ENV:'production',PORT:String(port),HOST:'127.0.0.1'},stdio:'ignore'
    });
    children.push(child);
    const origin='http://127.0.0.1:'+port;
    for(let i=0;i<200;i++) {
      try {if((await fetch(origin+'/api/health')).ok)return {child,origin};} catch {}
      await delay(100);
    }
    throw Error('Isolated server did not become healthy');
  }
  async function post(server,route,body) {
    const response=await fetch(server.origin+'/api/player/'+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
    const json=await response.json();
    assert.equal(response.status,200,JSON.stringify(json));
    return json;
  }
  try {
    await pool.query('CREATE SCHEMA '+schema);
    const a=await launch(),b=await launch();
    const account=await post(a,'register',{name:'isolated-vercel',password:'isolated-vercel-123'});
    assert.ok(account.token);
    const token=account.token;
    assert.deepEqual((await post(b,'session',{token})).state.resources,account.state.resources);
    const position={version:1,kind:'world',state:{map:'city',x:3454,y:858,roaming:true}};
    await post(a,'world-position',{token,position,sequence:2});
    const stale={version:1,kind:'opening',state:{zone:'valley',index:0,x:10.5,y:8.5}};
    assert.equal((await post(b,'world-position',{token,position:stale,sequence:1})).position.state.map,'city');
    await Promise.all([
      post(a,'world-waypoints',{token,waypoints:['city-plaza']}),
      post(b,'world-waypoints',{token,waypoints:['village-anchor']})
    ]);
    const exited=new Promise(r=>b.child.once('exit',r));b.child.kill();await exited;
    const c=await launch();
    const resumed=await post(c,'session',{token});
    assert.equal(resumed.state.worldPosition.state.map,'city');
    assert.deepEqual(resumed.state.worldWaypoints.slice().sort(),['city-plaza','village-anchor']);
    assert.deepEqual(resumed.state.resources,account.state.resources);
    const raw=await pool.query('SELECT token_hash FROM '+schema+'.starship_sessions');
    assert.equal(raw.rows.length,1);
    assert.notEqual(raw.rows[0].token_hash,token);
  } finally {
    await Promise.all(children.filter(c=>c.exitCode===null && c.signalCode===null).map(c=>new Promise(r=>{c.once('exit',r);c.kill();})));
    await pool.query('DROP SCHEMA IF EXISTS '+schema+' CASCADE');
    await pool.end();
  }
});
