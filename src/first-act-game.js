(function (root, factory) {
  var api = factory(typeof module === "object" && module.exports ? require("./first-act-scenes.js") : root.StarshipFirstActScenes);
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipFirstActGame = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (dialogue) {
  "use strict";
  var TILE = 32, W = 36, H = 24;
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
    { zone: "valley", x: 25, y: 14, title: "引開巨獸", prompt: "繞過斷柱，把巨獸帶離谷口石路。", text: "她敲響石柱引牠轉身，利用斷柱擋住衝勢。鬆動的階角只被星光定住一瞬，腳下的空氣隨後向內凹去。", nextZone: "forest", spawn: [5.5, 17.5] },
    { zone: "forest", x: 7, y: 17, title: "確認傷勢", prompt: "在位移落點檢查傷口和背包。", text: "她醒在陌生森林。最後一張路圖不見了，指南針的指針卡住，左臂傷口仍在滲血。" },
    { zone: "forest", x: 17, y: 14, title: "沿水聲尋路", prompt: "循水聲穿過林地。", text: "附近的細葉灌木與圓石都不在她熟悉的路上。順水走，總比站著等天黑好。" },
    { zone: "forest", x: 26, y: 10, title: "遇見雷恩", prompt: "靠近巡林者雷恩，停下腳步。", text: "一支箭落在鞋尖前。雷恩守著通村林道，先請陌生的瑟蕾雅不要再往前走。" },
    { zone: "forest", x: 29, y: 12, title: "接受莉亞包紮", prompt: "到莉亞身邊處理傷口。", text: "莉亞看見滲血的布條，先問她會不會暈，再清洗傷口、挑出碎砂。疼痛沒有因星光而消失。" },
    { zone: "forest", x: 32, y: 7, title: "跟隨林道", prompt: "和雷恩、莉亞沿林道前往村子。", text: "雷恩在前方撥開細枝，莉亞放慢腳步陪她走。轉過最後一道彎，煙味和燈光從村裡傳來。" }
  ];
  var scenes = dialogue.approach;
  var zoneNames = { valley: "南驛山谷・舊祭壇", forest: "獸靈之村外・林道", village: "獸靈之村・醫療屋" };
  function initial() { return { index: 0, zone: "valley", x: 15.5, y: 16.5 }; }
  function terrain(zone, x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H || x === 0 || y === 0 || x === W - 1 || y === H - 1) return "wall";
    if (zone === "valley") {
      if (y < 4 || (x > 29 && y < 8) || (x >= 18 && x <= 19 && y >= 5 && y <= 7) || (x >= 12 && x <= 13 && y >= 12 && y <= 14)) return "stone";
      return (Math.abs(y - (16 - Math.round(x / 5))) < 3 || (x >= 15 && x <= 27 && y >= 8 && y <= 17)) ? "path" : "sand";
    }
    if (zone === "forest") {
      if (y >= 19 && x >= 11 && x <= 26) return "water";
      if ((x < 7 && y < 10) || (x > 30 && y > 15) || ((x * 17 + y * 11) % 29 === 0)) return "tree";
      return Math.abs(y - (19 - Math.round(x / 3))) < 3 ? "path" : "grass";
    }
    if ((x >= 17 && x <= 20 && y >= 4 && y <= 8) || (x >= 28 && x <= 32 && y >= 5 && y <= 9) || (x >= 9 && x <= 13 && y >= 5 && y <= 8)) return "building";
    if (y > 19 && x > 16) return "water";
    return (y >= 10 && y <= 18) || (x >= 20 && x <= 26) ? "path" : "grass";
  }
  function passable(zone, x, y) { return ["path", "sand", "grass"].includes(terrain(zone, Math.floor(x), Math.floor(y))); }
  function normalize(raw) {
    var index = Math.max(0, Math.min(steps.length, Math.floor(Number(raw && raw.index) || 0)));
    var expected = index < steps.length ? steps[index].zone : "forest";
    var zone = raw && raw.zone === expected ? expected : expected;
    var spawn = zone === "valley" ? [15.5, 16.5] : [5.5, 17.5];
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
    var active = false, held = new Set(), frame = 0, previous = 0, lastSave = 0, routeKey = "", currentRoute = [], art = {}, sceneIndex = -1, lineIndex = 0;
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
    function save() { options.save(state); }
    function sprite(id, x, y, height, flip, bob) {
      var img = art[id]; if (!img) return false;
      var width = height * img.naturalWidth / img.naturalHeight;
      ctx.save(); ctx.translate(x, y); if (flip) ctx.scale(-1, 1);
      ctx.drawImage(img, -width / 2, -height + 12 + bob, width, height); ctx.restore(); return true;
    }
    function draw() {
      var viewW = canvas.width, viewH = canvas.height;
      var cameraX = Math.max(0, Math.min(W * TILE - viewW, state.x * TILE - viewW / 2));
      var cameraY = Math.max(0, Math.min(H * TILE - viewH, state.y * TILE - viewH / 2));
      ctx.setTransform(1, 0, 0, 1, -cameraX, -cameraY);
      for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
        var kind = terrain(state.zone, x, y), px = x * TILE, py = y * TILE;
        ctx.fillStyle = { wall: "#3b4d4b", stone: "#656761", path: "#b9a37c", sand: "#947f69", water: "#3b8290", tree: "#245342", grass: "#3b7759", building: "#796353" }[kind]; ctx.fillRect(px, py, TILE + 1, TILE + 1);
        if (kind === "grass" && (x + y * 3) % 5 === 0) { ctx.fillStyle = "#75a06b"; ctx.fillRect(px + 8, py + 10, 3, 5); }
        if (kind === "tree") { ctx.fillStyle = "#36745a"; ctx.beginPath(); ctx.arc(px + 16, py + 16, 13, 0, Math.PI * 2); ctx.fill(); }
        if (kind === "water") { ctx.fillStyle = "#8dbfc0"; ctx.fillRect(px + 6, py + 10, 13, 2); }
        if (kind === "stone" && (x + y) % 3 === 0) { ctx.fillStyle = "#83847d"; ctx.fillRect(px + 4, py + 7, 20, 4); }
        if (kind === "building") { ctx.fillStyle = "#ba9570"; ctx.fillRect(px + 3, py + 3, 26, 26); }
      }
      if (state.zone === "valley" && state.index >= 2 && state.index <= 3) {
        ctx.fillStyle = "rgba(163,179,252,.6)"; ctx.beginPath(); ctx.ellipse(22.5 * TILE, 8.5 * TILE, 16, 40, -.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#2b283b"; ctx.beginPath(); ctx.ellipse(26 * TILE, 10 * TILE, 30, 22, 0, 0, Math.PI * 2); ctx.fill();
      }
      var step = steps[state.index], nextKey = state.zone + ":" + Math.floor(state.x) + ":" + Math.floor(state.y) + ":" + state.index;
      if (nextKey !== routeKey) { currentRoute = route(state); routeKey = nextKey; }
      if (currentRoute.length > 1) {
        ctx.beginPath(); ctx.moveTo(state.x * TILE, state.y * TILE);
        currentRoute.slice(1).forEach(function (p) { ctx.lineTo((p[0] + .5) * TILE, (p[1] + .5) * TILE); });
        ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "rgba(29,43,44,.7)"; ctx.stroke();
        ctx.lineWidth = 4; ctx.strokeStyle = "#f5d486"; ctx.setLineDash([5, 8]); ctx.stroke(); ctx.setLineDash([]);
      }
      if (state.zone === "forest") { sprite("reyn", 26.5 * TILE, 10.5 * TILE, 68, false, 0); sprite("lia", 29.5 * TILE, 12.5 * TILE, 68, false, 0); }
      if (state.zone === "village") { sprite("isar", 22.5 * TILE, 10.5 * TILE, 72, false, 0); sprite("lia", 26.5 * TILE, 12.5 * TILE, 64, false, 0); sprite("reyn", 29.5 * TILE, 13.5 * TILE, 64, false, 0); }
      extraActors.forEach(function (actor) { if (!actor.zone || actor.zone === state.zone) sprite(actor.id, actor.x, actor.y, actor.height || 70, false, 0); });
      if (step) {
        var tx = (step.x + .5) * TILE, ty = (step.y + .5) * TILE;
        ctx.strokeStyle = "#fff2c2"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(tx, ty, 13, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = "#fff8e7"; ctx.font = "bold 13px system-ui"; ctx.textAlign = "center"; ctx.fillText(step.title, tx, ty - 18);
      }
      var px = state.x * TILE, py = state.y * TILE;
      ctx.fillStyle = "rgba(15,33,36,.35)"; ctx.beginPath(); ctx.ellipse(px, py + 11, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
      if (!sprite("hero", px, py, 70, held.has("left"), held.size ? Math.sin(performance.now() / 90) * 2 : 0)) { ctx.fillStyle = "#eee5dc"; ctx.beginPath(); ctx.arc(px, py - 3, 9, 0, Math.PI * 2); ctx.fill(); }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      options.zone.textContent = zoneNames[state.zone];
      options.objective.textContent = step ? step.prompt : "林道已走完，現在可以進入獸靈之村自由探索。";
      options.distance.textContent = step ? (currentRoute.length ? "沿金色路線前進 · 約 " + Math.max(0, currentRoute.length - 1) + " 步" : "請返回可通行道路") : "已抵達第一幕結尾";
      options.interact.hidden = sceneIndex >= 0 || !step || Math.hypot(state.x - (step.x + .5), state.y - (step.y + .5)) >= 2.2;
      options.interact.disabled = options.interact.hidden;
      options.interact.textContent = step ? "進入劇情對話 E" : "本幕路線完成";
      options.enter.hidden = state.index < steps.length;
    }
    function tick(now) {
      if (!active) return;
      var dt = Math.min((now - (previous || now)) / 1000, .05); previous = now;
      var dx = Number(held.has("right")) - Number(held.has("left")), dy = Number(held.has("down")) - Number(held.has("up"));
      if (sceneIndex < 0 && (dx || dy)) {
        var len = Math.hypot(dx, dy), nx = state.x + dx / len * dt * 4, ny = state.y + dy / len * dt * 4;
        if (passable(state.zone, nx - .22, state.y - .22) && passable(state.zone, nx + .22, state.y + .22)) state.x = nx;
        if (passable(state.zone, state.x - .22, ny - .22) && passable(state.zone, state.x + .22, ny + .22)) state.y = ny;
        if (now - lastSave > 800) { save(); lastSave = now; }
      }
      draw(); frame = requestAnimationFrame(tick);
    }
    function showLine() {
      var line = scenes[sceneIndex][lineIndex];
      options.dialogTitle.textContent = line[0]; options.dialogText.textContent = line[1];
      if (characterArt) characterArt.speakerPortrait(options.dialog, line[0], characterData);
      options.dialogNext.textContent = lineIndex + 1 < scenes[sceneIndex].length ? "繼續 →" : "完成對話 ✓";
      options.dialog.hidden = false; options.dialogNext.focus({ preventScroll: true }); draw();
    }
    function interact() {
      var step = steps[state.index];
      if (sceneIndex >= 0 || !step || Math.hypot(state.x - (step.x + .5), state.y - (step.y + .5)) >= 2.2) return;
      sceneIndex = state.index; lineIndex = 0; held.clear(); showLine();
    }
    function nextLine() {
      if (sceneIndex < 0) return;
      if (++lineIndex < scenes[sceneIndex].length) { showLine(); return; }
      var result = advance(state); state = result.state; save(); sceneIndex = -1;
      options.dialog.hidden = true; draw(); canvas.focus({ preventScroll: true });
    }
    function onKey(e, down) {
      if (!active || options.panel.hidden) return;
      if (sceneIndex >= 0) { if (down && (e.code === "Enter" || e.code === "Space" || e.code === "KeyE") && !e.repeat) { e.preventDefault(); nextLine(); } return; }
      var keys = { ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left", ArrowRight: "right", KeyD: "right" };
      if (keys[e.code] && !(e.target instanceof HTMLInputElement)) { e.preventDefault(); if (down) held.add(keys[e.code]); else held.delete(keys[e.code]); }
      if (down && e.code === "KeyE" && !e.repeat) { e.preventDefault(); interact(); }
    }
    window.addEventListener("keydown", function (e) { onKey(e, true); }); window.addEventListener("keyup", function (e) { onKey(e, false); });
    window.addEventListener("blur", function () { held.clear(); });
    options.interact.addEventListener("click", interact);
    options.dialogNext.addEventListener("click", nextLine);
    options.reset.addEventListener("click", function () { state = initial(); sceneIndex = -1; save(); if (options.onRestart) options.onRestart(); options.dialog.hidden = true; draw(); canvas.focus({ preventScroll: true }); });
    options.pad.querySelectorAll("[data-act-move]").forEach(function (button) {
      function release(e) { held.delete(button.dataset.actMove); if (e.pointerId !== undefined && button.hasPointerCapture(e.pointerId)) button.releasePointerCapture(e.pointerId); }
      button.addEventListener("pointerdown", function (e) { e.preventDefault(); held.add(button.dataset.actMove); button.setPointerCapture(e.pointerId); });
      button.addEventListener("pointerup", release); button.addEventListener("pointercancel", release); button.addEventListener("lostpointercapture", function () { held.delete(button.dataset.actMove); });
    });
    draw();
    return { open: function () { state = normalize(options.load()); active = true; previous = 0; draw(); frame = requestAnimationFrame(tick); canvas.focus({ preventScroll: true }); },
      close: function () { active = false; held.clear(); sceneIndex = -1; options.dialog.hidden = true; cancelAnimationFrame(frame); save(); }, setPlayer: setPlayer, state: function () { return normalize(state); } };
  }
  return { steps: steps, scenes: scenes, sprites: sprites, zoneNames: zoneNames, initial: initial, terrain: terrain, passable: passable, normalize: normalize, route: route, advance: advance, create: create };
}));
