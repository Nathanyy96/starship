(function (root, factory) {
  var api = factory(typeof module === 'object' && module.exports ? require('./story-1-0-current.js') : root.StarshipStory10Current,
    typeof module === 'object' && module.exports ? require('./exploration.js') : root.StarshipExploration);
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.StarshipFirstMajorWorld = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (source, village) {
  'use strict';
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
  function initial(act) {act=act===3?3:2;var map=maps[acts[act][0].map];return {version:1,act:act,index:0,map:acts[act][0].map,x:map.spawn[0],y:map.spawn[1],visited:[]};}
  function normalize(raw) {
    var state=initial(raw&&raw.act), steps=acts[state.act];
    if(raw&&raw.version===1){state.index=Math.max(0,Math.min(steps.length,Math.floor(Number(raw.index)||0)));state.map=maps[raw.map]?raw.map:'village';
      var seen=steps.slice(0,Math.min(state.index+1,steps.length)).some(function(s){return s.map===state.map;});if(!seen)state.map=steps[Math.min(state.index,steps.length-1)].map;
      if(state.map===raw.map && passable(state.map,Number(raw.x),Number(raw.y))){state.x=Number(raw.x);state.y=Number(raw.y);}else {state.x=maps[state.map].spawn[0];state.y=maps[state.map].spawn[1];}
      state.visited=Array.isArray(raw.visited)?raw.visited.filter(function(id){return Object.keys(maps).some(function(k){return maps[k].sites.some(function(s){return k+':'+s.id===id;});});}):[];
    }return state;
  }
  function goal(state){return acts[state.act][state.index]||null;}
  function fits(map,x,y){return [[-6,-6],[-6,6],[6,-6],[6,6]].every(function(d){return passable(map,x+d[0],y+d[1]);});}
  function clearSegment(map,ax,ay,bx,by){var count=Math.max(1,Math.ceil(Math.hypot(bx-ax,by-ay)/4));for(var i=1;i<=count;i++)if(!fits(map,ax+(bx-ax)*i/count,ay+(by-ay)*i/count))return false;return true;}
  function move(state,dx,dy){var next=normalize(state),steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/6));for(var i=0;i<steps;i++){var x=next.x+dx/steps,y=next.y+dy/steps;if(fits(next.map,x,next.y))next.x=x;if(fits(next.map,next.x,y))next.y=y;}return next;}
  function canVisit(state,map){return acts[state.act].slice(0,Math.min(state.index+1,acts[state.act].length)).some(function(s){return s.map===map;});}
  function nearby(state) {
    var target=goal(state);if(target&&target.map===state.map&&Math.hypot(state.x-target.x,state.y-target.y)<55)return {kind:'story',value:target};
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
  function navigationTarget(state){var target=goal(state);if(!target)return null;if(target.map===state.map)return target;return maps[state.map].exits.find(function(exit){return canVisit(state,exit.to)&&(exit.to===target.map||(state.map==='village'&&target.map==='city'&&exit.to==='road'));})||null;}
  function create(options) {
    var canvas=options.canvas,ctx=canvas.getContext('2d'),state=normalize(options.load()),images={},held=new Set(),active=false,frame=0,previous=0,lastSave=0,lines=null,lineIndex=0,pending=false,epoch=0,routeKey='',currentRoute=[];
    function save(){options.save(normalize(state));}
    function loadImage(key,src){var img=new Image();img.onload=function(){images[key]=img;draw();};img.onerror=function(){options.status.textContent='地圖素材載入失敗，請重新開啟探索。';};img.src=src;}
    var characterArt=globalThis.StarshipExplorationCharacters,characterData=options.characterData||globalThis.StarshipGachaData||{},playerLoad;
    function setPlayer(id){if(!characterArt||!characterArt.resolve(id,characterData))return false;if(playerLoad)playerLoad.cancel();delete images.hero;playerLoad=characterArt.load(id,characterData,function(img){if(img)images.hero=img;draw();});return true;}
    Object.keys(maps).forEach(function(k){loadImage(k,maps[k].image);});if(!setPlayer(options.playerId||'hero'))loadImage('hero',village.spriteSources.hero);
    function showLine(){options.dialogTitle.textContent=goal(state).title;options.dialogText.textContent=lines[lineIndex];options.dialogNext.textContent=lineIndex+1<lines.length?'繼續 →':'完成此段對話';options.dialog.hidden=false;options.dialogNext.focus({preventScroll:true});}
    function syncComplete(){if(pending)return;var syncAct=state.act,stamp=epoch;pending=true;options.status.textContent='正在保存第'+syncAct+'幕主線進度…';Promise.resolve().then(function(){if(stamp!==epoch)return;return options.onComplete(syncAct);}).then(function(){if(stamp!==epoch)return;pending=false;options.status.textContent='第'+syncAct+'幕完成，主線進度已保存。';draw();}).catch(function(error){if(stamp!==epoch)return;pending=false;options.status.textContent='主線進度尚未保存：'+error.message+'。可按「保存本幕進度」重試。';draw();});}
    function nextLine(){if(!lines||pending)return;if(++lineIndex<lines.length){showLine();return;}state.index++;lines=null;options.dialog.hidden=true;save();routeKey='';if(!goal(state))syncComplete();draw();canvas.focus({preventScroll:true});}
    function draw(){var map=maps[state.map],cx=Math.max(0,Math.min(map.width-canvas.width,state.x-canvas.width/2)),cy=Math.max(0,Math.min(map.height-canvas.height,state.y-canvas.height/2));ctx.setTransform(1,0,0,1,-cx,-cy);ctx.fillStyle='#234c40';ctx.fillRect(cx,cy,canvas.width,canvas.height);if(images[state.map])ctx.drawImage(images[state.map],0,0,map.width,map.height);
      var target=navigationTarget(state),key=state.map+':'+Math.floor(state.x/16)+':'+Math.floor(state.y/16)+':'+state.index;if(key!==routeKey){currentRoute=route(state,target);routeKey=key;}
      if(currentRoute.length){ctx.beginPath();ctx.moveTo(state.x,state.y);currentRoute.forEach(function(p){ctx.lineTo(p.x,p.y);});ctx.strokeStyle='#243d38';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#f5cf75';ctx.lineWidth=4;ctx.setLineDash([5,10]);ctx.stroke();ctx.setLineDash([]);}
      map.sites.concat(map.exits).forEach(function(s){ctx.beginPath();ctx.arc(s.x,s.y,7,0,Math.PI*2);ctx.fillStyle='#d4f4e9';ctx.fill();});if(target){ctx.beginPath();ctx.arc(target.x,target.y,18,0,Math.PI*2);ctx.strokeStyle='#ffe4a0';ctx.lineWidth=3;ctx.stroke();}
      ctx.fillStyle='rgba(12,30,28,.4)';ctx.beginPath();ctx.ellipse(state.x,state.y+6,13,5,0,0,Math.PI*2);ctx.fill();var hero=images.hero;if(hero){var h=state.map==='city'?58:78,w=h*hero.naturalWidth/hero.naturalHeight;ctx.save();ctx.translate(state.x,state.y);if(held.has('left'))ctx.scale(-1,1);ctx.drawImage(hero,-w/2,-h+9,w,h);ctx.restore();}ctx.setTransform(1,0,0,1,0,0);
      var g=goal(state),near=nearby(state);options.zone.textContent=map.name;options.objective.textContent=g?'主線目的地：'+g.title:'本幕完成，可自由走訪已抵達區域';options.distance.textContent=g?g.time:'探索紀錄保存在此瀏覽器';options.position.textContent='第'+state.act+'幕 · '+Math.min(state.index+1,acts[state.act].length)+' / '+acts[state.act].length+' 段';options.interact.hidden=Boolean(lines)||!near;options.interact.textContent=near?(near.kind==='story'?'開始此段劇情 E':near.kind==='exit'?near.value.name+' E':'調查 '+near.value.name+' E'):'靠近目標互動';options.sync.hidden=Boolean(g);options.sync.disabled=pending;options.next.hidden=Boolean(g)||state.act===3;options.next.disabled=!options.canStart(3);
    }
    function interact(){if(lines||pending)return;var found=nearby(state);if(!found)return;if(found.kind==='story'){lines=found.value.lines;lineIndex=0;held.clear();showLine();draw();return;}if(found.kind==='exit'){var result=transition(state,found.value);if(result.changed){state=result.state;save();routeKey='';options.status.textContent=maps[state.map].name; }else options.status.textContent='先完成目前主線對話，才可前往下一個區域。';}else {var id=state.map+':'+found.value.id;if(!state.visited.includes(id))state.visited.push(id);save();options.status.textContent=found.value.name+'｜'+found.value.text;}draw();}
    function tick(now){if(!active)return;var dt=Math.min((now-(previous||now))/1000,.05);previous=now;var dx=Number(held.has('right'))-Number(held.has('left')),dy=Number(held.has('down'))-Number(held.has('up'));if(!lines&&!pending&&(dx||dy)){var norm=Math.hypot(dx,dy);state=move(state,dx/norm*dt*185,dy/norm*dt*185);if(now-lastSave>800){save();lastSave=now;}}draw();frame=requestAnimationFrame(tick);}
    function key(e,down){if(!active||options.panel.hidden||e.target.closest&&e.target.closest('input,textarea,select'))return;if(lines){if(down&&!e.repeat&&e.target!==options.dialogNext&&['KeyE','Enter','Space'].includes(e.code)){e.preventDefault();nextLine();}return;}var keys={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};if(keys[e.code]){e.preventDefault();if(down)held.add(keys[e.code]);else held.delete(keys[e.code]);}if(down&&e.code==='KeyE'&&!e.repeat){e.preventDefault();interact();}}
    window.addEventListener('keydown',function(e){key(e,true);});window.addEventListener('keyup',function(e){key(e,false);});window.addEventListener('blur',function(){held.clear();});
    options.pad.querySelectorAll('[data-world-move]').forEach(function(button){button.addEventListener('pointerdown',function(e){e.preventDefault();held.add(button.dataset.worldMove);button.setPointerCapture(e.pointerId);});['pointerup','pointercancel','lostpointercapture'].forEach(function(event){button.addEventListener(event,function(){held.delete(button.dataset.worldMove);});});});
    options.interact.addEventListener('click',interact);options.dialogNext.addEventListener('click',nextLine);options.sync.addEventListener('click',syncComplete);options.next.addEventListener('click',function(){start(3);});options.reset.addEventListener('click',function(){state.x=maps[state.map].spawn[0];state.y=maps[state.map].spawn[1];save();routeKey='';draw();});
    function start(act){if(!options.canStart(act)){options.status.textContent='先完成第'+(act-1)+'幕主線，才能開始第'+act+'幕探索。';return false;}epoch++;pending=false;held.clear();var saved=options.load(act);state=normalize(saved&&saved.act===act?saved:initial(act));lines=null;options.dialog.hidden=true;routeKey='';save();draw();return true;}
    return {open:function(act){if(!start(act))return false;active=true;previous=0;cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);canvas.focus({preventScroll:true});return true;},close:function(){if(active)save();epoch++;pending=false;active=false;held.clear();lines=null;options.dialog.hidden=true;cancelAnimationFrame(frame);},setPlayer:setPlayer,state:function(){return normalize(state);}};
  }
  return {maps:maps,acts:acts,initial:initial,normalize:normalize,passable:passable,move:move,route:route,goal:goal,canVisit:canVisit,nearby:nearby,transition:transition,navigationTarget:navigationTarget,create:create};
}));
