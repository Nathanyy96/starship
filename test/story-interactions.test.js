const test=require('node:test'),assert=require('node:assert/strict');
const interactions=require('../src/story-interactions'),world=require('../src/first-major-world');
function setup(event){const goal=world.acts[event.act][event.scene],state={...world.initial(event.act),index:event.scene,map:goal.map,x:goal.x,y:goal.y};let resumes=0,suspends=0;const engine=interactions.create({player:()=>({x:state.x,y:state.y}),plan:(a,b)=>world.planWalk({...state,x:a.x,y:a.y},b.x,b.y),resume:()=>resumes++,suspend:()=>suspends++});return {engine,state,goal,get resumes(){return resumes},get suspends(){return suspends}};}
test('six interactions have unique anchors in original 1.0–1.1 dialogue and reachable targets',()=>{
 assert.equal(interactions.events.length,6);
 for(const e of interactions.events){const h=setup(e),line=h.goal.lines.find(t=>t.includes(e.anchor));assert.ok(line,e.id);assert.equal(interactions.match(e.act,e.scene,line),e);assert.equal(h.engine.trigger(e.act,e.scene,line,'line'),true,e.id);assert.equal(h.suspends,1);assert.equal(h.resumes,0);const target=h.engine.target();if(target)assert.ok(world.planWalk(h.state,target.x,target.y).length,e.id);}
});
test('guide waits for a lagging player and cannot finish remotely or advance the story',()=>{
 for(const e of interactions.events.filter(e=>e.kind==='follow')){const h=setup(e),initialIndex=h.state.index;assert.ok(h.engine.trigger(e.act,e.scene,e.anchor,'line'));for(let i=0;i<120;i++)h.engine.update(.05);const waiting={...h.engine.actor()};assert.equal(waiting.walking,false);h.engine.update(1);assert.equal(h.engine.actor().x,waiting.x);assert.match(h.engine.ui().hint,/等你/);h.engine.action();assert.equal(h.resumes,0);
 for(let i=0;i<500&&/跟隨|跟著/.test(h.engine.ui().title);i++){const actor=h.engine.actor();assert.ok(world.passable(h.state.map,actor.x,actor.y));h.state.x=actor.x;h.state.y=actor.y;h.engine.update(.05);if(h.engine.ui().canAct){h.engine.action();break;}}
 assert.equal(h.resumes,1);assert.equal(h.state.index,initialIndex);assert.equal(h.engine.handled('line'),true);assert.equal(h.engine.trigger(e.act,e.scene,e.anchor,'line'),false);}
});
test('inspection requires approaching each target and acknowledging completion',()=>{
 for(const e of interactions.events.filter(e=>e.kind==='inspect')){const h=setup(e);h.engine.trigger(e.act,e.scene,e.anchor,'line');h.engine.action();assert.equal(h.resumes,0);for(let i=0;i<e.steps.length;i++){const target=h.engine.target();assert.ok(target);assert.ok(world.planWalk(h.state,target.x,target.y).length);h.state.x=target.x;h.state.y=target.y;h.engine.action();}assert.equal(h.engine.exploring(),false);assert.equal(h.resumes,0);h.engine.action();assert.equal(h.resumes,1);}
});
test('every response returns to the same source line without altering main story state',()=>{
 for(const e of interactions.events.filter(e=>e.kind==='choice'))for(let option=0;option<e.choices.length;option++){const h=setup(e),snapshot=JSON.stringify(h.state);h.engine.trigger(e.act,e.scene,e.anchor,'same-line');h.engine.action();assert.equal(h.resumes,0);assert.equal(h.engine.choose(-1),false);assert.equal(h.engine.choose(option),true);assert.equal(h.engine.choose(1-option),false);assert.equal(h.resumes,0);h.engine.action();assert.equal(h.resumes,1);assert.equal(JSON.stringify(h.state),snapshot);assert.equal(h.engine.handled('same-line'),true);h.engine.reset();assert.equal(h.engine.active(),false);assert.equal(h.engine.actor(),null);}
});
