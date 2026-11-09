(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.StarshipCharacterMotion=factory();}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Native rarity controls eligibility. Promotion never enables animation.
  var celesia={id:'celesia',nativeRarity:4,direction:'right',action:'basic',frames:24,columns:6,rows:4,frameMs:26,durationMs:624,approved:true,image:'./assets/combat/frames-20261108/celesia-basic-right-v1.webp'};
  var loaded={},pending={};
  function clipFor(card,image){return card&&card.rarity===4&&card.id===celesia.id&&celesia.approved&&celesia.direction==='right'&&typeof image==='string'&&image.indexOf('/standing-20261103/')>=0?celesia:null;}
  function warm(clip){
    if(typeof Image==='undefined')return true;
    if(loaded[clip.image])return true;
    if(!pending[clip.image]){var asset=new Image();pending[clip.image]=asset;asset.onload=function(){loaded[clip.image]=true;delete pending[clip.image];};asset.onerror=function(){delete pending[clip.image];};asset.src=clip.image;}
    return false;
  }
  function markup(card,image,pose,actionType){
    var clip=clipFor(card,image);
    if(!clip||typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return '';
    // Warm the sheet during the opening frame; retain the adopted portrait until it decodes.
    var ready=warm(clip);
    if(!ready||pose!=='attack'||actionType!=='basic')return '';
    return '<span class="battle-drawn-frames celesia-basic-right playing" aria-hidden="true"></span>';
  }
  return {clipFor:clipFor,markup:markup,clips:{celesia:celesia}};
}));
