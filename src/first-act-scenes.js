(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./story-1-0-current.js"));
  else root.StarshipFirstActScenes = factory(root.StarshipStory10Current);
}(typeof globalThis !== "undefined" ? globalThis : this, function (story) {
  "use strict";
  // Keep the published act intact. Destinations divide it into playable scenes.
  var paragraphs = story.scenes[0].body.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean);
  var starts = [
    "【場景：南驛山谷", "炭筆收進皮套", "第三步落下", "她只知道那頭獸",
    "【場景：獸靈之村外・陌生森林", "順水走", "「別再走。",
    "【場景：獸靈之村外・通村林道", "林道窄", "【場景：獸靈之村・醫療屋", "莉亞重新處理傷口"
  ];
  var speakers = {
    "這樣的路圖": "瑟蕾雅", "這邊。": "瑟蕾雅", "圖……": "瑟蕾雅",
    "別再走。": "雷恩", "如果你是在提醒": "瑟蕾雅", "前面是村道": "雷恩", "所以危險": "瑟蕾雅",
    "如果你肯指": "瑟蕾雅", "我迷路了": "瑟蕾雅", "雷恩？": "莉亞", "妳會暈嗎": "莉亞", "那就先坐下": "莉亞",
    "會痛。": "莉亞", "妳可以早一點": "瑟蕾雅", "早一點說": "莉亞", "傷口得再清理": "莉亞",
    "村長還不知道": "雷恩", "所以我們帶她": "莉亞", "劍先交給": "莉亞", "到了就放在": "雷恩",
    "能站得住": "伊薩爾", "想喝水": "伊薩爾", "水。謝謝": "瑟蕾雅", "你見過": "瑟蕾雅",
    "多年前有過": "伊薩爾", "那這裡離": "瑟蕾雅", "如果會給": "瑟蕾雅", "今晚住這裡": "伊薩爾",
    "妳的遭遇": "伊薩爾", "沒有帶路": "伊薩爾", "多少？": "瑟蕾雅", "什麼多少": "莉亞",
    "晚飯，還有": "瑟蕾雅", "先吃。": "莉亞", "我可以付": "瑟蕾雅", "我知道。": "莉亞", "明天再談": "莉亞"
  };
  function speaker(text) {
    var key = Object.keys(speakers).find(function (key) { return text.startsWith(key); });
    return key ? speakers[key] : "旁白";
  }
  function lines(paragraph) {
    var result = [], parts = paragraph.match(/「[^」]*」|[^「]+/g) || [paragraph];
    parts.forEach(function (part) {
      if (part.startsWith("「")) { result.push([speaker(part.slice(1)), part]); return; }
      // Short narration cards retain every sentence of the source.
      var sentences = part.match(/[^。！？]+[。！？]?|[。！？]/g) || [part], buffer = "";
      sentences.forEach(function (sentence) {
        if (buffer && buffer.length + sentence.length > 100) { result.push(["旁白", buffer]); buffer = ""; }
        buffer += sentence;
      });
      if (buffer.trim()) result.push(["旁白", buffer]);
    });
    return result;
  }
  var boundaries = starts.map(function (anchor) {
    var index = paragraphs.findIndex(function (p) { return p.startsWith(anchor); });
    if (index < 0) throw new Error("Missing first-act scene anchor: " + anchor);
    return index;
  });
  var scenes = boundaries.map(function (start, index) {
    return paragraphs.slice(start, boundaries[index + 1] === undefined ? paragraphs.length : boundaries[index + 1]).flatMap(lines);
  });
  return { approach: scenes.slice(0, 9), village: scenes.slice(9), all: scenes };
}));
