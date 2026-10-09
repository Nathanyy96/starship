(function () {
  "use strict";

  function start() {
    var api = window.StarshipGacha;
    var data = window.StarshipGachaData;
    if (!api || !data) {
      throw new Error("抽卡核心尚未載入");
    }
    var releaseVersionLabel = document.getElementById("live-release-version");
    if (releaseVersionLabel) releaseVersionLabel.textContent = data.updateVersion || "1.0";

    var serverCandidate = window.location.protocol !== "file:" && typeof window.fetch === "function";
    var remoteMode = false;
    var playerNameKey = "starship-player-name";
    var currentPlayerName = "";
    var currentPlayerToken = "";
    var authorPreviewRequestId = 0;
    var authorPreviewLastAct = null;
    var authorPreviewRewardDemo = { "1.0": false, "1.1": false };
    var authMode = "login";
    var selectedBannerId = (data.banners.find(function (banner) { return banner.active !== false; }) || data.banners[0]).id;
    var currentStoryChapterId = "main-1-0";
    var currentStorySceneId = "";
    var currentStoryTab = "main";
    var currentStoryMapFilter = "all";
    var currentStoryMapLocationId = "";
    var currentAtlasMapId = "W-001";
    var currentAtlasPointId = "";
    var authorAtlasMapId = "W-001";
    var authorAtlasPointId = "";
    var authorAtlasVisited = new Set(["W-001"]);
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
    var starLawTestPanelOpen = false;
    var testRewardsServerEnabled = null;
    var currentCharacterId = "";
    var currentCharacterSkinId = "";
    var shopBusy = false;
    var characterSearchTerm = "";
    var characterListFilter = "all";
    var game = null;

    function rosterCards() {
      var owned = game ? game.getState().collection : {};
      return Object.values(data.cards).filter(function (card) {
        return Number(card.releaseVersion) >= 1 && Number(card.releaseVersion) < 2 || Number(owned[card.id]) > 0;
      });
    }
    function byId(id) { return document.getElementById(id); }
    function escapeHtml(value) {
      return String(value === undefined || value === null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
    }
    function number(value) { return Number(value || 0).toLocaleString("zh-Hant-TW"); }
    // All character surfaces must use the same clean portrait source as the
    // design documents.  The version query is intentional: deployed browsers
    // may still have an older labeled card cached at the same asset URL.
    var characterPortraitAssetVersion = "first-major-roster-20261001";
    function characterPortraitSource(card, state, useEquippedSkin) {
      // SVG wrappers reference sibling PNGs; browsers do not load those external
      // references when the SVG is used as a CSS background or an <img> source.
      var progress = card && state && state.characterProgress && state.characterProgress[card.id];
      var equippedId = useEquippedSkin && state && state.cosmetics && state.cosmetics.equippedSkins && card && state.cosmetics.equippedSkins[card.id];
      var equipped = equippedId && state.cosmetics.skins && state.cosmetics.skins[equippedId] && (data.shopCatalog.skins || []).find(function (item) { return item.id === equippedId && item.characterId === card.id; });
      var source = equipped ? equipped.image : card && card.id === "elorna" && progress && progress.activeForm === "deepwater" ? "./assets/cards/elorna-deepwater.webp" : card && (card.image || card.backgroundImage || card.portraitImage) || "";
      if (!source || /^(data|blob):/i.test(source) || /[?&]v=/.test(source)) return source;
      return source + (source.indexOf("?") >= 0 ? "&" : "?") + "v=" + characterPortraitAssetVersion;
    }
    function bannerById(id) { return data.banners.find(function (banner) { return banner.id === id; }); }
    function bossStageById(id) { return (data.bossStages || []).find(function (stage) { return stage.id === id; }); }
    function voyageNodeById(id) { return (data.voyageConfig && data.voyageConfig.nodes || []).find(function (node) { return node.id === id; }); }
    function createClientGame(state) { return new api.GachaGame({ banners: data.banners, state: state, breakthroughRequirements: data.characterBreakthroughs, voyageConfig: data.voyageConfig, shopCatalog: data.shopCatalog, petDefinitions: data.petDefinitions, petOutfits: data.petOutfits, petEffects: data.petEffects, petChallenges: data.petChallenges }); }
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
      closeCharacterAnimation();
      ["game-lobby", "shop-view", "story-view", "author-preview-view", "character-view", "trial-view", "boss-view", "dispatch-view", "voyage-view", "pet-view", "gacha-hall", "tutorial-view", "announcement-view"].forEach(function (id) { if (byId(id)) byId(id).hidden = true; });
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
      if (viewId === "announcement-view") { renderAnnouncements(); setStarLawTestPanelVisible(false); }
      if (viewId === "story-view") { renderStory(); }
      if (viewId === "author-preview-view") { loadAuthorPreview(); loadAuthorBattlePreview(); renderAuthorMapPreview(); renderAuthorStoryPreview(); }
      if (viewId === "character-view") { renderCharacters(); }
      if (viewId === "shop-view") { renderShop(); }
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
      var priorStoryReward = state.storyProgress && state.storyProgress.claimedVersions && state.storyProgress.claimedVersions["1.0"] && state.storyProgress.claimedVersions["1.0"].reward;
      if (priorStoryReward && !Object.prototype.hasOwnProperty.call(priorStoryReward, "starMarks")) {
        state.resources.starMarks += 1;
        priorStoryReward.starMarks = 1;
      }
      var completedScenes = state.storyProgress && state.storyProgress.completedScenes ? state.storyProgress.completedScenes : {};
      state.recruitment.story10ChoiceAvailable = Boolean(state.storyProgress && state.storyProgress.claimedVersions && state.storyProgress.claimedVersions["1.0"] && !state.recruitment.story10ChoiceClaimed);
      if (state.trialProgress && state.trialProgress.clearedStages && state.trialProgress.clearedStages.indexOf(10) >= 0 && !state.recruitment.trial10ChoiceClaimed) { state.recruitment.trial10ChoiceAvailable = true; }
      var updateVersion = data.updateCycle || data.trialVersion || "2.0-2.5";
      var compensationVersion = data.compensationCycle || updateVersion;
      state.updateRewards = state.updateRewards || { claimedVersions: {} };
      state.updateRewards.claimedVersions = state.updateRewards.claimedVersions || {};
      if (!state.updateRewards.claimedVersions[compensationVersion]) {
        var releaseReward = data.updateReward || { starSand: 6000, characterExp: 6000, starMarks: 3 };
        state.resources.starSand += Number(releaseReward.starSand || 0);
        state.resources.characterExp += Number(releaseReward.characterExp || 0);
        state.resources.starMarks += Number(releaseReward.starMarks || 0);
        state.updateRewards.claimedVersions[compensationVersion] = { starSand: releaseReward.starSand, characterExp: releaseReward.characterExp, starMarks: releaseReward.starMarks || 0, grantedAt: new Date().toISOString() };
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
      state.voyageProgress = state.voyageProgress || { version: voyageVersion, status: "idle", routeId: null, selectedRouteId: null, route: [], nodeIndex: 0, selectedTeam: [], fragments: 0, buffs: [], flags: {}, claimedRewards: {}, lastBattle: null, lastEnding: null };
      if (state.voyageProgress.version !== voyageVersion) {
        state.voyageProgress.version = voyageVersion;
        state.voyageProgress.status = "idle";
        state.voyageProgress.routeId = null;
        state.voyageProgress.selectedRouteId = null;
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
      var shopVersion = data.shopCatalog && data.shopCatalog.version || updateVersion;
      state.shopProgress = state.shopProgress || { version: shopVersion, purchases: {}, conversions: {} };
      if (state.shopProgress.version !== shopVersion) {
        state.shopProgress.version = shopVersion;
        state.shopProgress.purchases = {};
        state.shopProgress.conversions = {};
      }
      var petVersion = data.petVersion || updateVersion;
      state.petProgress = state.petProgress || { version: petVersion, exploreCount: 0, ratedShowcases: {} };
      if (state.petProgress.version !== petVersion) {
        state.petProgress.version = petVersion;
        state.petProgress.exploreCount = 0;
        state.petProgress.daily = { date: null, groomed: false, challengeCount: 0 };
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
      if (voyage.status === "active" && voyage.routeId) currentVoyageRouteId = voyage.routeId;
      else if (voyage.selectedRouteId) currentVoyageRouteId = voyage.selectedRouteId;
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
      var aliases = data.storyChapterAliases || {};
      var completed = state.storyProgress.completedScenes;
      Object.keys(completed).forEach(function (key) {
        var separator = key.indexOf(":");
        if (separator < 0) return;
        var oldChapterId = key.slice(0, separator);
        var oldSceneId = key.slice(separator + 1);
        var sceneAliases = data.storySceneAliases || {};
        var migratedKey = sceneAliases[oldChapterId + ":" + oldSceneId] || aliases[oldChapterId + ":" + oldSceneId] || ((aliases[oldChapterId] && oldSceneId) ? aliases[oldChapterId] + ":" + oldSceneId : null);
        if (migratedKey && migratedKey !== key && !completed[migratedKey]) completed[migratedKey] = completed[key];
        if (migratedKey && migratedKey !== key) delete completed[key];
      });
      if (aliases[state.storyProgress.currentChapter]) state.storyProgress.currentChapter = aliases[state.storyProgress.currentChapter];
      return state.storyProgress;
    }
    function storyChapterById(id) {
      var canonicalId = (data.storyChapterAliases && data.storyChapterAliases[id]) || id;
      return data.storyChapters.find(function (chapter) { return chapter.id === canonicalId; }) || data.storyChapters.find(function (chapter) { return chapter.id === id; });
    }
    function storySceneById(chapter, id) { return chapter && chapter.scenes.find(function (scene) { return scene.id === id; }); }
    function sceneKey(chapterId, sceneId) { return chapterId + ":" + sceneId; }
    function storyChapterList() { return data.storyChapters.filter(function (chapter) { return chapter.type === currentStoryTab && chapter.legacyHidden !== true && chapter.releaseOpen === true; }); }
    function lockedStoryChapterList() { return data.storyChapters.filter(function (chapter) { return chapter.type === currentStoryTab && chapter.legacyHidden !== true && chapter.releaseOpen === false; }); }
    function sceneClaimed(state, chapterId, sceneId) { return Boolean(storyProgress(state).completedScenes[sceneKey(chapterId, sceneId)]); }
    function storyVersionClaimed(state) { return Boolean(storyProgress(state).claimedVersions && storyProgress(state).claimedVersions["1.0"]); }
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
      renderStarLawTestPanel();
    }
    function renderStarLawTestPanel() {
      var status = byId("star-law-test-status");
      var button = byId("claim-star-law-test-reward");
      if (!status || !button || !game) return;
      var state = game.getState();
      var claimed = Boolean(state.testRewards && state.testRewards.starLawSupplyClaimed);
      var disabledByServer = remoteMode && testRewardsServerEnabled === false;
      button.disabled = claimed || disabledByServer;
      status.textContent = claimed
        ? "本帳號已領取測試補給；資源已保存。"
        : disabledByServer
          ? "目前是正式模式，測試補給尚未開啟；請在測試服設定 STARSHIP_TEST_REWARDS=true。"
          : "測試補給尚未領取。";
    }
    function setStarLawTestPanelVisible(visible) {
      var panel = byId("star-law-test-panel");
      if (!panel) return;
      starLawTestPanelOpen = Boolean(visible);
      panel.hidden = !starLawTestPanelOpen;
      renderStarLawTestPanel();
      if (starLawTestPanelOpen) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    function claimStarLawTestReward() {
      if (!game || !currentPlayerName) { showGate(); return; }
      var status = byId("star-law-test-status");
      var reward = { starSand: 100000, characterExp: 3000000 };
      if (remoteMode) {
        apiRequest("/api/player/star-law-test-reward", {}).then(function (payload) {
          updateGameFromState(payload.state);
          renderStarLawTestPanel(); render(); renderLobby();
          showMessage(payload.alreadyClaimed ? "星律測試補給已經領取過。" : (payload.upgraded ? "星律測試補給已升級，差額與測試名冊已寫入帳號：" : "星律測試補給已寫入帳號：") + rewardText(payload.reward || reward) + "。", false);
        }).catch(function (error) { status.textContent = error.message; showMessage(error.message, true); });
        return;
      }
      try {
        var result = game.claimStarLawTestReward({ reward: reward });
        updateGameFromState(result.state);
        saveLocalState();
        renderStarLawTestPanel(); render(); renderLobby();
        showMessage(result.alreadyClaimed ? "星律測試補給已經領取過。" : (result.upgraded ? "星律測試補給已升級，差額與測試名冊已寫入本機帳號：" : "星律測試補給已寫入本機帳號：") + rewardText(result.reward) + "。", false);
      } catch (error) { status.textContent = error.message; showMessage(error.message, true); }
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
      [{ key: "story-1-0", available: recruitment.story10ChoiceAvailable && !recruitment.story10ChoiceClaimed, title: "1.0 主線完成獎勵", copy: "讀完五幕並領取 1.0 版本獎勵後，選擇一名角色。" }, { key: "trial-10", available: recruitment.trial10ChoiceAvailable && !recruitment.trial10ChoiceClaimed, title: "星界試煉第 10 關獎勵", copy: "通關第 10 關，再選擇一名角色。" }].forEach(function (reward) {
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
      byId("author-preview-entry").hidden = playerKey(currentPlayerName) !== "happycow";
      var state = game.getState(); var progress = storyProgress(state); var openChapters = data.storyChapters.filter(function (item) { return item.releaseOpen === true; }); var completed = openChapters.reduce(function (sum, item) { return sum + item.scenes.filter(function (scene) { return Boolean(progress.completedScenes[sceneKey(item.id, scene.id)]); }).length; }, 0); var total = openChapters.reduce(function (sum, chapter) { return sum + chapter.scenes.length; }, 0); var chapter = storyChapterById(progress.currentChapter) || data.storyChapters[0];
      if (chapter.releaseOpen === false) chapter = storyChapterList()[0];
      byId("story-progress-label").textContent = "劇情完成 " + completed + " / " + total + " 幕";
      byId("lobby-pull-label").textContent = "總召集 " + state.totalPulls + " 次";
      var updateVersion = data.updateCycle || data.trialVersion || "2.0-2.5";
      var updateClaimed = state.updateRewards && state.updateRewards.claimedVersions && state.updateRewards.claimedVersions[data.compensationCycle || updateVersion];
      if (byId("lobby-update-label")) byId("lobby-update-label").textContent = "失誤補償 +" + Number(data.updateReward && data.updateReward.starSand || 6000).toLocaleString() + " 星砂、" + Number(data.updateReward && data.updateReward.starMarks || 3) + " 星痕" + (updateClaimed ? "（已發放）" : "");
      var tutorialDone = tutorialProgress(state).rewardClaimed === true;
      var tutorialQuick = byId("open-tutorial");
      if (tutorialQuick) tutorialQuick.classList.toggle("completed", tutorialDone);
      if (byId("tutorial-quick-status")) byId("tutorial-quick-status").textContent = tutorialDone ? "已完成 · 可重看規則" : "完成教學可領獎";
      if (byId("tutorial-quick-badge")) byId("tutorial-quick-badge").textContent = tutorialDone ? "DONE" : "GUIDE";
      byId("lobby-continue-title").textContent = (chapter.versionLabel || chapter.version) + "｜" + chapter.title;
      byId("lobby-continue-copy").textContent = chapter.summary;
      renderMilestoneRewards();
    }
    function renderAuthorMapPreview() {
      var container = byId("author-preview-map");
      if (!container) return;
      if (!globalThis.StarshipInteractiveMap) { container.textContent = "互動地圖資料尚未載入。"; return; }
      container.innerHTML = globalThis.StarshipInteractiveMap.render(authorAtlasMapId, authorAtlasPointId, { authorPreview: true });
      byId("author-preview-map-progress").textContent = "本次已查看 " + authorAtlasVisited.size + " 個地圖／地點 · 當前：" + globalThis.StarshipInteractiveMap.maps[authorAtlasMapId].name + (authorAtlasPointId ? " · " + (globalThis.StarshipInteractiveMap.maps[authorAtlasMapId].points || []).filter(function (point) { return point[0] === authorAtlasPointId; }).map(function (point) { return point[1]; })[0] : "");
    }
    function renderAuthorPreview(payload) {
      var progress = payload.progress;
      byId("author-preview-progress").textContent = progress.act >= progress.total ? "試玩完成" : "第 " + (progress.act + 1) + " 幕 / " + progress.total + " · 檢查 " + (progress.step + 1);
      var target = byId("author-preview-story-scenes");
      var scenes = target.querySelectorAll("[data-author-act]");
      scenes.forEach(function (scene, index) {
        var status = scene.querySelector("[data-author-scene-status]");
        var slot = scene.querySelector("[data-author-mission-slot]");
        status.textContent = index < progress.act ? "互動已完成" : index === progress.act ? "目前幕次 · 檢查 " + (progress.step + 1) : "可先閱讀 · 互動待解鎖";
        if (index < progress.act) slot.innerHTML = "<p class=\"author-preview-mission-state\">本幕互動已完成。正文與插圖可隨時重新展開閱讀。</p>";
        else if (index > progress.act) slot.innerHTML = "<p class=\"author-preview-mission-state\">先完成前一幕互動，即可在這裡操作本幕選項。</p>";
        else if (payload.task) {
          var task = payload.task;
          slot.innerHTML = "<section class=\"author-preview-task\" aria-label=\"本幕互動\"><h4>本幕互動｜" + escapeHtml(task.title) + "</h4><p>已確認 " + (progress.facts || []).length + " 項；錯選不清除已完成步驟。</p><strong>" + escapeHtml(task.question) + "</strong><div class=\"author-preview-choices\">" + task.choices.map(function (choice, choiceIndex) { return "<button type=\"button\" data-author-choice=\"" + choiceIndex + "\">" + escapeHtml(choice) + "</button>"; }).join("") + "</div><p class=\"author-preview-feedback" + (progress.correct === false ? " needs-retry" : "") + "\" role=\"status\">" + escapeHtml(progress.correct === false ? "此選項未通過安全檢查，留在本幕重試。" + (progress.feedback || "") : progress.feedback || "") + "</p></section>";
        } else slot.innerHTML = "<p class=\"author-preview-mission-state\">五幕互動已完成。可在本幕末尾試按領獎位置；試用不會發放資源。</p>";
      });
      var claim = byId("author-preview-claim-11");
      claim.disabled = progress.act < progress.total || authorPreviewRewardDemo["1.1"];
      claim.textContent = authorPreviewRewardDemo["1.1"] ? "已試按領獎位置" : progress.act >= progress.total ? "試按領取 1.1 劇情獎勵" : "完成五幕互動後可試按領獎";
      if (authorPreviewLastAct === null || progress.act < authorPreviewLastAct) scenes.forEach(function (scene, index) { scene.open = index === Math.min(progress.act, scenes.length - 1); });
      else if (progress.act > authorPreviewLastAct) {
        var next = scenes[Math.min(progress.act, scenes.length - 1)];
        if (next) { next.open = true; if (!target.hidden) window.requestAnimationFrame(function () { next.scrollIntoView({ behavior: "smooth", block: "start" }); }); }
      }
      authorPreviewLastAct = progress.act;
    }
    function authorPreviewStoryRequest(action, choice) {
      if (remoteMode && currentPlayerToken !== "local-session") return apiRequest("/api/author-preview/1-1", { action: action, choice: choice });
      if (playerKey(currentPlayerName) !== "happycow") return Promise.reject(new Error("這個試玩入口目前只開放給作者帳號。"));
      var missions = window.StarshipStory11Missions;
      if (!missions) return Promise.reject(new Error("作者試玩任務資料尚未載入。"));
      var storageKey = "starship-author-preview-1-1:" + encodeURIComponent(playerKey(currentPlayerName));
      var progress = missions.normalize();
      try { progress = missions.normalize(JSON.parse(window.localStorage.getItem(storageKey) || "{}")); } catch (error) { /* 保留可用的初始進度 */ }
      var result = null;
      if (action === "reset") progress = missions.normalize();
      else if (action === "answer") {
        try { result = missions.advance(progress, choice); progress = result.progress; } catch (error) { return Promise.reject(error); }
      }
      if (action === "reset" || action === "answer") {
        try { window.localStorage.setItem(storageKey, JSON.stringify(progress)); } catch (error) { /* 無法儲存時仍可當次試玩 */ }
      }
      var act = missions.acts[progress.act];
      var step = act && act.steps[progress.step];
      return Promise.resolve({ ok: true, progress: { act: progress.act, step: progress.step, total: missions.acts.length, mistakes: progress.mistakes, facts: progress.facts, feedback: result ? result.feedback : "", correct: result ? result.correct : null }, task: step ? { title: act.title, question: step.prompt, choices: step.choices } : null });
    }
    function authorPreviewBattleRequest(body) {
      if (remoteMode && currentPlayerToken !== "local-session") return apiRequest("/api/author-preview/2-x-battle", body);
      if (playerKey(currentPlayerName) !== "happycow") return Promise.reject(new Error("1.0–2.5 角色試玩目前只開放給作者帳號。"));
      var cards = data.authorPreviewCards;
      var allowed = new Set(cards.map(function (card) { return card.id; }));
      if (body.action !== "battle") return Promise.resolve({ ok: true, characters: cards.map(function (card) { return { id: card.id, name: card.name, version: card.releaseVersion, rarity: card.rarity, status: Number(card.releaseVersion) < 2 ? "專屬技能已驗收" : data.characterBattleStats[card.id].signature ? "專屬技能草案" : "通用技能暫代" }; }), stages: data.trialStages.map(function (stage) { return { id: stage.id, name: stage.name, recommendedPower: stage.recommendedPower }; }), note: "本機隔離模擬：不取得角色、不消耗資源、不記錄通關或發放獎勵；2.x 專屬機制仍待逐人完成。" });
      var team = body.team, level = body.level, constellation = body.constellation, stageId = body.stageId;
      if (!Array.isArray(team) || team.length < 1 || team.length > 4 || new Set(team).size !== team.length || team.some(function (id) { return !allowed.has(id); })) return Promise.reject(new Error("試玩隊伍須由 1.0–2.5 的 1–4 名不同角色組成。"));
      if (!Number.isInteger(stageId) || stageId < 1 || stageId > data.trialStages.length) return Promise.reject(new Error("請選擇有效的試煉關卡。"));
      if (!Number.isInteger(level) || level < 1 || level > 90 || !Number.isInteger(constellation) || constellation < 0 || constellation > 6) return Promise.reject(new Error("試玩等級須為 1–90、命座須為 C0–C6。"));
      var characterProgress = {};
      team.forEach(function (id) { characterProgress[id] = { level: level, constellation: constellation }; });
      var stats = window.StarshipBattle.buildEffectiveStats(data.characterBattleStats, { characterProgress: characterProgress });
      var battle = window.StarshipBattle.simulateBattle({ team: team, stats: stats, stage: data.trialStages[stageId - 1] });
      battle.reward = { starSand: 0, characterExp: 0 };
      return Promise.resolve({ ok: true, battle: battle, note: "本機模擬結果不寫入正式帳號，也不發放獎勵。" });
    }
    function loadAuthorPreview(action, choice) {
      var requestId = ++authorPreviewRequestId;
      byId("author-preview-reset").disabled = true;
      byId("author-preview-story-scenes").querySelectorAll("[data-author-choice]").forEach(function (button) { button.disabled = true; });
      authorPreviewStoryRequest(action || "view", choice).then(function (payload) { if (requestId === authorPreviewRequestId) renderAuthorPreview(payload); }).catch(function (error) { if (requestId === authorPreviewRequestId) { var slot = byId("author-preview-story-scenes").querySelector("[data-author-act]:open [data-author-mission-slot]"); if (slot) slot.innerHTML = "<p class=\"author-preview-feedback needs-retry\" role=\"alert\">" + escapeHtml(error.message) + "</p>"; } }).finally(function () { if (requestId === authorPreviewRequestId) byId("author-preview-reset").disabled = false; });
    }
    function loadAuthorBattlePreview() {
      authorPreviewBattleRequest({ action: "view" }).then(function (payload) {
        var cards = payload.characters || [];
        var defaults = cards.filter(function (card) { return Number(card.version) >= 2; }).slice(0, 4).map(function (card) { return card.id; });
        var option = function (selected) { return "<option value=\"\">空位</option>" + cards.map(function (card) { return "<option value=\"" + escapeHtml(card.id) + "\"" + (selected === card.id ? " selected" : "") + ">" + escapeHtml(card.name + " · " + card.version + " · " + card.status) + "</option>"; }).join(""); };
        byId("author-preview-2x-setup").innerHTML = "<p>" + escapeHtml(payload.note) + "</p><div class=\"author-preview-2x-controls\">" + [0,1,2,3].map(function (index) { return "<label>" + (index < 2 ? "前排 " : "後排 ") + (index + 1) + "<select data-author-2x-slot=\"" + index + "\">" + option(defaults[index]) + "</select></label>"; }).join("") + "<label>關卡<select id=\"author-preview-2x-stage\">" + payload.stages.map(function (stage) { return "<option value=\"" + stage.id + "\"" + (stage.id === 25 ? " selected" : "") + ">第 " + stage.id + " 關｜" + escapeHtml(stage.name) + "（建議戰力 " + number(stage.recommendedPower) + "）</option>"; }).join("") + "</select></label><label>等級<input id=\"author-preview-2x-level\" type=\"number\" min=\"1\" max=\"90\" value=\"90\"></label><label>命座<input id=\"author-preview-2x-constellation\" type=\"number\" min=\"0\" max=\"6\" value=\"2\"></label><button id=\"author-preview-2x-run\" class=\"primary-action\" type=\"button\">開始模擬戰鬥</button></div>";
      }).catch(function (error) { byId("author-preview-2x-setup").textContent = error.message; });
    }
    function runAuthorBattlePreview() {
      var team = Array.from(document.querySelectorAll("[data-author-2x-slot]")).map(function (select) { return select.value; }).filter(Boolean);
      var result = byId("author-preview-2x-result");
      result.textContent = "正在演算……";
      authorPreviewBattleRequest({ action: "battle", team: team, stageId: Number(byId("author-preview-2x-stage").value), level: Number(byId("author-preview-2x-level").value), constellation: Number(byId("author-preview-2x-constellation").value) }).then(function (payload) {
        var battle = payload.battle;
        var teamMarkup = battle.team.map(function (unit) { return "<p>" + escapeHtml(unit.row === "front" ? "前排 " : "後排 ") + escapeHtml((data.cards[unit.id] && data.cards[unit.id].name) || unit.id) + "：HP " + number(unit.hp) + "/" + number(unit.maxHp) + "；技能 " + unit.skillUses + " 次</p>"; }).join("");
        var enemyMarkup = battle.enemies.map(function (unit) { return "<p>敵方 " + escapeHtml(unit.name) + "：HP " + number(unit.hp) + "/" + number(unit.maxHp) + "</p>"; }).join("");
        result.innerHTML = "<div class=\"trial-result-header " + (battle.won ? "won" : battle.timedOut ? "timeout" : "lost") + "\"><div><strong>" + (battle.won ? "通關" : battle.timedOut ? "超時" : "未通關") + " · 第 " + battle.stageId + " 關 · " + battle.rounds + " 回合</strong><small>隊伍戰力 " + number(battle.teamPower) + "；建議戰力 " + number(battle.recommendedPower) + "。" + escapeHtml(payload.note) + "</small></div></div><div class=\"battle-log\">" + teamMarkup + enemyMarkup + "</div><details><summary>查看戰鬥紀錄</summary><div class=\"battle-log\">" + battle.logs.map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") + "</div></details>";
      }).catch(function (error) { result.textContent = error.message; });
    }
    function storyVersionLabel(chapter) { return chapter.versionLabel || chapter.version; }
    function renderAuthorStoryPreview() {
      var source10 = window.StarshipStory10Current;
      var source11 = window.StarshipStory11Current;
      var target10 = byId("author-preview-story-scenes-10");
      var target11 = byId("author-preview-story-scenes");
      if (!target10 || !target11 || !source10 || !source11) return;
      if (!target10.children.length) target10.innerHTML = source10.scenes.map(function (scene, index) {
        return "<details class=\"author-preview-story-scene\"" + (index === 0 ? " open" : "") + "><summary><span>" + escapeHtml(scene.title) + "</span><small>點按展開／收合</small></summary>" + storyBodyMarkup(scene.body, "story-body", index + 1, "main-1-0", { authorPreview: true }) + (index === source10.scenes.length - 1 ? "<div class=\"author-preview-reward\"><p>1.0 版本獎勵｜+1,600 星砂、+3,600 角色經驗、+1 星痕</p><button id=\"author-preview-claim-10\" class=\"primary-action\" type=\"button\" data-author-preview-claim=\"1.0\">試按領取 1.0 劇情獎勵</button><small>版面試用：不領取、不更改正式進度或資源。</small></div>" : "") + "</details>";
      }).join("");
      if (!target11.children.length) target11.innerHTML = source11.scenes.map(function (scene, index) {
        return "<details class=\"author-preview-story-scene\" data-author-act=\"" + index + "\"" + (index === 0 ? " open" : "") + "><summary><span>" + escapeHtml(scene.title) + "</span><small data-author-scene-status>載入互動進度中</small></summary>" + storyBodyMarkup(scene.body, "story-body", index + 1, "main-1-1", { authorPreview: true }) + "<div data-author-mission-slot=\"" + index + "\" class=\"author-preview-mission-slot\"></div>" + (index === source11.scenes.length - 1 ? "<div class=\"author-preview-reward\"><p>1.1 暫定版本獎勵｜+1,600 星砂、+3,600 角色經驗、+1 星痕</p><button id=\"author-preview-claim-11\" class=\"primary-action\" type=\"button\" data-author-preview-claim=\"1.1\" disabled>完成五幕互動後可試按領獎</button><small>作者試用只檢查按鈕位置和流程，不發放正式獎勵。</small></div>" : "") + "</details>";
      }).join("");
    }
    function showAuthorStoryVersion(version) {
      var is10 = version === "1.0";
      byId("author-preview-story-scenes-10").hidden = !is10;
      byId("author-preview-story-scenes").hidden = is10;
      byId("author-story-tab-10").setAttribute("aria-selected", String(is10));
      byId("author-story-tab-11").setAttribute("aria-selected", String(!is10));
    }
    function storyBodyMarkup(text, className, actNumber, chapterId, options) {
      var blocks = String(text || "").replace(/\r\n/g, "\n").split(/\n{2,}/).map(function (block) { return block.trim(); }).filter(Boolean);
      var bodyClass = className || "story-body";
      var imageSet = chapterId === "main-1-1" ? window.StarshipStory11Images : chapterId === "main-1-0" ? window.StarshipStory10Images : [];
      var review = options && options.authorPreview && window.StarshipStoryVisualReview;
      if (review) imageSet = review.imagesFor(chapterId, imageSet);
      var images = actNumber ? (imageSet || []).filter(function (item) { return item.act === actNumber; }) : [];
      var portraits = review ? review.portraits.filter(function (item) { return item.chapter === chapterId && item.act === actNumber; }) : [];
      var used = {};
      var shownPortraits = {};
      var html = blocks.map(function (block) {
        var timeline = /^【時間線|^章節定位/.test(block);
        var art = images.map(function (item, index) { if (!used[index] && block.indexOf(item.anchor) >= 0) { used[index] = true; return "<figure class=\"story-scene-art\"><img src=\"" + escapeHtml(item.src) + "\" alt=\"" + escapeHtml(item.caption || ("第 " + actNumber + " 幕劇情插圖")) + "\" loading=\"lazy\"><figcaption>" + escapeHtml(item.caption || ("第 " + actNumber + " 幕・文件原稿插圖")) + "</figcaption></figure>"; } return ""; }).join("");
        var people = portraits.map(function (item) {
          if (shownPortraits[item.id] || block.indexOf(item.anchor) < 0) return "";
          shownPortraits[item.id] = true;
          return '<figure class="story-person-intro" data-story-person="' + escapeHtml(item.id) + '"><img src="' + escapeHtml(item.src) + '" alt="' + escapeHtml(item.name + '的正式角色立繪') + '" loading="lazy"><figcaption><strong>' + escapeHtml(item.name) + '</strong><span>' + escapeHtml(item.role) + '</span></figcaption></figure>';
        }).join("");
        if (people) people = '<div class="story-person-intros" aria-label="本段出場人物">' + people + '</div>';
        if (/^〔章節CG草稿・待作者確認〕/.test(block)) return people + art;
        return "<p" + (timeline ? " class=\"story-timeline\"" : "") + ">" + escapeHtml(block).replace(/\n/g, "<br>") + "</p>" + people + art;
      }).join("");
      html += images.map(function (item, index) { return used[index] ? "" : "<figure class=\"story-scene-art\"><img src=\"" + escapeHtml(item.src) + "\" alt=\"" + escapeHtml(item.caption || ("第 " + actNumber + " 幕劇情插圖")) + "\" loading=\"lazy\"><figcaption>" + escapeHtml(item.caption || ("第 " + actNumber + " 幕・文件原稿插圖")) + "</figcaption></figure>"; }).join("");
      return "<div class=\"" + bodyClass + "\">" + html + "</div>";
    }
    function chineseActNumber(value) {
      var numerals = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "十二", "十三", "十四", "十五", "十六", "十七", "十八", "十九", "二十"];
      return numerals[value] || String(value);
    }
    function storySceneDisplayTitle(chapter, scene, index) {
      var raw = String(scene && scene.title || "").trim();
      var total = chapter && Array.isArray(chapter.scenes) ? chapter.scenes.length : 0;
      var isSide = chapter && chapter.type === "side";
      // 支線統一成連續幕次；原本的「序幕／第一節／終節」只保留標題正文，避免同一章出現兩組序幕。
      if (isSide) {
        var bodyTitle = raw.replace(/^(?:序幕|終幕|終節|第[一二三四五六七八九十百]+[幕節])\s*[｜|]?\s*/, "").trim();
        var label = index === total - 1 ? "終幕" : "第" + chineseActNumber(index + 1) + "幕";
        return label + (bodyTitle ? "｜" + bodyTitle : "");
      }
      // 主線保留已寫好的「序幕／第X幕／終幕」，只為缺少幕次的文件段落補上連續編號。
      if (/^(?:序幕|終幕|第[一二三四五六七八九十百]+幕)\s*(?:｜|$)/.test(raw)) return raw;
      var mainLabel = index === total - 1 ? "終幕" : "第" + chineseActNumber(index + 1) + "幕";
      return mainLabel + (raw ? "｜" + raw : "");
    }
    function storyLength(chapter) {
      if (chapter.fullBody && chapter.sourceStatus !== "document-tab-missing") return String(chapter.fullBody).replace(/\s/g, "").length;
      return chapter.scenes.reduce(function (sum, scene) { return sum + String(scene.body || "").replace(/\s/g, "").length; }, 0);
    }
    function storyGuideMarkup(chapter) {
      var guide = chapter && chapter.narrativeGuide;
      if (!guide) return "";
      return "<section class=\"story-narrative-guide\"><div><span class=\"eyebrow\">CELESIA STORY THREAD</span><strong>" + escapeHtml(guide.focus || "") + "</strong></div><div><span>本章懸念</span><p>" + escapeHtml(guide.hook || "") + "</p></div><div><span>本章收束</span><p>" + escapeHtml(guide.payoff || "") + "</p></div></section>";
    }
    function storyMapLocationById(id) {
      var map = data.storyWorldMap;
      return map && (map.locations || []).find(function (location) { return location.id === id; });
    }
    function storyMapChapterLocationIds(chapter) {
      var map = data.storyWorldMap;
      return map && chapter && map.chapterLocations && map.chapterLocations[chapter.id] ? map.chapterLocations[chapter.id] : [];
    }
    function storyMapVersionStart(value) {
      var match = String(value || "").match(/\d+(?:\.\d+)?/);
      return match ? Number(match[0]) : 99;
    }
    function storyMapFilterMatches(location) {
      if (currentStoryMapFilter === "all") return true;
      var start = storyMapVersionStart(location.versionRange);
      if (currentStoryMapFilter === "live") return start <= 1.0;
      if (currentStoryMapFilter === "next") return start >= 1.1 && start <= 1.3;
      if (currentStoryMapFilter === "3") return start >= 3 && start < 4;
      if (currentStoryMapFilter === "4") return start >= 4 && start < 5;
      if (currentStoryMapFilter === "5") return start >= 5;
      return true;
    }
    function storyMapLocationIsOpen(location) { return storyMapVersionStart(location && location.versionRange) <= 1.0; }
    function storyMapRegionById(id) {
      var map = data.storyWorldMap;
      return map && (map.regions || []).find(function (region) { return region.id === id; });
    }
    function storyMapChapterMarkup(location) {
      var map = data.storyWorldMap;
      var chapterIds = [];
      (map && map.chapterLocations ? Object.keys(map.chapterLocations) : []).forEach(function (chapterId) {
        if ((map.chapterLocations[chapterId] || []).indexOf(location.id) >= 0) chapterIds.push(chapterId);
      });
      chapterIds.sort(function (a, b) {
        var left = storyChapterById(a); var right = storyChapterById(b);
        return Number(left && left.version || 0) - Number(right && right.version || 0) || (left && left.type === "main" ? -1 : 1);
      });
      return chapterIds.slice(0, 6).map(function (chapterId) {
        var chapter = storyChapterById(chapterId); if (!chapter) return "";
        var open = chapter.releaseOpen !== false;
        return "<button class=\"story-map-chapter-link" + (open ? "" : " locked") + "\" data-map-chapter=\"" + escapeHtml(chapter.id) + "\" type=\"button\"" + (open ? "" : " disabled") + "><span>" + escapeHtml(storyVersionLabel(chapter)) + "｜" + escapeHtml(chapter.type === "main" ? "主線" : "支線") + "</span><strong>" + escapeHtml(chapter.title) + "</strong><small>" + (open ? "開放閱讀" : "已建檔，後續版本開放") + "</small></button>";
      }).join("");
    }
    function storyMapRegionLabelMarkup(region) {
      var positions = {
        "origin-forest": [120, 170],
        "tide-west": [700, 170],
        "inland-forge": [490, 720],
        "northern-myth": [820, 48],
        "root-deep": [120, 48]
      };
      var position = positions[region.id] || [20, 20];
      return "<text class=\"story-map-region-label\" x=\"" + position[0] + "\" y=\"" + position[1] + "\"><tspan>" + escapeHtml(region.name) + "</tspan><tspan x=\"" + position[0] + "\" dy=\"16\">" + escapeHtml(region.terrain) + "</tspan></text>";
    }
    function storyMapRoutePath(route) {
      var from = storyMapLocationById(route.from); var to = storyMapLocationById(route.to);
      if (!from || !to) return "";
      var midX = Math.round((from.x + to.x) / 2); var midY = Math.round((from.y + to.y) / 2);
      return "M" + from.x + " " + from.y + " C" + midX + " " + from.y + ", " + to.x + " " + midY + ", " + to.x + " " + to.y;
    }
    function renderStoryWorldMap(chapter) {
      var container = byId("story-world-map"); var map = data.storyWorldMap;
      if (!container || !map) return;
      if (globalThis.StarshipInteractiveMap) {
        container.innerHTML = globalThis.StarshipInteractiveMap.render(currentAtlasMapId, currentAtlasPointId);
        return;
      }
      var chapterLocations = storyMapChapterLocationIds(chapter);
      if (!currentStoryMapLocationId || !storyMapLocationById(currentStoryMapLocationId) || !storyMapFilterMatches(storyMapLocationById(currentStoryMapLocationId))) {
        currentStoryMapLocationId = chapterLocations.filter(function (id) { return storyMapFilterMatches(storyMapLocationById(id)); })[0] || (map.locations.filter(storyMapFilterMatches)[0] || map.locations[0]).id;
      }
      var selected = storyMapLocationById(currentStoryMapLocationId) || map.locations[0];
      var visibleIds = {};
      map.locations.filter(storyMapFilterMatches).forEach(function (location) { visibleIds[location.id] = true; });
      var terrain = (map.terrainShapes || []).map(function (shape) {
        var region = storyMapRegionById(shape.regionId) || {};
        return "<polygon class=\"story-map-terrain\" points=\"" + escapeHtml(shape.points) + "\" style=\"--region-color:" + escapeHtml(region.color || "#78a9ff") + "\"></polygon>";
      }).join("");
      var routes = (map.routes || []).map(function (route) {
        var visible = visibleIds[route.from] && visibleIds[route.to];
        var planned = !storyMapLocationIsOpen(storyMapLocationById(route.from)) || !storyMapLocationIsOpen(storyMapLocationById(route.to));
        return "<path class=\"story-map-route" + (visible ? "" : " muted") + (planned ? " planned" : "") + (route.kind === "rift" ? " rift" : "") + "\" d=\"" + escapeHtml(storyMapRoutePath(route)) + "\"><title>" + escapeHtml(route.label + "｜" + route.direction) + "</title></path>";
      }).join("");
      var labels = (map.regions || []).map(storyMapRegionLabelMarkup).join("");
      var nodes = map.locations.map(function (location) {
        var visible = visibleIds[location.id];
        var open = storyMapLocationIsOpen(location);
        var active = selected && selected.id === location.id;
        var inChapter = chapterLocations.indexOf(location.id) >= 0;
        return "<g class=\"story-map-location" + (visible ? "" : " filtered") + (open ? " open" : " locked") + (active ? " selected" : "") + (inChapter ? " chapter-current" : "") + "\" data-map-location=\"" + escapeHtml(location.id) + "\" tabindex=\"0\" role=\"button\" aria-label=\"" + escapeHtml(location.name + "，" + (open ? "已開放" : "後續版本")) + "\"><circle cx=\"" + location.x + "\" cy=\"" + location.y + "\" r=\"" + (active ? 13 : 9) + "\"></circle><circle class=\"story-map-location-core\" cx=\"" + location.x + "\" cy=\"" + location.y + "\" r=\"3\"></circle><text x=\"" + (location.x + 14) + "\" y=\"" + (location.y + 4) + "\">" + escapeHtml(location.name) + "</text></g>";
      }).join("");
      var selectedRegion = storyMapRegionById(selected && selected.regionId) || {};
      var selectedChapters = storyMapChapterMarkup(selected || map.locations[0]);
      var filters = [["all", "全部地點"], ["live", "1.0 已開放"], ["next", "1.1–1.3 建檔"]].map(function (item) {
        return "<button class=\"story-map-filter" + (currentStoryMapFilter === item[0] ? " active" : "") + "\" data-map-filter=\"" + item[0] + "\" type=\"button\">" + item[1] + "</button>";
      }).join("");
      var chapterTitle = chapter ? storyVersionLabel(chapter) + "｜" + chapter.title : "故事航線";
      var localSites = (selected.localSites || []).map(function (site) { return "<li>" + escapeHtml(site) + "</li>"; }).join("");
      container.innerHTML = "<div class=\"story-map-heading\"><div><h3 id=\"story-map-title\">" + escapeHtml(map.title) + "</h3><p>" + escapeHtml(map.subtitle) + "；目前章節「" + escapeHtml(chapterTitle) + "」已在地圖上標出。</p></div><span class=\"story-map-version\">1.0 開放 · 後續建檔</span></div><div class=\"story-map-filters\" role=\"group\" aria-label=\"地圖版本篩選\">" + filters + "</div><div class=\"story-map-layout\"><div class=\"story-map-canvas\"><div class=\"story-map-orientation\" aria-label=\"地圖方位：上北、右東、下南、左西\"><span>↑ 北</span><span>← 西　東 →</span><span>↓ 南</span></div><svg class=\"story-map-svg\" viewBox=\"" + escapeHtml(map.viewBox) + "\" role=\"img\" aria-labelledby=\"story-map-title\"><defs><filter id=\"story-map-glow\"><feGaussianBlur stdDeviation=\"5\" result=\"blur\"></feGaussianBlur><feMerge><feMergeNode in=\"blur\"></feMergeNode><feMergeNode in=\"SourceGraphic\"></feMergeNode></feMerge></filter></defs><rect class=\"story-map-water\" x=\"0\" y=\"0\" width=\"1200\" height=\"760\" rx=\"28\"></rect><g class=\"story-map-terrain-layer\">" + terrain + "</g><g class=\"story-map-region-labels\">" + labels + "</g><g class=\"story-map-routes\">" + routes + "</g><g class=\"story-map-locations\">" + nodes + "</g></svg><div class=\"story-map-legend\"><span><i class=\"legend-dot open\"></i>已開放</span><span><i class=\"legend-dot planned\"></i>後續建檔</span><span><i class=\"legend-line\"></i>步行／水路</span><span><i class=\"legend-line rift\"></i>界痕位移</span></div></div><aside class=\"story-map-details\"><h4>" + escapeHtml(selected.name) + "</h4><p class=\"story-map-location-meta\"><b>地形</b>" + escapeHtml(selected.terrain) + "<br><b>版本</b>" + escapeHtml(selected.versionRange) + "<br><b>區域</b>" + escapeHtml(selectedRegion.name || "星界航線") + "</p><p>" + escapeHtml(selected.description) + "</p>" + (localSites ? "<div class=\"story-map-local-sites\"><strong>1.2 現地分區</strong><ul>" + localSites + "</ul></div>" : "") + "<div class=\"story-map-related\"><strong>相關章節</strong>" + (selectedChapters || "<small>此處尚未綁定章節。</small>") + "</div></aside></div><p class=\"story-map-continuity\"><strong>方位與行程</strong> 此圖只標已定的相對方位，非比例地圖。界痕位移不是日常道路；獸靈之村向西兩日到白鐘，白鐘向北三日到霧橋。霧橋到洛汀須先南返白鐘三日，再順流兩日；洛汀相對白鐘的精確羅盤角與斷橋局部幾何仍待核定。</p>";
    }
    function renderStoryReader(state, chapter) {
      if (data.releaseConfig && data.releaseConfig.open11 && window.StarshipStoryReader && chapter) {
        window.StarshipStoryReader.render({ container: byId("story-reader"), state: state, chapter: chapter,
          bodyMarkup: function (scene, index) { return storyBodyMarkup(scene.body, "story-body", index + 1, chapter.id, { authorPreview: true }); },
          onAction: performLiveStoryAction });
        return;
      }
      var scene = storySceneById(chapter, currentStorySceneId) || chapter.scenes[0];
      currentStorySceneId = scene.id;
      var claimed = sceneClaimed(state, chapter.id, scene.id);
      var sceneIndex = Math.max(0, chapter.scenes.findIndex(function (item) { return item.id === scene.id; }));
      var finalScene = chapter.id === "main-1-0" && sceneIndex === chapter.scenes.length - 1;
      var versionClaimed = storyVersionClaimed(state);
      var priorScenesComplete = chapter.scenes.slice(0, -1).every(function (item) { return sceneClaimed(state, chapter.id, item.id); });
      var sceneTitle = storySceneDisplayTitle(chapter, scene, sceneIndex);
      var sceneButtons = chapter.scenes.map(function (item, index) { return "<button class=\"story-scene-button " + (item.id === scene.id ? "active " : "") + (sceneClaimed(state, chapter.id, item.id) ? "claimed" : "") + "\" data-scene-id=\"" + escapeHtml(item.id) + "\" type=\"button\"><span>" + escapeHtml(storySceneDisplayTitle(chapter, item, index)) + "</span><small>" + (index === chapter.scenes.length - 1 ? (versionClaimed ? "1.0 版本獎勵已領取" : "讀完五幕可領 1.0 版本獎勵") : (sceneClaimed(state, chapter.id, item.id) ? "已讀完" : "尚未讀完")) + "</small></button>"; }).join("");
      var fullChapter = chapter.scenes.map(function (item, index) {
        return "<article class=\"complete-scene-block\"><span class=\"scene-label\">SCENE " + String(index + 1).padStart(2, "0") + "</span><h4>" + escapeHtml(storySceneDisplayTitle(chapter, item, index)) + "</h4>" + storyBodyMarkup(item.body, "story-body story-full-body", index + 1, chapter.id) + "</article>";
      }).join("");
      var chapterBody = chapter.scenes.map(function (item) { return item.body || ""; }).join("\n");
      var npcCount = Object.keys(data.storyCharacters || {}).filter(function (id) { return chapterBody.includes(data.storyCharacters[id].name); }).length;
      var characterCount = chapter.characters.filter(function (id) { return Boolean(data.cards[id]); }).length + npcCount;
      var length = storyLength(chapter);
      var needsLongDraft = chapter.type === "main" && chapter.releaseOpen !== false && length < 10000;
      var sourceLabel = chapter.sourceStatus === "document-tab-missing" ? "補充正文" : (needsLongDraft ? "現存原稿" : "文件正文");
      var portraitEntries = Object.keys(data.storyCharacters || {}).map(function (id) { return data.storyCharacters[id]; }).concat(chapter.characters.map(function (id) { return data.cards[id]; }).filter(Boolean));
      var scenePortraits = portraitEntries.filter(function (entry) { return entry.name && (entry.portrait || entry.image) && String(scene.body || "").includes(entry.name); }).slice(0, 4).map(function (entry) {
        var source = characterPortraitSource(entry, game && game.getState());
        return "<figure class=\"story-portrait\"><img src=\"" + escapeHtml(source) + "\" alt=\"" + escapeHtml(entry.name + " 角色立繪") + "\" loading=\"lazy\"><figcaption><strong>" + escapeHtml(entry.name) + "</strong><small>" + escapeHtml(entry.romanizedName || "") + "</small></figcaption></figure>";
      }).join("");
      byId("story-reader").innerHTML = "<div class=\"story-reader-kicker\"><span>" + escapeHtml(storyVersionLabel(chapter) + " / " + (chapter.type === "main" ? "主線" : "支線") + " / " + chapter.region) + "</span><span class=\"story-source-badge\">" + sourceLabel + "</span></div><h3>" + escapeHtml(chapter.title) + "</h3><p class=\"story-summary\">" + escapeHtml(chapter.summary) + "</p>" + storyGuideMarkup(chapter) + "<div class=\"story-reader-meta\"><span>正文 <b>" + number(length) + " 字</b></span><span>約 <b>" + Math.max(1, Math.ceil(length / 500)) + " 分鐘</b></span><span><b>" + chapter.scenes.length + " 幕</b></span><span><b>" + characterCount + " 名角色</b></span></div><div class=\"story-character-tags\">" + chapter.characters.map(function (id) { var card = data.cards[id]; return card ? "<span>" + escapeHtml(card.name) + "｜" + escapeHtml(card.element) + "</span>" : ""; }).join("") + "</div><div class=\"story-scene-reader\"><span class=\"scene-label\">SCENE " + escapeHtml(scene.id.toUpperCase()) + "</span><h4>" + escapeHtml(sceneTitle) + "</h4>" + (scenePortraits ? "<div class=\"story-portraits\" aria-label=\"本幕登場角色\">" + scenePortraits + "</div>" : "") + storyBodyMarkup(scene.body, "story-body", sceneIndex + 1, chapter.id) + "<div class=\"story-reward-bar\"><span>1.0 版本獎勵・五幕完成領取一次</span><strong>+1,600 星砂・+3,600 角色經驗・+1 星痕</strong><button class=\"primary-action\" data-complete-scene=\"" + escapeHtml(scene.id) + "\" type=\"button\"" + ((finalScene ? versionClaimed || !priorScenesComplete : claimed) ? " disabled" : "") + ">" + (finalScene ? (versionClaimed ? "版本獎勵已領取" : "完成第五幕並領取版本獎勵") : (claimed ? "已讀完" : "標記本幕已讀完")) + "</button></div></div><div class=\"story-scene-list\"><div class=\"story-scene-heading\"><span>本章幕次導覽</span><small>支線與主線都已依劇情順序編號；最後一幕標為終幕</small></div>" + sceneButtons + "</div><section class=\"story-full-chapter\"><div class=\"story-full-heading\"><span>" + (needsLongDraft ? "目前收錄的劇情" : "本章完整劇情") + "</span><small>" + (needsLongDraft ? "現存原稿尚未達長篇篇幅；以下顯示目前收錄的所有幕次" : "所有幕次內容都會顯示") + "</small></div><div>" + fullChapter + "</div></section>";
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
        byId("story-chapters").innerHTML = "<div class=\"empty\">這類劇情尚未開放。</div>";
        byId("story-reader").innerHTML = "<div class=\"empty\">目前可閱讀 1.0 主線；支線仍在製作。</div>";
        if (byId("story-world-map")) byId("story-world-map").innerHTML = "";
        return;
      }
      if (!current || current.type !== currentStoryTab || current.releaseOpen === false) { current = chapters[0]; currentStoryChapterId = current.id; currentStorySceneId = current.scenes[0].id; }
      byId("story-main-tab").classList.toggle("active", currentStoryTab === "main"); byId("story-side-tab").classList.toggle("active", currentStoryTab === "side");
      var openButtons = chapters.map(function (chapter) { var done = chapter.scenes.filter(function (scene) { return sceneClaimed(state, chapter.id, scene.id); }).length; return "<button class=\"story-chapter-button " + (chapter.id === current.id ? "active" : "") + "\" data-story-id=\"" + escapeHtml(chapter.id) + "\" type=\"button\"><span class=\"story-version\">" + escapeHtml(storyVersionLabel(chapter)) + "</span><span><strong>" + escapeHtml(chapter.title) + "</strong><small>" + escapeHtml(chapter.region) + " · " + done + "/" + chapter.scenes.length + " 幕 · " + number(storyLength(chapter)) + " 字</small></span></button>"; }).join("");
      var lockedRoadmap = lockedStoryChapterList().map(function (chapter) { return "<div class=\"story-roadmap-card\"><span class=\"story-version\">" + escapeHtml(storyVersionLabel(chapter)) + "</span><div><strong>" + escapeHtml(chapter.title) + "</strong><small>已建檔 · 版本更新後開放 · " + chapter.scenes.length + " 幕</small></div><span class=\"roadmap-lock\">LOCKED</span></div>"; }).join("");
      byId("story-chapters").innerHTML = openButtons + (lockedRoadmap ? "<div class=\"story-roadmap-heading\">後續版本檔案</div>" + lockedRoadmap : "");
      decorateStoryRoadmap();
      byId("story-view-status").textContent = currentStoryTab === "main" ? "主線 1.0 已開放｜後續章節籌備中" : "支線籌備中";
      renderStoryWorldMap(current);
      renderStoryReader(state, current);
      decorateStoryMythic(current);
      moveStoryPlotToTop();
    }
    function renderCharacters() {
      if (!game) return;
      var state = game.getState(); var owned = rosterCards().filter(function (card) { return (state.collection[card.id] || 0) > 0; }).length;
      byId("character-view-status").textContent = "已取得 " + owned + " 名";
      byId("character-exp").textContent = number(state.resources.characterExp);
      var personalCoreTotal = rosterCards().reduce(function (sum, card) { var progress = state.characterProgress[card.id] || {}; return sum + (Number(progress.constellationCore) || 0); }, 0);
      if (byId("character-core")) byId("character-core").textContent = number(personalCoreTotal);
      byId("character-star-marks").textContent = number(state.resources.starMarks);
      var searchTerm = characterSearchTerm.trim().toLocaleLowerCase();
      var visibleCards = rosterCards().filter(function (card) {
        var copies = state.collection[card.id] || 0;
        var matchesFilter = characterListFilter === "all" || (characterListFilter === "owned" && copies > 0) || (characterListFilter === "rarity4" && card.rarity === 4) || (characterListFilter === "rarity3" && card.rarity === 3);
        var searchable = [card.name, card.romanizedName, card.element, card.releaseVersion, card.id].join(" ").toLocaleLowerCase();
        return matchesFilter && (!searchTerm || searchable.indexOf(searchTerm) >= 0);
      });
      byId("character-list-count").textContent = "顯示 " + visibleCards.length + " / " + rosterCards().length + " 名";
      byId("character-list").innerHTML = visibleCards.length ? visibleCards.map(function (card) {
        var copies = state.collection[card.id] || 0; var progress = state.characterProgress[card.id] || { level: 1, affinity: 0, constellation: 0, constellationCore: 0, breakthrough: false }; var cost = developmentCost(card, progress.level); var requirement = data.characterBreakthroughs[card.id]; var materialAmount = requirement ? Number(state.breakthroughMaterials[requirement.materialId] || 0) : 0; var universalAmount = Number(state.breakthroughMaterials["universal-core"] || 0); var availableBreakthrough = materialAmount + universalAmount; var needBreakthrough = Boolean(copies && progress.level >= api.DEFAULT_RULES.development.breakthroughLevel && !progress.breakthrough); var atMax = Boolean(copies && progress.level >= api.DEFAULT_RULES.development.maxLevel); var power = characterPower(card.id, state); var animation = characterAnimationFor(card.id); var portrait = characterPortraitSource(card, state, true); var style = "--accent:" + escapeHtml(card.accent || "#9e92ff") + (portrait ? ";--card-image:url('" + escapeHtml(portrait) + "')" : "");
        var growthAction;
        if (!copies) growthAction = "<button class=\"secondary-action growth-button\" data-develop-character=\"" + escapeHtml(card.id) + "\" type=\"button\" disabled>" + (Number(card.releaseVersion) > Number(data.updateVersion || "1.0") ? escapeHtml(card.releaseVersion) + " 尚未開放" : "尚未取得") + "</button>";
        else if (needBreakthrough) growthAction = "<button class=\"secondary-action growth-button breakthrough-growth-button\" data-breakthrough-character=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (availableBreakthrough < Number(requirement.cost || 0) ? " disabled" : "") + ">突破　" + escapeHtml(requirement.materialName) + " " + requirement.cost + "（通用 " + universalAmount + "）</button>";
        else growthAction = "<button class=\"secondary-action growth-button\" data-develop-character=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (atMax || state.resources.characterExp < cost.characterExp ? " disabled" : "") + ">" + (atMax ? "已達 90 等" : "升級　" + cost.characterExp + " 經驗") + "</button>";
        return "<article class=\"character-growth-card compact-character-card " + (copies ? "owned" : "locked") + " rarity-" + card.rarity + "\" data-open-character=\"" + escapeHtml(card.id) + "\" tabindex=\"0\" aria-label=\"查看" + escapeHtml(card.name) + "培養資料\"><div class=\"character-growth-art\" style=\"" + style + "\"><span>" + escapeHtml(card.element) + "</span><strong>" + escapeHtml(card.name) + "</strong><small>" + escapeHtml(card.romanizedName) + "</small></div><div class=\"character-growth-body\"><div class=\"compact-character-heading\"><span class=\"rarity-label\">" + "★".repeat(card.rarity) + "</span><span class=\"compact-element\">" + escapeHtml(card.element) + "元素</span></div><h3>" + escapeHtml(card.name) + "</h3><div class=\"growth-stats\"><span>戰力 <b>" + number(power) + "</b></span><span>Lv.<b>" + progress.level + "/90</b></span><span>命座 <b>" + (progress.constellation || 0) + "/6</b></span><span>持有 <b>×" + copies + "</b></span></div><div class=\"growth-actions\">" + growthAction + "</div></div></article>";
      }).join("") : "<div class=\"character-list-empty\">找不到符合條件的角色，請調整搜尋或篩選。</div>";
      if (currentCharacterId) { renderCharacterDetail(currentCharacterId); }
    }
    function characterStatsFor(cardId, progress) {
      var progressState = { characterProgress: {} };
      progressState.characterProgress[cardId] = progress || {};
      return window.StarshipBattle && window.StarshipBattle.buildEffectiveStats ? window.StarshipBattle.buildEffectiveStats(data.characterBattleStats, progressState)[cardId] || null : data.characterBattleStats[cardId] || null;
    }
    function characterPower(cardId, state) {
      var stats = effectiveBattleStats(state);
      return window.StarshipBattle && stats[cardId] ? window.StarshipBattle.teamPower([cardId], stats) : 0;
    }
    function characterAnimationFor(cardId) {
      return data.characterAnimations && data.characterAnimations[cardId] || null;
    }
    function resetCharacterAnimationVideo() {
      var video = byId("character-animation-video");
      if (!video) return;
      video.pause();
      video.removeAttribute("src");
      video.removeAttribute("poster");
      video.load();
    }
    function closeCharacterAnimation() {
      var dialog = byId("character-animation-dialog");
      if (!dialog) return;
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
      resetCharacterAnimationVideo();
    }
    function openCharacterAnimation(cardId) {
      var card = data.cards[cardId]; var animation = characterAnimationFor(cardId); var dialog = byId("character-animation-dialog"); var video = byId("character-animation-video");
      if (!card || !animation || !dialog || !video) {
        showMessage("這名角色目前尚未收錄角色動畫。", true);
        return;
      }
      byId("character-animation-title").textContent = card.name + "｜角色動畫";
      byId("character-animation-subtitle").textContent = card.romanizedName + " · " + card.releaseVersion + " 版本動態立繪";
      byId("character-animation-caption").textContent = "1.0–1.5 角色動態立繪 · 約 " + (animation.durationSeconds || 5) + " 秒 · 循環播放";
      byId("character-animation-empty").hidden = true;
      video.setAttribute("aria-label", card.name + "角色動畫");
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      var portrait = characterPortraitSource(card, game && game.getState());
      if (portrait) video.setAttribute("poster", portrait);
      video.src = animation.src;
      video.load();
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      var playback = video.play();
      if (playback && typeof playback.catch === "function") playback.catch(function () { /* 瀏覽器可能禁止自動播放，保留控制列供玩家手動播放。 */ });
    }
    function seasonSkinsFor(cardId) {
      var config = data.voyageConfig || {};
      var skins = Array.isArray(config.seasonSkins) ? config.seasonSkins : (config.seasonSkin ? [config.seasonSkin] : []);
      return skins.filter(function (skin) { return skin && skin.characterId === cardId; });
    }
    function seasonSkinFor(cardId) {
      return seasonSkinsFor(cardId)[0] || null;
    }
    function characterSkinUnlocked(state, skin) {
      return Boolean(skin && state && state.cosmetics && state.cosmetics.skins && state.cosmetics.skins[skin.id]);
    }
    function characterSkinMarkup(card, state, skins, activeId) {
      if (!skins.length) return "<section class=\"character-skin-panel skin-empty\"><div><span class=\"eyebrow\">CHARACTER OUTFIT</span><h4>目前沒有專屬造型</h4><p>之後有角色造型時，會在這裡顯示預覽與取得方式。</p></div></section>";
      var equippedId = state.cosmetics && state.cosmetics.equippedSkins && state.cosmetics.equippedSkins[card.id] || "";
      var baseButton = state.collection[card.id] ? "<button class=\"secondary-action skin-equip-button\" data-skin-equip=\"\" type=\"button\"" + (!equippedId ? " disabled" : "") + ">" + (!equippedId ? "原始立繪上場中" : "改用原始立繪上場") + "</button>" : "";
      return "<div class=\"character-skin-list\"><div class=\"skin-base-choice\"><span>上場圖片可以在原始立繪與已購買造型間切換。</span>" + baseButton + "</div><div id=\"character-skin-message\" class=\"message\" role=\"status\" aria-live=\"polite\"></div>" + skins.map(function (skin) {
        var active = activeId === skin.id; var unlocked = characterSkinUnlocked(state, skin); var equipped = equippedId === skin.id; var previewImage = skin.previewImage || characterPortraitSource(card, game && game.getState()); var status = equipped ? "上場中" : unlocked ? "已收藏" : "尚未購買"; var buttonLabel = active ? "返回上場立繪" : "預覽造型";
        return "<section class=\"character-skin-panel " + (active ? "skin-active " : "") + (unlocked ? "skin-unlocked" : "skin-locked") + "\" style=\"--skin-accent:" + escapeHtml(skin.accent || card.accent || "#9e92ff") + "\"><div class=\"character-skin-preview\"><img src=\"" + escapeHtml(previewImage) + "\" alt=\"" + escapeHtml(card.name + "「" + skin.name + "」造型預覽") + "\" loading=\"lazy\"><div class=\"skin-preview-ribbon\"><span>" + escapeHtml(skin.themeLabel || "SEASON OUTFIT") + "</span><strong>" + escapeHtml(skin.previewTitle || skin.name) + "</strong></div><i class=\"skin-preview-orbit\"></i></div><div class=\"character-skin-copy\"><div class=\"skin-copy-heading\"><div><span class=\"eyebrow\">角色造型</span><h4>" + escapeHtml(skin.name) + "</h4></div><b class=\"skin-status\">" + status + "</b></div><p>" + escapeHtml(skin.description || "只改變角色外觀，不改變戰鬥數值。") + "</p><small>取得方式｜" + escapeHtml(skin.source || "大廳商店購買") + "</small><div class=\"skin-buttons\"><button class=\"secondary-action skin-preview-button\" data-skin-preview=\"" + escapeHtml(skin.id) + "\" type=\"button\" aria-pressed=\"" + (active ? "true" : "false") + "\">" + buttonLabel + "</button>" + (unlocked && state.collection[card.id] ? "<button class=\"primary-action skin-equip-button\" data-skin-equip=\"" + escapeHtml(skin.id) + "\" type=\"button\"" + (equipped ? " disabled" : "") + ">" + (equipped ? "上場中" : "選為上場造型") + "</button>" : "") + "</div></div></section>";
      }).join("") + "</div>";
    }
    function renderCharacterDetail(cardId) {
      var state = game && game.getState(); var card = data.cards[cardId]; var detail = byId("character-detail");
      if (!state || !card || !detail) return;
      var copies = state.collection[card.id] || 0; var progress = state.characterProgress[card.id] || { level: 1, affinity: 0, constellation: 0, constellationCore: 0, breakthrough: false }; var cost = developmentCost(card, progress.level); var requirement = data.characterBreakthroughs[card.id]; var materialAmount = requirement ? Number(state.breakthroughMaterials[requirement.materialId] || 0) : 0; var universalAmount = Number(state.breakthroughMaterials["universal-core"] || 0); var needBreakthrough = Boolean(copies && progress.level >= api.DEFAULT_RULES.development.breakthroughLevel && !progress.breakthrough); var atMax = Boolean(copies && progress.level >= api.DEFAULT_RULES.development.maxLevel); var stats = characterStatsFor(card.id, progress) || {}; var power = characterPower(card.id, state);
      // 角色詳情與文件共用乾淨的 portraitImage；識別資訊獨立排在圖片上方，
      // 不再把名片卡疊在角色臉部、武器或服裝上。
      var skins = seasonSkinsFor(card.id); var activeSkin = skins.find(function (item) { return item.id === currentCharacterSkinId; }) || null; var skinActive = Boolean(activeSkin); var image = skinActive && activeSkin.previewImage ? activeSkin.previewImage : characterPortraitSource(card, state, true); var animation = characterAnimationFor(card.id);
      var portraitHeading = "<div class=\"portrait-heading\"><div><strong>" + escapeHtml(card.name) + "</strong><small>" + escapeHtml(card.romanizedName) + " · " + escapeHtml(card.releaseVersion) + " 版本</small></div><span>" + "★".repeat(card.rarity) + "<b>" + escapeHtml(card.element) + "元素</b></span></div>";
      var developAction = !copies ? "<button class=\"primary-action\" type=\"button\" disabled>尚未取得</button>" : needBreakthrough ? "<button class=\"primary-action\" type=\"button\" disabled>請先完成 80 等突破</button>" : atMax ? "<button class=\"primary-action\" type=\"button\" disabled>已達現行上限 90 等</button>" : "<button class=\"primary-action\" data-detail-develop=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (state.resources.characterExp < cost.characterExp ? " disabled" : "") + ">升級　" + cost.characterExp + " 角色經驗</button>";
      var breakthroughAction = needBreakthrough && requirement ? "<button class=\"secondary-action breakthrough-detail-action\" data-detail-breakthrough=\"" + escapeHtml(card.id) + "\" type=\"button\"" + (materialAmount + universalAmount < Number(requirement.cost || 0) ? " disabled" : "") + ">突破　" + escapeHtml(requirement.materialName) + " " + requirement.cost + "（通用 " + universalAmount + "）</button>" : "";
      var animationAction = animation ? "<button class=\"secondary-action character-animation-button\" data-character-animation=\"" + escapeHtml(card.id) + "\" type=\"button\">▶ 角色動畫</button>" : "<span class=\"character-animation-unavailable\"><strong>角色動畫</strong><small>目前尚未收錄</small></span>";
      var breakthroughNote = requirement ? (progress.breakthrough ? "已完成 80 等突破，可繼續升到 90 等" : "建議 Boss｜" + escapeHtml((bossStageById(requirement.bossId) || {}).name || "未設定") + "　指定材料｜" + escapeHtml(requirement.materialName) + " " + materialAmount + "/" + requirement.cost + "　通用印記｜" + universalAmount + "（可替代）") : "突破材料設定尚未載入";
      var ascendedPreview = card.id === "isar" && data.isarAscended ? "<details class=\"character-variant\"><summary>查看伊薩爾 4★ 升格卡面（圖鑑預覽）</summary><img src=\"" + escapeHtml(data.isarAscended.portrait) + "\" alt=\"伊薩爾四星升格卡面\" loading=\"lazy\"><p>升格卡面與三星原稿分開保留，目前不加入召集池。</p></details>" : "";
      var formControls = card.id === "elorna" && copies ? "<section class=\"character-variant\"><h4>上場型態</h4><p>兩型態共享面板與命座；陸地偏測線，深水偏救援。</p><div class=\"detail-actions\"><button class=\"secondary-action\" data-character-form=\"land\" type=\"button\" aria-pressed=\"" + (progress.activeForm !== "deepwater") + "\">陸地／淺水</button><button class=\"secondary-action\" data-character-form=\"deepwater\" type=\"button\" aria-pressed=\"" + (progress.activeForm === "deepwater") + "\">深水魚尾</button></div></section>" : "";
      var constellationTips = {
        chodan: {
          1: "Chodan 施放「月式鼓點」後，由其他隊友施放技能消耗合拍；普通攻擊不算。C1 可讓合拍從 2 次增加為 3 次。",
          2: "讓莉亞、Siyeon 等治療角色，或能施放護盾的隊友，在合拍期間使用技能；接受治療或護盾的隊友會短暫減傷。",
          4: "其他隊友首次使用合拍時，Chodan 的技能冷卻縮短 1；每場戰鬥只觸發一次。",
          6: "要帶滿四人隊：Chodan 以外的 3 位不同隊友，須在合拍持續期間各施放一次技能；普通攻擊不計入。"
        },
        celesia: {
          2: "讓兩位不同隊友命中「星痕」目標，第二位隊友會觸發追加傷害。",
          6: "需要三位不同隊友接續命中同一個「星痕」目標；建議帶滿四人隊。"
        },
        hina: { 2: "讓其他隊友命中 Hina 已標記的敵人，才能觸發追擊。" },
        magenta: { 6: "讓其他隊友命中 Magenta 降防中的敵人，才能觸發回響。" }
      };
      var growthNote = card.rarity === 4 ? "每解鎖 1 命，等級成長後的生命、攻擊、防禦各增加 8%；速度按基礎值增加 0.4%，技能面板倍率按基礎值增加 1%。" : "每解鎖 1 命，等級成長後的生命、攻擊、防禦各增加 3.5%；速度按基礎值增加 0.4%，技能面板倍率按基礎值增加 1.8%。";
      var futurePrototype = Number(card.releaseVersion) >= 2 && !stats.signature;
      var prototypeEffect = "";
      if (futurePrototype) {
        var role = stats.role;
        if (["治療", "拾音"].includes(role)) prototypeEffect = "目前試玩：僅在隊友受傷時，治療生命比例最低者；回復量為自身最大生命 18% ＋自身攻擊力 45%。";
        else if (role === "修復") prototypeEffect = "目前試玩：僅在隊友受傷時，治療最多 3 人，各回復自身最大生命 12% ＋自身攻擊力 45%；移除受療者的治療降低效果，並使其受傷減少 12% 共 2 輪。";
        else if (["守衛", "重裝", "守門"].includes(role)) prototypeEffect = "目前試玩：下一次自身受擊減傷 " + (role === "守門" ? "54%" : "46%") + "；全隊防禦提高約 " + (role === "守門" ? "16.3%" : "11.1%") + " 共 2 輪。" + (role === "守門" ? "另清除敵方攻擊與易傷增益。" : "");
        else if (["指揮", "支援", "節奏"].includes(role)) prototypeEffect = "目前試玩：全隊" + (role === "指揮" ? "攻擊提高 13%" : role === "節奏" ? "速度提高 16%" : "防禦提高約 13.6%") + "，持續 2 輪。";
        else prototypeEffect = "目前試玩：對一名敵人造成自身攻擊力 × 技能倍率的傷害。" + (["校準", "測量", "編譯", "仲裁"].includes(role) ? "目標防禦降低 22% 共 2 輪。" : role === "鍛路" ? "目標攻擊降低 26% 共 2 輪。" : ["射手", "斥候", "獵人"].includes(role) ? "附加一次易傷標記，使下一次受擊傷害提高 18%。" : role === "爆發" ? "另一名敵人另受主技能原始倍率 45% 的傷害。" : "");
      }
      var skillDescription = futurePrototype ? prototypeEffect + " 未來專屬設計方向：" + (stats.skillEffect || "待定") + "（尚未實作，數值待定）。" : stats.skillEffect || "尚未登錄";
      var constellationMarkup = Array.isArray(stats.constellations) ? "<details class=\"character-variant constellation-details\"><summary>查看 C1–C6 命座效果</summary><p class=\"constellation-growth-note\">共通面板成長｜" + escapeHtml(growthNote) + "各命效果累積生效；生命、攻擊、防禦與速度最終取整數。技能面板倍率是展示數值，實戰依下列技能公式計算；護盾最多累積至受盾者最大生命的 28%。</p><ol>" + stats.constellations.map(function (effect, index) { var tip = constellationTips[card.id] && constellationTips[card.id][index + 1]; return "<li><span>" + escapeHtml(effect) + "</span>" + (tip ? "<small class=\"constellation-tip\"><strong>搭配提醒</strong>" + escapeHtml(tip) + "</small>" : "") + "</li>"; }).join("") + "</ol></details>" : "";
      var upgradeControls = "<div class=\"detail-upgrade\"><div class=\"detail-upgrade-actions\">" + developAction + breakthroughAction + "</div><small>可用角色經驗 " + number(state.resources.characterExp) + "</small></div>";
      detail.innerHTML = "<button class=\"detail-close small-button\" data-close-character type=\"button\">× 關閉角色詳情</button><div class=\"character-detail-grid\"><div class=\"character-portrait-column\">" + portraitHeading + "<div class=\"character-portrait-frame " + (skinActive ? "portrait-skin-active" : "") + "\"><img src=\"" + escapeHtml(image || "") + "\" alt=\"" + escapeHtml(card.name + (skinActive && activeSkin ? "「" + activeSkin.name + "」" : "") + " 完整立繪，" + "★".repeat(card.rarity) + "，" + card.element) + "\" loading=\"eager\">" + (skinActive && activeSkin ? "<span class=\"portrait-skin-badge\">造型預覽</span>" : "") + "</div></div><div class=\"character-detail-copy\"><p class=\"eyebrow\">CHARACTER DEVELOPMENT / " + escapeHtml(card.romanizedName.toUpperCase()) + "</p><h3>" + escapeHtml(card.name) + "</h3><p class=\"detail-note\">" + escapeHtml(card.note) + "</p><div class=\"detail-progress\"><span>戰力 <b>" + number(power) + "</b></span><span>等級 <b>Lv." + progress.level + " / 90</b></span><span>命座 <b>" + (progress.constellation || 0) + " / 6</b></span><span>持有 <b>×" + copies + "</b></span></div><div class=\"detail-stat-grid\"><span>生命 <b>" + number(stats.maxHp || 0) + "</b></span><span>攻擊 <b>" + number(stats.attack || 0) + "</b></span><span>防禦 <b>" + number(stats.defense || 0) + "</b></span><span>速度 <b>" + number(stats.speed || 0) + "</b></span><span>定位 <b>" + escapeHtml(stats.role || "—") + "</b></span><span>攻擊手段 <b>" + escapeHtml(stats.attackName || "—") + "</b></span></div>" + upgradeControls + "<div class=\"detail-skill\"><span>技能｜" + escapeHtml(stats.skillName || "—") + "</span><p>" + escapeHtml(skillDescription) + "</p></div>" + formControls + constellationMarkup + characterSkinMarkup(card, state, skins, currentCharacterSkinId) + ascendedPreview + "<div class=\"breakthrough-detail-note\">" + breakthroughNote + "</div><div class=\"detail-actions\">" + animationAction + "</div><p class=\"detail-resource-hint\">命座由重複角色自動增加，不需要在這裡再次按提升；三星命座以專屬機制與可靠度成長，滿命仍可上場；同定位滿等四星通常有更高上限，伊薩爾滿命可接近四星前排。角色到 80 等後，必須取得指定 Boss 的突破材料才能繼續升到 90 等。</p></div></div>";
      detail.hidden = false;
    }
    function openCharacterDetail(cardId) { currentCharacterId = cardId; currentCharacterSkinId = ""; renderCharacterDetail(cardId); byId("character-detail").scrollIntoView({ behavior: "smooth", block: "start" }); }
    function equipCharacterSkin(skinId) {
      var request = { cardId: currentCharacterId, skinId: skinId };
      function finish(result) { updateGameFromState(result.state); currentCharacterSkinId = ""; renderCharacters(); renderCharacterDetail(currentCharacterId); byId("character-skin-message").textContent = "上場立繪已更新，戰鬥圖片也會使用此造型。"; }
      function fail(error) { var target = byId("character-skin-message"); target.textContent = error.message; target.className = "message error"; }
      if (remoteMode) { apiRequest("/api/player/character-skin", request).then(finish).catch(fail); return; }
      try { var result = game.equipSkin(request); saveLocalState(); finish(result); } catch (error) { fail(error); }
    }
    function renderShop() {
      var state = game.getState(); var catalog = data.shopCatalog; var progress = state.shopProgress || {}; var purchases = progress.version === catalog.version ? progress.purchases || {} : {}; var conversions = progress.version === catalog.version ? progress.conversions || {} : {};
      byId("shop-version-label").textContent = "本期商店｜" + escapeHtml(catalog.version);
      byId("shop-balance").innerHTML = "<span>星砂 <b>" + number(state.resources.starSand) + "</b></span><span>角色經驗 <b>" + number(state.resources.characterExp) + "</b></span>";
      byId("shop-materials").innerHTML = catalog.materials.map(function (item) {
        var count = Number(purchases[item.id] || 0); var owned = Number(state.breakthroughMaterials[item.id] || 0); var done = count >= item.limit;
        return "<article class=\"shop-item\"><div class=\"shop-item-copy\"><strong>" + escapeHtml(item.name) + "</strong><small>庫存 " + number(owned) + " · 本期已購 " + count + "/" + item.limit + "</small></div><div class=\"shop-actions\"><button data-shop-kind=\"material\" data-shop-id=\"" + escapeHtml(item.id) + "\" data-shop-payment=\"starSand\" type=\"button\"" + (done || state.resources.starSand < item.sandCost ? " disabled" : "") + ">" + number(item.sandCost) + " 星砂</button><button data-shop-kind=\"material\" data-shop-id=\"" + escapeHtml(item.id) + "\" data-shop-payment=\"characterExp\" type=\"button\"" + (done || state.resources.characterExp < item.expCost ? " disabled" : "") + ">" + number(item.expCost) + " 經驗</button></div></article>";
      }).join("");
      byId("shop-skins").innerHTML = catalog.skins.filter(function (item) { return item.forSale !== false; }).map(function (item) {
        var owned = Boolean(state.cosmetics.skins[item.id]); var card = data.cards[item.characterId]; var characterOwned = Boolean(state.collection[item.characterId]);
        return "<article class=\"shop-skin\"><img src=\"" + escapeHtml(item.image) + "\" alt=\"" + escapeHtml(item.name + "造型立繪") + "\" loading=\"lazy\"><div><strong>" + escapeHtml(item.name) + "</strong><p>" + (characterOwned ? "角色已取得，可在培養頁切換上場立繪。" : "可先收藏；角色取得後可在培養頁選為上場立繪。") + "</p><button data-shop-kind=\"skin\" data-shop-id=\"" + escapeHtml(item.id) + "\" data-shop-payment=\"starSand\" type=\"button\"" + (owned || state.resources.starSand < item.sandCost ? " disabled" : "") + ">" + (owned ? "已收藏" : number(item.sandCost) + " 星砂購買") + "</button></div></article>";
      }).join("");
      byId("shop-conversions").innerHTML = catalog.conversions.map(function (item) {
        var count = Number(conversions[item.id] || 0); var done = item.limit != null && count >= item.limit; var from = item.costKey === "starSand" ? "星砂" : "角色經驗"; var to = item.rewardKey === "starSand" ? "星砂" : "角色經驗";
        return "<article class=\"shop-item\"><div class=\"shop-item-copy\"><strong>" + number(item.cost) + " " + from + " → " + number(item.reward) + " " + to + "</strong><small>" + (item.limit == null ? "不限次數" : "本期已換 " + count + "/" + item.limit + " 次") + "</small></div><div class=\"shop-actions\"><button data-shop-kind=\"conversion\" data-shop-id=\"" + escapeHtml(item.id) + "\" type=\"button\"" + (done || state.resources[item.costKey] < item.cost ? " disabled" : "") + ">立即轉換</button></div></article>";
      }).join("");
    }
    function shopAction(kind, id, payment) {
      if (shopBusy) return;
      shopBusy = true;
      var request = { kind: kind, id: id, payment: payment };
      var button = byId("shop-view").querySelector('[data-shop-kind="' + kind + '"][data-shop-id="' + id + '"]');
      if (button) button.disabled = true;
      function finish(result) { shopBusy = false; updateGameFromState(result.state); renderShop(); renderLobby(); var message = kind === "conversion" ? "資源轉換完成。" : kind === "skin" ? "造型已收藏；取得角色後可到培養頁選為上場圖片。" : "突破材料已加入庫存。"; byId("shop-message").textContent = message; byId("shop-message").className = "message"; }
      function fail(error) { shopBusy = false; renderShop(); byId("shop-message").textContent = error.message; byId("shop-message").className = "message error"; }
      if (remoteMode) { apiRequest("/api/player/shop", request).then(finish).catch(fail); return; }
      try { var result = game.shopAction(request); saveLocalState(); finish(result); } catch (error) { fail(error); }
    }
    function selectCharacterForm(formId) {
      if (remoteMode) { apiRequest("/api/player/character-form", { cardId: currentCharacterId, formId: formId }).then(function (payload) { updateGameFromState(payload.state); renderCharacters(); renderCharacterDetail(currentCharacterId); showMessage("上場型態已儲存。", false); }).catch(function (error) { showMessage(error.message, true); }); return; }
      try { game.setCharacterForm({ cardId: currentCharacterId, formId: formId }); saveLocalState(); renderCharacters(); renderCharacterDetail(currentCharacterId); showMessage("上場型態已儲存到這個瀏覽器。", false); } catch (error) { showMessage(error.message, true); }
    }
    function updateStorySelection(chapterId) {
      var chapter = storyChapterById(chapterId); if (!chapter || chapter.releaseOpen === false) return;
      currentStoryChapterId = chapterId; currentStorySceneId = chapter.scenes[0].id;
      var state = game.getState(); storyProgress(state).currentChapter = chapterId;
      if (remoteMode) { apiRequest("/api/player/story-progress", { action: "select", chapterId: chapterId }).then(function (payload) { updateGameFromState(payload.state); renderStory(); renderLobby(); }).catch(function () { renderStory(); }); }
      else { updateGameFromState(state); saveLocalState(); renderStory(); renderLobby(); }
    }
    function performLiveStoryAction(body) {
      var session = currentPlayerToken;
      var operation;
      if (remoteMode) operation = apiRequest("/api/player/story-progress", body);
      else {
        try { operation = Promise.resolve(window.StarshipStoryReleaseProgress.apply(game.getState(), storyChapterById(body.chapterId), body)); }
        catch (error) { operation = Promise.reject(error); }
      }
      return operation.then(function (payload) {
        if (session !== currentPlayerToken) throw new Error("登入帳號已變更，請重新載入劇情");
        updateGameFromState(payload.state);
        if (!remoteMode) saveLocalState();
        renderStory(); renderLobby(); renderCharacters();
        return payload;
      });
    }
    function completeStoryScene(chapterId, sceneId) {
      if (remoteMode) {
        apiRequest("/api/player/story-progress", { action: "complete", chapterId: chapterId, sceneId: sceneId }).then(function (payload) { updateGameFromState(payload.state); renderStory(); renderLobby(); renderCharacters(); showMessage(payload.alreadyClaimed ? "這一幕已讀完。" : (payload.reward && (payload.reward.starSand || payload.reward.characterExp || payload.reward.starMarks) ? "版本獎勵：" + rewardText(payload.reward) + "已存入帳號。" : "本幕已讀完；讀完第五幕可領版本獎勵。"), false); }).catch(function (error) { showMessage(error.message, true); });
        return;
      }
      var chapter = storyChapterById(chapterId); if (!chapter || chapter.releaseOpen === false) { showMessage("這個版本的劇情已建檔，但尚未開放。", true); return; }
      var state = game.getState(); var progress = storyProgress(state); var key = sceneKey(chapterId, sceneId);
      progress.claimedVersions = progress.claimedVersions || {};
      var finalScene = sceneId === chapter.scenes[chapter.scenes.length - 1].id;
      if (progress.completedScenes[key] && (!finalScene || progress.claimedVersions["1.0"])) { showMessage("這一幕已讀完。", false); return; }
      if (finalScene && !chapter.scenes.slice(0, -1).every(function (item) { return Boolean(progress.completedScenes[sceneKey(chapterId, item.id)]); })) { showMessage("請先讀完前四幕。", true); return; }
      var storyReward = { starSand: 0, characterExp: 0, starMarks: 0 };
      progress.currentChapter = chapterId;
      if (!progress.completedScenes[key]) progress.completedScenes[key] = { completedAt: new Date().toISOString(), starSand: 0, characterExp: 0 };
      if (finalScene && !progress.claimedVersions["1.0"]) {
        var oldClaims = Object.keys(progress.completedScenes).filter(function (oldKey) { return oldKey.indexOf("main-1-0:") === 0; }).map(function (oldKey) { return progress.completedScenes[oldKey]; });
        var oldSand = oldClaims.reduce(function (sum, item) { return sum + Math.max(0, Number(item.starSand) || 0); }, 0);
        var oldExp = oldClaims.reduce(function (sum, item) { return sum + Math.max(0, Number(item.characterExp) || 0); }, 0);
        storyReward.starSand = Math.max(0, data.storyVersionReward.starSand - oldSand);
        storyReward.characterExp = Math.max(0, data.storyVersionReward.characterExp - oldExp);
        storyReward.starMarks = data.storyVersionReward.starMarks;
        state.resources.starSand += storyReward.starSand; state.resources.characterExp += storyReward.characterExp; state.resources.starMarks += storyReward.starMarks;
        progress.claimedVersions["1.0"] = { claimedAt: new Date().toISOString(), reward: storyReward };
      }
      if (chapterId === "main-1-0" && progress.claimedVersions["1.0"] && !state.recruitment.story10ChoiceClaimed) state.recruitment.story10ChoiceAvailable = true;
      updateGameFromState(state); saveLocalState(); renderStory(); renderLobby(); renderCharacters(); showMessage(finalScene ? "版本獎勵：" + rewardText(storyReward) + "已儲存。" : "本幕已讀完；讀完第五幕可領版本獎勵。", false);
    }
    function focusDetailUpgrade() {
      var button = byId("character-detail").querySelector("[data-detail-develop]:not([disabled]), [data-detail-breakthrough]:not([disabled])");
      if (button) button.focus({ preventScroll: true });
    }
    function developCharacter(cardId, fromDetail) {
      currentCharacterId = cardId;
      if (remoteMode) { apiRequest("/api/player/character-development", { cardId: cardId }).then(function (payload) { updateGameFromState(payload.state); renderCharacters(); renderLobby(); if (fromDetail) focusDetailUpgrade(); showMessage("角色升級完成，進度已儲存。", false); }).catch(function (error) { showMessage(error.message, true); }); return; }
      try { game.developCharacter({ cardId: cardId }); saveLocalState(); renderCharacters(); renderLobby(); if (fromDetail) focusDetailUpgrade(); showMessage("角色升級完成，進度已儲存到這個瀏覽器。", false); } catch (error) { showMessage(error.message, true); }
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
    function renderFormation(mode, team, state, stage) {
      var target = byId(mode + "-formation");
      if (!target) return;
      var locksWeakest = stage && ["mark", "multi", "execute", "finale"].indexOf(stage.trialRule) >= 0;
      var rule = locksWeakest ? "本關敵人鎖定生命比例最低的角色，能越過前排；生命比例相同時依格位順序選目標。" : "一般敵人先攻擊前排；前排全退場後才攻擊後排，同排依格位順序選目標。";
      target.innerHTML = "<p class=\"formation-rule\">" + escapeHtml(rule) + "點下方角色加入，再用格位按鈕換位。</p><div class=\"formation-slots\">" + [0, 1, 2, 3].map(function (index) {
        var card = team[index] && data.cards[team[index]]; var row = index < 2 ? "前排" : "後排";
        var portrait = card && characterPortraitSource(card, state, true);
        return "<div class=\"formation-slot " + (card ? "occupied" : "empty") + "\"><span class=\"formation-slot-position\">" + row + " " + (index + 1) + "</span>" + (card ? "<img src=\"" + escapeHtml(portrait || "") + "\" alt=\"\" loading=\"lazy\"><strong>" + escapeHtml(card.name) + "</strong><div class=\"formation-slot-actions\"><button type=\"button\" data-formation-move=\"" + mode + "\" data-formation-index=\"" + index + "\" data-formation-direction=\"-1\" aria-label=\"將" + escapeHtml(card.name) + "往前換一格\"" + (index === 0 ? " disabled" : "") + ">前移</button><button type=\"button\" data-formation-move=\"" + mode + "\" data-formation-index=\"" + index + "\" data-formation-direction=\"1\" aria-label=\"將" + escapeHtml(card.name) + "往後換一格\"" + (index >= team.length - 1 ? " disabled" : "") + ">後移</button></div>" : "<small>尚未編入</small>") + "</div>";
      }).join("") + "</div>";
    }
    function moveFormationMember(mode, index, direction) {
      var teams = { trial: currentTrialTeam, boss: currentBossTeam, dispatch: currentDispatchTeam, voyage: currentVoyageTeam };
      var team = teams[mode], next = index + direction;
      if (!team || !Number.isInteger(index) || !Number.isInteger(direction) || Math.abs(direction) !== 1 || index < 0 || next < 0 || next >= team.length) return;
      var current = team[index]; team[index] = team[next]; team[next] = current;
      var state = game.getState();
      if (mode === "trial") trialProgress(state).selectedTeam = team.slice();
      else if (mode === "boss") bossProgress(state).selectedTeam = team.slice();
      else if (mode === "dispatch") dispatchProgress(state).selectedTeam = team.slice();
      else voyageProgress(state).selectedTeam = team.slice();
      updateGameFromState(state); saveLocalState();
      ({ trial: renderTrial, boss: renderBoss, dispatch: renderDispatch, voyage: renderVoyage })[mode]();
    }
    function enemyArtFor(enemy) {
      var approvedMonsterArt = {
        "黑晶異變巨獸": "./assets/enemies/black-crystal-beast.webp",
        "黑晶棘背獸": "./assets/enemies/black-crystal-spine-beast.webp",
        "黑晶巨獸（原生型）": "./assets/enemies/opening-beast.webp",
        "鳴棘蛛": "./assets/enemies/resonant-spider.webp",
        "鳴棘蛛巢母": "./assets/enemies/spider-mother.webp",
        "苔角行獸": "./assets/enemies/moss-horn-beast.webp",
        "霧境苔晶巨鹿": "./assets/enemies/moss-crystal-deer.webp"
      };
      if (enemy) { var approvedName = Object.keys(approvedMonsterArt).find(function (name) { return String(enemy.name || "").indexOf(name) === 0; }); if (approvedName) return approvedMonsterArt[approvedName]; }
      if (enemy && enemy.image) return enemy.image;
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
    function battleCharacterById(id) {
      return data.cards[id] || rosterCards().find(function (card) { return card.id === id; }) || null;
    }
    function battleHealthPercent(unit) {
      var maxHp = Math.max(1, Number(unit && unit.maxHp) || 1); return Math.max(0, Math.min(100, Math.round((Number(unit && unit.hp) || 0) / maxHp * 100)));
    }
    function battleLogText(line, team) {
      var text = String(line || "");
      (team || []).forEach(function (unit) {
        var card = battleCharacterById(unit.id);
        if (card && card.name && unit.id) text = text.split(String(unit.id)).join(card.name);
      });
      return text;
    }
    function battleUnitMarkup(unit, state, isEnemy, index) {
      var card = !isEnemy ? battleCharacterById(unit.id) : null; var image = isEnemy ? enemyArtFor(unit) : card && characterPortraitSource(card, state, true); var name = isEnemy ? unit.name : card ? card.name : unit.id; var element = isEnemy ? "敵方" : card ? card.element : "角色"; var hp = Number(unit.hp || 0); var maxHp = Number(unit.maxHp || 0); var percent = battleHealthPercent(unit); var defeated = hp <= 0; var slot = Number(unit.slot || index + 1); var row = slot <= 2 ? "前排" : "後排"; var detail = isEnemy ? "敵方單位" : row + " " + slot + " · " + (card ? card.note || "已編入戰鬥" : "已編入戰鬥"); var skillText = !isEnemy && Number(unit.skillUses || 0) ? "技能發動 " + number(unit.skillUses) + " 次" : isEnemy ? "敵方行動" : "等待行動";
      return "<article class=\"battle-unit-card " + (isEnemy ? "enemy-unit" : "ally-unit") + (defeated ? " defeated" : "") + "\"><button class=\"battle-unit-visual\" type=\"button\" data-battle-art=\"" + escapeHtml(image || "") + "\" data-battle-name=\"" + escapeHtml(name) + "\" aria-label=\"放大查看 " + escapeHtml(name) + " 立繪\"><img src=\"" + escapeHtml(image || "") + "\" alt=\"" + escapeHtml(name + " 戰鬥立繪") + "\" loading=\"lazy\"><span>" + escapeHtml(element) + "</span></button><div class=\"battle-unit-copy\"><div class=\"battle-unit-title\"><strong>" + escapeHtml(name) + "</strong><b>" + (defeated ? "已退場" : "作戰中") + "</b></div><small>" + escapeHtml(detail) + "</small><div class=\"battle-hp-track\"><i style=\"width:" + percent + "%\"></i></div><div class=\"battle-unit-meta\"><span>HP <b>" + number(hp) + " / " + number(maxHp) + "</b></span><em>" + escapeHtml(skillText) + "</em></div></div></article>";
    }
    function battleSceneMarkup(battle, state, stage, mode) {
      if (!battle) return "";
      var timedOut = battle.status === "timeout" || battle.timedOut === true; var resultClass = battle.won ? "battle-clear" : timedOut ? "battle-timeout" : "battle-failed"; var team = Array.isArray(battle.team) ? battle.team : []; var enemies = Array.isArray(battle.enemies) ? battle.enemies : []; var highlights = (battle.logs || []).filter(function (line) { return /使用|發動|回覆|離場|通關|失敗|上限|超時/.test(line); }).slice(-6); if (!highlights.length) highlights = (battle.logs || []).slice(-6);
      var title = stage && stage.name ? stage.name : battle.stageName || "自走棋戰鬥"; var environment = battle.environment || stage && stage.environment || "一般戰鬥"; var rule = battle.enemyTrait || stage && stage.enemyTrait || "一般特性";
      return "<section class=\"battle-scene " + resultClass + "\"><div class=\"battle-scene-head\"><div><span class=\"eyebrow\">" + escapeHtml(mode || "AUTO CHESS") + " / " + (battle.won ? "CLEAR" : timedOut ? "TIMEOUT" : "LIVE RESULT") + "</span><strong>參戰立繪回放 · " + escapeHtml(title) + "</strong><small>環境「" + escapeHtml(environment) + "」 · 敵方特性「" + escapeHtml(rule) + "」</small></div><span class=\"battle-round-badge\">第 " + number(battle.rounds || 0) + " 回合</span></div><div class=\"battle-scene-board\"><div class=\"battle-side ally-side\"><div class=\"battle-side-heading\"><span>YOUR SQUAD</span><strong>我方編隊 <b>" + team.length + " 人</b></strong></div><div class=\"battle-unit-grid\">" + (team.length ? team.map(function (unit, index) { return battleUnitMarkup(unit, state, false, index); }).join("") : "<p class=\"battle-empty\">沒有參戰角色</p>") + "</div></div><div class=\"battle-versus\"><span>VS</span><i></i><small>自動演算</small></div><div class=\"battle-side enemy-side\"><div class=\"battle-side-heading\"><span>ENEMY FORMATION</span><strong>敵方編隊 <b>" + enemies.length + " 體</b></strong></div><div class=\"battle-unit-grid\">" + (enemies.length ? enemies.map(function (unit, index) { return battleUnitMarkup(unit, state, true, index); }).join("") : "<p class=\"battle-empty\">敵方已全數撤退</p>") + "</div></div></div><div class=\"battle-scene-feed\"><div><span class=\"eyebrow\">TACTICAL FEED</span><strong>戰鬥事件</strong></div><div class=\"battle-feed-list\">" + (highlights.length ? highlights.map(function (line, index) { return "<p><b>" + String(index + 1).padStart(2, "0") + "</b>" + escapeHtml(battleLogText(line, team)) + "</p>"; }).join("") : "<p><b>—</b>本次戰鬥沒有額外事件。</p>") + "</div></div></section>";
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
      var stage = trialStageById(battle.stageId) || {}; var rewardExp = Number(stage.reward && stage.reward.characterExp || data.trialReward && data.trialReward.characterExp || 0); var timedOut = battle.status === "timeout" || battle.timedOut === true;
      var reward = battle.won ? "本次獎勵：+" + number(Number(stage.reward && stage.reward.starSand || data.trialReward && data.trialReward.starSand || 0)) + " 星砂、+" + number(rewardExp) + " 角色經驗" : timedOut ? "本次戰鬥超過演算上限，未判定通關，不會扣除挑戰次數" : "本次未通關，不會扣除挑戰次數";
      var synergy = battle.synergy === undefined ? "—" : Math.round(Number(battle.synergy) * 100) + "%";
      var environment = battle.environment ? "環境「" + battle.environment + "」" : "";
      var referencePower = Number(stage.recommendedPower || battle.recommendedPower || 0);
      var benchmarkPower = Number(stage.targetPower || referencePower);
      var powerNote = referencePower ? "可挑戰參考 " + number(referencePower) + (stage.targetPower ? "｜終關設計基準 " + number(stage.targetPower) : "") + "｜目前 " + number(battle.teamPower || 0) + "（設計基準 " + Math.round(Number(battle.teamPower || 0) / benchmarkPower * 100) + "%）" + (!battle.won && Number(battle.teamPower || 0) < referencePower ? "｜可提升角色或調整技能搭配再試" : "") : "隊伍戰力 " + number(battle.teamPower || 0);
      container.innerHTML = "<div class=\"trial-result-header " + (battle.won ? "won" : timedOut ? "timeout" : "lost") + "\"><div><span class=\"eyebrow\">BATTLE REPORT / " + (battle.won ? "CLEAR" : timedOut ? "TIMEOUT" : "RETRY") + "</span><strong>" + (battle.won ? "試煉通關" : timedOut ? "戰鬥超時" : "試煉未通關") + " · " + battle.rounds + " 回合</strong><small>" + escapeHtml(reward) + "｜" + escapeHtml(powerNote) + "｜隊伍協同 " + escapeHtml(synergy) + (environment ? "｜" + escapeHtml(environment) : "") + "</small></div><span class=\"battle-power\">隊伍戰力 " + number(battle.teamPower) + "</span></div>" + battleSceneMarkup(battle, state, stage, "TRIAL") + "<details><summary>查看完整自走棋戰鬥紀錄</summary><div class=\"battle-log\">" + (battle.logs || []).map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") + "</div></details>";
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
      byId("trial-stage-details").innerHTML = "<div class=\"trial-stage-kicker\"><span>TRIAL " + String(current.id).padStart(2, "0") + "</span><span>" + escapeHtml(current.region) + "</span>" + (current.finalStage ? "<span>FINAL</span>" : "") + "</div><h3>" + escapeHtml(current.name) + "</h3><p>敵方編成：" + escapeHtml(enemyText) + "</p><div class=\"trial-rule-callout\"><strong>環境｜" + escapeHtml(current.environment || "一般試煉") + "</strong><span>" + escapeHtml(current.environmentEffect || "沒有額外環境效果。") + "</span><strong>敵方特性｜" + escapeHtml(current.enemyTrait || "一般") + "</strong><span>" + escapeHtml(current.enemyTraitEffect || "沒有額外特性。") + "</span></div><div class=\"trial-detail-stats\"><span>可挑戰參考 <b>" + number(current.recommendedPower) + "</b></span>" + (current.targetPower ? "<span>終關設計基準 <b>" + number(current.targetPower) + "</b></span>" : "") + "<span>本版本獎勵 <b>" + number(Number(current.reward && current.reward.starSand || data.trialReward && data.trialReward.starSand || 0)) + " 星砂 + " + number(trialCharacterExp) + " 經驗</b></span><span>可領次數 <b>" + attempts + " / " + maxRewards + "</b></span></div>";
      byId("trial-stage-details").insertAdjacentHTML("beforeend", "<p class=\"trial-power-note\">" + (current.targetPower ? "終關以接近滿等、平均三至四命的四星隊伍作設計基準；可挑戰參考是低配嘗試值，不保證通關。" : "可挑戰參考不是進場門檻或勝敗保證。") + "治療、護盾、技能協同與敵方特性都會改變結果。</p>");
      decorateTrialMythic(current);
      if (byId("trial-enemy-intel")) byId("trial-enemy-intel").innerHTML = "<div class=\"enemy-intel-heading\"><div><span class=\"eyebrow\">ENEMY INTEL</span><strong>敵方圖鑑</strong></div><small>先看敵人的攻防與速度，再安排隊伍協同</small></div><div class=\"enemy-intel-grid\">" + renderEnemyIntel(current) + "</div>";
      var owned = rosterCards().filter(function (card) { return state.collection[card.id] > 0 && data.characterBattleStats[card.id]; });
      currentTrialTeam = currentTrialTeam.filter(function (id) { return owned.some(function (card) { return card.id === id; }); }).slice(0, 4);
      byId("trial-team-count").textContent = currentTrialTeam.length + " / 4 · 戰力 " + number(trialPower(currentTrialTeam, state));
      renderFormation("trial", currentTrialTeam, state, current);
      byId("trial-team-list").innerHTML = owned.length ? owned.map(function (card) {
        var effectiveStats = effectiveBattleStats(state); var stats = effectiveStats[card.id]; var individualPower = window.StarshipBattle ? window.StarshipBattle.teamPower([card.id], effectiveStats) : 0; var selected = currentTrialTeam.indexOf(card.id) >= 0; var image = characterPortraitSource(card, state, true); var style = "--accent:" + escapeHtml(card.accent || "#9e92ff") + (image ? ";--card-image:url('" + escapeHtml(image) + "')" : "");
        return "<button class=\"trial-team-card " + (selected ? "selected" : "") + "\" data-trial-character=\"" + escapeHtml(card.id) + "\" type=\"button\"><span class=\"trial-team-art\" style=\"" + style + "\"><b>" + escapeHtml(card.element) + "</b><strong>" + escapeHtml(card.name) + "</strong></span><span class=\"trial-team-copy\"><strong>" + escapeHtml(card.name) + "</strong><small class=\"character-power-line\">戰力 " + number(individualPower) + "</small><small>" + escapeHtml(stats.role) + " · HP " + number(stats.maxHp) + "</small><small>攻 " + stats.attack + "／防 " + stats.defense + "／速 " + stats.speed + "</small><small>技能｜" + escapeHtml(stats.skillName || "—") + "</small></span><i>" + (selected ? "已編入" : "加入編隊") + "</i></button>";
      }).join("") : "<div class=\"empty\">目前沒有可參戰角色。</div>";
      var startButton = byId("start-trial-battle"); startButton.disabled = !trialUnlocked(state, current.id) || !currentTrialTeam.length || attempts >= maxRewards; startButton.textContent = attempts >= maxRewards ? "本版本已完成 " + maxRewards + " 次" : "開始自走棋戰鬥";
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
        apiRequest("/api/player/trial-battle", { stageId: stage.id, team: currentTrialTeam }).then(function (payload) { var timedOut = payload.battle && (payload.battle.status === "timeout" || payload.battle.timedOut === true); updateGameFromState(payload.state); renderTrial(); renderLobby(); renderCharacters(); showMessage(payload.battle.won ? "星界試煉通關：已獲得 " + trialStarSand + " 星砂與 " + trialCharacterExp + " 角色經驗。" : timedOut ? "本次戰鬥超過演算上限，未判定通關，不會扣除挑戰次數。" : "本次試煉未通關，可以調整編隊後再次挑戰。", !payload.battle.won && !timedOut); }).catch(function (error) { showMessage(error.message, true); });
        return;
      }
      try {
        var state = game.getState(); var progress = trialProgress(state); var attempts = trialAttempts(state, stage.id); var maxRewards = data.trialMaxRewards || 10;
        if (!trialUnlocked(state, stage.id)) throw new Error("請先通關前一關");
        if (attempts >= maxRewards) throw new Error("本關在目前版本已完成 " + maxRewards + " 次，請等待下次遊戲更新重置挑戰次數");
        if (!currentTrialTeam.length) throw new Error("至少派出 1 名角色才能開始戰鬥");
        if (currentTrialTeam.some(function (id) { return !(state.collection[id] > 0) || !data.characterBattleStats[id]; })) throw new Error("只能派出已取得且已開放的角色");
        var battle = window.StarshipBattle.simulateBattle({ team: currentTrialTeam, stats: effectiveBattleStats(state), stage: stage }); progress.selectedTeam = currentTrialTeam.slice(); progress.lastBattle = battle;
        if (battle.won) { progress.attempts[stage.id] = attempts + 1; if (progress.clearedStages.indexOf(stage.id) < 0) progress.clearedStages.push(stage.id); progress.bestStage = Math.max(progress.bestStage || 0, stage.id); state.resources.starSand += trialStarSand; state.resources.characterExp += trialCharacterExp; if (stage.id === 10 && !state.recruitment.trial10ChoiceClaimed) state.recruitment.trial10ChoiceAvailable = true; }
        updateGameFromState(state); saveLocalState(); renderTrial(); renderLobby(); renderCharacters(); showMessage(battle.won ? "星界試煉通關：已獲得 " + trialStarSand + " 星砂與 " + trialCharacterExp + " 角色經驗。" : battle.status === "timeout" ? "本次戰鬥超過演算上限，未判定通關，不會扣除挑戰次數。" : "本次試煉未通關，可以調整編隊後再次挑戰。", battle.status === "defeat");
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
      var stage = bossStageById(battle.stageId) || {}; var reward = stage.reward || {}; var timedOut = battle.status === "timeout" || battle.timedOut === true;
      var rewardCopy = battle.won ? "本次獎勵：+" + number(reward.amount || 0) + " " + escapeHtml(reward.materialName || "突破材料") + "、+" + number(reward.universalAmount || 1) + " 星界通用突破印記、+" + number(reward.characterExp || 0) + " 角色經驗" : timedOut ? "本次戰鬥超過演算上限，未判定通關，不會取得突破材料" : "本次未通關，不會取得突破材料";
      var synergy = battle.synergy === undefined ? "—" : Math.round(Number(battle.synergy) * 100) + "%";
      container.innerHTML = "<div class=\"trial-result-header " + (battle.won ? "won" : timedOut ? "timeout" : "lost") + "\"><div><span class=\"eyebrow\">BOSS REPORT / " + (battle.won ? "CLEAR" : timedOut ? "TIMEOUT" : "RETRY") + "</span><strong>" + (battle.won ? "Boss 挑戰成功" : timedOut ? "Boss 戰鬥超時" : "Boss 挑戰失敗") + " · " + escapeHtml(stage.name || "Boss") + " · " + battle.rounds + " 回合</strong><small>" + rewardCopy + "｜隊伍協同 " + escapeHtml(synergy) + "</small></div><span class=\"battle-power\">隊伍戰力 " + number(battle.teamPower) + "</span></div>" + battleSceneMarkup(battle, state, stage, "BOSS") + "<details><summary>查看完整 Boss 自走棋戰鬥紀錄</summary><div class=\"battle-log\">" + (battle.logs || []).map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") + "</div></details>";
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
      var owned = rosterCards().filter(function (card) { return state.collection[card.id] > 0 && data.characterBattleStats[card.id]; });
      currentBossTeam = currentBossTeam.filter(function (id) { return owned.some(function (card) { return card.id === id; }); }).slice(0, 4);
      byId("boss-team-count").textContent = currentBossTeam.length + " / 4 · 戰力 " + number(trialPower(currentBossTeam, state));
      renderFormation("boss", currentBossTeam, state, current);
      byId("boss-team-list").innerHTML = owned.length ? owned.map(function (card) { var effectiveStats = effectiveBattleStats(state); var stats = effectiveStats[card.id]; var individualPower = window.StarshipBattle ? window.StarshipBattle.teamPower([card.id], effectiveStats) : 0; var selected = currentBossTeam.indexOf(card.id) >= 0; var requirement = data.characterBreakthroughs[card.id]; var image = characterPortraitSource(card, state, true); var style = "--accent:" + escapeHtml(card.accent || "#9e92ff") + (image ? ";--card-image:url('" + escapeHtml(image) + "')" : ""); return "<button class=\"trial-team-card boss-team-card " + (selected ? "selected" : "") + "\" data-boss-character=\"" + escapeHtml(card.id) + "\" type=\"button\"><span class=\"trial-team-art\" style=\"" + style + "\"><b>" + escapeHtml(card.element) + "</b><strong>" + escapeHtml(card.name) + "</strong></span><span class=\"trial-team-copy\"><strong>" + escapeHtml(card.name) + "</strong><small class=\"character-power-line\">戰力 " + number(individualPower) + "</small><small>需要：" + escapeHtml(requirement ? requirement.materialName : "未設定") + "</small><small>" + escapeHtml(stats.role) + " · HP " + number(stats.maxHp) + "</small><small>攻 " + stats.attack + "／防 " + stats.defense + "／速 " + stats.speed + "</small></span><i>" + (selected ? "已編入" : "加入編隊") + "</i></button>"; }).join("") : "<div class=\"empty\">目前沒有可挑戰 Boss 的角色。</div>";
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
        apiRequest("/api/player/boss-battle", { bossId: boss.id, team: currentBossTeam }).then(function (payload) { var timedOut = payload.battle && (payload.battle.status === "timeout" || payload.battle.timedOut === true); updateGameFromState(payload.state); renderBoss(); renderCharacters(); renderLobby(); showMessage(payload.battle.won ? "Boss 挑戰成功：已獲得 " + payload.reward.amount + " " + payload.reward.materialName + " 與 " + payload.reward.characterExp + " 角色經驗。" : timedOut ? "Boss 戰鬥超過演算上限，未判定通關，不會扣除挑戰次數。" : "Boss 挑戰失敗，可以調整編隊後再次挑戰。", !payload.battle.won && !timedOut); }).catch(function (error) { showMessage(error.message, true); });
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
      var battle = result.battle; var mission = dispatchMissionById(result.missionId) || {}; var timedOut = battle.status === "timeout" || battle.timedOut === true; var reward = battle.won ? rewardText(mission.reward || {}) : timedOut ? "戰鬥超過演算上限，未判定完成，不會領取獎勵" : "未通關不會領取獎勵";
      container.innerHTML = "<div class=\"trial-result-header " + (battle.won ? "won" : timedOut ? "timeout" : "lost") + "\"><div><span class=\"eyebrow\">DISPATCH REPORT / " + (battle.won ? "CLEAR" : timedOut ? "TIMEOUT" : "RETRY") + "</span><strong>" + (battle.won ? "委託完成" : timedOut ? "委託戰鬥超時" : "委託未完成") + " · " + escapeHtml(mission.name || "星港委託") + "</strong><small>" + escapeHtml(battle.won ? "獲得：" + reward : reward) + "｜隊伍協同 " + Math.round(Number(battle.synergy || 0) * 100) + "%</small></div><span class=\"battle-power\">隊伍戰力 " + number(battle.teamPower) + "</span></div>" + battleSceneMarkup(battle, state, mission, "DISPATCH") + "<details><summary>查看完整委託戰鬥紀錄</summary><div class=\"battle-log\">" + (battle.logs || []).map(function (line) { return "<p>" + escapeHtml(line) + "</p>"; }).join("") + "</div></details>";
    }
    function renderDispatch() {
      if (!game || !byId("dispatch-missions")) return;
      var state = game.getState(); var progress = dispatchProgress(state); var missions = data.dispatchMissions || []; var current = dispatchMissionById(currentDispatchMissionId) || missions[0];
      if (!current) { byId("dispatch-missions").innerHTML = "<div class=\"empty\">目前沒有開放的星港委託。</div>"; return; }
      currentDispatchMissionId = current.id;
      if (Array.isArray(progress.selectedTeam) && !currentDispatchTeam.length) currentDispatchTeam = progress.selectedTeam.slice(0, 4);
      var owned = rosterCards().filter(function (card) { return state.collection[card.id] > 0 && data.characterBattleStats[card.id]; });
      currentDispatchTeam = currentDispatchTeam.filter(function (id) { return owned.some(function (card) { return card.id === id; }); }).slice(0, 4);
      byId("dispatch-missions").innerHTML = missions.map(function (mission) { var claimed = Boolean(progress.claimed[mission.id]); return "<button class=\"dispatch-mission-card " + (mission.id === current.id ? "active " : "") + (claimed ? "claimed" : "") + "\" data-dispatch-mission=\"" + escapeHtml(mission.id) + "\" type=\"button\"><span class=\"mission-index\">" + escapeHtml(mission.id.replace("dispatch-", "").slice(0, 2).toUpperCase()) + "</span><span><strong>" + escapeHtml(mission.name) + "</strong><small>" + escapeHtml(mission.region) + " · 推薦 " + number(mission.recommendedPower) + "</small></span><em>" + (claimed ? "已完成" : "可執行") + "</em></button>"; }).join("");
      var claimed = Boolean(progress.claimed[current.id]);
      byId("dispatch-mission-details").innerHTML = "<div class=\"trial-stage-kicker\"><span>DISPATCH</span><span>" + escapeHtml(current.region) + "</span>" + (claimed ? "<span>CLAIMED</span>" : "") + "</div><h3>" + escapeHtml(current.name) + "</h3><p>" + escapeHtml(current.description) + "</p><div class=\"trial-rule-callout\"><strong>環境｜" + escapeHtml(current.environment || "一般委託") + "</strong><span>" + escapeHtml(current.environmentEffect || "沒有額外環境效果。") + "</span><strong>敵方特性｜" + escapeHtml(current.enemyTrait || "一般") + "</strong><span>" + escapeHtml(current.enemyTraitEffect || "沒有額外特性。") + "</span></div><div class=\"trial-detail-stats\"><span>建議面板戰力 <b>" + number(current.recommendedPower) + "</b></span><span>完成獎勵 <b>" + escapeHtml(rewardText(current.reward || {})) + "</b></span><span>版本完成度 <b>" + (claimed ? "已領取" : "未領取") + "</b></span></div>";
      if (byId("dispatch-enemy-intel")) byId("dispatch-enemy-intel").innerHTML = "<div class=\"enemy-intel-heading\"><div><span class=\"eyebrow\">ENEMY INTEL</span><strong>敵方圖鑑</strong></div><small>每份委託的敵人特性不同，編隊不只看總戰力</small></div><div class=\"enemy-intel-grid\">" + renderEnemyIntel(current) + "</div>";
      byId("dispatch-team-count").textContent = currentDispatchTeam.length + " / 4 · 戰力 " + number(trialPower(currentDispatchTeam, state));
      renderFormation("dispatch", currentDispatchTeam, state, current);
      byId("dispatch-team-list").innerHTML = owned.length ? owned.map(function (card) { var effectiveStats = effectiveBattleStats(state); var stats = effectiveStats[card.id]; var individualPower = window.StarshipBattle ? window.StarshipBattle.teamPower([card.id], effectiveStats) : 0; var selected = currentDispatchTeam.indexOf(card.id) >= 0; var image = characterPortraitSource(card, state, true); var style = "--accent:" + escapeHtml(card.accent || "#9e92ff") + (image ? ";--card-image:url('" + escapeHtml(image) + "')" : ""); return "<button class=\"trial-team-card dispatch-team-card " + (selected ? "selected" : "") + "\" data-dispatch-character=\"" + escapeHtml(card.id) + "\" type=\"button\"><span class=\"trial-team-art\" style=\"" + style + "\"><b>" + escapeHtml(card.element) + "</b><strong>" + escapeHtml(card.name) + "</strong></span><span class=\"trial-team-copy\"><strong>" + escapeHtml(card.name) + "</strong><small class=\"character-power-line\">戰力 " + number(individualPower) + "</small><small>" + escapeHtml(stats.role) + " · HP " + number(stats.maxHp) + "</small><small>攻 " + stats.attack + "／防 " + stats.defense + "／速 " + stats.speed + "</small></span><i>" + (selected ? "已編入" : "加入編隊") + "</i></button>"; }).join("") : "<div class=\"empty\">目前沒有可執行委託的角色。</div>";
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
        apiRequest("/api/player/dispatch", { missionId: mission.id, team: currentDispatchTeam }).then(function (payload) { var timedOut = payload.battle && (payload.battle.status === "timeout" || payload.battle.timedOut === true); updateGameFromState(payload.state); renderDispatch(); renderLobby(); renderCharacters(); showMessage(payload.battle.won ? "星港委託完成：已獲得 " + rewardText(payload.reward) + "。" : timedOut ? "委託戰鬥超過演算上限，未判定完成，不會扣除獎勵。" : "委託未完成，可以調整隊伍後再次嘗試。", !payload.battle.won && !timedOut); }).catch(function (error) { showMessage(error.message, true); });
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
      state.voyageProgress = state.voyageProgress || { version: data.voyageVersion || "2.0-2.5", status: "idle", routeId: null, selectedRouteId: null, route: [], nodeIndex: 0, selectedTeam: [], fragments: 0, buffs: [], flags: {}, claimedRewards: {}, lastBattle: null, lastEnding: null };
      state.voyageProgress.selectedRouteId = typeof state.voyageProgress.selectedRouteId === "string" ? state.voyageProgress.selectedRouteId : state.voyageProgress.routeId || null;
      state.voyageProgress.selectedTeam = Array.isArray(state.voyageProgress.selectedTeam) ? state.voyageProgress.selectedTeam : [];
      state.voyageProgress.route = Array.isArray(state.voyageProgress.route) ? state.voyageProgress.route : [];
      state.voyageProgress.flags = state.voyageProgress.flags || {};
      state.voyageProgress.claimedRewards = state.voyageProgress.claimedRewards || {};
      return state.voyageProgress;
    }
    function voyageRouteById(id) { return (data.voyageConfig && data.voyageConfig.routes || []).find(function (route) { return route.id === id; }); }
    function voyageBattleStage(node) {
      if (!node) return null;
      var dedicated = (data.voyageBattleStages || []).find(function (stage) { return String(stage.id) === String(node.stageId || node.id); });
      return dedicated || (node.stageId ? trialStageById(node.stageId) : null);
    }
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
          if (stage && stage.recommendedPower) copy += " 本節推薦戰力約 " + number(stage.recommendedPower) + "；低於推薦仍可能靠配合翻盤，但終局傷害會更難承受。";
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
       if (battle) { var voyageStage = (data.voyageBattleStages || []).find(function (stage) { return String(stage.id) === String(battle.stageId); }) || trialStageById(battle.stageId) || {}; var timedOut = battle.status === "timeout" || battle.timedOut === true; var voyagePowerNote = battle.recommendedPower ? "推薦 " + number(battle.recommendedPower) + "｜目前 " + number(battle.teamPower || 0) + "（" + Math.round(Number(battle.powerRatio || 0) * 100) + "%）" : "隊伍戰力 " + number(battle.teamPower || 0); parts.push("<div class=\"trial-result-header " + (battle.won ? "won" : timedOut ? "timeout" : "lost") + "\"><div><span class=\"eyebrow\">VOYAGE REPORT / " + (battle.won ? "CLEAR" : timedOut ? "TIMEOUT" : "RETRY") + "</span><strong>" + (battle.won ? "航道突破成功" : timedOut ? "航道戰鬥超時" : "航道暫時封鎖") + " · " + number(battle.rounds || 0) + " 回合</strong><small>" + (timedOut ? "本次戰鬥達到演算上限，未判定突破；可以重新開航。" : voyagePowerNote) + "｜協同 " + Math.round(Number(battle.synergy || 0) * 100) + "%" + (!battle.won && !timedOut && battle.recommendedPower && Number(battle.teamPower || 0) < Number(battle.recommendedPower) ? "｜低於推薦戰力，建議先提升角色或調整隊伍" : "") + "</small></div><span class=\"battle-power\">" + (battle.won ? "繼續前進" : "可重新開航") + "</span></div>"); parts.push(battleSceneMarkup(battle, state, voyageStage, "VOYAGE")); }
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
      var currentNode = progress.status === "active" ? (voyageNodeById(progress.route[progress.nodeIndex]) || null) : null;
      var currentStage = voyageBattleStage(currentNode);
      byId("voyage-description").textContent = config.description || "在主線之外探索一段獨立航程。";
      byId("voyage-skin-name").textContent = "星砂、經驗與星痕";
      byId("voyage-skin-copy").textContent = "造型在大廳商店購買，不由迷航免費發放。";
      var activeRoute = progress.status === "active" && progress.routeId ? voyageRouteById(progress.routeId) : null;
      if (activeRoute) currentVoyageRouteId = activeRoute.id;
      else if (progress.selectedRouteId && voyageRouteById(progress.selectedRouteId)) currentVoyageRouteId = progress.selectedRouteId;
      else if (!voyageRouteById(currentVoyageRouteId) && routes.length) currentVoyageRouteId = routes[0].id;
      byId("voyage-view-status").textContent = progress.status === "active" ? (activeRoute ? activeRoute.name : "航程進行中") : progress.status === "complete" ? "航程完成 · 可再次探索" : progress.status === "failed" ? "航程中止 · 可重新開航" : "本期航程尚未開始";
      byId("voyage-route-list").innerHTML = routes.map(function (route) { var selected = (activeRoute && activeRoute.id === route.id) || (!activeRoute && currentVoyageRouteId === route.id); var locked = Boolean(activeRoute); return "<button class=\"voyage-route-card " + (selected ? "selected" : "") + "\" data-voyage-route=\"" + escapeHtml(route.id) + "\" type=\"button\" aria-pressed=\"" + (selected ? "true" : "false") + "\"" + (locked ? " disabled\"" : "") + "><span>" + escapeHtml(route.name) + "</span><small>" + escapeHtml(route.description) + "</small><em>" + (locked ? "航程進行中，暫不能更換" : selected ? "✓ 已選擇這條航線" : "點擊查看並選擇") + "</em></button>"; }).join("");
      var startButton = byId("start-voyage"); startButton.disabled = progress.status === "active"; startButton.textContent = progress.status === "active" ? "航程進行中" : progress.status === "failed" ? "重新開航（建立新路線）" : "開始航程（未選則隨機）";
      if (progress.status === "idle" || progress.status === "failed" || progress.status === "complete") {
        byId("voyage-node-list").innerHTML = "<div class=\"voyage-empty-state\"><span class=\"eyebrow\">CHOOSE A ROUTE</span><strong>先選一條航線，出發後事件會在途中出現</strong><p>每個結局獎勵每期只領一次；完成後可以再跑其他航線，找出不同條件。</p></div>";
        byId("voyage-node-details").innerHTML = ""; byId("voyage-node-enemy").innerHTML = ""; byId("voyage-node-actions").innerHTML = "<p class=\"voyage-hint\">提示：無名檔案線的特殊門需要先取得檔案標記；協鳴特殊結局需要三星與四星一起出航。</p>";
      } else {
        var node = currentNode || {};
        byId("voyage-node-list").innerHTML = progress.route.map(function (id, index) { var item = voyageNodeById(id) || {}; var status = index < progress.nodeIndex ? "done" : index === progress.nodeIndex ? "current" : "locked"; return "<div class=\"voyage-node-pill " + status + "\"><span>" + String(index + 1).padStart(2, "0") + "</span><strong>" + escapeHtml(item.name || id) + "</strong><small>" + escapeHtml(voyageNodeTypeLabel(item)) + "</small></div>"; }).join("");
        var nodePower = currentStage ? trialPower(currentVoyageTeam, state) : 0;
        var voyagePowerStats = currentStage ? "<div class=\"trial-detail-stats voyage-power-check\"><span>推薦戰力 <b>" + number(currentStage.recommendedPower || 0) + "</b></span><span>目前隊伍 <b>" + number(nodePower) + "</b></span><span>判讀 <b>" + (nodePower >= Number(currentStage.recommendedPower || 0) ? "建議區間" : "低於建議，風險較高") + "</b></span></div>" : "";
        var voyagePowerAdvice = currentStage && currentStage.recommendedPowerNote ? "<p class=\"voyage-power-advice\">" + escapeHtml(currentStage.recommendedPowerNote) + "</p>" : "";
        byId("voyage-node-details").innerHTML = "<div class=\"trial-stage-kicker\"><span>VOYAGE NODE " + String(progress.nodeIndex + 1).padStart(2, "0") + "</span><span>" + escapeHtml(voyageNodeTypeLabel(node)) + " · " + escapeHtml(node.region || "星海") + "</span></div><h3>" + escapeHtml(node.name || "航程節點") + "</h3><p>" + escapeHtml(node.description || "") + "</p>" + voyagePowerStats + voyagePowerAdvice + "<div class=\"voyage-node-instruction\"><strong>這一步要做什麼</strong><span>" + escapeHtml(voyageNodeInstruction(node, currentStage)) + "</span></div><div class=\"trial-detail-stats\"><span>星海碎片 <b>" + number(progress.fragments) + "</b></span><span>臨時增益 <b>" + (progress.buffs.length ? escapeHtml(progress.buffs.join("、")) : "無") + "</b></span><span>已收集回聲 <b>" + number(progress.flags.echoes || 0) + "</b></span></div>";
        var stage = currentStage;
        byId("voyage-node-enemy").innerHTML = stage ? "<div class=\"enemy-intel-heading\"><div><span class=\"eyebrow\">ENEMY INTEL</span><strong>節點敵方情報</strong></div><small>可先讀取敵人資料再決定編隊</small></div><div class=\"enemy-intel-grid\">" + renderEnemyIntel(stage) + "</div>" : "<div class=\"voyage-event-note\"><span class=\"eyebrow\">EVENT / CHOICE</span><strong>這個節點不需要戰鬥，選擇會影響後續結局。</strong></div>";
        if (node.choices && node.choices.length) {
          byId("voyage-node-actions").innerHTML = node.choices.map(function (choice) { var hasThree = currentVoyageTeam.some(function (id) { var card = rosterCards().find(function (item) { return item.id === id; }); return card && card.rarity === 3; }); var hasFour = currentVoyageTeam.some(function (id) { var card = rosterCards().find(function (item) { return item.id === id; }); return card && card.rarity === 4; }); var missingFlag = choice.requiresFlag && progress.flags[choice.requiresFlag] !== true; var missingMixed = choice.requiresMixedTeam && !(hasThree && hasFour); var missingFragments = Number(choice.costFragments || 0) > Number(progress.fragments || 0); var locked = missingFlag || missingMixed || missingFragments; var lockReason = missingFlag ? "尚未取得必要線索" : missingMixed ? "需要三星與四星混編" : missingFragments ? "星海碎片不足" : ""; return "<button class=\"voyage-choice-button " + (locked ? "locked" : "") + "\" data-voyage-choice=\"" + escapeHtml(choice.id) + "\" type=\"button\"" + (locked ? " disabled" : "") + "><strong>" + escapeHtml(choice.label) + "</strong><small>" + escapeHtml(choice.description || "") + (choice.costFragments ? " · 消耗 " + choice.costFragments + " 碎片" : "") + (lockReason ? " · " + lockReason : "") + "</small></button>"; }).join("");
        } else {
          byId("voyage-node-actions").innerHTML = "<button class=\"primary-action\" data-voyage-advance=\"1\" type=\"button\">" + (stage ? "進入自走棋戰鬥" : "確認並繼續航行") + "</button>";
        }
      }
      var owned = rosterCards().filter(function (card) { return state.collection[card.id] > 0 && data.characterBattleStats[card.id]; });
      currentVoyageTeam = currentVoyageTeam.filter(function (id) { return owned.some(function (card) { return card.id === id; }); }).slice(0, 4);
      byId("voyage-team-count").textContent = currentVoyageTeam.length + " / 4 · 戰力 " + number(trialPower(currentVoyageTeam, state));
      renderFormation("voyage", currentVoyageTeam, state, currentStage);
      byId("voyage-team-list").innerHTML = owned.length ? owned.map(function (card) { var stats = effectiveBattleStats(state)[card.id]; var individualPower = window.StarshipBattle ? window.StarshipBattle.teamPower([card.id], effectiveBattleStats(state)) : 0; var selected = currentVoyageTeam.indexOf(card.id) >= 0; var image = characterPortraitSource(card, state, true); var style = "--accent:" + escapeHtml(card.accent || "#9e92ff") + (image ? ";--card-image:url('" + escapeHtml(image) + "')" : ""); return "<button class=\"trial-team-card voyage-team-card " + (selected ? "selected" : "") + "\" data-voyage-character=\"" + escapeHtml(card.id) + "\" type=\"button\"><span class=\"trial-team-art\" style=\"" + style + "\"><b>" + escapeHtml(card.element) + "</b><strong>" + escapeHtml(card.name) + "</strong></span><span class=\"trial-team-copy\"><strong>" + escapeHtml(card.name) + "</strong><small class=\"character-power-line\">戰力 " + number(individualPower) + "</small><small>" + escapeHtml(stats.role) + " · HP " + number(stats.maxHp) + "</small><small>攻 " + stats.attack + "／防 " + stats.defense + "／速 " + stats.speed + "</small></span><i>" + (selected ? "已編入" : "加入編隊") + "</i></button>"; }).join("") : "<div class=\"empty\">目前沒有可參戰角色。</div>";
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
          apiRequest("/api/player/voyage", { action: "resolve", nodeId: node.id, choice: choice || undefined, team: currentVoyageTeam }).then(function (payload) { var timedOut = payload.battle && (payload.battle.status === "timeout" || payload.battle.timedOut === true); updateGameFromState(payload.state); renderVoyage(); renderLobby(); renderCharacters(); showMessage(payload.ending ? "航程完成：" + (payload.ending.alreadyClaimed ? "本期結局獎勵已領取過。" : rewardText(payload.ending.reward)) : payload.battle && payload.battle.won ? "節點突破成功，繼續向下一段航道前進。" : timedOut ? "節點戰鬥超過演算上限，未判定突破；可以重新開航。" : payload.battle ? "節點戰鬥失敗，可以重新開航。" : "事件選擇已記錄。", Boolean(payload.battle && !payload.battle.won && !timedOut)); }).catch(function (error) { showMessage(error.message, true); });
          return;
        }
        var result = game.advanceVoyage({ nodeId: node.id, choice: choice, team: currentVoyageTeam, battle: battle }); updateGameFromState(result.state); saveLocalState(); renderVoyage(); renderLobby(); renderCharacters(); showMessage(result.ending ? "航程完成：" + (result.ending.alreadyClaimed ? "本期結局獎勵已領取過。" : rewardText(result.ending.reward)) : battle && battle.status === "timeout" ? "節點戰鬥超過演算上限，未判定突破；可以重新開航。" : battle && !battle.won ? "節點戰鬥失敗，可以重新開航。" : "事件選擇已記錄。", Boolean(battle && !battle.won && battle.status !== "timeout"));
      } catch (error) { showMessage(error.message, true); }
    }
    function petProgressState(state) {
      state.petProgress = state.petProgress || { version: data.petVersion || "2.1-companion-workshop", selectedPetId: "star-fox", selectedOutfitId: "default", selectedEffectId: "starlit", pets: {}, resources: { petFood: 0, petToys: 0, petTokens: 0, showcaseToken: 0 }, daily: { date: null, groomed: false, challengeCount: 0 }, showcase: { isPublic: false, featuredPetId: "star-fox", outfitId: "default", effectId: "starlit" }, ratedShowcases: {} };
      state.petProgress.pets = state.petProgress.pets || {};
      state.petProgress.resources = state.petProgress.resources || { petFood: 0, petToys: 0, petTokens: 0, showcaseToken: 0 };
      state.petProgress.daily = state.petProgress.daily || { date: null, groomed: false, challengeCount: 0 };
      state.petProgress.showcase = state.petProgress.showcase || { isPublic: false, featuredPetId: state.petProgress.selectedPetId, outfitId: state.petProgress.selectedOutfitId, effectId: state.petProgress.selectedEffectId };
      state.petProgress.ratedShowcases = state.petProgress.ratedShowcases || {};
      return state.petProgress;
    }
    function petDefinitionById(id) { return (data.petDefinitions || []).find(function (item) { return item.id === id; }); }
    function petOutfitById(id) { return (data.petOutfits || []).find(function (item) { return item.id === id; }); }
    function petEffectById(id) { return (data.petEffects || []).find(function (item) { return item.id === id; }); }
    function petChallengeById(id) { return (data.petChallenges || []).find(function (item) { return item.id === id; }); }
    function petResourceLabel(id) { return ({ petFood: "飼料", petToys: "玩具", petTokens: "星伴代幣", showcaseToken: "展示徽章" })[id] || id; }
    function petActionMessage(text, isError) { var target = byId("pet-action-message"); if (target) { target.textContent = text; target.className = isError ? "message error" : "message"; } }
    var PET_ART_VERSION = "pet-customization-20260920";
    var PET_ARTWORK = {
      "star-fox": "./assets/pets/star-fox.png",
      "tide-otter": "./assets/pets/tide-otter-v2.png",
      "wind-bird": "./assets/pets/wind-bird.png",
      "mirror-sprout": "./assets/pets/mirror-sprout.png",
      "aurora-fawn": "./assets/pets/aurora-fawn.png",
      "rune-drake": "./assets/pets/rune-drake.png",
      "cloud-whale": "./assets/pets/cloud-whale.png"
    };
    function petImageUrl(definition) {
      var path = definition && (definition.image || PET_ARTWORK[definition.id]);
      if (!path) return "";
      return path + (path.indexOf("?") >= 0 ? "&" : "?") + "v=" + PET_ART_VERSION;
    }
    function petDecorationMarkup(outfit, effect, compact) {
      var outfitId = String(outfit.id || "default");
      var effectId = String(effect.id || "starlit");
      var particleClass = compact ? " compact" : "";
      var particles = ["p1", "p2", "p3", "p4", "p5", "p6"].map(function (position) {
        return "<i class=\"pet-effect-particle " + position + particleClass + "\">" + escapeHtml(effect.icon || "✦") + "</i>";
      }).join("");
      return "<span class=\"pet-outfit-layer outfit-" + escapeHtml(outfitId) + "\" aria-hidden=\"true\"></span><span class=\"pet-effect-layer effect-" + escapeHtml(effectId) + "\" aria-hidden=\"true\">" + particles + "</span>";
    }
    function petArtMarkup(definition, outfit, effect, compact) {
      definition = definition || {};
      outfit = outfit || {};
      effect = effect || {};
      var imagePath = petImageUrl(definition);
      if (imagePath) {
        var imageClass = "pet-art-image" + (compact ? " compact" : "");
        var compositeClass = "pet-art-composite" + (compact ? " compact" : "");
        return "<span class=\"" + compositeClass + "\" data-outfit=\"" + escapeHtml(outfit.id || "default") + "\" data-effect=\"" + escapeHtml(effect.id || "starlit") + "\">" + petDecorationMarkup(outfit, effect, compact) + "<img class=\"" + imageClass + "\" src=\"" + escapeHtml(imagePath) + "\" alt=\"" + escapeHtml(definition.name || "星伴") + "的完整立繪\" loading=\"lazy\" draggable=\"false\"></span>";
      }
      var id = String(definition.id || "");
      var art = {
        "star-fox": '<path class="pet-tail" d="M63 128C24 111 22 67 55 59c27-6 39 18 23 37-8 9-19 12-31 10 21 12 32 20 36 34Z"/><path class="pet-ear" d="M82 76 75 39c-1-7 6-10 11-5l25 27Z"/><path class="pet-ear" d="M137 62 159 35c5-6 12-2 11 5l-7 38Z"/><ellipse class="pet-body" cx="111" cy="117" rx="52" ry="40"/><circle class="pet-head" cx="113" cy="86" r="38"/><path class="pet-belly" d="M83 120c10 28 57 31 74 0-4 34-19 44-38 44s-33-11-36-44Z"/><circle class="pet-eye" cx="99" cy="87" r="7"/><circle class="pet-eye" cx="128" cy="87" r="7"/><circle class="pet-eye-highlight" cx="97" cy="85" r="2"/><circle class="pet-eye-highlight" cx="126" cy="85" r="2"/><path class="pet-face" d="M107 101q6 7 12 0M113 96v6"/><path class="pet-outfit-mark" d="M74 119q37 18 76 0l-5 16q-34 20-66 0Z"/>',
        "tide-otter": '<path class="pet-tail" d="M61 132c-25-6-32-27-18-39 11-9 27-2 27 12 0 8-6 14-14 16 16 3 24 7 30 15Z"/><circle class="pet-ear" cx="82" cy="72" r="13"/><circle class="pet-ear" cx="145" cy="72" r="13"/><ellipse class="pet-body" cx="113" cy="119" rx="57" ry="40"/><ellipse class="pet-belly" cx="113" cy="127" rx="31" ry="25"/><ellipse class="pet-head" cx="113" cy="88" rx="43" ry="36"/><circle class="pet-eye" cx="98" cy="87" r="7"/><circle class="pet-eye" cx="128" cy="87" r="7"/><circle class="pet-eye-highlight" cx="96" cy="85" r="2"/><circle class="pet-eye-highlight" cx="126" cy="85" r="2"/><ellipse class="pet-nose" cx="113" cy="99" rx="9" ry="6"/><path class="pet-face" d="M104 106q9 8 18 0M90 99 70 94M90 105 69 109M136 99l20-5M136 105l21 4"/><path class="pet-outfit-mark" d="M69 115q43 21 88 0l-2 21q-42 20-84 0Z"/><circle class="pet-bubble" cx="163" cy="54" r="7"/><circle class="pet-bubble" cx="178" cy="39" r="4"/>',
        "wind-bird": '<path class="pet-tail" d="M91 126 50 151c-9 5-15-5-8-12l40-35Z"/><path class="pet-wing" d="M83 92C48 75 33 94 53 119c10 12 26 17 46 14Z"/><path class="pet-wing" d="M144 92c34-17 50 2 30 27-10 12-26 17-46 14Z"/><path class="pet-body" d="M82 117c0-35 18-59 39-59s39 24 39 59c0 31-16 51-39 51s-39-20-39-51Z"/><path class="pet-crest" d="M102 63 91 35c-2-7 5-10 10-5l14 18 13-25c4-7 11-4 10 4l-4 36Z"/><path class="pet-beak" d="M151 84 184 96l-33 12Z"/><circle class="pet-eye" cx="133" cy="82" r="7"/><circle class="pet-eye-highlight" cx="131" cy="80" r="2"/><path class="pet-face" d="M115 121q8 7 16 0"/><path class="pet-outfit-mark" d="M85 122q36 17 71 0l-7 19q-30 17-57 0Z"/>',
        "mirror-sprout": '<path class="pet-root" d="M109 102c-5-28-26-43-49-36-9 3-8 14 1 16 14 3 25 11 30 28Z"/><path class="pet-root" d="M119 78c7-26 28-39 49-29 9 4 7 15-2 16-14 1-25 8-32 23Z"/><path class="pet-body" d="M78 119c0-29 16-47 35-47s35 18 35 47c0 36-14 53-35 53s-35-17-35-53Z"/><path class="pet-belly" d="M91 126q22-18 44 0v26q-22 13-44 0Z"/><circle class="pet-eye" cx="99" cy="107" r="6"/><circle class="pet-eye" cx="124" cy="107" r="6"/><circle class="pet-eye-highlight" cx="97" cy="105" r="2"/><circle class="pet-eye-highlight" cx="122" cy="105" r="2"/><path class="pet-face" d="M94 115q5 7 10 0M119 115q5 7 10 0M103 128q10 7 20 0"/><path class="pet-outfit-mark" d="M80 126q34 19 67 0l-5 20q-28 17-57 0Z"/><path class="pet-crystal" d="M112 52 126 66 112 80 98 66Z"/>',
        "aurora-fawn": '<path class="pet-antler" d="M84 72 70 43m14 29-8-15m8 15 2-18M141 72l14-29m-14 29 8-15m-8 15-2-18"/><path class="pet-ear" d="M84 76 66 60q-9-8-13 2l29 28Z"/><path class="pet-ear" d="M140 76 158 60q9-8 13 2l-29 28Z"/><ellipse class="pet-body" cx="112" cy="123" rx="49" ry="39"/><ellipse class="pet-head" cx="112" cy="88" rx="39" ry="35"/><ellipse class="pet-belly" cx="112" cy="132" rx="25" ry="21"/><circle class="pet-eye" cx="98" cy="89" r="6"/><circle class="pet-eye" cx="126" cy="89" r="6"/><circle class="pet-eye-highlight" cx="96" cy="87" r="2"/><circle class="pet-eye-highlight" cx="124" cy="87" r="2"/><path class="pet-face" d="M104 103q8 7 16 0M109 98q3 4 6 0"/><path class="pet-outfit-mark" d="M75 122q37 19 74 0l-5 18q-34 17-64 0Z"/>',
        "rune-drake": '<path class="pet-horn" d="M87 73 72 44q-3-8 5-8l22 26M137 73l15-29q3-8-5-8l-22 26"/><path class="pet-wing" d="M82 99C48 77 34 94 54 125c8 12 24 17 43 11Z"/><path class="pet-wing" d="M142 99c34-22 48-5 28 26-8 12-24 17-43 11Z"/><path class="pet-tail" d="M71 133c-27 13-31 31-9 29 17-1 30-12 42-24Z"/><ellipse class="pet-body" cx="112" cy="123" rx="48" ry="39"/><path class="pet-head" d="M76 88q2-37 36-39 34 2 36 39 0 40-36 40-36 0-36-40Z"/><circle class="pet-eye" cx="98" cy="87" r="7"/><circle class="pet-eye" cx="126" cy="87" r="7"/><circle class="pet-eye-highlight" cx="96" cy="85" r="2"/><circle class="pet-eye-highlight" cx="124" cy="85" r="2"/><path class="pet-face" d="M101 103q11 8 22 0M105 98l-5 5M119 98l5 5"/><path class="pet-outfit-mark" d="M75 124q37 20 74 0l-7 19q-34 17-61 0Z"/>',
        "cloud-whale": '<path class="pet-tail" d="M75 122c-30-16-43-6-34 10 8 14 25 18 43 12Z"/><path class="pet-wing" d="M78 112C45 101 36 117 58 133c11 8 25 11 39 5Z"/><path class="pet-wing" d="M146 111c33-10 42 6 20 22-11 8-25 11-39 5Z"/><path class="pet-body" d="M63 111q5-40 49-46 44 6 49 46 1 47-49 48-50-1-49-48Z"/><path class="pet-head" d="M76 100q1-34 36-36 35 2 36 36 0 34-36 37-36-3-36-37Z"/><path class="pet-belly" d="M88 132q24-14 48 0v20q-24 13-48 0Z"/><circle class="pet-eye" cx="99" cy="99" r="6"/><circle class="pet-eye" cx="125" cy="99" r="6"/><circle class="pet-eye-highlight" cx="97" cy="97" r="2"/><circle class="pet-eye-highlight" cx="123" cy="97" r="2"/><path class="pet-face" d="M104 113q8 7 16 0M104 76q8-15 16 0"/><path class="pet-outfit-mark" d="M66 119q46 20 92 0l-5 18q-42 17-82 0Z"/><path class="pet-fin" d="M106 61q6-18 12 0Z"/>'
      }[id] || '<circle class="pet-body" cx="112" cy="112" r="48"/><circle class="pet-head" cx="112" cy="84" r="34"/><circle class="pet-eye" cx="100" cy="84" r="7"/><circle class="pet-eye" cx="124" cy="84" r="7"/><circle class="pet-eye-highlight" cx="98" cy="82" r="2"/><circle class="pet-eye-highlight" cx="122" cy="82" r="2"/><path class="pet-face" d="M105 99q7 7 14 0"/>';
      var outfitMarkup = outfit.id === "moon-scarf"
        ? "<path class=\"pet-accessory pet-scarf\" d=\"M70 119q42 25 86 0l-4 16q-40 25-78 0Z\"/><path class=\"pet-accessory pet-scarf-tail\" d=\"M143 129l30 17-12 8-23-17Z\"/>"
        : outfit.id === "tide-cape"
          ? "<path class=\"pet-accessory pet-cape\" d=\"M65 108q48 29 97 0l-8 43q-40 20-81 0Z\"/><path class=\"pet-accessory pet-cape-clasp\" d=\"M105 117h15v15h-15Z\"/>"
          : outfit.id === "archive-crown"
            ? "<path class=\"pet-accessory pet-crown\" d=\"M78 62 89 35l24 20 24-24 14 32Z\"/><circle class=\"pet-accessory pet-crown-gem\" cx=\"113\" cy=\"55\" r=\"5\"/>"
            : outfit.id === "aurora-hood"
              ? "<path class=\"pet-accessory pet-hood\" d=\"M72 84q4-50 41-50t41 50l-12 10q-8-31-29-31T84 94Z\"/><path class=\"pet-accessory pet-hood-trim\" d=\"M78 81q34-13 69 0\"/>"
              : outfit.id === "star-goggles"
                ? "<rect class=\"pet-accessory pet-goggles\" x=\"83\" y=\"76\" width=\"23\" height=\"17\" rx=\"6\"/><rect class=\"pet-accessory pet-goggles\" x=\"119\" y=\"76\" width=\"23\" height=\"17\" rx=\"6\"/><path class=\"pet-accessory pet-goggles-bridge\" d=\"M106 81h13\"/>"
                : outfit.id === "sail-pack"
                  ? "<path class=\"pet-accessory pet-pack\" d=\"M72 104q-13 19-3 40l18-4 8-28Z\"/><path class=\"pet-accessory pet-sail\" d=\"M73 105q17-22 37-27v61q-25-8-37-34Z\"/><path class=\"pet-accessory pet-pack-clasp\" d=\"M80 124h13v10H80Z\"/>"
                  : outfit.id === "rune-horns"
                    ? "<path class=\"pet-accessory pet-rune-horn\" d=\"M88 63 77 40l21 15M136 63l11-23-21 15\"/><circle class=\"pet-accessory pet-rune-gem\" cx=\"112\" cy=\"57\" r=\"5\"/>"
                    : "";
      var svgClass = "pet-art-svg" + (compact ? " compact" : "");
      return "<svg class=\"" + svgClass + "\" viewBox=\"0 0 220 180\" role=\"img\" aria-label=\"" + escapeHtml(definition.name || "星伴") + "的專屬外觀\" style=\"--pet-art-base:" + escapeHtml(definition.accent || "#b897e8") + ";--pet-art-outfit:" + escapeHtml(outfit.accent || definition.accent || "#9e92ff") + ";--pet-art-effect:" + escapeHtml(effect.color || "#f4c66b") + "\"><ellipse class=\"pet-art-shadow\" cx=\"111\" cy=\"164\" rx=\"58\" ry=\"8\"/>" + art + outfitMarkup + "<circle class=\"pet-art-spark\" cx=\"180\" cy=\"124\" r=\"4\"/><circle class=\"pet-art-spark\" cx=\"48\" cy=\"44\" r=\"3\"/></svg>";
    }
    function petCardMarkup(definition, pet, selected) {
      var petState = petProgressState(game.getState());
      var outfit = petOutfitById(currentPetOutfitId || petState.selectedOutfitId || (petState.showcase || {}).outfitId) || (data.petOutfits || [])[0] || {};
      var effect = petEffectById(currentPetEffectId || petState.selectedEffectId || (petState.showcase || {}).effectId) || (data.petEffects || [])[0] || {};
      var style = "--pet-accent:" + escapeHtml(outfit.accent || definition.accent || "#9e92ff") + ";--pet-effect:" + escapeHtml(effect.color || "#f4c66b");
      var level = Math.max(1, Number(pet.level || 1));
      var maxLevel = Math.max(level, Number(definition.maxLevel || 30));
      var nextExp = level < maxLevel ? 80 + level * 40 : 0;
      var levelText = level >= maxLevel ? "已達目前上限 · 等待後續版本" : "距離下一級 " + number(nextExp) + " 經驗";
      var expPercent = level >= maxLevel ? 100 : Math.min(100, Number(pet.exp || 0) / Math.max(1, nextExp) * 100);
      return "<div class=\"pet-visual-card " + (selected ? "selected" : "") + "\" style=\"" + style + "\"><div class=\"pet-visual-stage\"><div class=\"pet-visual-orbit\"><span>" + escapeHtml(effect.icon || "✦") + "</span></div><div class=\"pet-visual-art\">" + petArtMarkup(definition, outfit, effect, false) + "</div></div><div class=\"pet-visual-copy\"><span class=\"eyebrow\">" + escapeHtml(definition.temperament) + " COMPANION</span><h3>" + escapeHtml(definition.name) + "</h3><p>" + escapeHtml(definition.description) + "</p><div class=\"pet-stat-line\"><span>Lv." + number(level) + " / " + number(maxLevel) + "</span><span>親密度 " + number(pet.bond || 0) + "</span><span>心情 " + number(pet.mood || 0) + "</span></div><div class=\"pet-exp-track\"><i style=\"width:" + expPercent + "%\"></i></div><small class=\"pet-level-hint\">" + levelText + " · 裝扮「" + escapeHtml(outfit.name || "原野本色") + "」· 特效「" + escapeHtml(effect.name || "星屑環") + "」</small></div></div>";
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
      var daily = progress.daily || { challengeCount: 0, groomed: false };
      var challengeMarkup = "<section class=\"pet-challenge-panel\"><div class=\"pet-panel-heading\"><div><p class=\"eyebrow\">COMPANION ACTIVITIES</p><h3>星伴挑戰</h3></div><span>" + Number(daily.challengeCount || 0) + " / 3 今日挑戰</span></div><p class=\"pet-challenge-copy\">每天可完成三種不同的小任務，消耗的是寵物專用資源；完成後會給大量寵物經驗與回饋，不會動用星砂或角色資源。</p><div class=\"pet-challenge-grid\">" + (data.petChallenges || []).map(function (challenge) { var challengeReward = challenge.reward || {}; return "<button class=\"pet-challenge-button\" data-pet-action=\"challenge\" data-pet-id=\"" + escapeHtml(selected.id) + "\" data-pet-challenge=\"" + escapeHtml(challenge.id) + "\" type=\"button\"><strong>" + escapeHtml(challenge.name) + "</strong><small>" + escapeHtml(challenge.description) + "</small><em>消耗 " + Number(challenge.costAmount || 1) + " " + escapeHtml(petResourceLabel(challenge.cost)) + " · +" + Number(challengeReward.petExp || 0) + " 寵物經驗</em></button>"; }).join("") + "</div></section>";
      byId("pet-selected-card").innerHTML = petCardMarkup(selected, pet, true) + "<div class=\"pet-action-row\"><button class=\"primary-action\" data-pet-action=\"feed\" data-pet-id=\"" + escapeHtml(selected.id) + "\" type=\"button\">餵食　1 飼料</button><button class=\"secondary-action\" data-pet-action=\"play\" data-pet-id=\"" + escapeHtml(selected.id) + "\" type=\"button\">玩耍　1 玩具</button><button class=\"secondary-action\" data-pet-action=\"groom\" data-pet-id=\"" + escapeHtml(selected.id) + "\" type=\"button\">" + (daily.groomed ? "今日已梳理" : "梳理　每日一次") + "</button><button class=\"secondary-action\" data-pet-action=\"explore\" data-pet-id=\"" + escapeHtml(selected.id) + "\" type=\"button\">外出探索（本期 " + Number(progress.exploreCount || 0) + " / 3）</button></div><div class=\"pet-training-row\"><span>訓練方向</span><button class=\"secondary-action\" data-pet-action=\"train\" data-pet-focus=\"care\" data-pet-id=\"" + escapeHtml(selected.id) + "\" type=\"button\">照護　1 代幣</button><button class=\"secondary-action\" data-pet-action=\"train\" data-pet-focus=\"play\" data-pet-id=\"" + escapeHtml(selected.id) + "\" type=\"button\">玩耍　1 代幣</button><button class=\"secondary-action\" data-pet-action=\"train\" data-pet-focus=\"focus\" data-pet-id=\"" + escapeHtml(selected.id) + "\" type=\"button\">專注　1 代幣</button></div>" + challengeMarkup;
      byId("pet-public-toggle").checked = progress.showcase.isPublic === true;
      byId("pet-outfit-list").innerHTML = "<div class=\"pet-option-heading\">裝扮｜會加入可見的獨立配件圖層</div>" + (data.petOutfits || []).map(function (outfit) { return "<button class=\"pet-option-button " + (currentPetOutfitId === outfit.id ? "active" : "") + "\" data-pet-outfit=\"" + escapeHtml(outfit.id) + "\" type=\"button\"><span class=\"pet-option-swatch\" style=\"--option-accent:" + escapeHtml(outfit.accent || "#9e92ff") + "\">" + escapeHtml(outfit.icon || "✦") + "</span><strong>" + escapeHtml(outfit.name) + "</strong><small>" + escapeHtml(outfit.description) + "</small></button>"; }).join("");
      byId("pet-effect-list").innerHTML = "<div class=\"pet-option-heading\">出場特效｜只增加展示層，不改變寵物立繪畫質</div>" + (data.petEffects || []).map(function (effect) { return "<button class=\"pet-option-button " + (currentPetEffectId === effect.id ? "active" : "") + "\" data-pet-effect=\"" + escapeHtml(effect.id) + "\" type=\"button\"><span class=\"pet-option-swatch\" style=\"--option-accent:" + escapeHtml(effect.color || "#f4c66b") + "\">" + escapeHtml(effect.icon || "✦") + "</span><strong>" + escapeHtml(effect.name) + "</strong><small>" + escapeHtml(effect.description) + "</small></button>"; }).join("");
      byId("pet-catalog-count").textContent = Object.keys(progress.pets).filter(function (id) { return progress.pets[id] && progress.pets[id].owned; }).length + " / " + definitions.length;
      byId("pet-catalog-list").innerHTML = definitions.map(function (definition) { var saved = progress.pets[definition.id]; var owned = saved && saved.owned; return "<button class=\"pet-catalog-card " + (owned ? "owned" : "locked") + (definition.id === selected.id ? " selected" : "") + "\" data-pet-select=\"" + escapeHtml(definition.id) + "\" type=\"button\"><span class=\"pet-catalog-icon\" style=\"--pet-accent:" + escapeHtml(definition.accent || "#9e92ff") + "\">" + escapeHtml(definition.icon) + "</span><span><strong>" + escapeHtml(definition.name) + "</strong><small>" + escapeHtml(definition.temperament) + (owned ? " · Lv." + saved.level : " · 尚未領養") + "</small></span><em>" + (owned ? "選擇" : "領養 3 代幣") + "</em></button>"; }).join("");
      renderPetShowcases();
    }
    function runPetAction(action, petId, focus, challengeId) {
      if (!game || !currentPlayerName) { showGate(); return; }
      var request = { action: action, petId: petId || currentPetId, focus: focus || "focus", challengeId: challengeId || "" };
      function successMessage(result, local) {
        var reward = result && result.reward || {};
        var parts = [];
        if (reward.petExp) parts.push("+" + number(reward.petExp) + " 寵物經驗");
        if (reward.levelUps) parts.push("升級 " + number(reward.levelUps) + " 次");
        if (reward.petFood) parts.push("+" + number(reward.petFood) + " 飼料");
        if (reward.petToys) parts.push("+" + number(reward.petToys) + " 玩具");
        if (reward.petTokens) parts.push("+" + number(reward.petTokens) + " 星伴代幣");
        var suffix = parts.length ? "（" + parts.join("、") + "）" : "";
        return action === "adopt" ? "寵物已加入星伴工坊。" : action === "select" ? "已切換出場寵物。" : (reward.challengeName ? "完成「" + reward.challengeName + "」" : "寵物培育完成") + suffix + (local ? "，進度已儲存到這個瀏覽器。" : "，進度已儲存。");
      }
      if (remoteMode) { apiRequest("/api/player/pet-action", request).then(function (payload) { updateGameFromState(payload.state); renderPets(); renderLobby(); petActionMessage(successMessage(payload, false), false); }).catch(function (error) { petActionMessage(error.message, true); }); return; }
      try { var result = game.petAction(request); updateGameFromState(result.state); saveLocalState(); renderPets(); petActionMessage(successMessage(result, true), false); } catch (error) { petActionMessage(error.message, true); }
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
      var cardImage = characterPortraitSource(card, game && game.getState());
      if (cardImage) { imageStyle += ";--card-image:url('" + escapeHtml(cardImage) + "')"; }
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
      container.innerHTML = rosterCards().map(function (card) {
        var copies = state.collection[card.id] || 0;
        return "<div class=\"collection-item " + (copies ? "owned" : "locked") + "\"><span class=\"collection-rarity\">" + "★".repeat(card.rarity) + "</span><span class=\"collection-name\">" + escapeHtml(card.name) + " <small>" + escapeHtml(card.element) + "</small></span><span class=\"collection-count\">" + (copies ? "×" + copies : "未取得") + "</span></div>";
      }).join("");
      byId("collection-count").textContent = Object.keys(state.collection).filter(function (id) { return state.collection[id] > 0; }).length + " / " + rosterCards().length;
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
      var featuredImage = card ? characterPortraitSource(card, game && game.getState()) : "";
      panel.style.setProperty("--featured-image", featuredImage ? "url(\"" + featuredImage + "\")" : "none");
      panel.classList.toggle("has-featured-backdrop", Boolean(featuredImage));
      panel.setAttribute("data-featured", card ? card.name : "回覆召集");
    }
    function render() {
      if (!game) { return; }
      var state = game.getState(); var banner = bannerById(selectedBannerId); var pity = game.getPityStatus(selectedBannerId);
      byId("star-sand").textContent = number(state.resources.starSand); byId("star-marks").textContent = number(state.resources.starMarks);
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
      window.fetch("/api/health", { cache: "no-store" }).then(function (response) { if (!response.ok) { throw new Error("no backend"); } return response.json(); }).then(function (payload) {
        remoteMode = true;
        testRewardsServerEnabled = payload && payload.testRewardsEnabled === true;
        showGateMessage("已連接線上存檔服務。", false);
      }).catch(function () {
        remoteMode = false;
        testRewardsServerEnabled = null;
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
    byId("open-author-preview").addEventListener("click", function () { showView("author-preview-view"); });
    byId("author-preview-story-scenes").addEventListener("click", function (event) { var button = event.target.closest("[data-author-choice]"); if (button && !button.disabled) loadAuthorPreview("answer", Number(button.getAttribute("data-author-choice"))); });
    document.querySelector(".author-preview-story-tabs").addEventListener("click", function (event) { var button = event.target.closest("[data-author-story-version]"); if (button) showAuthorStoryVersion(button.getAttribute("data-author-story-version")); });
    document.querySelector(".author-preview-story").addEventListener("click", function (event) {
      var button = event.target.closest("[data-author-preview-claim]");
      if (!button || button.disabled) return;
      var version = button.getAttribute("data-author-preview-claim");
      authorPreviewRewardDemo[version] = true;
      button.disabled = true;
      button.textContent = "已試按領獎位置";
      var note = button.parentElement.querySelector("small");
      if (note) note.textContent = "版面試用完成；正式角色、進度與資源均未變動。";
    });
    byId("author-preview-reset").addEventListener("click", function () { authorPreviewLastAct = null; authorPreviewRewardDemo["1.1"] = false; loadAuthorPreview("reset"); });
    byId("author-preview-map-reset").addEventListener("click", function () { authorAtlasMapId = "W-001"; authorAtlasPointId = ""; renderAuthorMapPreview(); });
    byId("author-preview-map").addEventListener("click", function (event) {
      var target = event.target.closest("[data-map-go]");
      if (!target || !globalThis.StarshipInteractiveMap) return;
      var id = target.getAttribute("data-map-go");
      if (id.charAt(0) === "#") authorAtlasPointId = id;
      else if (globalThis.StarshipInteractiveMap.maps[id]) { authorAtlasMapId = id; authorAtlasPointId = ""; }
      else return;
      authorAtlasVisited.add(authorAtlasMapId + authorAtlasPointId);
      renderAuthorMapPreview();
    });
    byId("author-preview-2x-setup").addEventListener("click", function (event) { if (event.target.closest("#author-preview-2x-run")) runAuthorBattlePreview(); });
    byId("open-gacha").addEventListener("click", function () { showView("gacha-hall"); });
     byId("open-characters").addEventListener("click", function () { showView("character-view"); });
    byId("open-trial").addEventListener("click", function () { showView("trial-view"); });
    document.addEventListener("click", function (event) {
      var opener = event.target.closest("[data-battle-art]");
      if (!opener) return;
      var dialog = byId("battle-art-dialog");
      byId("battle-art-title").textContent = opener.dataset.battleName || "戰鬥立繪";
      var artwork = byId("battle-art-image");
      artwork.src = opener.dataset.battleArt;
      artwork.alt = (opener.dataset.battleName || "戰鬥") + " 立繪完整圖片";
      dialog.showModal();
    });
    byId("close-battle-art").addEventListener("click", function () { byId("battle-art-dialog").close(); });
    byId("battle-art-dialog").addEventListener("click", function (event) { if (event.target === this) this.close(); });
     byId("open-boss").addEventListener("click", function () { showView("boss-view"); });
     byId("open-dispatch").addEventListener("click", function () { showView("dispatch-view"); });
    byId("open-voyage").addEventListener("click", function () { showView("voyage-view"); });
    byId("open-shop").addEventListener("click", function () { showView("shop-view"); });
    byId("shop-view").addEventListener("click", function (event) { var button = event.target.closest("[data-shop-kind]"); if (button && !button.disabled) shopAction(button.getAttribute("data-shop-kind"), button.getAttribute("data-shop-id"), button.getAttribute("data-shop-payment")); });
    byId("open-pets").addEventListener("click", function () { showView("pet-view"); });
    byId("open-tutorial").addEventListener("click", function () { showView("tutorial-view"); });
    byId("open-announcements").addEventListener("click", function () { showView("announcement-view"); });
    byId("open-star-law-test").addEventListener("click", function () { setStarLawTestPanelVisible(!starLawTestPanelOpen); });
    byId("claim-star-law-test-reward").addEventListener("click", claimStarLawTestReward);
    byId("continue-story").addEventListener("click", function () { showView("story-view"); });
    byId("tutorial-reward").addEventListener("click", function (event) { if (event.target.closest("#complete-tutorial")) completeTutorial(); });
    document.querySelectorAll(".back-lobby").forEach(function (button) { button.addEventListener("click", function () { showView("game-lobby"); }); });
    byId("story-main-tab").addEventListener("click", function () { currentStoryTab = "main"; currentStoryChapterId = "main-1-0"; currentStorySceneId = ""; renderStory(); });
    byId("story-side-tab").addEventListener("click", function () { currentStoryTab = "side"; currentStoryChapterId = "side-1-0-village"; currentStorySceneId = ""; renderStory(); });
    byId("story-chapters").addEventListener("click", function (event) { var button = event.target.closest("[data-story-id]"); if (button) updateStorySelection(button.getAttribute("data-story-id")); });
    byId("story-reader").addEventListener("click", function (event) { var sceneButton = event.target.closest("[data-scene-id]"); if (sceneButton) { currentStorySceneId = sceneButton.getAttribute("data-scene-id"); renderStory(); return; } var completeButton = event.target.closest("[data-complete-scene]"); if (completeButton) completeStoryScene(currentStoryChapterId, completeButton.getAttribute("data-complete-scene")); });
    byId("story-world-map").addEventListener("click", function (event) {
      var atlasTarget = event.target.closest("[data-map-go]");
      if (atlasTarget && globalThis.StarshipInteractiveMap) {
        var atlasId = atlasTarget.getAttribute("data-map-go");
        if (atlasId.charAt(0) === "#") currentAtlasPointId = atlasId;
        else { currentAtlasMapId = atlasId; currentAtlasPointId = ""; }
        renderStoryWorldMap(storyChapterById(currentStoryChapterId));
        return;
      }
      var filter = event.target.closest("[data-map-filter]");
      if (filter) { currentStoryMapFilter = filter.getAttribute("data-map-filter") || "all"; renderStoryWorldMap(storyChapterById(currentStoryChapterId)); return; }
      var location = event.target.closest("[data-map-location]");
      if (location) { currentStoryMapLocationId = location.getAttribute("data-map-location"); renderStoryWorldMap(storyChapterById(currentStoryChapterId)); return; }
      var chapterButton = event.target.closest("[data-map-chapter]");
      if (chapterButton && !chapterButton.disabled) { var chapter = storyChapterById(chapterButton.getAttribute("data-map-chapter")); if (chapter) { currentStoryTab = chapter.type; updateStorySelection(chapter.id); } }
    });
    byId("story-world-map").addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      var location = event.target.closest("[data-map-location]");
      if (location) { event.preventDefault(); currentStoryMapLocationId = location.getAttribute("data-map-location"); renderStoryWorldMap(storyChapterById(currentStoryChapterId)); }
    });
     byId("character-list").addEventListener("click", function (event) {
       var animationButton = event.target.closest("[data-character-animation]"); if (animationButton) { event.stopPropagation(); openCharacterAnimation(animationButton.getAttribute("data-character-animation")); return; }
       var developButton = event.target.closest("[data-develop-character]"); if (developButton) { event.stopPropagation(); developCharacter(developButton.getAttribute("data-develop-character")); return; }
       var breakthroughButton = event.target.closest("[data-breakthrough-character]"); if (breakthroughButton) { event.stopPropagation(); breakthroughCharacter(breakthroughButton.getAttribute("data-breakthrough-character")); return; }
      var card = event.target.closest("[data-open-character]"); if (card) openCharacterDetail(card.getAttribute("data-open-character"));
    });
    byId("character-list").addEventListener("keydown", function (event) { if (event.target.closest("button, a, input, select, textarea")) return; if (event.key === "Enter" || event.key === " ") { var card = event.target.closest("[data-open-character]"); if (card) { event.preventDefault(); openCharacterDetail(card.getAttribute("data-open-character")); } } });
    byId("character-search").addEventListener("input", function () { characterSearchTerm = this.value; renderCharacters(); });
    byId("character-filter").addEventListener("change", function () { characterListFilter = this.value; renderCharacters(); });
    byId("character-detail").addEventListener("click", function (event) {
       var formButton = event.target.closest("[data-character-form]"); if (formButton) { selectCharacterForm(formButton.getAttribute("data-character-form")); return; }
       var animationButton = event.target.closest("[data-character-animation]"); if (animationButton) { openCharacterAnimation(animationButton.getAttribute("data-character-animation")); return; }
       if (event.target.closest("[data-close-character]")) { closeCharacterAnimation(); byId("character-detail").hidden = true; currentCharacterId = ""; currentCharacterSkinId = ""; return; }
       var skinButton = event.target.closest("[data-skin-preview]"); if (skinButton) { var skinId = skinButton.getAttribute("data-skin-preview"); currentCharacterSkinId = currentCharacterSkinId === skinId ? "" : skinId; renderCharacterDetail(currentCharacterId); return; }
       var equipButton = event.target.closest("[data-skin-equip]"); if (equipButton && !equipButton.disabled) { equipCharacterSkin(equipButton.getAttribute("data-skin-equip")); return; }
       var developButton = event.target.closest("[data-detail-develop]"); if (developButton) { developCharacter(developButton.getAttribute("data-detail-develop"), true); return; }
       var breakthroughButton = event.target.closest("[data-detail-breakthrough]"); if (breakthroughButton) { breakthroughCharacter(breakthroughButton.getAttribute("data-detail-breakthrough")); return; }
    });
    byId("close-character-animation").addEventListener("click", closeCharacterAnimation);
    byId("character-animation-dialog").addEventListener("close", resetCharacterAnimationVideo);
    byId("character-animation-dialog").addEventListener("click", function (event) { if (event.target === this) closeCharacterAnimation(); });
    byId("milestone-rewards").addEventListener("click", function (event) { var button = event.target.closest("[data-reward-key]"); if (button) claimCharacterChoice(button.getAttribute("data-reward-key"), button.getAttribute("data-card-id")); });
     byId("trial-stages").addEventListener("click", function (event) { var button = event.target.closest("[data-trial-stage]"); if (button && !button.disabled) { currentTrialStageId = Number(button.getAttribute("data-trial-stage")); renderTrial(); } });
     byId("trial-team-list").addEventListener("click", function (event) { var button = event.target.closest("[data-trial-character]"); if (button) toggleTrialTeam(button.getAttribute("data-trial-character")); });
     ["trial", "boss", "dispatch", "voyage"].forEach(function (mode) {
       byId(mode + "-formation").addEventListener("click", function (event) {
         var button = event.target.closest("[data-formation-move]");
         if (button && !button.disabled) moveFormationMember(mode, Number(button.getAttribute("data-formation-index")), Number(button.getAttribute("data-formation-direction")));
       });
     });
     byId("start-trial-battle").addEventListener("click", runTrialBattle);
     byId("boss-stages").addEventListener("click", function (event) { var button = event.target.closest("[data-boss-stage]"); if (button) { currentBossStageId = button.getAttribute("data-boss-stage"); currentBossTeam = []; var state = game.getState(); var progress = bossProgress(state); progress.selectedBossId = currentBossStageId; progress.selectedTeam = []; updateGameFromState(state); saveLocalState(); renderBoss(); } });
     byId("boss-team-list").addEventListener("click", function (event) { var button = event.target.closest("[data-boss-character]"); if (button) toggleBossTeam(button.getAttribute("data-boss-character")); });
     byId("start-boss-battle").addEventListener("click", runBossBattle);
     byId("dispatch-missions").addEventListener("click", function (event) { var button = event.target.closest("[data-dispatch-mission]"); if (button) { currentDispatchMissionId = button.getAttribute("data-dispatch-mission"); currentDispatchTeam = []; renderDispatch(); } });
    byId("dispatch-team-list").addEventListener("click", function (event) { var button = event.target.closest("[data-dispatch-character]"); if (button) toggleDispatchTeam(button.getAttribute("data-dispatch-character")); });
    byId("start-dispatch").addEventListener("click", runDispatchMission);
    byId("voyage-route-list").addEventListener("click", function (event) {
      var button = event.target.closest("[data-voyage-route]");
      if (!button || button.disabled) return;
      var routeId = button.getAttribute("data-voyage-route");
      var state = game.getState();
      if (voyageProgress(state).status === "active") { showMessage("目前航程進行中，完成或重新開航後才能更換航線。", true); return; }
      currentVoyageRouteId = routeId;
      voyageProgress(state).selectedRouteId = routeId;
      if (remoteMode) {
        apiRequest("/api/player/voyage", { action: "select-route", routeId: routeId }).then(function (payload) {
          currentVoyageRouteId = payload.selectedRouteId || routeId;
          updateGameFromState(payload.state);
          renderVoyage();
        }).catch(function (error) { showMessage(error.message, true); });
      } else {
        updateGameFromState(state);
        saveLocalState();
        renderVoyage();
      }
    });
    byId("start-voyage").addEventListener("click", function () { runVoyageAction(""); });
    byId("voyage-node-actions").addEventListener("click", function (event) { var choice = event.target.closest("[data-voyage-choice]"); if (choice && !choice.disabled) { runVoyageAction(choice.getAttribute("data-voyage-choice")); return; } var advance = event.target.closest("[data-voyage-advance]"); if (advance) runVoyageAction(""); });
    byId("voyage-team-list").addEventListener("click", function (event) { var button = event.target.closest("[data-voyage-character]"); if (button) toggleVoyageTeam(button.getAttribute("data-voyage-character")); });
    byId("pet-catalog-list").addEventListener("click", function (event) { var button = event.target.closest("[data-pet-select]"); if (!button) return; var petId = button.getAttribute("data-pet-select"); var progress = game.getState().petProgress || {}; if (progress.pets && progress.pets[petId] && progress.pets[petId].owned) runPetAction("select", petId); else runPetAction("adopt", petId); });
    byId("pet-selected-card").addEventListener("click", function (event) { var button = event.target.closest("[data-pet-action]"); if (button) runPetAction(button.getAttribute("data-pet-action"), button.getAttribute("data-pet-id"), button.getAttribute("data-pet-focus"), button.getAttribute("data-pet-challenge")); });
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




