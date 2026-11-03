(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StarshipCompanionPerformance=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
var definitions=[
{id:'celesia-white-cat',owner:'celesia',name:'繫星',animal:'白貓',event:'ally-marked-hit',kind:'damage',basis:'attack',rate:.04},
{id:'chodan-puppy',owner:'chodan',name:'月扣',animal:'小狗',event:'shield-applied',kind:'shield',basis:'maxHp',rate:.01},
{id:'magenta-fox',owner:'magenta',name:'燼拍',animal:'狐狸',event:'reaction',kind:'next-attack-rate',basis:'rate',rate:.03},
{id:'hina-cat',owner:'hina',name:'逐音',animal:'灰貓',event:'ally-marked-hit',kind:'damage',basis:'attack',rate:.035},
{id:'siyeon-hamster',owner:'siyeon',name:'暖音',animal:'倉鼠',event:'round-start',kind:'heal-front',basis:'maxHp',rate:.15,interval:3,needsReview:true},
{id:'veyra-ray',owner:'veyra',name:'環汐',animal:'潮紋魟',event:'armor-break',kind:'next-attack-rate',basis:'rate',rate:.03},
{id:'harlow-badger',owner:'harlow',name:'守燈',animal:'岩背獾',event:'escort-damage',kind:'self-heal',basis:'maxHp',rate:.01},
{id:'elorna-jellyfish',owner:'elorna',name:'浮汐',animal:'水母',event:'summon-hit',kind:'damage',basis:'attack',rate:.025},
{id:'eda-cat',owner:'eda',name:'澄點',animal:'星紋貓',event:'cleanse-success',kind:'shield',basis:'maxHp',rate:.01},
{id:'mave-moth',owner:'mave',name:'眠光',animal:'夢眼蛾',event:'enemy-skill-delayed',kind:'next-attack-rate',basis:'rate',rate:.03},
{id:'rovienne-fawn',owner:'rovienne',name:'返曜',animal:'銀角鹿',event:'self-hp-cost',kind:'shield',basis:'maxHp',rate:.008}
];
function profile(id,level,constellation){var d=definitions.find(function(p){return p.id===id;});if(!d)throw Error('Unknown companion');if(!Number.isInteger(level)||level<1||level>25||!Number.isInteger(constellation)||constellation<0||constellation>4)throw Error('Invalid development');var factor=1+.002*(level-1)+.025*constellation;return Object.assign({},d,{nativeRarity:4,level:level,constellation:constellation,rate:d.rate*factor,maxTriggersPerRound:1,resonanceRate:.05,enabled:false});}
function evaluate(profile,event,memory){if(!profile||!definitions.some(function(d){return d.id===profile.id;}))throw Error('Invalid profile');if(!Number.isInteger(event.round)||event.round<1)throw Error('Invalid round');var next=Object.assign({},memory),key=profile.id+':'+event.ownerInstance; if(event.source==='companion'||event.ownerAlive===false||event.targetAlive===false||event.type!==profile.event||profile.interval&&event.round%profile.interval!==0||next[key]===event.round)return {memory:next,effects:[]};
var basis=profile.basis==='rate'?1:event[profile.basis];if(!Number.isFinite(basis)||basis<0)throw Error('Invalid stat basis');var rate=profile.rate*(event.characterId===profile.owner?1+profile.resonanceRate:1);next[key]=event.round;
var effect={kind:profile.kind,amount:profile.basis==='rate'?rate:Math.round(basis*rate),source:'companion',canTriggerCompanion:false,stacking:'refresh-only',duration:1};
if(profile.owner==='siyeon'){if(event.row==='front')effect={kind:'outgoing-healing-to-back-rate',amount:.2,source:'companion',canTriggerCompanion:false,stacking:'refresh-only',duration:1};else effect.attackRate=.02;}
return {memory:next,effects:[effect]};}
return {definitions:definitions,profile:profile,evaluate:evaluate};
}));
