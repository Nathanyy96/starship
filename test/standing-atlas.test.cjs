const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const data=require('../src/data.js');
const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'src/player-app.js'),'utf8');
const portrait=new Function('data',source.slice(source.indexOf('var characterPortraitAssetVersion ='),source.indexOf('function bannerById('))+';return characterPortraitSource;')(data);

test('46 adopted images have unique identity, valid WebP payload and verified delivery hashes',()=>{
 const entries=data.characterAtlas.entries;
 assert.equal(entries.length,46);assert.equal(new Set(entries.map(e=>e.id)).size,46);
 assert.equal(entries.filter(e=>e.kind==='character').length,26);
 assert.equal(entries.filter(e=>e.kind==='story').length,12);
 assert.equal(entries.filter(e=>e.kind==='skin').length,7);
 assert.equal(entries.filter(e=>e.kind==='form').length,1);
 for(const e of entries){const b=fs.readFileSync(path.resolve(root,e.image));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');assert.equal(crypto.createHash('sha256').update(b).digest('hex'),e.sha256,e.id);assert.ok(e.bytes<350000,e.id);assert.ok(e.width>=853&&e.height>=1280,e.id);}
});
test('all 26 portraits share the adopted source across raw, background and card views without changing release eligibility',()=>{
 for(const art of data.characterAtlas.entries.filter(e=>e.kind==='character')){const card=data.cards[art.id];for(const key of ['image','backgroundImage','portraitImage'])assert.equal(card[key],art.image);assert.equal(portrait(card,{},true),art.image+'?v=standing-20261103');}
 assert.deepEqual(data.activeCards.map(c=>c.id),['celesia','reyn','lia','isar','chodan','magenta','hina','siyeon','cenwu','ruida','yuan']);
 for(const art of data.characterAtlas.entries.filter(e=>e.kind==='story'))assert.equal(data.storyCharacters[art.id].portrait,art.image);
});
test('owned skin selection, base reset and deepwater form resolve independently without mutating the save',()=>{
 for(const skin of data.shopCatalog.skins.filter(s=>data.characterAtlas.byId[s.id])){
  const state={cosmetics:{skins:{[skin.id]:{source:'existing'}},equippedSkins:{[skin.characterId]:skin.id}}};const before=structuredClone(state);
  assert.equal(portrait(data.cards[skin.characterId],state,true),data.characterAtlas.byId[skin.id].image+'?v=standing-20261103');
  assert.equal(portrait(data.cards[skin.characterId],state,false),data.cards[skin.characterId].image+'?v=standing-20261103');
  assert.deepEqual(state,before);delete state.cosmetics.skins[skin.id];assert.equal(portrait(data.cards[skin.characterId],state,true),data.cards[skin.characterId].image+'?v=standing-20261103');
 }
 assert.equal(portrait(data.cards.elorna,{characterProgress:{elorna:{activeForm:'deepwater'}}},true),data.characterAtlas.byId['elorna-deepwater'].image+'?v=standing-20261103');
 for(const id of ['skin-elorna-purple-jellyfish','skin-elorna-jellyfish-gown'])assert.ok(!data.shopCatalog.skins.some(s=>s.id===id));
});
test('actual new base and equipped portraits replace old action atlases while battle effects and rows remain',()=>{
 const section=source.slice(source.indexOf('function battleArenaMarkup('),source.indexOf('function battleSceneMarkup('));
 const arena=new Function('data','battleCharacterById','characterPortraitSource','enemyArtFor','battleHealthPercent','escapeHtml','battleLogText','number',section+';return battleArenaMarkup;')(data,id=>data.cards[id],portrait,u=>u.image,()=>100,String,String,String);
 for(const id of data.characterAtlas.entries.filter(e=>e.kind==='character').map(e=>e.id)){
  const team=[{id,hp:100,maxHp:100,shield:0}];const previous={team:structuredClone(team),enemies:[]};const frame={team,enemies:[],actorId:id,events:['attack'],actorIsEnemy:false};
  const html=arena(frame,previous,{});assert.ok(html.includes(data.cards[id].image),id);assert.ok(html.includes('battle-standing-portrait'));assert.ok(!html.includes('battle-action-sprite'));assert.ok(html.includes('acting'));assert.ok(html.includes('data-row="front"'));
 }
 const skin=data.shopCatalog.skins.find(s=>s.id==='skin-siyeon-qwer');const state={cosmetics:{skins:{[skin.id]:true},equippedSkins:{siyeon:skin.id}}};
 const team=[{id:'siyeon',hp:100,maxHp:100,shield:0,row:'back'}];assert.ok(arena({team,enemies:[],events:[]},null,state).includes(skin.image));
});
