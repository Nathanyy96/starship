(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.StarshipWorldCheckpoint=api;}(globalThis,function(){
 'use strict';
 var maps=['village','road','city','south','mistbridge','echo','relic','banksWest','banksEast','bellcourt','northRoad','factoryNear','factoryFar','rescue','cityInn','mistInn','recovery','clinic','observatory','station','roadShelter','southStation','riverRoad','lotin'];
 function clean(value){
  if(!value||value.version!==1||!['world','opening','village'].includes(value.kind)||!value.state)return null;
  var p=value.state;if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>10000||Math.abs(p.y)>10000)return null;
  var s={x:p.x,y:p.y};
  if(value.kind==='world'){if(!maps.includes(p.map))return null;Object.assign(s,{version:1,geometryVersion:3,map:p.map,act:[2,3,4,5,11,12,13,14,15].includes(p.act)?p.act:2,index:Math.max(0,Math.min(100,Math.floor(p.index)||0)),roaming:p.roaming!==false,visited:Array.isArray(p.visited)?p.visited.filter(x=>typeof x==='string').slice(0,120):[],waypoints:Array.isArray(p.waypoints)?p.waypoints.filter(x=>typeof x==='string').slice(0,40):[]});}
  if(value.kind==='opening'){if(!['valley','forest'].includes(p.zone))return null;Object.assign(s,{zone:p.zone,index:Math.max(0,Math.min(9,Math.floor(p.index)||0))});}
  if(value.kind==='village')Object.assign(s,{mapVersion:2,storyVersion:1,arrived:p.arrived===true,storyStep:Math.max(0,Math.min(20,Math.floor(p.storyStep)||0)),discovered:Array.isArray(p.discovered)?p.discovered.filter(x=>typeof x==='string').slice(0,40):[]});
  return {version:1,kind:value.kind,state:s,updatedAt:Number.isFinite(value.updatedAt)?value.updatedAt:0};
 }
 return {clean:clean};
}));
