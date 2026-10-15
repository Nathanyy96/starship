(function (root, factory) {
  var api = factory(typeof module === "object" && module.exports ? require("./first-act-scenes.js") : root.StarshipFirstActScenes);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipExploration = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (dialogue) {
  "use strict";
  var storyArt=typeof module==='object'&&module.exports?require('./exploration-story-art'):globalThis.StarshipExplorationStoryArt;

  var renderer = typeof module === "object" && module.exports ? require("./exploration-renderer.js") : globalThis.StarshipExplorationRenderer;
  // Coordinates and corridors are traced against the existing C1-102 illustration.
  var WIDTH = 1672, HEIGHT = 939, NAV = 16;
  var mapImage = "./assets/maps/c1-102.png";
  var spriteSources = {
    hero: "./assets/exploration/hero-chibi-v1.png",
    lia: "./assets/exploration/lia-chibi-v1.png",
    reyn: "./assets/exploration/reyn-chibi-v1.png",
    isar: "./assets/exploration/isar-chibi-v1.png"
  };
  var paths = [
    { width: 54, points: [[1535,155],[1510,212],[1405,282],[1320,315],[1230,350],[1125,365],[1030,390],[945,420],[845,455]] },
    { width: 57, points: [[845,455],[745,463],[640,451],[540,442],[435,461],[330,455],[225,421],[120,390],[35,355]] },
    { width: 58, points: [[1125,365],[1195,401],[1270,433],[1350,469],[1430,475]] },
    { width: 50, points: [[330,455],[355,405],[355,360],[326,319]] },
    { width: 54, points: [[845,455],[805,426],[785,358],[797,303]] },
    { width: 62, points: [[845,455],[875,505],[930,553],[1038,585],[1120,590]] },
    { width: 48, points: [[745,463],[753,538],[725,590],[704,655],[671,711],[648,764]] },
    { width: 50, points: [[1350,469],[1435,521],[1477,590],[1495,664],[1540,715],[1601,769]] },
    { width: 55, points: [[540,442],[585,380],[637,330],[706,303],[797,303]] }
  ];
  var sites = [
    { id: "fire", name: "共用火場", x: 841, y: 453, text: "村民在火場旁交換消息，也為晚歸的人留一盞火。" },
    { id: "heal", name: "療養所", x: 1390, y: 474, text: "這裡備有藥草與清水。莉亞會先問傷者的情況，再決定如何處理。" },
    { id: "rangers", name: "巡林者據點", x: 355, y: 399, text: "雷恩在這裡記錄林道與天候；沒有帶路的人不該自行往溪溝下游。" },
    { id: "supplies", name: "物資倉與工坊", x: 1038, y: 584, text: "工具、木料與日常補給堆放在村道旁。" },
    { id: "west-road", name: "西側白鐘商路", x: 124, y: 390, text: "西側商路通向白鐘城；步行約兩日，走到西側出口即可接續商路。" },
    { id: "bridge", name: "南側溪橋", x: 704, y: 655, text: "溪水只能從橋上通過。向南沿驛路可到南驛山谷。" }
  ];
  var storyGoals = [
    { id: "isar", title: "在療養屋與伊薩爾談話", x: 1335, y: 467, text: "伊薩爾聽完南驛祭壇、界痕與巨獸的經過，允許瑟蕾雅今晚住在村裡，也提醒她別獨自去溪溝下游。" },
    { id: "supper", title: "在醫療屋吃一碗熱湯", x: 1405, y: 479, text: "莉亞請她先吃，明天再談費用。雷恩把劍放在她看得見的地方。南驛的晚餐趕不上了，這裡的湯卻很熱。" }
  ];
  var storyScenes = dialogue.village;
  function distanceToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }
  function passable(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 10 || y < 95 || x > WIDTH - 10 || y > HEIGHT - 10) return false;
    if (Math.hypot(x - 832, y - 395) < 32) return false; // fire pit
    if (Math.pow((x - 1370) / 70, 2) + Math.pow((y - 370) / 55, 2) < 1) return false; // healer tent
    return paths.some(function (path) { return path.points.some(function (point, i) {
      if (!i) return false;
      var prev = path.points[i - 1];
      return distanceToSegment(x, y, prev[0], prev[1], point[0], point[1]) <= path.width;
    }); });
  }
  function initial() { return { mapVersion: 2, storyVersion: 1, x: 1518, y: 216, arrived: false, storyStep: 0, discovered: [] }; }
  function normalize(raw) {
    var state = raw && raw.mapVersion === 2 ? raw : initial(), x = Number(state.x), y = Number(state.y);
    if (!passable(x, y)) { x = 1518; y = 216; }
    return { mapVersion: 2, storyVersion: 1, x: x, y: y, arrived: state.arrived === true,
      storyStep: state.storyVersion === 1 ? Math.max(0, Math.min(storyGoals.length, Math.floor(Number(state.storyStep) || 0))) : 0,
      discovered: Array.isArray(state.discovered) ? sites.filter(function (site) { return state.discovered.includes(site.id); }).map(function (site) { return site.id; }) : [] };
  }
  function objective(state) {
    return state.arrived ? storyGoals[state.storyStep] || null : sites.find(function (site) { return !state.discovered.includes(site.id); }) || null;
  }
  function nearby(state) {
    var goal = state.arrived && storyGoals[state.storyStep];
    if (goal && Math.hypot(state.x - goal.x, state.y - goal.y) < 64) return { kind: "story", value: goal };
    var site = sites.filter(function (s) { return Math.hypot(state.x - s.x, state.y - s.y) < 57; })
      .sort(function (a, b) { return Math.hypot(state.x - a.x, state.y - a.y) - Math.hypot(state.x - b.x, state.y - b.y); })[0];
    return site ? { kind: "site", value: site } : null;
  }
  function move(state, dx, dy) {
    var next = normalize(state), nx = next.x + dx, ny = next.y + dy;
    if (passable(nx - 10, next.y - 10) && passable(nx + 10, next.y + 10)) next.x = nx;
    if (passable(next.x - 10, ny - 10) && passable(next.x + 10, ny + 10)) next.y = ny;
    return next;
  }
  function route(state, target) {
    target = target || objective(state); if (!target) return [];
    var columns = Math.ceil(WIDTH / NAV), rows = Math.ceil(HEIGHT / NAV), key = function (x, y) { return y * columns + x; };
    var start = key(Math.floor(state.x / NAV), Math.floor(state.y / NAV));
    var end = key(Math.floor(target.x / NAV), Math.floor(target.y / NAV));
    var queue = [start], previous = new Map([[start, -1]]);
    for (var head = 0; head < queue.length && !previous.has(end); head++) {
      var at = queue[head], x = at % columns, y = Math.floor(at / columns);
      [[1,0],[0,1],[-1,0],[0,-1]].forEach(function (d) {
        var nx = x + d[0], ny = y + d[1], next = key(nx, ny);
        if (nx >= 0 && ny >= 0 && nx < columns && ny < rows && !previous.has(next) && passable((nx + .5) * NAV, (ny + .5) * NAV)) {
          previous.set(next, at); queue.push(next);
        }
      });
    }
    if (!previous.has(end)) return [];
    var result = []; for (var at = end; at !== -1; at = previous.get(at)) result.push({ x: (at % columns + .5) * NAV, y: (Math.floor(at / columns) + .5) * NAV });
    return result.reverse();
  }
  function interact(state) {
    var next = normalize(state), found = nearby(next);
    if (!found) return { state: next, title: "附近沒有互動目標", text: "走近地點或角色後再按 E。", changed: false };
    if (found.kind === "story") { next.storyStep++; return { state: next, title: found.value.title, text: found.value.text, changed: true, story: true }; }
    if (!next.discovered.includes(found.value.id)) next.discovered.push(found.value.id);
    return { state: next, title: found.value.name, text: found.value.text, changed: true, story: false };
  }
  function create(options) {
    var canvas = options.canvas, ctx = canvas.getContext("2d"), state = normalize(options.load());
    var active = false, pressed = new Set(), frame = 0, lastFrame = 0, lastSave = 0, routeKey = "", currentRoute = [], images = {}, sceneIndex = -1, lineIndex = 0;
    var characterArt = globalThis.StarshipExplorationCharacters, characterData = options.characterData || globalThis.StarshipGachaData || {};
    var extraActors = (options.actors || []).filter(function (actor) { return actor.id && Number.isFinite(actor.x) && Number.isFinite(actor.y); });
    function loadImage(id, source) { var image = new Image(); image.onload = function () { images[id] = image; draw(); }; image.src = source; }
    function loadCharacter(id, fallback) {
      if (characterArt && characterArt.load(id, characterData, function (image) { if (image) images[id] = image; draw(); })) return;
      if (fallback) loadImage(id, fallback);
    }
    var playerLoad;
    function setPlayer(id) {
      if (!characterArt || !characterArt.resolve(id, characterData)) return false;
      if (playerLoad) playerLoad.cancel();
      delete images.hero;
      playerLoad = characterArt.load(id, characterData, function (image) { if (image) images.hero = image; draw(); });
      return true;
    }
    loadImage("map", mapImage); Object.keys(spriteSources).forEach(function (id) { if (id !== "hero") loadCharacter(id, spriteSources[id]); });
    if (!setPlayer(options.playerId || "hero")) loadImage("hero", spriteSources.hero);
    extraActors.forEach(function (actor) { loadCharacter(actor.id); });
    function save() { options.save(state); }
    function sprite(id, x, y, height, flip, bob) {
      renderer.sprite(ctx, images[id], x, y, height, flip, bob);
    }
    function draw() {
      var view = renderer.begin(canvas, ctx, WIDTH, HEIGHT, state.x, state.y);
      ctx.fillStyle = "#315842"; ctx.fillRect(view.x, view.y, view.width, view.height);
      var ground=renderer.terrain('village',WIDTH,HEIGHT,passable,{image:mapImage,landmarks:sites});if(ground)ctx.drawImage(ground,0,0);
      var target = objective(state), key = Math.floor(state.x / NAV) + ":" + Math.floor(state.y / NAV) + ":" + (target ? target.id : "done");
      if (key !== routeKey) { currentRoute = route(state, target); routeKey = key; }
      if (target && currentRoute.length > 1) {
        ctx.beginPath(); ctx.moveTo(state.x, state.y);
        currentRoute.slice(1).forEach(function (point) { ctx.lineTo(point.x, point.y); });
        ctx.strokeStyle = "rgba(31,46,41,.7)"; ctx.lineWidth = 9; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.stroke();
        ctx.strokeStyle = "#f9d47c"; ctx.lineWidth = 5; ctx.setLineDash([5,11]); ctx.stroke(); ctx.setLineDash([]);
        ctx.strokeStyle = "#fff3c2"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(target.x, target.y, 19, 0, Math.PI * 2); ctx.stroke();
      }
      sites.forEach(function (site) {
        ctx.fillStyle = state.discovered.includes(site.id) ? "#f5cf75" : "#f8f0d5";
        ctx.beginPath(); ctx.arc(site.x, site.y, 7, 0, Math.PI * 2); ctx.fill();
      });
      sprite("reyn", 355, 399, 44, false, 0);
      sprite("isar", 1335, 467, 44, false, 0);
      sprite("lia", 1425, 472, 44, false, 0);
      extraActors.forEach(function (actor) { sprite(actor.id, actor.x, actor.y, actor.height || 78, false, 0); });
      ctx.fillStyle = "rgba(10,26,27,.4)"; ctx.beginPath(); ctx.ellipse(state.x, state.y + 10, 15, 6, 0, 0, Math.PI * 2); ctx.fill();
      sprite("hero", state.x, state.y, 44, pressed.has("left"), pressed.size ? Math.sin(performance.now() / 95) * 2 : 0);
      renderer.end(ctx);
      var near = nearby(state);
      options.position.textContent = "位置：" + (near ? near.value.name || near.value.title : "獸靈之村");
      options.discoveries.textContent = "已發現 " + state.discovered.length + " / " + sites.length;
      options.objective.textContent = target ? (state.arrived ? "主線目標：" + target.title : "自由探索：" + target.name) : (state.arrived ? "第一幕村莊劇情完成" : "村莊地點皆已發現");
      options.distance.textContent = target ? (currentRoute.length ? "沿金色路線前進 · 約 " + Math.max(0, currentRoute.length - 1) + " 步" : "目前找不到可走路線") : "可繼續自由探索";
      options.interact.hidden = sceneIndex >= 0 || !near;
      options.interact.disabled = options.interact.hidden;
      options.interact.textContent = near ? (near.kind === "story" ? "進入劇情對話 E" : "調查「" + near.value.name + "」 E") : "靠近地點後互動 E";
      options.read.hidden = !(state.arrived && state.storyStep >= storyGoals.length);
    }
    function tick(now) {
      if (!active) return;
      var dt = Math.min((now - (lastFrame || now)) / 1000, .05); lastFrame = now;
      var dx = Number(pressed.has("right")) - Number(pressed.has("left")), dy = Number(pressed.has("down")) - Number(pressed.has("up"));
      if (sceneIndex < 0 && (dx || dy)) {
        var len = Math.hypot(dx, dy), next = move(state, dx / len * dt * 190, dy / len * dt * 190);
        if(options.onExit&&((next.x<55&&next.y<420)||(next.y>865&&next.x<710))){state=next;save();options.onExit(next.x<55?"road":"south",next.x<55?1515:1480,next.x<55?455:895);return;}
        if (next.x !== state.x || next.y !== state.y) { state = next; if (now - lastSave > 800) { save(); lastSave = now; } }
      }
      draw(); frame = requestAnimationFrame(tick);
    }
    var artScenes=storyScenes.map(function(lines){return storyArt?storyArt.timeline("main-1-0",1,lines):[];});
    function showLine() {
      var line = storyScenes[sceneIndex][lineIndex];
      options.dialogTitle.textContent = line[0]; options.dialogText.textContent = line[1];
      if(storyArt)storyArt.show(options.dialog,artScenes[sceneIndex],lineIndex);
      if (characterArt) characterArt.speakerPortrait(options.dialog, line[0], characterData);
      options.dialogNext.textContent = lineIndex + 1 < storyScenes[sceneIndex].length ? "繼續 →" : "完成對話 ✓";
      options.dialog.hidden = false; options.dialogNext.focus({ preventScroll: true }); draw();
    }
    function nextLine() {
      if (sceneIndex < 0) return;
      if (++lineIndex < storyScenes[sceneIndex].length) { showLine(); return; }
      state.storyStep++; save(); sceneIndex = -1; options.dialog.hidden = true; if(storyArt)storyArt.clear(options.dialog);
      if (state.storyStep === storyGoals.length && options.onStoryComplete) options.onStoryComplete();
      options.status.textContent = state.storyStep >= storyGoals.length ? "第一幕已在獸靈之村完成。你可以繼續自由探索。" : "劇情對話完成。沿金色路線前往下一個人物。";
      draw(); canvas.focus({ preventScroll: true });
    }
    function doInteract() {
      if (sceneIndex >= 0) return;
      var found = nearby(state); if (!found) return;
      if (found.kind === "story") { sceneIndex = state.storyStep; lineIndex = 0; pressed.clear(); showLine(); return; }
      var result = interact(state); state = result.state; if (result.changed) save(); options.status.textContent = result.title + "｜" + result.text; draw();
    }
    function onKey(e, down) {
      if (!active || options.panel.hidden) return;
      if(storyArt&&storyArt.isZoomed())return;
      if (sceneIndex >= 0) { if (down && (e.code === "Enter" || e.code === "Space" || e.code === "KeyE") && !e.repeat) { e.preventDefault(); nextLine(); } return; }
      var keys = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
      if (keys[e.code] && !(e.target instanceof HTMLInputElement) && !(e.target.closest && e.target.closest('select,textarea'))) { e.preventDefault(); if (down) pressed.add(keys[e.code]); else pressed.delete(keys[e.code]); }
      if (down && e.code === "KeyE" && !e.repeat) { e.preventDefault(); doInteract(); }
    }
    window.addEventListener("keydown", function (e) { onKey(e, true); }); window.addEventListener("keyup", function (e) { onKey(e, false); });
    window.addEventListener("blur", function () { pressed.clear(); });
    options.interact.addEventListener("click", doInteract);
    options.dialogNext.addEventListener("click", nextLine);
    options.reset.addEventListener("click", function () { state.x = state.arrived ? 1518 : 841; state.y = state.arrived ? 216 : 453; state.discovered = []; save(); options.status.textContent = "已重設位置與自由探索紀錄；主線對話進度保留。"; draw(); });
    options.pad.querySelectorAll("[data-move]").forEach(function (button) {
      function release(e) { pressed.delete(button.dataset.move); if (e.pointerId !== undefined && button.hasPointerCapture(e.pointerId)) button.releasePointerCapture(e.pointerId); }
      button.addEventListener("pointerdown", function (e) { e.preventDefault(); pressed.add(button.dataset.move); button.setPointerCapture(e.pointerId); });
      button.addEventListener("pointerup", release); button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", function () { pressed.delete(button.dataset.move); });
    });
    draw();
    return { open: function () { active = true; lastFrame = 0; draw(); frame = requestAnimationFrame(tick); canvas.focus({ preventScroll: true }); },
      close: function () { active = false; pressed.clear(); sceneIndex = -1; options.dialog.hidden = true; if(storyArt)storyArt.clear(options.dialog); cancelAnimationFrame(frame); save(); },
      reload: function () { state = normalize(options.load()); draw(); },
      enterStory: function () { state.arrived = true; if (state.storyStep === 0) { state.x = 1518; state.y = 216; } save(); draw(); },
      setPlayer: setPlayer, state: function () { return normalize(state); } };
  }
  return { WIDTH: WIDTH, HEIGHT: HEIGHT, NAV: NAV, mapImage: mapImage, spriteSources: spriteSources, paths: paths, sites: sites, storyGoals: storyGoals, storyScenes: storyScenes,
    passable: passable, initial: initial, normalize: normalize, objective: objective, nearby: nearby, move: move, route: route, interact: interact, create: create };
}));
