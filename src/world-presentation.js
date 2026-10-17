(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;root.StarshipWorldPresentation=api;}(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  var cast={
    clinic:[{id:'lia',name:'莉亞',role:'醫療屋',x:560,y:350,line:'清水和乾淨布帶放在這邊。先坐下，把傷口照顧好。'}],
    observatory:[{id:'seifra',name:'賽芙拉',role:'觀測分會',x:550,y:330,line:'量到的數值和記得的路況要分開記，還沒核對的地方先留白。'}],
    station:[{id:'cenwu',name:'岑霧',role:'山腰驛站',x:570,y:355,line:'繩索和回程記號先核對。驛報還沒送到的，就明寫未送達。'}],
    village:[{id:'lia',name:'莉亞',role:'療養屋',x:1350,y:490,line:'藥草和清水都在這裡。妳先照顧好自己的傷，別急著提重物。'},{id:'reyn',name:'雷恩',role:'巡林者',x:355,y:405,patrol:[0,24],line:'走林道要看地面，也要看風。溪水就從橋上過，別抄下游的近路。'},{id:'isar',name:'伊薩爾',role:'村中守望者',x:805,y:477,line:'沿亮著燈的村道走。想歇一會兒，就到火場旁坐坐。'}],
    city:[{id:'mila',name:'米菈',role:'工坊學徒',x:200,y:620,patrol:[12,6],line:'要找工坊就沿城西這條街走。搬東西的人多，轉彎記得慢一點。'},{id:'vark',name:'老瓦克',role:'工坊匠人',x:270,y:655,line:'修東西得看仔細。先別碰工作臺上的工具，沿街走走吧。'},{id:'seifra',name:'賽芙拉',role:'觀測分會',x:320,y:310,line:'分會就在這裡。有需要記錄的路況，可以先把圖紙整理好。'}],
    echo:[{id:'cenwu',name:'岑霧',role:'山腰驛站',x:620,y:480,line:'山路上先找穩當的落腳處。到了驛站，就停下來歇歇。'}],
    banksWest:[{id:'musa',name:'穆莎',role:'岸邊採集者',x:400,y:460,line:'橋中間的斷口還在。想去另一岸，得從各自的陸路入口走。'}],
    banksEast:[{id:'kerida',name:'珂芮妲',role:'外勤測量師',x:1170,y:300,line:'地圖上的線要和腳下的地面一起看。斷掉的地方，可不能當成路。'}],
    bellcourt:[{id:'wenlan',name:'溫藍',role:'外庭物資管事',x:630,y:425,line:'外庭的石階可以慢慢走。再往外就是雲海，別離開完整的地面。'}]
  };
  var residentRegions={city:'白鐘城',village:'獸靈之村',mistbridge:'霧橋鎮',lotin:'洛汀港',south:'南驛山谷',banksWest:'北斷橋西岸聚落'};
  cast.city.push({id:'guild-scout',spriteId:'resident-01',name:'協會斥候',role:'冒險者小隊',x:1180,y:386,patrol:[22,0],line:'北門路標先由我們確認安全，接了討伐委託再去看目標。'});
  cast.city.push({id:'guild-medic',spriteId:'resident-02',name:'同行補給員',role:'冒險者小隊',x:1200,y:386,patrol:[22,0],line:'我們一起從協會出發。補給和撤退路線都要先說好。'});
  cast.city.push({id:'market-helper',spriteId:'resident-01',name:'市集幫手',role:'白鐘居民',x:1160,y:370,patrol:[12,0],line:'南驛家書請交給收件人。貨車經過主街時記得靠邊。'});
  // Anonymous local residents use distinct art, while established story characters keep their identities.
  [
    [1,'city',920,300,'今天的風很舒服。走累了，可以在廣場附近歇一會兒。'],
    [2,'city',650,500,'住宅小巷都接著主街，找路時看看街口的方向就好。'],
    [3,'mistbridge',705,435,'這個時候的河谷很好看。走到河邊記得從橋上通過。'],
    [4,'mistbridge',760,425,'順著街道走就能找到旅店，別繞進河岸的草坡。'],
    [5,'mistbridge',875,690,'南邊這條街接回鎮中心，路旁的屋子也有人照料。'],
    [6,'banksWest',320,420,'斷橋的缺口還在。到對岸要走各自的陸路入口。'],
    [7,'lotin',320,580,'岸上的風帶著海味。沿著碼頭走，別靠水邊太近。'],
    [8,'lotin',1000,540,'港內水道從橋上過，船邊不是能直接踩下去的路。'],
    [9,'village',750,455,'草藥分好了就會送到醫療屋。沿村道走，很快就到了。'],
    [10,'village',460,420,'村道接著橋和西邊商路。天色暗下來時，走有燈的地方。'],
    [11,'south',980,800,'田埂接回驛路。過河的時候，要找完整的橋面。'],
    [12,'south',510,550,'驛站就在附近，出發前可以先看清楚路口的方向。']
  ].forEach(function(a){var number=('0'+a[0]).slice(-2),region=residentRegions[a[1]];if(!cast[a[1]])cast[a[1]]=[];cast[a[1]].push({id:'resident-'+number,spriteId:'resident-'+number,portraitSrc:'./assets/exploration/resident-'+number+'-portrait-v1.png',genericResident:true,name:region+'居民',role:region,x:a[2],y:a[3],line:a[4]});});
  function npcs(map){return cast[map]||[];}
  function position(npc,time,reduced,passable){var phase=reduced?0:(1-Math.cos(time/2400))*.5,dx=npc.patrol?npc.patrol[0]*phase:0,dy=npc.patrol?npc.patrol[1]*phase:0,x=npc.x+dx,y=npc.y+dy;return !passable||passable(x,y)?{x:x,y:y}:{x:npc.x,y:npc.y};}
  function label(ctx,text,x,y,color){ctx.save();ctx.font='600 13px sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#162f29';ctx.strokeText(text,x,y);ctx.fillStyle=color||'#fff0c7';ctx.fillText(text,x,y);ctx.restore();}
  // A doorway can also be a story landmark. Prefer its actionable entrance
  // label rather than drawing two different names on the same ground anchor.
  function locationLabels(exits,sites){var labels=exits.slice();sites.forEach(function(site){if(!labels.some(function(label){return Math.hypot(label.x-site.x,label.y-site.y)<32;}))labels.push(site);});return labels;}
  function environment(ctx,map,view,time,reduced){
    if(reduced)return;
    ctx.save();
    // World-space wind motes stay attached to the terrain while the camera moves.
    for(var i=0;i<22;i++){var x=((i*193+time*.012)%(map.width+80))-40,y=(i*137+Math.sin(time/2200+i)*22)%map.height;if(x<view.x-20||x>view.x+view.width+20||y<view.y||y>view.y+view.height)continue;ctx.globalAlpha=.22+.18*Math.sin(time/1700+i);ctx.fillStyle=i%3?'#f5df9e':'#d3e5b4';ctx.beginPath();ctx.ellipse(x,y,3,1.2,Math.sin(time/1600+i),0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
  function fire(ctx,x,y,time,reduced){if(reduced)return;ctx.save();var g=ctx.createRadialGradient&&ctx.createRadialGradient(x,y,2,x,y,72);if(g&&g.addColorStop){g.addColorStop(0,'rgba(255,177,69,.18)');g.addColorStop(1,'rgba(255,177,69,0)');ctx.fillStyle=g;ctx.fillRect(x-72,y-72,144,144);}ctx.fillStyle='#ffd18a';ctx.globalAlpha=.65;for(var i=0;i<4;i++){var t=reduced?.4:(time/1300+i*.23)%1;ctx.beginPath();ctx.arc(x+Math.sin(i+time/700)*7,y-12-t*26,1.5*(1-t),0,Math.PI*2);ctx.fill();}ctx.restore();}
  function minimap(canvas,img,map,state,route,npcs,view){if(!canvas)return;var ctx=canvas.getContext('2d');if(!ctx)return;var w=canvas.width,h=canvas.height,scale=Math.min(w/map.width,h/map.height),left=(w-map.width*scale)/2,top=(h-map.height*scale)/2;ctx.clearRect(0,0,w,h);ctx.fillStyle='#16352d';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(left,top);ctx.scale(scale,scale);if(img)ctx.drawImage(img,0,0,map.width,map.height);var native=globalThis.StarshipNativeTerrain;if(map.nativeTerrain&&native)native.objects(map.nativeTerrain).forEach(function(o){native.drawObject(ctx,o);});ctx.fillStyle='rgba(8,27,23,.24)';ctx.fillRect(0,0,map.width,map.height);if(route.length){ctx.beginPath();route.forEach(function(p,i){if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y);});ctx.strokeStyle='#ffe2a1';ctx.lineWidth=2/scale;ctx.stroke();}ctx.strokeStyle='rgba(239,236,208,.6)';ctx.lineWidth=1/scale;ctx.strokeRect(view.x,view.y,view.width,view.height);map.exits.forEach(function(p){ctx.fillStyle='#b4e4cf';ctx.beginPath();ctx.arc(p.x,p.y,2.4/scale,0,Math.PI*2);ctx.fill();});npcs.forEach(function(p){ctx.fillStyle='#f7d38a';ctx.beginPath();ctx.arc(p.x,p.y,1.8/scale,0,Math.PI*2);ctx.fill();});ctx.fillStyle='#fff8db';ctx.strokeStyle='#1c3b30';ctx.lineWidth=1.5/scale;ctx.beginPath();ctx.arc(state.x,state.y,4/scale,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
  return {npcs:npcs,position:position,label:label,locationLabels:locationLabels,environment:environment,fire:fire,minimap:minimap};
}));
