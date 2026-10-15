(function(root,factory){
  var api=factory(typeof module==='object'&&module.exports?require('./story-1-0-current.js'):root.StarshipStory10Current,
    typeof module==='object'&&module.exports?require('./story-1-1-current.js'):root.StarshipStory11Current);
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.StarshipWorldStoryCampaign=api;
}(typeof globalThis!=='undefined'?globalThis:this,function(story10,story11){
  'use strict';
  var dialogue=typeof module==='object'&&module.exports?require('./world-story-dialogue'):globalThis.StarshipWorldStoryDialogue;
  var order=[2,3,4,5,11,12,13,14,15];
  function meta(act){
    if(!order.includes(act))return null;
    var is11=act>=11,index=is11?act-11:act-1,source=is11?story11:story10;
    return {act:act,version:is11?'1.1':'1.0',index:index,chapterId:is11?'main-1-1':'main-1-0',sceneId:source.scenes[index].id,
      title:source.scenes[index].title,label:(is11?'1.1':'1.0')+'・第'+(index+1)+'幕',next:order[order.indexOf(act)+1]||null,missions:is11,last:index===4};
  }
  var positions={
    4:[['city',140,580],['factoryNear',640,330],['factoryNear',440,300],['factoryFar',1200,410],['city',260,650]],
    5:[['city',260,650],['recovery',700,400],['city',290,230],['cityInn',360,240],['cityInn',670,550],['cityInn',1300,650],['city',1390,430],['city',1280,380],['city',1140,340],['northRoad',850,850]],
    11:[['northRoad',850,760],['northRoad',410,480],['northRoad',1050,245],['mistbridge',826,328],['echo',1200,873],['echo',650,480]],
    12:[['echo',650,480],['rescue',550,530],['rescue',850,520]],
    13:[['rescue',850,520],['rescue',500,125]],
    14:[['rescue',500,125],['rescue',850,520]],
    15:[['echo',650,480],['mistbridge',826,328],['mistInn',1240,320],['mistbridge',738,428],['mistbridge',1045,880]]
  };
  var anchors={
    11:['【白鐘城北方商路','第一晚下小雨。','離開白鐘後第二天，','離開白鐘後第三日下午，','【霧橋鎮至山腰驛站','驛站的屋簷下排著'],
    12:['【山腰驛站至迴音谷口','谷口的石牌有半截','【迴音谷舊渡台'],
    15:['【迴音谷至霧橋鎮','鎮上已替救回的人','【霧橋鎮旅店後廳','【霧橋鎮小廣場','【霧橋鎮｜演出翌日上午']
  };
  var labels={11:['白鐘北方商路・第一日','商路棚屋・第一晚','北行商路・第二日','霧橋鎮・第三日傍晚','霧橋至山腰・翌日','山腰驛站・與 Hina 會合'],
    12:['山腰驛站・出發','迴音谷口・與 Siyeon 會合','迴音谷舊渡台・兩岸清點'],
    15:['救援後・經驛站返鎮','霧橋鎮・安置與還繩','旅店後廳・排練','霧橋小廣場・短演','霧橋鎮・修繕與交班']};
  function cards(body){
    var out=[];body.split(/\n\s*\n/).filter(Boolean).forEach(function(paragraph){var buffer='';(paragraph.match(/[^。！？]+[。！？]?|[。！？]/g)||[paragraph]).forEach(function(sentence){if(buffer&&buffer.length+sentence.length>160){out.push(buffer);buffer='';}buffer+=sentence;});if(buffer)out.push(buffer);});return out;
  }
  function build(act){
    var m=meta(act),body=(m.missions?story11:story10).scenes[m.index].body,blocks;
    if(anchors[act]){var paragraphs=body.split(/\n\s*\n/).map(function(p){return p.trim();}).filter(Boolean),starts=anchors[act].map(function(a){var i=paragraphs.findIndex(function(p){return p.startsWith(a);});if(i<0)throw new Error('Missing exploration anchor: '+a);return i;});
      if(starts[0]!==0||starts.some(function(n,i){return i&&n<=starts[i-1];}))throw new Error('Invalid exploration sequence '+act);
      blocks=starts.map(function(start,i){return paragraphs.slice(start,starts[i+1]===undefined?paragraphs.length:starts[i+1]).join('\n\n');});
    }else blocks=body.split(/(?=【)/).map(function(b){return b.trim();}).filter(Boolean);
    if(blocks.length!==positions[act].length)throw new Error('Campaign scene/position mismatch '+act);
    return blocks.map(function(b,i){var p=positions[act][i],header=(b.match(/^【([^】]+)】/)||[])[1]||'';return {id:'act'+act+'-'+i,map:p[0],x:p[1],y:p[2],title:labels[act]?labels[act][i]:header.split('｜')[0].replace(/^場景：/,''),time:header.split('｜').slice(1).join('｜'),lines:dialogue.cards(act,b).map(function(l){return l.text;}),speakers:dialogue.cards(act,b).map(function(l){return l.speaker;})};});
  }
  var acts={};Object.keys(positions).forEach(function(a){acts[a]=build(Number(a));});
  function install(maps,connect){
    function map(id,name,image,spawn,paths,sites){maps[id]={name:name,image:image.startsWith('./')?image:'./assets/exploration/'+image,width:1672,height:939,spawn:spawn,paths:paths.map(function(points){return {width:26,points:points};}),sites:sites||[],exits:[]};}
    map('northRoad','北行商路・白鐘至霧橋','north-trade-road-v1.png',[850,850],[
      [[850,900],[850,850],[850,760],[820,660],[780,610],[690,575],[600,548],[540,530],[505,500],[520,445],[590,403],[675,370],[750,345],[850,320],[950,285],[1050,245],[1100,220],[1200,203],[1350,176],[1460,120]],
      [[505,500],[450,490],[410,480]]
    ],[{id:'shelter',name:'第一晚商路棚屋',x:410,y:480,text:'三日北行路上的宿營點；各日行程依主線分段呈現。'}]);
    map('factoryNear','城西工坊・近端','white-bell-workshop-rescue-v1.png',[300,760],[
      [[300,760],[300,660],[300,590],[260,540],[220,480],[200,420],[200,300],[270,240],[360,260],[440,300],[540,330],[640,330],[700,280],[750,240],[780,220]]
    ],[{id:'gap',name:'卸貨廊斷口',x:640,y:330,text:'先在完整地面複核；木板與接應繩核准後才跨越。'}]);
    map('factoryFar','城西工坊・對岸','white-bell-workshop-rescue-v1.png',[1070,250],[
      [[1070,250],[1140,270],[1180,330],[1200,410],[1300,450],[1360,380],[1440,320]]
    ],[{id:'vark',name:'老瓦克接應處',x:1200,y:410,text:'保留完整柱後的安置地與木板回程線。'}]);
    map('rescue','迴音谷・舊渡台','echo-rescue-landing-v1.png',[140,800],[
      [[50,890],[140,800],[200,700],[300,600],[400,520],[550,530],[700,550],[850,520]],
      [[400,520],[250,460],[180,370],[210,280],[300,200],[390,130],[500,125]]
    ],[{id:'landing',name:'近岸舊渡台',x:850,y:520,text:'對岸的藥車與居民隔著錯位石階；先查明源頭，不讓傷者試路。'},
      {id:'slope',name:'上游石坡',x:500,y:125,text:'折影獸的凹地與居民安置處分開；撤離依主線確認。'}]);
    var innPaths=[[[850,870],[850,750],[850,650],[850,540],[770,470],[670,440],[560,400],[520,340],[480,300],[400,260],[360,240]],
      [[850,650],[980,650],[1010,600],[1080,580],[1140,580],[1180,620],[1240,650],[1300,650]],
      [[850,540],[1030,440],[1040,320],[1080,270],[1180,280],[1240,320]],[[770,470],[700,520],[670,550]]];
    map('cityInn','白鐘城・東門旅店','journey-inn-interior-v1.png',[850,870],innPaths);
    map('mistInn','霧橋鎮・旅店後廳','journey-inn-interior-v1.png',[850,870],innPaths);
    map('recovery','白鐘城・老瓦克休養處','vark-recovery-room-v1.png',[850,850],[
      [[850,850],[850,700],[850,600],[800,500],[700,400]]
    ]);
    function room(id,name,furniture,sites){
      map(id,name,'journey-inn-interior-v1.png',[480,630],[[[480,630],[480,360],[240,360],[720,360]]],sites);
      maps[id].width=960;maps[id].height=720;maps[id].floor=[64,64,896,656];maps[id].furniture=furniture;
    }
    room('clinic','獸靈之村・醫療屋與廚房',[
      {sprite:0,x:635,y:105,w:145,h:160},{sprite:1,x:175,y:105,w:160,h:125},
      {sprite:2,x:110,y:470,w:155,h:130},{sprite:3,x:635,y:450,w:160,h:150}
    ],[{id:'care',name:'療養與換藥',x:560,y:260,text:'清水、布帶與藥草分開放置，傷者休養區靠窗。'},
      {id:'kitchen',name:'共用廚房',x:340,y:490,text:'火爐、用水與飯桌分開，為村內留宿和日常照護準備熱食。'}]);
    room('observatory','白鐘城・城西觀測分會',[
      {sprite:4,x:330,y:115,w:190,h:145},{sprite:5,x:670,y:125,w:135,h:150},
      {sprite:6,x:100,y:100,w:145,h:190},{sprite:6,x:100,y:430,w:145,h:170}
    ],[{id:'records',name:'路況與量測記錄',x:460,y:330,text:'原始量測、現地記憶與待複核事項分開保管；未確認的線不能直接當作通路。'},
      {id:'charts',name:'分會圖庫',x:310,y:480,text:'沿既有正文查閱商路與異常記錄，沒有因此新增可直接穿行的界痕。'}]);
    room('station','山腰驛站・內部與補給間',[
      {sprite:7,x:320,y:110,w:200,h:150},{sprite:0,x:650,y:110,w:145,h:160},
      {sprite:6,x:100,y:100,w:145,h:185},{sprite:3,x:640,y:445,w:160,h:155}
    ],[{id:'supplies',name:'繩索與急用物資',x:470,y:335,text:'山路出發前複核繩索、藥品與回程記號，不把未抵達的驛報當作已送達。'},
      {id:'rest',name:'避風休整處',x:560,y:510,text:'休息與換藥後再上路；當晚不能憑遠處燈火冒險趕路。'}]);
    map('riverRoad','南行驛路・下游商路','north-trade-road-v1.png',[240,100],[
      [[240,100],[360,200],[480,300],[650,400],[900,500],[1100,650],[1300,780],[1460,850]]
    ],[{id:'river-sign',name:'下游洛汀港方向',x:900,y:500,text:'白鐘至洛汀的河運順流約兩日；此處是陸路探索接段，不以畫面距離換算步程。'}]);
    map('lotin','洛汀港・陸路與港區','./assets/maps/c2-201-lotin-port-concept.png',[200,100],[
      [[200,100],[400,250],[650,350],[900,450],[1100,500]],
      [[900,450],[900,720],[1100,780]],[[650,350],[650,650],[400,700]]
    ],[{id:'quay',name:'河運碼頭',x:1100,y:500,text:'白鐘主河下游的河口港；海上航線仍須依後續主線開放。'},
      {id:'tide',name:'潮位告示',x:1100,y:780,text:'可在港區步行查看，尚未開放的海路不能由此直接出航。'}]);
    // Replace the direct city/town jump with the actual three-day road.
    maps.city.exits=maps.city.exits.filter(function(e){return e.to!=='mistbridge';});maps.mistbridge.exits=maps.mistbridge.exits.filter(function(e){return e.to!=='city';});
    connect('city',840,80,'northRoad',850,850,'北門外・北方商路','返回白鐘北門');
    connect('northRoad',1460,120,'mistbridge',1045,880,'抵達霧橋鎮・三日行程','南返北方商路');
    connect('city',140,580,'factoryNear',300,760,'進入城西工坊','退出工坊至警戒線外');
    connect('factoryNear',780,220,'factoryFar',1070,250,'沿核准木板接應老瓦克','沿接應線返回完整地面');
    maps.factoryNear.exits.find(function(e){return e.to==='factoryFar';}).storyBridge=true;
    maps.factoryFar.exits.find(function(e){return e.to==='factoryNear';}).storyBridge=true;
    connect('city',1140,340,'cityInn',850,870,'進入東門旅店','返回白鐘東門街區');
    maps.city.paths.push({width:64,points:[[390,700],[460,730]]});
    connect('city',460,730,'recovery',850,850,'前往老瓦克休養處','返回城西街區');
    connect('village',1390,474,'clinic',480,630,'進入醫療屋與廚房','返回獸靈之村');
    connect('city',290,230,'observatory',480,630,'進入城西觀測分會','返回白鐘城西街區');
    connect('echo',650,480,'station',480,630,'進入山腰驛站','返回驛站外山路');
    connect('mistbridge',826,328,'mistInn',850,870,'進入旅店後廳','返回霧橋鎮');
    connect('echo',1000,273,'rescue',140,800,'沿山路至迴音谷舊渡台','返回山腰驛站');
    connect('south',780,962,'riverRoad',240,100,'南行下游商路・洛汀港方向','北返南驛山谷');
    connect('riverRoad',1460,850,'lotin',200,100,'進入洛汀港陸路入口','沿商路返回南驛');
  }
  function bridgeOpen(state){return state.act>4||(state.act===4&&state.index>=3);}
  return {order:order,meta:meta,acts:acts,install:install,bridgeOpen:bridgeOpen};
}));
