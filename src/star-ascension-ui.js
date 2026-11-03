(function(root){
 'use strict';var model=root.StarshipStarAscension;
 function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
 function panel(card,state){var p=model.plan(state,card),s=model.normalize(state.starAscension),owned=state.collection[card.id]>0;
  var head='<section class="star-ascension-panel"><p class="eyebrow">STAR ASCENSION</p><div class="star-ascension-heading"><h4>星階合成</h4><strong aria-label="目前'+p.stars+'星">'+'★'.repeat(p.stars)+'</strong></div><p>原生'+card.rarity+'星 · '+(card.rarity===3&&card.id!=='isar'?'最高四星':card.id==='isar'?'伊薩爾專屬路線 · 最高六星':'最高六星')+' · 等級上限 '+p.levelCap+' · 命座維持 C'+((state.characterProgress[card.id]||{}).constellation||0)+'</p><div class="star-mark-balances"><span>4–5星突破印記 <b>'+s.marks.lower+'</b></span><span>5–6星突破印記 <b>'+s.marks.upper+'</b></span></div>';
  if(!owned)head+='<p>取得角色後即可使用共用印記合成升星。</p>';
  else if(!p.nextStars)head+='<p class="star-ascension-capped">已達此角色星級上限。</p>';
  else{
   var projected=JSON.parse(JSON.stringify(state));projected.starAscension=model.normalize(state.starAscension);projected.starAscension.characters[card.id]=p.nextStars;
   var stats=root.StarshipGachaData.characterBattleStats,before=root.StarshipBattle.buildEffectiveStats(stats,state)[card.id],after=root.StarshipBattle.buildEffectiveStats(stats,projected)[card.id];
   head+='<details class="star-ascension-preview"><summary>預覽 '+p.stars+' → '+p.nextStars+' 星'+(p.nextStars===6?'上限突破':'合成')+'</summary><p>消耗 '+p.cost+' 枚'+p.label+'（全角色共用），目前 '+p.available+' 枚。</p><div class="star-stat-preview">'+[['maxHp','生命'],['attack','攻擊'],['defense','防禦'],['speed','速度']].map(function(row){return '<span>'+row[1]+'<strong>'+before[row[0]].toLocaleString()+' <i>→</i> '+after[row[0]].toLocaleString()+'</strong></span>';}).join('')+'</div><p>等級上限 '+p.levelCap+' → '+p.nextLevelCap+' 等。升星不自動升級，仍需消耗角色經驗；80等突破材料要求保留。</p><p>保留等級、命座、造型、裝備與星伴，不消耗角色本體。</p><button class="primary-action" type="button" data-star-ascend="'+esc(card.id)+'" '+(p.available<p.cost?'disabled':'')+'>'+(p.available<p.cost?'印記不足：需要 '+p.cost+' 枚':'消耗 '+p.cost+' 枚 · '+(p.nextStars===6?'突破':'合成升至')+p.nextStars+'星')+'</button></details>';
  }
  return head+'<p class="star-ascension-message" role="status" aria-live="polite"></p><details class="star-ascension-rules"><summary>印記取得與升星規則</summary><p>角色抽取前已C6，再抽到原生三星額外給1枚4–5星印記；原生四星額外給1枚5–6星印記，原獎勵保留。剛升至C6的那一抽不給印記。</p><p>3→4星用1枚低階印記；4→5星用2枚低階印記；5→6星用1枚高階印記。升星對象不必滿命，兩種材料全角色共用。一般原生三星止於四星，伊薩爾與原生四星可達六星。</p><p>升星提升基礎生命、攻擊、防禦，逐階加5%／6%／8%；三星升四星、原生四星升五星後可升至95等，六星可升至100等。速度、命座技能及原生卡池機率維持原規則。升星後原生三星仍產低階印記。材料從本系統啟用後的新抽取累積，舊紀錄暫不追補。</p></details></section>';
 }
 root.StarshipStarAscensionUI={panel:panel};
}(window));
