(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.StarshipNativeTerrain=api;}(globalThis,function(){
  'use strict';
  var files={ground:'ground-materials-v1.png',harbor:'harbor-props-v1.png',nature:'nature-props-v1.png',landmarks:'landmark-props-v1.png',city:'city-props-v1.png',village:'village-props-v1.png',detail:'detail-materials-v1.png',workshop:'workshop-building-v1.png',healer:'healer-building-v1.png'},images={},cache={},version=0,requested={},failed=[];
  // Frames are authored against the delivered transparent sprite sheets. They
  // are individual objects, never a resized overview illustration.
  var frames={
    harbor:[[0,0,680,610],[680,120,574,470],[0,700,635,554],[635,600,619,654]],
    nature:[[0,0,660,680],[710,0,544,700],[0,640,650,614],[620,720,634,534]],
    landmarks:[[0,0,625,610],[630,0,624,615],[0,620,640,634],[640,620,614,634]]
  };
  function imageId(p){return p.sheet==='city'&&p.cell===0?'workshop':p.sheet==='village'&&p.cell===2?'healer':p.sheet;}
  function needed(p){var ids=['ground','detail','nature'];objects(p).forEach(function(o){var id=imageId(o);if(!ids.includes(id))ids.push(id);});if(p.fountain&&!ids.includes('landmarks'))ids.push('landmarks');return ids;}
  function ensure(p){if(typeof Image==='undefined')return;needed(p).forEach(function(id){if(requested[id])return;requested[id]=true;var img=new Image();img.onload=function(){images[id]=img;cache={};version++;};img.onerror=function(){failed.push(id);};img.src='./assets/exploration/native/'+files[id];});}

  function structure(sheet,cell,x,y,w,h){return {sheet:sheet,cell:cell,x:x,y:y,w:w,h:h};}
  function door(map,to,sheet,cell,w,h,u){var e=map.exits.find(function(e){return e.to===to;});if(!e)return null;var p=structure(sheet,cell,e.x-w*(u||.5),e.y-h*.86,w,h);p.door=[e.x,e.y];return p;}
  function install(maps){
    var city=maps.city,south=maps.south,village=maps.village;
    city.nativeTerrain={style:'city',structures:[door(city,'factoryNear','city',0,300,330,.64),door(city,'recovery','city',3,220,270,.55),door(city,'observatory','city',2,300,300,.52),door(city,'cityInn','landmarks',1,330,350,.46),structure('city',1,1190,400,200,300),structure('harbor',0,310,890,260,280),structure('harbor',1,2840,1040,180,150)].filter(Boolean),trees:[[420,1240,0,240],[1100,1430,1,200],[920,1120,3,200],[1120,470,0,175],[1510,1410,1,190],[2740,1210,0,210],[3140,530,1,185],[340,1570,0,170]],fields:[],water:[{points:[[0,1880],[900,1830],[1800,1770],[2670,1780],[3678,1720]],width:270}],fountain:[1841,909,198]};
    south.nativeTerrain={style:'country',structures:[door(south,'southStation','landmarks',2,260,280)],trees:[[180,450,3,250],[730,150,1,250],[680,590,0,220],[90,420,0,200],[200,850,1,180],[670,300,0,220],[1310,440,1,210],[1300,930,0,180]],fields:[[80,90,330,210],[760,50,260,200],[760,590,200,140],[1130,30,280,110]],water:[{points:[[1400,0],[1370,200],[1340,400],[1300,600],[1320,850],[1370,1024]],width:125}]};
    maps.riverRoad.nativeTerrain={style:'country',structures:[structure('harbor',2,430,20,250,200)],trees:[[500,260,1,220],[1030,520,2,180],[150,400,0,220],[500,630,1,210],[1150,260,0,240],[1430,510,1,200]],fields:[[20,570,300,180],[390,5,270,90],[1040,25,430,170],[1070,780,190,120]],water:[{points:[[810,0],[830,180],[880,350],[900,550],[830,750],[740,939]],width:160}]};
    var port=maps.lotin;
    port.paths.forEach(function(p,i){p.width=i===1?82:100;});
    port.nativeTerrain={style:'port',structures:[structure('harbor',0,1090,1390,350,300),structure('harbor',1,985,1550,125,105),structure('city',3,1400,1640,270,300),structure('landmarks',1,1820,1890,260,280)],trees:[[640,1340,0,240],[650,1670,1,210],[1200,1030,3,250],[320,1530,1,210],[670,2080,0,210],[1250,2240,1,210],[2830,1330,0,230]],fields:[],land:[[[0,0],[1560,0],[1590,990],[1500,1140],[1440,1290],[1560,1500],[1800,1740],[2040,1950],[2700,1980],[3030,2070],[3060,2460],[2400,2700],[0,2700]],[[2340,0],[4608,0],[4608,2040],[3000,2040],[2940,1800],[2700,1740],[2550,1530],[2400,1380],[2280,1200],[2325,990]]],water:[]};
    village.nativeTerrain={style:'village',structures:[door(village,'clinic','village',2,260,300,.64),structure('village',0,860,230,300,290),structure('village',1,370,220,270,240),structure('village',3,1560,635,260,220)],trees:[[1710,600,0,230],[2210,480,1,240],[2150,880,3,220],[80,840,0,230],[550,1030,1,220],[1450,180,0,260],[1850,970,1,250],[2230,1030,0,240],[2250,200,1,230]],fields:[],water:[{points:[[0,1100],[400,1070],[800,1010],[1250,970],[1750,1080],[2508,1260]],width:110}],fire:[1248,592,48]};
    // Keep all visible structure footprints solid. Entries sit just outside the
    // front facade, rather than sharing a coordinate with roof pixels.
    [city,south,maps.riverRoad,port,village].forEach(function(m){
      m.nativeTerrain.structures=m.nativeTerrain.structures.filter(Boolean);
      m.nativeObstacles=(m.nativeTerrain.trees||[]).map(function(t){return {x:t[0]+t[3]*.475,y:t[1]+t[3]*.92,rx:t[3]*.14,ry:t[3]*.09};});
      m.buildings=m.nativeTerrain.structures.map(function(p){return {x:p.x+p.w*.06,y:p.y+p.h*.06,w:p.w*.88,h:p.h*(p.door ? .74 : .82)};});
      // The foundation beside the entry is solid too; only the actual steps open.
      m.nativeTerrain.structures.filter(function(p){return p.door&&p.sheet==='city'&&p.cell===0;}).forEach(function(p){var left=p.x+p.w*.06,right=p.x+p.w*.94,gap=p.w*.12,doorX=p.door[0];[[left,doorX-gap],[doorX+gap,right]].forEach(function(span){if(span[1]>span[0])m.buildings.push({x:span[0],y:p.y+p.h*.8,w:span[1]-span[0],h:p.h*.14});});});
    });
  }
  function polygon(c,points){c.beginPath();points.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.closePath();}
  function stroke(c,path,width,color){c.beginPath();path.points.forEach(function(p,i){if(i)c.lineTo(p[0],p[1]);else c.moveTo(p[0],p[1]);});c.lineCap='round';c.lineJoin='round';c.lineWidth=width;c.strokeStyle=color;c.stroke();}
  function rectBlocked(test,x,y,w,h){for(var py=y;py<=y+h;py+=12)for(var px=x;px<=x+w;px+=12)if(test(px,py))return false;return true;}
  function drawObject(c,p){var id=imageId(p),image=images[id];if(!image)return;var f=id!==p.sheet?[0,0,image.naturalWidth,image.naturalHeight]:(frames[p.sheet]||[])[p.cell];if(!f){var sw=image.naturalWidth/2,sh=image.naturalHeight/2;f=[p.cell%2*sw,Math.floor(p.cell/2)*sh,sw,sh];}c.save();if(p.sheet==='nature'&&p.cell===0){c.beginPath();[[0,0],[1,0],[1,1],[.31,1],[.31,.91],[0,.91]].forEach(function(v,i){if(i)c.lineTo(p.x+v[0]*p.w,p.y+v[1]*p.h);else c.moveTo(p.x+v[0]*p.w,p.y+v[1]*p.h);});c.closePath();c.clip();}c.drawImage(image,f[0],f[1],f[2],f[3],p.x,p.y,p.w,p.h);c.restore();}
  function patterns(c,id){id=id||'ground';var result=[];if(!images[id])return ['#c5bba0','#b6a477','#496b40','#1c6770'];for(var i=0;i<4;i++){var tile=document.createElement('canvas');tile.width=tile.height=256;var tc=tile.getContext('2d'),size=images[id].naturalWidth/2;tc.drawImage(images[id],(i%2)*size+4,Math.floor(i/2)*size+4,size-8,size-8,0,0,256,256);result.push(c.createPattern(tile,'repeat'));}return result;}
  function paint(key,width,height,test,settings){
    if(typeof document==='undefined')return null;ensure(settings.native);
    var token=key+':'+version+':'+Boolean(settings.groundOnly);if(cache[token])return cache[token];
    var sheet=document.createElement('canvas');sheet.width=width;sheet.height=height;var c=sheet.getContext('2d'),p=settings.native,paths=settings.paths||[],tiles=patterns(c),detail=patterns(c,'detail');
    c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.fillStyle=p.style==='port'?tiles[3]:(images.detail?detail[2]:tiles[2]);c.fillRect(0,0,width,height);
    (p.land||[]).forEach(function(points){polygon(c,points);c.fillStyle=images.detail?detail[2]:tiles[2];c.fill();c.lineWidth=22;c.strokeStyle='#a59c7c';c.stroke();c.lineWidth=5;c.strokeStyle='#d5d3ad';c.stroke();});
    (p.water||[]).forEach(function(r){stroke(c,r,r.width+24,'#a7aa79');stroke(c,r,r.width+10,'#9fc3af');stroke(c,r,r.width,tiles[3]);});
    (p.fields||[]).forEach(function(f){if(!rectBlocked(test,f[0]-10,f[1]-10,f[2]+20,f[3]+20))return;c.save();c.fillStyle='#927a44';c.fillRect(f[0],f[1],f[2],f[3]);c.strokeStyle='#d2b765';c.lineWidth=5;for(var x=f[0]+8;x<f[0]+f[2];x+=12){c.beginPath();c.moveTo(x,f[1]+5);c.lineTo(x-5,f[1]+f[3]-5);c.stroke();}c.strokeStyle='#5a4930';c.lineWidth=5;c.strokeRect(f[0],f[1],f[2],f[3]);c.strokeStyle='#c0a279';c.lineWidth=2;c.strokeRect(f[0]-3,f[1]-3,f[2]+6,f[3]+6);c.restore();});
    // A single vector lane specification drives the visible road and collision.
    // Draw borders first, then all road surfaces, to keep junctions unobstructed.
    paths.forEach(function(path){stroke(c,path,path.width*2+20,'#30402c66');stroke(c,path,path.width*2+10,images.detail?detail[1]:'#aaa28a');});
    paths.forEach(function(path){stroke(c,path,path.width*2,p.style==='city'||p.style==='port'?(images.detail?detail[1]:tiles[0]):tiles[1]);});
    // River crossings receive a real timber deck and railings, not an invisible
    // permission to walk across a river illustration.
    var waters=p.water||[];
    paths.forEach(function(path){for(var i=1;i<path.points.length;i++){var a=path.points[i-1],b=path.points[i],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);for(var d=0;d<len;d+=10){var t=d/len,x=a[0]+dx*t,y=a[1]+dy*t,onWater=waters.some(function(r){return r.points.some(function(v,j){if(!j)return false;var u=r.points[j-1],vx=v[0]-u[0],vy=v[1]-u[1],q=Math.max(0,Math.min(1,((x-u[0])*vx+(y-u[1])*vy)/(vx*vx+vy*vy)));return Math.hypot(x-u[0]-q*vx,y-u[1]-q*vy)<r.width/2+12;});});if(p.style==='port')onWater=x>1570&&x<2320&&y<1400;if(!onWater)continue;var nx=-dy/len,ny=dx/len;c.strokeStyle=images.detail?detail[0]:'#ab8553';c.lineWidth=12;c.beginPath();c.moveTo(x+nx*path.width,y+ny*path.width);c.lineTo(x-nx*path.width,y-ny*path.width);c.stroke();[-1,1].forEach(function(side){var rx=x+nx*(path.width+7)*side,ry=y+ny*(path.width+7)*side;c.strokeStyle='#55452e';c.lineWidth=7;c.beginPath();c.moveTo(rx,ry);c.lineTo(rx+dx/len*12,ry+dy/len*12);c.stroke();c.strokeStyle='#d6ba84';c.lineWidth=2;c.stroke();if(d%50===0){c.fillStyle='#5a452c';c.fillRect(rx-4,ry-9,8,16);c.fillStyle='#c7a672';c.fillRect(rx-4,ry-10,8,3);}});}}});
    // Deliberately placed, varied silhouettes; no grid of cloned trees/houses.
    if(!settings.groundOnly)objects(p).forEach(function(o){drawObject(c,o);});
    if(p.fountain){var f=p.fountain;c.fillStyle='#89916d';c.beginPath();c.arc(f[0],f[1],f[2],0,Math.PI*2);c.fill();c.strokeStyle='#c6c4a0';c.lineWidth=8;c.stroke();drawObject(c,structure('landmarks',3,f[0]-160,f[1]-220,320,330));}
    if(p.fire){var f=p.fire;c.fillStyle='#63533a';c.beginPath();c.ellipse(f[0],f[1],f[2],f[2]*.7,0,0,Math.PI*2);c.fill();for(var i=0;i<10;i++){var a=i*Math.PI/5;c.fillStyle=i%2?'#c5bca0':'#a69776';c.beginPath();c.ellipse(f[0]+Math.cos(a)*f[2],f[1]+Math.sin(a)*f[2]*.7,12,9,a,0,Math.PI*2);c.fill();}c.fillStyle='#edab4c';c.beginPath();c.moveTo(f[0]-18,f[1]);c.quadraticCurveTo(f[0]-25,f[1]-18,f[0]+4,f[1]-42);c.quadraticCurveTo(f[0]+5,f[1]-14,f[0]+20,f[1]);c.closePath();c.fill();}

    cache[token]=sheet;return sheet;
  }
  // Sort at the solid facade, so a person standing on the front steps stays visible.
  function depth(p){return p.y+p.h*(p.sheet==='nature'? .92:p.door?.8:.88);}
  function objects(p){return p.structures.concat((p.trees||[]).map(function(t){return structure(t[2]===3?'harbor':'nature',t[2]===3?3:t[2],t[0],t[1],t[3]*.95,t[3]);}));}
  return {install:install,paint:paint,files:files,ready:function(p){return needed(p).every(function(id){return Boolean(images[id]);});},failed:function(){return failed.slice();},objects:objects,depth:depth,drawObject:drawObject,version:function(){return version;}};
}));
