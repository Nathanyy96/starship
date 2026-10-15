(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.StarshipHeroMotion=api;}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Source rectangles follow the produced atlas rather than assuming machine-perfect gutters.
  var frames={down:[[15,0,320,317],[338,0,293,317],[636,0,301,317],[944,0,308,317]],left:[[65,317,275,308],[350,317,288,308],[660,317,290,308],[970,317,282,308]],up:[[6,625,321,304],[329,625,305,304],[640,625,298,304],[942,625,303,304]],right:[[0,929,294,325],[312,929,305,325],[625,929,310,325],[940,929,310,325]]};
  function heading(dx,dy,previous){if(Math.hypot(dx,dy)<.05)return previous||'down';return Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';}
  function frame(direction,distance,moving,reduced){var row=frames[direction]||frames.down;return row[moving&&!reduced?Math.floor(Math.max(0,distance)/23)%4:1];}
  function draw(ctx,img,x,y,height,direction,distance,moving,reduced){if(!img||!img.naturalWidth||!img.naturalHeight)return false;var r=frame(direction,distance,moving,reduced),sx=img.naturalWidth/1254,sy=img.naturalHeight/1254,width=height*r[2]/r[3];ctx.drawImage(img,r[0]*sx,r[1]*sy,r[2]*sx,r[3]*sy,x-width/2,y-height+9,width,height);return true;}
  return {frames:frames,heading:heading,frame:frame,draw:draw};
}));
