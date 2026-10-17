(function(root,factory){var api=factory(typeof module==='object'&&module.exports?require('./character-motion-manifest.js'):root.StarshipCharacterMotionManifest);if(typeof module==='object'&&module.exports)module.exports=api;root.StarshipCharacterMotion=api;}(typeof globalThis!=='undefined'?globalThis:this,function(manifest){
  'use strict';var cache=Object.create(null),rows={down:0,left:1,up:2,right:3};
  function canonical(id){return id==='hero'?'celesia':id;}
  function supports(id){return Object.prototype.hasOwnProperty.call(manifest,canonical(id));}
  function heading(dx,dy,previous){if(Math.hypot(dx,dy)<.05)return previous||'down';return Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';}
  function frame(direction,distance,moving,reduced,id){var entry=manifest[canonical(id||'celesia')];if(!entry)return null;var row=Object.prototype.hasOwnProperty.call(rows,direction)?rows[direction]:0,column=moving&&!reduced?Math.floor(Math.max(0,distance)/23)%4:1;return entry.frames[row*4+column];}
  function draw(ctx,img,x,y,height,direction,distance,moving,reduced,id){var r=frame(direction,distance,moving,reduced,id);if(!r||!img||!img.naturalWidth||!img.naturalHeight)return false;var entry=manifest[canonical(id||'celesia')],sw=r[2]*img.naturalWidth,sh=r[3]*img.naturalHeight,scale=height*(entry.displayScale||1)/((entry.bodyHeight||r[3])*img.naturalHeight),w=sw*scale,h=sh*scale;ctx.drawImage(img,r[0]*img.naturalWidth,r[1]*img.naturalHeight,sw,sh,x-w/2,y-h+9,w,h);return true;}
  function load(id,onReady,options){id=canonical(id);if(!supports(id))return null;options=options||{};var stopped=false,listener=function(img){if(!stopped)onReady(img);},entry=cache[id],ImageType=options.ImageClass||(typeof Image!=='undefined'&&Image);if(!ImageType)return null;
    if(entry&&entry.status==='ready')listener(entry.image);else if(entry&&entry.status==='loading')entry.listeners.push(listener);else{var image=new ImageType();entry=cache[id]={status:'loading',image:image,listeners:[listener]};function finish(ok){entry.status=ok?'ready':'failed';var waiting=entry.listeners;entry.listeners=[];waiting.forEach(function(fn){fn(ok?image:null);});}image.onload=function(){finish(true);};image.onerror=function(){finish(false);};image.src=manifest[id].src;}
    return {cancel:function(){stopped=true;}};
  }
  // Only published narration cues stage a walk; ordinary dialogue stays still.
  var sceneCues=[
    {text:'林道窄，雷恩走在前面',id:'reyn',approach:false},
    {text:'他看了她一會兒，轉身往外走',id:'reyn',approach:false},
    {text:'Siyeon在近岸棚前',id:'siyeon',approach:true},
    {text:'Hina走到上游',id:'hina',approach:false},
    {text:'雷恩走到側面的高石',id:'reyn',approach:false}
  ];
  var cutoutCueNames={reyn:'雷恩'};
  function createScene(){
    var seen={},actors={};
    return {
      clear:function(){seen={};actors={};},
      cue:function(text,key,anchor,now,clear){
        if(seen[key])return false;
        var cue=sceneCues.find(function(c){return text.indexOf(c.text)!==-1;});
        if(!cue)return false;seen[key]=true;
        var vectors=[[-1,-1],[0,-1],[-1,0],[1,-1],[1,0],[0,1],[-1,1],[1,1]];
        for(var i=0;i<vectors.length;i++){
          var v=vectors[i],length=Math.hypot(v[0],v[1]),dx=v[0]/length,dy=v[1]/length;
          var near={x:anchor.x+dx*30,y:anchor.y+dy*30},far={x:anchor.x+dx*94,y:anchor.y+dy*94};
          if(!clear(anchor,near)||!clear(near,far))continue;
          var from=cue.approach?far:near,to=cue.approach?near:far;
          actors[cue.id]={id:cue.id,name:manifest[cue.id]?manifest[cue.id].name:cutoutCueNames[cue.id],from:from,to:to,start:now,duration:1680};return true;
        }
        return false;
      },
      sample:function(now,reduced){return Object.keys(actors).map(function(id){var actor=actors[id],p=reduced?1:Math.max(0,Math.min(1,(now-actor.start)/actor.duration)),dx=actor.to.x-actor.from.x,dy=actor.to.y-actor.from.y;return {id:id,name:actor.name,x:actor.from.x+dx*p,y:actor.from.y+dy*p,facing:heading(dx,dy),distance:Math.hypot(dx,dy)*p,walking:p<1,sceneMotion:true};});}
    };
  }
  return {manifest:manifest,canonical:canonical,supports:supports,heading:heading,frame:frame,draw:draw,load:load,sceneCues:sceneCues,createScene:createScene};
}));
