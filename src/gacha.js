(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.StarshipGacha = factory();
  }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /**
   * 星界之律｜回覆召集的現行規則。
   *
   * 這裡刻意把規則寫成純函式和可序列化狀態，瀏覽器 UI、伺服器或測試
   * 都可以使用同一份抽卡核心，不會因為動畫或十連按鈕而產生另一套機率。
   */
  var DEFAULT_RULES = Object.freeze({
    hardPity: 50,
    noEarlyFourStarPulls: 20,
    pityStartPull: 21,
    pityStartRate: 0.10,
    pityStep: 0.04,
    featuredRate: 0.55,
    threeStarRate: 0.20,
    bonusStarSandRate: 0.08,
    bonusStarSandAmount: 40,
    nonCharacterReward: Object.freeze({ echoPowder: 1 }),
    development: Object.freeze({
      // 80 等後先進行角色專屬突破；現行版本最高開放到 90 等。
      // 100 等保留給後續版本的第二階段玩法，現在不會出現在玩家介面。
      maxLevel: 90,
      breakthroughLevel: 80,
      futureMaxLevel: 100,
      baseCharacterExp: 60,
      characterExpStep: 30,
      // 角色經驗改成「可大量取得、單次升級負擔較低」：
      // 三星保留較低的培養門檻，四星仍然需要更多資源以維持稀有度差異。
      threeStarBaseCharacterExp: 45,
      threeStarCharacterExpStep: 18,
      fourStarBaseCharacterExp: 70,
      fourStarCharacterExpStep: 32
    }),
    constellation: Object.freeze({ max: 6, characterCoreCost: 1 }),
    singleCost: 160,
    tenCost: 1600,
    duplicateFourStar: Object.freeze({ starMarks: 1, starSand: 50, characterExp: 240 }),
    duplicateThreeStar: Object.freeze({ characterExp: 160 })
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function isPlainObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  function validateRules(input) {
    var rules = Object.assign({}, DEFAULT_RULES, input || {});
    rules.duplicateFourStar = Object.assign({}, DEFAULT_RULES.duplicateFourStar, input && input.duplicateFourStar);
    rules.duplicateThreeStar = Object.assign({}, DEFAULT_RULES.duplicateThreeStar, input && input.duplicateThreeStar);
    rules.nonCharacterReward = Object.assign({}, DEFAULT_RULES.nonCharacterReward, input && input.nonCharacterReward);
    rules.development = Object.assign({}, DEFAULT_RULES.development, input && input.development);
    rules.constellation = Object.assign({}, DEFAULT_RULES.constellation, input && input.constellation);

    assert(Number.isInteger(rules.hardPity) && rules.hardPity > 0, "hardPity 必須是正整數");
    assert(Number.isInteger(rules.noEarlyFourStarPulls) && rules.noEarlyFourStarPulls >= 0, "noEarlyFourStarPulls 必須是非負整數");
    assert(rules.noEarlyFourStarPulls < rules.hardPity, "前段禁止出 4★ 的抽數必須小於硬保底");
    assert(Number.isInteger(rules.pityStartPull) && rules.pityStartPull === rules.noEarlyFourStarPulls + 1, "pityStartPull 必須接在前段保護之後");
    assert(rules.pityStartRate >= 0 && rules.pityStartRate <= 1, "pityStartRate 必須介於 0 與 1 之間");
    assert(rules.pityStep >= 0 && rules.pityStep <= 1, "pityStep 必須介於 0 與 1 之間");
    assert(rules.featuredRate >= 0 && rules.featuredRate <= 1, "featuredRate 必須介於 0 與 1 之間");
    assert(rules.threeStarRate >= 0 && rules.threeStarRate <= 1, "threeStarRate 必須介於 0 與 1 之間");
    assert(rules.bonusStarSandRate >= 0 && rules.bonusStarSandRate <= 1, "bonusStarSandRate 必須介於 0 與 1 之間");
    assert(Number.isInteger(rules.bonusStarSandAmount) && rules.bonusStarSandAmount >= 0, "bonusStarSandAmount 必須是非負整數");
    assert(Number.isInteger(rules.nonCharacterReward.echoPowder) && rules.nonCharacterReward.echoPowder >= 0, "nonCharacterReward.echoPowder 必須是非負整數");
    assert(Number.isInteger(rules.development.maxLevel) && rules.development.maxLevel > 1, "development.maxLevel 必須是大於 1 的整數");
    assert(Number.isInteger(rules.development.breakthroughLevel) && rules.development.breakthroughLevel >= 1 && rules.development.breakthroughLevel < rules.development.maxLevel, "development.breakthroughLevel 必須介於 1 與 maxLevel 之間");
    assert(Number.isInteger(rules.development.futureMaxLevel) && rules.development.futureMaxLevel > rules.development.maxLevel, "development.futureMaxLevel 必須高於目前 maxLevel");
    assert(Number.isInteger(rules.development.baseCharacterExp) && rules.development.baseCharacterExp >= 0, "development.baseCharacterExp 必須是非負整數");
    assert(Number.isInteger(rules.development.characterExpStep) && rules.development.characterExpStep >= 0, "development.characterExpStep 必須是非負整數");
    assert(Number.isInteger(rules.development.threeStarBaseCharacterExp) && rules.development.threeStarBaseCharacterExp >= 0, "development.threeStarBaseCharacterExp 必須是非負整數");
    assert(Number.isInteger(rules.development.threeStarCharacterExpStep) && rules.development.threeStarCharacterExpStep >= 0, "development.threeStarCharacterExpStep 必須是非負整數");
    assert(Number.isInteger(rules.development.fourStarBaseCharacterExp) && rules.development.fourStarBaseCharacterExp >= 0, "development.fourStarBaseCharacterExp 必須是非負整數");
    assert(Number.isInteger(rules.development.fourStarCharacterExpStep) && rules.development.fourStarCharacterExpStep >= 0, "development.fourStarCharacterExpStep 必須是非負整數");
    assert(Number.isInteger(rules.constellation.max) && rules.constellation.max > 0, "constellation.max 必須是正整數");
    assert(Number.isInteger(rules.constellation.characterCoreCost) && rules.constellation.characterCoreCost > 0, "constellation.characterCoreCost 必須是正整數");
    assert(Number.isInteger(rules.singleCost) && rules.singleCost >= 0, "singleCost 必須是非負整數");
    assert(Number.isInteger(rules.tenCost) && rules.tenCost >= 0, "tenCost 必須是非負整數");
    return rules;
  }

  /**
   * 取得「本次是該保底循環第幾抽」的 4★ 機率。
   *
   * 第 1–20 抽固定為 0%；第 21 抽為 10%；之後每抽增加 4 個百分點；
   * 第 50 抽直接硬保底。這個函式不依賴隨機數，方便 UI 顯示與測試。
   */
  function getFourStarRate(pullNumber, customRules) {
    var rules = validateRules(customRules);
    assert(Number.isInteger(pullNumber) && pullNumber >= 1, "pullNumber 必須是從 1 開始的整數");

    if (pullNumber <= rules.noEarlyFourStarPulls) {
      return 0;
    }
    if (pullNumber >= rules.hardPity) {
      return 1;
    }

    // 保留一格真正的硬保底：前一抽不會因為機率先到 100% 而被誤標成硬保底。
    // 第 50 抽由 _rollOne 的 isHardPity 直接保證，讓 UI 能清楚區分軟保底與硬保底。
    var rate = rules.pityStartRate + (pullNumber - rules.pityStartPull) * rules.pityStep;
    return Math.min(0.99, Math.max(0, rate));
  }

  function formatPercent(value) {
    return (value * 100).toFixed(value * 100 % 1 === 0 ? 0 : 2) + "%";
  }

  function normalizeCard(card, expectedRarity) {
    assert(isPlainObject(card), "卡片資料必須是物件");
    assert(typeof card.id === "string" && card.id.length > 0, "卡片必須有 id");
    assert(typeof card.name === "string" && card.name.length > 0, "卡片必須有 name");
    assert(Number.isInteger(card.rarity) && (card.rarity === 3 || card.rarity === 4), "目前只支援 3★ 與 4★");
    if (expectedRarity !== undefined) {
      assert(card.rarity === expectedRarity, "卡片星級與卡池欄位不一致：" + card.id);
    }
    assert(typeof card.element === "string" && card.element.length > 0, "卡片必須有 element：" + card.id);
    return Object.freeze(Object.assign({}, card));
  }

  function normalizeBanner(input) {
    assert(isPlainObject(input), "卡池資料必須是物件");
    assert(typeof input.id === "string" && input.id.length > 0, "卡池必須有 id");
    assert(typeof input.name === "string" && input.name.length > 0, "卡池必須有 name");
    assert(input.type === "limited" || input.type === "rerun" || input.type === "standard", "卡池 type 必須是 limited、rerun 或 standard");

    var poolKey = input.poolKey || (input.type === "standard" ? "standard" : "limited");
    var featured = (input.featured4Stars || []).map(function (card) { return normalizeCard(card, 4); });
    var standardFour = (input.standard4Stars || []).map(function (card) { return normalizeCard(card, 4); });
    var standardThree = (input.standard3Stars || []).map(function (card) { return normalizeCard(card, 3); });

    assert(standardThree.length > 0, "卡池至少要有一張 3★：" + input.id);
    if (input.type === "standard") {
      assert(standardFour.length > 0, "常駐卡池至少要有一張 4★：" + input.id);
      assert(featured.length === 0, "常駐回音召集不應有精選 4★：" + input.id);
    } else {
      assert(featured.length > 0, "限定或復刻卡池至少要有一張精選 4★：" + input.id);
      assert(standardFour.length > 1, "限定或復刻卡池至少要有一張可供歪出的其他 4★：" + input.id);
      assert(poolKey === "limited", "限定與復刻卡池必須共用 limited 計數：" + input.id);
    }

    var defaultFeaturedId = input.defaultFeaturedId || (featured[0] && featured[0].id);
    if (input.type !== "standard") {
      assert(featured.some(function (card) { return card.id === defaultFeaturedId; }), "defaultFeaturedId 必須是可選精選角色：" + input.id);
    }

    return Object.freeze({
      id: input.id,
      name: input.name,
      type: input.type,
      poolKey: poolKey,
      description: input.description || "",
      featured4Stars: Object.freeze(featured),
      standard4Stars: Object.freeze(standardFour),
      standard3Stars: Object.freeze(standardThree),
      defaultFeaturedId: defaultFeaturedId || null,
      active: input.active !== false
    });
  }

  function initialState() {
    return {
      version: 1,
      resources: {
        starSand: 160,
        starMarks: 0,
        echoPowder: 0,
        characterExp: 800
      },
      pity: {},
      selectedFeatured: {},
      collection: {},
      characterProgress: {},
      breakthroughMaterials: {},
      recruitment: {
        starterGranted: false,
        story10ChoiceAvailable: false,
        story10ChoiceClaimed: false,
        trial10ChoiceAvailable: false,
        trial10ChoiceClaimed: false
      },
      storyProgress: {
        currentChapter: "main-1-0",
        completedScenes: {}
      },
      trialProgress: {
        version: "2.0-2.5",
        selectedTeam: [],
        clearedStages: [],
        attempts: {},
        bestStage: 0,
        lastBattle: null
      },
      bossProgress: {
        version: "2.0-2.5",
        selectedBossId: "boss-star-warden",
        selectedTeam: [],
        attempts: {},
        lastBattle: null
      },
      updateRewards: {
        claimedVersions: {}
      },
      tutorialProgress: {
        version: "2.0-2.5",
        completed: false,
        rewardClaimed: false,
        completedAt: null
      },
      dispatchProgress: {
       version: "2.0-2.5",
        selectedTeam: [],
        claimed: {},
        lastMission: null
      },
      voyageProgress: {
        version: "2.0-2.5",
        status: "idle",
        routeId: null,
        route: [],
        nodeIndex: 0,
        selectedTeam: [],
        fragments: 0,
        buffs: [],
        flags: {},
        claimedRewards: {},
        lastBattle: null,
        lastEnding: null
      },
      cosmetics: {
        skins: {}
      },
      petProgress: {
        version: "2.0-2.5",
        selectedPetId: "star-fox",
        selectedOutfitId: "default",
        selectedEffectId: "starlit",
        pets: {
          "star-fox": { owned: true, level: 1, exp: 0, bond: 0, mood: 80, training: { care: 0, play: 0, focus: 0 } }
        },
        resources: { petFood: 6, petToys: 3, petTokens: 3, showcaseToken: 0 },
        exploreCount: 0,
        showcase: { isPublic: false, featuredPetId: "star-fox", outfitId: "default", effectId: "starlit", ratingTotal: 0, ratingCount: 0, ratedBy: {} },
        ratedShowcases: {},
        lastAction: null
      },
      bannerExchanges: {},
      totalPulls: 0,
      history: []
    };
  }

  function normalizeState(input, banners) {
    var source = isPlainObject(input) ? clone(input) : initialState();
    var state = initialState();
    state.version = source.version || 1;
    var legacyTickets = 0;
    if (isPlainObject(source.resources) && Object.prototype.hasOwnProperty.call(source.resources, "tickets")) {
      assert(Number.isInteger(source.resources.tickets) && source.resources.tickets >= 0, "舊版共鳴券數量必須是非負整數");
      legacyTickets = source.resources.tickets;
    }
    state.resources = Object.assign(state.resources, isPlainObject(source.resources) ? source.resources : {});
    delete state.resources.tickets;
    // 舊版的全域共鳴晶核沒有實際用途；現在只保留各角色自己的命座晶核。
    // 載入舊存檔時直接移除，不影響角色、命座、等級或其他資源。
    delete state.resources.resonanceCore;
    if (legacyTickets > 0) state.resources.starSand += legacyTickets * DEFAULT_RULES.singleCost;
    state.selectedFeatured = isPlainObject(source.selectedFeatured) ? source.selectedFeatured : {};
    state.collection = isPlainObject(source.collection) ? source.collection : {};
    state.characterProgress = isPlainObject(source.characterProgress) ? source.characterProgress : {};
    Object.keys(state.characterProgress).forEach(function (id) {
      var progress = isPlainObject(state.characterProgress[id]) ? state.characterProgress[id] : {};
      progress.level = Number.isInteger(progress.level) && progress.level >= 1 ? progress.level : 1;
      progress.affinity = Number.isInteger(progress.affinity) && progress.affinity >= 0 ? progress.affinity : 0;
      progress.constellation = Number.isInteger(progress.constellation) && progress.constellation >= 0 ? progress.constellation : 0;
      progress.constellationCore = Number.isInteger(progress.constellationCore) && progress.constellationCore >= 0 ? progress.constellationCore : 0;
      progress.breakthrough = progress.breakthrough === true;
      // 舊版曾把重複角色直接寫成命座；依持有數量補回尚未使用的個人晶核，
      // 讓像「莉亞持有 5 次」的舊帳號也能繼續提升，不會卡在只能按一次。
      var copies = Number(state.collection[id] || 0);
      var earnedByCopies = Math.max(0, copies - 1);
      var constellationFromCopies = Math.min(6, earnedByCopies);
      progress.constellation = Math.max(progress.constellation, constellationFromCopies);
      progress.constellationCore = Math.max(progress.constellationCore, earnedByCopies);
      state.characterProgress[id] = progress;
    });
    Object.keys(state.collection).forEach(function (id) {
      if (state.characterProgress[id]) return;
      var copies = Math.max(0, Number(state.collection[id]) || 0);
      state.characterProgress[id] = { level: 1, affinity: 0, constellation: Math.min(6, Math.max(0, copies - 1)), constellationCore: Math.max(0, copies - 1) };
      state.characterProgress[id].breakthrough = false;
    });
    state.breakthroughMaterials = isPlainObject(source.breakthroughMaterials) ? source.breakthroughMaterials : {};
    Object.keys(state.breakthroughMaterials).forEach(function (id) {
      var amount = Number(state.breakthroughMaterials[id]);
      state.breakthroughMaterials[id] = Number.isInteger(amount) && amount >= 0 ? amount : 0;
    });
    state.recruitment = Object.assign(initialState().recruitment, isPlainObject(source.recruitment) ? source.recruitment : {});
    state.storyProgress = Object.assign(initialState().storyProgress, isPlainObject(source.storyProgress) ? source.storyProgress : {});
    state.storyProgress.completedScenes = isPlainObject(state.storyProgress.completedScenes) ? state.storyProgress.completedScenes : {};
    state.trialProgress = Object.assign(initialState().trialProgress, isPlainObject(source.trialProgress) ? source.trialProgress : {});
    state.trialProgress.selectedTeam = Array.isArray(state.trialProgress.selectedTeam) ? state.trialProgress.selectedTeam.slice(0, 4) : [];
    state.trialProgress.clearedStages = Array.isArray(state.trialProgress.clearedStages) ? state.trialProgress.clearedStages.filter(function (id) { return Number.isInteger(id) && id > 0; }) : [];
    state.trialProgress.attempts = isPlainObject(state.trialProgress.attempts) ? state.trialProgress.attempts : {};
    Object.keys(state.trialProgress.attempts).forEach(function (id) {
      state.trialProgress.attempts[id] = Number.isInteger(state.trialProgress.attempts[id]) && state.trialProgress.attempts[id] >= 0 ? state.trialProgress.attempts[id] : 0;
    });
    state.trialProgress.bestStage = Number.isInteger(state.trialProgress.bestStage) && state.trialProgress.bestStage >= 0 ? state.trialProgress.bestStage : 0;
    state.bossProgress = Object.assign(initialState().bossProgress, isPlainObject(source.bossProgress) ? source.bossProgress : {});
    state.bossProgress.version = typeof state.bossProgress.version === "string" && state.bossProgress.version ? state.bossProgress.version : "2.0-2.5";
    state.bossProgress.selectedBossId = typeof state.bossProgress.selectedBossId === "string" ? state.bossProgress.selectedBossId : "boss-star-warden";
    state.bossProgress.selectedTeam = Array.isArray(state.bossProgress.selectedTeam) ? state.bossProgress.selectedTeam.slice(0, 4) : [];
    state.bossProgress.attempts = isPlainObject(state.bossProgress.attempts) ? state.bossProgress.attempts : {};
    Object.keys(state.bossProgress.attempts).forEach(function (id) {
      state.bossProgress.attempts[id] = Number.isInteger(state.bossProgress.attempts[id]) && state.bossProgress.attempts[id] >= 0 ? state.bossProgress.attempts[id] : 0;
    });
    state.bossProgress.lastBattle = isPlainObject(state.bossProgress.lastBattle) ? state.bossProgress.lastBattle : null;
    state.updateRewards = Object.assign(initialState().updateRewards, isPlainObject(source.updateRewards) ? source.updateRewards : {});
    state.updateRewards.claimedVersions = isPlainObject(state.updateRewards.claimedVersions) ? state.updateRewards.claimedVersions : {};
    state.tutorialProgress = Object.assign(initialState().tutorialProgress, isPlainObject(source.tutorialProgress) ? source.tutorialProgress : {});
    state.tutorialProgress.version = typeof state.tutorialProgress.version === "string" && state.tutorialProgress.version ? state.tutorialProgress.version : "2.0-2.5";
    state.tutorialProgress.completed = state.tutorialProgress.completed === true;
    state.tutorialProgress.rewardClaimed = state.tutorialProgress.rewardClaimed === true;
    state.tutorialProgress.completedAt = typeof state.tutorialProgress.completedAt === "string" ? state.tutorialProgress.completedAt : null;
    state.dispatchProgress = Object.assign(initialState().dispatchProgress, isPlainObject(source.dispatchProgress) ? source.dispatchProgress : {});
    state.dispatchProgress.selectedTeam = Array.isArray(state.dispatchProgress.selectedTeam) ? state.dispatchProgress.selectedTeam.slice(0, 4) : [];
    state.dispatchProgress.claimed = isPlainObject(state.dispatchProgress.claimed) ? state.dispatchProgress.claimed : {};
    state.voyageProgress = Object.assign(initialState().voyageProgress, isPlainObject(source.voyageProgress) ? source.voyageProgress : {});
    state.voyageProgress.version = typeof state.voyageProgress.version === "string" && state.voyageProgress.version ? state.voyageProgress.version : "2.0-2.5";
    state.voyageProgress.status = ["idle", "active", "complete", "failed"].indexOf(state.voyageProgress.status) >= 0 ? state.voyageProgress.status : "idle";
    state.voyageProgress.routeId = typeof state.voyageProgress.routeId === "string" ? state.voyageProgress.routeId : null;
    state.voyageProgress.route = Array.isArray(state.voyageProgress.route) ? state.voyageProgress.route.map(String) : [];
    state.voyageProgress.nodeIndex = Number.isInteger(state.voyageProgress.nodeIndex) && state.voyageProgress.nodeIndex >= 0 ? state.voyageProgress.nodeIndex : 0;
    state.voyageProgress.selectedTeam = Array.isArray(state.voyageProgress.selectedTeam) ? state.voyageProgress.selectedTeam.slice(0, 4) : [];
    state.voyageProgress.fragments = Number.isInteger(state.voyageProgress.fragments) && state.voyageProgress.fragments >= 0 ? state.voyageProgress.fragments : 0;
    state.voyageProgress.buffs = Array.isArray(state.voyageProgress.buffs) ? state.voyageProgress.buffs.map(String) : [];
    state.voyageProgress.flags = isPlainObject(state.voyageProgress.flags) ? state.voyageProgress.flags : {};
    state.voyageProgress.claimedRewards = isPlainObject(state.voyageProgress.claimedRewards) ? state.voyageProgress.claimedRewards : {};
    state.voyageProgress.lastBattle = isPlainObject(state.voyageProgress.lastBattle) ? state.voyageProgress.lastBattle : null;
    state.voyageProgress.lastEnding = isPlainObject(state.voyageProgress.lastEnding) ? state.voyageProgress.lastEnding : null;
    state.cosmetics = Object.assign(initialState().cosmetics, isPlainObject(source.cosmetics) ? source.cosmetics : {});
    state.cosmetics.skins = isPlainObject(state.cosmetics.skins) ? state.cosmetics.skins : {};
    state.petProgress = Object.assign(initialState().petProgress, isPlainObject(source.petProgress) ? source.petProgress : {});
    state.petProgress.version = typeof state.petProgress.version === "string" && state.petProgress.version ? state.petProgress.version : "2.0-2.5";
    state.petProgress.selectedPetId = typeof state.petProgress.selectedPetId === "string" ? state.petProgress.selectedPetId : "star-fox";
    state.petProgress.selectedOutfitId = typeof state.petProgress.selectedOutfitId === "string" ? state.petProgress.selectedOutfitId : "default";
    state.petProgress.selectedEffectId = typeof state.petProgress.selectedEffectId === "string" ? state.petProgress.selectedEffectId : "starlit";
    state.petProgress.pets = isPlainObject(state.petProgress.pets) ? state.petProgress.pets : {};
    if (!state.petProgress.pets["star-fox"]) state.petProgress.pets["star-fox"] = clone(initialState().petProgress.pets["star-fox"]);
    Object.keys(state.petProgress.pets).forEach(function (id) {
      var pet = isPlainObject(state.petProgress.pets[id]) ? state.petProgress.pets[id] : {};
      pet.owned = pet.owned !== false;
      pet.level = Number.isInteger(pet.level) && pet.level >= 1 ? pet.level : 1;
      pet.exp = Number.isInteger(pet.exp) && pet.exp >= 0 ? pet.exp : 0;
      pet.bond = Number.isInteger(pet.bond) && pet.bond >= 0 ? pet.bond : 0;
      pet.mood = Number.isInteger(pet.mood) && pet.mood >= 0 ? Math.min(100, pet.mood) : 80;
      pet.training = isPlainObject(pet.training) ? pet.training : {};
      ["care", "play", "focus"].forEach(function (key) { pet.training[key] = Number.isInteger(pet.training[key]) && pet.training[key] >= 0 ? pet.training[key] : 0; });
      state.petProgress.pets[id] = pet;
    });
    state.petProgress.resources = Object.assign(initialState().petProgress.resources, isPlainObject(state.petProgress.resources) ? state.petProgress.resources : {});
    ["petFood", "petToys", "petTokens", "showcaseToken"].forEach(function (key) { state.petProgress.resources[key] = Number.isInteger(state.petProgress.resources[key]) && state.petProgress.resources[key] >= 0 ? state.petProgress.resources[key] : 0; });
    state.petProgress.exploreCount = Number.isInteger(state.petProgress.exploreCount) && state.petProgress.exploreCount >= 0 ? state.petProgress.exploreCount : 0;
    state.petProgress.showcase = Object.assign(initialState().petProgress.showcase, isPlainObject(state.petProgress.showcase) ? state.petProgress.showcase : {});
    state.petProgress.showcase.isPublic = state.petProgress.showcase.isPublic === true;
    state.petProgress.showcase.featuredPetId = typeof state.petProgress.showcase.featuredPetId === "string" ? state.petProgress.showcase.featuredPetId : state.petProgress.selectedPetId;
    state.petProgress.showcase.outfitId = typeof state.petProgress.showcase.outfitId === "string" ? state.petProgress.showcase.outfitId : state.petProgress.selectedOutfitId;
    state.petProgress.showcase.effectId = typeof state.petProgress.showcase.effectId === "string" ? state.petProgress.showcase.effectId : state.petProgress.selectedEffectId;
    state.petProgress.showcase.ratingTotal = Number.isInteger(state.petProgress.showcase.ratingTotal) && state.petProgress.showcase.ratingTotal >= 0 ? state.petProgress.showcase.ratingTotal : 0;
    state.petProgress.showcase.ratingCount = Number.isInteger(state.petProgress.showcase.ratingCount) && state.petProgress.showcase.ratingCount >= 0 ? state.petProgress.showcase.ratingCount : 0;
    state.petProgress.showcase.ratedBy = isPlainObject(state.petProgress.showcase.ratedBy) ? state.petProgress.showcase.ratedBy : {};
    state.petProgress.ratedShowcases = isPlainObject(state.petProgress.ratedShowcases) ? state.petProgress.ratedShowcases : {};
    state.petProgress.lastAction = isPlainObject(state.petProgress.lastAction) ? state.petProgress.lastAction : null;
    state.bannerExchanges = isPlainObject(source.bannerExchanges) ? source.bannerExchanges : {};
    state.totalPulls = Number.isInteger(source.totalPulls) && source.totalPulls >= 0 ? source.totalPulls : 0;
    state.history = Array.isArray(source.history) ? source.history.slice(-50).map(function (entry) {
      if (!isPlainObject(entry)) return entry;
      var normalizedEntry = clone(entry);
      // 舊版歷史若使用過共鳴券，改以等價單抽星砂顯示。
      if (normalizedEntry.payment === "ticket") {
        normalizedEntry.payment = "starSand";
        normalizedEntry.cost = DEFAULT_RULES.singleCost;
      }
      return normalizedEntry;
    }) : [];

    ["starSand", "starMarks", "echoPowder", "characterExp"].forEach(function (key) {
      assert(Number.isInteger(state.resources[key]) && state.resources[key] >= 0, "資源數量必須是非負整數：" + key);
    });

    banners.forEach(function (banner) {
      var saved = isPlainObject(source.pity && source.pity[banner.poolKey]) ? source.pity[banner.poolKey] : {};
      if (!state.pity[banner.poolKey]) {
        state.pity[banner.poolKey] = {
          pullsSince4Star: 0,
          guaranteedFeatured: false
        };
      }
      state.pity[banner.poolKey].pullsSince4Star = Number.isInteger(saved.pullsSince4Star) ? saved.pullsSince4Star : 0;
      state.pity[banner.poolKey].guaranteedFeatured = saved.guaranteedFeatured === true;
      assert(state.pity[banner.poolKey].pullsSince4Star >= 0 && state.pity[banner.poolKey].pullsSince4Star < DEFAULT_RULES.hardPity, "保底計數超出範圍：" + banner.poolKey);
      if (banner.poolKey === "limited") {
        var selected = source.selectedFeatured && (source.selectedFeatured[banner.id] || source.selectedFeatured[banner.poolKey]);
        selected = selected || banner.defaultFeaturedId;
        if (banner.featured4Stars.some(function (card) { return card.id === selected; })) {
          state.selectedFeatured[banner.id] = selected;
        }
      }
    });

    return state;
  }

  function validateRandomValue(value) {
    assert(typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1, "rng 必須回傳 0 到 1 之間的數字");
    return value;
  }

  function pick(items, rng) {
    assert(items.length > 0, "抽卡池不可為空");
    var value = validateRandomValue(rng());
    var index = value === 1 ? items.length - 1 : Math.floor(value * items.length);
    return items[index];
  }

  function makePityState() {
    return { pullsSince4Star: 0, guaranteedFeatured: false };
  }

  function makeEmptyReward() {
    return { starSand: 0, starMarks: 0, echoPowder: 0, characterExp: 0, constellationCore: 0, petFood: 0, petToys: 0, petTokens: 0, showcaseToken: 0, skinId: null };
  }

  /**
   * 可直接放進產品後端或前端 store 的抽卡系統。
   * 狀態只包含 JSON 可序列化資料；抽卡使用的 rng 可以在測試時注入。
   */
  function GachaGame(options) {
    options = options || {};
    this.rules = validateRules(options.rules);
    this.rng = typeof options.rng === "function" ? options.rng : Math.random;
    this.now = typeof options.now === "function" ? options.now : function () { return new Date().toISOString(); };
    this.breakthroughRequirements = isPlainObject(options.breakthroughRequirements) ? options.breakthroughRequirements : {};
    this.voyageConfig = isPlainObject(options.voyageConfig) ? options.voyageConfig : {};
    this.petDefinitions = Array.isArray(options.petDefinitions) ? options.petDefinitions : [];
    this.petOutfits = Array.isArray(options.petOutfits) ? options.petOutfits : [];
    this.petEffects = Array.isArray(options.petEffects) ? options.petEffects : [];
    this.banners = (options.banners || []).map(normalizeBanner);
    assert(this.banners.length > 0, "至少要註冊一個卡池");
    this.bannerById = {};
    this.banners.forEach(function (banner) {
      assert(!this.bannerById[banner.id], "卡池 id 不可重複：" + banner.id);
      this.bannerById[banner.id] = banner;
    }, this);
    this.cardById = {};
    this.banners.forEach(function (banner) {
      banner.featured4Stars.concat(banner.standard4Stars, banner.standard3Stars).forEach(function (card) {
        this.cardById[card.id] = card;
      }, this);
    }, this);
    this.state = normalizeState(options.state, this.banners);
  }

  GachaGame.prototype.getBanner = function (bannerId) {
    var banner = this.bannerById[bannerId];
    assert(banner, "找不到卡池：" + bannerId);
    assert(banner.active, "卡池目前未開放：" + bannerId);
    return banner;
  };

  GachaGame.prototype.getState = function () {
    return clone(this.state);
  };

  GachaGame.prototype.getCharacterProgress = function (cardId) {
    var card = this.cardById[cardId];
    assert(card, "找不到角色：" + cardId);
    var saved = isPlainObject(this.state.characterProgress[cardId]) ? this.state.characterProgress[cardId] : {};
    return Object.assign({ level: 1, affinity: 0, constellation: 0, constellationCore: 0, breakthrough: false }, saved);
  };

  GachaGame.prototype._grantCardCopy = function (card) {
    var previousCopies = this.state.collection[card.id] || 0;
    this.state.collection[card.id] = previousCopies + 1;
    var progress = this.getCharacterProgress(card.id);
    var constellationCoreGranted = 0;
    if (previousCopies > 0) {
      // 重複角色立即提升 1 命，並留下 1 枚該角色專用晶核；
      // 專用晶核可在角色培養頁繼續突破，絕不與其他角色共用。
      progress.constellation = Math.min(this.rules.constellation.max, Math.max(0, Number(progress.constellation) || 0) + 1);
      progress.constellationCore = Math.max(0, Number(progress.constellationCore) || 0) + 1;
      constellationCoreGranted = 1;
    }
    this.state.characterProgress[card.id] = progress;
    return { previousCopies: previousCopies, progress: progress, constellationCoreGranted: constellationCoreGranted };
  };

  GachaGame.prototype.grantCharacter = function (cardId) {
    var card = this.cardById[cardId];
    assert(card, "找不到角色：" + cardId);
    var copy = this._grantCardCopy(card);
    return { card: clone(card), copies: this.state.collection[card.id], state: this.getState() };
  };

  GachaGame.prototype.developCharacter = function (options) {
    options = options || {};
    var card = this.cardById[options.cardId];
    assert(card, "找不到角色：" + options.cardId);
    assert((this.state.collection[card.id] || 0) > 0, "尚未取得這名角色，無法培養");
    var progress = this.getCharacterProgress(card.id);
    var level = Number.isInteger(progress.level) && progress.level >= 1 ? progress.level : 1;
    assert(level < this.rules.development.maxLevel, "角色已達目前最高等級");
    if (level >= this.rules.development.breakthroughLevel && !progress.breakthrough) {
      var requirement = this.getBreakthroughRequirement(card.id);
      assert(false, "角色已達 " + this.rules.development.breakthroughLevel + " 等，請先到 Boss 選單取得 " + requirement.materialName + " 或星界通用突破印記並完成突破");
    }
    var isFourStar = card.rarity === 4;
    var cost = {
      characterExp: (isFourStar ? this.rules.development.fourStarBaseCharacterExp : this.rules.development.threeStarBaseCharacterExp) + (level - 1) * (isFourStar ? this.rules.development.fourStarCharacterExpStep : this.rules.development.threeStarCharacterExpStep)
    };
    assert(this.state.resources.characterExp >= cost.characterExp, "角色經驗不足，需要 " + cost.characterExp);
    this.state.resources.characterExp -= cost.characterExp;
    progress.level = level + 1;
    progress.affinity = Math.min(100, (Number(progress.affinity) || 0) + 1);
    this.state.characterProgress[card.id] = progress;
    return { card: clone(card), cost: cost, progress: clone(progress), state: this.getState() };
  };

  GachaGame.prototype.getBreakthroughRequirement = function (cardId) {
    var card = this.cardById[cardId];
    assert(card, "找不到角色：" + cardId);
    var requirement = this.breakthroughRequirements[card.id];
    assert(isPlainObject(requirement) && typeof requirement.materialId === "string" && requirement.materialId.length > 0, "找不到角色的突破材料設定：" + card.id);
    assert(Number.isInteger(requirement.cost) && requirement.cost > 0, "角色突破材料數量設定錯誤：" + card.id);
    return clone(requirement);
  };

  GachaGame.prototype.breakthroughCharacter = function (options) {
    options = options || {};
    var card = this.cardById[options.cardId];
    assert(card, "找不到角色：" + options.cardId);
    assert((this.state.collection[card.id] || 0) > 0, "尚未取得這名角色，無法突破");
    var progress = this.getCharacterProgress(card.id);
    assert(progress.level >= this.rules.development.breakthroughLevel, "角色必須先升到 " + this.rules.development.breakthroughLevel + " 等才能突破");
    assert(progress.level === this.rules.development.breakthroughLevel, "目前只開放 80 等突破");
    assert(!progress.breakthrough, "角色已完成 80 等突破");
    var requirement = this.getBreakthroughRequirement(card.id);
    var available = Math.max(0, Number(this.state.breakthroughMaterials[requirement.materialId]) || 0);
    var universalId = "universal-core";
    var universalAvailable = Math.max(0, Number(this.state.breakthroughMaterials[universalId]) || 0);
    assert(available + universalAvailable >= requirement.cost, "" + requirement.materialName + "不足，需要 " + requirement.cost + " 個；可用指定 Boss 材料或星界通用突破印記補足");
    var specificUsed = Math.min(available, requirement.cost);
    var universalUsed = requirement.cost - specificUsed;
    this.state.breakthroughMaterials[requirement.materialId] = available - specificUsed;
    this.state.breakthroughMaterials[universalId] = universalAvailable - universalUsed;
    progress.breakthrough = true;
    this.state.characterProgress[card.id] = progress;
    return { card: clone(card), requirement: requirement, cost: { materialId: requirement.materialId, amount: requirement.cost, specificUsed: specificUsed, universalUsed: universalUsed }, progress: clone(progress), state: this.getState() };
  };

  GachaGame.prototype.enhanceConstellation = function (options) {
    options = options || {};
    var card = this.cardById[options.cardId];
    assert(card, "找不到角色：" + options.cardId);
    assert((this.state.collection[card.id] || 0) > 0, "尚未取得這名角色，無法提升命座");
    var progress = this.getCharacterProgress(card.id);
    var constellation = Math.max(0, Number(progress.constellation) || 0);
    assert(constellation < this.rules.constellation.max, "角色命座已達目前最高階");
    var cost = { constellationCore: this.rules.constellation.characterCoreCost };
    var availableCores = Math.max(0, Number(progress.constellationCore) || 0);
    assert(availableCores >= cost.constellationCore, "該角色的命座晶核不足，需要 " + cost.constellationCore + " 枚；請先取得重複角色");
    progress.constellationCore = availableCores - cost.constellationCore;
    progress.constellation = constellation + 1;
    progress.affinity = Math.min(100, (Number(progress.affinity) || 0) + 3);
    this.state.characterProgress[card.id] = progress;
    return { card: clone(card), cost: cost, progress: clone(progress), state: this.getState() };
  };

  GachaGame.prototype.getBanners = function () {
    return this.banners.map(function (banner) { return clone(banner); });
  };

  GachaGame.prototype.getPityStatus = function (bannerId) {
    var banner = this.getBanner(bannerId);
    var pity = this.state.pity[banner.poolKey] || makePityState();
    var nextPullNumber = pity.pullsSince4Star + 1;
    var selectedFeatured = this.getSelectedFeatured(banner.id);
    return {
      bannerId: banner.id,
      poolKey: banner.poolKey,
      pullsSince4Star: pity.pullsSince4Star,
      nextPullNumber: nextPullNumber,
      currentFourStarRate: getFourStarRate(nextPullNumber, this.rules),
      currentFourStarRateText: formatPercent(getFourStarRate(nextPullNumber, this.rules)),
      pullsUntilHardPity: this.rules.hardPity - pity.pullsSince4Star,
      guaranteedFeatured: banner.poolKey === "limited" && pity.guaranteedFeatured,
      selectedFeaturedId: selectedFeatured ? selectedFeatured.id : null,
      selectedFeatured: selectedFeatured ? clone(selectedFeatured) : null,
      hardPity: this.rules.hardPity,
      noEarlyFourStarPulls: this.rules.noEarlyFourStarPulls
    };
  };

  GachaGame.prototype.getSelectedFeatured = function (bannerId) {
    var banner = this.getBanner(bannerId);
    if (banner.poolKey !== "limited") {
      return null;
    }
    var selectedId = this.state.selectedFeatured[banner.id] || this.state.selectedFeatured[banner.poolKey] || banner.defaultFeaturedId;
    return banner.featured4Stars.find(function (card) { return card.id === selectedId; }) || banner.featured4Stars[0];
  };

  GachaGame.prototype.selectFeatured = function (options) {
    options = options || {};
    var banner = this.getBanner(options.bannerId);
    assert(banner.poolKey === "limited", "常駐回音召集沒有可選精選角色");
    var selected = banner.featured4Stars.find(function (card) { return card.id === options.cardId; });
    assert(selected, "這隻角色不在目前卡池的可選限定 4★ 清單中");
    this.state.selectedFeatured[banner.id] = selected.id;
    return { bannerId: banner.id, card: clone(selected), state: this.getState() };
  };

  GachaGame.prototype._rollOne = function (banner) {
    var pity = this.state.pity[banner.poolKey] || makePityState();
    this.state.pity[banner.poolKey] = pity;
    var pityPullNumber = pity.pullsSince4Star + 1;
    var rate = getFourStarRate(pityPullNumber, this.rules);
    var isHardPity = pityPullNumber >= this.rules.hardPity;
    var isFourStar = isHardPity || validateRandomValue(this.rng()) < rate;
    var card;
    var isFeatured = false;
    var resourceReward = makeEmptyReward();
    var compensationReward = makeEmptyReward();

    if (isFourStar) {
      if (banner.poolKey === "limited") {
        var forcedFeatured = pity.guaranteedFeatured === true;
        isFeatured = forcedFeatured || validateRandomValue(this.rng()) < this.rules.featuredRate;
        if (isFeatured) {
          card = this.getSelectedFeatured(banner.id);
        } else {
          var selectedId = this.getSelectedFeatured(banner.id).id;
          var otherFourStars = banner.standard4Stars.filter(function (item) { return item.id !== selectedId; });
          assert(otherFourStars.length > 0, "目前卡池沒有可供歪出的其他 4★：" + banner.id);
          card = pick(otherFourStars, this.rng.bind(this));
        }
        pity.guaranteedFeatured = !isFeatured;
      } else {
        card = pick(banner.standard4Stars, this.rng.bind(this));
        pity.guaranteedFeatured = false;
      }
      pity.pullsSince4Star = 0;
    } else if (validateRandomValue(this.rng()) < this.rules.threeStarRate) {
      // 三星不另開卡池，所有現行三星角色都從同一個非 4★ 結果池抽取。
      card = pick(banner.standard3Stars, this.rng.bind(this));
      pity.pullsSince4Star = pityPullNumber;
    } else {
      // 非角色結果仍給回響粉；另有 8% 小機率掉落少量星砂。
      resourceReward.echoPowder = this.rules.nonCharacterReward.echoPowder;
      if (validateRandomValue(this.rng()) < this.rules.bonusStarSandRate) {
        resourceReward.starSand = this.rules.bonusStarSandAmount;
      }
      pity.pullsSince4Star = pityPullNumber;
    }

    this.state.totalPulls += 1;
    var previousCopies = card ? (this.state.collection[card.id] || 0) : 0;
    var isFirstAcquisition = Boolean(card) && previousCopies === 0;
    var copy = card ? this._grantCardCopy(card) : null;
    var duplicateReward = makeEmptyReward();

    if (card && !isFirstAcquisition && card.rarity === 4) {
      duplicateReward.starMarks = this.rules.duplicateFourStar.starMarks;
      duplicateReward.starSand = this.rules.duplicateFourStar.starSand;
      duplicateReward.characterExp = this.rules.duplicateFourStar.characterExp;
      duplicateReward.constellationCore = copy ? copy.constellationCoreGranted : 0;
    } else if (card && !isFirstAcquisition && card.rarity === 3) {
      duplicateReward.characterExp = this.rules.duplicateThreeStar.characterExp;
      duplicateReward.constellationCore = copy ? copy.constellationCoreGranted : 0;
    }

    // 只有「出了 4★ 但歪到其他 4★」才發放補償，避免普通未出金時變成無限資源。
    if (banner.poolKey === "limited" && card && card.rarity === 4 && !isFeatured) {
      compensationReward.starSand = 1000;
    }

    this.state.resources.starSand += duplicateReward.starSand + resourceReward.starSand + compensationReward.starSand;
    this.state.resources.starMarks += duplicateReward.starMarks + resourceReward.starMarks;
    this.state.resources.echoPowder += duplicateReward.echoPowder + resourceReward.echoPowder;
    this.state.resources.characterExp += duplicateReward.characterExp + resourceReward.characterExp;

    return {
      card: card ? clone(card) : null,
      rarity: card ? card.rarity : 0,
      kind: card ? "character" : "resource",
      featured: isFeatured,
      isHardPity: isHardPity,
      pityPullNumber: pityPullNumber,
      fourStarRate: rate,
      fourStarRateText: formatPercent(rate),
      featuredCardId: this.getSelectedFeatured(banner.id) ? this.getSelectedFeatured(banner.id).id : null,
      isFirstAcquisition: isFirstAcquisition,
      resourceReward: resourceReward,
      duplicateReward: duplicateReward,
      compensationReward: compensationReward,
      pityAfter: clone(pity)
    };
  };

  GachaGame.prototype.pull = function (options) {
    options = options || {};
    var banner = this.getBanner(options.bannerId);
    var count = options.count === undefined ? 1 : options.count;
    var payment = options.payment || "starSand";
    assert(count === 1 || count === 10, "一次只能抽 1 抽或 10 抽");
    assert(payment === "starSand", "目前抽卡只使用星砂；舊版共鳴券已按單抽等價轉換");

    var cost = count === 10 ? this.rules.tenCost : this.rules.singleCost;
    assert(this.state.resources.starSand >= cost, "星砂不足，需要 " + cost + " 星砂");
    this.state.resources.starSand -= cost;

    var results = [];
    for (var i = 0; i < count; i += 1) {
      results.push(this._rollOne(banner));
    }

    var summary = results.reduce(function (result, item) {
      result.total += 1;
      if (item.rarity === 4) {
        result.fourStar += 1;
      } else if (item.rarity === 3) {
        result.threeStar += 1;
      } else {
        result.resource += 1;
      }
      if (item.featured) {
        result.featured += 1;
      }
      if (item.isHardPity) {
        result.hardPity += 1;
      }
      result.bonusStarSand += item.resourceReward.starSand || 0;
      result.compensationStarSand += item.compensationReward.starSand || 0;
      return result;
    }, { total: 0, fourStar: 0, threeStar: 0, resource: 0, featured: 0, hardPity: 0, bonusStarSand: 0, compensationStarSand: 0 });

    var record = {
      at: this.now(),
      bannerId: banner.id,
      poolKey: banner.poolKey,
      count: count,
      payment: payment,
      cost: cost,
      summary: summary,
      results: clone(results)
    };
    this.state.history.push(record);
    this.state.history = this.state.history.slice(-50);

    return {
      banner: clone(banner),
      bannerId: banner.id,
      count: count,
      payment: payment,
      cost: cost,
      results: results,
      summary: summary,
      state: this.getState(),
      pity: this.getPityStatus(banner.id)
    };
  };

  GachaGame.prototype.exchangeFeatured = function (options) {
    options = options || {};
    var banner = this.getBanner(options.bannerId);
    assert(banner.poolKey === "limited", "只有限定或復刻卡池可以兌換當期精選");
    assert(!this.state.bannerExchanges[banner.id], "這一檔卡池的精選兌換已使用");
    assert(this.state.resources.starMarks >= 10, "星痕不足，需要 10 枚");

    var card;
    if (options.cardId) {
      card = banner.featured4Stars.find(function (item) { return item.id === options.cardId; });
    } else {
      card = this.getSelectedFeatured(banner.id);
    }
    assert(card, "請指定要兌換的當期精選 4★");

    this.state.resources.starMarks -= 10;
    this.state.bannerExchanges[banner.id] = true;
    var copies = this.state.collection[card.id] || 0;
    this._grantCardCopy(card);

    return {
      card: clone(card),
      isFirstAcquisition: copies === 0,
      cost: { starMarks: 10 },
      state: this.getState()
    };
  };

  GachaGame.prototype.completeTutorial = function (options) {
    options = options || {};
    var progress = this.state.tutorialProgress;
    var reward = Object.assign({ starSand: 920, characterExp: 600 }, options.reward || {});
    if (Object.prototype.hasOwnProperty.call(reward, "tickets")) {
      assert(Number.isInteger(reward.tickets) && reward.tickets >= 0, "舊版新手教學共鳴券數量必須是非負整數");
      reward.starSand += reward.tickets * this.rules.singleCost;
      delete reward.tickets;
    }
    ["starSand", "characterExp"].forEach(function (key) {
      assert(Number.isInteger(reward[key]) && reward[key] >= 0, "新手教學獎勵必須是非負整數：" + key);
    }, this);
    if (progress.rewardClaimed) {
      return { alreadyClaimed: true, reward: { starSand: 0, characterExp: 0 }, state: this.getState() };
    }
    progress.version = String(options.version || progress.version || "2.0-2.5");
    progress.completed = true;
    progress.rewardClaimed = true;
    progress.completedAt = this.now();
    this.state.resources.starSand += reward.starSand;
    this.state.resources.characterExp += reward.characterExp;
    return { alreadyClaimed: false, reward: clone(reward), state: this.getState() };
  };

  GachaGame.prototype.getVoyageNode = function (nodeId) {
    var nodes = Array.isArray(this.voyageConfig.nodes) ? this.voyageConfig.nodes : [];
    var node = nodes.find(function (item) { return item && item.id === nodeId; });
    assert(node, "找不到星海迷航節點：" + nodeId);
    return clone(node);
  };

  GachaGame.prototype.startVoyage = function (options) {
    options = options || {};
    var routes = Array.isArray(this.voyageConfig.routes) ? this.voyageConfig.routes : [];
    assert(routes.length > 0, "星海迷航尚未設定航線");
    var progress = this.state.voyageProgress;
    assert(progress.status !== "active", "目前已有進行中的星海迷航航程");
    var route = options.routeId ? routes.find(function (item) { return item && item.id === options.routeId; }) : null;
    if (!route) route = pick(routes, this.rng);
    assert(Array.isArray(route.nodeIds) && route.nodeIds.length > 0, "星海迷航航線沒有節點");
    progress.version = String(this.voyageConfig.version || progress.version || "2.0-2.5");
    progress.status = "active";
    progress.routeId = route.id;
    progress.route = route.nodeIds.slice();
    progress.nodeIndex = 0;
    progress.selectedTeam = Array.isArray(options.team) ? options.team.slice(0, 4) : [];
    progress.fragments = 0;
    progress.buffs = [];
    progress.flags = {};
    progress.lastBattle = null;
    progress.lastEnding = null;
    return { state: this.getState(), route: clone(route), node: this.getVoyageNode(progress.route[0]) };
  };

  GachaGame.prototype._finishVoyage = function (team) {
    var progress = this.state.voyageProgress;
    var hasFour = team.some(function (id) { return this.cardById[id] && this.cardById[id].rarity === 4; }, this);
    var hasThree = team.some(function (id) { return this.cardById[id] && this.cardById[id].rarity === 3; }, this);
    var special = progress.flags.harmonized === true && hasFour && hasThree;
    var hidden = !special && (progress.flags.secretGate === true || (Number(progress.flags.echoes) >= 2 && progress.routeId === "route-hidden"));
    var endingId = special ? "special" : (hidden ? "hidden" : "normal");
    var configuredReward = this.voyageConfig.endingRewards && this.voyageConfig.endingRewards[endingId] ? this.voyageConfig.endingRewards[endingId] : {};
    var reward = makeEmptyReward();
    Object.keys(configuredReward).forEach(function (key) { reward[key] = configuredReward[key]; });
    var alreadyClaimed = Boolean(progress.claimedRewards[endingId]);
    if (!alreadyClaimed) {
      ["starSand", "starMarks", "echoPowder", "characterExp"].forEach(function (key) {
        if (Number.isInteger(reward[key]) && reward[key] > 0) this.state.resources[key] += reward[key];
      }, this);
      ["petFood", "petToys", "petTokens", "showcaseToken"].forEach(function (key) {
        if (Number.isInteger(reward[key]) && reward[key] > 0) this.state.petProgress.resources[key] += reward[key];
      }, this);
      if (reward.skinId) {
        this.state.cosmetics.skins[reward.skinId] = { unlockedAt: this.now(), source: "star-sea-voyage", ending: endingId };
      }
      progress.claimedRewards[endingId] = { claimedAt: this.now(), skinId: reward.skinId || null };
    }
    progress.status = "complete";
    progress.lastEnding = { id: endingId, alreadyClaimed: alreadyClaimed, reward: clone(reward), completedAt: this.now() };
    return { endingId: endingId, alreadyClaimed: alreadyClaimed, reward: clone(reward) };
  };

  GachaGame.prototype.advanceVoyage = function (options) {
    options = options || {};
    var progress = this.state.voyageProgress;
    assert(progress.status === "active", "目前沒有進行中的星海迷航航程");
    var currentNodeId = progress.route[progress.nodeIndex];
    assert(currentNodeId === options.nodeId, "星海迷航節點已變更，請重新整理目前航程");
    var node = this.getVoyageNode(currentNodeId);
    var team = Array.isArray(options.team) ? options.team.slice(0, 4) : progress.selectedTeam.slice(0, 4);
    progress.selectedTeam = team;
    if (node.type === "combat" || node.type === "boss") {
      assert(isPlainObject(options.battle) && typeof options.battle.won === "boolean", "星海迷航戰鬥需要有效戰報");
      progress.lastBattle = clone(options.battle);
      if (!options.battle.won) {
        progress.status = "failed";
        return { state: this.getState(), node: node, nextNode: null, battle: clone(options.battle), reward: makeEmptyReward(), ending: null };
      }
      progress.fragments += Math.max(0, Number(node.fragmentReward) || 0);
      if (node.buff) progress.buffs.push(String(node.buff));
    }
    if (node.choices && node.choices.length) {
      var choice = node.choices.find(function (item) { return item && item.id === options.choice; });
      assert(choice, "請先選擇星海迷航事件處理方式");
      if (choice.requiresMixedTeam) {
        var mixed = team.some(function (id) { return this.cardById[id] && this.cardById[id].rarity === 3; }, this) && team.some(function (id) { return this.cardById[id] && this.cardById[id].rarity === 4; }, this);
        assert(mixed, "這個選項需要同時編入三星與四星角色");
      }
      if (choice.requiresFlag) assert(progress.flags[choice.requiresFlag] === true, "尚未取得這個事件的必要線索");
      if (Number(choice.costFragments || 0) > 0) assert(progress.fragments >= choice.costFragments, "星海碎片不足");
      progress.fragments = Math.max(0, progress.fragments - Math.max(0, Number(choice.costFragments) || 0) + Number(choice.fragmentDelta || 0));
      if (choice.buff) progress.buffs.push(String(choice.buff));
      if (choice.flag) progress.flags[choice.flag] = choice.flagValue === undefined ? true : choice.flagValue;
      if (choice.incrementFlag) progress.flags[choice.incrementFlag] = Number(progress.flags[choice.incrementFlag] || 0) + 1;
    }
    progress.nodeIndex += 1;
    var ending = null;
    if (node.final || progress.nodeIndex >= progress.route.length) ending = this._finishVoyage(team);
    var nextNode = progress.status === "active" ? this.getVoyageNode(progress.route[progress.nodeIndex]) : null;
    return { state: this.getState(), node: node, nextNode: nextNode, battle: options.battle ? clone(options.battle) : null, reward: ending ? ending.reward : makeEmptyReward(), ending: ending };
  };

  GachaGame.prototype.getPetDefinition = function (petId) {
    var definition = this.petDefinitions.find(function (item) { return item && item.id === petId; });
    assert(definition, "找不到寵物：" + petId);
    return clone(definition);
  };

  GachaGame.prototype.setPetCustomization = function (options) {
    options = options || {};
    var progress = this.state.petProgress;
    var petId = options.petId || options.selectedPetId || progress.selectedPetId;
    assert(progress.pets[petId] && progress.pets[petId].owned, "尚未擁有這隻寵物");
    var outfitId = options.outfitId || options.selectedOutfitId || progress.selectedOutfitId;
    var effectId = options.effectId || options.selectedEffectId || progress.selectedEffectId;
    if (this.petOutfits.length) assert(this.petOutfits.some(function (item) { return item.id === outfitId; }), "找不到寵物裝扮");
    if (this.petEffects.length) assert(this.petEffects.some(function (item) { return item.id === effectId; }), "找不到寵物特效");
    progress.selectedPetId = petId;
    progress.selectedOutfitId = outfitId;
    progress.selectedEffectId = effectId;
    progress.showcase.featuredPetId = petId;
    progress.showcase.outfitId = outfitId;
    progress.showcase.effectId = effectId;
    if (options.isPublic !== undefined) progress.showcase.isPublic = options.isPublic === true;
    return { state: this.getState(), showcase: clone(progress.showcase) };
  };

  GachaGame.prototype.petAction = function (options) {
    options = options || {};
    var action = String(options.action || "");
    var progress = this.state.petProgress;
    var petId = String(options.petId || progress.selectedPetId || "star-fox");
    var definition = this.getPetDefinition(petId);
    var resources = progress.resources;
    var reward = { petFood: 0, petToys: 0, petTokens: 0, showcaseToken: 0, petExp: 0 };
    if (action === "adopt") {
      assert(!progress.pets[petId] || !progress.pets[petId].owned, "這隻寵物已經在你的工坊");
      assert(resources.petTokens >= 3, "星伴代幣不足，需要 3 枚才能領養");
      resources.petTokens -= 3;
      progress.pets[petId] = { owned: true, level: 1, exp: 0, bond: 0, mood: 70, training: { care: 0, play: 0, focus: 0 } };
      progress.selectedPetId = petId;
    } else {
      assert(progress.pets[petId] && progress.pets[petId].owned, "尚未擁有這隻寵物");
      var pet = progress.pets[petId];
      if (action === "select") {
        progress.selectedPetId = petId;
        progress.showcase.featuredPetId = petId;
      } else if (action === "feed") {
        assert(resources.petFood >= 1, "寵物飼料不足");
        resources.petFood -= 1;
        reward.petExp = 45; pet.exp += reward.petExp; pet.bond = Math.min(100, pet.bond + 2); pet.mood = Math.min(100, pet.mood + 5);
      } else if (action === "play") {
        assert(resources.petToys >= 1, "寵物玩具不足");
        resources.petToys -= 1;
        reward.petExp = 30; pet.exp += reward.petExp; pet.bond = Math.min(100, pet.bond + 3); pet.mood = Math.min(100, pet.mood + 8); pet.training.play += 1;
      } else if (action === "train") {
        assert(resources.petTokens >= 1, "星伴代幣不足");
        resources.petTokens -= 1;
        reward.petExp = 65; pet.exp += reward.petExp; pet.bond = Math.min(100, pet.bond + 1); pet.mood = Math.max(0, pet.mood - 2);
        var focus = ["care", "play", "focus"].indexOf(options.focus) >= 0 ? options.focus : "focus";
        pet.training[focus] += 1;
      } else if (action === "explore") {
        assert(progress.exploreCount < 3, "本期寵物探索已完成 3 次，等待下次版本更新");
        progress.exploreCount += 1;
        reward.petExp = 20; pet.exp += reward.petExp; pet.bond = Math.min(100, pet.bond + 1); pet.mood = Math.min(100, pet.mood + 2);
        reward.petFood = 2; reward.petToys = 1; reward.petTokens = 1;
        resources.petFood += reward.petFood; resources.petToys += reward.petToys; resources.petTokens += reward.petTokens;
      } else {
        throw new Error("找不到寵物活動");
      }
      if (action !== "select") {
        var maxLevel = Number(definition.maxLevel || 30);
        var levelUps = 0;
        while (pet.level < maxLevel && pet.exp >= 80 + pet.level * 40) {
          pet.exp -= 80 + pet.level * 40;
          pet.level += 1;
          levelUps += 1;
        }
        reward.levelUps = levelUps;
      }
    }
    progress.lastAction = { action: action, petId: petId, at: this.now(), reward: clone(reward) };
    return { state: this.getState(), pet: clone(progress.pets[petId]), definition: definition, reward: reward };
  };

  GachaGame.prototype.reset = function () {
    this.state = normalizeState(initialState(), this.banners);
    return this.getState();
  };

  return {
    DEFAULT_RULES: DEFAULT_RULES,
    GachaGame: GachaGame,
    getFourStarRate: getFourStarRate,
    formatPercent: formatPercent
  };
}));
