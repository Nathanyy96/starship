(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StarshipEquipment=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var slots=[{id:'core',name:'星核',stat:'maxHp',base:48,icon:'✦'},{id:'plume',name:'羽飾',stat:'attack',base:6,icon:'❧'},{id:'dial',name:'時輪',stat:'defense',base:5,icon:'◷'},{id:'chalice',name:'聖杯',stat:'maxHp',base:48,icon:'♜'},{id:'crown',name:'冠冕',stat:'attack',base:6,icon:'♛'},{id:'sigil',name:'徽印',stat:'speed',base:1,icon:'◇'}];
  var sets=[{id:'voyager',name:'遠行者',bonuses:[{stat:'attack',rate:.02},{stat:'maxHp',rate:.03},{stat:'defense',rate:.04}]},{id:'sentinel',name:'守望者',bonuses:[{stat:'maxHp',rate:.02},{stat:'defense',rate:.03},{stat:'attack',rate:.04}]},{id:'swift',name:'疾行者',bonuses:[{stat:'defense',rate:.02},{stat:'attack',rate:.03},{stat:'speed',rate:.04}]}];
  var rates=[[65,28,7],[45,40,15],[25,50,25]],names=['普通','稀有','珍藏'],labels={maxHp:'生命',attack:'攻擊',defense:'防禦',speed:'速度'};
  function assert(ok,message){if(!ok)throw new Error(message);}
  function initial(){return {version:2,revision:0,nextId:1,items:[],lastDrop:null,bossReceipts:[]};}
  function slotById(id){return slots.find(function(s){return s.id===id;});}
  function setById(id){return sets.find(function(s){return s.id===id;});}
  function normalize(input,collection){
    var out=initial(),seen=new Set(),occupied=new Set();if(!input||typeof input!=='object')return out;
    out.revision=Number.isSafeInteger(input.revision)&&input.revision>=0?input.revision:0;
    out.nextId=Number.isSafeInteger(input.nextId)&&input.nextId>0?input.nextId:1;
    out.bossReceipts=(Array.isArray(input.bossReceipts)?input.bossReceipts:[]).filter(function(r){return r&&typeof r.id==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(r.id)&&typeof r.bossId==='string';}).slice(-256).map(function(r){return {id:r.id,bossId:r.bossId};});
    (Array.isArray(input.items)?input.items:[]).forEach(function(raw){
      if(!raw||typeof raw!=='object'||typeof raw.id!=='string'||!/^relic-[1-9]\d*$/.test(raw.id)||seen.has(raw.id)||!slotById(raw.slot)||!setById(raw.setId)||!Number.isInteger(raw.rarity)||raw.rarity<1||raw.rarity>5)return;
      var idNumber=Number(raw.id.slice(6));if(!Number.isSafeInteger(idNumber)||idNumber>=Number.MAX_SAFE_INTEGER)return;
      var item=Object.assign({},raw);if(input.version!==2){item.legacyRarity=raw.rarity;item.rarity=raw.rarity===1?1:raw.rarity<=3?2:3;}else if(raw.rarity>3)return;item.level=Number.isInteger(raw.level)?Math.max(0,Math.min(20,raw.level)):0;
      item.equippedBy=typeof raw.equippedBy==='string'&&raw.equippedBy&&(!collection||collection[raw.equippedBy]>0)?raw.equippedBy:null;
      if(item.equippedBy){var key=item.equippedBy+':'+item.slot;if(occupied.has(key))item.equippedBy=null;else occupied.add(key);}
      seen.add(raw.id);out.items.push(item);out.nextId=Math.max(out.nextId,idNumber+1);
    });
    if(input.lastDrop&&out.items.some(function(i){return i.id===input.lastDrop.id;}))out.lastDrop=Object.assign({},out.items.find(function(i){return i.id===input.lastDrop.id;}));
    return out;
  }
  function getRates(bossLevel){return rates[Math.max(0,Math.min(2,(Number(bossLevel)||1)-1))|0].slice();}
  function random(rng){var n=(rng||Math.random)();assert(Number.isFinite(n)&&n>=0&&n<1,'裝備隨機值無效');return n;}
  function roll(source,rng){
    var table=getRates(source.difficulty||source.bossLevel),n=random(rng)*100,rarity=3,cumulative=0;
    for(var i=0;i<table.length;i++){cumulative+=table[i];if(n<cumulative){rarity=i+1;break;}}
    var item={slot:slots[Math.floor(random(rng)*slots.length)].id,setId:sets[Math.floor(random(rng)*sets.length)].id,rarity:rarity,level:0,equippedBy:null};item[source.kind==='equipment-dungeon'?'sourceDungeonId':'sourceBossId']=String(source.id);return item;
  }
  function grantDrop(state,source,rng){
    assert(source&&typeof source.id==='string','缺少裝備掉落來源');var next=normalize(state.equipment,state.collection),item=roll(source,rng);
    item.id='relic-'+next.nextId++;next.items.push(item);next.lastDrop=Object.assign({},item);next.revision++;state.equipment=next;return Object.assign({},item);
  }
  function value(item){var slot=slotById(item.slot);return slot?Math.round(slot.base*item.rarity*(1+.015*item.level)):0;}
  function name(item){var s=slotById(item.slot),set=setById(item.setId);return set&&s?set.name+'・'+s.name:'未知裝備';}
  function cost(item){return item.level>=20?null:120*item.rarity*(item.level+1);}
  function action(state,options){
    options=options||{};var next=normalize(state.equipment,state.collection);
    assert(Number.isSafeInteger(options.expectedRevision)&&options.expectedRevision===next.revision,'裝備資料已變更，請同步後重試');
    var item=next.items.find(function(i){return i.id===options.itemId;});assert(item,'找不到這件裝備');
    if(options.action==='equip'){
      assert(typeof options.cardId==='string'&&state.collection&&state.collection[options.cardId]>0,'只能為已取得的角色裝備');
      next.items.forEach(function(other){if(other.slot===item.slot&&other.equippedBy===options.cardId)other.equippedBy=null;});item.equippedBy=options.cardId;
    }else if(options.action==='unequip'){assert(item.equippedBy,'這件裝備尚未穿戴');item.equippedBy=null;
    }else if(options.action==='upgrade'){
      var price=cost(item);assert(price!==null,'裝備已達強化上限');assert(state.resources&&Number.isSafeInteger(state.resources.characterExp)&&state.resources.characterExp>=price,'角色經驗不足，需要 '+price);
      state.resources.characterExp-=price;item.level++;
    }else throw new Error('找不到裝備操作');
    if(next.lastDrop){var latest=next.items.find(function(i){return i.id===next.lastDrop.id;});next.lastDrop=latest?Object.assign({},latest):null;}
    next.revision++;state.equipment=next;return {item:Object.assign({},item),cost:options.action==='upgrade'?price:0};
  }
  function bonuses(state,cardId){
    var result={flat:{maxHp:0,attack:0,defense:0,speed:0},percent:{maxHp:0,attack:0,defense:0,speed:0},sets:[]};
    if(!state||!state.collection||!(state.collection[cardId]>0))return result;
    var counts={};normalize(state.equipment,state.collection).items.forEach(function(item){if(item.equippedBy!==cardId)return;result.flat[slotById(item.slot).stat]+=value(item);counts[item.setId]=(counts[item.setId]||0)+1;});
    sets.forEach(function(set){var count=counts[set.id]||0;if(!count)return;result.sets.push({id:set.id,name:set.name,count:count});set.bonuses.forEach(function(b,i){if(count>=(i+1)*2)result.percent[b.stat]+=b.rate;});});return result;
  }
  function apply(stats,state){
    Object.keys(stats||{}).forEach(function(id){var b=bonuses(state,id);Object.keys(b.flat).forEach(function(key){if(b.percent[key]||b.flat[key])stats[id][key]=Math.round((Number(stats[id][key])||0)*(1+b.percent[key])+b.flat[key]);});});return stats;
  }
  return {slots:slots,sets:sets,rarityNames:names,statLabels:labels,initial:initial,normalize:normalize,getRates:getRates,roll:roll,grantDrop:grantDrop,grantBossDrop:grantDrop,value:value,name:name,cost:cost,action:action,bonuses:bonuses,apply:apply};
}));
