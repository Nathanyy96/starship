// Isolated UI regression: no production database or real player credentials.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/natha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const {spawn}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir=fs.mkdtempSync(path.join(os.tmpdir(),'starship-voyage-ui-')),base='http://127.0.0.1:45154';
const server=spawn(process.execPath,['serve.mjs'],{cwd:root,env:{...process.env,DATABASE_URL:'',PORT:'45154',HOST:'127.0.0.1',STARSHIP_DATA_DIR:dir,NODE_ENV:'test'},stdio:'ignore'});
(async()=>{let browser;try{
 for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const post=async(route,body)=>(await fetch(base+route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})).json();
 await post('/api/player/register',{name:'VoyageUI',password:'isolated-test-password'});
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.log('UI exception: '+e.message);});
 async function login(name){await page.locator('#known-player-button').click();await page.locator('#player-name-input').fill(name);await page.locator('#player-password-input').fill('isolated-test-password');await page.locator('#auth-submit').click();await page.locator('#world-shell-header').waitFor({state:'visible',timeout:10000}).catch(async e=>{console.log('Gate: '+await page.locator('#player-gate-message').innerText());throw e;});}
 await page.goto(base);await login('VoyageUI');await page.locator('#world-menu-toggle').click();await page.locator('#open-voyage').click();
 let starts=0;await page.route('**/api/player/voyage',async route=>{if(route.request().postDataJSON().action==='start'){starts++;await new Promise(r=>setTimeout(r,300));}await route.continue();});
 await page.locator('#start-voyage').click();await page.locator('#start-voyage').dispatchEvent('click');assert.ok(await page.locator('#start-voyage').isDisabled());await page.locator('[data-voyage-advance]').waitFor();assert.equal(starts,1);await page.unroute('**/api/player/voyage');
 assert.ok(await page.locator('[data-voyage-route]').first().isDisabled());
 // Server commits but the response is lost: block further actions until sync.
 await page.route('**/api/player/voyage',async route=>{await route.fetch();await route.abort();});
 await page.locator('[data-voyage-advance]').click();await page.locator('[data-voyage-sync]').waitFor();assert.ok(await page.locator('[data-voyage-advance]').isDisabled());await page.unroute('**/api/player/voyage');
 await page.locator('[data-voyage-sync]').click();await page.waitForFunction(()=>document.querySelector('#voyage-action-feedback')?.textContent.includes('已同步'));assert.match(await page.locator('#voyage-node-details h3').innerText(),/碎光狹道/);
 await page.reload();await login('VoyageUI');await page.locator('#world-menu-toggle').click();await page.locator('#open-voyage').click();assert.match(await page.locator('#voyage-node-details h3').innerText(),/碎光狹道/);
 await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await page.locator('.back-lobby:visible').click();await page.locator('#world-menu-toggle').click();await page.locator('#change-player').click();
 await post('/api/player/register',{name:'VoyageOther',password:'isolated-test-password'});await login('VoyageOther');await page.locator('#world-menu-toggle').click();await page.locator('#open-voyage').click();
 await page.route('**/api/player/voyage',async route=>{await route.fetch();await route.fulfill({status:200,contentType:'text/html',body:'proxy error'});});
 await page.locator('#start-voyage').click();await page.locator('[data-voyage-sync]').waitFor();await page.unroute('**/api/player/voyage');await page.locator('[data-voyage-sync]').click();await page.waitForFunction(()=>document.querySelector('#voyage-action-feedback')?.textContent.includes('已同步'));
 assert.ok(await page.locator('#start-voyage').isDisabled());assert.deepEqual(errors,[]);
 console.log(JSON.stringify({duplicateStartBlocked:true,lostResponseSynced:true,resumedAfterReload:true,malformedResponseSynced:true,mobileOverflow:false,pageErrors:0}));
 }finally{if(browser)await browser.close();const exited=new Promise(r=>server.once('exit',r));server.kill();await exited;fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e.message);process.exitCode=1;});
