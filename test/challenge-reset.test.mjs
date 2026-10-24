import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import data from '../src/data.js';

test('four challenge cycles reset once while all other account state remains identical', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'starship-reset-'));
  const listener = net.createServer();
  await new Promise(resolve => listener.listen(0, '127.0.0.1', resolve));
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const server = spawn(process.execPath, ['serve.mjs'], {
    cwd: path.resolve(import.meta.dirname, '..'), stdio: 'ignore',
    env: {...process.env, DATABASE_URL:'', STARSHIP_TEST_REWARDS:'false', STARSHIP_DATA_DIR:directory, HOST:'127.0.0.1', PORT:String(port)}
  });
  const base = 'http://127.0.0.1:' + port;
  const post = async (route, body) => {
    const response = await fetch(base + '/api/player/' + route, {method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify(body)});
    const result = await response.json();
    assert.equal(response.status, 200, result.error);
    return result;
  };
  const resetKeys = ['trialProgress','bossProgress','dispatchProgress','voyageProgress'];
  const withoutChallenges = state => Object.fromEntries(Object.entries(state).filter(([key]) => !resetKeys.includes(key)));
  try {
    let ready = false;
    for (let index=0; index<100; index++) { try {ready=(await fetch(base+'/api/health')).ok;} catch {} if(ready)break; await delay(100); }
    assert.ok(ready);
    const account = await post('register', {name:'ResetTester', password:'isolated-test-password'});
    const file = path.join(directory,'players.json');
    const database = JSON.parse(fs.readFileSync(file,'utf8'));
    const state = database.players.resettester.state;
    const originalIdentity = structuredClone(database.players.resettester);
    delete originalIdentity.state;
    state.resources = {...state.resources, starSand:12345, characterExp:67890, starMarks:19};
    state.collection.harlow = 2;
    state.characterProgress.harlow = {level:1, constellation:1, affinity:0, constellationCore:1, breakthrough:false};
    state.characterProgress.celesia.level = 25;
    state.pity.limited = {pullsSince4Star:31, guaranteedFeatured:true};
    state.shopProgress.purchases = {'preserve-purchase':2};
    state.shopProgress.conversions = {'preserve-conversion':1};
    state.petProgress.exploreCount = 3;
    state.petProgress.ratedShowcases = {'preserve-rating':true};
    for (const key of resetKeys) state[key].version = 'release-1-1';
    state.trialProgress.attempts = {1:3};
    state.trialProgress.clearedStages = [1];
    state.trialProgress.bestStage = 1;
    state.bossProgress.attempts = {'boss-star-warden':3};
    state.dispatchProgress.claimed = {'preserve-only-until-reset':true};
    state.voyageProgress.status = 'exploring';
    state.voyageProgress.fragments = 999;
    const before = structuredClone(state);
    fs.writeFileSync(file,JSON.stringify(database));
    const migrated = (await post('session',{token:account.token})).state;
    assert.deepEqual(withoutChallenges(migrated),withoutChallenges(before));
    for (const key of resetKeys) assert.equal(migrated[key].version,data.trialVersion);
    assert.deepEqual(migrated.trialProgress.attempts,{});
    assert.deepEqual(migrated.trialProgress.clearedStages,[]);
    assert.equal(migrated.trialProgress.bestStage,0);
    assert.deepEqual(migrated.bossProgress.attempts,{});
    assert.deepEqual(migrated.dispatchProgress.claimed,{});
    assert.equal(migrated.voyageProgress.status,'idle');
    assert.equal(migrated.voyageProgress.fragments,0);
    const updated = JSON.parse(fs.readFileSync(file,'utf8'));
    updated.players.resettester.state.trialProgress.attempts = {1:1};
    updated.players.resettester.state.trialProgress.clearedStages = [1];
    updated.players.resettester.state.trialProgress.bestStage = 1;
    updated.players.resettester.state.bossProgress.attempts = {'boss-star-warden':1};
    updated.players.resettester.state.dispatchProgress.claimed = {'new-commission':true};
    const afterProgress = structuredClone(updated.players.resettester.state);
    fs.writeFileSync(file,JSON.stringify(updated));
    const relogin = await post('login',{name:'ResetTester',password:'isolated-test-password'});
    assert.deepEqual(relogin.state,afterProgress);
    const finalRecord = JSON.parse(fs.readFileSync(file,'utf8')).players.resettester;
    for (const [key,value] of Object.entries(originalIdentity)) {
      if (key !== 'updatedAt' && key !== 'lastLoginAt') assert.deepEqual(finalRecord[key],value);
    }
    assert.equal(data.shopCatalog.version,data.updateCycle);
    assert.equal(data.petVersion,data.updateCycle);
    assert.notEqual(data.trialVersion,data.updateCycle);
  } finally {
    server.kill();
    if(server.exitCode===null) await new Promise(resolve=>server.once('exit',resolve));
    assert.ok(directory.startsWith(os.tmpdir()));
    fs.rmSync(directory,{recursive:true,force:true});
  }
});
