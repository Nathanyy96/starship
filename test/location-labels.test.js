const test=require('node:test'),assert=require('node:assert/strict');
const presentation=require('../src/world-presentation'),world=require('../src/first-major-world');
test('co-located entrance and landmark display only the actionable entrance label',()=>{
 for(const id of ['south','village','mistbridge','echo']){const m=world.maps[id],labels=presentation.locationLabels(m.exits,m.sites);for(const exit of m.exits)assert.ok(labels.includes(exit));for(const site of m.sites){if(m.exits.some(e=>Math.hypot(e.x-site.x,e.y-site.y)<32))assert.ok(!labels.includes(site));}}
 const m=world.maps.south,labels=presentation.locationLabels(m.exits,m.sites).filter(p=>Math.hypot(p.x-540,p.y-475)<32);assert.equal(labels.length,1);assert.equal(labels[0].to,'southStation');
});
test('distinct nearby landmarks remain visible',()=>{const a={x:0,y:0},b={x:100,y:0};assert.deepEqual(presentation.locationLabels([a],[b]),[a,b]);});
