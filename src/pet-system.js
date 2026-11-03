(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StarshipPetSystem=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 var configs=[
  {id:'star-fox',name:'星絨狐',stats:['attack'],partner:'celesia',skill:'星光應援',kind:'stats',description:'提高配屬角色的攻擊。'},
  {id:'tide-otter',name:'潮泡獸',stats:['maxHp'],partner:'lia',skill:'潮泡回復',kind:'self-heal',rate:.015,description:'提高生命；每3回合回復配屬角色的生命。'},
  {id:'wind-bird',name:'風鈴雀',stats:['speed'],partner:'hina',skill:'風鈴先聲',kind:'stats',description:'提高速度，影響實際出手順序。'},
  {id:'mirror-sprout',name:'霧鏡芽',stats:['defense'],partner:'siyeon',skill:'霧鏡護幕',kind:'self-shield',rate:.06,description:'提高防禦；開場為配屬角色提供護盾。'},
  {id:'aurora-fawn',name:'極光幼鹿',stats:['maxHp'],partner:'magenta',skill:'極光扶助',kind:'ally-heal',rate:.012,description:'提高生命；每3回合治療生命比例最低的存活隊友。'},
  {id:'rune-drake',name:'符文幼龍',stats:['attack','defense'],partner:'chodan',skill:'符文共鳴',kind:'stats',description:'同時提高配屬角色的攻擊與防禦。'},
  {id:'cloud-whale',name:'雲潮鯨',stats:['defense'],partner:'elorna',skill:'雲潮庇護',kind:'team-shield',rate:.015,description:'提高防禦；開場為全體隊友提供護盾。'}
 ];
 configs.forEach(function(c){c.rarity=3;});
 var fourStarDefinitions=[['celesia-white-cat','星紗白貓','celesia','mark-echo',['attack'],.04],['chodan-puppy','月拍小犬','chodan','shield-echo',['maxHp'],.01],['magenta-fox','緋音狐','magenta','reaction-buff',['attack'],.03],['hina-cat','風弦灰貓','hina','wind-echo',['attack'],.04],['siyeon-hamster','暖歌倉鼠','siyeon','position-heal',['maxHp'],.06]].map(function(v){var d={id:v[0],name:v[1],rarity:4,maxLevel:25,image:'./assets/pets/'+v[0]+'.png',temperament:'同行',description:({ 'mark-echo':'隊友主動命中裝備者建立的標記後，追加裝備者攻擊4%的星伴傷害。','shield-echo':'裝備者給予的護盾實際吸收敵傷後，為原受盾者補充裝備者生命1%的盾。','reaction-buff':'裝備者灼印或主動風傷觸發交鳴後，下次主動命中增傷3%。','wind-echo':'裝備者主動風傷觸發交鳴後，追加裝備者攻擊4%的星伴傷害。','position-heal':'後排每3回合治療最低血前排，回復裝備者生命6%；前排時對後排治療提高10%。'})[v[3]]};configs.push({id:v[0],name:v[1],rarity:4,stats:v[4],partner:v[2],skill:v[1]+'同行',kind:v[3],rate:v[5],description:d.description});return d;});
 var banner={id:'legacy-pets-1',name:'限定｜星紗與合奏',poolKey:'companion-shared',cost:120,hardPity:50,members:configs.map(function(c){return c.id;}),featured:fourStarDefinitions.map(function(c){return c.id;}),baseRate:.01,growth:1.06,featuredRate:.55,threeStarRate:.2,materialReward:1},labels={maxHp:'生命',attack:'攻擊',defense:'防禦',speed:'速度'};
 function clone(v){return JSON.parse(JSON.stringify(v));}function assert(ok,message){if(!ok)throw new Error(message);}function config(id){return configs.find(function(c){return c.id===id;});}
 function initial(){return {version:1,revision:0,totalPulls:0,pityGroups:{'companion-shared':0},targets:{'legacy-pets-1':'celesia-white-cat'},guaranteed:false,constellations:{},marks:{lower:0,upper:0},fragments:{},ranks:{},assignments:{},history:[]};}
 function normalize(input,state){
  input=input&&typeof input==='object'?input:{};state=state||{};var out=initial(),pets=state.petProgress&&state.petProgress.pets||{},occupied=new Set();
  out.revision=Number.isSafeInteger(input.revision)&&input.revision>=0?input.revision:0;out.totalPulls=Number.isSafeInteger(input.totalPulls)&&input.totalPulls>=0?input.totalPulls:0;
  var pity=input.pityGroups&&input.pityGroups[banner.poolKey];out.pityGroups[banner.poolKey]=Number.isInteger(pity)&&pity>=0&&pity<banner.hardPity?pity:0;
  var target=input.targets&&input.targets[banner.id];if(config(target)&&config(target).rarity===4)out.targets[banner.id]=target;out.guaranteed=input.guaranteed===true;['lower','upper'].forEach(function(k){out.marks[k]=Number.isSafeInteger(input.marks&&input.marks[k])?Math.max(0,input.marks[k]):0;});
  configs.forEach(function(c){
   var constellation=input.constellations&&input.constellations[c.id];out.constellations[c.id]=Number.isInteger(constellation)&&constellation>=0&&constellation<=4?constellation:0;
   var fragments=input.fragments&&input.fragments[c.id],rank=input.ranks&&input.ranks[c.id],cardId=input.assignments&&input.assignments[c.id];
   out.fragments[c.id]=Number.isSafeInteger(fragments)&&fragments>=0?fragments:0;
   if(pets[c.id]&&pets[c.id].owned!==false){out.ranks[c.id]=Number.isInteger(rank)&&rank>=1&&rank<=5?rank:1;if(typeof cardId==='string'&&state.collection&&state.collection[cardId]>0&&!occupied.has(cardId)){out.assignments[c.id]=cardId;occupied.add(cardId);}}
  });
  out.history=(Array.isArray(input.history)?input.history:[]).filter(function(h){return h&&(config(h.petId)||(h.kind==='material'&&h.materialId==='pet-food'))&&Number.isSafeInteger(h.pull)&&h.pull>0;}).slice(-100).map(function(h){if(h.kind==='material'&&h.materialId==='pet-food')return {kind:'material',materialId:'pet-food',name:'星伴飼料',amount:1,reward:{petFood:1},petId:null,pull:h.pull,duplicate:false,hardPity:false,rarity:0,featured:false,constellation:null,at:typeof h.at==='string'?h.at:''};return {kind:'pet',petId:h.petId,pull:h.pull,duplicate:Boolean(h.duplicate),hardPity:Boolean(h.hardPity),rarity:config(h.petId).rarity,featured:Boolean(h.featured),constellation:Number(h.constellation)||0,at:typeof h.at==='string'?h.at:''};});return out;
 }
 function owned(state,id){return Boolean(state.petProgress&&state.petProgress.pets&&state.petProgress.pets[id]&&state.petProgress.pets[id].owned!==false);}
 function action(original,options,rng,now){
  options=options||{};assert(options.action!=='awaken'&&options.action!=='breakthrough','星伴覺醒與突破尚未開放');var current=normalize(original.petSummon,original);assert(Number.isSafeInteger(options.expectedRevision)&&options.expectedRevision===current.revision,'星伴資料已變更，請同步後重試');
  assert(options.bannerId===banner.id,'星伴召集池尚未開放');var state=clone(original),s=normalize(current,state),results=[],spent=0;
  if(options.action==='draw'){
   assert(options.count===1||options.count===10,'星伴召集只接受單次或十次');spent=options.count*banner.cost;
   assert(state.resources&&Number.isSafeInteger(state.resources.starSand)&&state.resources.starSand>=spent,'星砂不足，需要 '+spent);
   state.resources.starSand-=spent;
   for(var i=0;i<options.count;i++){
    var counter=s.pityGroups[banner.poolKey],hard=counter>=banner.hardPity-1,target=s.targets[banner.id],petId=null;
    function random(){var n=(rng||Math.random)();assert(Number.isFinite(n)&&n>=0&&n<1,'星伴隨機值無效');return n;}
    var gold=hard||random()<getRate(counter+1),featured=false;
    if(gold){featured=s.guaranteed||random()<banner.featuredRate;var pool=featured?[target]:banner.featured.filter(function(id){return id!==target;});petId=pool[Math.floor(random()*pool.length)];s.guaranteed=!featured;s.pityGroups[banner.poolKey]=0;}
    else{if(random()<banner.threeStarRate){var pool=configs.filter(function(c){return c.rarity===3;});petId=pool[Math.floor(random()*pool.length)].id;}s.pityGroups[banner.poolKey]=counter+1;}
    s.totalPulls++;var result;
    if(petId){var duplicate=owned(state,petId),constellation=s.constellations[petId]||0;
      if(duplicate){if(constellation<4)s.constellations[petId]=constellation+1;else s.marks[config(petId).rarity===4?'upper':'lower']++;}
      else{state.petProgress.pets[petId]={owned:true,level:1,exp:0,bond:0,mood:80,training:{care:0,play:0,focus:0}};s.ranks[petId]=1;s.constellations[petId]=0;}
      result={kind:'pet',petId:petId,pull:s.totalPulls,duplicate:duplicate,rarity:config(petId).rarity,featured:featured,constellation:s.constellations[petId],hardPity:hard,at:typeof now==='function'?now():new Date().toISOString()};
    }else{var food=state.petProgress.resources.petFood;assert(Number.isSafeInteger(food)&&food>=0&&food<Number.MAX_SAFE_INTEGER,'星伴飼料數量無效');state.petProgress.resources.petFood+=banner.materialReward;result={kind:'material',materialId:'pet-food',name:'星伴飼料',amount:1,reward:{petFood:1},petId:null,pull:s.totalPulls,duplicate:false,rarity:0,featured:false,constellation:null,hardPity:false,at:typeof now==='function'?now():new Date().toISOString()};}
    s.history.push(result);results.push(clone(result));
   }
  }else if(options.action==='target'){
   assert(config(options.petId)&&config(options.petId).rarity===4,'請選擇限定四星星伴');s.targets[banner.id]=options.petId;
  }else if(options.action==='assign'){
   assert(config(options.petId)&&owned(state,options.petId),'尚未擁有這隻星伴');assert(typeof options.cardId==='string'&&state.collection&&state.collection[options.cardId]>0,'只能配屬已取得的角色');
   Object.keys(s.assignments).forEach(function(id){if(s.assignments[id]===options.cardId)delete s.assignments[id];});s.assignments[options.petId]=options.cardId;
  }else if(options.action==='unassign'){
   assert(config(options.petId)&&s.assignments[options.petId],'星伴尚未配屬');delete s.assignments[options.petId];
  }else if(options.action==='awaken'){
   assert(config(options.petId)&&owned(state,options.petId),'尚未擁有這隻星伴');var rank=s.ranks[options.petId]||1,price=rank*20;
   assert(rank<5,'星伴已達覺醒上限');assert(s.fragments[options.petId]>=price,'專屬碎片不足，需要 '+price);s.fragments[options.petId]-=price;s.ranks[options.petId]=rank+1;
  }else throw new Error('找不到星伴召集操作');
  s.revision++;s.history=s.history.slice(-100);state.petSummon=s;return {state:state,results:results,cost:spent};
 }
 function support(state,petId,cardId){
  var c=config(petId);if(!c||!owned(state,petId))return null;var s=normalize(state.petSummon,state),pet=state.petProgress.pets[petId],level=Math.max(1,Math.min(25,Number(pet.level)||1)),rank=1,constellation=s.constellations[petId]||0,resonance=false,mult=1;
  var rate=(c.stats.length===2?.02+.0005*(level-1)+.005*(rank-1):.03+.001*(level-1)+.01*(rank-1))*mult;
  if(c.rarity===4)rate=.04+.00075*(level-1);rate+=constellation*.002;
  return {id:c.id,name:c.name,rarity:c.rarity,constellation:constellation,level:level,rank:rank,resonance:resonance,stats:c.stats.slice(),statRate:rate,skill:c.skill,kind:c.kind,skillRate:(c.rate||0)*(1+.002*(level-1)+.025*constellation)*mult};
 }
 function apply(stats,state){
  var s=normalize(state&&state.petSummon,state);Object.keys(s.assignments).forEach(function(petId){var id=s.assignments[petId],unit=stats[id],p=support(state,petId,id);if(!unit||!p)return;p.stats.forEach(function(key){unit[key]=Math.round(unit[key]*(1+p.statRate));});unit.companion=p;});return stats;
 }
 function opening(team,logs,shield){
  team.forEach(function(owner){var p=owner.companion;if(!p||owner.hp<=0)return;logs.push('星伴 '+p.name+' 與 '+owner.name+' 同行：'+p.skill+(p.resonance?'（專屬共鳴）':'')+'。');
   if(p.kind==='self-shield'||p.kind==='team-shield'){
    (p.kind==='self-shield'?[owner]:team.filter(function(u){return u.hp>0;})).forEach(function(target){var before=target.shield||0;shield(target,target.maxHp*p.skillRate);var gained=(target.shield||0)-before;if(gained>0)logs.push(p.name+' 為 '+target.name+' 提供 '+gained+' 護盾。');});
   }
  });
 }
 function round(team,index,logs,heal){
  if(index%3)return;team.forEach(function(owner){var p=owner.companion;if(!p||owner.hp<=0||(p.kind!=='self-heal'&&p.kind!=='ally-heal'&&p.kind!=='position-heal'))return;
   if(p.kind==='position-heal'&&owner.row!=='back')return;var target=owner;if(p.kind==='position-heal')target=team.filter(function(u){return u.hp>0&&u.row==='front';}).sort(function(a,b){return a.hp/a.maxHp-b.hp/b.maxHp;})[0];if(p.kind==='ally-heal')target=team.filter(function(u){return u.hp>0;}).sort(function(a,b){return a.hp/a.maxHp-b.hp/b.maxHp;})[0];
   if(!target||target.hp<=0)return;var amount=heal(target,(p.kind==='position-heal'?owner.maxHp:target.maxHp)*p.skillRate);if(amount>0)logs.push(p.name+' 的'+p.skill+'替 '+target.name+' 回復 '+amount+' HP。');
  });
 }
 function getRate(pull){return pull>=50?1:Math.min(.99,banner.baseRate*Math.pow(banner.growth,Math.max(0,pull-1)));}
 function trigger(owner,kind,round){var p=owner&&owner.companion;if(!p||owner.hp<=0||p.kind!==kind||owner.petTriggerRound===round)return 0;owner.petTriggerRound=round;return p.skillRate;}
 return {trigger:trigger,fourStarDefinitions:fourStarDefinitions,getRate:getRate,configs:configs,banner:banner,statLabels:labels,initial:initial,normalize:normalize,action:action,support:support,apply:apply,opening:opening,round:round};
}));
