(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StarshipSaveMigration=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 var retired=['worldPosition','worldWaypoints','worldProgress','worldCheckpoints','teleportPoints','unlockedWaypoints','explorationProgress','exploration','firstActProgress','firstMajorWorld','worldStoryStatus'];
 function apply(state){retired.forEach(function(k){delete state[k];});if(state.storyProgress){state.storyProgress={claimedVersions:state.storyProgress.claimedVersions||{}};}state.saveSchema='hub-20261102';return state;}
 function cleanBrowser(storage){var prefixes=['starship-world-home','starship-world-waypoints','starship-first-act-game','starship-first-major-world','starship-exploration-test','starship-explorer:'];var keys=[];for(var i=0;i<storage.length;i++){var key=storage.key(i);if(prefixes.some(function(p){return key.indexOf(p)===0;}))keys.push(key);}keys.forEach(function(key){storage.removeItem(key);});return keys.length;}
 return {apply:apply,cleanBrowser:cleanBrowser,retiredKeys:retired};
}));
