const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../src/player-app.js'), 'utf8');
function harness() {
  const values = new Map(), applied = [];
  const state = { collection: { lia: 1, magenta: 1, hina: 0 } };
  const cards = { celesia:{id:'celesia',name:'瑟蕾雅'}, lia:{id:'lia',name:'莉亞'}, magenta:{id:'magenta',name:'Magenta'}, hina:{id:'hina',name:'Hina'} };
  const context = vm.createContext({currentPlayerName:'Alice',playerKey:s=>s.toLowerCase(), game:{getState:()=>state},rosterCards:()=>Object.values(cards),data:{cards},window:{localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)}},renderCharacters(){},showMessage(){},firstActGame:{setPlayer:id=>applied.push(id)},exploration:null,firstMajorWorld:null});
  vm.runInContext(source.slice(source.indexOf('    function explorerStorageKey()'), source.indexOf('    function firstActKey()')), context);
  return {context,values,applied,state};
}
test('owned explorer choice persists and all map controllers receive the selection', () => {
  const h = harness(); h.context.selectExplorer('magenta');
  assert.equal(h.context.currentExplorerId(),'magenta');
  assert.deepEqual(h.applied,['magenta']);
  h.context.applyExplorerSelection({setPlayer:id=>h.applied.push(id)});
  assert.deepEqual(h.applied,['magenta','magenta']);
  assert.equal(h.values.get('starship-explorer:alice'),'magenta');
});
test('locked characters and NPC ids cannot become player explorers; stale ownership falls back', () => {
  const h = harness(); h.context.selectExplorer('lia');
  h.context.selectExplorer('hina'); h.context.selectExplorer('sevin');
  assert.equal(h.context.currentExplorerId(),'lia');
  h.state.collection.lia=0;
  assert.equal(h.context.currentExplorerId(),'celesia');
});
test('switching accounts uses separate saved explorer preferences', () => {
  const h = harness(); h.context.selectExplorer('lia');
  h.context.currentPlayerName='Bob'; assert.equal(h.context.currentExplorerId(),'celesia');
  h.context.selectExplorer('magenta');
  h.context.currentPlayerName='Alice'; assert.equal(h.context.currentExplorerId(),'lia');
});
