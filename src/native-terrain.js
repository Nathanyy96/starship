(function(root,factory){var api=factory(typeof module==='object'&&module.exports?require('./native-scene-layouts'):root.StarshipNativeSceneLayouts);if(typeof module==='object'&&module.exports)module.exports=api;root.StarshipNativeTerrain=api;}(globalThis,function(layouts){
  'use strict';
  var files={ground:'ground-materials-v1.png',harbor:'harbor-props-front-v2.png',harborFront:'harbor-warehouse-front-v1.png',nature:'nature-props-v1.png',landmarks:'landmark-props-front-v2.png',city:'city-buildings-front-v3.png',village:'village-props-front-v2.png',detail:'detail-materials-v1.png',workshop:'workshop-building-v1.png',healer:'healer-building-v1.png',frontier:'frontier-props-v1.png',frontierInn:'frontier-inn-front-v1.png',frontierSupply:'frontier-supply-front-v1.png',firepit:'village-firepit-v1.png',fields:'wheat-field-v1.png',scenery:'roadside-scenery-v1.png',town:'town-buildings-front-v4.png',townDetail:'town-detail-props-v1.png',regional:'regional-scenery-v1.png',orchard:'orchard-tree-v1.png',whiteBell:'white-bell-buildings-front-v3.png',northGate:'white-bell-north-gate-v1.png'},images={},cache={},version=0,requested={},failed=[];
  // Frames are authored against the delivered transparent sprite sheets. They
  // are individual objects, never a resized overview illustration.
  var frames={
    harbor:[[0,0,627,627],[627,0,627,627],[0,627,627,627],[627,627,627,627]],
    nature:[[0,0,660,680],[710,0,544,700],[0,640,650,614],[620,720,634,534]],
    landmarks:[[0,0,627,627],[627,0,627,627],[0,627,627,627],[627,627,627,627]],
    orchard:[[220,0,1100,1000]],northGate:[[0,0,1536,1024]]
  };
  function imageId(p){if(p.sheet==='harbor'&&p.cell===0)return 'harborFront';if(p.sheet==='frontier'&&p.cell===0)return 'frontierInn';if(p.sheet==='frontier'&&p.cell===1)return 'frontierSupply';return p.sheet;}
  function needed(p){var ids=['ground','detail','nature'];objects(p).forEach(function(o){var id=imageId(o);if(!ids.includes(id))ids.push(id);});if(p.fields&&p.fields.length)ids.push('fields');if(p.fire)ids.push('firepit');if(p.fountain&&!ids.includes('landmarks'))ids.push('landmarks');return ids;}
  function ensure(p){if(typeof Image==='undefined')return;needed(p).forEach(function(id){if(requested[id])return;requested[id]=true;var img=new Image();img.onload=function(){images[id]=img;cache={};version++;};img.onerror=function(){failed.push(id);};img.src='./assets/exploration/native/'+files[id];});}

  function structure(sheet,cell,x,y,w,h){return {sheet:sheet,cell:cell,x:x,y:y,w:w,h:h};}
  // Authored layouts are committed after route, frontage and collision checks.
  // Loading a map never runs a placement search or moves its buildings.
  function install(maps){Object.keys(layouts).forEach(function(id){if(!maps[id])return;if(id==='road'){maps[id].nativeTerrain={overview:true,style:'country',structures:[],trees:[],scenery:[],landscapes:[]};maps[id].buildings=[];maps[id].nativeObstacles=[];maps[id].paths.forEach(function(p,i){p.width=i?32:30;});return;}var plan=JSON.parse(JSON.stringify(layouts[id]));Object.keys(plan).forEach(function(key){maps[id][key]=plan[key];});});}
  function polygon(c,points){c.beginPath();points.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.closePath();}
  function stroke(c,path,width,color){c.beginPath();path.points.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.lineCap='round';c.lineJoin='round';c.lineWidth=width;c.strokeStyle=color;c.stroke();}
  // Composite translucent road layers once. Repeated transparent strokes make
  // junctions and overlapping lanes conspicuously brighter than straight roads.
  function roadTint(c,overlay,paths,extra,color,alpha,blend){
    var oc=overlay.getContext('2d');oc.globalCompositeOperation='source-over';oc.clearRect(0,0,overlay.width,overlay.height);
    paths.forEach(function(path){stroke(oc,path,path.width*2+extra,'#fff');});
    oc.globalCompositeOperation='source-in';oc.fillStyle=color;oc.fillRect(0,0,overlay.width,overlay.height);
    oc.globalCompositeOperation='source-over';c.save();c.globalCompositeOperation=blend||'source-over';c.globalAlpha=alpha;c.drawImage(overlay,0,0);c.restore();
  }
  function rectBlocked(test,x,y,w,h){for(var py=y;py<=y+h;py+=12)for(var px=x;px<=x+w;px+=12)if(test(px,py))return false;return true;}
  // A road beside a river can overlap its painted bank. Only a road that
  // crosses the river's direction should receive a timber bridge deck.
  function bridgeAt(waters,a,b,x,y){
    var dx=b[0]-a[0],dy=b[1]-a[1],roadLength=Math.hypot(dx,dy);
    if(!roadLength)return false;
    return waters.some(function(r){return r.points.some(function(v,j){
      if(!j)return false;
      var u=r.points[j-1],vx=v[0]-u[0],vy=v[1]-u[1],riverLength=Math.hypot(vx,vy);
      if(!riverLength||Math.abs(dx*vy-dy*vx)<roadLength*riverLength*.35)return false;
      var q=Math.max(0,Math.min(1,((x-u[0])*vx+(y-u[1])*vy)/(riverLength*riverLength)));
      return Math.hypot(x-u[0]-q*vx,y-u[1]-q*vy)<r.width/2+12;
    });});
  }
  function drawObject(c,p){var id=imageId(p),image=images[id];if(!image)return;var f=id!==p.sheet?[0,0,image.naturalWidth,image.naturalHeight]:(frames[p.sheet]||[])[p.cell];if(!f){var sw=image.naturalWidth/2,sh=image.naturalHeight/2;f=[p.cell%2*sw,Math.floor(p.cell/2)*sh,sw,sh];}c.save();if(p.sheet==='nature'&&p.cell===0){c.beginPath();[[0,0],[1,0],[1,1],[.31,1],[.31,.91],[0,.91]].forEach(function(v,i){if(i)c.lineTo(p.x+v[0]*p.w,p.y+v[1]*p.h);else c.moveTo(p.x+v[0]*p.w,p.y+v[1]*p.h);});c.closePath();c.clip();}c.drawImage(image,f[0],f[1],f[2],f[3],p.x,p.y,p.w,p.h);c.restore();}
  function patterns(c,id){id=id||'ground';var result=[];if(!images[id])return ['#c5bba0','#b6a477','#496b40','#1c6770'];for(var i=0;i<4;i++){var tile=document.createElement('canvas');tile.width=tile.height=256;var tc=tile.getContext('2d'),size=images[id].naturalWidth/2;var frame=(frames[id]||[])[i]||[(i%2)*size,Math.floor(i/2)*size,size,size];tc.drawImage(images[id],frame[0]+4,frame[1]+4,frame[2]-8,frame[3]-8,0,0,256,256);result.push(c.createPattern(tile,'repeat'));}return result;}
  function paint(key,width,height,test,settings){
    if(typeof document==='undefined')return null;ensure(settings.native);
    var token=key+':'+version+':'+Boolean(settings.groundOnly);if(cache[token])return cache[token];
    var sheet=document.createElement('canvas');sheet.width=width;sheet.height=height;var c=sheet.getContext('2d'),p=settings.native,paths=settings.paths||[],tiles=patterns(c),detail=patterns(c,'detail'),roadOverlay=document.createElement('canvas');roadOverlay.width=width;roadOverlay.height=height;
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.fillStyle=p.style==='port'?tiles[3]:tiles[2];c.fillRect(0,0,width,height);
    // Lift the dark material atlas with a warm daylight tint before drawing
    // rivers, crops and buildings on top; this keeps texture instead of flat fill.
    if(p.style!=='port'){c.save();c.globalCompositeOperation='screen';c.globalAlpha=.15;c.fillStyle='#e4e3c6';c.fillRect(0,0,width,height);c.restore();}
    (p.land||[]).forEach(function(points){polygon(c,points);c.fillStyle=tiles[2];c.fill();c.lineWidth=22;c.strokeStyle='#a59c7c';c.stroke();c.lineWidth=5;c.strokeStyle='#d5d3ad';c.stroke();});
    // A narrow, translucent verge blends the cobbles into the grass without
    // changing the road centerline or its walkable width.
    if(p.style!=='port')roadTint(c,roadOverlay,paths,22,'#42532f',.28);
    (p.water||[]).forEach(function(r){stroke(c,r,r.width+24,'#a7aa79');stroke(c,r,r.width+10,'#9fc3af');stroke(c,r,r.width,tiles[3]);});
    (p.plazas||[]).forEach(function(plaza){polygon(c,plaza);c.fillStyle=images.detail?detail[1]:tiles[0];c.fill();c.save();c.globalCompositeOperation='screen';c.globalAlpha=.65;c.fillStyle='#f1e4c8';c.fill();c.restore();c.lineWidth=7;c.strokeStyle='rgba(204,192,164,.72)';c.stroke();});
    (p.scatter||[]).forEach(function(q){var r=q.r;if(q.kind<.24){for(var rock=0;rock<3;rock++){var rx=q.x+(rock-1)*r*.35,ry=q.y+Math.sin(rock*2+q.kind*7)*r*.18;c.fillStyle=rock%2?'#aaa58f':'#7f8375';c.beginPath();c.ellipse(rx,ry,r*(.14+rock*.025),r*(.085+rock*.012),rock*.4,0,Math.PI*2);c.fill();c.fillStyle='#d2c9ad';c.beginPath();c.ellipse(rx-r*.04,ry-r*.025,r*.07,r*.03,0,0,Math.PI*2);c.fill();}}else{for(var leaf=0;leaf<7;leaf++){var a=leaf*2.399+q.kind*5,d=r*(.16+((leaf*17+q.kind*31)%51)/100),lx=q.x+Math.cos(a)*d,ly=q.y+Math.sin(a)*d*.75;c.save();c.globalAlpha=.3;c.fillStyle=['#56734b','#78915a','#92a56d'][leaf%3];c.beginPath();c.ellipse(lx,ly,r*.12,r*.055,a,0,Math.PI*2);c.fill();c.restore();}if(q.kind>.68){for(var fl=0;fl<4;fl++){var a2=fl*2.399+q.kind*9,fd=r*(.14+((fl*23+q.kind*21)%42)/100),fx=q.x+Math.cos(a2)*fd,fy=q.y+Math.sin(a2)*fd*.75;c.fillStyle=['#f2dfad','#eee7cf','#d8c8e3'][fl%3];c.beginPath();c.arc(fx,fy,1.5+q.kind*1.3,0,Math.PI*2);c.fill();c.fillStyle='#e8bd68';c.beginPath();c.arc(fx,fy,.9,0,Math.PI*2);c.fill();}}}});
    (p.fields||[]).forEach(function(f){if(!rectBlocked(test,f[0]-10,f[1]-10,f[2]+20,f[3]+20))return;if(images.fields){if(f[4]){c.save();c.translate(f[0]+f[2]/2,f[1]+f[3]/2);c.rotate(f[4]);c.drawImage(images.fields,-f[2]/2-10,-f[3]/2-10,f[2]+20,f[3]+20);c.restore();}else c.drawImage(images.fields,f[0]-10,f[1]-10,f[2]+20,f[3]+20);}});
    // A single vector lane specification drives the visible road and collision.
    // Draw borders first, then all road surfaces, to keep junctions unobstructed.
    roadTint(c,roadOverlay,paths,12,'#3d4c2d',.24);
    paths.forEach(function(path){stroke(c,path,path.width*2+5,images.detail?detail[1]:'#aaa28a');});
    paths.forEach(function(path){stroke(c,path,path.width*2,p.style==='city'||p.style==='port'||p.style==='ruin'?(images.detail?detail[1]:tiles[0]):tiles[1]);});
    // A subtle sunlit pass brightens cobbles without obscuring their texture.
    roadTint(c,roadOverlay,paths,0,'#f2e5c3',p.style==='city'||p.style==='ruin'?.32:.22,'screen');
    // River crossings receive a real timber deck and railings, not an invisible
    // permission to walk across a river illustration.
    var waters=p.water||[];
    paths.forEach(function(path){for(var i=1;i<path.points.length;i++){var a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);for(var d=0;d<len;d+=10){var t=d/len,x=a[0]+dx*t,y=a[1]+dy*t,onWater=bridgeAt(waters,a,b,x,y);if(p.style==='port')onWater=x>1570&&x<2320&&y<1400;if(!onWater)continue;var nx=-dy/len,ny=dx/len;c.strokeStyle=images.detail?detail[0]:'#ab8553';c.lineWidth=12;c.beginPath();c.moveTo(x+nx*path.width,y+ny*path.width);c.lineTo(x-nx*path.width,y-ny*path.width);c.stroke();[-1,1].forEach(function(side){var rx=x+nx*(path.width+7)*side,ry=y+ny*(path.width+7)*side;c.strokeStyle='#55452e';c.lineWidth=7;c.beginPath();c.moveTo(rx,ry);c.lineTo(rx+dx/len*12,ry+dy/len*12);c.stroke();c.strokeStyle='#d6ba84';c.lineWidth=2;c.stroke();if(d%50===0){c.fillStyle='#5a452c';c.fillRect(rx-4,ry-9,8,16);c.fillStyle='#c7a672';c.fillRect(rx-4,ry-10,8,3);}});}}});
    // Deliberately placed, varied silhouettes; no grid of cloned trees/houses.
    if(!settings.groundOnly)objects(p).forEach(function(o){drawObject(c,o);});
    if(p.fountain){var f=p.fountain;c.beginPath();c.arc(f[0],f[1],f[2],0,Math.PI*2);c.fillStyle=images.refinedGround?refined[0]:detail[1];c.fill();c.save();c.globalCompositeOperation='screen';c.globalAlpha=.18;c.fillStyle='#f3e8cb';c.fill();c.restore();c.strokeStyle='#b4aa89';c.lineWidth=5;c.stroke();drawObject(c,structure('landmarks',3,f[0]-160,f[1]-220,320,330));}
    if(p.fire&&images.firepit){var f=p.fire;c.drawImage(images.firepit,f[0]-80,f[1]-96,160,120);}else if(p.fire){var f=p.fire;c.fillStyle='#63533a';c.beginPath();c.ellipse(f[0],f[1],f[2],f[2]*.7,0,0,Math.PI*2);c.fill();for(var i=0;i<10;i++){var a=i*Math.PI/5;c.fillStyle=i%2?'#c5bca0':'#a69776';c.beginPath();c.ellipse(f[0]+Math.cos(a)*f[2],f[1]+Math.sin(a)*f[2]*.7,12,9,a,0,Math.PI*2);c.fill();}c.fillStyle='#edab4c';c.beginPath();c.moveTo(f[0]-18,f[1]);c.quadraticCurveTo(f[0]-25,f[1]-18,f[0]+4,f[1]-42);c.quadraticCurveTo(f[0]+5,f[1]-14,f[0]+20,f[1]);c.closePath();c.fill();}

    cache[token]=sheet;return sheet;
  }
  // Sort at the solid facade, so a person standing on the front steps stays visible.
  function depth(p){return p.y+p.h*(p.sheet==='nature'? .92:p.door?.76:.88);}
  function objects(p){return p.structures.concat(p.arches||[],p.scenery||[]).concat((p.trees||[]).map(function(t){return structure(t[2]===3?'harbor':'nature',t[2]===3?3:t[2],t[0],t[1],t[3]*.95,t[3]);}));}
  return {install:install,paint:paint,files:files,ready:function(p){return needed(p).every(function(id){return Boolean(images[id]);});},failed:function(){return failed.slice();},objects:objects,depth:depth,drawObject:drawObject,bridgeAt:bridgeAt,version:function(){return version;}};
}));
