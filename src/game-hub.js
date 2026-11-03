(function (root) {
  "use strict";
  // UI-only transition. Never migrates, grants, or deletes player state.
  var views = ["game-lobby", "storybook-view", "equipment-view", "pet-banner-view"];
  function icon(name) {
    var paths = {
      star: '<path d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>',
      battle: '<path d="m5 3 15 15-2 2L3 5V3h2ZM16 3h5v5M21 3l-8 8M3 21l5-5M3 16l5 5"/>',
      book: '<path d="M12 5C8 2 4 3 2 4v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v16"/>',
      pet: '<path d="M5 12 3 3l7 4h4l7-4-2 9v5c-4 5-10 5-14 0v-5Z"/><path d="M8 13h1m6 0h1m-6 4 2 1 2-1"/>',
      gear: '<path d="m12 2 8 5v10l-8 5-8-5V7l8-5Z"/><circle cx="12" cy="12" r="4"/>',
      map: '<path d="m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3V5Zm6-3v17m8-14v17"/>',
      people: '<circle cx="9" cy="8" r="4"/><path d="M2 22v-3a7 7 0 0 1 14 0v3m1-18a4 4 0 0 1 0 8m2 3a6 6 0 0 1 3 5"/>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths[name] + '</svg>';
  }
  function toolbar(title, subtitle) {
    return '<div class="view-toolbar"><button class="small-button back-lobby" type="button">← 回到大廳</button><div><h2 tabindex="-1">' + title + '</h2><p>' + subtitle + '</p></div><span class="hub-status">籌備中</span></div>';
  }
  function node(view, symbol, title, position, pending) {
    return '<button type="button" class="lobby-node '+position+(pending?' pending':'')+'" data-hub-view="'+view+'"><span class="lobby-medal">'+icon(symbol)+'</span><strong>'+title+'</strong>'+(pending?'<small>籌備中</small>':'')+'</button>';
  }
  function dock(view,symbol,title,pending){
    return '<button type="button" class="lobby-dock-button" data-hub-view="'+view+'">'+icon(symbol)+'<span>'+title+'</span>'+(pending?'<small>籌備中</small>':'')+'</button>';
  }
  function mount() {
    var shell = document.querySelector('.page-shell');
    shell.insertAdjacentHTML('beforeend',
      '<section id="game-lobby" class="game-view hub-view" hidden aria-labelledby="hub-heading">' +
      '<h2 id="hub-heading" class="lobby-sr" tabindex="-1">旅者大廳 · <span id="hub-player"></span></h2><div class="hub-wallet"><span><i aria-hidden="true">✦</i> 星砂 <strong id="hub-sand">0</strong></span><span><i aria-hidden="true">✧</i> 星痕 <strong id="hub-marks">0</strong></span></div>' +
      '<div class="lobby-scenery" aria-hidden="true"></div><div class="lobby-motes" aria-hidden="true"></div>' +
      '<div class="lobby-character"><img src="./assets/ui/celesia-lobby-cutout-v1.png" alt="瑟蕾雅，銀髮藍眼，穿白藍禮裝，手持單劍的完整立繪" draggable="false"><div class="lobby-nameplate"><span>CELESIA</span><strong>瑟蕾雅</strong><button type="button" data-hub-view="character-view">角色資料 →</button></div></div>' +
      '<nav class="lobby-side" aria-label="記錄與說明">'+dock('journey-view','battle','目標')+dock('announcement-view','star','公告')+dock('tutorial-view','book','教學')+dock('map-view','map','圖冊')+'</nav>'+
      '<nav class="lobby-wheel" aria-label="戰鬥與挑戰"><div class="lobby-wheel-track" aria-hidden="true"></div>'+node('trial-view','battle','星界試煉','lobby-main')+node('boss-view','battle','突破首領','lobby-n1')+node('voyage-view','star','星海迷航','lobby-n2')+node('dispatch-view','map','星港委託','lobby-n3')+node('shop-view','gear','星界商店','lobby-n4')+node('equipment-view','gear','角色裝備','lobby-n5')+node('pet-banner-view','pet','星伴召集','lobby-n6')+'</nav>'+
      '<nav class="lobby-dock" aria-label="常用遊戲功能">'+dock('character-view','people','角色')+dock('gacha-hall','star','召集')+dock('pet-view','pet','星伴')+dock('equipment-view','gear','裝備')+dock('storybook-view','book','故事書',true)+dock('map-view','map','世界圖冊')+'</nav></section>' +
      '<section id="storybook-view" class="game-view panel hub-feature" hidden>' + toolbar('星界故事書','想看再看，其他玩法照常開放。') + '<div class="hub-book-cover">' + icon('book') + '<p class="eyebrow">THE STARSHIP CHRONICLES</p><h3>故事，留給想讀的時候。</h3><span>最新世界重啟稿 · 圖文編排中</span></div><div class="hub-book-copy"><h3>一幅畫面，一頁旅程</h3><p>故事書將以上方劇情插圖、下方故事正文呈現。新篇章整理完成後，可在這裡自由翻閱。</p><p>閱讀將提供部分獎勵；不閱讀也能召集角色、培養夥伴與參與挑戰。</p><p class="hub-muted">目前尚未開放新版正文與閱讀獎勵。</p><button class="secondary-action" data-hub-view="map-view" type="button">先看看世界圖冊 →</button></div></section>' +
      '<section id="equipment-view" class="game-view panel hub-feature" hidden>' + toolbar('角色裝備','搭配套裝，培養不同戰鬥風格。') + '<div class="hub-feature-intro">' + icon('gear') + '<h3>為每一位夥伴，找到適合的搭配。</h3><p>裝備取得、套裝效果與強化功能準備中。</p></div><div class="hub-plan-grid"><article><h3>自由搭配</h3><p>規劃多個裝備部位，依角色定位選擇屬性。</p></article><article><h3>套裝效果</h3><p>同套裝組合提供額外效果，也可選擇混搭。</p></article><article><h3>逐步強化</h3><p>透過遊戲取得素材，培養喜歡的裝備。</p></article></div><p class="hub-muted">裝備系統尚未開放。現有角色培養仍可使用。</p><button class="primary-action" data-hub-view="character-view" type="button">前往角色培養 →</button></section>' +
      '<section id="pet-banner-view" class="game-view panel hub-feature" hidden>' + toolbar('星伴召集','與新的星伴締結羈絆。') + '<div class="hub-feature-intro">' + icon('pet') + '<h3>陪伴，也是另一種力量。</h3><p>每期星伴卡池與戰鬥加成準備中。</p></div><div class="hub-plan-grid"><article><h3>所有角色可用</h3><p>星伴提供通用效果，自由搭配隊伍。</p></article><article><h3>專屬共鳴</h3><p>與契合的角色搭配時，額外發揮專屬加成。</p></article><article><h3>培養與強化</h3><p>不同星伴擁有不同效能，隨培育逐步成長。</p></article></div><p class="hub-muted">本期尚未開池；召集機率、保底及加成數值將於開放前公布。現有星伴收藏與培育保留。</p><button class="primary-action" data-hub-view="pet-view" type="button">前往星伴工坊 →</button></section>');
    document.body.classList.add('hub-mode');
    var wallet=document.querySelector('#game-lobby .hub-wallet');
    wallet.classList.add('lobby-resource-hud');
    document.getElementById('world-shell-header').appendChild(wallet);
    document.querySelectorAll('.back-lobby').forEach(function(button){button.textContent='← 回到大廳';});
    document.getElementById('world-home-button').setAttribute('aria-label','回到大廳');
    document.querySelector('#open-story strong').textContent='星界故事書';
    document.querySelector('#open-story small').textContent='最新重啟稿 · 圖文編排中';
    document.querySelector('#open-characters small').textContent='等級、突破與命座';
    document.getElementById('continue-story').textContent='查看故事書';
    document.getElementById('world-save-status').textContent='角色、養成與召集進度隨帳號保存';
    document.querySelector('#map-view .view-toolbar p').textContent='僅供查閱地理與劇情資料，不進入地圖遊玩。';
    document.querySelector('#map-view .view-toolbar > span').textContent='世界圖冊';
  }
  function render(state, name) {
    document.getElementById('hub-player').textContent=name;
    document.getElementById('hub-sand').textContent=Number(state.resources.starSand || 0).toLocaleString();
    document.getElementById('hub-marks').textContent=Number(state.resources.starMarks || 0).toLocaleString();
    document.getElementById('lobby-continue-title').textContent='星界故事書';
    document.getElementById('lobby-continue-copy').textContent='最新世界重啟稿編排中。閱讀不影響其他玩法。';
    document.getElementById('story-progress-label').textContent='自由閱讀 · 獎勵待開放';
    document.getElementById('lobby-pull-label').textContent='角色召集 '+state.totalPulls+' 次';
    document.getElementById('lobby-update-label').textContent='六格裝備與星伴召集已開放';
  }
  root.StarshipHub={views:views,mount:mount,render:render};
}(window));
