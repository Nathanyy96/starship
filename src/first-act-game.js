(function (root, factory) {
  var api = factory(typeof module === "object" && module.exports ? require("./first-act-scenes.js") : root.StarshipFirstActScenes);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipFirstActGame = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (dialogue) {
  "use strict";
  var storyArt=typeof module==='object'&&module.exports?require('./exploration-story-art'):globalThis.StarshipExplorationStoryArt;

  var renderer = typeof module === "object" && module.exports ? require("./exploration-renderer.js") : globalThis.StarshipExplorationRenderer;
  var TILE = 32, W = 36, H = 24;
  var motion=typeof module==='object'&&module.exports?require('./character-motion.js'):globalThis.StarshipCharacterMotion;
  var backgrounds = { valley: "./assets/exploration/south-post-altar-v2.png", forest: "./assets/exploration/village-forest-v2.png" };
  var beastSource = "./assets/exploration/opening-beast-map-v2.png";
  var lookouts = [
    { zone:"valley", x:11.5, y:8, title:"查看斷柱", text:"風掠過斷柱與苔蘚，碎石間長著細小的白花。祭壇就在前方。" },
    { zone:"valley", x:5.1, y:4.3, title:"查看谷口石路", text:"石路沿溪谷延伸，接向谷外商道。瑟蕾雅原本打算從這條路返回南驛。" },
    { zone:"forest", x:11.7, y:9.7, title:"查看林間泉水", text:"泉水從覆滿苔蘚的石間落下，沿溪流向林外。回到主路仍能找到通村林道。" },
    { zone:"forest", x:28.6, y:16.4, title:"查看溪上木橋", text:"木橋跨過溪流。通往村子的路在北側，燈柱與繩結留下清楚的路標。" }
  ];
  // Local ground traced against the detailed scene art; coordinates are in tiles.
  var paths = {
    valley: [
      { width: 2, points: [[17,23],[16.5,19],[15.5,16.5],[20,16.5],[23.5,16.5],[23.5,14.5],[23.5,13],[22,11],[17.5,11.5],[14,9],[11.5,8],[7.5,8.5],[5.1,7.3],[2.5,5]] },
      { width: 2, points: [[17.5,11.5],[21,11],[22.5,9.5],[25.5,9.4],[27,11.8],[25.5,14.5],[23.5,14.5]] }
    ],
    forest: [
      { width: 1.5, points: [[2.5,15.5],[4.5,15.8],[7.5,15.5],[11.5,14.4],[15,13],[17.5,12.5],[21,11.8],[24,10.5],[26.5,10.5],[29,8.8],[32.5,7.5],[32,4],[31,1]] },
      { width: 1.5, points: [[26.5,10.5],[27,11.5],[29.5,11.5],[31.2,10.5]] },
      { width: .85, points: [[15,13],[13.5,11.3],[11.7,9.7]] },
      { width: .65, points: [[29.5,11.5],[30,13],[29,14.5],[28.6,16.4],[28,17.5]] }
    ]
  };
  var sprites = {
    hero: "./assets/exploration/hero-chibi-v1.png",
    lia: "./assets/exploration/lia-chibi-v1.png",
    reyn: "./assets/exploration/reyn-chibi-v1.png",
    isar: "./assets/exploration/isar-chibi-v1.png"
  };
  // Each destination plays a short in-world scene before the next route unlocks.
  var steps = [
    { zone: "valley", x: 10, y: 8, title: "核對岔路", prompt: "前往舊圖標錯的岔路，核對斷崖。", text: "舊圖把兩條岔路畫成一條。瑟蕾雅劃掉錯線，標出載貨車不能通行的斷崖。" },
    { zone: "valley", x: 17, y: 10, title: "收好路圖", prompt: "經祭壇右下方階梯返回平台，收好路圖。", text: "她把炭筆收進皮套，捲好圖紙。天色尚亮，她本來只想趕上南驛旅店的晚餐。" },
    { zone: "valley", x: 19, y: 10, title: "界痕與巨獸", prompt: "靠近裂縫，觀察落在祭壇上的巨獸。", text: "銀白裂縫張開，黑晶巨獸落在祭壇。牠回頭望著逐漸合攏的界痕，瑟蕾雅卻看見牠正轉向谷外商路。" },
    { zone: "valley", x: 23, y: 14, title: "引開巨獸", prompt: "沿右下方階梯離開祭壇，把巨獸帶離谷口。", text: "她敲響石柱引牠轉身，利用斷柱擋住衝勢。鬆動的階角只被星光定住一瞬，腳下的空氣隨後向內凹去。", nextZone: "forest", spawn: [4.5, 15.8] },
    { zone: "forest", x: 7, y: 15, title: "確認傷勢", prompt: "在位移落點檢查傷口和背包。", text: "她醒在陌生森林。最後一張路圖不見了，指南針的指針卡住，左臂傷口仍在滲血。" },
    { zone: "forest", x: 17, y: 12, title: "沿水聲尋路", prompt: "循水聲穿過林地。", text: "附近的細葉灌木與圓石都不在她熟悉的路上。順水走，總比站著等天黑好。" },
    { zone: "forest", x: 26, y: 10, title: "遇見雷恩", prompt: "靠近巡林者雷恩，停下腳步。", text: "一支箭落在鞋尖前。雷恩守著通村林道，先請陌生的瑟蕾雅不要再往前走。" },
    { zone: "forest", x: 29, y: 11, title: "接受莉亞包紮", prompt: "到莉亞身邊處理傷口。", text: "莉亞看見滲血的布條，先問她會不會暈，再清洗傷口、挑出碎砂。疼痛沒有因星光而消失。" },
    { zone: "forest", x: 32, y: 7, title: "跟隨林道", prompt: "和雷恩、莉亞沿林道前往村子。", text: "雷恩在前方撥開細枝，莉亞放慢腳步陪她走。轉過最後一道彎，煙味和燈光從村裡傳來。" }
  ];
  var scenes = dialogue.approach;
  var zoneNames = { valley: "南驛山谷・舊祭壇", forest: "獸靈之村外・林道", village: "獸靈之村・醫療屋" };
  function initial() { return { index: 0, zone: "valley", x: 17.25, y: 16.5 }; }
  // Trace visible ground in the original 1536×1024 painting. The raised altar
  // has a solid rim; only its southeast stairs join it to the surrounding road.
  var valleyRoads=[
    {width:48,points:[[680,1020],[700,900],[720,800],[730,715],[680,660],[570,625],[500,560],[450,480],[470,400],[450,330],[350,270],[250,225],[150,180],[25,145]]},
    {width:60,points:[[730,715],[850,700],[970,660],[1080,620],[1190,550],[1270,470],[1300,380],[1220,340],[1120,320],[1000,320],[880,340],[720,330],[620,350],[470,400]]},
    {width:28,points:[[835,510],[870,545],[910,575],[955,610],[1000,640]]}
  ];
  function onRoad(roads,x,y){return roads.some(function(p){return p.points.some(function(b,i){if(!i)return false;var a=p.points[i-1],dx=b[0]-a[0],dy=b[1]-a[1],t=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));return Math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)<=p.width;});});}
  function valleyGround(x,y){
    x*=1536/W;y*=1024/H;
    var inner=Math.pow((x-762)/139,2)+Math.pow((y-450)/85,2)<=1;
    var rim=Math.pow((x-762)/176,2)+Math.pow((y-460)/121,2)<=1;
    var stairs=onRoad([valleyRoads[2]],x,y);
    if(rim&&!inner&&!stairs)return false;
    return inner||onRoad(valleyRoads,x,y);
  }
  function passable(zone, x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < .4 || y < .4 || x > W-.4 || y > H-.4) return false;
    if(zone==='valley')return valleyGround(x,y);
    return (paths[zone] || []).some(function (path) { return path.points.some(function (b, i) {
      if (!i) return false; var a = path.points[i-1], dx = b[0]-a[0], dy = b[1]-a[1];
      var t = Math.max(0, Math.min(1, ((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
      return Math.hypot(x-a[0]-t*dx, y-a[1]-t*dy) <= path.width;
    }); });
  }
  function fits(zone,x,y){return [[-.22,-.22],[.22,-.22],[-.22,.22],[.22,.22],[0,0]].every(function(p){return passable(zone,x+p[0],y+p[1]);});}
  function clearSegment(zone,a,b){var count=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.1));for(var i=0;i<=count;i++){var t=i/count;if(!fits(zone,a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t))return false;}return true;}
  function terrain(zone, x, y) { return passable(zone, x+.5, y+.5) ? "path" : zone === "forest" && y > 17 ? "water" : zone === "forest" ? "tree" : "stone"; }
  function nearLookout(state) { return lookouts.find(function (place) { return place.zone === state.zone && Math.hypot(state.x-place.x,state.y-place.y) < 1.5; }) || null; }
  function normalize(raw) {
    var index = Math.max(0, Math.min(steps.length, Math.floor(Number(raw && raw.index) || 0)));
    var expected = index < steps.length ? steps[index].zone : "forest";
    var zone = raw && raw.zone === expected ? expected : expected;
    var spawn = zone === "valley" ? [17.25, 16.5] : [4.5, 15.8];
    var x = Number(raw && raw.x), y = Number(raw && raw.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) { x = spawn[0]; y = spawn[1]; }
    if(!fits(zone,x,y)){var best=null,distance=Infinity;for(var gy=.5;gy<H;gy+=.5)for(var gx=.5;gx<W;gx+=.5){var d=Math.hypot(x-gx,y-gy);if(d<distance&&fits(zone,gx,gy)){best=[gx,gy];distance=d;}}x=best?best[0]:spawn[0];y=best?best[1]:spawn[1];}
    return { index: index, zone: zone, x: x, y: y };
  }
  var routeEdges={};
  function route(state) {
    var step = steps[state.index]; if (!step || step.zone !== state.zone) return [];
    var size=.5,cols=W/size,rows=H/size,startPoint=[state.x,state.y],end=[step.x+.5,step.y+.5];
    if(!fits(state.zone,startPoint[0],startPoint[1])||!fits(state.zone,end[0],end[1]))return [];
    var key=function(x,y){return y*cols+x;},point=function(n){return [(n%cols+.5)*size,(Math.floor(n/cols)+.5)*size];};
    var queue=[],prev=new Map(),target=-1,edges=routeEdges[state.zone]||(routeEdges[state.zone]=new Map());
    function edge(a,b){var k=Math.min(a,b)*cols*rows+Math.max(a,b);if(!edges.has(k))edges.set(k,clearSegment(state.zone,point(a),point(b)));return edges.get(k);}
    for(var sy=0;sy<rows;sy++)for(var sx=0;sx<cols;sx++){var n=key(sx,sy),p=point(n);if(Math.hypot(p[0]-state.x,p[1]-state.y)<.8&&clearSegment(state.zone,startPoint,p)){queue.push(n);prev.set(n,-1);}}
    for (var head = 0; head < queue.length; head++) {
      var at = queue[head], x = at % cols, y = Math.floor(at / cols),a=point(at);
      if(Math.hypot(a[0]-end[0],a[1]-end[1])<.8&&clearSegment(state.zone,a,end)){target=at;break;}
      [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach(function (d) { var nx = x + d[0], ny = y + d[1], n = key(nx, ny); if(nx>=0&&ny>=0&&nx<cols&&ny<rows&&!prev.has(n)&&edge(at,n)) { prev.set(n, at); queue.push(n); } });
    }
    if(target<0)return [];
    var result=[];for(var n=target;n!==-1;n=prev.get(n)){var p=point(n);result.push([p[0]-.5,p[1]-.5]);}
    result.reverse();result.unshift([state.x-.5,state.y-.5]);result.push([step.x,step.y]);
    // Remove grid zigzags only when the complete swept actor remains on ground.
    var smooth=[result[0]],cursor=0;while(cursor<result.length-1){var next=cursor+1;for(var j=result.length-1;j>cursor+1;j--)if(clearSegment(state.zone,[result[cursor][0]+.5,result[cursor][1]+.5],[result[j][0]+.5,result[j][1]+.5])){next=j;break;}smooth.push(result[next]);cursor=next;}return smooth;
  }
  function advance(state) {
    var next = normalize(state), step = steps[next.index];
    if (!step || Math.hypot(next.x - (step.x + .5), next.y - (step.y + .5)) >= 2.2 || !clearSegment(next.zone,[next.x,next.y],[step.x+.5,step.y+.5])) return { state: next, completed: false, text: "請沿道路靠近目前目標，再按 E 互動。" };
    next.index++;
    if (step.nextZone) { next.zone = step.nextZone; next.x = step.spawn[0]; next.y = step.spawn[1]; }
    return { state: next, completed: next.index === steps.length, text: step.text, title: step.title };
  }
  function create(options) {
    var canvas = options.canvas, ctx = canvas.getContext("2d"), state = normalize(options.load());
    var active = false, paused = false, held = new Set(), frame = 0, previous = 0, lastSave = 0, routeKey = "", currentRoute = [], art = {}, sceneIndex = -1, lineIndex = 0, optionalScene = null;
    var artScenes=scenes.map(function(lines){return storyArt?storyArt.timeline("main-1-0",1,lines):[];});
    function talking() { return sceneIndex >= 0 || optionalScene !== null; }
    var characterArt = globalThis.StarshipExplorationCharacters, characterData = options.characterData || globalThis.StarshipGachaData || {};
    var extraActors = (options.actors || []).filter(function (actor) { return actor.id && Number.isFinite(actor.x) && Number.isFinite(actor.y); });
    function loadCharacter(id, fallback) {
      loadMotion(id);
      if (characterArt && characterArt.load(id, characterData, function (image) { if (image) art[id] = image; draw(); })) return;
      if (fallback) { var img = new Image(); img.onload = function () { art[id] = img; draw(); }; img.src = fallback; }
    }
    var playerLoad,motionPlayer='celesia',motionImages={},motionPending={},motionHeading='down',motionStride=0,motionWalking=false,storyMotion=motion.createScene();
    function loadMotion(id){id=motion.canonical(id);if(!motion.supports(id)||motionPending[id])return;motionPending[id]=true;motion.load(id,function(img){if(img)motionImages[id]=img;draw();});}

    function setPlayer(id) {
      if (!motion.supports(id) && (!characterArt || !characterArt.resolve(id, characterData))) return false;
      motionPlayer=motion.canonical(id);loadMotion(motionPlayer);
      if (!characterArt || !characterArt.resolve(id, characterData)) return true;
      if (playerLoad) playerLoad.cancel();
      delete art.hero;
      playerLoad = characterArt.load(id, characterData, function (image) { if (image) art.hero = image; draw(); });
      return true;
    }
    Object.keys(sprites).forEach(function (id) { if (id !== "hero") loadCharacter(id, sprites[id]); });
    if (!setPlayer(options.playerId || "hero")) loadCharacter("hero", sprites.hero);
    extraActors.forEach(function (actor) { loadCharacter(actor.id); });
    var beast = new Image(); beast.onload = function () { art.beast = beast; draw(); }; beast.src = beastSource;
    function save() { options.save(state); }
    function sprite(id, x, y, height, flip, bob) {
      var reduced=Boolean(typeof window!=='undefined'&&window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      var staged=talking()?storyMotion.sample(performance.now(),reduced).find(function(a){return a.id===id;}):null;
      if(staged){x=staged.x;y=staged.y;}
      var who=id==='hero'?motionPlayer:motion.canonical(id),h=height;
      if(motion.supports(who))return motion.draw(ctx,motionImages[who],x,y,h,id==='hero'?motionHeading:staged?staged.facing:'down',staged?staged.distance:motionStride,id==='hero'?motionWalking:Boolean(staged&&staged.walking),reduced,who);
      return renderer.sprite(ctx, art[id], x, y, h, flip, bob);
    }
    function draw() {
      var view = renderer.begin(canvas, ctx, W * TILE, H * TILE, state.x * TILE, state.y * TILE);
      ctx.fillStyle = "#243e35"; ctx.fillRect(view.x, view.y, view.width, view.height);
      var ground=renderer.terrain('opening-'+state.zone,W*TILE,H*TILE,function(x,y){return passable(state.zone,x/TILE,y/TILE);},{image:backgrounds[state.zone],stairs:state.zone==='valley'?[[22*TILE,13*TILE,3*TILE,2.5*TILE]]:[]});
      if(ground)ctx.drawImage(ground,0,0);
      if (state.zone === "valley" && state.index >= 2 && state.index <= 3) {
        ctx.fillStyle = "rgba(163,179,252,.5)"; ctx.beginPath(); ctx.ellipse(22.5 * TILE, 8.5 * TILE, 12, 48, -.2, 0, Math.PI * 2); ctx.fill();
        sprite("beast", 25.5*TILE, 11.7*TILE, 90, false, 0);
      }
      var step = steps[state.index], nextKey = state.zone + ":" + Math.floor(state.x*4) + ":" + Math.floor(state.y*4) + ":" + state.index;
      if (nextKey !== routeKey || currentRoute.length>1&&!clearSegment(state.zone,[state.x,state.y],[currentRoute[1][0]+.5,currentRoute[1][1]+.5])) { currentRoute = route(state); routeKey = nextKey; }
      if (currentRoute.length > 1) {
        ctx.beginPath(); ctx.moveTo(state.x * TILE, state.y * TILE);
        currentRoute.slice(1).forEach(function (p) { ctx.lineTo((p[0] + .5) * TILE, (p[1] + .5) * TILE); });
        ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(29,43,44,.7)"; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = "#f5d486"; ctx.setLineDash([5, 8]); ctx.stroke(); ctx.setLineDash([]);
      }
      lookouts.forEach(function (place) { if (place.zone !== state.zone) return; ctx.beginPath(); ctx.arc(place.x*TILE,place.y*TILE,5,0,Math.PI*2); ctx.fillStyle="#d4f0e4";ctx.fill(); });
      if (state.zone === "forest") { sprite("reyn", 26.5 * TILE, 10.5 * TILE, 44, false, 0); sprite("lia", 29.5 * TILE, 11.5 * TILE, 44, false, 0); }
      if (state.zone === "village") { sprite("isar", 22.5 * TILE, 10.5 * TILE, 72, false, 0); sprite("lia", 26.5 * TILE, 12.5 * TILE, 64, false, 0); sprite("reyn", 29.5 * TILE, 13.5 * TILE, 64, false, 0); }
      extraActors.forEach(function (actor) { if (!actor.zone || actor.zone === state.zone) sprite(actor.id, actor.x, actor.y, actor.height || 70, false, 0); });
      if (step) {
        var tx = (step.x + .5) * TILE, ty = (step.y + .5) * TILE;
        ctx.strokeStyle = "#fff2c2"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tx, ty, 13, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#fff8e7"; ctx.font = "bold 13px system-ui"; ctx.textAlign = "center"; ctx.fillText(step.title, tx, ty - 18);
      }
      var px = state.x * TILE, py = state.y * TILE;
      ctx.fillStyle = "rgba(15,33,36,.35)"; ctx.beginPath(); ctx.ellipse(px, py + 11, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
      sprite("hero", px, py, 44, held.has("left"), held.size ? Math.sin(performance.now() / 90) * 2 : 0);
      renderer.end(ctx);
      options.zone.textContent = zoneNames[state.zone];
      options.objective.textContent = step ? step.prompt : "林道已走完，現在可以進入獸靈之村自由探索。";
      var remaining=currentRoute.reduce(function(sum,p,i){return i?sum+Math.hypot(p[0]-currentRoute[i-1][0],p[1]-currentRoute[i-1][1]):sum;},0);
      options.distance.textContent = step ? (currentRoute.length ? "沿金色路線前進 · 約 " + Math.ceil(remaining) + " 步" : "目前沒有可通行的指引路線，請返回道路") : "已抵達第一幕結尾";
      var mainNear = step && Math.hypot(state.x - (step.x+.5),state.y-(step.y+.5)) < 2.2&&clearSegment(state.zone,[state.x,state.y],[step.x+.5,step.y+.5]), lookout = nearLookout(state);
      options.interact.hidden = talking() || (!mainNear && !lookout);
      options.interact.disabled = options.interact.hidden;
      options.interact.textContent = mainNear ? "進入劇情對話 E" : lookout ? lookout.title+" E" : "靠近地點互動";
      options.enter.hidden = state.index < steps.length;
    }
    function tick(now) {
      if (!active || paused) return;
      var beforeX=state.x,beforeY=state.y;
      var dt = Math.min((now - (previous || now)) / 1000, .05); previous = now;
      var dx = Number(held.has("right")) - Number(held.has("left")), dy = Number(held.has("down")) - Number(held.has("up"));
      if (!talking() && state.index>=steps.length && state.y<2 && options.onEnterVillage){options.onEnterVillage();return;}
      if (!talking() && (dx || dy)) {
        var len = Math.hypot(dx, dy), nx = state.x + dx / len * dt * 4, ny = state.y + dy / len * dt * 4;
        if (clearSegment(state.zone,[state.x,state.y],[nx,ny])) {
          state.x = nx; state.y = ny;
        } else {
          if (clearSegment(state.zone,[state.x,state.y],[nx,state.y])) state.x = nx;
          if (clearSegment(state.zone,[state.x,state.y],[state.x,ny])) state.y = ny;
        }
        if (now - lastSave > 800) { save(); lastSave = now; }
      }
      var walked=Math.hypot(state.x-beforeX,state.y-beforeY);motionWalking=walked>.0001;if(motionWalking){motionHeading=motion.heading(state.x-beforeX,state.y-beforeY,motionHeading);motionStride+=walked*TILE;}
      draw(); frame = requestAnimationFrame(tick);
    }
    function showLine() {
      var lines = optionalScene || scenes[sceneIndex], line = lines[lineIndex];
      if(lineIndex===0)storyMotion.clear();if(!optionalScene)storyMotion.cue(line[1],sceneIndex+':'+lineIndex,{x:state.x*TILE,y:state.y*TILE},performance.now(),function(a,b){return clearSegment(state.zone,[a.x/TILE,a.y/TILE],[b.x/TILE,b.y/TILE]);});
      options.dialogTitle.textContent = line[0]; options.dialogText.textContent = line[1];
      if(options.dialog.classList)options.dialog.classList.toggle('has-character-motion',!optionalScene&&storyMotion.sample(performance.now(),false).length>0);
      if(storyArt)storyArt.show(options.dialog,optionalScene?[]:artScenes[sceneIndex],lineIndex);
      if (characterArt) characterArt.speakerPortrait(options.dialog, line[0], characterData);
      options.dialogNext.textContent = lineIndex + 1 < lines.length ? "繼續 →" : "完成對話 ✓";
      options.dialog.hidden = false; options.dialogNext.focus({ preventScroll: true }); draw();
    }
    function interact() {
      var step = steps[state.index];
      if (talking()) return;
      if (!step || Math.hypot(state.x - (step.x+.5),state.y-(step.y+.5)) >= 2.2 || !clearSegment(state.zone,[state.x,state.y],[step.x+.5,step.y+.5])) {
        var place = nearLookout(state); if (!place) return;
        optionalScene = [[place.title,place.text]]; lineIndex=0;held.clear();showLine();return;
      }
      sceneIndex = state.index; lineIndex = 0; held.clear(); showLine();
    }
    function nextLine() {
      if (optionalScene) { optionalScene=null; options.dialog.hidden=true;if(storyArt)storyArt.clear(options.dialog);draw();canvas.focus({preventScroll:true});return; }
      if (sceneIndex < 0) return;
      if (++lineIndex < scenes[sceneIndex].length) { showLine(); return; }
      var result = advance(state); state = result.state; save(); sceneIndex = -1;
      options.dialog.hidden = true; if(storyArt)storyArt.clear(options.dialog); draw(); canvas.focus({ preventScroll: true });
    }
    function onKey(e, down) {
      if (!active || paused || options.panel.hidden) return;
      if(storyArt&&storyArt.isZoomed())return;
      if (talking()) { if (down && (e.code === "Enter" || e.code === "Space" || e.code === "KeyE") && !e.repeat) { e.preventDefault(); nextLine(); } return; }
      var keys = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
      if (keys[e.code] && !(e.target instanceof HTMLInputElement) && !(e.target.closest && e.target.closest('select,textarea'))) { e.preventDefault(); if (down) held.add(keys[e.code]); else held.delete(keys[e.code]); }
      if (down && e.code === "KeyE" && !e.repeat) { e.preventDefault(); interact(); }
    }
    window.addEventListener("keydown", function (e) { onKey(e, true); }); window.addEventListener("keyup", function (e) { onKey(e, false); });
    window.addEventListener("blur", function () { held.clear(); });
    options.interact.addEventListener("click", interact);
    options.dialogNext.addEventListener("click", nextLine);
    options.reset.addEventListener("click", function () { state = initial(); sceneIndex = -1; optionalScene=null; save(); if (options.onRestart) options.onRestart(); options.dialog.hidden = true; if(storyArt)storyArt.clear(options.dialog); draw(); canvas.focus({ preventScroll: true }); });
    options.pad.querySelectorAll("[data-act-move]").forEach(function (button) {
      function release(e) { held.delete(button.dataset.actMove); if (e.pointerId !== undefined && button.hasPointerCapture(e.pointerId)) button.releasePointerCapture(e.pointerId); }
      button.addEventListener("pointerdown", function (e) { e.preventDefault(); held.add(button.dataset.actMove); button.setPointerCapture(e.pointerId); });
      button.addEventListener("pointerup", release); button.addEventListener("pointercancel", release); button.addEventListener("lostpointercapture", function () { held.delete(button.dataset.actMove); });
    });
    draw();
    return { pause:function(){paused=true;held.clear();cancelAnimationFrame(frame);if(active)save();},resume:function(){if(!active)return;paused=false;held.clear();previous=0;cancelAnimationFrame(frame);frame=requestAnimationFrame(tick);canvas.focus({preventScroll:true});},beginStory:interact,open: function () { cancelAnimationFrame(frame);sceneIndex=-1;optionalScene=null;options.dialog.hidden=true;if(storyArt)storyArt.clear(options.dialog);state = normalize(options.load()); active = true; paused = false; previous = 0; draw(); frame = requestAnimationFrame(tick); canvas.focus({ preventScroll: true }); },
      close: function () { active = false; held.clear(); sceneIndex = -1; optionalScene=null; options.dialog.hidden = true; if(storyArt)storyArt.clear(options.dialog); cancelAnimationFrame(frame); save(); }, setPlayer: setPlayer, state: function () { return normalize(state); } };
  }
  return { steps: steps, scenes: scenes, sprites: sprites, backgrounds: backgrounds, paths: paths, lookouts: lookouts, nearLookout: nearLookout, zoneNames: zoneNames, initial: initial, terrain: terrain, passable: passable, fits:fits, clearSegment:clearSegment, normalize: normalize, route: route, advance: advance, create: create };
}));
