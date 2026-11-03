(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StarshipStarAscension=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 var labels={lower:'4–5星突破印記',upper:'5–6星突破印記'},rates={4:1.05,5:1.06,6:1.08};
 function initial(){return {version:1,revision:0,marks:{lower:0,upper:0},characters:{}};}
 function maxStars(card){return card&&card.rarity===4||card&&card.id==='isar'?6:4;}
 function validInt(n){return Number.isSafeInteger(n)&&n>=0;}
 function normalize(input,collection,cards){input=input&&typeof input==='object'?input:{};var out=initial();out.revision=validInt(input.revision)?input.revision:0;
  ['lower','upper'].forEach(function(k){var n=input.marks&&input.marks[k];out.marks[k]=validInt(n)?n:0;});
  Object.keys(input.characters||{}).forEach(function(id){var n=input.characters[id],card=cards&&cards[id];if(!Number.isInteger(n)||n<3||n>6||collection&&!(collection[id]>0)||cards&&(!card||n<card.rarity||n>maxStars(card)))return;out.characters[id]=n;});return out;
 }
 function stars(state,card){var n=state&&state.starAscension&&state.starAscension.characters&&state.starAscension.characters[card.id];return Number.isInteger(n)&&n>=card.rarity&&n<=maxStars(card)?n:card.rarity;}
 function multiplier(native,rank){var value=1;for(var n=native+1;n<=rank;n++)value*=rates[n]||1;return value;}
 function levelCap(state,card,baseMax){var rank=stars(state,card);return rank===6?100:rank>card.rarity?95:(baseMax||90);}
 function plan(state,card){var s=normalize(state.starAscension),rank=stars(state,card),max=maxStars(card),key=rank===5?'upper':'lower',cost=rank===4?2:1;return {cardId:card.id,nativeStars:card.rarity,stars:rank,maxStars:max,nextStars:rank<max?rank+1:null,key:key,cost:cost,available:s.marks[key],label:labels[key],multiplier:multiplier(card.rarity,rank),nextMultiplier:multiplier(card.rarity,rank+1),levelCap:levelCap(state,card),nextLevelCap:rank+1===6?100:95};}
 function grantOverflow(state,card,wasMax){if(!card||!wasMax||(card.rarity!==3&&card.rarity!==4))return null;var s=normalize(state.starAscension),key=card.rarity===3?'lower':'upper';if(s.marks[key]>=Number.MAX_SAFE_INTEGER)throw new Error('突破印記已達儲存上限');s.marks[key]++;s.revision++;state.starAscension=s;return {key:key,amount:1};}
 function action(original,options,cards){options=options||{};var s=normalize(original.starAscension,original.collection,cards),card=cards[options.cardId];function assert(ok,msg){if(!ok)throw new Error(msg);}
  assert(Number.isSafeInteger(options.expectedRevision)&&options.expectedRevision===s.revision,'升星資料已變更，請同步後重試');assert(card&&original.collection&&original.collection[card.id]>0,'只能升星已取得的角色');
  var p=plan(Object.assign({},original,{starAscension:s}),card);assert(p.nextStars,'角色已達星級上限');assert(s.marks[p.key]>=p.cost,p.label+'不足，需要 '+p.cost+' 枚');
  var state=JSON.parse(JSON.stringify(original));s.marks[p.key]-=p.cost;s.characters[card.id]=p.nextStars;s.revision++;state.starAscension=s;return {state:state,cardId:card.id,previousStars:p.stars,stars:p.nextStars,cost:p.cost,mark:p.key};
 }
 function apply(stats,state){Object.keys(stats).forEach(function(id){var unit=stats[id],card={id:id,rarity:unit.rarity};if(card.rarity!==3&&card.rarity!==4)return;var rank=stars(state,card);if(rank===card.rarity)return;var factor=multiplier(card.rarity,rank);['maxHp','attack','defense'].forEach(function(k){unit[k]=Math.round(unit[k]*factor);});unit.starRank=rank;unit.nativeStars=card.rarity;});return stats;}
 return {initial:initial,normalize:normalize,stars:stars,maxStars:maxStars,levelCap:levelCap,plan:plan,action:action,apply:apply,grantOverflow:grantOverflow,labels:labels,multiplier:multiplier};
}));
