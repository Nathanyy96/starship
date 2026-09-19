(function () {
  "use strict";

  function start() {
    var api = window.StarshipGacha;
    var data = window.StarshipGachaData;
    if (!api || !data) {
      throw new Error("抽卡核心尚未載入");
    }

    var serverCandidate = window.location.protocol !== "file:" && typeof window.fetch === "function";
    var remoteMode = false;
    var playerNameKey = "starship-player-name";
    var currentPlayerName = "";
    var currentPlayerToken = "";
    var authMode = "login";
    var selectedBannerId = (data.banners.find(function (banner) { return banner.active !== false; }) || data.banners[0]).id;
    var currentStoryChapterId = "main-1-0";
    var currentStorySceneId = "";
    var currentStoryTab = "main";
    var currentTrialStageId = 1;
    var currentTrialTeam = [];
    var currentDispatchMissionId = "dispatch-library";
    var currentDispatchTeam = [];
    var currentCharacterId = "";
    var game = null;

    function byId(id) { return document.getElementById(id); }
    function escapeHtml(value) {
      return String(value === undefined || value === null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function number(value) { return Number(value || 0).toLocaleString("zh-Hant-TW"); }
    function bannerById(id) { return data.banners.find(function (banner) { return banner.id === id; }); }
    function normalizePlayerName(value) { return String(value || "").normalize("NFKC").trim().replace(/\s+/g, " ").slice(0, 24); }
    function playerKey(name) { return normalizePlayerName(name).toLowerCase(); }
    function localKey(name) { return "starship-gacha-save-v1:" + encodeURIComponent(playerKey(name)); }
    function localAccountKey(name) { return "starship-account-v1:" + encodeURIComponent(playerKey(name)); }
    function localGet(name) {
      try { var value = window.localStorage.getItem(localKey(name)); return value ? JSON.parse(value) : null; } catch (error) { return null; }
    }
    function localSet(name, value) {
      try { window.localStorage.setItem(localKey(name), JSON.stringify(value)); } catch (error) { /* local storage may be disabled */ }
    }
    function localAccountGet(name) {
      try { var value = window.localStorage.getItem(localAccountKey(name)); return value ? JSON.parse(value) : null; } catch (error) { return null; }
    }
    function localAccountSet(name, value) {
      try { window.localStorage.setItem(localAccountKey(name), JSON.stringify(value)); } catch (error) { /* local storage may be disabled */ }
    }
    function storedName() {
      try { return normalizePlayerName(window.localStorage.getItem(playerNameKey)); } catch (error) { return ""; }
    }
    function storeName(name) {
      try { window.localStorage.setItem(playerNameKey, name); } catch (error) { /* backend still owns the name */ }
    }
    function apiRequest(path, body, skipSession) {
      var requestBody = Object.assign({}, body || {});
      if (!skipSession && currentPlayerToken) { requestBody.token = currentPlayerToken; }
      return window.fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(requestBody) }).then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (payload) {
          if (!response.ok || payload.ok === false) { throw new Error(payload.error || "後端連線失敗"); }
          return payload;
        });
      });
    }
    function showMessage(text, isError) {
      var message = byId("message"); message.textContent = text; message.className = isError ? "message error" : "message";
    }
    function showGateMessage(text, isError) {
      var message = byId("player-gate-message"); message.textContent = text; message.className = isError ? "message error" : "message";
    }
    function setControlsEnabled(enabled) {
      ["banner-select", "featured-select", "pull-one", "pull-ten", "pull-ticket", "exchange-featured", "reset-save"].forEach(function (id) { byId(id).disabled = !enabled; });
    }
    function hideGameViews() {
      ["game-lobby", "story-view", "character-view", "trial-view", "dispatch-view", "gacha-hall"].forEach(function (id) { if (byId(id)) byId(id).hidden = true; });
    }
    function showView(viewId) {
      if (!currentPlayerName || !game) {
        showGate();
        return;
      }
      hideGameViews();
      byId(viewId).hidden = false;
      if (viewId === "game-lobby") { renderLobby(); }
      if (viewId === "story-view") { renderStory(); }
      if (viewId === "character-view") { renderCharacters(); }
      if (viewId === "trial-view") { renderTrial(); }
      if (viewId === "dispatch-view") { renderDispatch(); }
      if (viewId === "gacha-hall") { render(); }
      byId(viewId).scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function setHallVisible(visible) {
      if (visible) { showView("gacha-hall"); } else { byId("gacha-hall").hidden = true; }
    }
    function showAuthChoice() {
      byId("auth-choice").hidden = false;
      byId("player-form").hidden = true;
      byId("auth-title").textContent = "要進入星界之律大廳嗎？";
      byId("auth-description").textContent = "玩家進度、抽卡紀錄、保底與角色收集都會綁定在你的帳號。請先選擇登入方式。";
      showGateMessage(serverCandidate && !remoteMode ? "此頁面目前使用瀏覽器本機存檔；不需要另外啟動伺服器。" : "", false);
    }
    function setAuthMode(mode) {
      authMode = mode;
      byId("auth-choice").hidden = true;
      byId("player-form").hidden = false;
      byId("auth-title").textContent = mode === "register" ? "第一次登入，建立你的星界帳號" : "回到星界之律，登入你的存檔";
      byId("auth-description").textContent = mode === "register" ? "設定一次遊戲名稱與密碼，之後所有抽卡、資源、保底與角色收集都會自動儲存。" : "輸入建立過的遊戲名稱與密碼，載入你的完整進度。";
      byId("auth-mode-badge").textContent = mode === "register" ? "NEW PLAYER / CREATE SAVE" : "RETURNING PLAYER / LOGIN";
      byId("password-confirm-field").hidden = mode !== "register";
      byId("player-password-input").autocomplete = mode === "register" ? "new-password" : "current-password";
      byId("player-password-confirm").required = mode === "register";
      byId("auth-submit").textContent = mode === "register" ? "建立帳號並進入" : "登入星界之律";
      showGateMessage("", false);
      byId("player-name-input").focus();
    }
    function showGate() {
      currentPlayerName = "";
      currentPlayerToken = "";
      game = null;
      byId("player-gate").hidden = false;
      byId("player-badge").hidden = true;
      hideGameViews();
      setControlsEnabled(false);
      byId("player-name-input").value = storedName();
      byId("player-password-input").value = "";
      byId("player-password-confirm").value = "";
      showAuthChoice();
    }
    function preserveCharacterData(input, state) {
      var source = input && typeof input === "object" ? input : {};
      var savedCollection = source.collection && typeof source.collection === "object" ? source.collection : {};
      var savedProgress = source.characterProgress && typeof source.characterProgress === "object" ? source.characterProgress : {};
      state.collection = state.collection || {};
      state.characterProgress = state.characterProgress || {};
      Object.keys(savedCollection).forEach(function (cardId) {
        var savedCopies = Math.max(0, Number(savedCollection[cardId]) || 0);
        state.collection[cardId] = Math.max(Number(state.collection[cardId]) || 0, savedCopies);
      });
      Object.keys(savedProgress).forEach(function (cardId) {
        var saved = savedProgress[cardId]; if (!saved || typeof saved !== "object") return;
        var current = state.characterProgress[cardId] && typeof state.characterProgress[cardId] === "object" ? state.characterProgress[cardId] : {};
        state.characterProgress[cardId] = Object.assign({}, current, saved);
        ["level", "affinity", "constellation", "constellationCore"].forEach(function (field) {
          state.characterProgress[cardId][field] = Math.max(Number(saved[field]) || 0, Number(current[field]) || 0);
        });
      });
    }
    function ensurePlayerState(input) {
      var state = new api.GachaGame({ banners: data.banners, state: input || undefined }).getState();
      preserveCharacterData(input, state);
      state.collection = state.collection || {};
      state.recruitment = state.recruitment || {};
      // 登入或建立帳號後一律補齊主角，兼容早期沒有 starterGranted 的舊存檔。
      state.collection.celesia = Math.max(1, Number(state.collection.celesia) || 0);
      state.recruitment.starterGranted = true;
      var completedScenes = state.storyProgress && state.storyProgress.completedScenes ? state.storyProgress.completedScenes : {};
      if (Object.keys(completedScenes).some(function (key) { return key.indexOf("main-1-0:") === 0; }) && !state.recruitment.story10ChoiceClaimed) { state.recruitment.story10ChoiceAvailable = true; }
      if (state.trialProgress && state.trialProgress.clearedStages && state.trialProgress.clearedStages.indexOf(10) >= 0 && !state.recruitment.trial10ChoiceClaimed) { state.recruitment.trial10ChoiceAvailable = true; }
      var updateVersion = data.updateVersion || data.trialVersion || "2.0-2.5";
      state.updateRewards = state.updateRewards || { claimedVersions: {} };
      state.updateRewards.claimedVersions = state.updateRewards.claimedVersions || {};
      if (!state.updateRewards.claimedVersions[updateVersion]) {
        state.resources.starSand += Number(data.updateReward && data.updateReward.starSand || 3200);
        state.updateRewards.claimedVersions[updateVersion] = { starSand: Number(data.updateReward && data.updateReward.starSand || 3200), grantedAt: new Date().toISOString() };
      }
      if (state.trialProgress && state.trialProgress.version !== updateVersion) {
        state.trialProgress.version = updateVersion;
        state.trialProgress.attempts = {};
        state.trialProgress.clearedStages = [];
        state.trialProgress.bestStage = 0;
        state.trialProgress.lastBattle = null;
        state.trialProgress.selectedTeam = [];
      }
      state.dispatchProgress = state.dispatchProgress || { version: updateVersion, selectedTeam: [], claimed: {}, lastMission: null };
      if (state.dispatchProgress.version !== updateVersion) {
        state.dispatchProgress.version = updateVersion;
        state.dispatchProgress.selectedTeam = [];
        state.dispatchProgress.claimed = {};
        state.dispatchProgress.lastMission = null;
      }
      var migratedState = new api.GachaGame({ banners: data.banners, state: state }).getState();
      preserveCharacterData(input, migratedState);
      return new api.GachaGame({ banners: data.banners, state: migratedState }).getState();
    }
    function syncViewState(state) {
      currentStoryChapterId = state.storyProgress && state.storyProgress.currentChapter ? state.storyProgress.currentChapter : "main-1-0";
      var trial = state.trialProgress || {};
      if (!trialStageById(currentTrialStageId)) currentTrialStageId = Number(trial.lastBattle && trial.lastBattle.stageId) || 1;
      if (Array.isArray(trial.selectedTeam)) currentTrialTeam = trial.selectedTeam.slice(0, 4);
      var dispatch = state.dispatchProgress || {};
      if (dispatch.lastMission && dispatch.lastMission.missionId) currentDispatchMissionId = dispatch.lastMission.missionId;
      if (Array.isArray(dispatch.selectedTeam)) currentDispatchTeam = dispatch.selectedTeam.slice(0, 4);
    }
    function activatePlayer(name, payload) {
      currentPlayerName = name;
      currentPlayerToken = payload && payload.token ? payload.token : "local-session";
      storeName(name);
      game = new api.GachaGame({ banners: data.banners, state: ensurePlayerState(payload && payload.state ? payload.state : localGet(name) || undefined) });
      byId("player-gate").hidden = true;
      byId("player-badge").hidden = false;
      byId("player-name").textContent = name;
      var savedState = game.getState();
      syncViewState(savedState);
      if (!remoteMode) { saveLocalState(); }
      showView("game-lobby");
      setControlsEnabled(true);
      render();
    }
    function fallbackHash(value) {
      var hash = 2166136261;
      for (var index = 0; index < value.length; index += 1) { hash ^= value.charCodeAt(index); hash = Math.imul(hash, 16777619); }
      return "fallback-" + (hash >>> 0).toString(16);
    }
    function passwordHash(value) {
      if (window.crypto && window.crypto.subtle && window.TextEncoder) {
        return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)).then(function (buffer) {
          return Array.prototype.map.call(new Uint8Array(buffer), function (byte) { return byte.toString(16).padStart(2, "0"); }).join("");
        });
      }
      return Promise.resolve(fallbackHash(value));
    }
    function localAuthenticate(mode, name, password) {
      return passwordHash(password).then(function (hash) {
        var account = localAccountGet(name);
        var legacyState = localGet(name);
        if (mode === "register") {
          if (account && account.passwordHash) { throw new Error("這個遊戲名稱已經有帳號，請改選「我登入過」。"); }
          var state = ensurePlayerState(account && account.state ? account.state : legacyState || undefined);
          localAccountSet(name, { name: name, passwordHash: hash, state: state, createdAt: account && account.createdAt ? account.createdAt : new Date().toISOString() });
          localSet(name, state);
          return { ok: true, created: !account, state: state, token: "local-session" };
        }
        if (!account || !account.passwordHash) { throw new Error("找不到已設定密碼的帳號；如果這是舊存檔，請改選「第一次登入」完成密碼設定。"); }
        if (account.passwordHash !== hash) { throw new Error("遊戲名稱或密碼不正確。"); }
        return { ok: true, state: ensurePlayerState(account.state || legacyState || undefined), token: "local-session" };
      });
    }
    function authenticate(mode, name, password) {
      if (remoteMode) {
        return apiRequest(mode === "register" ? "/api/player/register" : "/api/player/login", { name: name, password: password }, true);
      }
      return localAuthenticate(mode, name, password);
    }
    function submitAuth(name, password) {
      name = normalizePlayerName(name);
      if (!name) { showGateMessage("請輸入遊戲名稱。", true); return; }
      if (!password || password.length < 6) { showGateMessage("密碼至少需要 6 個字元。", true); return; }
      if (authMode === "register" && password !== byId("player-password-confirm").value) { showGateMessage("兩次輸入的密碼不一致。", true); return; }
      byId("auth-submit").disabled = true;
      showGateMessage(remoteMode ? "正在驗證帳號並載入進度……" : "正在建立本機存檔……", false);
      authenticate(authMode, name, password).then(function (payload) {
        activatePlayer(name, payload);
        showMessage(authMode === "register" ? "帳號已建立；之後所有活動會自動儲存。" : "登入成功；已載入你的玩家進度。", false);
      }).catch(function (error) {
        showGateMessage(error.message, true);
      }).finally(function () {
        byId("auth-submit").disabled = false;
      });
    }
    function syncPlayer() {
      if (!currentPlayerName || !currentPlayerToken) { showGate(); return; }
      if (!remoteMode) {
        var account = localAccountGet(currentPlayerName);
        if (account && account.state) { updateGameFromState(account.state); render(); showMessage("已從本機存檔同步。", false); }
        return;
      }
      apiRequest("/api/player/session", {}).then(function (payload) { updateGameFromState(payload.state); render(); showMessage("已從後端同步最新進度。", false); }).catch(function (error) { showMessage(error.message, true); showGate(); });
    }
    function saveLocalState() {
      var state = game.getState();
      localSet(currentPlayerName, state);
      var account = localAccountGet(currentPlayerName);
      if (account) { account.state = state; account.updatedAt = new Date().toISOString(); localAccountSet(currentPlayerName, account); }
    }
    function storyProgress(state) {
      state.storyProgress = state.storyProgress || { currentChapter: "main-1-0", completedScenes: {} };
      state.storyProgress.completedScenes = state.storyProgress.completedScenes || {};
      return state.storyProgress;
    }
    function storyChapterById(id) { return data.storyChapters.find(function (chapter) { return chapter.id === id; }); }
    function storySceneById(chapter, id) { return chapter && chapter.scenes.find(function (scene) { return scene.id === id; }); }
    function sceneKey(chapterId, sceneId) { return chapterId + ":" + sceneId; }
    function storyChapterList() { return data.storyChapters.filter(function (chapter) { return chapter.type === currentStoryTab && chapter.releaseOpen !== false && Number(chapter.version) <= 2.5; }); }
    function lockedStoryChapterList() { return data.storyChapters.filter(function (chapter) { return chapter.type === currentStoryTab && chapter.releaseOpen === false; }); }
    function sceneClaimed(state, chapterId, sceneId) { return Boolean(storyProgress(state).completedScenes[sceneKey(chapterId, sceneId)]); }
    function developmentCost(card, level) {
      var rules = api.DEFAULT_RULES.development;
      var isFourStar = card && card.rarity === 4;
      return { characterExp: (isFourStar ? rules.fourStarBaseCharacterExp : rules.threeStarBaseCharacterExp) + (level - 1) * (isFourStar ? rules.fourStarCharacterExpStep : rules.threeStarCharacterExpStep) };
    }
    function constellationCost(constellation) {
      var rules = api.DEFAULT_RULES.constellation;
      return rules.characterCoreCost;
    }
    function renderMilestoneRewards() {
      var container = byId("milestone-rewards");
      if (!container || !game) return;
      var state = game.getState(); var recruitment = state.recruitment || {}; var cards = ["reyn", "lia"];
      var blocks = [];
      [{ key: "story-1-0", available: recruitment.story10ChoiceAvailable && !recruitment.story10ChoiceClaimed, title: "1.0 主線完成獎勵", copy: "完成 1.0 主線任意一幕，選擇一名角色。" }, { key: "trial-10", available: recruitment.trial10ChoiceAvailable && !recruitment.trial10ChoiceClaimed, title: "星界試煉第 10 關獎勵", copy: "通關第 10 關，再選擇一名角色。" }].forEach(function (reward) {
        if (!reward.available) return;
        var choices = cards.slice();
        if (reward.key === "trial-10") {
          var unowned = choices.filter(function (id) { return !(state.collection[id] > 0); });
          if (unowned.length) choices = unowned;
        }
        blocks.push("<div class=\"milestone-card\"><div><span class=\"eyebrow\">CHOICE REWARD</span><strong>" + escapeHtml(reward.title) + "</strong><p>" + escapeHtml(reward.copy) + "</p></div><div class=\"milestone-choice-list\">" + choices.map(function (id) { var card = data.cards[id]; return "<button class=\"secondary-action milestone-choice\" data-reward-key=\"" + escapeHtml(reward.key) + "\" data-card-id=\"" + escapeHtml(id) + "\" type=\"button\"><span>選擇</span><strong>" + escapeHtml(card.name) + "</strong><small>" + escapeHtml(card.element) + "｜" + "★".repeat(card.rarity) + "</small></button>"; }).join("") + "</div></div>");
      });
      container.innerHTML = blocks.join("");
      container.hidden = !blocks.length;
    }
    function renderLobby() {
      if (!game) return;
      var state = game.getState(); var progress = storyProgress(state); var completed = Object.keys(progress.completedScenes).length; var total = data.storyChapters.filter(function (item) { return item.releaseOpen !== false; }).reduce(function (sum, chapter) { return sum + chapter.scenes.length; }, 0); var chapter = storyChapterById(progress.currentChapter) || data.storyChapters[0];
      if (chapter.releaseOpen === false) chapter = storyChapterList()[0];
      byId("story-progress-label").textContent = "劇情完成 " + completed + " / " + total + " 幕";
      byId("lobby-pull-label").textContent = "總召集 " + state.totalPulls + " 次";
      var updateVersion = data.updateVersion || data.trialVersion || "2.0-2.5";
      var updateClaimed = state.updateRewards && state.updateRewards.claimedVersions && state.updateRewards.claimedVersions[updateVersion];
      if (byId("lobby-update-label")) byId("lobby-update-label").textContent = updateClaimed ? "大更新獎勵 +3,200 星砂（已領取）" : "大更新獎勵 +3,200 星砂";
      byId("lobby-continue-title").textContent = (chapter.versionLabel || chapter.version) + "｜" + chapter.title;
      byId("lobby-continue-copy").textContent = chapter.summary;
      renderMilestoneRewards();
    }
    function storyVersionLabel(chapter) { return chapter.versionLabel || chapter.version; }
    function storyBodyMarkup(text, className) {
      var blocks = String(text || "").replace(/\r\n/g, "\n").split(/\n{2,}/).map(function (block) { return block.trim(); }).filter(Boolean);
      var bodyClass = className || "story-body";
      return "<div class=\"" + bodyClass + "\">" + blocks.map(function (block) {
        var timeline = /^【時間線|^章節定位/.test(block);
        return "<p" + (timeline ? " class=\"story-timeline\"" : "") + ">" + escapeHtml(block).replace(/\n/g, "<br>") + "</p>";
      }).join("") + "</div>";
    }
    function storyLength(chapter) {
      if (chapter.fullBody) return String(chapter.fullBody).replace(/\s/g, "").length;
      return chapter.scenes.reduce(function (sum, scene) { return sum + String(scene.body || "").replace(/\s/g, "").length; }, 0);
    }
    function renderStoryReader(state, chapter) {
      var scene = storySceneById(chapter, currentStorySceneId) || chapter.scenes[0];
      currentStorySceneId = scene.id;
      var claimed = sceneClaimed(state, chapter.id, scene.id);
      var sceneButtons = chapter.scenes.map(function (item) { return "<button class=\"story-scene-button " + (item.id === scene.id ? "active " : "") + (sceneClaimed(state, chapter.id, item.id) ? "claimed" : "") + "\" data-scene-id=\"" + escapeHtml(item.id) + "\" type=\"button\"><span>" + escapeHtml(item.title) + "</span><small>" + (sceneClaimed(state, chapter.id, item.id) ? "已領取 100 星砂" : "完成後 +100 星砂") + "</small></button>"; }).join("");
      var fullChapter = chapter.scenes.map(function (item, index) {
        return "<article class=\"complete-scene-block\"><span class=\"scene-label\">SCENE " + String(index + 1).padStart(2, "0") + "</span><h4>" + escapeHtml(item.title) + "</h4>" + storyBodyMarkup(item.body, "story-body story-full-body") + "</article>";
      }).join("");
      var characterCount = chapter.characters.filter(function (id) { return Boolean(data.cards[id]); }).length;
      var length = storyLength(chapter);
      var sourceLabel = chapter.sourceStatus === "document-tab-missing" ? "補充正文" : "文件正文";
      byId("story-reader").innerHTML = "<div class=\"story-reader-kicker\"><span>" + escapeHtml(storyVersionLabel(chapter) + " / " + (chapter.type === "main" ? "主線" : "支線") + " / " + chapter.region) + "</span><span class=\"story-source-badge\">" + sourceLabel + "</span></div><h3>" + escapeHtml(chapter.title) + "</h3><p class=\"story-summary\">" + escapeHtml(chapter.summary) + "</p><div class=\"story-reader-meta\"><span>正文 <b>" + number(length) + " 字</b></span><span>約 <b>" + Math.max(1, Math.ceil(length / 500)) + " 分鐘</b></span><span><b>" + chapter.scenes.length + " 幕</b></span><span><b>" + characterCount + " 名角色</b></span></div><div class=\"story-character-tags\">" + chapter.characters.map(function (id) { var card = data.cards[id]; return card ? "<span>" + escapeHtml(card.name) + "｜" + escapeHtml(card.element) + "</span>" : ""; }).join("") + "</div><div class=\"story-scene-reader\"><span class=\"scene-label\">SCENE " + escapeHtml(scene.id.toUpperCase()) + "</span><h4>" + escapeHtml(scene.title) + "</h4>" + storyBodyMarkup(scene.body) + "<div class=\"story-reward-bar\"><span>首次看完獎勵</span><strong>+100 星砂</strong><button class=\"primary-action\" data-complete-scene=\"" + escapeHtml(scene.id) + "\" type=\"button\"" + (claimed ? " disabled" : "") + ">" + (claimed ? "已領取" : "看完本幕並領取") + "</button></div></div><div class=\"story-scene-list\"><div class=\"story-scene-heading\"><span>本章幕次導覽</span><small>每幕首次完成可獲得 100 星砂；正文可向下捲動閱讀</small></div>" + sceneButtons + "</div><section class=\"story-full-chapter\"><div class=\"story-full-heading\"><span>本章完整劇情</span><small>已整理成長篇閱讀格式，所有幕次內容都會顯示</small></div><div>" + fullChapter + "</div></section>";
    }
    function moveStoryPlotToTop() {
      var reader = byId("story-reader");
      if (!reader) return;
      var plot = reader.querySelector(".story-scene-reader");
      var sceneList = reader.querySelector(".story-scene-list");
      if (plot && sceneList) reader.insertBefore(plot, sceneList);
    }
    function renderStory() {
      if (!game) return;
      var state = game.getState(); var chapters = storyChapterList(); var current = storyChapterById(currentStoryChapterId);
      if (!chapters.length) {
        byId("story-chapters").innerHTML = "<div class=\"empty\">劇情資料尚未載入，請重新整理頁面；玩家存檔不會因此被清除。</div>";
        byId("story-reader").innerHTML = "<div class=\"empty\">目前沒有可顯示的已開放劇情。若重新整理後仍看不到，請聯絡管理員檢查部署版本。</div>";
        return;
      }
      if (!current || current.type !== currentStoryTab || current.releaseOpen === false) { current = chapters[0]; currentStoryChapterId = current.id; currentStorySceneId = current.scenes[0].id; }
      byId("story-main-tab").classList.toggle("active", currentStoryTab === "main"); byId("story-side-tab").classList.toggle("active", currentStoryTab === "side");
      var openButtons = chapters.map(function (chapter) { var done = chapter.scenes.filter(function (scene) { return sceneClaimed(state, chapter.id, scene.id); }).length; return "<button class=\"story-chapter-button " + (chapter.id === current.id ? "active" : "") + "\" data-story-id=\"" + escapeHtml(chapter.id) + "\" type=\"button\"><span class=\"story-version\">" + escapeHtml(storyVersionLabel(chapter)) + "</span><span><strong>" + escapeHtml(chapter.title) + "</strong><small>" + escapeHtml(chapter.region) + " · " + done + "/" + chapter.scenes.length + " 幕 · " + number(storyLength(chapter)) + " 字</small></span></button>"; }).join("");
      var lockedRoadmap = lockedStoryChapterList().map(function (chapter) { return "<div class=\"story-roadmap-card\"><span class=\"story-version\">" + escapeHtml(storyVersionLabel(chapter)) + "</span><div><strong>" + escapeHtml(chapter.title) + "</strong><small>已建檔 · 版本更新後開放 · " + chapter.scenes.length + " 幕</small></div><span class=\"roadmap-lock\">LOCKED</span></div>"; }).join("");
      byId("story-chapters").innerHTML = openButtons + (lockedRoadmap ? "<div class=\"story-roadmap-heading\">後續版本檔案</div>" + lockedRoadmap : "");
      byId("story-view-status").textContent = currentStoryTab === "main" ? "主線 1.0–2.5｜3.0–4.5 已建檔" : "支線 1.0–2.5｜3.0–4.5 已建檔";
      renderStoryReader(state, current);
      moveStoryPlotToTop();
    }
    function renderCharacters() {
      if (!game) return;
      var state = game.getState(); var owned = data.activeCards.filter(function (card) { return (state.collection[card.id] || 0) > 0; }).length;
      byId("character-view-status").textContent = "已取得 " + owned + " 名";
      byId("character-exp").textContent = number(state.resources.characterExp);
      var personalCoreTotal = data.activeCards.reduce(function (sum, card) { var progress = state.characterProgress[card.id] || {}; return sum + (Number(progress.constellationCore) || 0); }, 0);
      byId("character-core").textContent = number(personalCoreTotal);
      byId("character-star-marks").textContent = number(state.resources.starMarks);
      byId("character-list").innerHTML = data.activeCards.map(function (card) {
        var copies = state.collection[card.id] || 0; var progress = state.characterProgress[card.id] || { level: 1, affinity: 0, constellation: 0, constellationCore: 0 }; var cost = developmentCost(card, progress.level); var coreCost = constellationCost(progress.constellation || 0); var personalCores = Number(progress.constellationCore) || 0; var power = characterPower(card.id, state); var style = "--accent:" + escapeHtml(card.accent || "#9e92ff") + (card.image ? ";--card-image:url(\"" + escapeHtml(card.image) + "\")" : "");
        return "<article class=\"character-growth-card " + (copies ? "owned" : "locked") + " rarity-" + card.rarity + "\" data-open-character=\"" + escapeHtml(card.id) + "\" tabindex=\"0\"><div class=\"character-growth-art\" style=\"" + style + "\"><span>" + escapeHtml(card.element) + "</span><strong>" + escapeHtml(card.name) + "</strong><small>" + escapeHtml(card.romanizedName) + "</small></div><div class=\"character-growth-body\"><div><span class=\"rarity-label\">" + "★".repeat(card.rarity) + "</span><h3>" + escapeHtml(card.name) + "</h3><p>" + escapeHtml(card.note) + "</p></div><div class=\"growth-stats\"><span>戰力 <b>" + number(power) + "</b></span><span>等級 <b>Lv." + progress.level + "</b></span><span>命座 <b>" + (progress.constellation || 0) + "/6</b></span><span>命座晶核 <b>" + personalCores + "</b></span><span>持有 <b>×" + copies + "</b></span></div><div class=\"growth-actions\"><button class=\"secondary-action growth-button\" data-develop-character=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (!copies || state.resources.characterExp < cost.characterExp ? " disabled" : "") + ">" + (copies ? "升級　" + cost.characterExp + " 經驗" : "尚未取得") + "</button><button class=\"small-button growth-constellation-button\" data-constellation-character=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (!copies || (progress.constellation || 0) >= 6 || personalCores < coreCost ? " disabled" : "") + ">命座＋1　" + coreCost + " 個人晶核</button></div></div></article>";
      }).join("");
      if (currentCharacterId) { renderCharacterDetail(currentCharacterId); }
    }
    function characterStatsFor(cardId, progress) {
      var base = data.characterBattleStats[cardId];
      if (!base) return null;
      var level = Math.max(1, Number(progress.level) || 1); var constellation = Math.max(0, Number(progress.constellation) || 0); var isFourStar = base.rarity === 4; var multiplier = 1 + (level - 1) * (isFourStar ? 0.028 : 0.022) + constellation * (isFourStar ? 0.045 : 0.03);
      return { maxHp: Math.round(base.maxHp * multiplier), attack: Math.round(base.attack * multiplier), defense: Math.round(base.defense * (1 + (level - 1) * (isFourStar ? 0.022 : 0.017) + constellation * (isFourStar ? 0.04 : 0.027))), speed: Math.round(base.speed * (1 + (level - 1) * (isFourStar ? 0.009 : 0.007) + constellation * (isFourStar ? 0.014 : 0.01))), role: base.role, attackName: base.attackName, skillName: base.skillName, skillEffect: base.skillEffect };
    }
    function characterPower(cardId, state) {
      var stats = effectiveBattleStats(state);
      return window.StarshipBattle && stats[cardId] ? window.StarshipBattle.teamPower([cardId], stats) : 0;
    }
    function renderCharacterDetail(cardId) {
      var state = game && game.getState(); var card = data.cards[cardId]; var detail = byId("character-detail");
      if (!state || !card || !detail) return;
      var copies = state.collection[card.id] || 0; var progress = state.characterProgress[card.id] || { level: 1, affinity: 0, constellation: 0, constellationCore: 0 }; var cost = developmentCost(card, progress.level); var coreCost = constellationCost(progress.constellation || 0); var personalCores = Number(progress.constellationCore) || 0; var stats = characterStatsFor(card.id, progress) || {}; var power = characterPower(card.id, state);
      // 角色詳情直接使用原始 PNG，避免 SVG 內嵌立繪在部分手機瀏覽器被阻擋；
      // 名稱、星級與元素固定疊在畫面底部，仍保留完整立繪比例。
      var image = card.image || card.backgroundImage;
      var portraitLabel = "<div class=\"portrait-label\"><strong>" + escapeHtml(card.name) + "</strong><span>" + "★".repeat(card.rarity) + "　" + escapeHtml(card.element) + "</span><small>" + escapeHtml(card.romanizedName) + "</small></div>";
      detail.innerHTML = "<button class=\"detail-close small-button\" data-close-character type=\"button\">× 關閉角色詳情</button><div class=\"character-detail-grid\"><div class=\"character-portrait-frame\"><img src=\"" + escapeHtml(image || "") + "\" alt=\"" + escapeHtml(card.name + " 完整立繪，" + "★".repeat(card.rarity) + "，" + card.element) + "\" loading=\"eager\">" + portraitLabel + "</div><div class=\"character-detail-copy\"><p class=\"eyebrow\">CHARACTER DEVELOPMENT / " + escapeHtml(card.romanizedName.toUpperCase()) + "</p><h3>" + escapeHtml(card.name) + "</h3><p class=\"detail-note\">" + escapeHtml(card.note) + "</p><div class=\"detail-progress\"><span>戰力 <b>" + number(power) + "</b></span><span>等級 <b>Lv." + progress.level + " / 80</b></span><span>命座 <b>" + (progress.constellation || 0) + " / 6</b></span><span>個人晶核 <b>" + personalCores + "</b></span><span>持有 <b>×" + copies + "</b></span></div><div class=\"detail-stat-grid\"><span>生命 <b>" + number(stats.maxHp || 0) + "</b></span><span>攻擊 <b>" + number(stats.attack || 0) + "</b></span><span>防禦 <b>" + number(stats.defense || 0) + "</b></span><span>速度 <b>" + number(stats.speed || 0) + "</b></span><span>定位 <b>" + escapeHtml(stats.role || "—") + "</b></span><span>攻擊手段 <b>" + escapeHtml(stats.attackName || "—") + "</b></span></div><div class=\"detail-skill\"><span>技能｜" + escapeHtml(stats.skillName || "—") + "</span><p>" + escapeHtml(stats.skillEffect || "尚未登錄") + "</p></div><div class=\"detail-actions\"><button class=\"primary-action\" data-detail-develop=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (!copies || state.resources.characterExp < cost.characterExp ? " disabled" : "") + ">升級　" + cost.characterExp + " 角色經驗</button><button class=\"secondary-action\" data-detail-constellation=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (!copies || (progress.constellation || 0) >= 6 || personalCores < coreCost ? " disabled" : "") + ">提升命座　" + coreCost + " 個人晶核</button></div><p class=\"detail-resource-hint\">4★每級提升幅度與經驗成本較高；3★較容易培養。重複抽到角色會立即增加命座並得到該角色個人晶核，個人晶核只可用於這名角色的後續命座提升。</p></div></div>";
      detail.hidden = false;
      detail.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function openCharacterDetail(cardId) { currentCharacterId = cardId; renderCharacterDetail(cardId); }
    function updateStorySelection(chapterId) {
      var chapter = storyChapterById(chapterId); if (!chapter || chapter.releaseOpen === false) return;
      currentStoryChapterId = chapterId; currentStorySceneId = chapter.scenes[0].id;
      var state = game.getState(); storyProgress(state).currentChapter = chapterId;
      if (remoteMode) { apiRequest("/api/player/story-progress", { action: "select", chapterId: chapterId }).then(function (payload) { updateGameFromState(payload.state); renderStory(); renderLobby(); }).catch(function () { renderStory(); }); }
      else { updateGameFromState(state); saveLocalState(); renderStory(); renderLobby(); }
    }
    function completeStoryScene(chapterId, sceneId) {
      if (remoteMode) {
        apiRequest("/api/player/story-progress", { action: "complete", chapterId: chapterId, sceneId: sceneId }).then(function (payload) { updateGameFromState(payload.state); renderStory(); renderLobby(); renderCharacters(); showMessage(payload.alreadyClaimed ? "這一幕的星砂獎勵已領取。" : "劇情完成：已獲得 100 星砂並儲存到帳號。", false); }).catch(function (error) { showMessage(error.message, true); });
        return;
      }
      var chapter = storyChapterById(chapterId); if (!chapter || chapter.releaseOpen === false) { showMessage("這個版本的劇情已建檔，但尚未開放。", true); return; }
      var state = game.getState(); var progress = storyProgress(state); var key = sceneKey(chapterId, sceneId);
      if (progress.completedScenes[key]) { showMessage("這一幕的星砂獎勵已領取。", false); return; }
      progress.currentChapter = chapterId; progress.completedScenes[key] = { completedAt: new Date().toISOString(), starSand: 100 }; state.resources.starSand += 100;
      if (chapterId === "main-1-0" && !state.recruitment.story10ChoiceClaimed) state.recruitment.story10ChoiceAvailable = true;
      updateGameFromState(state); saveLocalState(); renderStory(); renderLobby(); renderCharacters(); showMessage("劇情完成：已獲得 100 星砂並儲存到這個瀏覽器。", false);
    }
    function developCharacter(cardId) {
      currentCharacterId = cardId;
      if (remoteMode) { apiRequest("/api/player/character-development", { cardId: cardId }).then(function (payload) { updateGameFromState(payload.state); renderCharacters(); renderLobby(); showMessage("角色升級完成，進度已儲存。", false); }).catch(function (error) { showMessage(error.message, true); }); return; }
      try { game.developCharacter({ cardId: cardId }); saveLocalState(); renderCharacters(); renderLobby(); showMessage("角色升級完成，進度已儲存到這個瀏覽器。", false); } catch (error) { showMessage(error.message, true); }
    }
    function enhanceConstellation(cardId) {
      currentCharacterId = cardId;
      if (remoteMode) { apiRequest("/api/player/character-constellation", { cardId: cardId }).then(function (payload) { updateGameFromState(payload.state); renderCharacters(); renderLobby(); showMessage("命座提升完成，進度已儲存。", false); }).catch(function (error) { showMessage(error.message, true); }); return; }
      try { game.enhanceConstellation({ cardId: cardId }); saveLocalState(); renderCharacters(); renderLobby(); showMessage("命座提升完成，進度已儲存到這個瀏覽器。", false); } catch (error) { showMessage(error.message, true); }
    }
    function claimCharacterChoice(rewardKey, cardId) {
      if (remoteMode) {
        apiRequest("/api/player/claim-character", { rewardKey: rewardKey, cardId: cardId }).then(function (payload) { updateGameFromState(payload.state); renderLobby(); renderCharacters(); renderTrial(); showMessage("已取得 " + payload.card.name + "，角色自選獎勵已儲存。", false); }).catch(function (error) { showMessage(error.message, true); });
        return;
      }
      try {
        var state = game.getState(); var recruitment = state.recruitment || {};
        var availableKey = rewardKey === "story-1-0" ? "story10ChoiceAvailable" : "trial10ChoiceAvailable";
        var claimedKey = rewardKey === "story-1-0" ? "story10ChoiceClaimed" : "trial10ChoiceClaimed";
        if (!recruitment[availableKey] || recruitment[claimedKey]) throw new Error("這份角色自選獎勵目前不可領取");
        if (["reyn", "lia"].indexOf(cardId) < 0) throw new Error("只能選擇雷恩或莉亞");
        var result = game.grantCharacter(cardId); state = result.state; state.recruitment[availableKey] = false; state.recruitment[claimedKey] = true;
        updateGameFromState(state); saveLocalState(); renderLobby(); renderCharacters(); renderTrial(); showMessage("已取得 " + data.cards[cardId].name + "，角色自選獎勵已儲存。", false);
      } catch (error) { showMessage(error.message, true); }
    }
    function trialProgress(state) {
      state.trialProgress = state.trialProgress || { version: data.trialVersion || "2.0-2.5", selectedTeam: [], clearedStages: [], attempts: {}, bestStage: 0, lastBattle: null };
      state.trialProgress.selectedTeam = Array.isArray(state.trialProgress.selectedTeam) ? state.trialProgress.selectedTeam : [];
      state.trialProgress.clearedStages = Array.isArray(state.trialProgress.clearedStages) ? state.trialProgress.clearedStages : [];
      state.trialProgress.attempts = state.trialProgress.attempts || {};
      return state.trialProgress;
    }
    function trialStageById(id) { return data.trialStages.find(function (stage) { return stage.id === Number(id); }); }
    function trialAttempts(state, stageId) { return Number(trialProgress(state).attempts[stageId] || 0); }
    function trialUnlocked(state, stageId) { return Number(stageId) === 1 || trialProgress(state).clearedStages.indexOf(Number(stageId) - 1) >= 0; }
    function effectiveBattleStats(state) { return window.StarshipBattle && window.StarshipBattle.buildEffectiveStats ? window.StarshipBattle.buildEffectiveStats(data.characterBattleStats, state) : data.characterBattleStats; }
    function trialPower(team, state) { return window.StarshipBattle ? window.StarshipBattle.teamPower(team, effectiveBattleStats(state)) : 0; }
    function enemyArtFor(enemy) {
      var text = String(enemy && enemy.name || "");
      if (/王座|終局|核心|主核|中樞|燈核|判決核|索引核|修復核|邊界核/.test(text)) return "./assets/enemies/core.svg";
      if (/獵犬|獵影|風路|風廊|斥候/.test(text)) return "./assets/enemies/hound.svg";
      if (/潮|寄生|潮眼|深潮|潮蝕/.test(text)) return "./assets/enemies/parasite.svg";
      if (/書|檔案|空白|索引|規則|記錄/.test(text)) return "./assets/enemies/archive.svg";
      if (/鎧|護衛|守門|重殼|遺構/.test(text)) return "./assets/enemies/shell.svg";
      if (/噪音|回音|鏡|折光|影|殘響/.test(text)) return "./assets/enemies/echo.svg";
      if (/獸|幼體|獵/.test(text)) return "./assets/enemies/beast.svg";
      return "./assets/enemies/riftling.svg";
    }
    function renderEnemyIntel(stage) {
      return (stage.enemies || []).map(function (enemy) {
        var hp = Number(enemy.maxHp || 0); var threat = Math.round((Number(enemy.attack || 0) * 1.2) + Number(enemy.defense || 0));
        return "<article class=\"enemy-intel-card\"><div class=\"enemy-intel-art\"><img src=\"" + escapeHtml(enemyArtFor(enemy)) + "\" alt=\"" + escapeHtml(enemy.name + " 敵人圖鑑") + "\"><span>×" + number(enemy.count || 1) + "</span></div><div class=\"enemy-intel-copy\"><strong>" + escapeHtml(enemy.name) + "</strong><small>敵方單位 · 速度 " + number(enemy.speed || 0) + "</small><div><span>HP <b>" + number(hp) + "</b></span><span>攻 <b>" + number(enemy.attack || 0) + "</b></span><span>防 <b>" + number(enemy.defense || 0) + "</b></span></div><em>威脅值 " + number(threat) + " · 會依關卡特性行動</em></div></article>";
      }).join("");
    }
    function renderTrialBattleResult(state) {
      var container = byId("trial-battle-result"); var battle = trialProgress(state).lastBattle;
      if (!battle || Number(battle.stageId) !== Number(currentTrialStageId)) { container.innerHTML = "<div class=\"trial-result-empty\">完成一場自走棋戰鬥後，戰報會顯示在這裡。</div>"; return; }
      var rewardExp = Number((trialStageById(battle.stageId) || {}).reward && (trialStageById(battle.stageId) || {}).reward.characterExp || data.trialReward && data.trialReward.characterExp || 0);
      var reward = battle.won ? "本次獎勵：+100 星砂、+1 共鳴券、+" + number(rewardExp) + " 角色經驗" : "本次未通關，不會扣除挑戰次數";
      var synergy = battle.synergy === undefined ? "—" : Math.round(Number(battle.synergy) * 100) + "%";
      var environment = battle.environment ? "環境「" + battle.environment + "」" : "";
      container.innerHTML = "<div class=\"trial-result-header " + (battle.won ? "won" : "lost") + "\"><div><span class=\"eyebrow\">BATTLE REPORT / " + (battle.won ? "CLEAR" : "RETRY") + "</span><strong>" + (battle.won ? "試煉通關" : "試煉未通關") + " · " + battle.rounds + " 回合</strong><small>" + escapeHtml(reward) + "｜隊伍協同 " + escapeHtml(synergy) + (environment ? "｜" + escapeHtml(environment) : "") + "</small></div><span class=\"battle-power\">隊伍戰力 " + number(battle.teamPower) + "</span></div><details><summary>查看自走棋戰鬥紀錄</summary><div class=\"battle-log\">" + (battle.logs || []).map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") + "</div></details>";
    }
    function renderTrial() {
      if (!game) return;
      var state = game.getState(); var progress = trialProgress(state); var current = trialStageById(currentTrialStageId) || data.trialStages[0];
      if (!trialUnlocked(state, current.id)) { current = data.trialStages.find(function (stage) { return trialUnlocked(state, stage.id); }) || data.trialStages[0]; currentTrialStageId = current.id; }
      var attempts = trialAttempts(state, current.id); var maxRewards = data.trialMaxRewards || 10; var trialCharacterExp = Number(current.reward && current.reward.characterExp || data.trialReward && data.trialReward.characterExp || 0);
      byId("trial-view-status").textContent = "第 " + current.id + " 關 · " + attempts + " / " + maxRewards + " 次";
      byId("trial-stages").innerHTML = data.trialStages.map(function (stage) {
        var count = trialAttempts(state, stage.id); var unlocked = trialUnlocked(state, stage.id); var cleared = progress.clearedStages.indexOf(stage.id) >= 0;
        return "<button class=\"trial-stage-button " + (stage.id === current.id ? "active " : "") + (cleared ? "cleared " : "") + (!unlocked ? "locked" : "") + (stage.finalStage ? " final-stage" : "") + "\" data-trial-stage=\"" + stage.id + "\" type=\"button\"" + (!unlocked ? " disabled" : "") + "><span class=\"trial-stage-number\">" + String(stage.id).padStart(2, "0") + "</span><span><strong>" + escapeHtml(stage.name) + "</strong><small>" + escapeHtml(stage.region) + " · " + escapeHtml(stage.environment || "一般") + "</small></span><em>" + count + "/" + maxRewards + "</em></button>";
      }).join("");
      var enemyText = current.enemies.map(function (enemy) { return enemy.name + " ×" + enemy.count; }).join("、");
      byId("trial-stage-details").innerHTML = "<div class=\"trial-stage-kicker\"><span>TRIAL " + String(current.id).padStart(2, "0") + "</span><span>" + escapeHtml(current.region) + "</span>" + (current.finalStage ? "<span>FINAL</span>" : "") + "</div><h3>" + escapeHtml(current.name) + "</h3><p>敵方編成：" + escapeHtml(enemyText) + "</p><div class=\"trial-rule-callout\"><strong>環境｜" + escapeHtml(current.environment || "一般試煉") + "</strong><span>" + escapeHtml(current.environmentEffect || "沒有額外環境效果。") + "</span><strong>敵方特性｜" + escapeHtml(current.enemyTrait || "一般") + "</strong><span>" + escapeHtml(current.enemyTraitEffect || "沒有額外特性。") + "</span></div><div class=\"trial-detail-stats\"><span>推薦戰力 <b>" + number(current.recommendedPower) + "</b></span><span>本版本獎勵 <b>100 星砂 + 1 共鳴券 + " + number(trialCharacterExp) + " 經驗</b></span><span>可領次數 <b>" + attempts + " / " + maxRewards + "</b></span></div>";
      if (byId("trial-enemy-intel")) byId("trial-enemy-intel").innerHTML = "<div class=\"enemy-intel-heading\"><div><span class=\"eyebrow\">ENEMY INTEL</span><strong>敵方圖鑑</strong></div><small>先看敵人的攻防與速度，再安排隊伍協同</small></div><div class=\"enemy-intel-grid\">" + renderEnemyIntel(current) + "</div>";
      var owned = data.activeCards.filter(function (card) { return state.collection[card.id] > 0 && data.characterBattleStats[card.id]; });
      currentTrialTeam = currentTrialTeam.filter(function (id) { return owned.some(function (card) { return card.id === id; }); }).slice(0, 4);
      byId("trial-team-count").textContent = currentTrialTeam.length + " / 4 · 戰力 " + number(trialPower(currentTrialTeam, state));
      byId("trial-team-list").innerHTML = owned.length ? owned.map(function (card) {
        var effectiveStats = effectiveBattleStats(state); var stats = effectiveStats[card.id]; var individualPower = window.StarshipBattle ? window.StarshipBattle.teamPower([card.id], effectiveStats) : 0; var selected = currentTrialTeam.indexOf(card.id) >= 0; var image = card.image || card.backgroundImage; var style = "--accent:" + escapeHtml(card.accent || "#9e92ff") + (image ? ";--card-image:url(\"" + escapeHtml(image) + "\")" : "");
        return "<button class=\"trial-team-card " + (selected ? "selected" : "") + "\" data-trial-character=\"" + escapeHtml(card.id) + "\" type=\"button\"><span class=\"trial-team-art\" style=\"" + style + "\"><b>" + escapeHtml(card.element) + "</b><strong>" + escapeHtml(card.name) + "</strong></span><span class=\"trial-team-copy\"><strong>" + escapeHtml(card.name) + "</strong><small class=\"character-power-line\">戰力 " + number(individualPower) + "</small><small>" + escapeHtml(stats.role) + " · HP " + number(stats.maxHp) + "</small><small>攻 " + stats.attack + "／防 " + stats.defense + "／速 " + stats.speed + "</small><small>技能｜" + escapeHtml(stats.skillName || "—") + "</small></span><i>" + (selected ? "已編入" : "加入編隊") + "</i></button>";
      }).join("") : "<div class=\"empty\">目前沒有可參戰角色。</div>";
      var startButton = byId("start-trial-battle"); startButton.disabled = !trialUnlocked(state, current.id) || !currentTrialTeam.length || attempts >= maxRewards; startButton.textContent = attempts >= maxRewards ? "本版本已完成 10 次" : "開始自走棋戰鬥";
      renderTrialBattleResult(state);
    }
    function toggleTrialTeam(cardId) {
      if (!game) return;
      var index = currentTrialTeam.indexOf(cardId);
      if (index >= 0) currentTrialTeam.splice(index, 1);
      else if (currentTrialTeam.length >= 4) { showMessage("一次戰鬥最多派出 4 名角色。", true); return; }
      else currentTrialTeam.push(cardId);
      var state = game.getState(); trialProgress(state).selectedTeam = currentTrialTeam.slice(); updateGameFromState(state); saveLocalState(); renderTrial();
    }
    function runTrialBattle() {
      if (!game || !currentPlayerName) { showGate(); return; }
      var stage = trialStageById(currentTrialStageId); if (!stage) return;
      var trialCharacterExp = Number(stage.reward && stage.reward.characterExp || data.trialReward && data.trialReward.characterExp || 0);
      if (remoteMode) {
        apiRequest("/api/player/trial-battle", { stageId: stage.id, team: currentTrialTeam }).then(function (payload) { updateGameFromState(payload.state); renderTrial(); renderLobby(); renderCharacters(); showMessage(payload.battle.won ? "星界試煉通關：已獲得 100 星砂、1 張共鳴券與 " + trialCharacterExp + " 角色經驗。" : "本次試煉未通關，可以調整編隊後再次挑戰。", !payload.battle.won); }).catch(function (error) { showMessage(error.message, true); });
        return;
      }
      try {
        var state = game.getState(); var progress = trialProgress(state); var attempts = trialAttempts(state, stage.id); var maxRewards = data.trialMaxRewards || 10;
        if (!trialUnlocked(state, stage.id)) throw new Error("請先通關前一關");
        if (attempts >= maxRewards) throw new Error("本關在目前版本已完成 10 次，請等待下次遊戲更新重置挑戰次數");
        if (!currentTrialTeam.length) throw new Error("至少派出 1 名角色才能開始戰鬥");
        if (currentTrialTeam.some(function (id) { return !(state.collection[id] > 0) || !data.characterBattleStats[id]; })) throw new Error("只能派出已取得且已開放的角色");
        var battle = window.StarshipBattle.simulateBattle({ team: currentTrialTeam, stats: effectiveBattleStats(state), stage: stage }); progress.selectedTeam = currentTrialTeam.slice(); progress.lastBattle = battle;
        if (battle.won) { progress.attempts[stage.id] = attempts + 1; if (progress.clearedStages.indexOf(stage.id) < 0) progress.clearedStages.push(stage.id); progress.bestStage = Math.max(progress.bestStage || 0, stage.id); state.resources.starSand += 100; state.resources.tickets += 1; state.resources.characterExp += Number(stage.reward && stage.reward.characterExp || 0); if (stage.id === 10 && !state.recruitment.trial10ChoiceClaimed) state.recruitment.trial10ChoiceAvailable = true; }
        updateGameFromState(state); saveLocalState(); renderTrial(); renderLobby(); renderCharacters(); showMessage(battle.won ? "星界試煉通關：已獲得 100 星砂、1 張共鳴券與 " + trialCharacterExp + " 角色經驗。" : "本次試煉未通關，可以調整編隊後再次挑戰。", !battle.won);
      } catch (error) { showMessage(error.message, true); }
    }
    function dispatchProgress(state) {
      var version = data.dispatchVersion || data.updateVersion || "2.0-2.5";
      state.dispatchProgress = state.dispatchProgress || { version: version, selectedTeam: [], claimed: {}, lastMission: null };
      state.dispatchProgress.selectedTeam = Array.isArray(state.dispatchProgress.selectedTeam) ? state.dispatchProgress.selectedTeam : [];
      state.dispatchProgress.claimed = state.dispatchProgress.claimed || {};
      return state.dispatchProgress;
    }
    function dispatchMissionById(id) { return (data.dispatchMissions || []).find(function (mission) { return mission.id === id; }); }
    function renderDispatchBattleResult(state) {
      var container = byId("dispatch-result"); if (!container) return;
      var progress = dispatchProgress(state); var result = progress.lastMission;
      if (!result || result.missionId !== currentDispatchMissionId || !result.battle) { container.innerHTML = "<div class=\"trial-result-empty\">完成一份星港委託後，戰報與獎勵會顯示在這裡。</div>"; return; }
      var battle = result.battle; var reward = battle.won ? rewardText((dispatchMissionById(result.missionId) || {}).reward || {}) : "未通關不會領取獎勵";
      container.innerHTML = "<div class=\"trial-result-header " + (battle.won ? "won" : "lost") + "\"><div><span class=\"eyebrow\">DISPATCH REPORT / " + (battle.won ? "CLEAR" : "RETRY") + "</span><strong>" + (battle.won ? "委託完成" : "委託未完成") + " · " + escapeHtml((dispatchMissionById(result.missionId) || {}).name || "星港委託") + "</strong><small>" + escapeHtml(battle.won ? "獲得：" + reward : reward) + "｜隊伍協同 " + Math.round(Number(battle.synergy || 0) * 100) + "%</small></div><span class=\"battle-power\">隊伍戰力 " + number(battle.teamPower) + "</span></div><details><summary>查看委託戰鬥紀錄</summary><div class=\"battle-log\">" + (battle.logs || []).map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") + "</div></details>";
    }
    function renderDispatch() {
      if (!game || !byId("dispatch-missions")) return;
      var state = game.getState(); var progress = dispatchProgress(state); var missions = data.dispatchMissions || []; var current = dispatchMissionById(currentDispatchMissionId) || missions[0];
      if (!current) { byId("dispatch-missions").innerHTML = "<div class=\"empty\">目前沒有開放的星港委託。</div>"; return; }
      currentDispatchMissionId = current.id;
      if (Array.isArray(progress.selectedTeam) && !currentDispatchTeam.length) currentDispatchTeam = progress.selectedTeam.slice(0, 4);
      var owned = data.activeCards.filter(function (card) { return state.collection[card.id] > 0 && data.characterBattleStats[card.id]; });
      currentDispatchTeam = currentDispatchTeam.filter(function (id) { return owned.some(function (card) { return card.id === id; }); }).slice(0, 4);
      byId("dispatch-missions").innerHTML = missions.map(function (mission) { var claimed = Boolean(progress.claimed[mission.id]); return "<button class=\"dispatch-mission-card " + (mission.id === current.id ? "active " : "") + (claimed ? "claimed" : "") + "\" data-dispatch-mission=\"" + escapeHtml(mission.id) + "\" type=\"button\"><span class=\"mission-index\">" + escapeHtml(mission.id.replace("dispatch-", "").slice(0, 2).toUpperCase()) + "</span><span><strong>" + escapeHtml(mission.name) + "</strong><small>" + escapeHtml(mission.region) + " · 推薦 " + number(mission.recommendedPower) + "</small></span><em>" + (claimed ? "已完成" : "可執行") + "</em></button>"; }).join("");
      var claimed = Boolean(progress.claimed[current.id]);
      byId("dispatch-mission-details").innerHTML = "<div class=\"trial-stage-kicker\"><span>DISPATCH</span><span>" + escapeHtml(current.region) + "</span>" + (claimed ? "<span>CLAIMED</span>" : "") + "</div><h3>" + escapeHtml(current.name) + "</h3><p>" + escapeHtml(current.description) + "</p><div class=\"trial-rule-callout\"><strong>環境｜" + escapeHtml(current.environment || "一般委託") + "</strong><span>" + escapeHtml(current.environmentEffect || "沒有額外環境效果。") + "</span><strong>敵方特性｜" + escapeHtml(current.enemyTrait || "一般") + "</strong><span>" + escapeHtml(current.enemyTraitEffect || "沒有額外特性。") + "</span></div><div class=\"trial-detail-stats\"><span>推薦戰力 <b>" + number(current.recommendedPower) + "</b></span><span>完成獎勵 <b>" + escapeHtml(rewardText(current.reward || {})) + "</b></span><span>版本完成度 <b>" + (claimed ? "已領取" : "未領取") + "</b></span></div>";
      if (byId("dispatch-enemy-intel")) byId("dispatch-enemy-intel").innerHTML = "<div class=\"enemy-intel-heading\"><div><span class=\"eyebrow\">ENEMY INTEL</span><strong>敵方圖鑑</strong></div><small>每份委託的敵人特性不同，編隊不只看總戰力</small></div><div class=\"enemy-intel-grid\">" + renderEnemyIntel(current) + "</div>";
      byId("dispatch-team-count").textContent = currentDispatchTeam.length + " / 4 · 戰力 " + number(trialPower(currentDispatchTeam, state));
      byId("dispatch-team-list").innerHTML = owned.length ? owned.map(function (card) { var effectiveStats = effectiveBattleStats(state); var stats = effectiveStats[card.id]; var individualPower = window.StarshipBattle ? window.StarshipBattle.teamPower([card.id], effectiveStats) : 0; var selected = currentDispatchTeam.indexOf(card.id) >= 0; var image = card.image || card.backgroundImage; var style = "--accent:" + escapeHtml(card.accent || "#9e92ff") + (image ? ";--card-image:url(\"" + escapeHtml(image) + "\")" : ""); return "<button class=\"trial-team-card dispatch-team-card " + (selected ? "selected" : "") + "\" data-dispatch-character=\"" + escapeHtml(card.id) + "\" type=\"button\"><span class=\"trial-team-art\" style=\"" + style + "\"><b>" + escapeHtml(card.element) + "</b><strong>" + escapeHtml(card.name) + "</strong></span><span class=\"trial-team-copy\"><strong>" + escapeHtml(card.name) + "</strong><small class=\"character-power-line\">戰力 " + number(individualPower) + "</small><small>" + escapeHtml(stats.role) + " · HP " + number(stats.maxHp) + "</small><small>攻 " + stats.attack + "／防 " + stats.defense + "／速 " + stats.speed + "</small></span><i>" + (selected ? "已編入" : "加入編隊") + "</i></button>"; }).join("") : "<div class=\"empty\">目前沒有可執行委託的角色。</div>";
      var startButton = byId("start-dispatch"); startButton.disabled = claimed || !currentDispatchTeam.length; startButton.textContent = claimed ? "本版本委託已完成" : "執行星港委託";
      renderDispatchBattleResult(state);
    }
    function toggleDispatchTeam(cardId) {
      var index = currentDispatchTeam.indexOf(cardId);
      if (index >= 0) currentDispatchTeam.splice(index, 1);
      else if (currentDispatchTeam.length >= 4) { showMessage("一次戰鬥最多派出 4 名角色。", true); return; }
      else currentDispatchTeam.push(cardId);
      var state = game.getState(); dispatchProgress(state).selectedTeam = currentDispatchTeam.slice(); updateGameFromState(state); saveLocalState(); renderDispatch();
    }
    function runDispatchMission() {
      if (!game || !currentPlayerName) { showGate(); return; }
      var mission = dispatchMissionById(currentDispatchMissionId); if (!mission) return;
      if (remoteMode) {
        apiRequest("/api/player/dispatch", { missionId: mission.id, team: currentDispatchTeam }).then(function (payload) { updateGameFromState(payload.state); renderDispatch(); renderLobby(); renderCharacters(); showMessage(payload.battle.won ? "星港委託完成：已獲得 " + rewardText(payload.reward) + "。" : "委託未完成，可以調整隊伍後再次嘗試。", !payload.battle.won); }).catch(function (error) { showMessage(error.message, true); });
        return;
      }
      try {
        var state = game.getState(); var progress = dispatchProgress(state);
        if (progress.claimed[mission.id]) throw new Error("這份委託本版本已完成，請等待下次版本更新");
        if (!currentDispatchTeam.length) throw new Error("至少派出 1 名角色才能執行委託");
        if (currentDispatchTeam.some(function (id) { return !(state.collection[id] > 0) || !data.characterBattleStats[id]; })) throw new Error("只能派出已取得且已開放的角色");
        var battle = window.StarshipBattle.simulateBattle({ team: currentDispatchTeam, stats: effectiveBattleStats(state), stage: mission }); progress.selectedTeam = currentDispatchTeam.slice(); progress.lastMission = { missionId: mission.id, battle: battle };
        if (battle.won) { progress.claimed[mission.id] = { completedAt: new Date().toISOString() }; Object.keys(mission.reward || {}).forEach(function (key) { if (Object.prototype.hasOwnProperty.call(state.resources, key)) state.resources[key] += Number(mission.reward[key] || 0); }); }
        updateGameFromState(state); saveLocalState(); renderDispatch(); renderLobby(); renderCharacters(); showMessage(battle.won ? "星港委託完成：已獲得 " + rewardText(mission.reward) + "。" : "委託未完成，可以調整隊伍後再次嘗試。", !battle.won);
      } catch (error) { showMessage(error.message, true); }
    }
    function rewardText(reward) {
      var parts = [];
      if (reward && reward.starSand) { parts.push("+" + reward.starSand + " 星砂"); }
      if (reward && reward.starMarks) { parts.push("+" + reward.starMarks + " 星痕"); }
      if (reward && reward.echoPowder) { parts.push("+" + reward.echoPowder + " 回響粉"); }
      if (reward && reward.characterExp) { parts.push("+" + reward.characterExp + " 角色經驗"); }
      if (reward && reward.resonanceCore) { parts.push("+" + reward.resonanceCore + " 共鳴晶核"); }
      if (reward && reward.constellationCore) { parts.push("+" + reward.constellationCore + " 該角色命座晶核"); }
      return parts.join("、");
    }
    function cardMarkup(item) {
      var card = item.card;
      if (!card) {
        return "<article class=\"result-card resource-result\"><div class=\"card-art\"><div class=\"card-watermark\">回響</div><div class=\"resource-result-title\">一般回響</div><div class=\"resource-result-copy\">本格未取得角色</div></div><div class=\"result-meta\"><span>第 " + item.pityPullNumber + " 抽判定</span></div><div class=\"result-note\">獲得 " + escapeHtml(rewardText(item.resourceReward)) + "，不占用角色收集。</div></article>";
      }
      var badge = item.featured ? "精選" : (item.isHardPity ? "硬保底" : "");
      var duplicate = rewardText(item.duplicateReward);
      var compensation = rewardText(item.compensationReward);
      var tag = badge ? "<span class=\"result-tag\">" + badge + "</span>" : "";
      var duplicateLine = duplicate ? "<div class=\"duplicate-reward\">重複轉換：" + escapeHtml(duplicate) + "</div>" : "";
      var compensationLine = compensation ? "<div class=\"compensation-reward\">歪出補償：" + escapeHtml(compensation) + "</div>" : "";
      var imageStyle = "--accent:" + escapeHtml(card.accent || "#8f7cff");
      var cardImage = card.image || card.backgroundImage;
      if (cardImage) { imageStyle += ";--card-image:url(\"" + escapeHtml(cardImage) + "\")"; }
      return "<article class=\"result-card rarity-" + card.rarity + (item.featured ? " featured" : "") + "\"><div class=\"card-art\" style=\"" + imageStyle + "\"><div class=\"card-watermark\">星律</div><div class=\"card-element\">" + escapeHtml(card.element) + "</div><div class=\"card-stars\">" + "★".repeat(card.rarity) + "</div><div class=\"card-name\"><strong>" + escapeHtml(card.name) + "</strong><span>" + escapeHtml(card.romanizedName) + "</span></div></div><div class=\"result-meta\"><span>第 " + item.pityPullNumber + " 抽判定</span>" + tag + "</div><div class=\"result-note\">" + escapeHtml(card.note) + "</div>" + duplicateLine + compensationLine + "</article>";
    }
    function renderResults(outcome) {
      var summary = outcome.summary;
      var rewardSummary = (summary.bonusStarSand || summary.compensationStarSand) ? "｜額外星砂 " + number((summary.bonusStarSand || 0) + (summary.compensationStarSand || 0)) : "";
      byId("results").innerHTML = "<div class=\"result-summary\"><strong>本次召集完成</strong><span>" + summary.total + " 格｜4★ " + summary.fourStar + "｜3★ " + summary.threeStar + "｜一般回響 " + (summary.resource || 0) + "｜精選 " + summary.featured + rewardSummary + "</span></div><div class=\"result-grid\">" + outcome.results.map(cardMarkup).join("") + "</div>";
      byId("results").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function renderCollection(state) {
      var container = byId("collection");
      container.innerHTML = data.activeCards.map(function (card) {
        var copies = state.collection[card.id] || 0;
        return "<div class=\"collection-item " + (copies ? "owned" : "locked") + "\"><span class=\"collection-rarity\">" + "★".repeat(card.rarity) + "</span><span class=\"collection-name\">" + escapeHtml(card.name) + " <small>" + escapeHtml(card.element) + "</small></span><span class=\"collection-count\">" + (copies ? "×" + copies : "未取得") + "</span></div>";
      }).join("");
      byId("collection-count").textContent = Object.keys(state.collection).filter(function (id) { return state.collection[id] > 0; }).length + " / " + data.activeCards.length;
    }
    function renderHistory(state) {
      var entries = state.history.slice().reverse().slice(0, 8);
      byId("history").innerHTML = entries.length ? entries.map(function (entry) {
        var banner = bannerById(entry.bannerId); var title = banner ? banner.name : entry.bannerId; var payment = entry.payment === "ticket" ? "共鳴券" : number(entry.cost) + " 星砂";
        return "<div class=\"history-row\"><span>" + escapeHtml(title) + "</span><span>" + entry.count + " 格｜4★ " + entry.summary.fourStar + "｜3★ " + entry.summary.threeStar + "｜" + escapeHtml(payment) + "</span></div>";
      }).join("") : "<div class=\"empty\">尚未有召集紀錄。</div>";
    }
    function renderBackdrop(card) {
      var panel = byId("banner-panel");
      panel.style.setProperty("--featured-accent", card ? (card.accent || "#9e92ff") : "#9e92ff");
      panel.style.setProperty("--featured-image", card && card.backgroundImage ? "url(\"" + card.backgroundImage + "\")" : "none");
      panel.classList.toggle("has-featured-backdrop", Boolean(card && card.backgroundImage));
      panel.setAttribute("data-featured", card ? card.name : "回覆召集");
    }
    function render() {
      if (!game) { return; }
      var state = game.getState(); var banner = bannerById(selectedBannerId); var pity = game.getPityStatus(selectedBannerId);
      byId("star-sand").textContent = number(state.resources.starSand); byId("tickets").textContent = number(state.resources.tickets); byId("star-marks").textContent = number(state.resources.starMarks); byId("echo-powder").textContent = number(state.resources.echoPowder);
      byId("banner-description").textContent = banner.description; byId("pity-count").textContent = pity.pullsSince4Star + " / " + pity.hardPity; byId("pity-rate").textContent = pity.currentFourStarRateText; byId("pity-distance").textContent = "距離 4★ 硬保底還有 " + pity.pullsUntilHardPity + " 格"; byId("pity-fill").style.width = Math.min(100, pity.pullsSince4Star / pity.hardPity * 100) + "%";
      byId("featured-guarantee").textContent = banner.type === "standard" ? "常駐池沒有精選保證" : (pity.guaranteedFeatured ? "下一張 4★ 必定是目前選中的角色" : "目前為 55% 選中角色／45% 其他 4★");
      var bannerSelect = byId("banner-select"); bannerSelect.innerHTML = data.banners.filter(function (item) { return item.active !== false; }).map(function (item) { return "<option value=\"" + escapeHtml(item.id) + "\">" + escapeHtml(item.name) + "</option>"; }).join(""); bannerSelect.value = selectedBannerId;
      var featuredSelect = byId("featured-select"); featuredSelect.innerHTML = banner.type === "standard" ? "<option value=\"\">常駐池不選精選</option>" : banner.featured4Stars.map(function (candidate) { return "<option value=\"" + escapeHtml(candidate.id) + "\">" + escapeHtml(candidate.name) + "｜" + escapeHtml(candidate.element) + "｜4★</option>"; }).join(""); featuredSelect.disabled = banner.type === "standard"; if (pity.selectedFeaturedId) { featuredSelect.value = pity.selectedFeaturedId; }
      byId("featured-card").innerHTML = pity.selectedFeatured ? cardMarkup({ card: pity.selectedFeatured, pityPullNumber: "－", duplicateReward: {}, featured: true, isHardPity: false }) : "<div class=\"standard-featured\">常駐回音召集：無當期精選</div>";
      renderBackdrop(pity.selectedFeatured);
      byId("pull-one").disabled = state.resources.starSand < api.DEFAULT_RULES.singleCost; byId("pull-ten").disabled = state.resources.starSand < api.DEFAULT_RULES.tenCost; byId("pull-ticket").disabled = state.resources.tickets < 1; byId("exchange-featured").disabled = banner.type === "standard" || state.resources.starMarks < 10 || Boolean(state.bannerExchanges[banner.id]); byId("exchange-featured").textContent = state.bannerExchanges[banner.id] ? "本檔精選已兌換" : "10 星痕兌換精選";
      renderCollection(state); renderHistory(state);
    }
    function updateGameFromState(state) { game = new api.GachaGame({ banners: data.banners, state: ensurePlayerState(state) }); syncViewState(game.getState()); }
    function pull(count, payment) {
      if (!game || !currentPlayerName) { showGate(); return; }
      if (remoteMode) {
        apiRequest("/api/player/pull", { bannerId: selectedBannerId, count: count, payment: payment }).then(function (outcome) { updateGameFromState(outcome.state); renderResults(outcome); render(); showMessage("召集完成；進度已儲存到後端。", false); }).catch(function (error) { showMessage(error.message, true); });
      } else {
        try { var outcome = game.pull({ bannerId: selectedBannerId, count: count, payment: payment }); saveLocalState(); renderResults(outcome); showMessage("召集完成；已儲存到這個瀏覽器。", false); render(); } catch (error) { showMessage(error.message, true); }
      }
    }
    function probeBackend() {
      if (!serverCandidate) { showGateMessage("目前使用瀏覽器本機存檔；不需要另外啟動伺服器。", false); return; }
      window.fetch("/api/health", { cache: "no-store" }).then(function (response) { if (!response.ok) { throw new Error("no backend"); } return response.json(); }).then(function () {
        remoteMode = true;
        showGateMessage("已連接線上存檔服務。", false);
      }).catch(function () {
        remoteMode = false;
        showGateMessage("這個網頁未連接外部伺服器，將使用瀏覽器本機存檔；不需要另外啟動 Codex 伺服器。", false);
      });
    }

    byId("known-player-button").addEventListener("click", function () { setAuthMode("login"); });
    byId("new-player-button").addEventListener("click", function () { setAuthMode("register"); });
    byId("auth-back").addEventListener("click", showAuthChoice);
    byId("player-form").addEventListener("submit", function (event) { event.preventDefault(); submitAuth(byId("player-name-input").value, byId("player-password-input").value); });
    byId("sync-player").addEventListener("click", syncPlayer);
    byId("change-player").addEventListener("click", showGate);
    byId("reset-save").addEventListener("click", showGate);
    byId("banner-select").addEventListener("change", function () { selectedBannerId = this.value; render(); });
    byId("featured-select").addEventListener("change", function () {
      if (!game || !this.value) { return; }
      if (remoteMode) { apiRequest("/api/player/select-featured", { bannerId: selectedBannerId, cardId: this.value }).then(function (payload) { updateGameFromState(payload.state); render(); showMessage("已更新精選角色並儲存。", false); }).catch(function (error) { showMessage(error.message, true); }); }
      else { try { game.selectFeatured({ bannerId: selectedBannerId, cardId: this.value }); saveLocalState(); render(); showMessage("已更新精選角色並儲存到這個瀏覽器。", false); } catch (error) { showMessage(error.message, true); } }
    });
    byId("pull-one").addEventListener("click", function () { pull(1, "starSand"); }); byId("pull-ten").addEventListener("click", function () { pull(10, "starSand"); }); byId("pull-ticket").addEventListener("click", function () { pull(1, "ticket"); });
    byId("exchange-featured").addEventListener("click", function () {
      if (!game || !currentPlayerName) { showGate(); return; }
      var request = { bannerId: selectedBannerId };
      if (remoteMode) { apiRequest("/api/player/exchange-featured", request).then(function (payload) { updateGameFromState(payload.state); byId("results").innerHTML = "<div class=\"result-summary\"><strong>兌換完成</strong><span>取得 " + escapeHtml(payload.card.name) + "（4★｜" + escapeHtml(payload.card.element) + "）</span></div>"; render(); showMessage("已使用 10 枚星痕；進度已儲存到後端。", false); }).catch(function (error) { showMessage(error.message, true); }); }
      else { try { var exchanged = game.exchangeFeatured({ bannerId: selectedBannerId }); saveLocalState(); byId("results").innerHTML = "<div class=\"result-summary\"><strong>兌換完成</strong><span>取得 " + escapeHtml(exchanged.card.name) + "（4★｜" + escapeHtml(exchanged.card.element) + "）</span></div>"; render(); showMessage("已使用 10 枚星痕；進度已儲存到這個瀏覽器。", false); } catch (error) { showMessage(error.message, true); } }
    });
    byId("open-story").addEventListener("click", function () { showView("story-view"); });
    byId("open-gacha").addEventListener("click", function () { showView("gacha-hall"); });
    byId("open-characters").addEventListener("click", function () { showView("character-view"); });
    byId("open-trial").addEventListener("click", function () { showView("trial-view"); });
    byId("open-dispatch").addEventListener("click", function () { showView("dispatch-view"); });
    byId("continue-story").addEventListener("click", function () { showView("story-view"); });
    document.querySelectorAll(".back-lobby").forEach(function (button) { button.addEventListener("click", function () { showView("game-lobby"); }); });
    byId("story-main-tab").addEventListener("click", function () { currentStoryTab = "main"; currentStoryChapterId = "main-1-0"; currentStorySceneId = ""; renderStory(); });
    byId("story-side-tab").addEventListener("click", function () { currentStoryTab = "side"; currentStoryChapterId = "side-1-0-village"; currentStorySceneId = ""; renderStory(); });
    byId("story-chapters").addEventListener("click", function (event) { var button = event.target.closest("[data-story-id]"); if (button) updateStorySelection(button.getAttribute("data-story-id")); });
    byId("story-reader").addEventListener("click", function (event) { var sceneButton = event.target.closest("[data-scene-id]"); if (sceneButton) { currentStorySceneId = sceneButton.getAttribute("data-scene-id"); renderStory(); return; } var completeButton = event.target.closest("[data-complete-scene]"); if (completeButton) completeStoryScene(currentStoryChapterId, completeButton.getAttribute("data-complete-scene")); });
    byId("character-list").addEventListener("click", function (event) {
      var developButton = event.target.closest("[data-develop-character]"); if (developButton) { event.stopPropagation(); developCharacter(developButton.getAttribute("data-develop-character")); return; }
      var constellationButton = event.target.closest("[data-constellation-character]"); if (constellationButton) { event.stopPropagation(); enhanceConstellation(constellationButton.getAttribute("data-constellation-character")); return; }
      var card = event.target.closest("[data-open-character]"); if (card) openCharacterDetail(card.getAttribute("data-open-character"));
    });
    byId("character-list").addEventListener("keydown", function (event) { if (event.key === "Enter" || event.key === " ") { var card = event.target.closest("[data-open-character]"); if (card) { event.preventDefault(); openCharacterDetail(card.getAttribute("data-open-character")); } } });
    byId("character-detail").addEventListener("click", function (event) {
      if (event.target.closest("[data-close-character]")) { byId("character-detail").hidden = true; currentCharacterId = ""; return; }
      var developButton = event.target.closest("[data-detail-develop]"); if (developButton) { developCharacter(developButton.getAttribute("data-detail-develop")); return; }
      var constellationButton = event.target.closest("[data-detail-constellation]"); if (constellationButton) enhanceConstellation(constellationButton.getAttribute("data-detail-constellation"));
    });
    byId("milestone-rewards").addEventListener("click", function (event) { var button = event.target.closest("[data-reward-key]"); if (button) claimCharacterChoice(button.getAttribute("data-reward-key"), button.getAttribute("data-card-id")); });
    byId("trial-stages").addEventListener("click", function (event) { var button = event.target.closest("[data-trial-stage]"); if (button && !button.disabled) { currentTrialStageId = Number(button.getAttribute("data-trial-stage")); renderTrial(); } });
    byId("trial-team-list").addEventListener("click", function (event) { var button = event.target.closest("[data-trial-character]"); if (button) toggleTrialTeam(button.getAttribute("data-trial-character")); });
    byId("start-trial-battle").addEventListener("click", runTrialBattle);
    byId("dispatch-missions").addEventListener("click", function (event) { var button = event.target.closest("[data-dispatch-mission]"); if (button) { currentDispatchMissionId = button.getAttribute("data-dispatch-mission"); currentDispatchTeam = []; renderDispatch(); } });
    byId("dispatch-team-list").addEventListener("click", function (event) { var button = event.target.closest("[data-dispatch-character]"); if (button) toggleDispatchTeam(button.getAttribute("data-dispatch-character")); });
    byId("start-dispatch").addEventListener("click", runDispatchMission);

    setControlsEnabled(false);
    setHallVisible(false);
    byId("player-name-input").value = storedName();
    showGate();
    probeBackend();
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); } else { start(); }
}());
