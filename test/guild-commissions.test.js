const test=require('node:test');
const assert=require('node:assert/strict');
const guild=require('../src/guild-commissions');
const world=require('../src/first-major-world');

test('白鐘四種委託可接取、達成並只回報一次',()=>{
  let state=guild.clean();
  for(const id of ['letter','hunt','survey','supply'])state=guild.update(state,'accept',id);
  state=guild.update(state,'deliver','letter');
  state=guild.update(state,'win','hunt');
  state=guild.update(state,'inventory','supply');
  for(const id of ['river','workshop','steps','steps'])state=guild.update(state,'survey',id);
  assert.deepEqual(state.survey,['river','workshop','steps']);
  assert.deepEqual(state.jobs,{letter:'ready',hunt:'ready',survey:'ready',supply:'ready'});
  for(const id of ['letter','hunt','survey','supply'])state=guild.update(state,'complete',id);
  assert.deepEqual(guild.update(state,'complete','hunt'),state);
  assert.deepEqual(Object.values(state.jobs),['done','done','done','done']);
});

test('委託位置在可通行地面且小隊只能選持有角色',()=>{
  for(const id of ['guild','north-hunt','river','workshop','steps']){
    const site=world.maps.city.sites.find(site=>site.id===id);
    assert.ok(site,id);
    assert.equal(world.passable('city',site.x,site.y),true,id);
  }
  const letter=world.maps.south.sites.find(site=>site.id==='letter-recipient');
  assert.equal(world.passable('south',letter.x,letter.y),true);
  const supply=world.maps.factoryNear.sites.find(site=>site.id==='supply-ledger');
  assert.equal(world.passable('factoryNear',supply.x,supply.y),true);
  assert.deepEqual(guild.setTeam({},['a','a','b','c','d','e'],['a','b','c','d']).team,['a','b','c','d']);
});
