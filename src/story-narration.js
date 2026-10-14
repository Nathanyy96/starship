(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StarshipStoryNarration = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Queue short utterances: browser speech engines often truncate long chapters.
  function chunks(text) {
    var result = [];
    var sentences = String(text || "").replace(/\r/g, "").match(/[^。！？!?；;\n]+[。！？!?；;\n]*|[。！？!?；;]+/g) || [];
    sentences.forEach(function (sentence) {
      var characters = Array.from(sentence.trim());
      while (characters.length) result.push(characters.splice(0, 100).join(""));
    });
    return result;
  }

  function create(options) {
    var synth = options.synth;
    var Utterance = options.Utterance;
    var generation = 0;
    var queue = [];
    var utterance = null;
    var voice = null;
    var rate = 1;
    var state = { key: "", status: "idle", index: 0, total: 0, message: "" };
    function notify() { if (options.onChange) options.onChange(Object.assign({}, state)); }
    function voices() {
      return synth && Utterance ? synth.getVoices().filter(function (item) { return /^zh(?:[-_]|$)/i.test(item.lang); }).sort(function (a, b) {
        return Number(/^zh[-_]TW$/i.test(b.lang)) - Number(/^zh[-_]TW$/i.test(a.lang));
      }) : [];
    }
    function stop() {
      generation += 1;
      queue = [];
      utterance = null;
      state = { key: "", status: "idle", index: 0, total: 0, message: "" };
      if (synth && Utterance) synth.cancel();
      notify();
    }
    function fail(message) { state.status = "error"; state.message = message; utterance = null; notify(); }
    function speakNext(token) {
      if (token !== generation) return;
      if (state.index >= queue.length) { state.status = "ended"; utterance = null; notify(); return; }
      utterance = new Utterance(queue[state.index]);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = rate;
      utterance.onend = function () {
        if (token !== generation) return;
        state.index += 1;
        if (state.status === "paused") { utterance = null; notify(); return; }
        speakNext(token);
      };
      utterance.onerror = function (event) {
        if (token !== generation) return;
        fail(event.error === "not-allowed" ? "瀏覽器未允許朗讀，請再按一次語音。" : "朗讀中斷，請重新播放或更換中文聲音。");
      };
      notify();
      try { synth.speak(utterance); } catch (error) { fail("無法啟動朗讀，請重新播放或更換瀏覽器。"); }
    }
    function play(key, text, selectedVoice, selectedRate) {
      stop();
      state.key = key;
      voice = voices().find(function (item) { return item.voiceURI === selectedVoice; }) || voices()[0];
      if (!voice) { fail("未找到中文聲音，請在裝置安裝中文語音或更換瀏覽器。"); return; }
      queue = chunks(text);
      if (!queue.length) { fail("本幕尚無可朗讀的正文。"); return; }
      rate = Math.min(1.5, Math.max(0.75, Number(selectedRate) || 1));
      state.total = queue.length;
      state.status = "playing";
      // Some engines stay paused after cancel(); explicitly release that state.
      synth.resume();
      speakNext(generation);
    }
    function togglePause() {
      if (state.status === "playing") { state.status = "paused"; synth.pause(); notify(); }
      else if (state.status === "paused") {
        state.status = "playing";
        synth.resume();
        if (!utterance) speakNext(generation); else notify();
      }
    }
    return { play: play, stop: stop, togglePause: togglePause, voices: voices, getState: function () { return Object.assign({}, state); }, supported: Boolean(synth && Utterance) };
  }
  return { create: create, chunks: chunks };
}));
