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
    var currentBossStageId = "boss-star-warden";
    var currentBossTeam = [];
    var currentDispatchMissionId = "dispatch-library";
    var currentDispatchTeam = [];
    var currentVoyageTeam = [];
    var currentVoyageRouteId = "";
    var currentPetId = "star-fox";
    var currentPetOutfitId = "default";
    var currentPetEffectId = "starlit";
    var petShowcases = [];
    var currentCharacterId = "";
    var currentCharacterSkinId = "";
    var game = null;

    function byId(id) { return document.getElementById(id); }
    function escapeHtml(value) {
      return String(value === undefined || value === null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function number(value) { return Number(value || 0).toLocaleString("zh-Hant-TW"); }
    function bannerById(id) { return data.banners.find(function (banner) { return banner.id === id; }); }
    function bossStageById(id) { return (data.bossStages || []).find(function (stage) { return stage.id === id; }); }
    function voyageNodeById(id) { return (data.voyageConfig && data.voyageConfig.nodes || []).find(function (node) { return node.id === id; }); }
    function createClientGame(state) { return new api.GachaGame({ banners: data.banners, state: state, breakthroughRequirements: data.characterBreakthroughs, voyageConfig: data.voyageConfig, petDefinitions: data.petDefinitions, petOutfits: data.petOutfits, petEffects: data.petEffects }); }
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
      ["banner-select", "featured-select", "pull-one", "pull-ten", "exchange-featured", "reset-save"].forEach(function (id) { byId(id).disabled = !enabled; });
    }
    function hideGameViews() {
      ["game-lobby", "story-view", "character-view", "trial-view", "boss-view", "dispatch-view", "voyage-view", "pet-view", "gacha-hall", "tutorial-view", "announcement-view"].forEach(function (id) { if (byId(id)) byId(id).hidden = true; });
    }
    function showView(viewId) {
      if (!currentPlayerName || !game) {
        showGate();
        return;
      }
      hideGameViews();
      byId(viewId).hidden = false;
      if (viewId === "game-lobby") { renderLobby(); }
      if (viewId === "tutorial-view") { renderTutorial(); }
      if (viewId === "announcement-view") { renderAnnouncements(); }
      if (viewId === "story-view") { renderStory(); }
      if (viewId === "character-view") { renderCharacters(); }
      if (viewId === "trial-view") { renderTrial(); }
      if (viewId === "boss-view") { renderBoss(); }
      if (viewId === "dispatch-view") { renderDispatch(); }
      if (viewId === "voyage-view") { renderVoyage(); }
      if (viewId === "pet-view") { renderPets(); loadPetShowcases(); }
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
      var state = createClientGame(input || undefined).getState();
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
      state.bossProgress = state.bossProgress || { version: data.bossVersion || updateVersion, selectedBossId: "boss-star-warden", selectedTeam: [], attempts: {}, lastBattle: null };
      if (state.bossProgress.version !== (data.bossVersion || updateVersion)) {
        state.bossProgress.version = data.bossVersion || updateVersion;
        state.bossProgress.attempts = {};
        state.bossProgress.lastBattle = null;
        state.bossProgress.selectedTeam = [];
        state.bossProgress.selectedBossId = "boss-star-warden";
      }
      state.dispatchProgress = state.dispatchProgress || { version: updateVersion, selectedTeam: [], claimed: {}, lastMission: null };
      if (state.dispatchProgress.version !== updateVersion) {
        state.dispatchProgress.version = updateVersion;
        state.dispatchProgress.selectedTeam = [];
        state.dispatchProgress.claimed = {};
        state.dispatchProgress.lastMission = null;
      }
      var voyageVersion = data.voyageVersion || updateVersion;
      state.voyageProgress = state.voyageProgress || { version: voyageVersion, status: "idle", routeId: null, route: [], nodeIndex: 0, selectedTeam: [], fragments: 0, buffs: [], flags: {}, claimedRewards: {}, lastBattle: null, lastEnding: null };
      if (state.voyageProgress.version !== voyageVersion) {
        state.voyageProgress.version = voyageVersion;
        state.voyageProgress.status = "idle";
        state.voyageProgress.routeId = null;
        state.voyageProgress.route = [];
        state.voyageProgress.nodeIndex = 0;
        state.voyageProgress.selectedTeam = [];
        state.voyageProgress.fragments = 0;
        state.voyageProgress.buffs = [];
        state.voyageProgress.flags = {};
        state.voyageProgress.claimedRewards = {};
        state.voyageProgress.lastBattle = null;
        state.voyageProgress.lastEnding = null;
      }
      var petVersion = data.petVersion || updateVersion;
      state.petProgress = state.petProgress || { version: petVersion, exploreCount: 0, ratedShowcases: {} };
      if (state.petProgress.version !== petVersion) {
        state.petProgress.version = petVersion;
        state.petProgress.exploreCount = 0;
        state.petProgress.ratedShowcases = {};
        state.petProgress.showcase = state.petProgress.showcase || {};
        state.petProgress.showcase.ratedBy = {};
      }
      var migratedState = createClientGame(state).getState();
      preserveCharacterData(input, migratedState);
      return createClientGame(migratedState).getState();
    }
    function syncViewState(state) {
      currentStoryChapterId = state.storyProgress && state.storyProgress.currentChapter ? state.storyProgress.currentChapter : "main-1-0";
      var trial = state.trialProgress || {};
      if (!trialStageById(currentTrialStageId)) currentTrialStageId = Number(trial.lastBattle && trial.lastBattle.stageId) || 1;
      if (Array.isArray(trial.selectedTeam)) currentTrialTeam = trial.selectedTeam.slice(0, 4);
      var boss = state.bossProgress || {};
      if (boss.selectedBossId && bossStageById(boss.selectedBossId)) currentBossStageId = boss.selectedBossId;
      if (Array.isArray(boss.selectedTeam)) currentBossTeam = boss.selectedTeam.slice(0, 4);
      var dispatch = state.dispatchProgress || {};
      if (dispatch.lastMission && dispatch.lastMission.missionId) currentDispatchMissionId = dispatch.lastMission.missionId;
      if (Array.isArray(dispatch.selectedTeam)) currentDispatchTeam = dispatch.selectedTeam.slice(0, 4);
      var voyage = state.voyageProgress || {};
      if (Array.isArray(voyage.selectedTeam)) currentVoyageTeam = voyage.selectedTeam.slice(0, 4);
      var pets = state.petProgress || {};
      if (pets.selectedPetId) currentPetId = pets.selectedPetId;
      if (pets.selectedOutfitId) currentPetOutfitId = pets.selectedOutfitId;
      if (pets.selectedEffectId) currentPetEffectId = pets.selectedEffectId;
    }
    function activatePlayer(name, payload) {
      currentPlayerName = name;
      currentPlayerToken = payload && payload.token ? payload.token : "local-session";
      storeName(name);
      game = createClientGame(ensurePlayerState(payload && payload.state ? payload.state : localGet(name) || undefined));
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
    function tutorialProgress(state) {
      state.tutorialProgress = state.tutorialProgress || { version: data.updateVersion || "2.0-2.5", completed: false, rewardClaimed: false, completedAt: null };
      return state.tutorialProgress;
    }
    function renderTutorial() {
      if (!game || !byId("tutorial-steps")) return;
      var state = game.getState();
      var progress = tutorialProgress(state);
      var done = progress.rewardClaimed === true;
      var reward = data.tutorialReward || { starSand: 920, characterExp: 600 };
      byId("tutorial-status").textContent = done ? "已完成 · 獎勵已領取" : "尚未完成";
      byId("tutorial-summary").innerHTML = "<div><span class=\"eyebrow\">START HERE</span><strong>先了解星界之律的主要循環，再開始你的旅程。</strong><p>這份教學會把登入保存、劇情獎勵、回覆召集、角色培養、戰力判讀、自走棋試煉、星海迷航與星伴培育整理在同一頁。已經熟悉系統的玩家也能直接完成並領取一次獎勵。</p></div><span class=\"tutorial-progress-mark\">" + (done ? "✓ 已完成" : (data.tutorialSteps || []).length + " 個重點") + "</span>";
      byId("tutorial-steps").innerHTML = (data.tutorialSteps || []).map(function (step, index) { return "<article class=\"tutorial-step-card\"><span class=\"tutorial-step-index\">" + String(index + 1).padStart(2, "0") + "</span><span class=\"tutorial-step-icon\">" + escapeHtml(step.icon) + "</span><h3>" + escapeHtml(step.title) + "</h3><p>" + escapeHtml(step.copy) + "</p></article>"; }).join("");
      byId("tutorial-reward").innerHTML = "<div><span class=\"eyebrow\">FIRST FLIGHT REWARD</span><strong>完成新手教學可獲得 " + escapeHtml(rewardText(reward)) + "</strong><p>獎勵只會發放一次，並直接儲存到目前登入的玩家帳號。</p></div><button class=\"primary-action\" id=\"complete-tutorial\" type=\"button\"" + (done ? " disabled" : "") + ">" + (done ? "已完成並領取" : "完成教學並領取獎勵") + "</button>";
    }
    function renderAnnouncements() {
      if (!byId("announcement-list")) return;
      var list = data.announcements || [];
      byId("announcement-list").innerHTML = list.length ? list.map(function (item, index) { return "<article class=\"announcement-card " + (index === 0 ? "featured" : "") + "\"><div class=\"announcement-card-head\"><span class=\"announcement-badge\">" + escapeHtml(item.badge) + "</span><span>" + escapeHtml(item.date) + "</span></div><h3>" + escapeHtml(item.title) + "</h3><p>" + escapeHtml(item.copy) + "</p><div class=\"announcement-highlights\">" + (item.highlights || []).map(function (highlight) { return "<span>✓ " + escapeHtml(highlight) + "</span>"; }).join("") + "</div><div class=\"announcement-reward\"><span>獎勵／重點</span><strong>" + escapeHtml(item.reward) + "</strong></div></article>"; }).join("") : "<div class=\"empty\">目前沒有公告。</div>";
    }
    function completeTutorial() {
      if (!game || !currentPlayerName) { showGate(); return; }
      var reward = data.tutorialReward || { starSand: 920, characterExp: 600 };
      if (remoteMode) {
        apiRequest("/api/player/tutorial-complete", {}).then(function (payload) { updateGameFromState(payload.state); renderTutorial(); renderLobby(); render(); showMessage(payload.alreadyClaimed ? "新手教學獎勵已經領取過。" : "新手教學完成：已獲得 " + rewardText(payload.reward || reward) + "。", false); }).catch(function (error) { showMessage(error.message, true); });
        return;
      }
      try {
        var result = game.completeTutorial({ version: data.updateVersion || "2.0-2.5", reward: reward });
        updateGameFromState(result.state);
        saveLocalState();
        renderTutorial(); renderLobby(); render();
        showMessage(result.alreadyClaimed ? "新手教學獎勵已經領取過。" : "新手教學完成：已獲得 " + rewardText(result.reward) + "。", false);
      } catch (error) { showMessage(error.message, true); }
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
      var tutorialDone = tutorialProgress(state).rewardClaimed === true;
      var tutorialQuick = byId("open-tutorial");
      if (tutorialQuick) tutorialQuick.classList.toggle("completed", tutorialDone);
      if (byId("tutorial-quick-status")) byId("tutorial-quick-status").textContent = tutorialDone ? "已完成 · 可重看規則" : "完成教學可領獎";
      if (byId("tutorial-quick-badge")) byId("tutorial-quick-badge").textContent = tutorialDone ? "DONE" : "GUIDE";
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
      var sceneButtons = chapter.scenes.map(function (item) { return "<button class=\"story-scene-button " + (item.id === scene.id ? "active " : "") + (sceneClaimed(state, chapter.id, item.id) ? "claimed" : "") + "\" data-scene-id=\"" + escapeHtml(item.id) + "\" type=\"button\"><span>" + escapeHtml(item.title) + "</span><small>" + (sceneClaimed(state, chapter.id, item.id) ? "已領取本幕獎勵" : "完成後 +100 星砂・+650 經驗") + "</small></button>"; }).join("");
      var fullChapter = chapter.scenes.map(function (item, index) {
        return "<article class=\"complete-scene-block\"><span class=\"scene-label\">SCENE " + String(index + 1).padStart(2, "0") + "</span><h4>" + escapeHtml(item.title) + "</h4>" + storyBodyMarkup(item.body, "story-body story-full-body") + "</article>";
      }).join("");
      var characterCount = chapter.characters.filter(function (id) { return Boolean(data.cards[id]); }).length;
      var length = storyLength(chapter);
      var sourceLabel = chapter.sourceStatus === "document-tab-missing" ? "補充正文" : "文件正文";
      byId("story-reader").innerHTML = "<div class=\"story-reader-kicker\"><span>" + escapeHtml(storyVersionLabel(chapter) + " / " + (chapter.type === "main" ? "主線" : "支線") + " / " + chapter.region) + "</span><span class=\"story-source-badge\">" + sourceLabel + "</span></div><h3>" + escapeHtml(chapter.title) + "</h3><p class=\"story-summary\">" + escapeHtml(chapter.summary) + "</p><div class=\"story-reader-meta\"><span>正文 <b>" + number(length) + " 字</b></span><span>約 <b>" + Math.max(1, Math.ceil(length / 500)) + " 分鐘</b></span><span><b>" + chapter.scenes.length + " 幕</b></span><span><b>" + characterCount + " 名角色</b></span></div><div class=\"story-character-tags\">" + chapter.characters.map(function (id) { var card = data.cards[id]; return card ? "<span>" + escapeHtml(card.name) + "｜" + escapeHtml(card.element) + "</span>" : ""; }).join("") + "</div><div class=\"story-scene-reader\"><span class=\"scene-label\">SCENE " + escapeHtml(scene.id.toUpperCase()) + "</span><h4>" + escapeHtml(scene.title) + "</h4>" + storyBodyMarkup(scene.body) + "<div class=\"story-reward-bar\"><span>首次看完獎勵</span><strong>+100 星砂・+650 角色經驗</strong><button class=\"primary-action\" data-complete-scene=\"" + escapeHtml(scene.id) + "\" type=\"button\"" + (claimed ? " disabled" : "") + ">" + (claimed ? "已領取" : "看完本幕並領取") + "</button></div></div><div class=\"story-scene-list\"><div class=\"story-scene-heading\"><span>本章幕次導覽</span><small>每幕首次完成可獲得 100 星砂與 650 角色經驗；正文可向下捲動閱讀</small></div>" + sceneButtons + "</div><section class=\"story-full-chapter\"><div class=\"story-full-heading\"><span>本章完整劇情</span><small>已整理成長篇閱讀格式，所有幕次內容都會顯示</small></div><div>" + fullChapter + "</div></section>";
    }
    function moveStoryPlotToTop() {
      var reader = byId("story-reader");
      if (!reader) return;
      var plot = reader.querySelector(".story-scene-reader");
      var sceneList = reader.querySelector(".story-scene-list");
      if (plot && sceneList) reader.insertBefore(plot, sceneList);
    }
    function decorateStoryMythic(chapter) {
      if (!chapter || !chapter.mythicTheme) return;
      var reader = byId("story-reader");
      var kicker = reader && reader.querySelector(".story-reader-kicker");
      if (kicker && !kicker.querySelector(".story-mythic-badge")) {
        var badge = document.createElement("span");
        badge.className = "story-mythic-badge";
        badge.textContent = "北境神話篇｜" + chapter.mythicTheme;
        kicker.appendChild(badge);
      }
      var summary = reader && reader.querySelector(".story-summary");
      if (summary && chapter.mythicNote && !reader.querySelector(".story-mythic-note")) {
        var note = document.createElement("div");
        note.className = "story-mythic-note";
        note.innerHTML = "<strong>神話意象｜" + escapeHtml(chapter.mythicMotif || chapter.mythicTheme) + "</strong><span>" + escapeHtml(chapter.mythicNote) + "</span>";
        summary.insertAdjacentElement("afterend", note);
      }
    }
    function decorateStoryRoadmap() {
      var container = byId("story-chapters");
      if (!container) return;
      var locked = lockedStoryChapterList();
      var cards = container.querySelectorAll(".story-roadmap-card");
      locked.forEach(function (chapter, index) {
        if (!chapter.mythicTheme || !cards[index]) return;
        var small = cards[index].querySelector("small");
        if (small) small.textContent += " · 北境神話篇｜" + chapter.mythicTheme;
      });
      var heading = container.querySelector(".story-roadmap-heading");
      if (heading && locked.some(function (chapter) { return chapter.mythicTheme; })) heading.textContent = "後續版本檔案｜4.0 起：北境神話篇";
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
      decorateStoryRoadmap();
      byId("story-view-status").textContent = currentStoryTab === "main" ? "主線 1.0–2.5｜3.0–5.5 已建檔" : "支線 1.0–2.5｜3.0–5.5 已建檔";
      renderStoryReader(state, current);
      decorateStoryMythic(current);
      moveStoryPlotToTop();
    }
    function renderCharacters() {
      if (!game) return;
      var state = game.getState(); var owned = data.activeCards.filter(function (card) { return (state.collection[card.id] || 0) > 0; }).length;
      byId("character-view-status").textContent = "已取得 " + owned + " 名";
      byId("character-exp").textContent = number(state.resources.characterExp);
      var personalCoreTotal = data.activeCards.reduce(function (sum, card) { var progress = state.characterProgress[card.id] || {}; return sum + (Number(progress.constellationCore) || 0); }, 0);
      if (byId("character-core")) byId("character-core").textContent = number(personalCoreTotal);
      byId("character-star-marks").textContent = number(state.resources.starMarks);
      byId("character-list").innerHTML = data.activeCards.map(function (card) {
        var copies = state.collection[card.id] || 0; var progress = state.characterProgress[card.id] || { level: 1, affinity: 0, constellation: 0, constellationCore: 0, breakthrough: false }; var cost = developmentCost(card, progress.level); var requirement = data.characterBreakthroughs[card.id]; var materialAmount = requirement ? Number(state.breakthroughMaterials[requirement.materialId] || 0) : 0; var universalAmount = Number(state.breakthroughMaterials["universal-core"] || 0); var availableBreakthrough = materialAmount + universalAmount; var needBreakthrough = Boolean(copies && progress.level >= api.DEFAULT_RULES.development.breakthroughLevel && !progress.breakthrough); var atMax = Boolean(copies && progress.level >= api.DEFAULT_RULES.development.maxLevel); var power = characterPower(card.id, state); var style = "--accent:" + escapeHtml(card.accent || "#9e92ff") + (card.image ? ";--card-image:url(\"" + escapeHtml(card.image) + "\")" : "");
        var growthAction;
        if (!copies) growthAction = "<button class=\"secondary-action growth-button\" data-develop-character=\"" + escapeHtml(card.id) + "\" type=\"button\" disabled>尚未取得</button>";
        else if (needBreakthrough) growthAction = "<button class=\"secondary-action growth-button breakthrough-growth-button\" data-breakthrough-character=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (availableBreakthrough < Number(requirement.cost || 0) ? " disabled" : "") + ">突破　" + escapeHtml(requirement.materialName) + " " + requirement.cost + "（通用 " + universalAmount + "）</button>";
        else growthAction = "<button class=\"secondary-action growth-button\" data-develop-character=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (atMax || state.resources.characterExp < cost.characterExp ? " disabled" : "") + ">" + (atMax ? "已達 90 等" : "升級　" + cost.characterExp + " 經驗") + "</button>";
        return "<article class=\"character-growth-card " + (copies ? "owned" : "locked") + " rarity-" + card.rarity + "\" data-open-character=\"" + escapeHtml(card.id) + "\" tabindex=\"0\"><div class=\"character-growth-art\" style=\"" + style + "\"><span>" + escapeHtml(card.element) + "</span><strong>" + escapeHtml(card.name) + "</strong><small>" + escapeHtml(card.romanizedName) + "</small></div><div class=\"character-growth-body\"><div><span class=\"rarity-label\">" + "★".repeat(card.rarity) + "</span><h3>" + escapeHtml(card.name) + "</h3><p>" + escapeHtml(card.note) + "</p></div><div class=\"growth-stats\"><span>戰力 <b>" + number(power) + "</b></span><span>等級 <b>Lv." + progress.level + " / 90</b></span><span>命座 <b>" + (progress.constellation || 0) + "/6</b></span><span>持有 <b>×" + copies + "</b></span></div><div class=\"growth-actions\">" + growthAction + "</div></div></article>";
      }).join("");
      if (currentCharacterId) { renderCharacterDetail(currentCharacterId); }
    }
    function characterStatsFor(cardId, progress) {
      var base = data.characterBattleStats[cardId];
      if (!base) return null;
      var level = Math.max(1, Number(progress.level) || 1); var constellation = Math.max(0, Number(progress.constellation) || 0); var isFourStar = base.rarity === 4; var growth = base.growthRates || {}; var mainGrowth = Number(growth.main) || (isFourStar ? 0.04 : 0.03); var defenseGrowth = Number(growth.defense) || (isFourStar ? 0.03 : 0.022); var speedGrowth = Number(growth.speed) || (isFourStar ? 0.012 : 0.009); var multiplier = 1 + (level - 1) * mainGrowth + constellation * (isFourStar ? 0.05 : 0.03);
      return { maxHp: Math.round(base.maxHp * multiplier), attack: Math.round(base.attack * multiplier), defense: Math.round(base.defense * (1 + (level - 1) * defenseGrowth + constellation * (isFourStar ? 0.045 : 0.027))), speed: Math.round(base.speed * (1 + (level - 1) * speedGrowth + constellation * (isFourStar ? 0.016 : 0.01))), role: base.role, attackName: base.attackName, skillName: base.skillName, skillEffect: base.skillEffect };
    }
    function characterPower(cardId, state) {
      var stats = effectiveBattleStats(state);
      return window.StarshipBattle && stats[cardId] ? window.StarshipBattle.teamPower([cardId], stats) : 0;
    }
    function seasonSkinFor(cardId) {
      var skin = data.voyageConfig && data.voyageConfig.seasonSkin;
      return skin && skin.characterId === cardId ? skin : null;
    }
    function characterSkinUnlocked(state, skin) {
      return Boolean(skin && state && state.cosmetics && state.cosmetics.skins && state.cosmetics.skins[skin.id]);
    }
    function characterSkinMarkup(card, state, skin, active) {
      if (!skin) return "<section class=\"character-skin-panel skin-empty\"><div><span class=\"eyebrow\">CHARACTER OUTFIT</span><h4>目前沒有專屬造型</h4><p>之後有角色造型時，會在這裡顯示預覽與取得方式。</p></div></section>";
      var unlocked = characterSkinUnlocked(state, skin); var previewImage = skin.previewImage || card.image || card.backgroundImage || ""; var status = unlocked ? "已解鎖" : "尚未解鎖"; var buttonLabel = active ? "顯示原始立繪" : (unlocked ? "查看造型立繪" : "預覽造型");
      return "<section class=\"character-skin-panel " + (active ? "skin-active " : "") + (unlocked ? "skin-unlocked" : "skin-locked") + "\" style=\"--skin-accent:" + escapeHtml(skin.accent || card.accent || "#9e92ff") + "\"><div class=\"character-skin-preview\"><img src=\"" + escapeHtml(previewImage) + "\" alt=\"" + escapeHtml(card.name + "「" + skin.name + "」造型預覽") + "\" loading=\"lazy\"><div class=\"skin-preview-ribbon\"><span>SEASON OUTFIT</span><strong>流光檔案</strong></div><i class=\"skin-preview-orbit\"></i></div><div class=\"character-skin-copy\"><div class=\"skin-copy-heading\"><div><span class=\"eyebrow\">角色造型</span><h4>" + escapeHtml(skin.name) + "</h4></div><b class=\"skin-status\">" + status + "</b></div><p>" + escapeHtml(skin.description || "只改變角色外觀，不改變戰鬥數值。") + "</p><small>取得方式｜" + escapeHtml(skin.source || "特殊結局獎勵") + "</small><button class=\"secondary-action skin-preview-button\" data-skin-preview=\"" + escapeHtml(skin.id) + "\" type=\"button\" aria-pressed=\"" + (active ? "true" : "false") + "\">" + buttonLabel + "</button></div></section>";
    }
    function renderCharacterDetail(cardId) {
      var state = game && game.getState(); var card = data.cards[cardId]; var detail = byId("character-detail");
      if (!state || !card || !detail) return;
      var copies = state.collection[card.id] || 0; var progress = state.characterProgress[card.id] || { level: 1, affinity: 0, constellation: 0, constellationCore: 0, breakthrough: false }; var cost = developmentCost(card, progress.level); var requirement = data.characterBreakthroughs[card.id]; var materialAmount = requirement ? Number(state.breakthroughMaterials[requirement.materialId] || 0) : 0; var universalAmount = Number(state.breakthroughMaterials["universal-core"] || 0); var needBreakthrough = Boolean(copies && progress.level >= api.DEFAULT_RULES.development.breakthroughLevel && !progress.breakthrough); var atMax = Boolean(copies && progress.level >= api.DEFAULT_RULES.development.maxLevel); var stats = characterStatsFor(card.id, progress) || {}; var power = characterPower(card.id, state);
      // 角色詳情直接使用原始 PNG，避免 SVG 內嵌立繪在部分手機瀏覽器被阻擋；
      // 名稱、星級與元素固定疊在畫面底部，仍保留完整立繪比例。
      var skin = seasonSkinFor(card.id); var skinActive = Boolean(skin && currentCharacterSkinId === skin.id); var image = skinActive && skin.previewImage ? skin.previewImage : card.image || card.backgroundImage;
      var portraitLabel = "<div class=\"portrait-label\"><strong>" + escapeHtml(card.name) + "</strong><span>" + "★".repeat(card.rarity) + "　" + escapeHtml(card.element) + "</span><small>" + escapeHtml(card.romanizedName) + "</small></div>";
      var developAction = !copies ? "<button class=\"primary-action\" type=\"button\" disabled>尚未取得</button>" : needBreakthrough ? "<button class=\"primary-action\" type=\"button\" disabled>請先完成 80 等突破</button>" : atMax ? "<button class=\"primary-action\" type=\"button\" disabled>已達現行上限 90 等</button>" : "<button class=\"primary-action\" data-detail-develop=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (state.resources.characterExp < cost.characterExp ? " disabled" : "") + ">升級　" + cost.characterExp + " 角色經驗</button>";
      var breakthroughAction = needBreakthrough && requirement ? "<button class=\"secondary-action breakthrough-detail-action\" data-detail-breakthrough=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (materialAmount + universalAmount < Number(requirement.cost || 0) ? " disabled" : "") + ">突破　" + escapeHtml(requirement.materialName) + " " + requirement.cost + "（通用 " + universalAmount + "）</button>" : "";
      var breakthroughNote = requirement ? (progress.breakthrough ? "已完成 80 等突破，可繼續升到 90 等" : "建議 Boss｜" + escapeHtml((bossStageById(requirement.bossId) || {}).name || "未設定") + "　指定材料｜" + escapeHtml(requirement.materialName) + " " + materialAmount + "/" + requirement.cost + "　通用印記｜" + universalAmount + "（可替代）") : "突破材料設定尚未載入";
      detail.innerHTML = "<button class=\"detail-close small-button\" data-close-character type=\"button\">× 關閉角色詳情</button><div class=\"character-detail-grid\"><div class=\"character-portrait-frame " + (skinActive ? "portrait-skin-active" : "") + "\"><img src=\"" + escapeHtml(image || "") + "\" alt=\"" + escapeHtml(card.name + (skinActive && skin ? "「" + skin.name + "」" : "") + " 完整立繪，" + "★".repeat(card.rarity) + "，" + card.element) + "\" loading=\"eager\">" + (skinActive && skin ? "<span class=\"portrait-skin-badge\">造型預覽</span>" : "") + portraitLabel + "</div><div class=\"character-detail-copy\"><p class=\"eyebrow\">CHARACTER DEVELOPMENT / " + escapeHtml(card.romanizedName.toUpperCase()) + "</p><h3>" + escapeHtml(card.name) + "</h3><p class=\"detail-note\">" + escapeHtml(card.note) + "</p><div class=\"detail-progress\"><span>戰力 <b>" + number(power) + "</b></span><span>等級 <b>Lv." + progress.level + " / 90</b></span><span>命座 <b>" + (progress.constellation || 0) + " / 6</b></span><span>持有 <b>×" + copies + "</b></span></div><div class=\"detail-stat-grid\"><span>生命 <b>" + number(stats.maxHp || 0) + "</b></span><span>攻擊 <b>" + number(stats.attack || 0) + "</b></span><span>防禦 <b>" + number(stats.defense || 0) + "</b></span><span>速度 <b>" + number(stats.speed || 0) + "</b></span><span>定位 <b>" + escapeHtml(stats.role || "—") + "</b></span><span>攻擊手段 <b>" + escapeHtml(stats.attackName || "—") + "</b></span></div><div class=\"detail-skill\"><span>技能｜" + escapeHtml(stats.skillName || "—") + "</span><p>" + escapeHtml(stats.skillEffect || "尚未登錄") + "</p></div>" + characterSkinMarkup(card, state, skin, skinActive) + "<div class=\"breakthrough-detail-note\">" + breakthroughNote + "</div><div class=\"detail-actions\">" + developAction + breakthroughAction + "</div><p class=\"detail-resource-hint\">4★每級提升幅度與經驗成本較高；3★較容易培養。重複抽到角色時命座會立即自動增加，不需要在這裡再次按提升；角色到 80 等後，必須取得指定 Boss 的突破材料才能繼續升到 90 等。</p></div></div>";
      detail.hidden = false;
      detail.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    function openCharacterDetail(cardId) { currentCharacterId = cardId; currentCharacterSkinId = ""; renderCharacterDetail(cardId); }
    function updateStorySelection(chapterId) {
      var chapter = storyChapterById(chapterId); if (!chapter || chapter.releaseOpen === false) return;
      currentStoryChapterId = chapterId; currentStorySceneId = chapter.scenes[0].id;
      var state = game.getState(); storyProgress(state).currentChapter = chapterId;
      if (remoteMode) { apiRequest("/api/player/story-progress", { action: "select", chapterId: chapterId }).then(function (payload) { updateGameFromState(payload.state); renderStory(); renderLobby(); }).catch(function () { renderStory(); }); }
      else { updateGameFromState(state); saveLocalState(); renderStory(); renderLobby(); }
    }
    function completeStoryScene(chapterId, sceneId) {
      if (remoteMode) {
        apiRequest("/api/player/story-progress", { action: "complete", chapterId: chapterId, sceneId: sceneId }).then(function (payload) { updateGameFromState(payload.state); renderStory(); renderLobby(); renderCharacters(); showMessage(payload.alreadyClaimed ? "這一幕的獎勵已領取。" : "劇情完成：" + rewardText(payload.reward || {}) + "並儲存到帳號。", false); }).catch(function (error) { showMessage(error.message, true); });
        return;
      }
      var chapter = storyChapterById(chapterId); if (!chapter || chapter.releaseOpen === false) { showMessage("這個版本的劇情已建檔，但尚未開放。", true); return; }
      var state = game.getState(); var progress = storyProgress(state); var key = sceneKey(chapterId, sceneId);
      if (progress.completedScenes[key]) { showMessage("這一幕的星砂獎勵已領取。", false); return; }
      var storyReward = { starSand: 100, characterExp: 650 };
      progress.currentChapter = chapterId; progress.completedScenes[key] = { completedAt: new Date().toISOString(), starSand: storyReward.starSand, characterExp: storyReward.characterExp }; state.resources.starSand += storyReward.starSand; state.resources.characterExp += storyReward.characterExp;
      if (chapterId === "main-1-0" && !state.recruitment.story10ChoiceClaimed) state.recruitment.story10ChoiceAvailable = true;
      updateGameFromState(state); saveLocalState(); renderStory(); renderLobby(); renderCharacters(); showMessage("劇情完成：" + rewardText(storyReward) + "並儲存到這個瀏覽器。", false);
    }
    function developCharacter(cardId) {
      currentCharacterId = cardId;
      if (remoteMode) { apiRequest("/api/player/character-development", { cardId: cardId }).then(function (payload) { updateGameFromState(payload.state); renderCharacters(); renderLobby(); showMessage("角色升級完成，進度已儲存。", false); }).catch(function (error) { showMessage(error.message, true); }); return; }
      try { game.developCharacter({ cardId: cardId }); saveLocalState(); renderCharacters(); renderLobby(); showMessage("角色升級完成，進度已儲存到這個瀏覽器。", false); } catch (error) { showMessage(error.message, true); }
    }
    function breakthroughCharacter(cardId) {
      currentCharacterId = cardId;
      if (remoteMode) { apiRequest("/api/player/character-breakthrough", { cardId: cardId }).then(function (payload) { updateGameFromState(payload.state); renderCharacters(); renderBoss(); renderLobby(); showMessage("角色已完成 80 等突破，可以繼續升到 90 等。", false); }).catch(function (error) { showMessage(error.message, true); }); return; }
      try { game.breakthroughCharacter({ cardId: cardId }); saveLocalState(); renderCharacters(); renderBoss(); renderLobby(); showMessage("角色已完成 80 等突破，可以繼續升到 90 等。", false); } catch (error) { showMessage(error.message, true); }
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
      var mythicArt = {
        "frost-wolf": "./assets/enemies/frost-wolf.svg",
        "world-root": "./assets/enemies/world-root.svg",
        "fate-weaver": "./assets/enemies/fate-weaver.svg",
        "rainbow-warden": "./assets/enemies/rainbow-warden.svg",
        "fire-giant": "./assets/enemies/fire-giant.svg"
      };
      if (enemy && mythicArt[enemy.mythicClass]) return mythicArt[enemy.mythicClass];
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
        var mythicBadge = enemy.mythicClass ? "<span class=\"enemy-mythic-badge\">北境神話篇</span>" : "";
        return "<article class=\"enemy-intel-card\"><div class=\"enemy-intel-art\"><img src=\"" + escapeHtml(enemyArtFor(enemy)) + "\" alt=\"" + escapeHtml(enemy.name + " 敵人圖鑑") + "\"><span>×" + number(enemy.count || 1) + "</span></div><div class=\"enemy-intel-copy\"><strong>" + escapeHtml(enemy.name) + "</strong>" + mythicBadge + "<small>敵方單位 · 速度 " + number(enemy.speed || 0) + "</small><div><span>HP <b>" + number(hp) + "</b></span><span>攻 <b>" + number(enemy.attack || 0) + "</b></span><span>防 <b>" + number(enemy.defense || 0) + "</b></span></div><em>威脅值 " + number(threat) + " · 會依關卡特性行動</em></div></article>";
      }).join("");
    }
    function decorateTrialMythic(stage) {
      if (!stage || !stage.mythicTheme) return;
      var details = byId("trial-stage-details");
      var kicker = details && details.querySelector(".trial-stage-kicker");
      if (kicker && !kicker.querySelector(".trial-mythic-badge")) {
        var badge = document.createElement("span");
        badge.className = "trial-mythic-badge";
        badge.textContent = "北境神話篇｜" + stage.mythicTheme;
        kicker.appendChild(badge);
      }
      var callout = details && details.querySelector(".trial-rule-callout");
      if (callout && stage.mythicNote && !callout.querySelector(".trial-mythic-note")) {
        var note = document.createElement("div");
        note.className = "trial-mythic-note";
        note.innerHTML = "<strong>神話敵群</strong><span>" + escapeHtml(stage.mythicNote) + "</span>";
        callout.appendChild(note);
      }
      var stageButton = byId("trial-stages").querySelector('[data-trial-stage="' + stage.id + '"]');
      if (stageButton && !stageButton.querySelector(".trial-mythic-rail-label")) {
        var small = stageButton.querySelector("small");
        if (small) {
          small.textContent += " · 北境神話篇";
          small.classList.add("trial-mythic-rail-label");
        }
      }
    }
    function renderTrialBattleResult(state) {
      var container = byId("trial-battle-result"); var battle = trialProgress(state).lastBattle;
      if (!battle || Number(battle.stageId) !== Number(currentTrialStageId)) { container.innerHTML = "<div class=\"trial-result-empty\">完成一場自走棋戰鬥後，戰報會顯示在這裡。</div>"; return; }
      var rewardExp = Number((trialStageById(battle.stageId) || {}).reward && (trialStageById(battle.stageId) || {}).reward.characterExp || data.trialReward && data.trialReward.characterExp || 0);
      var reward = battle.won ? "本次獎勵：+" + number(Number((trialStageById(battle.stageId) || {}).reward && (trialStageById(battle.stageId) || {}).reward.starSand || data.trialReward && data.trialReward.starSand || 0)) + " 星砂、+" + number(rewardExp) + " 角色經驗" : "本次未通關，不會扣除挑戰次數";
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
      byId("trial-stage-details").innerHTML = "<div class=\"trial-stage-kicker\"><span>TRIAL " + String(current.id).padStart(2, "0") + "</span><span>" + escapeHtml(current.region) + "</span>" + (current.finalStage ? "<span>FINAL</span>" : "") + "</div><h3>" + escapeHtml(current.name) + "</h3><p>敵方編成：" + escapeHtml(enemyText) + "</p><div class=\"trial-rule-callout\"><strong>環境｜" + escapeHtml(current.environment || "一般試煉") + "</strong><span>" + escapeHtml(current.environmentEffect || "沒有額外環境效果。") + "</span><strong>敵方特性｜" + escapeHtml(current.enemyTrait || "一般") + "</strong><span>" + escapeHtml(current.enemyTraitEffect || "沒有額外特性。") + "</span></div><div class=\"trial-detail-stats\"><span>推薦戰力 <b>" + number(current.recommendedPower) + "</b></span><span>本版本獎勵 <b>" + number(Number(current.reward && current.reward.starSand || data.trialReward && data.trialReward.starSand || 0)) + " 星砂 + " + number(trialCharacterExp) + " 經驗</b></span><span>可領次數 <b>" + attempts + " / " + maxRewards + "</b></span></div>";
      decorateTrialMythic(current);
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
      var trialStarSand = Number(stage.reward && stage.reward.starSand || data.trialReward && data.trialReward.starSand || 0);
      var trialCharacterExp = Number(stage.reward && stage.reward.characterExp || data.trialReward && data.trialReward.characterExp || 0);
      if (remoteMode) {
        apiRequest("/api/player/trial-battle", { stageId: stage.id, team: currentTrialTeam }).then(function (payload) { updateGameFromState(payload.state); renderTrial(); renderLobby(); renderCharacters(); showMessage(payload.battle.won ? "星界試煉通關：已獲得 " + trialStarSand + " 星砂與 " + trialCharacterExp + " 角色經驗。" : "本次試煉未通關，可以調整編隊後再次挑戰。", !payload.battle.won); }).catch(function (error) { showMessage(error.message, true); });
        return;
      }
      try {
        var state = game.getState(); var progress = trialProgress(state); var attempts = trialAttempts(state, stage.id); var maxRewards = data.trialMaxRewards || 10;
        if (!trialUnlocked(state, stage.id)) throw new Error("請先通關前一關");
        if (attempts >= maxRewards) throw new Error("本關在目前版本已完成 10 次，請等待下次遊戲更新重置挑戰次數");
        if (!currentTrialTeam.length) throw new Error("至少派出 1 名角色才能開始戰鬥");
        if (currentTrialTeam.some(function (id) { return !(state.collection[id] > 0) || !data.characterBattleStats[id]; })) throw new Error("只能派出已取得且已開放的角色");
        var battle = window.StarshipBattle.simulateBattle({ team: currentTrialTeam, stats: effectiveBattleStats(state), stage: stage }); progress.selectedTeam = currentTrialTeam.slice(); progress.lastBattle = battle;
        if (battle.won) { progress.attempts[stage.id] = attempts + 1; if (progress.clearedStages.indexOf(stage.id) < 0) progress.clearedStages.push(stage.id); progress.bestStage = Math.max(progress.bestStage || 0, stage.id); state.resources.starSand += trialStarSand; state.resources.characterExp += trialCharacterExp; if (stage.id === 10 && !state.recruitment.trial10ChoiceClaimed) state.recruitment.trial10ChoiceAvailable = true; }
        updateGameFromState(state); saveLocalState(); renderTrial(); renderLobby(); renderCharacters(); showMessage(battle.won ? "星界試煉通關：已獲得 " + trialStarSand + " 星砂與 " + trialCharacterExp + " 角色經驗。" : "本次試煉未通關，可以調整編隊後再次挑戰。", !battle.won);
      } catch (error) { showMessage(error.message, true); }
    }
    function bossProgress(state) {
      var version = data.bossVersion || data.updateVersion || "2.0-2.5";
      state.bossProgress = state.bossProgress || { version: version, selectedBossId: "boss-star-warden", selectedTeam: [], attempts: {}, lastBattle: null };
      state.bossProgress.selectedBossId = typeof state.bossProgress.selectedBossId === "string" ? state.bossProgress.selectedBossId : "boss-star-warden";
      state.bossProgress.selectedTeam = Array.isArray(state.bossProgress.selectedTeam) ? state.bossProgress.selectedTeam : [];
      state.bossProgress.attempts = state.bossProgress.attempts || {};
      return state.bossProgress;
    }
    function bossAttempts(state, bossId) { return Number(bossProgress(state).attempts[bossId] || 0); }
    function renderBossBattleResult(state) {
      var container = byId("boss-battle-result"); var battle = bossProgress(state).lastBattle;
      if (!container || !battle || battle.stageId !== currentBossStageId) { if (container) container.innerHTML = "<div class=\"trial-result-empty\">完成一場 Boss 自走棋戰鬥後，戰報會顯示在這裡。</div>"; return; }
      var stage = bossStageById(battle.stageId) || {}; var reward = stage.reward || {};
      var rewardCopy = battle.won ? "本次獎勵：+" + number(reward.amount || 0) + " " + escapeHtml(reward.materialName || "突破材料") + "、+" + number(reward.universalAmount || 1) + " 星界通用突破印記、+" + number(reward.characterExp || 0) + " 角色經驗" : "本次未通關，不會取得突破材料";
      var synergy = battle.synergy === undefined ? "—" : Math.round(Number(battle.synergy) * 100) + "%";
      container.innerHTML = "<div class=\"trial-result-header " + (battle.won ? "won" : "lost") + "><div><span class=\"eyebrow\">BOSS REPORT / " + (battle.won ? "CLEAR" : "RETRY") + "</span><strong>" + (battle.won ? "Boss 挑戰成功" : "Boss 挑戰失敗") + " · " + escapeHtml(stage.name || "Boss") + " · " + battle.rounds + " 回合</strong><small>" + rewardCopy + "｜隊伍協同 " + escapeHtml(synergy) + "</small></div><span class=\"battle-power\">隊伍戰力 " + number(battle.teamPower) + "</span></div><details><summary>查看 Boss 自走棋戰鬥紀錄</summary><div class=\"battle-log\">" + (battle.logs || []).map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") + "</div></details>";
    }
    function renderBoss() {
      if (!game || !byId("boss-stages")) return;
      var state = game.getState(); var progress = bossProgress(state); var bosses = data.bossStages || []; var current = bossStageById(currentBossStageId) || bossStageById(progress.selectedBossId) || bosses[0];
      if (!current) { byId("boss-stages").innerHTML = "<div class=\"empty\">目前沒有開放的 Boss。</div>"; return; }
      // currentBossStageId is the UI selection. Do not write only to the clone returned
      // by getState(); the selection is persisted by the stage-click handler below.
      currentBossStageId = current.id;
      var maxRewards = data.bossMaxRewards || 10; var attempts = bossAttempts(state, current.id); var reward = current.reward || {};
      byId("boss-view-status").textContent = current.name + " · " + attempts + " / " + maxRewards + " 次";
      byId("boss-stages").innerHTML = bosses.map(function (stage) { var count = bossAttempts(state, stage.id); return "<button class=\"trial-stage-button boss-stage-button " + (stage.id === current.id ? "active " : "") + (count >= maxRewards ? "cleared" : "") + "\" data-boss-stage=\"" + escapeHtml(stage.id) + "\" type=\"button\"><span class=\"trial-stage-number\">" + escapeHtml(stage.bossLevel ? "L" + stage.bossLevel : "♢") + "</span><span><strong>" + escapeHtml(stage.name) + "</strong><small>" + escapeHtml(stage.region) + " · Boss Lv." + number(stage.bossLevel || 1) + " · 參考 " + number(stage.recommendedPower) + "</small></span><em>" + count + "/" + maxRewards + "</em></button>"; }).join("");
      byId("boss-stage-details").innerHTML = "<div class=\"trial-stage-kicker\"><span>BOSS LEVEL " + number(current.bossLevel || 1) + "</span><span>" + escapeHtml(current.region) + "</span></div><h3>" + escapeHtml(current.name) + "</h3><p>" + escapeHtml(current.description || "挑戰 Boss 取得角色突破材料。") + "</p><div class=\"trial-rule-callout\"><strong>獎勵檔位｜Boss Lv." + number(current.bossLevel || 1) + "</strong><span>等級越高，專屬材料、通用突破印記與角色經驗越多；參考戰力不是突破門檻。</span><strong>環境｜" + escapeHtml(current.environment || "一般 Boss 戰") + "</strong><span>" + escapeHtml(current.environmentEffect || "觀察首領特性並安排隊伍。") + "</span><strong>敵方特性｜" + escapeHtml(current.enemyTrait || "一般") + "</strong><span>" + escapeHtml(current.enemyTraitEffect || "沒有額外特性。") + "</span></div><div class=\"trial-detail-stats\"><span>參考戰力 <b>" + number(current.recommendedPower) + "</b></span><span>勝利獎勵 <b>" + number(reward.amount || 0) + " " + escapeHtml(reward.materialName || "突破材料") + " + " + number(reward.universalAmount || 1) + " 通用印記 + " + number(reward.characterExp || 0) + " 經驗</b></span><span>本版本挑戰 <b>" + attempts + " / " + maxRewards + " 次</b></span></div>";
      if (byId("boss-enemy-intel")) byId("boss-enemy-intel").innerHTML = "<div class=\"enemy-intel-heading\"><div><span class=\"eyebrow\">BOSS INTEL</span><strong>首領情報</strong></div><small>不同角色需要的突破材料，來自不同 Boss</small></div><div class=\"enemy-intel-grid\">" + renderEnemyIntel(current) + "</div>";
      var materials = "<span>星界通用突破印記 <b>" + number(state.breakthroughMaterials["universal-core"] || 0) + "</b></span>" + (data.bossStages || []).map(function (stage) { var item = stage.reward || {}; return "<span>" + escapeHtml(item.materialName || "突破材料") + " <b>" + number(state.breakthroughMaterials[item.materialId] || 0) + "</b></span>"; }).filter(function (value, index, list) { return list.indexOf(value) === index; }).join("");
      if (byId("boss-material-inventory")) byId("boss-material-inventory").innerHTML = materials;
      var owned = data.activeCards.filter(function (card) { return state.collection[card.id] > 0 && data.characterBattleStats[card.id]; });
      currentBossTeam = currentBossTeam.filter(function (id) { return owned.some(function (card) { return card.id === id; }); }).slice(0, 4);
      byId("boss-team-count").textContent = currentBossTeam.length + " / 4 · 戰力 " + number(trialPower(currentBossTeam, state));
      byId("boss-team-list").innerHTML = owned.length ? owned.map(function (card) { var effectiveStats = effectiveBattleStats(state); var stats = effectiveStats[card.id]; var individualPower = window.StarshipBattle ? window.StarshipBattle.teamPower([card.id], effectiveStats) : 0; var selected = currentBossTeam.indexOf(card.id) >= 0; var requirement = data.characterBreakthroughs[card.id]; var style = "--accent:" + escapeHtml(card.accent || "#9e92ff") + (card.image ? ";--card-image:url(\"" + escapeHtml(card.image) + "\")" : ""); return "<button class=\"trial-team-card boss-team-card " + (selected ? "selected" : "") + "\" data-boss-character=\"" + escapeHtml(card.id) + "\" type=\"button\"><span class=\"trial-team-art\" style=\"" + style + "\"><b>" + escapeHtml(card.element) + "</b><strong>" + escapeHtml(card.name) + "</strong></span><span class=\"trial-team-copy\"><strong>" + escapeHtml(card.name) + "</strong><small class=\"character-power-line\">戰力 " + number(individualPower) + "</small><small>需要：" + escapeHtml(requirement ? requirement.materialName : "未設定") + "</small><small>" + escapeHtml(stats.role) + " · HP " + number(stats.maxHp) + "</small><small>攻 " + stats.attack + "／防 " + stats.defense + "／速 " + stats.speed + "</small></span><i>" + (selected ? "已編入" : "加入編隊") + "</i></button>"; }).join("") : "<div class=\"empty\">目前沒有可挑戰 Boss 的角色。</div>";
      var startButton = byId("start-boss-battle"); startButton.disabled = !currentBossTeam.length || attempts >= maxRewards; startButton.textContent = attempts >= maxRewards ? "本版本已完成 10 次" : "開始 Boss 自走棋";
      renderBossBattleResult(state);
    }
    function toggleBossTeam(cardId) {
      if (!game) return;
      var index = currentBossTeam.indexOf(cardId);
      if (index >= 0) currentBossTeam.splice(index, 1);
      else if (currentBossTeam.length >= 4) { showMessage("一次戰鬥最多派出 4 名角色。", true); return; }
      else currentBossTeam.push(cardId);
      var state = game.getState(); bossProgress(state).selectedTeam = currentBossTeam.slice(); updateGameFromState(state); saveLocalState(); renderBoss();
    }
    function runBossBattle() {
      if (!game || !currentPlayerName) { showGate(); return; }
      var boss = bossStageById(currentBossStageId); if (!boss) return;
      var maxRewards = data.bossMaxRewards || 10;
      if (remoteMode) {
        apiRequest("/api/player/boss-battle", { bossId: boss.id, team: currentBossTeam }).then(function (payload) { updateGameFromState(payload.state); renderBoss(); renderCharacters(); renderLobby(); showMessage(payload.battle.won ? "Boss 挑戰成功：已獲得 " + payload.reward.amount + " " + payload.reward.materialName + " 與 " + payload.reward.characterExp + " 角色經驗。" : "Boss 挑戰失敗，可以調整編隊後再次挑戰。", !payload.battle.won); }).catch(function (error) { showMessage(error.message, true); });
        return;
      }
      try {
        var state = game.getState(); var progress = bossProgress(state); var attempts = bossAttempts(state, boss.id); if (attempts >= maxRewards) throw new Error("這個 Boss 在目前版本已完成 " + maxRewards + " 次"); if (!currentBossTeam.length) throw new Error("至少派出 1 名角色才能挑戰 Boss");
        if (currentBossTeam.some(function (id) { return !(state.collection[id] > 0) || !data.characterBattleStats[id]; })) throw new Error("只能派出已取得且已開放的角色");
        var battle = window.StarshipBattle.simulateBattle({ team: currentBossTeam, stats: effectiveBattleStats(state), stage: boss }); progress.selectedBossId = boss.id; progress.selectedTeam = currentBossTeam.slice(); progress.lastBattle = battle;
        if (battle.won) { progress.attempts[boss.id] = attempts + 1; state.breakthroughMaterials[boss.reward.materialId] = Number(state.breakthroughMaterials[boss.reward.materialId] || 0) + Number(boss.reward.amount || 0); state.breakthroughMaterials["universal-core"] = Number(state.breakthroughMaterials["universal-core"] || 0) + Number(boss.reward.universalAmount || 1); state.resources.characterExp += Number(boss.reward.characterExp || 0); }
        updateGameFromState(state); saveLocalState(); renderBoss(); renderCharacters(); renderLobby(); showMessage(battle.won ? "Boss 挑戰成功：已獲得 " + boss.reward.amount + " " + boss.reward.materialName + " 與 " + boss.reward.characterExp + " 角色經驗。" : "Boss 挑戰失敗，可以調整編隊後再次挑戰。", !battle.won);
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
    function voyageProgress(state) {
      state.voyageProgress = state.voyageProgress || { version: data.voyageVersion || "2.0-2.5", status: "idle", routeId: null, route: [], nodeIndex: 0, selectedTeam: [], fragments: 0, buffs: [], flags: {}, claimedRewards: {}, lastBattle: null, lastEnding: null };
      state.voyageProgress.selectedTeam = Array.isArray(state.voyageProgress.selectedTeam) ? state.voyageProgress.selectedTeam : [];
      state.voyageProgress.route = Array.isArray(state.voyageProgress.route) ? state.voyageProgress.route : [];
      state.voyageProgress.flags = state.voyageProgress.flags || {};
      state.voyageProgress.claimedRewards = state.voyageProgress.claimedRewards || {};
      return state.voyageProgress;
    }
    function voyageRouteById(id) { return (data.voyageConfig && data.voyageConfig.routes || []).find(function (route) { return route.id === id; }); }
    function voyageBattleStage(node) { return node && node.stageId ? trialStageById(node.stageId) : null; }
    function voyageNodeTypeLabel(node) {
      if (!node) return "節點";
      if (node.final || node.type === "boss") return "終端戰";
      return ({ start: "起點", combat: "戰鬥", event: "事件", rest: "休整", shop: "商店" })[node.type] || "節點";
    }
    function voyageNodeInstruction(node, stage) {
      if (!node) return "先選擇一條航線，開始本期航程。";
      if (node.type === "combat" || node.type === "boss") {
        return node.final ? "這是最後的終端戰。確認最多 4 名角色的編隊，讀完敵方情報後進入自走棋戰鬥；勝利才能結算結局。" : "先從下方編入至少 1 名角色，再讀取敵方情報並進入自走棋戰鬥。戰鬥失敗會中止本次航程，但不會扣除角色或帳號資源。";
      }
      if (node.type === "start") return "起點沒有戰鬥，按「確認並繼續航行」進入第一個節點。真正的事件分歧會在後續出現。";
      if (node.choices && node.choices.length) return "從下方選一個處理方式。選擇會立即記錄，可能消耗星海碎片、取得臨時增益或留下結局線索，不能在同一節點重選。";
      return stage ? "確認隊伍後進入戰鬥。" : "按下方按鈕確認目前節點並繼續航行。";
    }
    function renderVoyageGuide(state, progress, node, stage) {
      var target = byId("voyage-next-step");
      if (!target) return;
      var title = "先選一條航線，準備出發";
      var copy = "選好航線後按「開始航程」；如果沒有選擇，系統會隨機抽取一條航線。";
      var nodeType = "尚未出發";
      if (progress.status === "active" && node) {
        nodeType = voyageNodeTypeLabel(node);
        if (node.type === "combat" || node.type === "boss") {
          title = currentVoyageTeam.length ? "確認敵情後，進入自走棋戰鬥" : "先編入至少 1 名角色，再進入戰鬥";
          copy = currentVoyageTeam.length ? "下方角色卡可隨時調整隊伍；確認敵人數值、特性與隊伍戰力後，按節點下方的戰鬥按鈕。" : "點擊下方角色卡加入隊伍。戰鬥節點至少需要 1 名已取得角色，最多 4 名。";
        } else if (node.choices && node.choices.length) {
          title = "閱讀選項，做出一次航行決定";
          copy = "先看清楚每個選項的條件與碎片消耗；灰色選項代表目前尚未解鎖，選擇後會立即前進。";
        } else {
          title = "按下確認，前往下一個節點";
          copy = voyageNodeInstruction(node, stage);
        }
      } else if (progress.status === "failed") {
        title = "本次航程已中止，可以重新開航";
        copy = "重新開始會建立一趟新的航程；上一趟的碎片與臨時增益不會保留，但角色、等級與帳號資源完全不受影響。";
        nodeType = "航程失敗";
      } else if (progress.status === "complete") {
        title = "本次航程已完成，可以探索其他路線";
        copy = "你可以再挑戰其他航線找不同結局；已領取的結局獎勵不會重複發放。";
        nodeType = "航程完成";
      }
      var routeLength = progress.route && progress.route.length ? progress.route.length : 0;
      var nodeNumber = progress.status === "active" ? Number(progress.nodeIndex || 0) + 1 : 0;
      target.innerHTML = "<div class=\"voyage-next-step-copy\"><span class=\"eyebrow\">CURRENT OBJECTIVE</span><strong>現在要做什麼？</strong><h3>" + escapeHtml(title) + "</h3><p>" + escapeHtml(copy) + "</p></div><div class=\"voyage-next-step-meta\"><span>節點 <b>" + (nodeNumber && routeLength ? nodeNumber + " / " + routeLength : nodeType) + "</b></span><span>類型 <b>" + escapeHtml(nodeType) + "</b></span><span>隊伍 <b>" + currentVoyageTeam.length + " / 4</b></span><span>碎片 <b>" + number((progress && progress.fragments) || 0) + " </b></span></div>";
    }
    function renderVoyageResult(state) {
      var container = byId("voyage-result"); if (!container) return;
      var progress = voyageProgress(state); var battle = progress.lastBattle; var ending = progress.lastEnding;
      if (!battle && !ending) { container.innerHTML = "<div class=\"trial-result-empty\">完成一個航程節點後，戰報與結局獎勵會顯示在這裡。</div>"; return; }
      var parts = [];
      if (battle) parts.push("<div class=\"trial-result-header " + (battle.won ? "won" : "lost") + "\"><div><span class=\"eyebrow\">VOYAGE REPORT / " + (battle.won ? "CLEAR" : "RETRY") + "</span><strong>" + (battle.won ? "航道突破成功" : "航道暫時封鎖") + " · " + number(battle.rounds || 0) + " 回合</strong><small>隊伍戰力 " + number(battle.teamPower || 0) + "｜協同 " + Math.round(Number(battle.synergy || 0) * 100) + "%</small></div><span class=\"battle-power\">" + (battle.won ? "繼續前進" : "可重新開航") + "</span></div>");
      if (ending) {
        var endingLabel = ending.id === "special" ? "協鳴特殊結局" : ending.id === "hidden" ? "隱藏結局" : "一般結局";
        parts.push("<div class=\"voyage-ending-card\"><span class=\"eyebrow\">ENDING UNLOCKED</span><h3>" + endingLabel + "</h3><p>" + (ending.alreadyClaimed ? "這個結局的本期獎勵已領取過，仍可再次探索路線。" : "已將本期結局獎勵寫入你的帳號。") + "</p><strong>" + escapeHtml(rewardText(ending.reward || {})) + "</strong></div>");
      }
      parts.push("<details><summary>查看航程戰鬥紀錄</summary><div class=\"battle-log\">" + (battle && battle.logs ? battle.logs.map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") : "<p>這個節點沒有戰鬥。</p>") + "</div></details>");
      container.innerHTML = parts.join("");
    }
    function renderVoyage() {
      if (!game || !byId("voyage-route-list")) return;
      var state = game.getState(); var progress = voyageProgress(state); var config = data.voyageConfig || {}; var routes = config.routes || [];
      var skin = config.seasonSkin || {};
      var currentNode = progress.status === "active" ? (voyageNodeById(progress.route[progress.nodeIndex]) || null) : null;
      var currentStage = voyageBattleStage(currentNode);
      byId("voyage-description").textContent = config.description || "在主線之外探索一段獨立航程。";
      byId("voyage-skin-name").textContent = skin.name || "本期特殊裝扮";
      byId("voyage-skin-copy").textContent = skin.description || "特殊結局獎勵。";
      var activeRoute = progress.routeId ? voyageRouteById(progress.routeId) : null;
      currentVoyageRouteId = activeRoute ? activeRoute.id : currentVoyageRouteId;
      byId("voyage-view-status").textContent = progress.status === "active" ? (activeRoute ? activeRoute.name : "航程進行中") : progress.status === "complete" ? "航程完成 · 可再次探索" : progress.status === "failed" ? "航程中止 · 可重新開航" : "本期航程尚未開始";
      byId("voyage-route-list").innerHTML = routes.map(function (route) { var selected = (activeRoute && activeRoute.id === route.id) || (!activeRoute && currentVoyageRouteId === route.id); return "<button class=\"voyage-route-card " + (selected ? "selected" : "") + "\" data-voyage-route=\"" + escapeHtml(route.id) + "\" type=\"button\" aria-pressed=\"" + (selected ? "true" : "false") + "\"><span>" + escapeHtml(route.name) + "</span><small>" + escapeHtml(route.description) + "</small><em>" + (selected ? "✓ 已選擇這條航線" : "點擊查看並選擇") + "</em></button>"; }).join("");
      var startButton = byId("start-voyage"); startButton.disabled = progress.status === "active"; startButton.textContent = progress.status === "active" ? "航程進行中" : progress.status === "failed" ? "重新開航（建立新路線）" : "開始航程（未選則隨機）";
      if (progress.status === "idle" || progress.status === "failed" || progress.status === "complete") {
        byId("voyage-node-list").innerHTML = "<div class=\"voyage-empty-state\"><span class=\"eyebrow\">CHOOSE A ROUTE</span><strong>先選一條航線，出發後事件會在途中出現</strong><p>每個結局獎勵每期只領一次；完成後可以再跑其他航線，找出不同條件。</p></div>";
        byId("voyage-node-details").innerHTML = ""; byId("voyage-node-enemy").innerHTML = ""; byId("voyage-node-actions").innerHTML = "<p class=\"voyage-hint\">提示：無名檔案線的特殊門需要先取得檔案標記；協鳴特殊結局需要三星與四星一起出航。</p>";
      } else {
        var node = currentNode || {};
        byId("voyage-node-list").innerHTML = progress.route.map(function (id, index) { var item = voyageNodeById(id) || {}; var status = index < progress.nodeIndex ? "done" : index === progress.nodeIndex ? "current" : "locked"; return "<div class=\"voyage-node-pill " + status + "\"><span>" + String(index + 1).padStart(2, "0") + "</span><strong>" + escapeHtml(item.name || id) + "</strong><small>" + escapeHtml(voyageNodeTypeLabel(item)) + "</small></div>"; }).join("");
        byId("voyage-node-details").innerHTML = "<div class=\"trial-stage-kicker\"><span>VOYAGE NODE " + String(progress.nodeIndex + 1).padStart(2, "0") + "</span><span>" + escapeHtml(voyageNodeTypeLabel(node)) + " · " + escapeHtml(node.region || "星海") + "</span></div><h3>" + escapeHtml(node.name || "航程節點") + "</h3><p>" + escapeHtml(node.description || "") + "</p><div class=\"voyage-node-instruction\"><strong>這一步要做什麼</strong><span>" + escapeHtml(voyageNodeInstruction(node, currentStage)) + "</span></div><div class=\"trial-detail-stats\"><span>星海碎片 <b>" + number(progress.fragments) + "</b></span><span>臨時增益 <b>" + (progress.buffs.length ? escapeHtml(progress.buffs.join("、")) : "無") + "</b></span><span>已收集回聲 <b>" + number(progress.flags.echoes || 0) + "</b></span></div>";
        var stage = currentStage;
        byId("voyage-node-enemy").innerHTML = stage ? "<div class=\"enemy-intel-heading\"><div><span class=\"eyebrow\">ENEMY INTEL</span><strong>節點敵方情報</strong></div><small>可先讀取敵人資料再決定編隊</small></div><div class=\"enemy-intel-grid\">" + renderEnemyIntel(stage) + "</div>" : "<div class=\"voyage-event-note\"><span class=\"eyebrow\">EVENT / CHOICE</span><strong>這個節點不需要戰鬥，選擇會影響後續結局。</strong></div>";
        if (node.choices && node.choices.length) {
          byId("voyage-node-actions").innerHTML = node.choices.map(function (choice) { var hasThree = currentVoyageTeam.some(function (id) { var card = data.activeCards.find(function (item) { return item.id === id; }); return card && card.rarity === 3; }); var hasFour = currentVoyageTeam.some(function (id) { var card = data.activeCards.find(function (item) { return item.id === id; }); return card && card.rarity === 4; }); var missingFlag = choice.requiresFlag && progress.flags[choice.requiresFlag] !== true; var missingMixed = choice.requiresMixedTeam && !(hasThree && hasFour); var missingFragments = Number(choice.costFragments || 0) > Number(progress.fragments || 0); var locked = missingFlag || missingMixed || missingFragments; var lockReason = missingFlag ? "尚未取得必要線索" : missingMixed ? "需要三星與四星混編" : missingFragments ? "星海碎片不足" : ""; return "<button class=\"voyage-choice-button " + (locked ? "locked" : "") + "\" data-voyage-choice=\"" + escapeHtml(choice.id) + "\" type=\"button\"" + (locked ? " disabled" : "") + "><strong>" + escapeHtml(choice.label) + "</strong><small>" + escapeHtml(choice.description || "") + (choice.costFragments ? " · 消耗 " + choice.costFragments + " 碎片" : "") + (lockReason ? " · " + lockReason : "") + "</small></button>"; }).join("");
        } else {
          byId("voyage-node-actions").innerHTML = "<button class=\"primary-action\" data-voyage-advance=\"1\" type=\"button\">" + (stage ? "進入自走棋戰鬥" : "確認並繼續航行") + "</button>";
        }
      }
      var owned = data.activeCards.filter(function (card) { return state.collection[card.id] > 0 && data.characterBattleStats[card.id]; });
      currentVoyageTeam = currentVoyageTeam.filter(function (id) { return owned.some(function (card) { return card.id === id; }); }).slice(0, 4);
      byId("voyage-team-count").textContent = currentVoyageTeam.length + " / 4 · 戰力 " + number(trialPower(currentVoyageTeam, state));
      byId("voyage-team-list").innerHTML = owned.length ? owned.map(function (card) { var stats = effectiveBattleStats(state)[card.id]; var individualPower = window.StarshipBattle ? window.StarshipBattle.teamPower([card.id], effectiveBattleStats(state)) : 0; var selected = currentVoyageTeam.indexOf(card.id) >= 0; var image = card.image || card.backgroundImage; var style = "--accent:" + escapeHtml(card.accent || "#9e92ff") + (image ? ";--card-image:url(\"" + escapeHtml(image) + "\")" : ""); return "<button class=\"trial-team-card voyage-team-card " + (selected ? "selected" : "") + "\" data-voyage-character=\"" + escapeHtml(card.id) + "\" type=\"button\"><span class=\"trial-team-art\" style=\"" + style + "\"><b>" + escapeHtml(card.element) + "</b><strong>" + escapeHtml(card.name) + "</strong></span><span class=\"trial-team-copy\"><strong>" + escapeHtml(card.name) + "</strong><small class=\"character-power-line\">戰力 " + number(individualPower) + "</small><small>" + escapeHtml(stats.role) + " · HP " + number(stats.maxHp) + "</small><small>攻 " + stats.attack + "／防 " + stats.defense + "／速 " + stats.speed + "</small></span><i>" + (selected ? "已編入" : "加入編隊") + "</i></button>"; }).join("") : "<div class=\"empty\">目前沒有可參戰角色。</div>";
      renderVoyageGuide(state, progress, currentNode, currentStage);
      renderVoyageResult(state);
    }
    function toggleVoyageTeam(cardId) {
      var index = currentVoyageTeam.indexOf(cardId);
      if (index >= 0) currentVoyageTeam.splice(index, 1);
      else if (currentVoyageTeam.length >= 4) { showMessage("一次戰鬥最多派出 4 名角色。", true); return; }
      else currentVoyageTeam.push(cardId);
      var state = game.getState(); voyageProgress(state).selectedTeam = currentVoyageTeam.slice(); updateGameFromState(state); saveLocalState(); renderVoyage();
    }
    function runVoyageAction(choice) {
      if (!game || !currentPlayerName) { showGate(); return; }
      var state = game.getState(); var progress = voyageProgress(state);
      if (progress.status !== "active") {
        if (remoteMode) { apiRequest("/api/player/voyage", { action: "start", routeId: currentVoyageRouteId || undefined, team: currentVoyageTeam }).then(function (payload) { updateGameFromState(payload.state); renderVoyage(); showMessage("星海迷航已開始，請依節點選擇你的航線。", false); }).catch(function (error) { showMessage(error.message, true); }); }
        else { try { var started = game.startVoyage({ routeId: currentVoyageRouteId || undefined, team: currentVoyageTeam }); updateGameFromState(started.state); saveLocalState(); renderVoyage(); showMessage("星海迷航已開始，請依節點選擇你的航線。", false); } catch (error) { showMessage(error.message, true); } }
        return;
      }
      var node = voyageNodeById(progress.route[progress.nodeIndex]); if (!node) return;
      var battle = null; var stage = voyageBattleStage(node);
      try {
        if (stage) {
          if (!currentVoyageTeam.length) throw new Error("至少派出 1 名角色才能進入迷航戰鬥");
          if (currentVoyageTeam.some(function (id) { return !(state.collection[id] > 0) || !data.characterBattleStats[id]; })) throw new Error("只能派出已取得且已開放的角色");
          battle = window.StarshipBattle.simulateBattle({ team: currentVoyageTeam, stats: effectiveBattleStats(state), stage: stage });
        }
        if (remoteMode) {
          apiRequest("/api/player/voyage", { action: "resolve", nodeId: node.id, choice: choice || undefined, team: currentVoyageTeam }).then(function (payload) { updateGameFromState(payload.state); renderVoyage(); renderLobby(); renderCharacters(); showMessage(payload.ending ? "航程完成：" + (payload.ending.alreadyClaimed ? "本期結局獎勵已領取過。" : rewardText(payload.ending.reward)) : payload.battle && payload.battle.won ? "節點突破成功，繼續向下一段航道前進。" : payload.battle ? "節點戰鬥失敗，可以重新開航。" : "事件選擇已記錄。", Boolean(payload.battle && !payload.battle.won)); }).catch(function (error) { showMessage(error.message, true); });
          return;
        }
        var result = game.advanceVoyage({ nodeId: node.id, choice: choice, team: currentVoyageTeam, battle: battle }); updateGameFromState(result.state); saveLocalState(); renderVoyage(); renderLobby(); renderCharacters(); showMessage(result.ending ? "航程完成：" + (result.ending.alreadyClaimed ? "本期結局獎勵已領取過。" : rewardText(result.ending.reward)) : battle && !battle.won ? "節點戰鬥失敗，可以重新開航。" : "事件選擇已記錄。", Boolean(battle && !battle.won));
      } catch (error) { showMessage(error.message, true); }
    }
    function petProgressState(state) {
      state.petProgress = state.petProgress || { version: data.petVersion || "2.0-2.5", selectedPetId: "star-fox", selectedOutfitId: "default", selectedEffectId: "starlit", pets: {}, resources: { petFood: 0, petToys: 0, petTokens: 0, showcaseToken: 0 }, showcase: { isPublic: false, featuredPetId: "star-fox", outfitId: "default", effectId: "starlit" }, ratedShowcases: {} };
      state.petProgress.pets = state.petProgress.pets || {};
      state.petProgress.resources = state.petProgress.resources || { petFood: 0, petToys: 0, petTokens: 0, showcaseToken: 0 };
      state.petProgress.showcase = state.petProgress.showcase || { isPublic: false, featuredPetId: state.petProgress.selectedPetId, outfitId: state.petProgress.selectedOutfitId, effectId: state.petProgress.selectedEffectId };
      state.petProgress.ratedShowcases = state.petProgress.ratedShowcases || {};
      return state.petProgress;
    }
    function petDefinitionById(id) { return (data.petDefinitions || []).find(function (item) { return item.id === id; }); }
    function petOutfitById(id) { return (data.petOutfits || []).find(function (item) { return item.id === id; }); }
    function petEffectById(id) { return (data.petEffects || []).find(function (item) { return item.id === id; }); }
    function petActionMessage(text, isError) { var target = byId("pet-action-message"); if (target) { target.textContent = text; target.className = isError ? "message error" : "message"; } }
    function petArtMarkup(definition, outfit, effect, compact) {
      definition = definition || {};
      outfit = outfit || {};
      effect = effect || {};
      var id = String(definition.id || "");
      var art = {
        "star-fox": '<path class="pet-tail" d="M63 128C24 111 22 67 55 59c27-6 39 18 23 37-8 9-19 12-31 10 21 12 32 20 36 34Z"/><path class="pet-ear" d="M82 76 75 39c-1-7 6-10 11-5l25 27Z"/><path class="pet-ear" d="M137 62 159 35c5-6 12-2 11 5l-7 38Z"/><ellipse class="pet-body" cx="111" cy="117" rx="52" ry="40"/><circle class="pet-head" cx="113" cy="86" r="38"/><path class="pet-belly" d="M83 120c10 28 57 31 74 0-4 34-19 44-38 44s-33-11-36-44Z"/><circle class="pet-eye" cx="99" cy="87" r="7"/><circle class="pet-eye" cx="128" cy="87" r="7"/><circle class="pet-eye-highlight" cx="97" cy="85" r="2"/><circle class="pet-eye-highlight" cx="126" cy="85" r="2"/><path class="pet-face" d="M107 101q6 7 12 0M113 96v6"/><path class="pet-outfit-mark" d="M74 119q37 18 76 0l-5 16q-34 20-66 0Z"/>',
        "tide-otter": '<path class="pet-tail" d="M61 132c-25-6-32-27-18-39 11-9 27-2 27 12 0 8-6 14-14 16 16 3 24 7 30 15Z"/><circle class="pet-ear" cx="82" cy="72" r="13"/><circle class="pet-ear" cx="145" cy="72" r="13"/><ellipse class="pet-body" cx="113" cy="119" rx="57" ry="40"/><ellipse class="pet-belly" cx="113" cy="127" rx="31" ry="25"/><ellipse class="pet-head" cx="113" cy="88" rx="43" ry="36"/><circle class="pet-eye" cx="98" cy="87" r="7"/><circle class="pet-eye" cx="128" cy="87" r="7"/><circle class="pet-eye-highlight" cx="96" cy="85" r="2"/><circle class="pet-eye-highlight" cx="126" cy="85" r="2"/><ellipse class="pet-nose" cx="113" cy="99" rx="9" ry="6"/><path class="pet-face" d="M104 106q9 8 18 0M90 99 70 94M90 105 69 109M136 99l20-5M136 105l21 4"/><path class="pet-outfit-mark" d="M69 115q43 21 88 0l-2 21q-42 20-84 0Z"/><circle class="pet-bubble" cx="163" cy="54" r="7"/><circle class="pet-bubble" cx="178" cy="39" r="4"/>',
        "wind-bird": '<path class="pet-tail" d="M91 126 50 151c-9 5-15-5-8-12l40-35Z"/><path class="pet-wing" d="M83 92C48 75 33 94 53 119c10 12 26 17 46 14Z"/><path class="pet-wing" d="M144 92c34-17 50 2 30 27-10 12-26 17-46 14Z"/><path class="pet-body" d="M82 117c0-35 18-59 39-59s39 24 39 59c0 31-16 51-39 51s-39-20-39-51Z"/><path class="pet-crest" d="M102 63 91 35c-2-7 5-10 10-5l14 18 13-25c4-7 11-4 10 4l-4 36Z"/><path class="pet-beak" d="M151 84 184 96l-33 12Z"/><circle class="pet-eye" cx="133" cy="82" r="7"/><circle class="pet-eye-highlight" cx="131" cy="80" r="2"/><path class="pet-face" d="M115 121q8 7 16 0"/><path class="pet-outfit-mark" d="M85 122q36 17 71 0l-7 19q-30 17-57 0Z"/>',
        "mirror-sprout": '<path class="pet-root" d="M109 102c-5-28-26-43-49-36-9 3-8 14 1 16 14 3 25 11 30 28Z"/><path class="pet-root" d="M119 78c7-26 28-39 49-29 9 4 7 15-2 16-14 1-25 8-32 23Z"/><path class="pet-body" d="M78 119c0-29 16-47 35-47s35 18 35 47c0 36-14 53-35 53s-35-17-35-53Z"/><path class="pet-belly" d="M91 126q22-18 44 0v26q-22 13-44 0Z"/><circle class="pet-eye" cx="99" cy="107" r="6"/><circle class="pet-eye" cx="124" cy="107" r="6"/><circle class="pet-eye-highlight" cx="97" cy="105" r="2"/><circle class="pet-eye-highlight" cx="122" cy="105" r="2"/><path class="pet-face" d="M94 115q5 7 10 0M119 115q5 7 10 0M103 128q10 7 20 0"/><path class="pet-outfit-mark" d="M80 126q34 19 67 0l-5 20q-28 17-57 0Z"/><path class="pet-crystal" d="M112 52 126 66 112 80 98 66Z"/>'
      }[id] || '<circle class="pet-body" cx="112" cy="112" r="48"/><circle class="pet-head" cx="112" cy="84" r="34"/><circle class="pet-eye" cx="100" cy="84" r="7"/><circle class="pet-eye" cx="124" cy="84" r="7"/><circle class="pet-eye-highlight" cx="98" cy="82" r="2"/><circle class="pet-eye-highlight" cx="122" cy="82" r="2"/><path class="pet-face" d="M105 99q7 7 14 0"/>';
      var outfitMarkup = outfit.id === "moon-scarf"
        ? "<path class=\"pet-accessory pet-scarf\" d=\"M70 119q42 25 86 0l-4 16q-40 25-78 0Z\"/><path class=\"pet-accessory pet-scarf-tail\" d=\"M143 129l30 17-12 8-23-17Z\"/>"
        : outfit.id === "tide-cape"
          ? "<path class=\"pet-accessory pet-cape\" d=\"M65 108q48 29 97 0l-8 43q-40 20-81 0Z\"/><path class=\"pet-accessory pet-cape-clasp\" d=\"M105 117h15v15h-15Z\"/>"
          : outfit.id === "archive-crown"
            ? "<path class=\"pet-accessory pet-crown\" d=\"M78 62 89 35l24 20 24-24 14 32Z\"/><circle class=\"pet-accessory pet-crown-gem\" cx=113\" cy=55\" r=5\"/>"
            : "";
      var svgClass = "pet-art-svg" + (compact ? " compact" : "");
      return "<svg class=\"" + svgClass + "\" viewBox=\"0 0 220 180\" role=\"img\" aria-label=\"" + escapeHtml(definition.name || "星伴") + "的專屬外觀\" style=\"--pet-art-base:" + escapeHtml(definition.accent || "#b897e8") + ";--pet-art-outfit:" + escapeHtml(outfit.accent || definition.accent || "#9e92ff") + ";--pet-art-effect:" + escapeHtml(effect.color || "#f4c66b") + "\"><ellipse class=\"pet-art-shadow\" cx=\"111\" cy=\"164\" rx=\"58\" ry=\"8\"/>" + art + outfitMarkup + "<circle class=\"pet-art-spark\" cx=\"180\" cy=\"124\" r=\"4\"/><circle class=\"pet-art-spark\" cx=\"48\" cy=\"44\" r=\"3\"/></svg>";
    }
    function petCardMarkup(definition, pet, selected) {
      var petState = petProgressState(game.getState());
      var outfit = petOutfitById(currentPetOutfitId || petState.selectedOutfitId || (petState.showcase || {}).outfitId) || (data.petOutfits || [])[0] || {};
      var effect = petEffectById(currentPetEffectId || petState.selectedEffectId || (petState.showcase || {}).effectId) || (data.petEffects || [])[0] || {};
      var style = "--pet-accent:" + escapeHtml(outfit.accent || definition.accent || "#9e92ff") + ";--pet-effect:" + escapeHtml(effect.color || "#f4c66b");
      var nextExp = 80 + Number(pet.level || 1) * 40;
      return "<div class=\"pet-visual-card " + (selected ? "selected" : "") + "\" style=\"" + style + "\"><div class=\"pet-visual-stage\"><div class=\"pet-visual-orbit\"><span>" + escapeHtml(effect.icon || "✦") + "</span></div><div class=\"pet-visual-art\">" + petArtMarkup(definition, outfit, effect, false) + "</div></div><div class=\"pet-visual-copy\"><span class=\"eyebrow\">" + escapeHtml(definition.temperament) + " COMPANION</span><h3>" + escapeHtml(definition.name) + "</h3><p>" + escapeHtml(definition.description) + "</p><div class=\"pet-stat-line\"><span>Lv." + number(pet.level || 1) + " / " + number(definition.maxLevel || 30) + "</span><span>親密度 " + number(pet.bond || 0) + "</span><span>心情 " + number(pet.mood || 0) + "</span></div><div class=\"pet-exp-track\"><i style=\"width:" + Math.min(100, Number(pet.exp || 0) / Math.max(1, nextExp) * 100) + "%\"></i></div><small>下級需要 " + number(nextExp) + " 經驗 · 裝扮「" + escapeHtml(outfit.name || "原野本色") + "」· 特效「" + escapeHtml(effect.name || "星屑環") + "」</small></div></div>";
    }
    function renderPetShowcases() {
      var container = byId("pet-showcase-list"); if (!container) return;
      if (!remoteMode) { container.innerHTML = "<div class=\"pet-community-empty\">目前是本機存檔模式；部署到同一個線上網址後，這裡會顯示其他玩家的公開寵物。</div>"; return; }
      if (!petShowcases.length) { container.innerHTML = "<div class=\"pet-community-empty\">目前還沒有其他玩家公開寵物，成為第一位展示者吧。</div>"; return; }
      container.innerHTML = petShowcases.map(function (item) { var stars = Math.round(Number(item.ratingAverage || 0)); return "<article class=\"pet-showcase-card\"><div class=\"pet-showcase-art\" style=\"--pet-accent:" + escapeHtml(item.outfit.accent || item.pet.accent || "#9e92ff") + ";--pet-effect:" + escapeHtml(item.effect.color || "#f4c66b") + "\"><span class=\"pet-showcase-effect\">" + escapeHtml(item.effect.icon || "✦") + "</span>" + petArtMarkup(item.pet, item.outfit, item.effect, true) + "</div><div class=\"pet-showcase-copy\"><span class=\"eyebrow\">PLAYER / " + escapeHtml(item.playerName) + "</span><h4>" + escapeHtml(item.pet.name) + " · Lv." + item.pet.level + "</h4><p>裝扮「" + escapeHtml(item.outfit.name) + "」 · 特效「" + escapeHtml(item.effect.name) + "」</p><small>親密度 " + item.pet.bond + " · 目前 " + item.ratingAverage + " / 5（" + item.ratingCount + " 次）</small><div class=\"pet-rate-actions\"><span>" + [1, 2, 3, 4, 5].map(function (value) { return "<button class=\"pet-rate-star " + (value <= stars ? "on" : "") + "\" data-pet-rate=\"" + escapeHtml(item.playerKey) + "\" data-pet-rating=\"" + value + "\" type=\"button\">★</button>"; }).join("") + "</span><em>評分 +1 飼料</em></div></div></article>"; }).join("");
    }
    function renderPets() {
      if (!game || !byId("pet-catalog-list")) return;
      var state = game.getState(); var progress = petProgressState(state); var definitions = data.petDefinitions || []; var selected = petDefinitionById(progress.selectedPetId) || definitions[0];
      if (!selected) return;
      currentPetId = selected.id; currentPetOutfitId = currentPetOutfitId || progress.selectedOutfitId || "default"; currentPetEffectId = currentPetEffectId || progress.selectedEffectId || "starlit";
      var pet = progress.pets[selected.id] || { owned: false, level: 1, exp: 0, bond: 0, mood: 0, training: {} };
      byId("pet-view-status").textContent = (progress.showcase.isPublic ? "公開展示中" : "私人收藏") + " · " + selected.name;
      byId("pet-food").textContent = number(progress.resources.petFood); byId("pet-toys").textContent = number(progress.resources.petToys); byId("pet-tokens").textContent = number(progress.resources.petTokens); byId("pet-showcase-reward").textContent = number(progress.resources.showcaseToken || 0);
      byId("pet-selected-card").innerHTML = petCardMarkup(selected, pet, true) + "<div class=\"pet-action-row\"><button class=\"primary-action\" data-pet-action=\"feed\" data-pet-id=\"" + escapeHtml(selected.id) + "\" type=\"button\">餵食　1 飼料</button><button class=\"secondary-action\" data-pet-action=\"play\" data-pet-id=\"" + escapeHtml(selected.id) + "\" type=\"button\">玩耍　1 玩具</button><button class=\"secondary-action\" data-pet-action=\"train\" data-pet-id=\"" + escapeHtml(selected.id) + "\" type=\"button\">訓練　1 星伴代幣</button><button class=\"secondary-action\" data-pet-action=\"explore\" data-pet-id=\"" + escapeHtml(selected.id) + "\" type=\"button\">外出探索（本期 " + Number(progress.exploreCount || 0) + " / 3）</button></div>";
      byId("pet-public-toggle").checked = progress.showcase.isPublic === true;
      byId("pet-outfit-list").innerHTML = "<div class=\"pet-option-heading\">裝扮</div>" + (data.petOutfits || []).map(function (outfit) { return "<button class=\"pet-option-button " + (currentPetOutfitId === outfit.id ? "active" : "") + "\" data-pet-outfit=\"" + escapeHtml(outfit.id) + "\" type=\"button\"><span style=\"--option-accent:" + escapeHtml(outfit.accent || "#9e92ff") + "\"></span><strong>" + escapeHtml(outfit.name) + "</strong><small>" + escapeHtml(outfit.description) + "</small></button>"; }).join("");
      byId("pet-effect-list").innerHTML = "<div class=\"pet-option-heading\">出場特效</div>" + (data.petEffects || []).map(function (effect) { return "<button class=\"pet-option-button " + (currentPetEffectId === effect.id ? "active" : "") + "\" data-pet-effect=\"" + escapeHtml(effect.id) + "\" type=\"button\"><span style=\"--option-accent:" + escapeHtml(effect.color || "#f4c66b") + "\">" + escapeHtml(effect.icon || "✦") + "</span><strong>" + escapeHtml(effect.name) + "</strong><small>" + escapeHtml(effect.description) + "</small></button>"; }).join("");
      byId("pet-catalog-count").textContent = Object.keys(progress.pets).filter(function (id) { return progress.pets[id] && progress.pets[id].owned; }).length + " / " + definitions.length;
      byId("pet-catalog-list").innerHTML = definitions.map(function (definition) { var saved = progress.pets[definition.id]; var owned = saved && saved.owned; return "<button class=\"pet-catalog-card " + (owned ? "owned" : "locked") + (definition.id === selected.id ? " selected" : "") + "\" data-pet-select=\"" + escapeHtml(definition.id) + "\" type=\"button\"><span class=\"pet-catalog-icon\" style=\"--pet-accent:" + escapeHtml(definition.accent || "#9e92ff") + "\">" + escapeHtml(definition.icon) + "</span><span><strong>" + escapeHtml(definition.name) + "</strong><small>" + escapeHtml(definition.temperament) + (owned ? " · Lv." + saved.level : " · 尚未領養") + "</small></span><em>" + (owned ? "選擇" : "領養 3 代幣") + "</em></button>"; }).join("");
      renderPetShowcases();
    }
    function runPetAction(action, petId) {
      if (!game || !currentPlayerName) { showGate(); return; }
      var request = { action: action, petId: petId || currentPetId, focus: "focus" };
      if (remoteMode) { apiRequest("/api/player/pet-action", request).then(function (payload) { updateGameFromState(payload.state); renderPets(); renderLobby(); petActionMessage(action === "adopt" ? "寵物已加入星伴工坊。" : action === "select" ? "已切換出場寵物。" : "寵物培育完成，進度已儲存。", false); }).catch(function (error) { petActionMessage(error.message, true); }); return; }
      try { var result = game.petAction(request); updateGameFromState(result.state); saveLocalState(); renderPets(); petActionMessage(action === "adopt" ? "寵物已加入星伴工坊。" : action === "select" ? "已切換出場寵物。" : "寵物培育完成，進度已儲存到這個瀏覽器。", false); } catch (error) { petActionMessage(error.message, true); }
    }
    function savePetShowcase() {
      if (!game || !currentPlayerName) { showGate(); return; }
      var isPublic = byId("pet-public-toggle").checked; var body = { action: "publish", petId: currentPetId, outfitId: currentPetOutfitId, effectId: currentPetEffectId, isPublic: isPublic };
      if (remoteMode) { apiRequest("/api/player/pet-showcase", body).then(function (payload) { updateGameFromState(payload.state); renderPets(); loadPetShowcases(); petActionMessage(isPublic ? "寵物展示已公開，其他玩家可以看到並評分。" : "寵物展示已設為私人。", false); }).catch(function (error) { petActionMessage(error.message, true); }); return; }
      try { var result = game.setPetCustomization({ petId: currentPetId, outfitId: currentPetOutfitId, effectId: currentPetEffectId, isPublic: isPublic }); updateGameFromState(result.state); saveLocalState(); renderPets(); petActionMessage(isPublic ? "本機展示設定已儲存；部署到線上後可讓其他玩家評分。" : "寵物展示已設為私人。", false); } catch (error) { petActionMessage(error.message, true); }
    }
    function loadPetShowcases() {
      if (!remoteMode || !currentPlayerName) { renderPetShowcases(); return; }
      apiRequest("/api/player/pet-showcase", { action: "browse" }).then(function (payload) { petShowcases = payload.showcases || []; renderPetShowcases(); }).catch(function (error) { petActionMessage(error.message, true); });
    }
    function ratePetShowcase(targetKey, rating) {
      if (!remoteMode) { petActionMessage("本機存檔模式沒有其他玩家展示；部署到線上網址後才能評分。", true); return; }
      apiRequest("/api/player/pet-showcase", { action: "rate", targetKey: targetKey, rating: Number(rating) }).then(function (payload) { updateGameFromState(payload.state); renderPets(); loadPetShowcases(); petActionMessage("評分完成：獲得 +1 飼料。作品擁有者也會收到小獎勵。", false); }).catch(function (error) { petActionMessage(error.message, true); });
    }
    function rewardText(reward) {
      var parts = [];
      if (reward && reward.starSand) { parts.push("+" + reward.starSand + " 星砂"); }
      if (reward && reward.starMarks) { parts.push("+" + reward.starMarks + " 星痕"); }
      if (reward && reward.echoPowder) { parts.push("+" + reward.echoPowder + " 回響粉"); }
      if (reward && reward.characterExp) { parts.push("+" + reward.characterExp + " 角色經驗"); }
      if (reward && reward.constellationCore) { parts.push("+" + reward.constellationCore + " 該角色命座晶核"); }
      if (reward && reward.petFood) { parts.push("+" + reward.petFood + " 寵物飼料"); }
      if (reward && reward.petToys) { parts.push("+" + reward.petToys + " 寵物玩具"); }
      if (reward && reward.petTokens) { parts.push("+" + reward.petTokens + " 星伴代幣"); }
      if (reward && reward.showcaseToken) { parts.push("+" + reward.showcaseToken + " 展示徽章"); }
      if (reward && reward.skinId) { parts.push("解鎖特殊裝扮"); }
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
        var banner = bannerById(entry.bannerId); var title = banner ? banner.name : entry.bannerId; var payment = number(entry.cost || api.DEFAULT_RULES.singleCost) + " 星砂";
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
      byId("star-sand").textContent = number(state.resources.starSand); byId("star-marks").textContent = number(state.resources.starMarks); byId("echo-powder").textContent = number(state.resources.echoPowder);
      byId("banner-description").textContent = banner.description; byId("pity-count").textContent = pity.pullsSince4Star + " / " + pity.hardPity; byId("pity-rate").textContent = pity.currentFourStarRateText; byId("pity-distance").textContent = "距離 4★ 硬保底還有 " + pity.pullsUntilHardPity + " 格"; byId("pity-fill").style.width = Math.min(100, pity.pullsSince4Star / pity.hardPity * 100) + "%";
      byId("featured-guarantee").textContent = banner.type === "standard" ? "常駐池沒有精選保證" : (pity.guaranteedFeatured ? "下一張 4★ 必定是目前選中的角色" : "目前為 55% 選中角色／45% 其他 4★");
      var bannerSelect = byId("banner-select"); bannerSelect.innerHTML = data.banners.filter(function (item) { return item.active !== false; }).map(function (item) { return "<option value=\"" + escapeHtml(item.id) + "\">" + escapeHtml(item.name) + "</option>"; }).join(""); bannerSelect.value = selectedBannerId;
      var featuredSelect = byId("featured-select"); featuredSelect.innerHTML = banner.type === "standard" ? "<option value=\"\">常駐池不選精選</option>" : banner.featured4Stars.map(function (candidate) { return "<option value=\"" + escapeHtml(candidate.id) + "\">" + escapeHtml(candidate.name) + "｜" + escapeHtml(candidate.element) + "｜4★</option>"; }).join(""); featuredSelect.disabled = banner.type === "standard"; if (pity.selectedFeaturedId) { featuredSelect.value = pity.selectedFeaturedId; }
      byId("featured-card").innerHTML = pity.selectedFeatured ? cardMarkup({ card: pity.selectedFeatured, pityPullNumber: "－", duplicateReward: {}, featured: true, isHardPity: false }) : "<div class=\"standard-featured\">常駐回音召集：無當期精選</div>";
      renderBackdrop(pity.selectedFeatured);
      byId("pull-one").disabled = state.resources.starSand < api.DEFAULT_RULES.singleCost; byId("pull-ten").disabled = state.resources.starSand < api.DEFAULT_RULES.tenCost; byId("exchange-featured").disabled = banner.type === "standard" || state.resources.starMarks < 10 || Boolean(state.bannerExchanges[banner.id]); byId("exchange-featured").textContent = state.bannerExchanges[banner.id] ? "本檔精選已兌換" : "10 星痕兌換精選";
      renderCollection(state); renderHistory(state);
    }
    function updateGameFromState(state) { game = createClientGame(ensurePlayerState(state)); syncViewState(game.getState()); }
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
    byId("pull-one").addEventListener("click", function () { pull(1, "starSand"); }); byId("pull-ten").addEventListener("click", function () { pull(10, "starSand"); });
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
     byId("open-boss").addEventListener("click", function () { showView("boss-view"); });
     byId("open-dispatch").addEventListener("click", function () { showView("dispatch-view"); });
    byId("open-voyage").addEventListener("click", function () { showView("voyage-view"); });
    byId("open-pets").addEventListener("click", function () { showView("pet-view"); });
    byId("open-tutorial").addEventListener("click", function () { showView("tutorial-view"); });
    byId("open-announcements").addEventListener("click", function () { showView("announcement-view"); });
    byId("continue-story").addEventListener("click", function () { showView("story-view"); });
    byId("tutorial-reward").addEventListener("click", function (event) { if (event.target.closest("#complete-tutorial")) completeTutorial(); });
    document.querySelectorAll(".back-lobby").forEach(function (button) { button.addEventListener("click", function () { showView("game-lobby"); }); });
    byId("story-main-tab").addEventListener("click", function () { currentStoryTab = "main"; currentStoryChapterId = "main-1-0"; currentStorySceneId = ""; renderStory(); });
    byId("story-side-tab").addEventListener("click", function () { currentStoryTab = "side"; currentStoryChapterId = "side-1-0-village"; currentStorySceneId = ""; renderStory(); });
    byId("story-chapters").addEventListener("click", function (event) { var button = event.target.closest("[data-story-id]"); if (button) updateStorySelection(button.getAttribute("data-story-id")); });
    byId("story-reader").addEventListener("click", function (event) { var sceneButton = event.target.closest("[data-scene-id]"); if (sceneButton) { currentStorySceneId = sceneButton.getAttribute("data-scene-id"); renderStory(); return; } var completeButton = event.target.closest("[data-complete-scene]"); if (completeButton) completeStoryScene(currentStoryChapterId, completeButton.getAttribute("data-complete-scene")); });
     byId("character-list").addEventListener("click", function (event) {
       var developButton = event.target.closest("[data-develop-character]"); if (developButton) { event.stopPropagation(); developCharacter(developButton.getAttribute("data-develop-character")); return; }
       var breakthroughButton = event.target.closest("[data-breakthrough-character]"); if (breakthroughButton) { event.stopPropagation(); breakthroughCharacter(breakthroughButton.getAttribute("data-breakthrough-character")); return; }
      var card = event.target.closest("[data-open-character]"); if (card) openCharacterDetail(card.getAttribute("data-open-character"));
    });
    byId("character-list").addEventListener("keydown", function (event) { if (event.key === "Enter" || event.key === " ") { var card = event.target.closest("[data-open-character]"); if (card) { event.preventDefault(); openCharacterDetail(card.getAttribute("data-open-character")); } } });
    byId("character-detail").addEventListener("click", function (event) {
       if (event.target.closest("[data-close-character]")) { byId("character-detail").hidden = true; currentCharacterId = ""; currentCharacterSkinId = ""; return; }
       var skinButton = event.target.closest("[data-skin-preview]"); if (skinButton) { var skinId = skinButton.getAttribute("data-skin-preview"); currentCharacterSkinId = currentCharacterSkinId === skinId ? "" : skinId; renderCharacterDetail(currentCharacterId); return; }
       var developButton = event.target.closest("[data-detail-develop]"); if (developButton) { developCharacter(developButton.getAttribute("data-detail-develop")); return; }
       var breakthroughButton = event.target.closest("[data-detail-breakthrough]"); if (breakthroughButton) { breakthroughCharacter(breakthroughButton.getAttribute("data-detail-breakthrough")); return; }
    });
    byId("milestone-rewards").addEventListener("click", function (event) { var button = event.target.closest("[data-reward-key]"); if (button) claimCharacterChoice(button.getAttribute("data-reward-key"), button.getAttribute("data-card-id")); });
     byId("trial-stages").addEventListener("click", function (event) { var button = event.target.closest("[data-trial-stage]"); if (button && !button.disabled) { currentTrialStageId = Number(button.getAttribute("data-trial-stage")); renderTrial(); } });
     byId("trial-team-list").addEventListener("click", function (event) { var button = event.target.closest("[data-trial-character]"); if (button) toggleTrialTeam(button.getAttribute("data-trial-character")); });
     byId("start-trial-battle").addEventListener("click", runTrialBattle);
     byId("boss-stages").addEventListener("click", function (event) { var button = event.target.closest("[data-boss-stage]"); if (button) { currentBossStageId = button.getAttribute("data-boss-stage"); currentBossTeam = []; var state = game.getState(); var progress = bossProgress(state); progress.selectedBossId = currentBossStageId; progress.selectedTeam = []; updateGameFromState(state); saveLocalState(); renderBoss(); } });
     byId("boss-team-list").addEventListener("click", function (event) { var button = event.target.closest("[data-boss-character]"); if (button) toggleBossTeam(button.getAttribute("data-boss-character")); });
     byId("start-boss-battle").addEventListener("click", runBossBattle);
     byId("dispatch-missions").addEventListener("click", function (event) { var button = event.target.closest("[data-dispatch-mission]"); if (button) { currentDispatchMissionId = button.getAttribute("data-dispatch-mission"); currentDispatchTeam = []; renderDispatch(); } });
    byId("dispatch-team-list").addEventListener("click", function (event) { var button = event.target.closest("[data-dispatch-character]"); if (button) toggleDispatchTeam(button.getAttribute("data-dispatch-character")); });
    byId("start-dispatch").addEventListener("click", runDispatchMission);
    byId("voyage-route-list").addEventListener("click", function (event) { var button = event.target.closest("[data-voyage-route]"); if (button) { currentVoyageRouteId = button.getAttribute("data-voyage-route"); renderVoyage(); } });
    byId("start-voyage").addEventListener("click", function () { runVoyageAction(""); });
    byId("voyage-node-actions").addEventListener("click", function (event) { var choice = event.target.closest("[data-voyage-choice]"); if (choice && !choice.disabled) { runVoyageAction(choice.getAttribute("data-voyage-choice")); return; } var advance = event.target.closest("[data-voyage-advance]"); if (advance) runVoyageAction(""); });
    byId("voyage-team-list").addEventListener("click", function (event) { var button = event.target.closest("[data-voyage-character]"); if (button) toggleVoyageTeam(button.getAttribute("data-voyage-character")); });
    byId("pet-catalog-list").addEventListener("click", function (event) { var button = event.target.closest("[data-pet-select]"); if (!button) return; var petId = button.getAttribute("data-pet-select"); var progress = game.getState().petProgress || {}; if (progress.pets && progress.pets[petId] && progress.pets[petId].owned) runPetAction("select", petId); else runPetAction("adopt", petId); });
    byId("pet-selected-card").addEventListener("click", function (event) { var button = event.target.closest("[data-pet-action]"); if (button) runPetAction(button.getAttribute("data-pet-action"), button.getAttribute("data-pet-id")); });
    byId("pet-outfit-list").addEventListener("click", function (event) { var button = event.target.closest("[data-pet-outfit]"); if (button) { currentPetOutfitId = button.getAttribute("data-pet-outfit"); renderPets(); } });
    byId("pet-effect-list").addEventListener("click", function (event) { var button = event.target.closest("[data-pet-effect]"); if (button) { currentPetEffectId = button.getAttribute("data-pet-effect"); renderPets(); } });
    byId("save-pet-showcase").addEventListener("click", savePetShowcase);
    byId("refresh-pet-showcase").addEventListener("click", loadPetShowcases);
    byId("pet-showcase-list").addEventListener("click", function (event) { var button = event.target.closest("[data-pet-rate]"); if (button) ratePetShowcase(button.getAttribute("data-pet-rate"), button.getAttribute("data-pet-rating")); });

    setControlsEnabled(false);
    setHallVisible(false);
    byId("player-name-input").value = storedName();
    showGate();
    probeBackend();
  }

  if (document.readyState === "loading") { document.addEventListener("DOMContentLoaded", start); } else { start(); }
}());
