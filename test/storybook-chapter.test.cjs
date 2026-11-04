const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const book=require('../src/story-chapter-1-0');
test('first reboot chapter has fourteen ordered complete scenes and eight local illustrations',()=>{
  assert.equal(book.scenes.length,14);assert.equal(book.rewardsEnabled,false);assert.equal(new Set(book.scenes.map(s=>s.image)).size,8);
  book.scenes.forEach((s,i)=>{assert.equal(s.id,'reboot-1-0-'+String(i+1).padStart(2,'0'));assert.ok(s.title&&s.imageDescription);assert.ok(s.paragraphs.join('').length>200);assert.ok(fs.statSync(path.join(__dirname,'..',s.image)).size<600000);});
  const prose=book.scenes.map(s=>s.paragraphs.join('\n')).join('\n');assert.ok(!/二萬八千|28740|二萬八千七百|紗緹|腳下就是母星/.test(prose));
});
test('storybook exposes text safely and remains separate from reward and progression APIs',()=>{
  const reader=fs.readFileSync(path.join(__dirname,'../src/storybook.js'),'utf8');assert.ok(reader.includes('p.textContent=text'));assert.ok(reader.includes('prev.disabled=index===0'));assert.ok(reader.includes('next.disabled=index===book.scenes.length-1'));assert.ok(!/fetch\(|apiRequest|localStorage|starSand/.test(reader));
});
