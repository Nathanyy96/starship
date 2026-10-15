(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipExplorationRenderer = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  function begin(canvas, ctx, worldWidth, worldHeight, x, y) {
    var rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
    var cssWidth = rect && rect.width > 0 ? rect.width : canvas._cssWidth || 960;
    var cssHeight = rect && rect.height > 0 ? rect.height : canvas._cssHeight || 576;
    canvas._cssWidth = cssWidth; canvas._cssHeight = cssHeight;
    var ratio = Math.min(2, typeof window !== "undefined" && window.devicePixelRatio || 1);
    var width = Math.round(cssWidth * ratio), height = Math.round(cssHeight * ratio);
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    var zoom = cssWidth < 600 ? 1.05 : 1.25;
    var viewWidth = cssWidth / zoom, viewHeight = cssHeight / zoom;
    var cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - viewWidth), x - viewWidth / 2));
    var cameraY = Math.max(0, Math.min(Math.max(0, worldHeight - viewHeight), y - viewHeight / 2));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.setTransform(ratio * zoom, 0, 0, ratio * zoom, -cameraX * ratio * zoom, -cameraY * ratio * zoom);
    return { x: cameraX, y: cameraY, width: viewWidth, height: viewHeight, ratio: ratio, zoom: zoom };
  }
  function end(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); }
  function sprite(ctx, img, x, y, height, flip, bob) {
    if (!img) return false;
    var width = height * img.naturalWidth / img.naturalHeight;
    ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
    ctx.drawImage(img, -width / 2, -height + 9 + (bob || 0), width, height); ctx.restore(); return true;
  }
  // The visible ground is sampled from the same walkability function as movement.
  // Scenic overview paintings remain available in the atlas, not as collision surfaces.
  var terrainCache={},tileArt=null,objectArt=null,artVersion=0;
  if(typeof Image!=='undefined'){
    var tiles=new Image();tiles.onload=function(){tileArt=tiles;terrainCache={};artVersion++;};tiles.src='./assets/exploration/terrain-ground-atlas-v1.png';
    var objects=new Image();objects.onload=function(){objectArt=objects;terrainCache={};artVersion++;};objects.src='./assets/exploration/terrain-objects-atlas-v1.png';
  }
  function terrain(key,width,height,passable,settings){
    if(typeof document==='undefined')return null;
    if(terrainCache[key])return terrainCache[key];
    settings=settings||{};var sheet=document.createElement('canvas');sheet.width=width;sheet.height=height;var c=sheet.getContext('2d'),indoor=/Inn|factory|recovery/.test(key),stone=/city|bellcourt|relic|valley/.test(key),step=8;
    var patterns=[];
    if(tileArt)for(var cell=0;cell<8;cell++){var tile=document.createElement('canvas');tile.width=128;tile.height=128;var tc=tile.getContext('2d'),sw=tileArt.naturalWidth/4,sh=tileArt.naturalHeight/2;tc.imageSmoothingEnabled=false;tc.drawImage(tileArt,(cell%4)*sw+2,Math.floor(cell/4)*sh+2,sw-4,sh-4,0,0,128,128);patterns.push(c.createPattern(tile,'repeat'));}
    c.fillStyle=indoor?'#39413b':stone?'#66715b':'#4f7952';c.fillRect(0,0,width,height);
    for(var y=0;y<height;y+=step)for(var x=0;x<width;x+=step){
      var hash=((x*13+y*29)%101),walk=passable(x+4,y+4);
      c.fillStyle=patterns.length?patterns[walk?(indoor?3:stone?2:1):(indoor?7:/valley|relic|bellcourt/.test(key)?6:4)]:walk?(indoor?(hash<48?'#bd975f':'#c6a16b'):stone?(hash<48?'#d2c6a1':'#c9be99'):(hash<48?'#d9c18d':'#d4b983')):(indoor?'#465047':hash<42?'#567e54':'#5b8557');c.fillRect(x,y,step,step);
      if(!walk&&((key==='lotin'&&x>1192)||(key==='riverRoad'&&x>1100&&y<500)||(key==='road'&&x>635&&x<710))){c.fillStyle=patterns[5]||(hash<48?'#397d96':'#4189a0');c.fillRect(x,y,step,step);}
      if(!tileArt&&walk&&hash<12){c.fillStyle=indoor?'#aa8455':'#c1ac7f';c.fillRect(x+2,y+3,3,1);}
    }
    // Decorations may occupy blocked cells only, including their complete footprint.
    function blocked(x,y,w,h){for(var py=y;py<=y+h;py+=8)for(var px=x;px<=x+w;px+=8)if(passable(px,py))return false;return true;}
    function prop(index,x,y,w,h){var sw=objectArt.naturalWidth/4,sh=objectArt.naturalHeight/2;c.drawImage(objectArt,(index%4)*sw+3,Math.floor(index/4)*sh+3,sw-6,sh-6,x,y,w,h);}
    for(var ty=20;ty<height-52;ty+=64)for(var tx=20;tx<width-48;tx+=64){
      if(!blocked(tx-8,ty-12,56,64))continue;
      if((key==='lotin'&&tx>1150)||(key==='road'&&tx>595&&tx<750))continue;
      if(objectArt){var urban=/city|lotin|mistbridge|village/.test(key),ruin=/valley|relic|bellcourt/.test(key),index=indoor?7:ruin?6:urban?2:((tx+ty)%192?0:1);prop(index,tx-5,ty-10,54,62);continue;}
      if(indoor||stone){c.fillStyle='#4e594d';c.fillRect(tx+2,ty+20,40,28);c.fillStyle=indoor?'#8d7459':'#92957c';c.fillRect(tx,ty+8,40,30);c.fillStyle=indoor?'#ad946c':'#b6b59a';c.fillRect(tx,ty+8,40,6);c.fillStyle='#737c67';c.fillRect(tx,ty+34,40,4);}
      else{c.fillStyle='#3d6243';c.fillRect(tx+6,ty+28,32,14);c.fillStyle='#775f42';c.fillRect(tx+18,ty+20,8,29);c.fillStyle='#294e38';c.fillRect(tx+2,ty+7,40,26);c.fillStyle='#396a45';c.fillRect(tx+6,ty,32,28);c.fillStyle='#52834f';c.fillRect(tx+10,ty+3,20,9);}
    }
    if(objectArt&&/city|village|mistbridge|lotin/.test(key))for(var hy=70;hy<height-150;hy+=192)for(var hx=70;hx<width-140;hx+=192){if(blocked(hx-12,hy-12,140,140))prop((hx+hy)%384?4:5,hx,hy,116,128);}
    if(key==='opening-valley'){c.strokeStyle='#9d9272';c.lineWidth=4;c.beginPath();c.arc(18.5*32,10*32,58,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(18.5*32-45,10*32);c.lineTo(18.5*32+45,10*32);c.moveTo(18.5*32,10*32-45);c.lineTo(18.5*32,10*32+45);c.stroke();}
    (settings.stairs||[]).forEach(function(s){for(var sy=s[1];sy<s[1]+s[3];sy+=8)for(var sx=s[0];sx<s[0]+s[2];sx+=8)if(passable(sx+4,sy+4)){c.fillStyle='#847d67';c.fillRect(sx,sy,8,8);c.fillStyle='#e3d7b6';c.fillRect(sx,sy,8,4);}});
    terrainCache[key]=sheet;return sheet;
  }
  return { begin: begin, end: end, sprite: sprite, terrain:terrain, terrainVersion:function(){return artVersion;} };
}));
