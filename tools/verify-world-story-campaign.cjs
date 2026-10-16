const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const {chromium}=require('C:/Users/natha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),output=path.join(root,'.tmp-ui-test','world-story-campaign');fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'}),context=await browser.newContext({viewport:{width:1280,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));let cards=0,segments=0,choices=0;
 const saveKey='starship-gacha-save-v1:campaign-qa';
 async function saved(){return page.evaluate(k=>JSON.parse(localStorage.getItem(k)),saveKey);}
 async function clickCards(prefix,expected){
   const actual=await page.evaluate(({prefix,expected})=>{const out=[];for(const line of expected){out.push({text:document.getElementById(prefix+'-dialog-text').textContent,speaker:document.getElementById(prefix+'-dialog-title').textContent});document.getElementById(prefix+'-dialog-next').click();}return out;},{prefix,expected});
   assert.deepEqual(actual,expected);cards+=expected.length;segments++;
 }
 try{
  await page.goto(pathToFileURL(path.join(root,'index.html')).href);
  await page.click('#new-player-button');await page.fill('#player-name-input','campaign-qa');await page.fill('#player-password-input','campaign-test-123');await page.fill('#player-password-confirm','campaign-test-123');await page.click('#auth-submit');await page.locator('#world-shell-header').waitFor({state:'visible'});await page.click('#world-menu-toggle');
  await page.click('#open-story');
  // Position fixtures shorten walking only; every prose card and formal completion uses the mounted UI.
  for(let i=0;i<9;i++){
   await page.evaluate(i=>{const s=StarshipFirstActGame.steps[i];localStorage.setItem('starship-first-act-game-v2:campaign-qa',JSON.stringify({index:i,zone:s.zone,x:s.x,y:s.y}));},i);
   await page.click('#play-first-act');await page.click('#first-act-interact');
   await clickCards('first-act',await page.evaluate(i=>StarshipFirstActGame.scenes[i].map(line=>({text:line[1],speaker:line[0]})),i));
   if(i<8){await page.click('#world-menu-toggle');await page.click('#open-story');}
  }
  await page.click('#first-act-enter-village');
  for(let i=0;i<2;i++){
   await page.click('#world-menu-toggle');await page.click('#open-world-map');
   await page.evaluate(i=>{const e=StarshipExploration,g=e.storyGoals[i];localStorage.setItem('starship-exploration-test-v1:campaign-qa',JSON.stringify({...e.initial(),arrived:true,storyStep:i,x:g.x,y:g.y}));},i);
   await page.click('#open-exploration');await page.click('#exploration-interact');
   await clickCards('exploration',await page.evaluate(i=>StarshipExploration.storyScenes[i].map(line=>({text:line[1],speaker:line[0]})),i));
  }
  await page.waitForFunction(k=>Boolean(JSON.parse(localStorage.getItem(k)).storyProgress.completedScenes['main-1-0:signal']),saveKey);
  await page.click('#world-menu-toggle');await page.click('#open-world-map');
  const order=await page.evaluate(()=>StarshipFirstMajorWorld.storyOrder);
  for(const act of order){
   const count=await page.evaluate(act=>StarshipFirstMajorWorld.acts[act].length,act);
   for(let index=0;index<count;index++){
    await page.evaluate(({act,index})=>{const w=StarshipFirstMajorWorld,g=w.acts[act][index];localStorage.setItem('starship-first-major-world-v1:campaign-qa:'+act,JSON.stringify({...w.initial(act),index,map:g.map,x:g.x,y:g.y}));},{act,index});
    await page.selectOption('#world-story-select',String(act));await page.click('#open-world-campaign');
    await page.click('#first-major-interact');
    if([[4,1],[4,3],[5,1],[11,0],[12,1],[15,2]].some(p=>p[0]===act&&p[1]===index)){
     await page.waitForTimeout(250);await page.locator('#first-major-panel').screenshot({path:path.join(output,'scene-'+act+'-'+index+'-desktop.png')});
     await page.setViewportSize({width:390,height:844});await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#first-major-panel').screenshot({path:path.join(output,'scene-'+act+'-'+index+'-mobile.png')});await page.setViewportSize({width:1280,height:900});
    }
    await clickCards('first-major',await page.evaluate(({act,index})=>StarshipFirstMajorWorld.acts[act][index].lines.map((text,i)=>({text,speaker:StarshipFirstMajorWorld.acts[act][index].speakers[i]})),{act,index}));
    if(index<count-1){await page.click('#world-menu-toggle');await page.click('#open-world-map');}
   }
   const meta=await page.evaluate(act=>StarshipFirstMajorWorld.storyMeta(act),act);
   await page.waitForFunction(({key,scene})=>Boolean(JSON.parse(localStorage.getItem(key)).storyProgress.completedScenes[scene]),{key:saveKey,scene:meta.chapterId+':'+meta.sceneId});
   if(act>=11){
    const steps=await page.evaluate(act=>StarshipStory11Missions.acts[act-11].steps,act);
    for(let step=0;step<steps.length;step++){
     await page.waitForFunction(prompt=>document.getElementById('first-major-task').textContent.includes(prompt),steps[step].prompt);
     if(act===11&&step===0){await page.setViewportSize({width:390,height:844});await page.waitForTimeout(80);await page.locator('#first-major-panel').screenshot({path:path.join(output,'mission-mobile.png')});await page.setViewportSize({width:1280,height:900});await page.click('[data-world-choice="'+((steps[step].answer+1)%3)+'"]');await page.waitForFunction(()=>document.getElementById('first-major-task').querySelector('button:not(:disabled)'));assert.equal((await saved()).storyProgress.missions11.step,0);}
     await page.click('[data-world-choice="'+steps[step].answer+'"]');choices++;
     await page.waitForFunction(({key,act,step})=>{const p=JSON.parse(localStorage.getItem(key)).storyProgress.missions11;return p.act>act-11||p.step>step;},{key:saveKey,act,step});
    }
   }
   if(act===4||act===11||act===13||act===15){
    await page.waitForTimeout(300);await page.locator('#first-major-panel').screenshot({path:path.join(output,'act-'+act+'-desktop.png')});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('#first-major-panel').screenshot({path:path.join(output,'act-'+act+'-mobile.png')});await page.setViewportSize({width:1280,height:900});
   }
   if(act===15){
    const before=(await saved()).resources;await page.click('#first-major-claim');await page.waitForFunction(k=>Boolean(JSON.parse(localStorage.getItem(k)).storyProgress.claimedVersions['1.1']),saveKey);
    const after=await saved();for(const [key,n]of Object.entries({starSand:1600,characterExp:3600,starMarks:1}))assert.equal(after.resources[key]-before[key],n);
    assert.equal(await page.locator('#first-major-claim').isDisabled(),true);
   }else {assert.equal(await page.locator('#first-major-next').isDisabled(),false,meta.label+' next unlocked');}
   await page.click('#world-menu-toggle');await page.click('#open-world-map');console.log('PASS '+meta.label+' ('+count+' segments)');
  }
  const final=await saved();assert.ok(final.storyProgress.claimedVersions['1.0']);assert.ok(final.storyProgress.claimedVersions['1.1']);assert.equal(final.storyProgress.missions11.act,5);
  await page.reload();await page.click('#known-player-button');await page.fill('#player-name-input','campaign-qa');await page.fill('#player-password-input','campaign-test-123');await page.click('#auth-submit');await page.locator('#world-shell-header').waitFor({state:'visible'});await page.click('#world-menu-toggle');await page.click('#open-world-map');await page.selectOption('#world-story-select','15');await page.click('#open-world-campaign');assert.equal(await page.locator('#first-major-claim').isDisabled(),true);assert.deepEqual((await saved()).resources,final.resources);
  assert.deepEqual(errors,[]);console.log(JSON.stringify({pass:true,segments,cards,choices,reload:true,wrongChoiceRetry:true,rewardOnce:true,errors}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
