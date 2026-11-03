(function(root){
 'use strict';
 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function percent(n){return (n*100).toFixed(2).replace(/\.?0+$/,'')+'%';}
 function model(state,definition,system,cards){
  var saved=state.petProgress.pets[definition.id]||{},level=Math.min(25,Math.max(1,Number(saved.level)||1));
  var assigned=state.petSummon&&state.petSummon.assignments&&state.petSummon.assignments[definition.id];
  var card=cards.find(function(c){return c.id===assigned;}),current=system.support(state,definition.id,assigned||'');
  var preview=JSON.parse(JSON.stringify(state));if(preview.petProgress.pets[definition.id])preview.petProgress.pets[definition.id].level=Math.min(25,level+1);
  var next=level<25?system.support(preview,definition.id,assigned||''):null;
  return {level:level,cap:25,exp:Number(saved.exp)||0,required:80+level*40,capped:level>=25,owned:saved.owned!==false&&Boolean(state.petProgress.pets[definition.id]),assigned:card?card.name:'尚未配屬',current:current,next:next,legacyLevel:Number(saved.level)>25};
 }
 function markup(state,definition,system,cards,art){
  var m=model(state,definition,system,cards),p=m.current,n=m.next;
  var stats=p?p.stats.map(function(k){return '<li><span>'+esc(system.statLabels[k])+'</span><strong>+'+percent(p.statRate)+'</strong>'+(n?'<small>下一級 +'+percent(n.statRate)+'</small>':'');}).join('</li>')+'</li>':'';
  var skill=p&&p.skillRate?'<li><span>'+esc(p.skill)+'</span><strong>'+percent(p.skillRate)+'</strong>'+(n?'<small>下一級 '+percent(n.skillRate)+'</small>':'')+'</li>':'';
  return '<section class="pet-growth-hero"><div class="pet-growth-portrait">'+art+'<span class="pet-growth-stars" aria-label="'+(definition.rarity||3)+'星星伴">'+('★'.repeat(definition.rarity||3))+'</span><div><h3>'+esc(definition.name)+'</h3><p>'+esc(definition.temperament)+' · Lv.'+m.level+' / 25</p></div></div><div class="pet-growth-sheet"><p class="eyebrow">星伴培養</p><h3>'+esc(definition.name)+'</h3><p>'+esc(definition.description)+'</p><div class="pet-growth-level"><strong>Lv.'+m.level+' <small>/ 25</small></strong><span>'+esc(m.assigned)+'</span></div><progress max="'+m.required+'" value="'+(m.capped?m.required:Math.min(m.required,m.exp))+'" aria-label="星伴升級經驗"></progress><p>'+(m.capped?'已達目前等級上限':m.exp+' / '+m.required+' 經驗 · 還需 '+Math.max(0,m.required-m.exp))+'</p><h4>戰鬥能力'+(p&&p.resonance?' · 共鳴生效':'')+'</h4><ul class="pet-growth-stats">'+stats+skill+'</ul><p>'+esc((system.configs.find(function(c){return c.id===definition.id;})||{}).description||'')+'</p><small>效果依目前配屬角色計算；任何角色都能裝備。'+(m.legacyLevel?'舊等級紀錄保留，實戰以25級計算。':'')+'</small><p class="pet-growth-closed">覺醒／突破尚未開放</p><button class="secondary-action" type="button" data-scene-to="pet-banner-view">調整戰鬥配屬 →</button></div></section>';
 }
 root.StarshipPetGrowthUI={model:model,markup:markup};
}(typeof window!=='undefined'?window:globalThis));
