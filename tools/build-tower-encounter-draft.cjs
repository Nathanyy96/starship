const fs=require('node:fs'),catalog=JSON.parse(fs.readFileSync('docs/design-20261102/regional-bestiary-v1.json','utf8')).monsters;
const regions=[...new Set(catalog.filter(m=>m.region!=='廣域與多區').map(m=>m.region))],stages=[];
function pool(region,tier){return catalog.filter(m=>m.region===region&&m.tier===tier);}
for(let floor=1;floor<=100;floor++){
 const region=regions[(floor-1)%6],low=pool(region,'低'),mid=pool(region,'中'),high=pool(region,'高'),boss=pool(region,'首領'),i=Math.floor((floor-1)/6),get=(a,n)=>a[n%a.length];
 let picks=floor<=10?[get(low,i),get(low,i+1)]:floor<=24?[get(mid,i),get(low,i),get(low,i+1)]:floor===25?[catalog.find(m=>m.name==='河根護獸'),catalog.find(m=>m.name==='桑枝黏蛛'),catalog.find(m=>m.name==='河汀泡蛙')]:floor<=40?[get(mid,i),get(mid,i+1),get(low,i)]:floor<=60?[get(high,i),get(mid,i),get(low,i)]:floor<=89?[get(high,i),get(mid,i),get(mid,i+1)]:[boss[0],get(mid,i),get(low,i)];
 const enemies=picks.map((m,slot)=>({speciesId:m.id,name:m.name,slot,sourceRegion:m.region,variant:floor===25&&slot===0?'mid-tier-anchor-variant':'trial-projection',biologicalTier:m.tier}));
 stages.push({floor,regionTheme:region,enemies,difficultyBudget:1+(floor-1)/99,statCalibration:'pending-author-review-and-combat-simulation',anchor:floor===25?'4 native-four-star Lv80 C0; initial three-star pets; six Lv0 items per character':floor>=90?'4 native-four-star Lv100 C6 six-star; four-star pets Lv25 C4; cherished set Lv20':'progressive-development',maxSummons:2,source:'draft-not-connected-to-activities.js'});
}
fs.writeFileSync('docs/design-20261102/tower-100-encounters-v1.json',JSON.stringify({status:'draft',note:'difficultyBudget is monotone encounter budget index, not stat multiplier; reference-level stats must be calibrated separately; mixed habitats are trial projections only',stages},null,2));
console.log({floors:stages.length,uniqueSpecies:new Set(stages.flatMap(s=>s.enemies.map(e=>e.speciesId))).size,live:false});
