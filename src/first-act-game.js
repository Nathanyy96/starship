(function (root, factory) {
  var api = factory(typeof module === "object" && module.exports ? require("./first-act-scenes.js") : root.StarshipFirstActScenes);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipFirstActGame = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (dialogue) {
  "use strict";
  var renderer = typeof module === "object" && module.exports ? require("./exploration-renderer.js") : globalThis.StarshipExplorationRenderer;
  var TILE = 32, W = 36, H = 24;
  var backgrounds = { valley: "./assets/exploration/south-post-altar-v2.png", forest: "./assets/exploration/village-forest-v2.png" };
  var beastSource = "./assets/exploration/opening-beast-map-v2.png";
  var lookouts = [
    { zone:"valley", x:11.5, y:8, title:"查看斷柱", text:"風掠過斷柱與苔蘚，碎石間長著細小的白花。祭壇就在前方。" },
    { zone:"valley", x:5.1, y:7.3, title:"查看谷口石路", text:"石路沿溪谷延伸，接向谷外商道。瑟蕾雅原本打算從這條路返回南驛。" },
    { zone:"forest", x:11.7, y:9.7, title:"查看林間泉水", text:"泉水從覆滿苔蘚的石間落下，沿溪流向林外。回到主路仍能找到通村林道。" },
    { zone:"forest", x:28.6, y:16.4, title:"查看溪上木橋", text:"木橋跨過溪流。通往村子的路在北側，燈柱與繩結留下清楚的路標。" }
  ];
  // Local ground traced against the detailed scene art; coordinates are in tiles.
  var paths = {
    valley: [
      { width: 1.5, points: [[17,23],[16.5,19],[15.5,16.5],[20,16.5],[23.5,16.5],[23.5,14.5],[23.5,13],[22,11],[17.5,11.5],[14,9],[11.5,8],[7.5,8.5],[5.1,7.3],[2.5,5]] },
      { width: 1.5, points: [[17.5,11.5],[21,11],[22.5,9.5],[25.5,9.4],[27,11.8],[25.5,14.5],[23.5,14.5]] }
    ],
    forest: [
      { width: 1.05, points: [[2.5,15.5],[4.5,15.8],[7.5,15.5],[11.5,14.4],[15,13],[17.5,12.5],[21,11.8],[24,10.5],[26.5,10.5],[29,8.8],[32.5,7.5],[32,4],[31,1]] },
      { width: 1.15, points: [[26.5,10.5],[27,11.5],[29.5,11.5],[31.2,10.5]] },
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
    { zone: "valley", x: 7, y: 8, title: "核對岔路", prompt: "前往舊圖標錯的岔路，核對斷崖。", text: "舊圖把兩條岔路畫成一條。瑟蕾雅劃掉錯線，標出載貨車不能通行的斷崖。" },
    { zone: "valley", x: 17, y: 11, title: "收好路圖", prompt: "返回舊祭壇，收好補完的路圖。", text: "她把炭筆收進皮套，捲好圖紙。天色尚亮，她本來只想趕上南驛旅店的晚餐。" },
    { zone: "valley", x: 22, y: 9, title: "界痕與巨獸", prompt: "靠近裂縫，觀察落在祭壇上的巨獸。", text: "銀白裂縫張開，黑晶巨獸落在祭壇。牠回頭望著逐漸合攏的界痕，瑟蕾雅卻看見牠正轉向谷外商路。" },
    { zone: "valley", x: 25, y: 14, title: "引開巨獸", prompt: "繞過斷柱，把巨獸帶離谷口石路。", text: "她敲響石柱引牠轉身，利用斷柱擋住衝勢。鬆動的階角只被星光定住一瞬，腳下的空氣隨後向內凹去。", nextZone: "forest", spawn: [4.5, 15.8] },
    { zone: "forest", x: 7, y: 15, title: "確認傷勢", prompt: "在位移落點檢查傷口和背包。", text: "她醒在陌生森林。最後一張路圖不見了，指南針的指針卡住，左臂傷口仍在滲血。" },
    { zone: "forest", x: 17, y: 12, title: "沿水聲尋路", prompt: "循水聲穿過林地。", text: "附近的細葉灌木與圓石都不在她熟悉的路上。順水走，總比站著等天黑好。" },
    { zone: "forest", x: 26, y: 10, title: "遇見雷恩", prompt: "靠近巡林者雷恩，停下腳步。", text: "一支箭落在鞋尖前。雷恩守著通村林道，先請陌生的瑟蕾雅不要再往前走。" },
    { zone: "forest", x: 29, y: 11, title: "接受莉亞包紮", prompt: "到莉亞身邊處理傷口。", text: "莉亞看見滲血的布條，先問她會不會暈，再清洗傷口、挑出碎砂。疼痛沒有因星光而消失。" },
    { zone: "forest", x: 32, y: 7, title: "跟隨林道", prompt: "和雷恩、莉亞沿林道前往村子。", text: "雷恩在前方撥開細枝，莉亞放慢腳步陪她走。轉過最後一道彎，煙味和燈光從村裡傳來。" }
  ];
  var scenes = dialogue.approach;
  var zoneNames = { valley: "南驛山谷・舊祭壇", forest: "獸靈之村外・林道", village: "獸靈之村・醫療屋" };
  function initial() { return { index: 0, zone: "valley", x: 15.5, y: 16.5 }; }
  function passable(zone, x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < .4 || y < .4 || x > W-.4 || y > H-.4) return false;
    if(zone==='valley'&&x>=13&&x<=27&&y>=7.5&&y<=12.5)return true;
    return (paths[zone] || []).some(function (path) { return path.points.some(function (b, i) {
      if (!i) return false; var a = path.points[i-1], dx = b[0]-a[0], dy = b[1]-a[1];
      var t = Math.max(0, Math.min(1, ((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)));
      return Math.hypot(x-a[0]-t*dx, y-a[1]-t*dy) <= path.width;
    }); });
  }
  function terrain(zone, x, y) { return passable(zone, x+.5, y+.5) ? "path" : zone === "forest" && y > 17 ? "water" : zone === "forest" ? "tree" : "stone"; }
  function nearLookout(state) { return lookouts.find(function (place) { return place.zone === state.zone && Math.hypot(state.x-place.x,state.y-place.y) < 1.5; }) || null; }
  function normalize(raw) {
    var index = Math.max(0, Math.min(steps.length, Math.floor(Number(raw && raw.index) || 0)));
    var expected = index < steps.length ? steps[index].zone : "forest";
    var zone = raw && raw.zone === expected ? expected : expected;
    var spawn = zone === "valley" ? [15.5, 16.5] : [4.5, 15.8];
    var x = Number(raw && raw.x), y = Number(raw && raw.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !passable(zone, x, y)) { x = spawn[0]; y = spawn[1]; }
    return { index: index, zone: zone, x: x, y: y };
  }
  function route(state) {
    var step = steps[state.index]; if (!step || step.zone !== state.zone) return [];
    var start = [Math.floor(state.x), Math.floor(state.y)], end = [step.x, step.y], key = function (x, y) { return y * W + x; };
    var queue = [key(start[0], start[1])], prev = new Map([[queue[0], -1]]), target = key(end[0], end[1]);
    for (var head = 0; head < queue.length && !prev.has(target); head++) {
      var at = queue[head], x = at % W, y = Math.floor(at / W);
      [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach(function (d) { var nx = x + d[0], ny = y + d[1], n = key(nx, ny); if (!prev.has(n) && passable(state.zone, nx + .5, ny + .5)) { prev.set(n, at); queue.push(n); } });
    }
    if (!prev.has(target)) return [];
    var result = []; for (var n = target; n !== -1; n = prev.get(n)) result.push([n % W, Math.floor(n / W)]);
    return result.reverse();
  }
  function advance(state) {
    var next = normalize(state), step = steps[next.index];
    if (!step || Math.hypot(next.x - (step.x + .5), next.y - (step.y + .5)) >= 2.2) return { state: next, completed: false, text: "請靠近目前目標，再按 E 互動。" };
    next.index++;
    if (step.nextZone) { next.zone = step.nextZone; next.x = step.spawn[0]; next.y = step.spawn[1]; }
    return { state: next, completed: next.index === steps.length, text: step.text, title: step.title };
  }
  function create(options) {
    var canvas = options.canvas, ctx = canvas.getContext("2d"), state = normalize(options.load());
    var active = false, held = new Set(), frame = 0, previous = 0, lastSave = 0, routeKey = "", currentRoute = [], art = {}, sceneIndex = -1, lineIndex = 0, optionalScene = null;
    function talking() { return sceneIndex >= 0 || optionalScene !== null; }
    var characterArt = globalThis.StarshipExplorationCharacters, characterData = options.characterData || globalThis.StarshipGachaData || {};
    var extraActors = (options.actors || []).filter(function (actor) { return actor.id && Number.isFinite(actor.x) && Number.isFinite(actor.y); });
    function loadCharacter(id, fallback) {
      if (characterArt && characterArt.load(id, characterData, function (image) { if (image) art[id] = image; draw(); })) return;
      if (fallback) { var img = new Image(); img.onload = function () { art[id] = img; draw(); }; img.src = fallback; }
    }
    var playerLoad;
    function setPlayer(id) {
      if (!characterArt || !characterArt.resolve(id, characterData)) return false;
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
      return renderer.sprite(ctx, art[id], x, y, height, flip, bob);
    }
    function draw() {
      var view = renderer.begin(canvas, ctx, W * TILE, H * TILE, state.x * TILE, state.y * TILE);
      ctx.fillStyle = "#243e35"; ctx.fillRect(view.x, view.y, view.width, view.height);
      var ground=renderer.terrain('opening-'+state.zone,W*TILE,H*TILE,function(x,y){return passable(state.zone,x/TILE,y/TILE);},{stairs:state.zone==='valley'?[[22*TILE,13*TILE,3*TILE,2.5*TILE]]:[]});
      if(ground)ctx.drawImage(ground,0,0);
      if (state.zone === "valley" && state.index >= 2 && state.index <= 3) {
        ctx.fillStyle = "rgba(163,179,252,.5)"; ctx.beginPath(); ctx.ellipse(22.5 * TILE, 8.5 * TILE, 12, 48, -.2, 0, Math.PI * 2); ctx.fill();
        sprite("beast", 25.5*TILE, 11.7*TILE, 90, false, 0);
      }
      var step = steps[state.index], nextKey = state.zone + ":" + Math.floor(state.x) + ":" + Math.floor(state.y) + ":" + state.index;
      if (nextKey !== routeKey) { currentRoute = route(state); routeKey = nextKey; }
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
      options.distance.textContent = step ? (currentRoute.length ? "沿金色路線前進 · 約 " + Math.max(0, currentRoute.length - 1) + " 步" : "請返回可通行道路") : "已抵達第一幕結尾";
      var mainNear = step && Math.hypot(state.x - (step.x+.5),state.y-(step.y+.5)) < 2.2, lookout = nearLookout(state);
      options.interact.hidden = talking() || (!mainNear && !lookout);
      options.interact.disabled = options.interact.hidden;
      options.interact.textContent = mainNear ? "進入劇情對話 E" : lookout ? lookout.title+" E" : "靠近地點互動";
      options.enter.hidden = state.index < steps.length;
    }
    function tick(now) {
      if (!active) return;
      var dt = Math.min((now - (previous || now)) / 1000, .05); previous = now;
      var dx = Number(held.has("right")) - Number(held.has("left")), dy = Number(held.has("down")) - Number(held.has("up"));
      if (!talking() && state.index>=steps.length && state.y<2 && options.onEnterVillage){options.onEnterVillage();return;}
      if (!talking() && (dx || dy)) {
        var len = Math.hypot(dx, dy), nx = state.x + dx / len * dt * 4, ny = state.y + dy / len * dt * 4;
        if (passable(state.zone, nx - .22, state.y - .22) && passable(state.zone, nx + .22, state.y + .22)) state.x = nx;
        if (passable(state.zone, state.x - .22, ny - .22) && passable(state.zone, state.x + .22, ny + .22)) state.y = ny;
        if (now - lastSave > 800) { save(); lastSave = now; }
      }
      draw(); frame = requestAnimationFrame(tick);
    }
    function showLine() {
      var lines = optionalScene || scenes[sceneIndex], line = lines[lineIndex];
      options.dialogTitle.textContent = line[0]; options.dialogText.textContent = line[1];
      if (characterArt) characterArt.speakerPortrait(options.dialog, line[0], characterData);
      options.dialogNext.textContent = lineIndex + 1 < lines.length ? "繼續 →" : "完成對話 ✓";
      options.dialog.hidden = false; options.dialogNext.focus({ preventScroll: true }); draw();
    }
    function interact() {
      var step = steps[state.index];
      if (talking()) return;
      if (!step || Math.hypot(state.x - (step.x+.5),state.y-(step.y+.5)) >= 2.2) {
        var place = nearLookout(state); if (!place) return;
        optionalScene = [[place.title,place.text]]; lineIndex=0;held.clear();showLine();return;
      }
      sceneIndex = state.index; lineIndex = 0; held.clear(); showLine();
    }
    function nextLine() {
      if (optionalScene) { optionalScene=null; options.dialog.hidden=true;draw();canvas.focus({preventScroll:true});return; }
      if (sceneIndex < 0) return;
      if (++lineIndex < scenes[sceneIndex].length) { showLine(); return; }
      var result = advance(state); state = result.state; save(); sceneIndex = -1;
      options.dialog.hidden = true; draw(); canvas.focus({ preventScroll: true });
    }
    function onKey(e, down) {
      if (!active || options.panel.hidden) return;
      if (talking()) { if (down && (e.code === "Enter" || e.code === "Space" || e.code === "KeyE") && !e.repeat) { e.preventDefault(); nextLine(); } return; }
      var keys = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
      if (keys[e.code] && !(e.target instanceof HTMLInputElement) && !(e.target.closest && e.target.closest('select,textarea'))) { e.preventDefault(); if (down) held.add(keys[e.code]); else held.delete(keys[e.code]); }
      if (down && e.code === "KeyE" && !e.repeat) { e.preventDefault(); interact(); }
    }
    window.addEventListener("keydown", function (e) { onKey(e, true); }); window.addEventListener("keyup", function (e) { onKey(e, false); });
    window.addEventListener("blur", function () { held.clear(); });
    options.interact.addEventListener("click", interact);
    options.dialogNext.addEventListener("click", nextLine);
    options.reset.addEventListener("click", function () { state = initial(); sceneIndex = -1; optionalScene=null; save(); if (options.onRestart) options.onRestart(); options.dialog.hidden = true; draw(); canvas.focus({ preventScroll: true }); });
    options.pad.querySelectorAll("[data-act-move]").forEach(function (button) {
      function release(e) { held.delete(button.dataset.actMove); if (e.pointerId !== undefined && button.hasPointerCapture(e.pointerId)) button.releasePointerCapture(e.pointerId); }
      button.addEventListener("pointerdown", function (e) { e.preventDefault(); held.add(button.dataset.actMove); button.setPointerCapture(e.pointerId); });
      button.addEventListener("pointerup", release); button.addEventListener("pointercancel", release); button.addEventListener("lostpointercapture", function () { held.delete(button.dataset.actMove); });
    });
    draw();
    return { open: function () { state = normalize(options.load()); active = true; previous = 0; draw(); frame = requestAnimationFrame(tick); canvas.focus({ preventScroll: true }); },
      close: function () { active = false; held.clear(); sceneIndex = -1; optionalScene=null; options.dialog.hidden = true; cancelAnimationFrame(frame); save(); }, setPlayer: setPlayer, state: function () { return normalize(state); } };
  }
  return { steps: steps, scenes: scenes, sprites: sprites, backgrounds: backgrounds, paths: paths, lookouts: lookouts, nearLookout: nearLookout, zoneNames: zoneNames, initial: initial, terrain: terrain, passable: passable, normalize: normalize, route: route, advance: advance, create: create };
}));
