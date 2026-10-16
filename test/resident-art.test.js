const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const world=require('../src/first-major-world');
const presentation=require('../src/world-presentation');
test('anonymous residents have unique paired art and local names without replacing story cast',()=>{
 const names={city:'白鐘城',village:'獸靈之村',mistbridge:'霧橋鎮',lotin:'洛汀港',south:'南驛山谷',banksWest:'北斷橋西岸聚落'};
 const residents=Object.keys(world.maps).flatMap(map=>presentation.npcs(map).filter(n=>n.genericResident).map(n=>({...n,map})));
 assert.equal(residents.length,12);
 assert.equal(new Set(residents.map(n=>n.spriteId)).size,12);
 for(const n of residents){
  assert.equal(n.name,names[n.map]+'居民');
  assert.equal(n.portraitSrc,'./assets/exploration/'+n.spriteId+'-portrait-v1.png');
  for(const suffix of ['chibi','portrait']){
   const b=fs.readFileSync(require('node:path').join(__dirname,'../assets/exploration/'+n.spriteId+'-'+suffix+'-v1.png'));
   assert.equal(b.readUInt32BE(0),0x89504e47);assert.equal(b[25],6,'RGBA alpha '+n.id);
  }
 }
 for(const id of ['town-trader','town-grower','town-caretaker','town-harbor'])assert.equal(fs.existsSync(require('node:path').join(__dirname,'../assets/exploration/'+id+'-chibi-v1.png')),false);
 assert.ok(presentation.npcs('city').some(n=>n.name==='米菈'));
 assert.ok(presentation.npcs('village').some(n=>!n.genericResident));
});
