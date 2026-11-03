(function (root) {
  'use strict';
  var art='./assets/ui/scenes/';
  var scenes={
    'activities-view':{art:'challenge-sanctum-v1',name:'星穹塔挑戰廳',tag:'STAR TOWER',copy:'整備夥伴與星伴，逐層挑戰更強的敵人。',group:'battle',links:[['character-view','角色培養'],['pet-view','星伴培養']]},
    'monster-atlas-view':{art:'archive-library-v1',name:'魔物觀測書庫',tag:'BESTIARY ARCHIVE',copy:'查看各地魔物的外觀與資料。',group:'other',links:[['activities-view','前往星穹塔'],['trial-view','星界試煉']]},
    'game-lobby':{art:'lobby-starport-v1',name:'星港大廳',group:'home'},
    'character-view':{art:'lobby-starport-v1',name:'旅者休憩廳',tag:'TRAVELER LOUNGE',copy:'整理隊伍的力量，為下一場旅程做好準備。',group:'roles',links:[['equipment-view','搭配裝備'],['pet-banner-view','星伴配屬']]},
    'gacha-hall':{art:'summon-observatory-v1',name:'星願觀測殿',tag:'WISH OBSERVATORY',copy:'與新的夥伴相遇，讓星光回應你的召集。',group:'summon',links:[['pet-banner-view','切換星伴召集'],['character-view','查看角色收藏']]},
    'equipment-view':{art:'relic-workshop-v1',name:'聖遺工坊',tag:'RELIC ATELIER',copy:'六格聖遺、自由套裝，打造自己的戰鬥搭配。',group:'relics',links:[['boss-view','挑戰 Boss · 取得裝備'],['character-view','角色培養']]},
    'pet-banner-view':{art:'companion-garden-v1',name:'星伴祈願庭',tag:'COMPANION GARDEN',copy:'尋找同行的星伴，讓陪伴化為戰鬥的力量。',group:'pets',links:[['pet-view','前往培育工坊'],['gacha-hall','角色召集']]},
    'pet-view':{art:'companion-garden-v1',name:'星伴暖房',tag:'COMPANION CONSERVATORY',copy:'餵食、陪伴與培育，每一次成長都會帶進戰鬥。',group:'pets',links:[['pet-banner-view','召集與戰鬥配屬']]},
    'trial-view':{art:'challenge-sanctum-v1',name:'星界試煉聖域',tag:'ASTRAL SANCTUM',copy:'選擇關卡、配置前後排，見證夥伴們的自動戰鬥。',group:'battle',links:[['boss-view','挑戰突破首領'],['equipment-view','調整裝備'],['journey-view','旅途目標']]},
    'boss-view':{art:'challenge-sanctum-v1',name:'首領征討之門',tag:'BOSS GATE',copy:'選擇首領與獎勵檔位，收集突破材料及隨機聖遺。',group:'battle',links:[['equipment-view','查看聖遺收藏'],['pet-banner-view','搭配支援星伴']]},
    'dispatch-view':{art:'harbor-concourse-v1',name:'星港委託所',tag:'COMMISSION CONCOURSE',copy:'接受委託，派出適合的隊伍完成挑戰。',group:'battle',links:[['voyage-view','準備星海迷航'],['character-view','查看可用角色']]},
    'voyage-view':{art:'harbor-concourse-v1',name:'星海啟航港',tag:'VOYAGE HARBOR',copy:'準備遠行的隊伍，在航程中做出自己的選擇。',group:'battle',links:[['dispatch-view','星港委託'],['equipment-view','出航前調整裝備']]},
    'shop-view':{art:'harbor-concourse-v1',name:'星港商廊',tag:'HARBOR EXCHANGE',copy:'查看本期可兌換物資，為喜歡的夥伴添置收藏。',group:'other',links:[['character-view','角色培養'],['journey-view','查看旅途目標']]},
    'storybook-view':{art:'archive-library-v1',name:'星界故事書庫',tag:'CHRONICLE ARCHIVE',copy:'旅程可以慢慢讀，戰鬥與養成隨時繼續。',group:'other',links:[['map-view','翻閱世界圖冊'],['journey-view','先去冒險']]},
    'map-view':{art:'archive-library-v1',name:'世界圖冊閱覽室',tag:'WORLD ATLAS',copy:'翻閱地理與旅途記錄；圖冊目前僅供查閱。',group:'other',links:[['storybook-view','前往故事書庫']]},
    'tutorial-view':{art:'archive-library-v1',name:'旅者研習室',tag:'TRAVELER GUIDE',copy:'熟悉養成、召集與挑戰，找到適合自己的遊玩節奏。',group:'other',links:[['journey-view','查看目前目標'],['trial-view','開始試煉']]},
    'announcement-view':{art:'archive-library-v1',name:'星港告示廳',tag:'NOTICE ARCHIVE',copy:'查看版本記錄與目前開放的玩法。',group:'other',links:[['journey-view','前往旅途目標']]},
    'journey-view':{art:'archive-library-v1',name:'旅途目標',tag:'YOUR NEXT ADVENTURE',copy:'從現有進度出發，選擇今天想完成的事。',group:'battle',links:[['trial-view','星界試煉'],['boss-view','突破首領']]}
  };
  var routes=[['game-lobby','home','大廳','home'],['character-view','people','角色','roles'],['journey-view','battle','挑戰','battle'],['gacha-hall','star','召集','summon'],['pet-banner-view','pet','星伴','pets'],['equipment-view','gear','裝備','relics']];
  var anchors={'character-view':['#character-detail','查看角色資料'],'gacha-hall':['#banner-panel','選池與召集'],'equipment-view':['.relic-inventory','查看裝備庫'],'pet-banner-view':['.companion-management','調整星伴配屬'],'pet-view':['#pet-selected-card','開始培育'],'trial-view':['#trial-formation','編隊與出戰'],'boss-view':['#boss-formation','編隊與出戰'],'dispatch-view':['#dispatch-team-list','選擇出戰隊伍'],'voyage-view':['#voyage-team-list','準備遠行隊伍']};
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function icon(name){var p={home:'M3 11 12 3l9 8M5 10v11h14V10M9 21v-7h6v7',people:'M4 21v-3a8 8 0 0 1 16 0v3M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',battle:'m4 3 17 17-1 1L3 4V3h1m12 0h5v5M21 3l-8 8M3 21l6-6',star:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',pet:'M5 12 3 3l7 4h4l7-4-2 9v5c-4 5-10 5-14 0v-5M8 13h1m6 0h1m-6 4 2 1 2-1',gear:'m12 2 8 5v10l-8 5-8-5V7l8-5Zm0 6a4 4 0 1 0 0 8 4 4 0 0 0 0-8'};return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true"><path d="'+p[name]+'"/></svg>';}
  function progress(state){
    state=state||{};var collection=state.collection||{},items=state.equipment&&state.equipment.items||[],ps=state.petSummon||{},ownedPets=Object.keys(state.petProgress&&state.petProgress.pets||{}).filter(function(id){return state.petProgress.pets[id].owned!==false;});
    return {roles:Object.keys(collection).filter(function(id){return collection[id]>0;}).length,relics:items.length,worn:items.filter(function(i){return Boolean(i.equippedBy);}).length,pets:ownedPets.length,bound:Object.keys(ps.assignments||{}).length,trial:(state.trialProgress&&state.trialProgress.clearedStages||[]).length,pulls:state.totalPulls||0,petPulls:ps.totalPulls||0};
  }
  function goals(state){var p=progress(state);return [
    {view:'trial-view',art:'challenge-sanctum-v1',icon:'battle',title:'踏入星界試煉',status:'已通關 '+p.trial+' 個關卡',copy:'安排前後排並挑戰關卡。通關可獲取關卡標示的資源。',action:'選擇試煉關卡'},
    {view:'boss-view',art:'challenge-sanctum-v1',icon:'gear',title:'收集六格聖遺',status:'收藏 '+p.relics+' 件 · 穿戴 '+p.worn+' 件',copy:p.relics?'已有裝備可搭配，也能挑戰更高檔位的 Boss 尋找稀有聖遺。':'從 Boss 有效勝利取得第一件裝備，再回工坊穿戴與強化。',action:'挑戰 Boss'},
    {view:'character-view',art:'lobby-starport-v1',icon:'people',title:'培育旅途夥伴',status:'已取得 '+p.roles+' 名角色',copy:'角色經驗可用於角色升級或聖遺強化，自由選擇培養方向。',action:'前往角色培養'},
    {view:'pet-banner-view',art:'companion-garden-v1',icon:'pet',title:'尋找同行星伴',status:'已取得 '+p.pets+' 種 · 配屬 '+p.bound+' 名角色',copy:'星伴能力與機制會參與實戰，培育升級可提高效能；覺醒尚未開放。',action:p.bound?'調整星伴搭配':'召集與配屬星伴'},
    {view:'dispatch-view',art:'harbor-concourse-v1',icon:'star',title:'接受星港委託',status:'委託與迷航各自保存進度',copy:'挑選委託挑戰，或另組遠行隊伍，展開星海迷航。',action:'查看可用委託'},
    {view:'equipment-view',art:'relic-workshop-v1',icon:'gear',title:'整備下一場戰鬥',status:'裝備、套裝與星伴可以一起搭配',copy:'六個裝備部位各司其職；試試套裝加成與不同星伴效果。',action:'前往聖遺工坊'}
  ];}
  function create(config){
    var current='',owner='',history=[],nav=document.createElement('nav'),place=document.createElement('div'),live=document.createElement('span');
    var shell=document.querySelector('.page-shell');shell.insertAdjacentHTML('beforeend','<section id="journey-view" class="game-view panel" hidden><div class="view-toolbar"><button type="button" class="small-button" data-scene-to="game-lobby">← 回到大廳</button><div><p class="eyebrow">JOURNEY JOURNAL</p><h2 tabindex="-1">旅途目標</h2></div><span>進度隨帳號保存</span></div><div id="journey-content"></div></section>');
    document.querySelector('#world-main-menu > nav').insertAdjacentHTML('afterbegin',[
      ['journey-view','battle','旅途目標','從目前進度選擇下一步'],['equipment-view','gear','聖遺工坊','穿戴、套裝與經驗強化'],['pet-banner-view','pet','星伴召集','心願召集、培養與配屬']
    ].map(function(r){return '<button class="world-menu-entry" type="button" data-scene-to="'+r[0]+'">'+icon(r[1])+'<span><strong>'+r[2]+'</strong><small>'+r[3]+'</small></span></button>';}).join(''));
    nav.className='scene-dock';nav.hidden=true;nav.setAttribute('aria-label','常駐功能導覽');nav.innerHTML=routes.map(function(r){return '<button type="button" data-scene-to="'+r[0]+'" data-scene-group="'+r[3]+'">'+icon(r[1])+'<span>'+r[2]+'</span></button>';}).join('');document.body.appendChild(nav);
    place.className='scene-location';place.hidden=true;document.getElementById('world-shell-header').insertBefore(place,document.getElementById('world-shell-header').querySelector('nav'));
    live.className='scene-sr';live.setAttribute('role','status');live.setAttribute('aria-live','polite');document.body.appendChild(live);
    new MutationObserver(function(){var view=document.getElementById(current);if(view&&!view.hidden&&current!=='game-lobby'&&!view.querySelector('.scene-arrival'))enter(current);}).observe(shell,{childList:true,subtree:true});
    document.addEventListener('click',function(event){var jump=event.target.closest('[data-scene-anchor]');if(jump){var anchor=anchors[current],destination=anchor&&document.getElementById(current).querySelector(anchor[0]);if(destination){destination.classList.add('scene-anchor-target');if(!destination.matches('button,input,select,textarea,a'))destination.tabIndex=-1;destination.focus({preventScroll:true});destination.scrollIntoView({block:'start',behavior:root.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}return;}var target=event.target.closest('[data-scene-to]');if(target&&!target.disabled){go(target.dataset.sceneTo);return;}if(event.target.closest('[data-scene-back]')){var last=history.pop();if(last){current='';go(last);}}});
    function go(id){if(!scenes[id])return;config.onNavigate(id);var h=document.getElementById(id).querySelector('h2');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
    function enter(id){
      var scene=scenes[id];if(!scene)return;var nextOwner=config.getOwner();if(owner!==nextOwner){owner=nextOwner;history=[];current='';}
      var changed=current!==id;if(changed&&current)history.push(current);history=history.slice(-30);current=id;
      document.body.dataset.scene=id;document.body.style.setProperty('--scene-art','url("'+art+scene.art+'.jpg")');
      var view=document.getElementById(id),state=config.getState(),p=progress(state);
      nav.hidden=id==='game-lobby';place.hidden=id==='game-lobby';place.innerHTML=(history.length?'<button type="button" data-scene-back aria-label="返回上一個遊戲頁面" title="返回上一頁">‹</button>':'')+'<span>'+esc(scene.name)+'</span>';
      nav.querySelectorAll('button').forEach(function(b){if(b.dataset.sceneGroup===scene.group)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
      if(id==='journey-view')document.getElementById('journey-content').innerHTML='<div class="journey-summary"><span>角色 <b>'+p.roles+'</b></span><span>聖遺 <b>'+p.relics+'</b></span><span>星伴 <b>'+p.pets+'</b></span><span>已配屬 <b>'+p.bound+'</b></span></div><div class="journey-goals">'+goals(state).map(function(g){return '<article style="--goal-art:url(\''+art+g.art+'.jpg\')"><div class="journey-goal-art" aria-hidden="true"></div><div><p>'+esc(g.status)+'</p><h3>'+icon(g.icon)+esc(g.title)+'</h3><p>'+esc(g.copy)+'</p><button type="button" class="primary-action" data-scene-to="'+g.view+'">'+esc(g.action)+' →</button></div></article>';}).join('')+'</div><p class="journey-note">這裡整理目前進度與可前往的玩法；獎勵以各關卡顯示為準。故事書仍在編排，閱讀不影響其他玩法。</p>';
      if(id!=='game-lobby'&&!view.querySelector('.scene-arrival')){
        var anchor=anchors[id],hero=document.createElement('section');hero.className='scene-arrival';hero.setAttribute('aria-label',scene.name);hero.innerHTML='<div><p class="scene-eyebrow">'+scene.tag+'</p><h3>'+esc(scene.name)+'</h3><p>'+esc(scene.copy)+'</p><div class="scene-shortcuts">'+(anchor?'<button type="button" class="scene-jump" data-scene-anchor>'+anchor[1]+' <span aria-hidden="true">↓</span></button>':'')+(scene.links||[]).map(function(l){return '<button type="button" data-scene-to="'+l[0]+'">'+esc(l[1])+' <span aria-hidden="true">↗</span></button>';}).join('')+'</div></div>';
        var toolbar=view.querySelector(':scope > .view-toolbar');if(toolbar)toolbar.after(hero);else view.prepend(hero);
      }
      if(changed){live.textContent='已前往'+scene.name;view.classList.remove('scene-enter');void view.offsetWidth;view.classList.add('scene-enter');}
    }
    return {enter:enter};
  }
  root.StarshipSceneShell={create:create,scenes:scenes,progress:progress,goals:goals};
}(typeof window!=='undefined'?window:globalThis));
