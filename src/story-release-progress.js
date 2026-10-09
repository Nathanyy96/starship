(function (root, factory) {
  var api = factory(typeof require === "function" ? require("./story-1-1-missions.js") : root.StarshipStory11Missions,
    typeof require === "function" ? require("./release-config.js") : root.StarshipReleaseConfig);
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.StarshipStoryReleaseProgress = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function (missions, release) {
  "use strict";
  function progress(state) { return missions.normalize(state.storyProgress && state.storyProgress.missions11); }
  function unlocked(state, chapter, index) {
    var s = state.storyProgress || {}, done = s.completedScenes || {};
    if (chapter.id !== "main-1-1") return index === 0 || Boolean(done[chapter.id + ":" + chapter.scenes[index - 1].id]);
    return Boolean(s.claimedVersions && s.claimedVersions["1.0"]) && progress(state).act >= index &&
      (index === 0 || Boolean(done[chapter.id + ":" + chapter.scenes[index - 1].id]));
  }
  function apply(input, chapter, body) {
    if (chapter.id === "main-1-0") return apply10(input, chapter, body);
    if (!release.open11 || chapter.id !== "main-1-1" || chapter.releaseOpen === false) throw new Error("1.1 尚未開放。");
    var state = JSON.parse(JSON.stringify(input)), s = state.storyProgress || (state.storyProgress = {});
    s.completedScenes = s.completedScenes || {}; s.claimedVersions = s.claimedVersions || {};
    var reward = { starSand: 0, characterExp: 0, starMarks: 0 }, p = progress(state), result = { state: state, reward: reward, alreadyClaimed: false, feedback: "" };
    var index = chapter.scenes.findIndex(function (scene) { return scene.id === body.sceneId; });
    if (index < 0) throw new Error("找不到劇情幕次。");
    if (!unlocked(state, chapter, index)) throw new Error("請先完成前一幕閱讀與互動；1.1 需先完成 1.0。");
    var key = chapter.id + ":" + body.sceneId;
    s.currentChapter = chapter.id;
    if (body.action === "answer") {
      if (!s.completedScenes[key]) throw new Error("請先標記本幕已讀完，再進行互動。");
      if (!Number.isInteger(body.act) || !Number.isInteger(body.step)) throw new Error("互動位置已變更，請重新載入。");
      if (body.act < p.act || (body.act === p.act && body.step < p.step)) {
        result.alreadyClaimed = true; result.feedback = "這一步已完成，已保留目前進度。"; return result;
      }
      if (body.act !== index || body.act !== p.act || body.step !== p.step) throw new Error("互動位置已變更，請重新載入。");
      var advanced = missions.advance(p, body.choice);
      s.missions11 = advanced.progress; result.correct = advanced.correct; result.feedback = advanced.feedback;
    } else if (body.action === "claim") {
      if (index !== chapter.scenes.length - 1 || p.act !== missions.acts.length || !chapter.scenes.every(function (scene) { return s.completedScenes[chapter.id + ":" + scene.id]; })) throw new Error("請先完成五幕閱讀與全部互動。");
      if (s.claimedVersions["1.1"]) { result.alreadyClaimed = true; return result; }
      Object.keys(reward).forEach(function (name) { reward[name] = release.story11Reward[name]; state.resources[name] += reward[name]; });
      s.claimedVersions["1.1"] = { claimedAt: new Date().toISOString(), reward: Object.assign({}, reward) };
    } else if (body.action === "complete") {
      result.alreadyClaimed = Boolean(s.completedScenes[key]);
      if (!result.alreadyClaimed) s.completedScenes[key] = { completedAt: new Date().toISOString(), starSand: 0, characterExp: 0 };
    } else throw new Error("找不到劇情操作。");
    return result;
  }
  function apply10(input, chapter, body) {
    if (chapter.releaseOpen === false || body.action !== "complete") throw new Error("找不到劇情操作。");
    var state = JSON.parse(JSON.stringify(input)), s = state.storyProgress;
    s.completedScenes = s.completedScenes || {}; s.claimedVersions = s.claimedVersions || {};
    var index = chapter.scenes.findIndex(function (scene) { return scene.id === body.sceneId; });
    if (index < 0) throw new Error("找不到劇情幕次。");
    var key = chapter.id + ":" + body.sceneId, wasCompleted = Boolean(s.completedScenes[key]);
    s.currentChapter = chapter.id;
    if (!wasCompleted) s.completedScenes[key] = { completedAt: new Date().toISOString(), starSand: 0, characterExp: 0 };
    var reward = { starSand: 0, characterExp: 0, starMarks: 0 };
    if (index === chapter.scenes.length - 1 && !s.claimedVersions["1.0"]) {
      if (!chapter.scenes.every(function (scene) { return s.completedScenes[chapter.id + ":" + scene.id]; })) throw new Error("請先讀完前四幕。");
      var oldClaims = Object.keys(s.completedScenes).filter(function (k) { return k.indexOf("main-1-0:") === 0; });
      reward.starSand = Math.max(0, 1600 - oldClaims.reduce(function (sum, k) { return sum + Math.max(0, Number(s.completedScenes[k].starSand) || 0); }, 0));
      reward.characterExp = Math.max(0, 3600 - oldClaims.reduce(function (sum, k) { return sum + Math.max(0, Number(s.completedScenes[k].characterExp) || 0); }, 0));
      reward.starMarks = 1;
      Object.keys(reward).forEach(function (name) { state.resources[name] += reward[name]; });
      s.claimedVersions["1.0"] = { claimedAt: new Date().toISOString(), reward: Object.assign({}, reward) };
    }
    if (s.claimedVersions["1.0"] && !state.recruitment.story10ChoiceClaimed) state.recruitment.story10ChoiceAvailable = true;
    return { state: state, reward: reward, alreadyClaimed: wasCompleted && !Object.keys(reward).some(function (name) { return reward[name] > 0; }) };
  }
  return { progress: progress, unlocked: unlocked, apply: apply };
}));
