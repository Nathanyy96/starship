(function (root) {
  "use strict";
  var current, busy = false, feedback = "", openScenes = {};
  function escape(value) { return String(value == null ? "" : value).replace(/[&<>"']/g, function (s) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[s]; }); }
  function render(config) {
    if (current && current.chapter.id !== config.chapter.id) feedback = "";
    current = config;
    var chapter = config.chapter, state = config.state, progress = state.storyProgress, workflow = root.StarshipStoryReleaseProgress;
    var missions = root.StarshipStory11Missions, p = workflow.progress(state), is11 = chapter.id === "main-1-1";
    var claimed = Boolean(progress.claimedVersions[is11 ? "1.1" : "1.0"]);
    function button(label, action, scene, disabled, choice) {
      return '<button type="button" class="primary-action" data-live-action="' + action + '" data-live-scene="' + escape(scene.id) + '"' +
        (choice == null ? "" : ' data-live-choice="' + choice + '" data-live-act="' + p.act + '" data-live-step="' + p.step + '"') +
        (busy || disabled ? " disabled" : "") + '>' + escape(label) + "</button>";
    }
    config.container.innerHTML = '<section class="released-story-reader"><h3>' + escape(chapter.version + "｜" + chapter.title) + '</h3><p>逐幕展開閱讀，讀完可收合；進度會保存。</p><p class="message" role="status" aria-live="polite" data-live-feedback>' + escape(feedback) + '</p>' + chapter.scenes.map(function (scene, index) {
      var key = chapter.id + ":" + scene.id, done = Boolean(progress.completedScenes[key]), unlocked = workflow.unlocked(state, chapter, index);
      var last = index === chapter.scenes.length - 1, content = "";
      if (!unlocked) content = "<p>" + (is11 && !progress.claimedVersions["1.0"] ? "先完成 1.0 主線並領取版本獎勵，即可開始 1.1。" : "先完成前一幕閱讀" + (is11 ? "與互動" : "") + "，即可繼續。") + "</p>";
      else {
        content = config.bodyMarkup(scene, index);
        if (!(last && !is11)) content += button(done ? "本幕已讀完" : "標記本幕已讀完", "complete", scene, done);
        if (is11) {
          if (p.act > index) content += "<p>本幕互動已完成。</p>";
          else if (p.act === index && done) {
            var task = missions.acts[index].steps[p.step];
            content += '<section class="author-preview-task"><h4>本幕互動 · ' + (p.step + 1) + " / " + missions.acts[index].steps.length + "</h4><p>" + escape(task.prompt) + '</p><div class="author-preview-choices">' + task.choices.map(function (label, choice) { return button(label, "answer", scene, false, choice); }).join("") + "</div></section>";
          } else content += "<p>標記本幕已讀完後，在這裡完成互動。</p>";
        }
        if (last) content += '<div class="story-reward-bar"><span>本版本獎勵 · 僅領一次</span><strong>1,600 星砂 · 3,600 角色經驗 · 1 星痕</strong>' +
          button(claimed ? "版本獎勵已領取" : is11 ? "領取 1.1 版本獎勵" : "完成最後一幕並領取 1.0 版本獎勵", is11 ? "claim" : "complete", scene,
            claimed || (is11 ? p.act !== missions.acts.length || !done : !chapter.scenes.slice(0, -1).every(function (s) { return progress.completedScenes[chapter.id + ":" + s.id]; }))) + "</div>";
      }
      var open = Object.prototype.hasOwnProperty.call(openScenes, key) ? openScenes[key] : unlocked && !done;
      return '<details class="author-preview-story-scene" data-live-details="' + escape(key) + '"' + (open ? " open" : "") + '><summary><strong>第 ' + (index + 1) + " 幕｜" + escape(scene.title) + "</strong><span>" + (done ? "已讀" : unlocked ? "可閱讀" : "待解鎖") + '</span></summary><div class="released-story-content">' + content + "</div></details>";
    }).join("") + "</section>";
    config.container.onclick = function (event) {
      var target = event.target.closest("[data-live-action]");
      if (!target || target.disabled || busy) return;
      config.container.querySelectorAll("[data-live-details]").forEach(function (details) { openScenes[details.dataset.liveDetails] = details.open; });
      var scrollY = root.scrollY;
      var body = { chapterId: chapter.id, sceneId: target.dataset.liveScene, action: target.dataset.liveAction };
      if (body.action === "answer") { body.choice = Number(target.dataset.liveChoice); body.act = Number(target.dataset.liveAct); body.step = Number(target.dataset.liveStep); }
      busy = true; feedback = "正在保存……"; render(current);
      Promise.resolve().then(function () { return config.onAction(body); }).then(function (result) {
        feedback = result.feedback || (Object.keys(result.reward || {}).some(function (name) { return result.reward[name] > 0; }) ? "版本獎勵已領取。" : result.alreadyClaimed ? "已保留原有進度，未重複發獎。" : "進度已保存。");
      }).catch(function (error) { feedback = error.message + "；可以重新嘗試。"; }).finally(function () {
        busy = false; render(current); root.scrollTo({ top: scrollY, behavior: "instant" });
        var details = current.container.querySelector('[data-live-details="' + chapter.id + ":" + body.sceneId + '"]');
        if (details) details.querySelector("summary").focus({ preventScroll: true });
      });
    };
  }
  root.StarshipStoryReader = { render: render };
}(typeof globalThis !== "undefined" ? globalThis : this));
