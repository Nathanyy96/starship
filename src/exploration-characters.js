(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StarshipExplorationCharacters = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var aliases = { hero: "celesia" };
  var existing = { celesia: "hero", lia: "lia", reyn: "reyn", isar: "isar" };
  function catalog(data) {
    data = data || {};
    var result = {};
    Object.keys(data.storyCharacters || {}).forEach(function (id) { var x = data.storyCharacters[id]; result[id] = { id: id, name: x.name, original: x.portrait, kind: "story" }; });
    Object.keys(data.cards || {}).forEach(function (id) { var x = data.cards[id]; result[id] = { id: id, name: x.name, original: x.image || x.backgroundImage, kind: "playable" }; });
    Object.keys(result).forEach(function (id) { result[id].chibi = "./assets/exploration/" + (existing[id] || id) + "-chibi-v1.png"; });
    return result;
  }
  function resolve(id, data, originalOverride) {
    id = aliases[id] || id;
    var entry = catalog(data)[id];
    if (!entry) return null;
    return Object.assign({}, entry, { sources: originalOverride && originalOverride !== entry.original
      ? [{ url: originalOverride, kind: "original" }]
      : [{ url: entry.chibi, kind: "chibi" }, { url: entry.original, kind: "original" }].filter(function (x) { return x.url; }) });
  }
  function byName(name, data) {
    return Object.values(catalog(data)).find(function (entry) { return entry.name === name || entry.id === name; }) || null;
  }
  function load(id, data, onReady, options) {
    options = options || {};
    var entry = resolve(id, data, options.originalOverride);
    if (!entry) return null;
    var ImageType = options.ImageClass || (typeof Image !== "undefined" && Image);
    if (!ImageType) return entry;
    var stopped = false, index = 0;
    function next() {
      if (stopped) return;
      if (index >= entry.sources.length) { onReady(null, Object.assign({}, entry, { displayKind: "missing" })); return; }
      var source = entry.sources[index++], img = new ImageType();
      img.onload = function () { if (!stopped) onReady(img, Object.assign({}, entry, { displayKind: source.kind, loadedSource: source.url })); };
      img.onerror = next; img.src = source.url;
    }
    next();
    return { entry: entry, cancel: function () { stopped = true; } };
  }
  function speakerPortrait(panel, name, data) {
    var doc = panel.ownerDocument, entry = byName(name, data), img = panel.querySelector(".world-dialog-portrait");
    if (!img) { img = doc.createElement("img"); img.className = "world-dialog-portrait"; panel.insertBefore(img, panel.firstChild); }
    if (panel._portraitLoad) panel._portraitLoad.cancel();
    panel.classList.remove("has-world-portrait");
    img.hidden = true; img.removeAttribute("src");
    if (!entry) return;
    img.alt = entry.name;
    panel._portraitLoad = load(entry.id, data, function (loaded, meta) {
      if (!loaded) return;
      img.src = meta.loadedSource; img.hidden = false;
      panel.classList.add("has-world-portrait");
      img.dataset.displayKind = meta.displayKind;
    });
  }
  return { catalog: catalog, resolve: resolve, byName: byName, load: load, speakerPortrait: speakerPortrait };
}));
