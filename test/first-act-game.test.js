const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const game = require('../src/first-act-game.js');
const source = require('../src/story-1-0-current.js');

test('first act follows the published scene from South Post to the village', () => {
  assert.equal(source.scenes[0].id, 'signal');
  for (const place of ['南驛山谷・舊祭壇', '獸靈之村外', '獸靈之村・醫療屋']) assert.ok(source.scenes[0].body.includes(place));
  assert.deepEqual([...new Set(game.steps.map(step => step.zone))], ['valley', 'forest']);
  assert.match(game.steps[game.steps.length - 1].text, /村裡/);
});

test('all first act checkpoints have a walkable route and advance in order', () => {
  let state = game.initial();
  for (const [index, step] of game.steps.entries()) {
    assert.equal(state.index, index);
    assert.equal(state.zone, step.zone);
    const path = game.route(state);
    assert.ok(path.length, step.title);
    assert.deepEqual(path.at(-1), [step.x, step.y]);
    for (const [x, y] of path) assert.equal(game.passable(step.zone, x + .5, y + .5), true);
    state.x = step.x + .5; state.y = step.y + .5;
    const result = game.advance(state);
    assert.equal(result.title, step.title);
    state = result.state;
  }
  assert.equal(state.index, game.steps.length);
  assert.equal(game.route(state).length, 0);
  assert.equal(game.normalize(state).index, game.steps.length);
});

test('opening guidance clears the whole actor footprint and uses the altar stairs', () => {
  const state={index:0,zone:'valley',x:17.5,y:10.5};
  const route=game.route(state).map(p=>[p[0]+.5,p[1]+.5]);
  assert.ok(route.length);
  assert.ok(route.some(([x,y])=>x>20&&y>12),'leave platform by southeast stairs');
  for(let i=1;i<route.length;i++)assert.equal(game.clearSegment('valley',route[i-1],route[i]),true,JSON.stringify(route.slice(i-1,i+1)));
  assert.equal(game.clearSegment('valley',[17.5,10.5],[12,10.5]),false,'west altar rim blocks a straight shortcut');
  assert.equal(game.passable('valley',14,11.5),false,'visible west wall stays solid');
  assert.equal(game.fits('valley',21,13),true,'visible southeast stairs accept actor width');
  assert.equal(game.fits('valley',10.5,8.5),true,'cliff objective is on road instead of a pillar');
});

test('every opening guide segment is traversable, including fractional saved positions', () => {
  for(let i=0;i<game.steps.length;i++){
    const step=game.steps[i],previous=game.steps[i-1];
    let state={...game.initial(),index:i,zone:step.zone};
    if(previous&&previous.zone===step.zone){state.x=previous.x+.5;state.y=previous.y+.5;}
    else if(step.zone==='forest'){state.x=4.5;state.y=15.8;}
    const path=game.route(state).map(p=>[p[0]+.5,p[1]+.5]);assert.ok(path.length,step.title);
    for(let j=1;j<path.length;j++)assert.equal(game.clearSegment(step.zone,path[j-1],path[j]),true,step.title);
    const midpoint=path[Math.floor(path.length/2)],fraction={...state,x:midpoint[0]+.07,y:midpoint[1]-.03};
    if(game.fits(step.zone,fraction.x,fraction.y)){const reroute=game.route(fraction).map(p=>[p[0]+.5,p[1]+.5]);assert.ok(reroute.length,step.title);for(let j=1;j<reroute.length;j++)assert.ok(game.clearSegment(step.zone,reroute[j-1],reroute[j]));}
  }
});

test('map cast uses transparent chibi sprites', () => {
  for (const source of Object.values(game.sprites)) {
    const file = path.join(__dirname, '..', source.replace(/^\.\//, ''));
    assert.ok(fs.existsSync(file), source);
    assert.equal(fs.readFileSync(file)[25], 6, source);
  }
});

test('story menu enters the image-backed village and completes through in-game dialogue', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'player-app.js'), 'utf8');
  assert.match(html, /id="play-first-act"/);
  assert.match(html, /id="first-act-view"/);
  assert.ok(html.indexOf('src/first-act-game.js') < html.indexOf('src/player-app.js'));
  assert.match(app, /showView\("first-act-view"\); firstActGame\.open\(\)/);
  assert.match(app, /showVillageExploration\(true\)/);
  assert.match(app, /exploration\.enterStory\(\)/);
  assert.match(html, /id="first-act-dialog-next"/);
  assert.match(html, /id="exploration-dialog-next"/);
  assert.doesNotMatch(html, /閱讀完整第一幕正文/);
  assert.equal(game.scenes.length, game.steps.length);
  assert.ok(game.scenes.every(scene => scene.length >= 3));
});

test('map conversations retain the complete published first act in order', () => {
  const dialogue = require('../src/first-act-scenes.js');
  const body = require('../src/story-1-0-current.js').scenes[0].body;
  assert.equal(dialogue.approach.length, 9);
  assert.equal(dialogue.village.length, 2);
  assert.equal(dialogue.all.flat().map(line => line[1]).join('').replace(/\s/g, ''), body.replace(/\s/g, ''));
  assert.ok(dialogue.all.flat().some(line => line[0] === '伊薩爾'));
});

test('illustrated scenes keep the river and cliffs blocked and scenic stops reachable', () => {
  for (const image of Object.values(game.backgrounds)) {
    const data=fs.readFileSync(path.join(__dirname,'..',image));
    assert.ok(data.readUInt32BE(16)>=1536);
  }
  assert.equal(game.passable('forest',18,21),false);
  assert.equal(game.passable('valley',3,20),false);
  for (const place of game.lookouts) {
    assert.equal(game.passable(place.zone,place.x,place.y),true);
    assert.equal(game.nearLookout({...game.initial(),zone:place.zone,x:place.x,y:place.y}).title,place.title);
  }
});
