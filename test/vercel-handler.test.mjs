import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';

test('Vercel entrypoint uses parsed JSON, does not listen or create file storage, and rejects unauthorized backups', () => {
  const result=spawnSync(process.execPath,['--input-type=module','-e',`
    const {default:handler}=await import('./api/index.mjs');
    const guard=setTimeout(()=>{console.error('handler timed out');process.exit(2);},3000);
    const responses=[];
    const response=()=>({writeHead(status){this.status=status;},end(body){responses.push({status:this.status,body:JSON.parse(body)});}});
    await handler({url:'/api/ping',method:'GET',headers:{}},response());
    await handler({url:'/api/admin/player-backup',method:'POST',headers:{},body:{destination:'b2'}},response());
    clearTimeout(guard);
    console.log(JSON.stringify(responses));
  `],{
    cwd:new URL('..',import.meta.url),
    env:{...process.env,VERCEL:'1',DATABASE_URL:'postgresql://unused.invalid/example',NODE_ENV:'production',STARSHIP_DATA_DIR:'/unwritable/no-file-fallback',STARSHIP_BACKUP_TOKEN:'',STARSHIP_MAINTENANCE:'false'},
    encoding:'utf8',timeout:5000
  });
  assert.equal(result.status,0,result.stderr);
  const responses=JSON.parse(result.stdout);
  assert.equal(responses[0].status,200);
  assert.equal(responses[1].status,403);
});

test('Vercel fails closed instead of using temporary file persistence', () => {
  const result=spawnSync(process.execPath,['--input-type=module','-e',"await import('./api/index.mjs')"],{
    cwd:new URL('..',import.meta.url),env:{...process.env,VERCEL:'1',DATABASE_URL:''},encoding:'utf8',timeout:5000
  });
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/Vercel requires DATABASE_URL/);
});
