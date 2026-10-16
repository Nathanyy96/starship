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
    // Short landscape viewports need more of the surroundings, not a closer
    // crop of the same road. Keep world geometry and character proportions.
    var zoom = cssWidth < 600 && cssHeight > cssWidth ? .9 : Math.max(.7, Math.min(1.05, cssHeight / 620));
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
  // Preserve the original scenery around broad walkable corridors. Scenery never changes collision.
  var sceneryImages={},sceneryRequests={},sceneryFailures={},terrainCache={},tileArt=null,objectArt=null,interiorArt=null,artVersion=0;
  if(typeof Image!=='undefined'){
    var tiles=new Image();tiles.onload=function(){tileArt=tiles;terrainCache={};artVersion++;};tiles.src='./assets/exploration/terrain-ground-atlas-v1.png';
    var objects=new Image();objects.onload=function(){objectArt=objects;terrainCache={};artVersion++;};objects.src='./assets/exploration/terrain-objects-atlas-v1.png';
    var furniture=new Image();furniture.onload=function(){interiorArt=furniture;terrainCache={};artVersion++;};furniture.src='./assets/exploration/interior-objects-atlas-v1.png';
  }
  var nativeTerrain=typeof module==='object'&&module.exports&&typeof require==='function'?require('./native-terrain'):globalThis.StarshipNativeTerrain;
  function terrain(key,width,height,passable,settings){
    if(typeof document==='undefined')return null;
    settings=settings||{};
    if(settings.native&&nativeTerrain)return nativeTerrain.paint(key,width,height,passable,settings);
    var scenery=null;if(settings.image&&!settings.furniture&&typeof Image!=='undefined'){scenery=sceneryImages[settings.image];if(!sceneryRequests[settings.image]){sceneryRequests[settings.image]=true;var original=new Image();original.onload=function(){delete sceneryFailures[settings.image];sceneryImages[settings.image]=original;terrainCache={};artVersion++;};original.onerror=function(){sceneryFailures[settings.image]=true;artVersion++;};original.src=settings.image;}if(!scenery)return null;}
    var cacheKey=key+':'+width+'x'+height+':'+(settings.image||'');if(terrainCache[cacheKey])return terrainCache[cacheKey];
    settings=settings||{};var sheet=document.createElement('canvas');sheet.width=width;sheet.height=height;var c=sheet.getContext('2d'),indoor=Boolean(settings.furniture)||/Inn|factory|recovery|clinic|observatory|station/.test(key),stone=/city|bellcourt|relic|valley/.test(key),step=8;
    if(scenery){c.drawImage(scenery,0,0,width,height);terrainCache[cacheKey]=sheet;return sheet;}
    var patterns=[];
    if(tileArt)for(var cell=0;cell<8;cell++){var tile=document.createElement('canvas');tile.width=128;tile.height=128;var tc=tile.getContext('2d'),sw=tileArt.naturalWidth/4,sh=tileArt.naturalHeight/2;tc.imageSmoothingEnabled=false;tc.drawImage(tileArt,(cell%4)*sw+2,Math.floor(cell/4)*sh+2,sw-4,sh-4,0,0,128,128);patterns.push(c.createPattern(tile,'repeat'));}
    c.fillStyle=indoor?'#39413b':stone?'#66715b':'#4f7952';c.fillRect(0,0,width,height);
    var columns=Math.ceil(width/step),rows=Math.ceil(height/step),mask=new Uint8Array(columns*rows);for(var my=0;my<rows;my++)for(var mx=0;mx<columns;mx++)mask[my*columns+mx]=(passable(mx*step+4,my*step+4)||(settings.furniture||[]).some(function(p){var x=mx*step+4,y=my*step+4;return x>=p.x&&x<=p.x+p.w&&y>=p.y&&y<=p.y+p.h;}))?1:0;
    for(var y=0;y<height;y+=step)for(var x=0;x<width;x+=step){
      var hash=((x*13+y*29)%101),walk=Boolean(mask[(y/step)*columns+x/step]);
      c.fillStyle=patterns.length?patterns[walk?(indoor?3:stone?2:1):(indoor?7:/valley|relic|bellcourt/.test(key)?6:4)]:walk?(indoor?(hash<48?'#bd975f':'#c6a16b'):stone?(hash<48?'#d2c6a1':'#c9be99'):(hash<48?'#d9c18d':'#d4b983')):(indoor?'#465047':hash<42?'#567e54':'#5b8557');c.fillRect(x,y,step,step);
      if(!walk&&((key==='lotin'&&x>1192)||(key==='riverRoad'&&x>1100&&y<500)||(key==='road'&&x>635&&x<710))){c.fillStyle=patterns[5]||(hash<48?'#397d96':'#4189a0');c.fillRect(x,y,step,step);}
      if(walk&&(!mask[(y/step)*columns+x/step-1]||!mask[(y/step)*columns+x/step+1]||!mask[(y/step-1)*columns+x/step]||!mask[(y/step+1)*columns+x/step])){c.fillStyle=indoor?'#765c3d':stone?'#8b856b':'#9b7949';c.fillRect(x,y,8,8);}
      if(!tileArt&&walk&&hash<12){c.fillStyle=indoor?'#aa8455':'#c1ac7f';c.fillRect(x+2,y+3,3,1);}
    }
    // The room boundary is visible wainscot and timber, with a real doorway
    // matching the return exit. Furniture does not masquerade as open floor.
    if(settings.floor){var f=settings.floor;c.save();c.lineJoin='miter';c.strokeStyle='#332d25';c.lineWidth=24;c.strokeRect(f[0]-12,f[1]-12,f[2]-f[0]+24,f[3]-f[1]+24);c.strokeStyle='#826746';c.lineWidth=8;c.strokeRect(f[0]-2,f[1]-2,f[2]-f[0]+4,f[3]-f[1]+4);c.strokeStyle='#b99867';c.lineWidth=2;c.strokeRect(f[0]+3,f[1]+3,f[2]-f[0]-6,f[3]-f[1]-6);(settings.exits||[]).forEach(function(e){c.fillStyle=patterns[3]||'#b58e56';c.fillRect(e.x-42,f[3]-4,84,30);c.fillStyle='#d1b788';c.fillRect(e.x-44,f[3]+18,88,5);});c.restore();}
    // Daylight windows belong to the solid back wall, leaving the room's
    // central circulation and the return doorway clear.
    if(settings.floor){var wall=settings.floor;[.28,.72].forEach(function(t){var wx=wall[0]+(wall[2]-wall[0])*t-34,wy=wall[1]-23;c.save();c.fillStyle='#5e4933';c.fillRect(wx-5,wy-4,78,38);c.fillStyle='#b4d7ce';c.fillRect(wx,wy,68,28);c.fillStyle='#e8d8a2';c.fillRect(wx+32,wy,4,28);c.fillRect(wx,wy+12,68,3);c.fillStyle='#d4bb85';c.fillRect(wx-7,wy+28,82,5);c.restore();});}
    // Decorations may occupy blocked cells only, including their complete footprint.
    function blocked(x,y,w,h){for(var py=y;py<=y+h;py+=8)for(var px=x;px<=x+w;px+=8)if(passable(px,py))return false;return true;}
    function prop(index,x,y,w,h){var sw=objectArt.naturalWidth/4,sh=objectArt.naturalHeight/2;c.drawImage(objectArt,(index%4)*sw+3,Math.floor(index/4)*sh+3,sw-6,sh-6,x,y,w,h);}
    for(var ty=20;ty<height-52;ty+=64)for(var tx=20;tx<width-48;tx+=64){
      if(settings.image||settings.furniture||(settings.buildings||[]).some(function(b){return tx+64>b.x&&tx-8<b.x+b.w&&ty+64>b.y&&ty-12<b.y+b.h;}))continue;
      if(!blocked(tx-8,ty-12,56,64))continue;
      if((key==='lotin'&&tx>1150)||(key==='road'&&tx>595&&tx<750))continue;
      if(objectArt){var urban=/city|lotin|mistbridge|village/.test(key),ruin=/valley|relic|bellcourt/.test(key),index=indoor?7:ruin?6:urban?2:((tx+ty)%192?0:1);prop(index,tx-5,ty-10,54,62);continue;}
      if(indoor||stone){c.fillStyle='#4e594d';c.fillRect(tx+2,ty+20,40,28);c.fillStyle=indoor?'#8d7459':'#92957c';c.fillRect(tx,ty+8,40,30);c.fillStyle=indoor?'#ad946c':'#b6b59a';c.fillRect(tx,ty+8,40,6);c.fillStyle='#737c67';c.fillRect(tx,ty+34,40,4);}
      else{c.fillStyle='#3d6243';c.fillRect(tx+6,ty+28,32,14);c.fillStyle='#775f42';c.fillRect(tx+18,ty+20,8,29);c.fillStyle='#294e38';c.fillRect(tx+2,ty+7,40,26);c.fillStyle='#396a45';c.fillRect(tx+6,ty,32,28);c.fillStyle='#52834f';c.fillRect(tx+10,ty+3,20,9);}
    }
    if(!settings.image&&objectArt&&/city|village|mistbridge|lotin/.test(key))for(var hy=70;hy<height-150;hy+=192)for(var hx=70;hx<width-140;hx+=192){if(!(settings.buildings||[]).some(function(b){return hx+140>b.x&&hx-12<b.x+b.w&&hy+140>b.y&&hy-12<b.y+b.h;})&&blocked(hx-12,hy-12,140,140))prop((hx+hy)%384?4:5,hx,hy,116,128);}
    if(!scenery&&objectArt)(settings.buildings||[]).forEach(function(b){prop(b.sprite,b.x,b.y,b.w,b.h);});
    (settings.furniture||[]).forEach(function(p){c.fillStyle=patterns[3]||'#b88d54';c.fillRect(p.x,p.y,p.w,p.h);if(interiorArt){var sw=interiorArt.naturalWidth/4,sh=interiorArt.naturalHeight/2;c.drawImage(interiorArt,(p.sprite%4)*sw+2,Math.floor(p.sprite/4)*sh+2,sw-4,sh-4,p.x,p.y,p.w,p.h);}else{c.fillStyle='#897559';c.fillRect(p.x+4,p.y+4,p.w-8,p.h-8);}});
    if(key==='opening-valley'){c.strokeStyle='#9d9272';c.lineWidth=4;c.beginPath();c.arc(18.5*32,10*32,58,0,Math.PI*2);c.stroke();c.beginPath();c.moveTo(18.5*32-45,10*32);c.lineTo(18.5*32+45,10*32);c.moveTo(18.5*32,10*32-45);c.lineTo(18.5*32,10*32+45);c.stroke();}
    (settings.stairs||[]).forEach(function(s){for(var sy=s[1];sy<s[1]+s[3];sy+=8)for(var sx=s[0];sx<s[0]+s[2];sx+=8)if(passable(sx+4,sy+4)){c.fillStyle='#847d67';c.fillRect(sx,sy,8,8);c.fillStyle='#e3d7b6';c.fillRect(sx,sy,8,4);}});

    terrainCache[cacheKey]=sheet;return sheet;
  }
  return { begin: begin, end: end, sprite: sprite, terrain:terrain, terrainFailed:function(src){return Boolean(sceneryFailures[src]);},terrainVersion:function(){return artVersion+(nativeTerrain?nativeTerrain.version():0);} };
}));
