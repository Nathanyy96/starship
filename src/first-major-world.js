(function (root, factory) {
  var api = factory(typeof module === 'object' && module.exports ? require('./story-1-0-current.js') : root.StarshipStory10Current,
    typeof module === 'object' && module.exports ? require('./exploration.js') : root.StarshipExploration);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.StarshipFirstMajorWorld = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (source, village) {
  'use strict';
  var renderer = typeof module === 'object' && module.exports ? require('./exploration-renderer.js') : globalThis.StarshipExplorationRenderer;
  var presentation=typeof module==='object'&&module.exports?require('./world-presentation.js'):globalThis.StarshipWorldPresentation;
  var heroMotion=typeof module==='object'&&module.exports?require('./hero-motion.js'):globalThis.StarshipHeroMotion;
  var maps = {
    village: { name: '獸靈之村', image: village.mapImage, width: village.WIDTH, height: village.HEIGHT, spawn: [1390,474], paths: village.paths,
      sites: village.sites, exits: [{name:'西行商路', x:70,y:370,to:'road',spawn:[1515,455]}] },
    road: { name: '西行商路・兩日行程', image: './assets/exploration/west-trade-road-v1.png', width:1672,height:939,spawn:[1515,455],
      paths:[{width:30,points:[[1565,423],[1515,455],[1450,465],[1375,495],[1300,523],[1195,510],[1100,509],[1030,528],[957,506],[911,474],[874,456],[788,468],[726,452],[676,435],[638,427],[580,413],[529,368],[461,355],[355,357],[264,342],[226,296],[203,258],[131,209]]},
        {width:32,points:[[874,456],[920,420],[958,420]]}],
      sites:[{id:'camp',name:'路旁營地',x:940,y:425,text:'西行第一晚的路旁營地；兩日步行的行程以正文為準。'},
        {id:'crossing',name:'商路溪橋',x:676,y:435,text:'沿橋通過小溪；水面與林地不是可直穿的捷徑。'}],
      exits:[{name:'返回獸靈之村',x:1515,y:455,to:'village',spawn:[124,390]}, {name:'進入白鐘城東門',x:131,y:209,to:'city',spawn:[1570,390]}] },
    city: { name:'白鐘城・東門至城西',image:'./assets/exploration/white-bell-streets-v1.png',width:1672,height:939,spawn:[1570,390],
      paths:[{width:32,points:[[1600,380],[1570,390],[1490,410],[1390,430],[1270,440],[1180,432],[1080,420],[1040,390],[970,335],[900,310],[800,300],[690,345],[620,380],[540,375],[450,370],[320,360],[160,350],[40,340]]},
        {width:27,points:[[320,360],[320,310],[315,260],[290,230]]},
        {width:29,points:[[90,350],[90,435],[90,540],[160,600],[260,650],[390,700]]},
        {width:28,points:[[800,300],[840,260],[840,180],[840,80]]},
        {width:28,points:[[1180,432],[1160,390],[1140,340]]},
        {width:30,points:[[1390,430],[1360,398],[1280,380]]},
        {width:32,points:[[1040,390],[1040,470],[970,530],[885,560],[775,550],[675,500],[630,445],[620,380]]}],
      sites:[{id:'plaza',name:'中央廣場',x:800,y:300,text:'廣場的噴泉與花壇不可穿越，沿環形街面行走。'}, {id:'north',name:'北門方向',x:840,y:80,text:'北門往霧橋鎮的正常步程為三日；北行探索場景將接在後續主線。'}],
      exits:[{name:'返回西行商路',x:1570,y:390,to:'road',spawn:[203,258]}] }
  };
  // First-major terrain is open independently of story progress. Coordinates follow the existing painted maps.
  function terrain(id,name,image,width,height,spawn,lines,sites) {
    maps[id]={name:name,image:'./assets/maps/'+image,width:width,height:height,spawn:spawn,
      paths:lines.map(function(points){return {width:28,points:points};}),
      sites:sites.map(function(p,i){return {id:'landmark-'+i,name:p[0],x:p[1],y:p[2],text:p[3]};}),exits:[]};
  }
  terrain('south','南驛山谷・農地與驛路','c1-104.png',1536,1024,[80,690],[
    [[40,675],[200,735],[365,770],[500,825],[660,893],[780,962]],
    [[365,770],[433,678],[485,600],[503,554],[590,512],[720,473],[835,484],[1000,530],[1120,565],[1150,690],[1210,775]],
    [[835,484],[1000,389],[1110,323],[1153,300],[1200,257],[1230,211],[1215,155],[1180,115]],
    [[660,893],[820,856],[990,800],[1150,770],[1320,835],[1480,895]],
    [[503,554],[540,475],[450,466],[328,450]],[[1150,690],[1035,686],[965,707]]
  ],[['南驛驛務廣場',540,475,'農地、驛站與商路相連；開場界痕不是永久道路。'],['田間路',990,800,'可以循田埂走訪南部農地。']]);
  terrain('mistbridge','霧橋鎮','c1-103.png',1672,941,[1045,880],[
    [[1050,900],[1015,810],[972,727],[997,655],[1025,607],[963,554],[892,514],[810,471],[738,428],[707,390],[756,360],[826,328],[900,300],[1050,298],[1200,270],[1300,224],[1350,199]],
    [[738,428],[650,484],[590,500],[510,483]],[[707,390],[625,348],[545,350],[460,346],[350,365],[260,390]],
    [[756,360],[700,300],[640,270],[580,225],[535,180],[590,142],[685,116],[680,75]],
    [[997,655],[1115,627],[1225,600],[1390,591],[1510,575]],[[1350,199],[1420,177],[1490,151]]
  ],[['鎮中心',738,428,'丘陵河谷中的居民聚落；北上進入山路。'],['霧橋驛站前',826,328,'南返白鐘的正常步行行程為三日。'],['河畔',1225,600,'河水與陡岸不可直接穿越，請走完整的石橋。']]);
  terrain('echo','山腰驛站／迴音谷','a1-105.png',1536,1024,[1430,930],[
    [[1490,945],[1350,905],[1200,873],[1080,825],[980,789],[850,753],[735,700],[620,638],[510,570],[410,510],[310,467],[230,418],[150,375],[50,330]],
    [[410,510],[490,495],[580,480],[650,480],[740,500],[850,515],[965,537],[1100,554],[1200,589],[1290,624],[1355,658]],
    [[230,418],[380,375],[510,340],[620,300],[700,263],[770,235],[825,238],[940,260],[1000,273]],
    [[770,235],[740,210],[700,180],[780,157],[790,110],[750,65],[780,30]],
    [[1080,825],[1200,790],[1270,740],[1355,658],[1460,690]]
  ],[['山腰驛站廣場',650,480,'沿既有橋面走訪驛站，瀑布與谷底水面不可踏入。'],['迴音谷觀景台',1000,273,'可以在平台查看谷地，離開主線也不會推進任務。']]);
  terrain('relic','霧橋第七遺構','a1-106.png',1536,1024,[210,890],[
    [[210,890],[240,795],[265,725],[360,680],[450,661],[560,675],[675,693],[755,643],[810,620],[870,594]],
    [[870,594],[800,544],[733,490],[690,442],[710,394],[790,340],[870,325],[950,306],[1050,271],[1100,233],[1050,196],[950,190],[870,210],[800,237]],
    [[870,594],[985,540],[1080,512],[1185,485],[1290,477],[1380,490]],
    [[690,442],[580,430],[450,437],[350,450],[260,478],[160,484]],
    [[800,237],[690,220],[610,246],[520,282],[440,316],[390,364]],
    [[1100,233],[1150,170],[1090,110],[1080,45]]
  ],[['遺構外環',870,594,'沿完整階梯與環廊探索，中央能量井與斷崖不可穿越。'],['東側觀測台',1380,490,'在觀測平台查看遺構外側。']]);
  // The two banks remain physically separated by the broken span; each has its own land approach.
  terrain('banksWest','北斷橋・西岸聚落','a1-108-two-banks-concept.png',1536,1024,[210,850],[
    [[210,850],[280,748],[285,667],[242,568],[210,486],[230,421],[300,365],[365,322],[465,283],[590,255],[740,240]],
    [[230,421],[340,452],[420,465],[530,475]],[[365,322],[450,228],[555,240],[590,255]]
  ],[['西岸撤離空地',420,465,'居民與巡林者使用的岸邊空地。'],['斷橋西端',740,240,'橋面中央斷裂；兩岸各有陸路入口，不能踏過斷口。']]);
  terrain('banksEast','北斷橋・東岸工區','a1-108-two-banks-concept.png',1536,1024,[1400,130],[
    [[1400,130],[1350,195],[1330,248],[1240,298],[1165,297],[1090,271],[1000,249],[925,237]]
  ],[['東岸監控空地',1165,297,'工區位在東岸的完整地面。'],['斷橋東端',925,237,'橋面斷口保持碰撞，探索不會把斷橋變成完整道路。']]);
  terrain('bellcourt','彼岸鐘庭・外庭','s1-201-bell-court-concept.png',1672,941,[175,785],[
    [[100,850],[175,785],[280,710],[380,648],[450,575],[475,510],[540,465],[620,430],[700,420],[770,450],[860,455],[950,420],[980,370]],
    [[475,510],[500,418],[555,360],[620,325],[720,317],[750,285]],[[980,370],[1080,415],[1150,470],[1250,535]],
    [[980,370],[950,285],[900,245],[940,202],[990,160]]
  ],[['外庭鐘台前',770,450,'經遺構特殊連結抵達的外庭，不是一般城市道路。'],['鐘庭階梯',990,160,'可以探索已繪製的外庭地面；雲海與無地面處不可行走。']]);
  function connect(a,ax,ay,b,bx,by,label,back) {
    maps[a].exits.push({name:label,x:ax,y:ay,to:b,spawn:[bx,by]});
    maps[b].exits.push({name:back,x:bx,y:by,to:a,spawn:[ax,ay]});
  }
  connect('city',840,80,'mistbridge',1045,880,'北行霧橋鎮・三日陸路','南返白鐘城');
  connect('city',390,700,'south',80,690,'南行南驛山谷','返回白鐘城陸路');
  connect('mistbridge',680,75,'echo',1430,930,'前往山腰驛站／迴音谷','返回霧橋鎮');
  connect('echo',780,30,'relic',210,890,'北行第七遺構・兩日山路','返回迴音谷');
  connect('mistbridge',1490,151,'banksWest',210,850,'前往北斷橋西岸','返回霧橋鎮');
  connect('echo',1460,690,'banksEast',1400,130,'前往北斷橋東岸山路','返回山腰驛站');
  connect('relic',800,237,'bellcourt',175,785,'經遺構窗口前往鐘庭外庭','經窗口返回第七遺構');
  maps.city.sites.push({id:'sea-closed',name:'下游航線未開放',x:260,y:650,text:'洛汀灣、群島與海洋屬後續版本；船隻與海洋航線尚未開放。'});
  // Stable IDs let future regions add anchors without changing travel or save logic.
  var waypoints=Object.keys(maps).map(function(id){var m=maps[id];return {id:id+'-anchor',map:id,name:m.name+'・傳送點',x:m.spawn[0],y:m.spawn[1]};});
  waypoints.push({id:'city-plaza',map:'city',name:'白鐘城・中央廣場',x:800,y:300});
  function waypointById(id){return waypoints.find(function(p){return p.id===id;});}
  function knownWaypoints(ids){return Array.isArray(ids)?Array.from(new Set(ids.filter(function(id){return Boolean(waypointById(id));}))):[];}
  var placements = {
    2:[['village',1390,474],['village',1038,584],['village',1405,479],['village',704,655],['village',330,455],['village',1405,479],['village',648,764],['village',1270,433]],
    3:[['village',326,319],['village',1390,474],['village',124,390],['road',1300,523],['road',940,425],['road',203,258],['city',1140,340],['city',1280,380],['city',290,230],['city',260,650],['city',290,230],['city',1390,430]]
  };
  function splitAct(act) {
    var blocks = source.scenes[act - 1].body.split(/(?=【場景：)/).map(function(s){return s.trim();}).filter(Boolean);
    if (blocks.length !== placements[act].length) throw new Error('World scene count differs from published act '+act);
    return blocks.map(function(body,i){
      var p=placements[act][i], header=(body.match(/^【([^】]+)】/)||[])[1]||'';
      // Keep all published text, including dialogue, in bounded reading cards.
      var lines=[];
      body.split(/\n\s*\n/).filter(Boolean).forEach(function(paragraph){
        var sentences=paragraph.match(/[^。！？]+[。！？]?|[。！？]/g)||[paragraph], buffer='';
        sentences.forEach(function(sentence){if(buffer && buffer.length+sentence.length>160){lines.push(buffer);buffer='';}buffer+=sentence;});
        if(buffer)lines.push(buffer);
      });
      return {id:'act'+act+'-'+i,map:p[0],x:p[1],y:p[2],title:header.split('｜')[0].replace(/^場景：/,''),time:header.split('｜').slice(1).join('｜'),lines:lines};
    });
  }
  var acts={2:splitAct(2),3:splitAct(3)};
  function passable(mapId,x,y) {
    var map=maps[mapId]; if(!map || !Number.isFinite(x)||!Number.isFinite(y)||x<10||y<10||x>map.width-10||y>map.height-10)return false;
    if(mapId==='village')return village.passable(x,y);
    if(mapId==='city'&&Math.hypot(x-837,y-413)<90)return false;
    return map.paths.some(function(path){return path.points.some(function(p,i){if(!i)return false;var a=path.points[i-1],dx=p[0]-a[0],dy=p[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<=path.width;});});
  }
  function initial(act) {act=act===3?3:2;var map=maps[acts[act][0].map];return {version:1,act:act,index:0,map:acts[act][0].map,x:map.spawn[0],y:map.spawn[1],visited:[],waypoints:[]};}
  function normalize(raw) {
    var state=initial(raw&&raw.act), steps=acts[state.act];
    if(raw&&raw.version===1){state.index=Math.max(0,Math.min(steps.length,Math.floor(Number(raw.index)||0)));state.map=canVisit(state,raw.map)?raw.map:'village';
      if(state.map===raw.map && passable(state.map,Number(raw.x),Number(raw.y))){state.x=Number(raw.x);state.y=Number(raw.y);}else {state.x=maps[state.map].spawn[0];state.y=maps[state.map].spawn[1];}
      state.visited=Array.isArray(raw.visited)?raw.visited.filter(function(id){return Object.keys(maps).some(function(k){return maps[k].sites.some(function(s){return k+':'+s.id===id;});});}):[];
      state.waypoints=knownWaypoints(raw.waypoints);
    }return state;
  }
  function goal(state){return acts[state.act][state.index]||null;}
  function fits(map,x,y){return [[-6,-6],[-6,6],[6,-6],[6,6]].every(function(d){return passable(map,x+d[0],y+d[1]);});}
  function clearSegment(map,ax,ay,bx,by){var count=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/2));for(var i=1;i<=count;i++)if(!fits(map,ax+(bx-ax)*i/count,ay+(by-ay)*i/count))return false;return true;}
  function move(state,dx,dy){var next=normalize(state),steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/2));for(var i=0;i<steps;i++){var x=next.x+dx/steps,y=next.y+dy/steps;if(fits(next.map,x,y)){next.x=x;next.y=y;}else{if(fits(next.map,x,next.y))next.x=x;if(fits(next.map,next.x,y))next.y=y;}}return next;}
  function canVisit(state,map){return Object.prototype.hasOwnProperty.call(maps,map);}
  function nearWaypoint(state){return waypoints.filter(function(p){return p.map===state.map&&Math.hypot(state.x-p.x,state.y-p.y)<56;}).sort(function(a,b){return Math.hypot(state.x-a.x,state.y-a.y)-Math.hypot(state.x-b.x,state.y-b.y);})[0]||null;}
  function activateWaypoint(state,id){var next=normalize(state),p=waypointById(id);if(!p||p.map!==next.map||Math.hypot(next.x-p.x,next.y-p.y)>=56||next.waypoints.includes(id))return {state:next,changed:false};next.waypoints.push(id);return {state:next,changed:true};}
  function teleport(state,id){var next=normalize(state),p=waypointById(id);if(!p||!canVisit(next,p.map)||!next.waypoints.includes(id)||!fits(p.map,p.x,p.y))return {state:next,changed:false};next.map=p.map;next.x=p.x;next.y=p.y;return {state:next,changed:true};}
  function nearby(state) {
    var target=goal(state);if(target&&target.map===state.map&&Math.hypot(state.x-target.x,state.y-target.y)<55)return {kind:'story',value:target};
    var actors=presentation.npcs(state.map).filter(function(n){return Math.hypot(state.x-n.x,state.y-n.y)<62;});if(actors.length)return {kind:'npc',value:actors.sort(function(a,b){return Math.hypot(state.x-a.x,state.y-a.y)-Math.hypot(state.x-b.x,state.y-b.y);})[0]};
    var candidates=maps[state.map].exits.map(function(x){return {kind:'exit',value:x};}).concat(maps[state.map].sites.map(function(x){return {kind:'site',value:x};}));
    return candidates.filter(function(x){return Math.hypot(state.x-x.value.x,state.y-x.value.y)<48;}).sort(function(a,b){return Math.hypot(state.x-a.value.x,state.y-a.value.y)-Math.hypot(state.x-b.value.x,state.y-b.value.y);})[0]||null;
  }
  function transition(state,exit){var next=normalize(state);if(!maps[state.map].exits.includes(exit)||Math.hypot(state.x-exit.x,state.y-exit.y)>=48||!canVisit(state,exit.to))return {state:next,changed:false};next.map=exit.to;next.x=exit.spawn[0];next.y=exit.spawn[1];return {state:next,changed:true};}
  function route(state,target) {
    if(!target||!passable(state.map,target.x,target.y))return [];
    var size=16,map=maps[state.map],columns=Math.ceil(map.width/size),key=function(x,y){return y*columns+x;},start=key(Math.floor(state.x/size),Math.floor(state.y/size)),end=key(Math.floor(target.x/size),Math.floor(target.y/size));
    var queue=[start],prev=new Map([[start,-1]]);
    for(var head=0;head<queue.length&&!prev.has(end);head++){var at=queue[head],x=at%columns,y=Math.floor(at/columns);[[1,0],[0,1],[-1,0],[0,-1]].forEach(function(d){var nx=x+d[0],ny=y+d[1],n=key(nx,ny);if(nx>=0&&ny>=0&&nx<columns&&ny<Math.ceil(map.height/size)&&!prev.has(n)&&clearSegment(state.map,(x+.5)*size,(y+.5)*size,(nx+.5)*size,(ny+.5)*size)){prev.set(n,at);queue.push(n);}});}
    if(!prev.has(end))return [];var out=[];for(var n=end;n!==-1;n=prev.get(n))out.push({x:(n%columns+.5)*size,y:(Math.floor(n/columns)+.5)*size});return out.reverse();
  }
  function planWalk(state,x,y){
    if(!Number.isFinite(x)||!Number.isFinite(y)||!fits(state.map,x,y))return [];
    var path=route(state,{x:x,y:y});if(!path.length||!clearSegment(state.map,state.x,state.y,path[0].x,path[0].y))return [];
    var last=path[path.length-1];if(!clearSegment(state.map,last.x,last.y,x,y))return [];path.push({x:x,y:y});return path;
  }
  function navigationTarget(state,destination){
    var target=destination&&maps[destination]?{map:destination,x:maps[destination].spawn[0],y:maps[destination].spawn[1]}:goal(state);
    if(!target)return null;if(target.map===state.map)return target;
    var queue=[{map:state.map,first:null}],seen=new Set([state.map]);
    for(var i=0;i<queue.length;i++){var item=queue[i],exits=maps[item.map].exits;
      for(var j=0;j<exits.length;j++){var exit=exits[j];if(!canVisit(state,exit.to)||seen.has(exit.to))continue;var first=item.first||exit;if(exit.to===target.map)return first;seen.add(exit.to);queue.push({map:exit.to,first:first});}
    }return null;
  }
  function create(options) {
    var canvas=options.canvas,ctx=canvas.getContext('2d'),state=normalize(options.load()),images={},requested={},held=new Set(),active=false,frame=0,previous=0,lastSave=0,lines=null,lineIndex=0,pending=false,epoch=0,routeKey='',currentRoute=[],destination='',waypointKey='',dialogKind='story',talking=null,camera={map:'',x:state.x,y:state.y},bannerUntil=0,lastMini=0,sprintMode=false,autoPath=[],autoIntent=null,autoTarget=null,lastView=null,heading='down',stride=0,walkingNow=false,useHeroAtlas=!options.playerId||options.playerId==='hero'||options.playerId==='celesia';
    var motion=typeof window.matchMedia==='function'?window.matchMedia('(prefers-reduced-motion: reduce)'):null;
    function reduced(){return Boolean(motion&&motion.matches);}
    function stopWalking(){autoPath=[];autoIntent=null;autoTarget=null;walkingNow=false;}
    function save(){options.save(normalize(state));if(options.saveWaypoints)options.saveWaypoints(state.waypoints.slice());}
    function loadImage(key,src){requested[key]=true;var img=new Image();img.onload=function(){images[key]=img;draw();};img.onerror=function(){requested[key]='failed';if(maps[key]){options.status.textContent='地圖素材載入失敗，請重新開啟探索。';if(options.loading)options.loading.hidden=true;}};img.src=src;}
    var characterArt=globalThis.StarshipExplorationCharacters,characterData=options.characterData||globalThis.StarshipGachaData||{},playerLoad;
    function setPlayer(id){if(!characterArt||!characterArt.resolve(id,characterData))return false;useHeroAtlas=id==='hero'||id==='celesia';if(useHeroAtlas&&!requested.heroWalk)loadImage('heroWalk','./assets/exploration/hero-walk-atlas-v1.png');if(playerLoad)playerLoad.cancel();delete images.hero;playerLoad=characterArt.load(id,characterData,function(img){if(img)images.hero=img;draw();});return true;}
    if(options.destination){options.destination.innerHTML='<option value="">追蹤目前劇情</option>'+Object.keys(maps).map(function(id){return '<option value="'+id+'">'+maps[id].name+'</option>';}).join('');options.destination.addEventListener('change',function(){destination=options.destination.value;routeKey='';draw();});}
    loadImage(state.map,maps[state.map].image);if(useHeroAtlas)loadImage('heroWalk','./assets/exploration/hero-walk-atlas-v1.png');if(!setPlayer(options.playerId||'hero'))loadImage('hero',village.spriteSources.hero);
    function updateTravel(){
      var busy=Boolean(lines)||pending,near=nearWaypoint(state);
      if(options.activate){options.activate.hidden=!near;options.activate.disabled=busy||Boolean(near&&state.waypoints.includes(near.id));options.activate.textContent=near&&state.waypoints.includes(near.id)?'此傳送點已啟用':'啟用附近傳送點';}
      if(options.travelList){var signature=state.waypoints.slice().sort().join('|');if(signature!==waypointKey||!options.travelList.innerHTML){var selected=options.travelList.value;options.travelList.innerHTML='<option value="">選擇已啟用的傳送點</option>'+waypoints.map(function(p){var unlocked=state.waypoints.includes(p.id);return '<option value="'+p.id+'"'+(unlocked?'':' disabled')+'>'+p.name+(unlocked?'':'（未啟用）')+'</option>';}).join('');options.travelList.value=state.waypoints.includes(selected)?selected:'';waypointKey=signature;}
        options.travelList.disabled=busy||!state.waypoints.length;}
      if(options.travel)options.travel.disabled=busy||!options.travelList||!state.waypoints.includes(options.travelList.value);
      if(options.travelHint)options.travelHint.textContent=state.waypoints.length?'已啟用 '+state.waypoints.length+' / '+waypoints.length+' 處・可隨時免費傳送；劇情對話結束後可使用。':'首次靠近菱形傳送點並啟用，即可快速返回。';
    }
    if(options.activate)options.activate.addEventListener('click',function(){if(!active||lines||pending)return;var near=nearWaypoint(state);if(!near)return;var result=activateWaypoint(state,near.id);if(result.changed){state=result.state;save();options.status.textContent='已啟用 '+near.name+'，可從傳送列表快速返回。';draw();}});
    if(options.travelList)options.travelList.addEventListener('change',function(){held.clear();updateTravel();});
    if(options.travel)options.travel.addEventListener('click',function(){if(!active||lines||pending)return;var result=teleport(state,options.travelList.value);if(!result.changed)return;held.clear();stopWalking();state=result.state;routeKey='';if(options.tools){options.tools.hidden=true;if(options.toolsToggle)options.toolsToggle.setAttribute('aria-expanded','false');}save();options.status.textContent='已傳送至 '+maps[state.map].name+'。';draw();canvas.focus({preventScroll:true});});
    function showLine(){options.dialogTitle.textContent=dialogKind==='npc'?talking.name:'旁白';options.dialogText.textContent=lines[lineIndex];if(options.dialogLocation)options.dialogLocation.textContent=dialogKind==='npc'?talking.role:goal(state).title;if(options.dialogCount)options.dialogCount.textContent=(lineIndex+1)+' / '+lines.length;if(options.portrait){options.portrait.src='./assets/exploration/'+(dialogKind==='npc'?talking.id:'hero')+'-chibi-v1.png';options.portrait.alt=dialogKind==='npc'?talking.name:'瑟蕾雅';}options.dialogNext.textContent=lineIndex+1<lines.length?'繼續 →':'結束對話';options.dialog.hidden=false;options.dialogNext.focus({preventScroll:true});}
    if(options.toolsToggle)options.toolsToggle.addEventListener('click',function(){if(lines||pending)return;held.clear();stopWalking();options.tools.hidden=!options.tools.hidden;options.toolsToggle.setAttribute('aria-expanded',String(!options.tools.hidden));});
    if(options.fullscreen)options.fullscreen.addEventListener('click',function(){held.clear();var action=document.fullscreenElement?document.exitFullscreen():options.panel.requestFullscreen?options.panel.requestFullscreen():Promise.reject(new Error('unsupported'));Promise.resolve(action).catch(function(){options.status.textContent='此瀏覽器未支援全螢幕，仍可直接在目前畫面探索。';});});
    if(options.fullscreen)document.addEventListener('fullscreenchange',function(){options.fullscreen.textContent=document.fullscreenElement?'離開全螢幕':'全螢幕';});
    if(options.sprint)options.sprint.addEventListener('click',function(){sprintMode=!sprintMode;options.sprint.setAttribute('aria-pressed',String(sprintMode));options.sprint.textContent=sprintMode?'慢行':'跑步';});

    function syncComplete(){if(pending)return;var syncAct=state.act,stamp=epoch;pending=true;options.status.textContent='正在保存第'+syncAct+'幕主線進度…';Promise.resolve().then(function(){if(stamp!==epoch)return;return options.onComplete(syncAct);}).then(function(){if(stamp!==epoch)return;pending=false;options.status.textContent='第'+syncAct+'幕完成，主線進度已保存。';draw();}).catch(function(error){if(stamp!==epoch)return;pending=false;options.status.textContent='主線進度尚未保存：'+error.message+'。可按「保存本幕進度」重試。';draw();});}
    function nextLine(){if(!lines||pending)return;if(++lineIndex<lines.length){showLine();return;}if(dialogKind==='npc'){lines=null;talking=null;options.dialog.hidden=true;draw();canvas.focus({preventScroll:true});return;}state.index++;lines=null;options.dialog.hidden=true;save();routeKey='';if(!goal(state))syncComplete();draw();canvas.focus({preventScroll:true});}
    function draw(){
      var now=performance.now(),actors=presentation.npcs(state.map),changed=camera.map!==state.map;
      if(changed){camera={map:state.map,x:state.x,y:state.y};bannerUntil=now+3200;lastMini=0;if(options.scene){options.scene.classList.remove('world-arrival');void options.scene.offsetWidth;options.scene.classList.add('world-arrival');}}
      if(!requested[state.map])loadImage(state.map,maps[state.map].image);
      actors.forEach(function(n){if(!requested['npc-'+n.id])loadImage('npc-'+n.id,'./assets/exploration/'+n.id+'-chibi-v1.png');});
      camera.x+=(state.x-camera.x)*(reduced()?1:.14);camera.y+=(state.y-camera.y)*(reduced()?1:.14);
      var map=maps[state.map],view=renderer.begin(canvas,ctx,map.width,map.height,camera.x,camera.y);lastView=view;ctx.fillStyle='#234c40';ctx.fillRect(view.x,view.y,view.width,view.height);if(images[state.map])ctx.drawImage(images[state.map],0,0,map.width,map.height);
      if(options.regionTag)options.regionTag.textContent=state.map==='bellcourt'?'遺構特殊連結・鐘庭外庭':'南部內陸生活圈';if(options.compass)options.compass.textContent=state.map==='bellcourt'?'局部':'N ↑';if(options.loading)options.loading.hidden=Boolean(images[state.map])||requested[state.map]==='failed';
      if(options.banner){options.banner.hidden=Boolean(lines)||now>bannerUntil;options.banner.textContent=map.name;}
      var target=navigationTarget(state,destination),key=state.map+':'+Math.floor(state.x/16)+':'+Math.floor(state.y/16)+':'+state.index+':'+destination;if(key!==routeKey){currentRoute=route(state,target);routeKey=key;}
      var visibleRoute=autoPath.length?autoPath:currentRoute;
      if(visibleRoute.length){ctx.beginPath();ctx.moveTo(state.x,state.y);visibleRoute.forEach(function(p){ctx.lineTo(p.x,p.y);});ctx.strokeStyle='rgba(29,57,43,.65)';ctx.lineWidth=5;ctx.stroke();ctx.strokeStyle='#f6df9b';ctx.lineWidth=2.5;ctx.setLineDash([3,11]);ctx.lineDashOffset=reduced()?0:-now/80;ctx.stroke();ctx.setLineDash([]);ctx.lineDashOffset=0;}
      waypoints.filter(function(p){return p.map===state.map;}).forEach(function(p){var unlocked=state.waypoints.includes(p.id);ctx.beginPath();ctx.ellipse(p.x,p.y+4,20,9,0,0,Math.PI*2);ctx.strokeStyle=unlocked?'#8cf4e7':'#e8d9a9';ctx.lineWidth=3;ctx.stroke();ctx.beginPath();ctx.moveTo(p.x,p.y-42);ctx.lineTo(p.x+10,p.y-27);ctx.lineTo(p.x,p.y-12);ctx.lineTo(p.x-10,p.y-27);ctx.closePath();ctx.fillStyle=unlocked?'#8cf4e7':'#b4aa89';ctx.fill();if(Math.hypot(state.x-p.x,state.y-p.y)<150&&Math.hypot(state.x-p.x,state.y-p.y)>55){ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#122f28';ctx.strokeText(unlocked?'傳送點・已啟用':'傳送點・未啟用',p.x,p.y-118);ctx.fillStyle='#f2ecd3';ctx.fillText(unlocked?'傳送點・已啟用':'傳送點・未啟用',p.x,p.y-118);}});
      map.sites.concat(map.exits).forEach(function(s){if(Math.hypot(state.x-s.x,state.y-s.y)>330)return;ctx.save();ctx.translate(s.x,s.y);ctx.strokeStyle='#e9d89c';ctx.lineWidth=2;if(map.exits.includes(s)){ctx.beginPath();ctx.moveTo(-5,-7);ctx.lineTo(4,0);ctx.lineTo(-5,7);ctx.stroke();}else{ctx.rotate(Math.PI/4);ctx.strokeRect(-3,-3,6,6);}ctx.restore();});if(target){ctx.beginPath();ctx.arc(target.x,target.y,18,0,Math.PI*2);ctx.strokeStyle='#ffe4a0';ctx.lineWidth=3;ctx.stroke();}
      var walking=walkingNow;
      if(autoTarget){ctx.save();ctx.strokeStyle='#ffedb0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(autoTarget.x,autoTarget.y,12,6,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
      var drawn=actors.map(function(n){var p=presentation.position(n,now,reduced(),function(x,y){return fits(state.map,x,y);});return {x:p.x,y:p.y,actor:n};});drawn.push({x:state.x,y:state.y,hero:true});
      drawn.sort(function(a,b){return a.y-b.y;}).forEach(function(p){ctx.fillStyle='rgba(12,30,28,.3)';ctx.beginPath();ctx.ellipse(p.x,p.y+5,p.hero?17:15,6,0,0,Math.PI*2);ctx.fill();if(!(p.hero&&useHeroAtlas&&heroMotion.draw(ctx,images.heroWalk,p.x,p.y,104,heading,stride,walking,reduced())))renderer.sprite(ctx,p.hero?images.hero:images['npc-'+p.actor.id],p.x,p.y,p.hero?104:96,p.hero?heading==='left':false,reduced()?0:p.hero&&walking?Math.sin(now/95)*2:Math.sin(now/700+(p.hero?0:p.x))*.8);if(!p.hero){presentation.label(ctx,p.actor.name,p.x,p.y-112);if(Math.hypot(state.x-p.x,state.y-p.y)<115)presentation.label(ctx,'···',p.x,p.y-133,'#b9f0da');}});
      if(state.map==='village')presentation.fire(ctx,832,395,now,reduced());presentation.environment(ctx,map,view,now,reduced());
      // Pins use names and distinct silhouettes instead of anonymous dots.
      var named=map.exits.concat(map.sites);named.forEach(function(p){if(Math.hypot(state.x-p.x,state.y-p.y)<125&&Math.hypot(state.x-p.x,state.y-p.y)>55)presentation.label(ctx,p.name,p.x,p.y+25,'#e4f0d8');});
      if(options.minimap&&(now-lastMini>120||!lastMini)){presentation.minimap(options.minimap,images[state.map],map,state,visibleRoute,actors,view);lastMini=now;}
      if(options.dialog.hidden===false&&options.tools){options.tools.hidden=true;if(options.toolsToggle)options.toolsToggle.setAttribute('aria-expanded','false');}
      renderer.end(ctx);
      var g=goal(state),near=nearby(state);options.zone.textContent=map.name;options.objective.textContent=g?g.title:'本幕完成，可自由探索第一大版本全區';options.distance.textContent=autoPath.length?'前往點選位置 · 約 '+Math.max(1,Math.round(autoPath.length*16/24))+' 步':target?((destination?'前往 '+maps[destination].name:target.map?'沿路線前往劇情地點':target.name)+' · 約 '+Math.max(1,Math.round(currentRoute.length*16/24))+' 步'):'可自由探索，啟用沿途傳送點';options.position.textContent='第'+state.act+'幕 · '+Math.min(state.index+1,acts[state.act].length)+' / '+acts[state.act].length+' 段';options.interact.hidden=Boolean(lines)||!near;options.interact.textContent=near?(near.kind==='story'?'開始此段劇情 E':near.kind==='exit'?near.value.name+' E':near.kind==='npc'?'與'+near.value.name+'交談 E':'調查 '+near.value.name+' E'):'靠近目標互動';options.sync.hidden=Boolean(g);options.sync.disabled=pending;options.next.hidden=Boolean(g)||state.act===3;options.next.disabled=!options.canStart(3);if(options.stop)options.stop.hidden=!autoPath.length;updateTravel();
    }
    function interact(){if(lines||pending)return;stopWalking();var found=nearby(state);if(!found)return;if(found.kind==='npc'){dialogKind='npc';talking=found.value;lines=[found.value.line];lineIndex=0;held.clear();showLine();draw();return;}if(found.kind==='story'){dialogKind='story';lines=found.value.lines;lineIndex=0;held.clear();showLine();draw();return;}if(found.kind==='exit'){var result=transition(state,found.value);if(result.changed){state=result.state;save();routeKey='';options.status.textContent=maps[state.map].name; }else options.status.textContent='請靠近此區域的實際出口，再嘗試通行。';}else {var id=state.map+':'+found.value.id;if(!state.visited.includes(id))state.visited.push(id);save();options.status.textContent=found.value.name+'｜'+found.value.text;}draw();}
    function tick(now){
      if(!active)return;var dt=Math.min((now-(previous||now))/1000,.05);previous=now;
      var dx=Number(held.has('right'))-Number(held.has('left')),dy=Number(held.has('down'))-Number(held.has('up')),beforeX=state.x,beforeY=state.y;
      if(!lines&&!pending&&(!options.tools||options.tools.hidden)){
        if(dx||dy){stopWalking();var norm=Math.hypot(dx,dy),speed=sprintMode||held.has('sprint')?285:185;state=move(state,dx/norm*dt*speed,dy/norm*dt*speed);}
        else if(autoPath.length){while(autoPath.length&&Math.hypot(autoPath[0].x-state.x,autoPath[0].y-state.y)<2)autoPath.shift();
          if(autoPath.length){var point=autoPath[0],distance=Math.hypot(point.x-state.x,point.y-state.y),step=Math.min(distance,dt*(sprintMode?285:185));state=move(state,(point.x-state.x)/distance*step,(point.y-state.y)/distance*step);if(step>0&&Math.hypot(state.x-beforeX,state.y-beforeY)<.05){stopWalking();options.status.textContent='路線受到阻擋，請重新選擇道路上的位置。';}}
          if(!autoPath.length&&autoTarget){var intent=autoIntent;stopWalking();options.status.textContent='已抵達點選位置。';if(intent&&intent.map===state.map){var found=nearby(state);if(found&&(found.kind==='story'||found.kind==='npc'&&found.value.id===intent.id))interact();}}
        }
      }
      var moved=Math.hypot(state.x-beforeX,state.y-beforeY);walkingNow=moved>.05;if(walkingNow){heading=heroMotion.heading(state.x-beforeX,state.y-beforeY,heading);stride+=moved;if(now-lastSave>800){save();lastSave=now;}}
      draw();frame=requestAnimationFrame(tick);
    }
    if(options.stop)options.stop.addEventListener('click',function(){stopWalking();options.status.textContent='已停止行走。';draw();});
    canvas.addEventListener('pointerdown',function(e){
      if(!active||lines||pending||options.tools&&!options.tools.hidden||!lastView||e.button>0)return;
      var rect=canvas.getBoundingClientRect(),x=lastView.x+(e.clientX-rect.left)/rect.width*lastView.width,y=lastView.y+(e.clientY-rect.top)/rect.height*lastView.height;
      var npc=presentation.npcs(state.map).map(function(n){var pos=presentation.position(n,performance.now(),reduced(),function(px,py){return fits(state.map,px,py);});return {npc:n,x:pos.x,y:pos.y};}).filter(function(p){return Math.abs(x-p.x)<43&&y>p.y-100&&y<p.y+12;}).sort(function(a,b){return Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y);})[0];
      var target=npc?{x:npc.x,y:npc.y}:{x:x,y:y},path=planWalk(state,target.x,target.y);stopWalking();held.clear();if(!path.length){options.status.textContent='這裡無法通行，請點選道路或空地。';draw();return;}
      autoPath=path;autoTarget=target;autoIntent=npc?{id:npc.npc.id,map:state.map}:null;options.status.textContent=npc?'正在走近 '+npc.npc.name+'…':'沿道路前往點選位置。';canvas.focus({preventScroll:true});draw();
    });
    function key(e,down){if(!active||options.panel.hidden||e.target.closest&&e.target.closest('input,textarea,select'))return;if(lines){if(down&&!e.repeat&&e.target!==options.dialogNext&&['KeyE','Enter','Space'].includes(e.code)){e.preventDefault();nextLine();}return;}if(options.tools&&!options.tools.hidden){if(down&&e.code==='Escape'){options.tools.hidden=true;options.toolsToggle.setAttribute('aria-expanded','false');}return;}if(e.code==='ShiftLeft'||e.code==='ShiftRight'){if(down)held.add('sprint');else held.delete('sprint');return;}if(down&&e.code==='Escape'){stopWalking();draw();return;}var keys={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};if(keys[e.code]){e.preventDefault();if(down){stopWalking();held.add(keys[e.code]);}else held.delete(keys[e.code]);}if(down&&e.code==='KeyE'&&!e.repeat){e.preventDefault();interact();}}
    window.addEventListener('keydown',function(e){key(e,true);});window.addEventListener('keyup',function(e){key(e,false);});window.addEventListener('blur',function(){held.clear();stopWalking();});
    options.pad.querySelectorAll('[data-world-move]').forEach(function(button){button.addEventListener('pointerdown',function(e){e.preventDefault();stopWalking();held.add(button.dataset.worldMove);button.setPointerCapture(e.pointerId);});['pointerup','pointercancel','lostpointercapture'].forEach(function(event){button.addEventListener(event,function(){held.delete(button.dataset.worldMove);});});});
    options.interact.addEventListener('click',interact);options.dialogNext.addEventListener('click',nextLine);options.sync.addEventListener('click',syncComplete);options.next.addEventListener('click',function(){start(3);});options.reset.addEventListener('click',function(){stopWalking();state.x=maps[state.map].spawn[0];state.y=maps[state.map].spawn[1];save();routeKey='';draw();});
    function start(act){if(!options.canStart(act)){options.status.textContent='先完成第'+(act-1)+'幕主線，才能開始第'+act+'幕探索。';return false;}epoch++;pending=false;held.clear();stopWalking();var saved=options.load(act);state=normalize(saved&&saved.act===act?saved:initial(act));if(options.loadWaypoints)state.waypoints=knownWaypoints(state.waypoints.concat(knownWaypoints(options.loadWaypoints())));waypointKey='';lines=null;talking=null;dialogKind='story';camera.map='';if(options.tools){options.tools.hidden=true;if(options.toolsToggle)options.toolsToggle.setAttribute('aria-expanded','false');}options.dialog.hidden=true;routeKey='';save();draw();return true;}
    return {open:function(act){if(!start(act))return false;active=true;previous=0;cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);canvas.focus({preventScroll:true});return true;},close:function(){if(active)save();if(options.fullscreen&&document.fullscreenElement===options.panel)Promise.resolve(document.exitFullscreen()).catch(function(){});epoch++;pending=false;active=false;held.clear();stopWalking();lines=null;options.dialog.hidden=true;cancelAnimationFrame(frame);},setPlayer:setPlayer,state:function(){return normalize(state);}};
  }
  return {maps:maps,waypoints:waypoints,activateWaypoint:activateWaypoint,teleport:teleport,nearWaypoint:nearWaypoint,knownWaypoints:knownWaypoints,acts:acts,initial:initial,normalize:normalize,passable:passable,move:move,route:route,planWalk:planWalk,goal:goal,canVisit:canVisit,nearby:nearby,transition:transition,navigationTarget:navigationTarget,create:create};
}));
