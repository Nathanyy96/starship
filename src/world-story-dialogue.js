(function(root,factory){var api=factory(typeof module==='object'&&module.exports?require('./story-1-0-current'):root.StarshipStory10Current,typeof module==='object'&&module.exports?require('./story-1-1-current'):root.StarshipStory11Current);if(typeof module==='object'&&module.exports)module.exports=api;root.StarshipWorldStoryDialogue=api;}(globalThis,function(s10,s11){
  'use strict';
  // Reviewed against the complete paragraphs, not inferred from alternating turns.
  // One entry per paragraph containing quotation marks; null denotes quoted narration.
  var names={S:'瑟蕾雅',R:'雷恩',L:'莉亞',I:'伊薩爾',C:'Chodan',M:'Magenta',H:'Hina',Y:'Siyeon',V:'老瓦克',O:'奧恩',A:'米菈',F:'賽芙拉',K:'凱琳',N:'諾亞斯',D:'芮妲',W:'商旅窗口職員'};
  var rows={
    2:'L S L S L L L L S L S L S L L S R S R S R S R S R R S R S R S R S R S R L R S R R S R S R R S R R S S R R R L S L R S R'.split(' '),
    3:'I S I S I S I L S L S L L S L R S R S R S L S L S R R S R S R S S R S R S R F S S R F K O A V A V R S S'.split(' '),
    4:'R C S C C M O A S R C S S C R S R M C S O S V S S V S C M S R A O N'.split(' '),
    5:'O S S A S A S A S V A V S N S R S S R S R S R R - R S R S R S C M C M S C S C S C M - C C C S C M - W S C S - M S R S R S R M C'.split(' '),
    11:'M R M C S C M S C - S C M R R H H H Y C H C H C H S H S H S'.split(' '),
    12:'R S R R C Y H Y Y C Y C Y Y C Y M Y M C Y'.split(' '),
    13:'S R S R S H C S R Y C'.split(' '),
    14:'H C R S R C S R Y D R C'.split(' '),
    15:'- Y H,Y,Y -,M - Y C H Y S Y - S S'.split(' ')
  };
  var tables={};Object.keys(rows).forEach(function(key){var act=Number(key),body=(act>=11?s11:s10).scenes[act>=11?act-11:act-1].body,paragraphs=body.split(/\n\s*\n/).map(function(p){return p.trim();}).filter(Boolean),quoted=paragraphs.filter(function(p){return p.includes('「');});if(quoted.length!==rows[key].length)throw new Error('Dialogue attribution count '+act+': '+quoted.length+'/'+rows[key].length);var table=new Map();quoted.forEach(function(p,i){table.set(p,rows[key][i].split(',').map(function(n){return names[n]||null;}));});tables[key]=table;});
  function cards(act,body){var out=[];body.split(/\n\s*\n/).map(function(p){return p.trim();}).filter(Boolean).forEach(function(p){var tags=tables[act].get(p),quote=0;var parts=p.match(/「[^」]*」|[^「]+/g)||[p];parts.forEach(function(part){var person=part.startsWith('「')&&tags?tags[Math.min(quote++,tags.length-1)]:null;if(person){out.push({speaker:person,text:part});return;}var buffer='';(part.match(/[^。！？]+[。！？]?|[。！？]/g)||[part]).forEach(function(sentence){if(buffer&&buffer.length+sentence.length>120){out.push({speaker:'旁白',text:buffer});buffer='';}buffer+=sentence;});if(buffer)out.push({speaker:'旁白',text:buffer});});});return out;}
  return {cards:cards};
}));
