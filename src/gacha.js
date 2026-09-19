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
      maxLevel: 80,
      baseCharacterExp: 80,
      characterExpStep: 45,
      threeStarBaseCharacterExp: 60,
      threeStarCharacterExpStep: 30,
      fourStarBaseCharacterExp: 100,
      fourStarCharacterExpStep: 55
    }),
    constellation: Object.freeze({ max: 6, characterCoreCost: 1, baseResonanceCore: 1, resonanceCoreStep: 1 }),
    singleCost: 160,
    tenCost: 1600,
    duplicateFourStar: Object.freeze({ starMarks: 1, starSand: 50, resonanceCore: 1 }),
    duplicateThreeStar: Object.freeze({ characterExp: 80 })
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
    assert(Number.isInteger(rules.development.baseCharacterExp) && rules.development.baseCharacterExp >= 0, "development.baseCharacterExp 必須是非負整數");
    assert(Number.isInteger(rules.development.characterExpStep) && rules.development.characterExpStep >= 0, "development.characterExpStep 必須是非負整數");
    assert(Number.isInteger(rules.development.threeStarBaseCharacterExp) && rules.development.threeStarBaseCharacterExp >= 0, "development.threeStarBaseCharacterExp 必須是非負整數");
    assert(Number.isInteger(rules.development.threeStarCharacterExpStep) && rules.development.threeStarCharacterExpStep >= 0, "development.threeStarCharacterExpStep 必須是非負整數");
    assert(Number.isInteger(rules.development.fourStarBaseCharacterExp) && rules.development.fourStarBaseCharacterExp >= 0, "development.fourStarBaseCharacterExp 必須是非負整數");
    assert(Number.isInteger(rules.development.fourStarCharacterExpStep) && rules.development.fourStarCharacterExpStep >= 0, "development.fourStarCharacterExpStep 必須是非負整數");
    assert(Number.isInteger(rules.constellation.max) && rules.constellation.max > 0, "constellation.max 必須是正整數");
    assert(Number.isInteger(rules.constellation.characterCoreCost) && rules.constellation.characterCoreCost > 0, "constellation.characterCoreCost 必須是正整數");
    assert(Number.isInteger(rules.constellation.baseResonanceCore) && rules.constellation.baseResonanceCore >= 0, "constellation.baseResonanceCore 必須是非負整數");
    assert(Number.isInteger(rules.constellation.resonanceCoreStep) && rules.constellation.resonanceCoreStep >= 0, "constellation.resonanceCoreStep 必須是非負整數");
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
        tickets: 3,
        starMarks: 0,
        echoPowder: 0,
        characterExp: 800,
        resonanceCore: 2
      },
      pity: {},
      selectedFeatured: {},
      collection: {},
      characterProgress: {},
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
        version: "1.0-1.5",
        selectedTeam: [],
        clearedStages: [],
        attempts: {},
        bestStage: 0,
        lastBattle: null
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
    state.resources = Object.assign(state.resources, isPlainObject(source.resources) ? source.resources : {});
    state.selectedFeatured = isPlainObject(source.selectedFeatured) ? source.selectedFeatured : {};
    state.collection = isPlainObject(source.collection) ? source.collection : {};
    state.characterProgress = isPlainObject(source.characterProgress) ? source.characterProgress : {};
    Object.keys(state.characterProgress).forEach(function (id) {
      var progress = isPlainObject(state.characterProgress[id]) ? state.characterProgress[id] : {};
      progress.level = Number.isInteger(progress.level) && progress.level >= 1 ? progress.level : 1;
      progress.affinity = Number.isInteger(progress.affinity) && progress.affinity >= 0 ? progress.affinity : 0;
      progress.constellation = Number.isInteger(progress.constellation) && progress.constellation >= 0 ? progress.constellation : 0;
      progress.constellationCore = Number.isInteger(progress.constellationCore) && progress.constellationCore >= 0 ? progress.constellationCore : 0;
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
    state.bannerExchanges = isPlainObject(source.bannerExchanges) ? source.bannerExchanges : {};
    state.totalPulls = Number.isInteger(source.totalPulls) && source.totalPulls >= 0 ? source.totalPulls : 0;
    state.history = Array.isArray(source.history) ? source.history.slice(-50) : [];

    ["starSand", "tickets", "starMarks", "echoPowder", "characterExp", "resonanceCore"].forEach(function (key) {
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
      if (banner.poolKey === "limited" && !state.selectedFeatured[banner.poolKey]) {
        var selected = source.selectedFeatured && (source.selectedFeatured[banner.poolKey] || source.selectedFeatured[banner.id]);
        selected = selected || banner.defaultFeaturedId;
        if (banner.featured4Stars.some(function (card) { return card.id === selected; })) {
          state.selectedFeatured[banner.poolKey] = selected;
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
    return { starSand: 0, starMarks: 0, echoPowder: 0, characterExp: 0, resonanceCore: 0, constellationCore: 0 };
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
    return Object.assign({ level: 1, affinity: 0, constellation: 0, constellationCore: 0 }, saved);
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
    var selectedId = this.state.selectedFeatured[banner.poolKey] || banner.defaultFeaturedId;
    return banner.featured4Stars.find(function (card) { return card.id === selectedId; }) || banner.featured4Stars[0];
  };

  GachaGame.prototype.selectFeatured = function (options) {
    options = options || {};
    var banner = this.getBanner(options.bannerId);
    assert(banner.poolKey === "limited", "常駐回音召集沒有可選精選角色");
    var selected = banner.featured4Stars.find(function (card) { return card.id === options.cardId; });
    assert(selected, "這隻角色不在目前卡池的可選限定 4★ 清單中");
    this.state.selectedFeatured[banner.poolKey] = selected.id;
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
    // resonanceCore 保留給舊存檔與管理端相容；角色命座只消耗各角色自己的 constellationCore。
    this.state.resources.resonanceCore += resourceReward.resonanceCore;

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
    assert(payment === "starSand" || payment === "ticket", "支付方式必須是 starSand 或 ticket");
    assert(payment !== "ticket" || count === 1, "共鳴券只能抵用單次召集");

    var cost = payment === "ticket" ? 0 : (count === 10 ? this.rules.tenCost : this.rules.singleCost);
    if (payment === "ticket") {
      assert(this.state.resources.tickets >= 1, "共鳴券不足");
      this.state.resources.tickets -= 1;
    } else {
      assert(this.state.resources.starSand >= cost, "星砂不足，需要 " + cost + " 星砂");
      this.state.resources.starSand -= cost;
    }

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
