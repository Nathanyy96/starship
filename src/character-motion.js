(function(root,factory){var api=factory(typeof module==='object'&&module.exports?require('./character-motion-manifest.js'):root.StarshipCharacterMotionManifest);if(typeof module==='object'&&module.exports)module.exports=api;root.StarshipCharacterMotion=api;}(typeof globalThis!=='undefined'?globalThis:this,function(manifest){
  'use strict';var cache=Object.create(null),rows={down:0,left:1,up:2,right:3};
  function canonical(id){return id==='hero'?'celesia':id;}
  function supports(id){return Object.prototype.hasOwnProperty.call(manifest,canonical(id));}
  function heading(dx,dy,previous){if(Math.hypot(dx,dy)<.05)return previous||'down';return Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';}
  function frame(direction,distance,moving,reduced,id){var entry=manifest[canonical(id||'celesia')];if(!entry)return null;var row=Object.prototype.hasOwnProperty.call(rows,direction)?rows[direction]:0,column=moving&&!reduced?Math.floor(Math.max(0,distance)/23)%4:1;return entry.frames[row*4+column];}
  function draw(ctx,img,x,y,height,direction,distance,moving,reduced,id){var r=frame(direction,distance,moving,reduced,id);if(!r||!img||!img.naturalWidth||!img.naturalHeight)return false;var entry=manifest[canonical(id||'celesia')],sw=r[2]*img.naturalWidth,sh=r[3]*img.naturalHeight,scale=height/((entry.bodyHeight||r[3])*img.naturalHeight),w=sw*scale,h=sh*scale;ctx.drawImage(img,r[0]*img.naturalWidth,r[1]*img.naturalHeight,sw,sh,x-w/2,y-h+9,w,h);return true;}
  function load(id,onReady,options){id=canonical(id);if(!supports(id))return null;options=options||{};var stopped=false,listener=function(img){if(!stopped)onReady(img);},entry=cache[id],ImageType=options.ImageClass||(typeof Image!=='undefined'&&Image);if(!ImageType)return null;
    if(entry&&entry.status==='ready')listener(entry.image);else if(entry&&entry.status==='loading')entry.listeners.push(listener);else{var image=new ImageType();entry=cache[id]={status:'loading',image:image,listeners:[listener]};function finish(ok){entry.status=ok?'ready':'failed';var waiting=entry.listeners;entry.listeners=[];waiting.forEach(function(fn){fn(ok?image:null);});}image.onload=function(){finish(true);};image.onerror=function(){finish(false);};image.src=manifest[id].src;}
    return {cancel:function(){stopped=true;}};
  }
  return {manifest:manifest,canonical:canonical,supports:supports,heading:heading,frame:frame,draw:draw,load:load};
}));
