const test = require("node:test");
const assert = require("node:assert/strict");
const { create, chunks } = require("../src/story-narration.js");

function fixture() {
  const spoken = [];
  const available = [{ lang: "en-US", voiceURI: "en" }, { lang: "zh-CN", voiceURI: "cn" }, { lang: "zh-TW", voiceURI: "tw" }];
  const calls = { cancel: 0, pause: 0, resume: 0 };
  const synth = { getVoices: () => available, cancel: () => calls.cancel++, pause: () => calls.pause++, resume: () => calls.resume++, speak: (item) => spoken.push(item) };
  const player = create({ synth, Utterance: function (text) { this.text = text; } });
  return { player, spoken, calls, available };
}

test("long prose keeps all text and punctuation in bounded Unicode chunks", () => {
  const text = "瑟蕾雅望向森林。\n" + "星🌟".repeat(180) + "！？";
  const parts = chunks(text);
  assert.equal(parts.join(""), text.replace(/\n/g, ""));
  assert.ok(parts.every((part) => Array.from(part).length <= 100));
});

test("uses Chinese voices, prefers Taiwan, advances and finishes", () => {
  const { player, spoken } = fixture();
  assert.deepEqual(player.voices().map((voice) => voice.voiceURI), ["tw", "cn"]);
  player.play("1.0:0", "第一句。第二句。", "", 1.15);
  assert.equal(spoken[0].voice.voiceURI, "tw");
  assert.equal(spoken[0].rate, 1.15);
  spoken[0].onend();
  assert.equal(spoken.length, 2);
  spoken[1].onend();
  assert.equal(player.getState().status, "ended");
});

test("cancelled utterance events cannot restart an old chapter", () => {
  const { player, spoken } = fixture();
  player.play("1.0:0", "舊段。後段。", "cn", 1);
  const old = spoken[0];
  player.play("1.1:0", "新段。", "tw", 1);
  old.onend();
  old.onerror({ error: "canceled" });
  assert.equal(spoken.length, 2);
  assert.equal(player.getState().key, "1.1:0");
  assert.equal(player.getState().status, "playing");
  player.stop();
  spoken[1].onend();
  assert.equal(spoken.length, 2);
  assert.equal(player.getState().status, "idle");
});

test("pausing at a segment boundary waits for resume", () => {
  const { player, spoken, calls } = fixture();
  player.play("1.1:0", "第一句。第二句。", "tw", 1);
  player.togglePause();
  spoken[0].onend();
  assert.equal(spoken.length, 1);
  assert.equal(player.getState().status, "paused");
  player.togglePause();
  assert.equal(spoken.length, 2);
  assert.equal(player.getState().status, "playing");
  assert.equal(calls.pause, 1);
});

test("missing voices and speech errors produce recoverable states", () => {
  const { player, spoken, available } = fixture();
  available.length = 0;
  player.play("1.0:0", "正文。", "", 1);
  assert.equal(player.getState().status, "error");
  assert.equal(spoken.length, 0);
  available.push({ lang: "zh-TW", voiceURI: "tw" });
  player.play("1.0:0", "正文。", "tw", 1);
  spoken[0].onerror({ error: "not-allowed" });
  assert.match(player.getState().message, /再按一次/);
});

test("unsupported browser stays safe when stopping", () => {
  const player = create({});
  assert.equal(player.supported, false);
  player.stop();
  assert.deepEqual(player.voices(), []);
});
