(function(root,factory){var api=factory(typeof module==='object'&&module.exports?require('./native-scene-layouts'):root.StarshipNativeSceneLayouts);if(typeof module==='object'&&module.exports)module.exports=api;root.StarshipNativeTerrain=api;}(globalThis,function(layouts){
  'use strict';
  var files={ground:'ground-materials-v1.png',harbor:'harbor-props-v1.png',nature:'nature-props-v1.png',landmarks:'landmark-props-v1.png',city:'city-props-v1.png',village:'village-props-v1.png',detail:'detail-materials-v1.png',workshop:'workshop-building-v1.png',healer:'healer-building-v1.png',frontier:'frontier-props-v1.png',firepit:'village-firepit-v1.png',fields:'wheat-field-v1.png',scenery:'roadside-scenery-v1.png',town:'town-buildings-v2.png',whiteBell:'white-bell-buildings-v1.png',villageHomes:'forest-village-homes-v1.png',woodland:'woodland-landscapes-v1.png',ruinLandscape:'ruin-landscapes-v1.png',coastal:'coastal-landscapes-v1.png',refinedGround:'refined-ground-v1.png',tradeRoad:'../west-trade-road-v1.png'},images={},cache={},version=0,requested={},failed=[];
  // Frames are authored against the delivered transparent sprite sheets. They
  // are individual objects, never a resized overview illustration.
  var frames={
    harbor:[[0,0,680,610],[680,120,574,470],[0,700,635,554],[635,600,619,654]],
    nature:[[0,0,660,680],[710,0,544,700],[0,640,650,614],[620,720,634,534]],
    landmarks:[[0,0,625,610],[630,0,624,615],[0,620,640,634],[640,620,614,634]],
    ruinLandscape:[[0,0,768,540],[768,0,768,540],[0,540,768,484],[768,540,768,484]],
    coastal:[[0,0,768,500],[768,0,768,535],[0,500,768,524],[768,535,768,489]],
    refinedGround:[[0,0,627,596],[627,0,627,627],[0,596,627,658],[627,627,627,627]]
  };
  function imageId(p){return p.sheet==='city'&&p.cell===0?'workshop':p.sheet==='village'&&p.cell===2?'healer':p.sheet;}
  function needed(p){if(p.overview)return ['tradeRoad'];var ids=['ground','detail','nature','refinedGround'];objects(p).forEach(function(o){var id=imageId(o);if(!ids.includes(id))ids.push(id);});if(p.fields&&p.fields.length)ids.push('fields');if(p.fire)ids.push('firepit');if(p.fountain&&!ids.includes('landmarks'))ids.push('landmarks');return ids;}
  function ensure(p){if(typeof Image==='undefined')return;needed(p).forEach(function(id){if(requested[id])return;requested[id]=true;var img=new Image();img.onload=function(){images[id]=img;cache={};version++;};img.onerror=function(){failed.push(id);};img.src='./assets/exploration/native/'+files[id];});}

  function structure(sheet,cell,x,y,w,h){return {sheet:sheet,cell:cell,x:x,y:y,w:w,h:h};}
  // Authored layouts are committed after route, frontage and collision checks.
  // Loading a map never runs a placement search or moves its buildings.
  function install(maps){Object.keys(layouts).forEach(function(id){if(!maps[id])return;if(id==='road'){maps[id].nativeTerrain={overview:true,style:'country',structures:[],trees:[],scenery:[],landscapes:[]};maps[id].buildings=[];maps[id].nativeObstacles=[];maps[id].paths.forEach(function(p,i){p.width=i?32:30;});return;}var plan=JSON.parse(JSON.stringify(layouts[id]));Object.keys(plan).forEach(function(key){maps[id][key]=plan[key];});});}
  function polygon(c,points){c.beginPath();points.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.closePath();}
  function stroke(c,path,width,color){c.beginPath();path.points.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.lineCap='round';c.lineJoin='round';c.lineWidth=width;c.strokeStyle=color;c.stroke();}
  function rectBlocked(test,x,y,w,h){for(var py=y;py<=y+h;py+=12)for(var px=x;px<=x+w;px+=12)if(test(px,py))return false;return true;}
  function drawObject(c,p){var id=imageId(p),image=images[id];if(!image)return;var f=id!==p.sheet?[0,0,image.naturalWidth,image.naturalHeight]:(frames[p.sheet]||[])[p.cell];if(!f){var sw=image.naturalWidth/2,sh=image.naturalHeight/2;f=[p.cell%2*sw,Math.floor(p.cell/2)*sh,sw,sh];}c.save();if(p.sheet==='nature'&&p.cell===0){c.beginPath();[[0,0],[1,0],[1,1],[.31,1],[.31,.91],[0,.91]].forEach(function(v,i){if(i)c.lineTo(p.x+v[0]*p.w,p.y+v[1]*p.h);else c.moveTo(p.x+v[0]*p.w,p.y+v[1]*p.h);});c.closePath();c.clip();}c.drawImage(image,f[0],f[1],f[2],f[3],p.x,p.y,p.w,p.h);c.restore();}
  function patterns(c,id){id=id||'ground';var result=[];if(!images[id])return ['#c5bba0','#b6a477','#496b40','#1c6770'];for(var i=0;i<4;i++){var tile=document.createElement('canvas');tile.width=tile.height=256;var tc=tile.getContext('2d'),size=images[id].naturalWidth/2;var frame=(frames[id]||[])[i]||[(i%2)*size,Math.floor(i/2)*size,size,size];tc.drawImage(images[id],frame[0]+4,frame[1]+4,frame[2]-8,frame[3]-8,0,0,256,256);result.push(c.createPattern(tile,'repeat'));}return result;}
  function paint(key,width,height,test,settings){
    if(typeof document==='undefined')return null;ensure(settings.native);
    var token=key+':'+version+':'+Boolean(settings.groundOnly);if(cache[token])return cache[token];
    var sheet=document.createElement('canvas');sheet.width=width;sheet.height=height;var c=sheet.getContext('2d'),p=settings.native,paths=settings.paths||[],tiles=patterns(c),detail=patterns(c,'detail'),refined=patterns(c,'refinedGround');if(p.overview){if(!images.tradeRoad)return null;c.drawImage(images.tradeRoad,0,0,width,height);cache[token]=sheet;return sheet;}
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.fillStyle=p.style==='port'?tiles[3]:images.refinedGround?(p.biome==='rocky'?refined[3]:refined[2]):tiles[2];c.fillRect(0,0,width,height);
    // Lift the dark material atlas with a warm daylight tint before drawing
    // rivers, crops and buildings on top; this keeps texture instead of flat fill.
    if(p.style!=='port'){c.save();c.globalCompositeOperation='screen';c.globalAlpha=.15;c.fillStyle='#e4e3c6';c.fillRect(0,0,width,height);c.restore();}
    (p.land||[]).forEach(function(points){polygon(c,points);c.fillStyle=images.refinedGround?refined[2]:tiles[2];c.fill();c.lineWidth=22;c.strokeStyle='#a59c7c';c.stroke();c.lineWidth=5;c.strokeStyle='#d5d3ad';c.stroke();});
    // An irregular vegetation verge makes the road boundary visible at player
    // scale. Its centerline and width remain the exact movement specification.
    if(p.style!=='port')paths.forEach(function(path){stroke(c,path,path.width*2+16,'rgba(76,104,47,.16)');});
    (p.water||[]).forEach(function(r){stroke(c,r,r.width+24,'#a7aa79');stroke(c,r,r.width+10,'#9fc3af');stroke(c,r,r.width,tiles[3]);});
    (p.scatter||[]).forEach(function(q){var r=q.r;if(q.kind<.24){for(var rock=0;rock<3;rock++){var rx=q.x+(rock-1)*r*.35,ry=q.y+Math.sin(rock*2+q.kind*7)*r*.18;c.fillStyle=rock%2?'#aaa58f':'#7f8375';c.beginPath();c.ellipse(rx,ry,r*(.14+rock*.025),r*(.085+rock*.012),rock*.4,0,Math.PI*2);c.fill();c.fillStyle='#d2c9ad';c.beginPath();c.ellipse(rx-r*.04,ry-r*.025,r*.07,r*.03,0,0,Math.PI*2);c.fill();}}else{for(var leaf=0;leaf<7;leaf++){var a=leaf*2.399+q.kind*5,d=r*(.16+((leaf*17+q.kind*31)%51)/100),lx=q.x+Math.cos(a)*d,ly=q.y+Math.sin(a)*d*.75;c.save();c.globalAlpha=.3;c.fillStyle=['#56734b','#78915a','#92a56d'][leaf%3];c.beginPath();c.ellipse(lx,ly,r*.12,r*.055,a,0,Math.PI*2);c.fill();c.restore();}if(q.kind>.68){for(var fl=0;fl<4;fl++){var a2=fl*2.399+q.kind*9,fd=r*(.14+((fl*23+q.kind*21)%42)/100),fx=q.x+Math.cos(a2)*fd,fy=q.y+Math.sin(a2)*fd*.75;c.fillStyle=['#f2dfad','#eee7cf','#d8c8e3'][fl%3];c.beginPath();c.arc(fx,fy,1.5+q.kind*1.3,0,Math.PI*2);c.fill();c.fillStyle='#e8bd68';c.beginPath();c.arc(fx,fy,.9,0,Math.PI*2);c.fill();}}}});
    (p.fields||[]).forEach(function(f){if(!rectBlocked(test,f[0]-10,f[1]-10,f[2]+20,f[3]+20))return;if(images.fields){if(f[4]){c.save();c.translate(f[0]+f[2]/2,f[1]+f[3]/2);c.rotate(f[4]);c.drawImage(images.fields,-f[2]/2-10,-f[3]/2-10,f[2]+20,f[3]+20);c.restore();}else c.drawImage(images.fields,f[0]-10,f[1]-10,f[2]+20,f[3]+20);}});
    // A single vector lane specification drives the visible road and collision.
    // Draw borders first, then all road surfaces, to keep junctions unobstructed.
    paths.forEach(function(path){stroke(c,path,path.width*2+8,'rgba(101,112,73,.22)');stroke(c,path,path.width*2+4,'#c7bc9b');});
    paths.forEach(function(path){stroke(c,path,path.width*2,images.refinedGround?(p.style==='city'||p.style==='port'||p.style==='ruin'?refined[0]:refined[1]):(p.style==='city'||p.style==='port'||p.style==='ruin'?tiles[0]:tiles[1]));});
    // A subtle sunlit pass brightens cobbles without obscuring their texture.
    c.save();c.globalCompositeOperation='screen';c.globalAlpha=images.refinedGround?.08:(p.style==='city'||p.style==='ruin'?.32:.22);paths.forEach(function(path){stroke(c,path,path.width*2,'#f2e5c3');});c.restore();
    // River crossings receive a real timber deck and railings, not an invisible
    // permission to walk across a river illustration.
    var waters=p.water||[];
    paths.forEach(function(path){for(var i=1;i<path.points.length;i++){var a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);for(var d=0;d<len;d+=10){var t=d/len,x=a[0]+dx*t,y=a[1]+dy*t,onWater=waters.some(function(r){return r.points.some(function(v,j){if(!j)return false;var u=r.points[j-1],vx=v[0]-u[0],vy=v[1]-u[1],q=Math.max(0,Math.min(1,((x-u[0])*vx+(y-u[1])*vy)/(vx*vx+vy*vy)));return Math.hypot(x-u[0]-q*vx,y-u[1]-q*vy)<r.width/2+12;});});if(p.style==='port')onWater=x>1570&&x<2320&&y<1400;if(!onWater)continue;var nx=-dy/len,ny=dx/len;c.strokeStyle=images.detail?detail[0]:'#ab8553';c.lineWidth=12;c.beginPath();c.moveTo(x+nx*path.width,y+ny*path.width);c.lineTo(x-nx*path.width,y-ny*path.width);c.stroke();[-1,1].forEach(function(side){var rx=x+nx*(path.width+7)*side,ry=y+ny*(path.width+7)*side;c.strokeStyle='#55452e';c.lineWidth=7;c.beginPath();c.moveTo(rx,ry);c.lineTo(rx+dx/len*12,ry+dy/len*12);c.stroke();c.strokeStyle='#d6ba84';c.lineWidth=2;c.stroke();if(d%50===0){c.fillStyle='#5a452c';c.fillRect(rx-4,ry-9,8,16);c.fillStyle='#c7a672';c.fillRect(rx-4,ry-10,8,3);}});}}});
    // Deliberately placed, varied silhouettes; no grid of cloned trees/houses.
    if(!settings.groundOnly)objects(p).forEach(function(o){drawObject(c,o);});
    if(p.fountain){var f=p.fountain;c.beginPath();c.arc(f[0],f[1],f[2],0,Math.PI*2);c.fillStyle=images.refinedGround?refined[0]:detail[1];c.fill();c.save();c.globalCompositeOperation='screen';c.globalAlpha=.18;c.fillStyle='#f3e8cb';c.fill();c.restore();c.strokeStyle='#b4aa89';c.lineWidth=5;c.stroke();drawObject(c,structure('landmarks',3,f[0]-160,f[1]-220,320,330));}
    if(p.fire&&images.firepit){var f=p.fire;c.drawImage(images.firepit,f[0]-80,f[1]-96,160,120);}else if(p.fire){var f=p.fire;c.fillStyle='#63533a';c.beginPath();c.ellipse(f[0],f[1],f[2],f[2]*.7,0,0,Math.PI*2);c.fill();for(var i=0;i<10;i++){var a=i*Math.PI/5;c.fillStyle=i%2?'#c5bca0':'#a69776';c.beginPath();c.ellipse(f[0]+Math.cos(a)*f[2],f[1]+Math.sin(a)*f[2]*.7,12,9,a,0,Math.PI*2);c.fill();}c.fillStyle='#edab4c';c.beginPath();c.moveTo(f[0]-18,f[1]);c.quadraticCurveTo(f[0]-25,f[1]-18,f[0]+4,f[1]-42);c.quadraticCurveTo(f[0]+5,f[1]-14,f[0]+20,f[1]);c.closePath();c.fill();}

    cache[token]=sheet;return sheet;
  }
  // Sort at the solid facade, so a person standing on the front steps stays visible.
  function depth(p){return p.y+p.h*(p.sheet==='nature'? .92:p.door?.76:.88);}
  function objects(p){return p.structures.concat(p.scenery||[]).concat(p.landscapes||[]).concat((p.trees||[]).map(function(t){return structure(t[4]||(t[2]===3?'harbor':'nature'),t[4]?t[5]:(t[2]===3?3:t[2]),t[0],t[1],t[3]*.95,t[3]);}));}
  return {install:install,paint:paint,files:files,ready:function(p){return needed(p).every(function(id){return Boolean(images[id]);});},failed:function(){return failed.slice();},objects:objects,depth:depth,drawObject:drawObject,version:function(){return version;}};
}));
