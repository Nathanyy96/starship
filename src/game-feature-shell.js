(function(root){
  'use strict';
  var activePane='growth',lastCharacter='';
  function esc(value){return String(value==null?'':value).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function mount(){
    var view=document.getElementById('character-view'),tools=view.querySelector('.character-list-tools'),list=document.getElementById('character-list'),detail=document.getElementById('character-detail');
    var bench=document.createElement('div');bench.className='character-workbench';
    var roster=document.createElement('aside');roster.className='character-roster';roster.setAttribute('aria-label','選擇角色');
    roster.appendChild(tools);roster.appendChild(list);bench.appendChild(roster);bench.appendChild(detail);
    bench.insertAdjacentHTML('beforeend','<div class="character-selection-hint"><span>✦</span><h3>選擇你的星界夥伴</h3><p>從角色欄查看能力、培養、命座與造型。</p></div>');view.appendChild(bench);
    var lower=document.querySelector('#gacha-hall .lower-grid');
    if(lower){var archive=document.createElement('details');archive.className='summon-archive';archive.innerHTML='<summary>角色收藏與召集紀錄</summary>';lower.before(archive);archive.appendChild(lower);}
  }
  function tile(card,progress,copies,portrait,selected,state){
    var stars=root.StarshipStarAscension.stars(state,card);
    return '<button type="button" class="trial-team-card roster-tile rarity-'+Number(card.rarity)+(copies?' owned':' locked')+(selected?' selected':'')+'" data-open-character="'+esc(card.id)+'" aria-pressed="'+Boolean(selected)+'" aria-label="查看'+esc(card.name)+'培養資料"><span class="trial-team-art roster-face">'+(portrait?'<img src="'+esc(portrait)+'" alt="" loading="lazy">':'<i>✦</i>')+'</span><span class="trial-team-copy roster-tile-copy"><strong>'+esc(card.name)+'</strong><small class="roster-stars">'+'★'.repeat(stars)+'</small><small>'+esc(card.element)+' · '+(copies?'Lv.'+progress.level+' · C'+(progress.constellation||0):'尚未取得')+'</small></span></button>';
  }
  function selectPane(detail,pane){
    activePane=pane;
    detail.querySelectorAll('[data-character-pane]').forEach(function(button){var selected=button.getAttribute('data-character-pane')===pane;button.setAttribute('aria-pressed',String(selected));});
    detail.querySelectorAll('[data-character-panel]').forEach(function(panel){panel.hidden=panel.getAttribute('data-character-panel')!==pane;});
  }
  function decorateCharacter(detail,cardId,state){
    if(lastCharacter!==cardId){activePane='growth';lastCharacter=cardId;}
    var copy=detail.querySelector('.character-detail-copy'),panels={},tabs=[['growth','培養'],['skills','技能'],['constellation','命座'],['outfits','造型'],['equipment','裝備'],['companion','星伴']];
    var nav=document.createElement('nav');nav.className='character-pane-nav';nav.setAttribute('aria-label','角色資料分類');
    tabs.forEach(function(tab){nav.insertAdjacentHTML('beforeend','<button type="button" data-character-pane="'+tab[0]+'" aria-pressed="false">'+tab[1]+'</button>');var panel=document.createElement('section');panel.className='character-pane-content';panel.setAttribute('data-character-panel',tab[0]);panel.setAttribute('aria-label',tab[1]);panels[tab[0]]=panel;});
    var children=Array.from(copy.children),headerEnd=copy.querySelector('.detail-progress');headerEnd.after(nav);
    var start=false;
    children.forEach(function(child){
      if(child===headerEnd){start=true;return;}if(!start)return;
      var pane=child.matches('.growth-companion')?'companion':child.matches('.constellation-details')?'constellation':child.matches('.character-skin-list,.character-skin-panel')?'outfits':child.matches('.detail-skill,.detail-actions,.character-variant')?'skills':'growth';
      if(child.matches('details'))child.open=true;panels[pane].appendChild(child);
    });
    var eq=root.StarshipEquipment,items=eq.normalize(state&&state.equipment).items;
    panels.equipment.innerHTML='<div class="character-relic-preview">'+eq.slots.map(function(slot){var item=items.find(function(i){return i.equippedBy===cardId&&i.slot===slot.id;});return '<span><b>'+slot.name+'</b><small>'+(item?'★'.repeat(item.rarity)+' ＋'+item.level:'尚未裝備')+'</small></span>';}).join('')+'</div><button type="button" class="secondary-action" data-character-equipment="'+esc(cardId)+'">搭配六格裝備 →</button>';
    var petSystem=root.StarshipPetSystem,petState=petSystem.normalize(state.petSummon,state),petId=Object.keys(petState.assignments).find(function(id){return petState.assignments[id]===cardId;}),support=petId?petSystem.support(state,petId,cardId):null;
    panels.companion.insertAdjacentHTML('beforeend',(support?'<h4>'+esc(support.name)+' · Lv.'+support.level+' · '+support.rank+'階</h4><p>'+esc(support.skill)+(support.resonance?'（專屬共鳴）':'')+'</p><p>'+support.stats.map(function(key){return petSystem.statLabels[key]+' +'+(support.statRate*100).toFixed(1)+'%';}).join(' ／ ')+'</p>':'<p class="feature-empty">目前尚未配屬星伴。</p>') );
    tabs.forEach(function(tab){if(!panels[tab[0]].children.length)panels[tab[0]].innerHTML='<p class="feature-empty">目前尚未登錄此項資料。</p>';copy.appendChild(panels[tab[0]]);});
    var upgrade=panels.growth.querySelector('.detail-upgrade');if(upgrade)panels.growth.prepend(upgrade);
    if(upgrade)upgrade.insertAdjacentHTML('afterend',root.StarshipStarAscensionUI.panel(root.StarshipGachaData.cards[cardId],state));else panels.growth.insertAdjacentHTML('afterbegin',root.StarshipStarAscensionUI.panel(root.StarshipGachaData.cards[cardId],state));
    selectPane(detail,activePane);
    document.querySelectorAll('#character-list [data-open-character]').forEach(function(button){var selected=button.getAttribute('data-open-character')===cardId;button.classList.toggle('selected',selected);button.setAttribute('aria-pressed',String(selected));});
  }
  function featured(card,image){
    if(!card)return '<div class="summon-feature-empty"><span>✦</span><h3>常駐回音召集</h3><p>所有可召集角色，一次新的相遇。</p></div>';
    return '<div class="summon-feature-art"><img src="'+esc(image)+'" alt="'+esc(card.name)+'的角色立繪"><div class="summon-feature-name"><span>原生 '+'★'.repeat(card.rarity)+' · '+esc(card.element)+'</span><h3>'+esc(card.name)+'</h3><small>'+esc(card.romanizedName)+'</small></div></div>';
  }
  root.StarshipFeatureShell={mount:mount,tile:tile,decorateCharacter:decorateCharacter,selectPane:selectPane,featured:featured};
}(window));
