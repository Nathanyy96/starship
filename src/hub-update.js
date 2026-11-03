(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StarshipHubUpdate=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){'use strict';
var cycle='hub-release-20261102',reward={starSand:3200,characterExp:100000};
function apply(state){state.updateRewards=state.updateRewards||{claimedVersions:{}};state.updateRewards.claimedVersions=state.updateRewards.claimedVersions||{};if(state.updateRewards.claimedVersions[cycle])return state;Object.keys(reward).forEach(function(k){state.resources[k]=(state.resources[k]||0)+reward[k];});state.updateRewards.claimedVersions[cycle]={reward:reward,reason:'更新獎勵與遊戲回歸補償合併發放',grantedAt:new Date().toISOString()};return state;}
return {cycle:cycle,reward:reward,apply:apply};
}));
