"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { GachaGame, getFourStarRate } = require("../src/gacha.js");
const { banners, activeCards, futureCards, storyChapters, version2Cards, version3Cards, version4Cards, version5Cards, characterBattleStats, characterAnimations, dispatchMissions, bossStages, bossMaxRewards, characterBreakthroughs, updateReward, tutorialSteps, tutorialReward, announcements, trialReward, voyageConfig, voyageBattleStages, petDefinitions, petOutfits, petEffects, petChallenges, talentRules, talentDefinitions, northernMythArc } = require("../src/data.js");

test("現行資料開放 1.0–2.5，3.0 以後先保留", () => {
  assert.equal(activeCards.some((card) => card.releaseVersion === "2.0"), true);
  assert.equal(activeCards.every((card) => Number(card.releaseVersion) <= 2.5), true);
  assert.equal(futureCards.some((card) => card.releaseVersion === "3.0"), true);
  assert.equal(banners[0].featured4Stars.every((card) => Number(card.releaseVersion) <= 1.5), true);
  const updateBanner = banners.find((banner) => banner.id === "limited-2-0-to-2-5");
  assert.ok(updateBanner);
  assert.equal(updateBanner.active !== false, true);
  assert.equal(updateBanner.featured4Stars.every((card) => Number(card.releaseVersion) >= 2 && Number(card.releaseVersion) <= 2.5), true);
  assert.equal(version2Cards.length, 8);
  assert.equal(updateReward.starSand, 3200);
  const earlyBanner = banners.find((banner) => banner.id === "limited-1-0-to-2-0");
  const updateBannerForPool = banners.find((banner) => banner.id === "limited-2-0-to-2-5");
  assert.equal(earlyBanner.standard4Stars.every((card) => Number(card.releaseVersion) <= 1.5), true);
  assert.equal(updateBannerForPool.standard4Stars.every((card) => Number(card.releaseVersion) >= 2 && Number(card.releaseVersion) <= 2.5), true);
  assert.equal(earlyBanner.standard3Stars.some((card) => card.id === "maro"), true);
  assert.equal(updateBannerForPool.standard3Stars.some((card) => card.id === "reyn"), true);
});

test("後續角色都有完整立繪來源，但不會混入現行卡池", () => {
  assert.equal(activeCards.every((card) => card.portraitImage), true);
  assert.equal(futureCards.every((card) => card.portraitImage), true);
  assert.equal(activeCards.some((card) => card.id === "cenya"), false);
  assert.equal(version3Cards.some((card) => card.id === "cenya" && card.rarity === 3), true);
  assert.equal(version4Cards.every((card) => card.portraitImage), true);
  assert.equal(Object.keys(characterBattleStats).includes("cenya"), true);
});

test("角色規劃完整建檔至 5.5，但玩家入口仍只開放 1.0–2.5", () => {
  assert.equal(version5Cards.length, 7);
  assert.equal(version5Cards.filter((card) => card.rarity === 4).length >= 1, true);
  assert.equal(version5Cards.some((card) => card.rarity === 3), true);
  assert.equal(version5Cards.every((card) => Number(card.releaseVersion) >= 5 && Number(card.releaseVersion) <= 5.5), true);
  assert.equal(version5Cards.every((card) => card.portraitImage && characterBattleStats[card.id]), true);
  assert.equal(futureCards.some((card) => card.id === "daria" && card.releaseVersion === "5.5"), true);
  assert.equal(activeCards.every((card) => Number(card.releaseVersion) <= 2.5), true);
});

test("1.0–1.5 角色動畫素材已依角色 id 接入", () => {
  const animationIds = Object.keys(characterAnimations);
  assert.equal(animationIds.length, 14);
  assert.equal(characterAnimations.celesia.src, "./video/astralyn-1.0-1.5/celesia_5s.mp4");
  assert.equal(characterAnimations.mave.durationSeconds, 5);
  assert.equal(animationIds.every((id) => activeCards.some((card) => card.id === id)), true);
});

test("1.0–2.5 劇情完整開放，3.0–5.5 主線與支線都已建檔但保持鎖定", () => {
  const liveStory = storyChapters.filter((chapter) => Number(chapter.version) <= 2.5);
  const futureStory = storyChapters.filter((chapter) => Number(chapter.version) >= 3);
  assert.equal(liveStory.length, 25);
  assert.equal(liveStory.every((chapter) => chapter.releaseOpen !== false && chapter.scenes.length >= 3 && chapter.scenes.every((scene) => scene.body)), true);
  assert.equal(liveStory.every((chapter) => chapter.scenes.every((scene) => String(scene.body).trim().length >= 20)), true);
  assert.equal(liveStory.filter((chapter) => chapter.fullBody).every((chapter) => Number(chapter.fullBody.length) > 800), true);
  assert.equal(liveStory.find((chapter) => chapter.id === "main-2.1").sourceStatus, "document-tab-missing");
  assert.equal(liveStory.every((chapter) => chapter.scenes.every((scene) => typeof scene.id === "string" && scene.id.length > 0)), true);
  const firstChapter = liveStory.find((chapter) => chapter.id === "main-1-0");
  assert.equal(firstChapter.scenes[3].title, "第四幕｜有人守著的背後");
  assert.equal(firstChapter.scenes[4].title, "北門以後");
  const mirrorChapter = liveStory.find((chapter) => chapter.id === "main-2.1");
  assert.equal(mirrorChapter.scenes.length, 4);
  assert.equal(mirrorChapter.scenes.at(-1).id, "mirror-choice");
  assert.equal(mirrorChapter.scenes.reduce((total, scene) => total + scene.body.length, 0) > 1000, true);
  assert.equal(storyChapters.find((chapter) => chapter.id === "main-2.4").fullBody.includes("附錄｜"), false);
  assert.equal(storyChapters.find((chapter) => chapter.id === "main-2.5").scenes.length, 3);
  assert.equal(storyChapters.find((chapter) => chapter.id === "main-2.5").fullBody.includes("見證人的空白"), false);
  assert.equal(storyChapters.find((chapter) => chapter.id === "main-2.5").fullBody.includes("角色圖鑑｜第三大版本"), false);
  assert.equal(futureStory.length, 36);
  assert.equal(futureStory.every((chapter) => chapter.releaseOpen === false && chapter.scenes.length === 3), true);
  assert.equal(futureStory.some((chapter) => chapter.id === "main-3-5"), true);
  assert.equal(futureStory.some((chapter) => chapter.id === "side-3-5-finale"), true);
  assert.equal(futureStory.some((chapter) => chapter.id === "main-4.5"), true);
  assert.equal(futureStory.some((chapter) => chapter.id === "main-5.5"), true);
  assert.equal(futureStory.filter((chapter) => Number(chapter.version) >= 5).every((chapter) => chapter.mythicArc === "northern-myth-arc"), true);
  assert.equal(storyChapters.every((chapter) => chapter.narrativeGuide), true);
  assert.equal(futureStory.filter((chapter) => chapter.type === "main").every((chapter) => chapter.scenes.every((scene) => scene.body.length >= 100)), true);
  assert.equal(futureStory.filter((chapter) => chapter.type === "main").every((chapter) => chapter.characters.includes("celesia")), true);
});

test("4.0 起接入原創北境神話篇，且不改動 3.0–3.5 的主題", () => {
  assert.equal(northernMythArc.startingVersion, "4.0");
  assert.equal(Object.keys(northernMythArc.versions).length, 12);
  assert.equal(version4Cards.length > 0, true);
  assert.equal(storyChapters.filter((chapter) => Number(chapter.version) >= 4 && chapter.mythicArc === northernMythArc.id).length, 24);
  assert.equal(storyChapters.filter((chapter) => Number(chapter.version) >= 3 && Number(chapter.version) < 4).some((chapter) => chapter.mythicArc), false);
});

test("星港委託提供額外玩法與非抽卡獎勵", () => {
  assert.equal(dispatchMissions.length, 3);
  assert.equal(dispatchMissions.every((mission) => mission.enemies.length > 0 && mission.reward.starSand > 0), true);
});

test("Boss 依角色分組提供 80 等突破材料，現行上限是 90 並預留 100 等", () => {
  const { DEFAULT_RULES } = require("../src/gacha.js");
  assert.equal(DEFAULT_RULES.development.maxLevel, 90);
  assert.equal(DEFAULT_RULES.development.breakthroughLevel, 80);
  assert.equal(DEFAULT_RULES.development.futureMaxLevel, 100);
  assert.equal(bossStages.length, 6);
  assert.equal(bossMaxRewards, 10);
  assert.equal(activeCards.every((card) => characterBreakthroughs[card.id] && characterBreakthroughs[card.id].bossId), true);
  assert.equal(new Set(activeCards.map((card) => characterBreakthroughs[card.id].bossId)).size >= 4, true);
  assert.equal(characterBreakthroughs.celesia.cost, 4);
  assert.equal(characterBreakthroughs.reyn.cost, 3);
  assert.deepEqual(bossStages.map((stage) => stage.bossLevel), [1, 1, 2, 2, 3, 3]);
  assert.equal(Math.max(...bossStages.map((stage) => stage.bossLevel)), 3);
  assert.ok(bossStages.every((stage) => stage.reward.universalAmount >= 1));
});

test("通用突破印記可以讓玩家不用被指定高難度 Boss 卡住", () => {
  const gacha = game({
    breakthroughRequirements: characterBreakthroughs,
    state: state({
      resources: { starSand: 100000, starMarks: 0, echoPowder: 0, characterExp: 100000 },
      collection: { celesia: 1 },
      characterProgress: { celesia: { level: 80, affinity: 0, constellation: 0, constellationCore: 0, breakthrough: false } },
      breakthroughMaterials: { "universal-core": 4 }
    })
  });
  const result = gacha.breakthroughCharacter({ cardId: "celesia" });
  assert.equal(result.cost.universalUsed, 4);
  assert.equal(result.state.breakthroughMaterials["universal-core"], 0);
  assert.equal(result.progress.breakthrough, true);
});

test("星海迷航、星伴培育與後續天賦資料已接入且資源彼此分離", () => {
  assert.equal(voyageConfig.routes.length, 3);
  assert.ok(voyageConfig.endingRewards.hidden && voyageConfig.endingRewards.special.skinId);
  assert.equal(voyageConfig.seasonSkins.length, 3);
  assert.equal(voyageConfig.seasonSkins[1].id, "skin-mave-summer-beach-party");
  assert.equal(voyageConfig.seasonSkins[1].characterId, "mave");
  assert.equal(voyageConfig.seasonSkins[2].id, "skin-harlow-summer-beach-party");
  assert.equal(voyageConfig.seasonSkins[2].characterId, "harlow");
  assert.equal(voyageConfig.seasonSkins[2].rarity, 4);
  assert.equal(petDefinitions.length, 7);
  assert.equal(petDefinitions.every((pet) => typeof pet.image === "string" && pet.image.indexOf("./assets/pets/") === 0 && pet.image.endsWith(".png")), true);
  assert.equal(voyageBattleStages.length, 3);
  assert.ok(petDefinitions.some((pet) => pet.id === "rune-drake" && pet.description.length > 20));
  assert.ok(petOutfits.length >= 8 && petEffects.length >= 8);
  assert.equal(petChallenges.length, 3);
  assert.deepEqual(petChallenges.map((challenge) => challenge.cost), ["petToys", "petFood", "petTokens"]);
  assert.equal(talentRules.maxLevel, 5);
  assert.equal(talentRules.totalBonusCap, 0.10);
  assert.equal(talentDefinitions.celesia.length, 3);
  const gacha = game({
    voyageConfig,
    petDefinitions,
    petOutfits,
    petEffects,
    petChallenges,
    state: state({ resources: { starSand: 100000, starMarks: 0, echoPowder: 0, characterExp: 100000 }, collection: { celesia: 1, reyn: 1 } })
  });
  const start = gacha.startVoyage({ routeId: "route-echo", team: ["celesia", "reyn"] });
  assert.equal(start.node.id, "voyage-start");
  const next = gacha.advanceVoyage({ nodeId: "voyage-start", team: ["celesia", "reyn"] });
  assert.equal(next.nextNode.id, "voyage-combat-1");
  const pet = gacha.petAction({ action: "feed", petId: "star-fox" });
  assert.equal(pet.state.resources.characterExp, 100000);
  assert.equal(pet.state.petProgress.resources.petFood, 5);
  const leveled = gacha.petAction({ action: "play", petId: "star-fox" });
  const trained = gacha.petAction({ action: "train", petId: "star-fox", focus: "care" });
  assert.equal(trained.reward.levelUps, 1);
  assert.equal(trained.pet.level, 2);
  const challenge = gacha.petAction({ action: "challenge", petId: "star-fox", challengeId: "starlight-run" });
  assert.equal(challenge.reward.challengeName, "星光追逐");
  assert.equal(challenge.state.petProgress.daily.challengeCount, 1);
});

test("新手教學包含核心玩法並且獎勵只會發放一次", () => {
  assert.equal(tutorialSteps.length >= 7, true);
  assert.equal(tutorialSteps.some((step) => step.id === "story"), true);
  assert.equal(tutorialSteps.some((step) => step.id === "trial"), true);
  assert.equal(announcements.length >= 3, true);
  assert.equal(announcements.some((item) => item.id === "tutorial-launch"), true);
  const gacha = game();
  const before = gacha.getState().resources;
  const first = gacha.completeTutorial({ version: "2.0-2.5", reward: tutorialReward });
  assert.equal(first.alreadyClaimed, false);
  assert.equal(first.reward.starSand, tutorialReward.starSand);
  assert.equal(first.reward.characterExp, tutorialReward.characterExp);
  assert.equal(first.state.tutorialProgress.rewardClaimed, true);
  assert.equal(first.state.resources.starSand, before.starSand + tutorialReward.starSand);
  const second = gacha.completeTutorial({ version: "2.0-2.5", reward: tutorialReward });
  assert.equal(second.alreadyClaimed, true);
  assert.equal(second.state.resources.starSand, first.state.resources.starSand);
  assert.equal(Object.prototype.hasOwnProperty.call(second.state.resources, "tickets"), false);
});

test("星律隱藏測試補給會寫入帳號且只可領取一次", () => {
  const gacha = game();
  const before = gacha.getState().resources;
  const first = gacha.claimStarLawTestReward();
  assert.equal(first.alreadyClaimed, false);
  assert.equal(first.reward.starSand, 100000);
  assert.equal(first.reward.characterExp, 1000000);
  assert.equal(first.state.resources.starSand, before.starSand + 100000);
  assert.equal(first.state.resources.characterExp, before.characterExp + 1000000);
  assert.equal(first.state.testRewards.starLawSupplyClaimed, true);
  const second = gacha.claimStarLawTestReward();
  assert.equal(second.alreadyClaimed, true);
  assert.equal(second.state.resources.starSand, first.state.resources.starSand);
  assert.equal(second.state.resources.characterExp, first.state.resources.characterExp);
});

test("版本遷移保留角色、等級、命座晶核與已完成劇情", () => {
  const migrated = game({
    state: state({
      collection: { celesia: 2, lia: 5 },
      characterProgress: {
        celesia: { level: 28, affinity: 12, constellation: 1, constellationCore: 1 },
        lia: { level: 41, affinity: 22, constellation: 4, constellationCore: 4 }
      },
      storyProgress: { currentChapter: "main-1-5", completedScenes: { "main-1-0:scene-1": { starSand: 100 } } },
      trialProgress: { version: "1.0-1.5", clearedStages: [1, 2], attempts: { 1: 1 }, bestStage: 2 }
    })
  }).getState();
  assert.deepEqual(migrated.collection, { celesia: 2, lia: 5 });
  assert.deepEqual(migrated.characterProgress.celesia, { level: 28, affinity: 12, constellation: 1, constellationCore: 1, breakthrough: false });
  assert.deepEqual(migrated.characterProgress.lia, { level: 41, affinity: 22, constellation: 4, constellationCore: 4, breakthrough: false });
  assert.ok(migrated.storyProgress.completedScenes["main-1-0:scene-1"]);
  assert.equal(migrated.trialProgress.version, "1.0-1.5");
});

function state(overrides) {
  return Object.assign({
    resources: { starSand: 100000, starMarks: 0, echoPowder: 0 },
    pity: {
      limited: { pullsSince4Star: 0, guaranteedFeatured: false },
      standard: { pullsSince4Star: 0, guaranteedFeatured: false }
    },
    collection: {},
    bannerExchanges: {},
    totalPulls: 0,
    history: []
  }, overrides || {});
}

function game(options) {
  return new GachaGame(Object.assign({
    banners,
    state: state(),
    rng: () => 0,
    now: () => "2026-09-16T00:00:00.000Z"
  }, options || {}));
}

test("角色到 80 等後必須消耗指定 Boss 材料，突破後才能升到 90 等", () => {
  const gacha = game({
    breakthroughRequirements: characterBreakthroughs,
    state: state({
      resources: { starSand: 100000, starMarks: 0, echoPowder: 0, characterExp: 100000 },
      collection: { celesia: 1 },
      characterProgress: { celesia: { level: 80, affinity: 0, constellation: 0, constellationCore: 0, breakthrough: false } },
      breakthroughMaterials: { "star-crest": 4 }
    })
  });
  assert.throws(() => gacha.developCharacter({ cardId: "celesia" }), /請先到 Boss 選單/);
  const breakthrough = gacha.breakthroughCharacter({ cardId: "celesia" });
  assert.equal(breakthrough.progress.breakthrough, true);
  assert.equal(breakthrough.state.breakthroughMaterials["star-crest"], 0);
  const levelUp = gacha.developCharacter({ cardId: "celesia" });
  assert.equal(levelUp.progress.level, 81);
  const atNinety = levelUp.state;
  atNinety.characterProgress.celesia.level = 90;
  assert.throws(() => game({ breakthroughRequirements: characterBreakthroughs, state: atNinety }).developCharacter({ cardId: "celesia" }), /最高等級/);
});

test("現行保底機率是前 20 抽 0%、21 抽 10%、每抽 +4%、50 抽 100%", () => {
  assert.equal(getFourStarRate(1), 0);
  assert.equal(getFourStarRate(20), 0);
  assert.equal(getFourStarRate(21), 0.10);
  assert.equal(getFourStarRate(22), 0.14);
  assert.equal(getFourStarRate(49), 0.99);
  assert.equal(getFourStarRate(50), 1);
  assert.equal(getFourStarRate(99), 1);
});

test("三星與一般回響共用非 4★ 結果，不另開三星卡池", () => {
  const threeStar = game({ rng: () => 0 });
  const threeStarOutcome = threeStar.pull({ bannerId: "limited-1-0-to-2-0", count: 1 });
  assert.equal(threeStarOutcome.results[0].rarity, 3);
  assert.equal(Number(threeStarOutcome.results[0].card.releaseVersion) <= 1.5, true);

  const resource = game({ rng: () => 0.999999 });
  const resourceOutcome = resource.pull({ bannerId: "limited-1-0-to-2-0", count: 1 });
  assert.equal(resourceOutcome.results[0].kind, "resource");
  assert.equal(resourceOutcome.results[0].rarity, 0);
  assert.equal(resourceOutcome.results[0].resourceReward.echoPowder, 1);
  assert.equal(resourceOutcome.state.resources.echoPowder, 1);
});

test("前 20 抽不會出 4★，第 21 抽才開始判定", () => {
  const gacha = game({ rng: () => 0 });
  for (let i = 0; i < 2; i += 1) {
    const outcome = gacha.pull({ bannerId: "limited-1-0-to-2-0", count: 10 });
    assert.equal(outcome.summary.fourStar, 0);
  }
  assert.equal(gacha.getPityStatus("limited-1-0-to-2-0").pullsSince4Star, 20);

  const outcome = gacha.pull({ bannerId: "limited-1-0-to-2-0", count: 1 });
  assert.equal(outcome.results[0].rarity, 4);
  assert.equal(outcome.results[0].pityPullNumber, 21);
  assert.equal(outcome.results[0].fourStarRate, 0.10);
  assert.equal(outcome.pity.pullsSince4Star, 0);
});

test("連續壓低隨機值時，第 50 抽仍然是硬保底", () => {
  const gacha = game({ rng: () => 0.999999 });
  for (let i = 0; i < 4; i += 1) {
    gacha.pull({ bannerId: "limited-1-0-to-2-0", count: 10 });
  }
  const finalTen = gacha.pull({ bannerId: "limited-1-0-to-2-0", count: 10 });
  assert.equal(finalTen.results.slice(0, 9).every((item) => item.kind === "resource"), true);
  assert.equal(finalTen.results[9].rarity, 4);
  assert.equal(finalTen.results[9].isHardPity, true);
  assert.equal(finalTen.results[9].pityPullNumber, 50);
  assert.equal(finalTen.pity.pullsSince4Star, 0);
});

test("十連逐格抽取，4★ 可以出現在第 1 格而不是被藏到最後", () => {
  const initial = state({ pity: { limited: { pullsSince4Star: 20, guaranteedFeatured: false } } });
  const gacha = game({ state: initial, rng: () => 0 });
  const outcome = gacha.pull({ bannerId: "limited-1-0-to-2-0", count: 10 });
  assert.equal(outcome.results[0].rarity, 4);
  assert.equal(outcome.results[0].pityPullNumber, 21);
  assert.equal(outcome.summary.fourStar, 1);
});

test("復刻尚未開放，限定與常駐仍各自保留計數", () => {
  const initial = state({
    pity: {
      limited: { pullsSince4Star: 17, guaranteedFeatured: true },
      standard: { pullsSince4Star: 4, guaranteedFeatured: false }
    }
  });
  const gacha = game({ state: initial });
  assert.equal(gacha.getPityStatus("limited-1-0-to-2-0").pullsSince4Star, 17);
  assert.throws(() => gacha.getPityStatus("rerun-1-0-to-2-0"), /未開放/);
  assert.equal(gacha.getPityStatus("standard-echo").pullsSince4Star, 4);
});

test("限定池歪掉後，下一張 4★ 必定是精選", () => {
  const first = game({
    state: state({ pity: { limited: { pullsSince4Star: 49, guaranteedFeatured: false } } }),
    rng: () => 0.99
  }).pull({ bannerId: "limited-1-0-to-2-0", count: 1 });
  assert.equal(first.results[0].rarity, 4);
  assert.equal(first.results[0].featured, false);
  assert.equal(first.state.pity.limited.guaranteedFeatured, true);

  const savedForNextFourStar = first.state;
  savedForNextFourStar.pity.limited.pullsSince4Star = 49;
  const next = game({ state: savedForNextFourStar, rng: () => 0 }).pull({ bannerId: "limited-1-0-to-2-0", count: 1 });
  assert.equal(next.results[0].rarity, 4);
  assert.equal(next.results[0].featured, true);
  assert.equal(next.results[0].card.id, "celesia");
  assert.equal(next.state.pity.limited.guaranteedFeatured, false);
});

test("重複角色轉換成文件指定的資源", () => {
  const first = game({
    state: state({ pity: { limited: { pullsSince4Star: 20, guaranteedFeatured: false } } }),
    rng: () => 0
  }).pull({ bannerId: "limited-1-0-to-2-0", count: 1 });
  assert.equal(first.results[0].isFirstAcquisition, true);

  const secondState = first.state;
  secondState.pity.limited.pullsSince4Star = 20;
  const second = game({ state: secondState, rng: () => 0 }).pull({ bannerId: "limited-1-0-to-2-0", count: 1 });
  assert.equal(second.results[0].isFirstAcquisition, false);
  assert.deepEqual(second.results[0].duplicateReward, { starSand: 50, starMarks: 1, echoPowder: 0, characterExp: 240, constellationCore: 1, petFood: 0, petToys: 0, petTokens: 0, showcaseToken: 0, skinId: null });
  assert.equal(second.state.resources.starMarks, 1);
  assert.equal(second.state.resources.starSand, 100000 - 160 * 2 + 50);
  assert.equal(second.state.characterProgress.celesia.constellation, 1);
  assert.equal(second.state.characterProgress.celesia.constellationCore, 1);
});

test("舊存檔的五次莉亞會還原為四命，且可用個人晶核繼續提升", () => {
  const gacha = game({
    state: state({
      collection: { lia: 5 },
      characterProgress: {}
    })
  });
  const migrated = gacha.getState().characterProgress.lia;
  assert.equal(migrated.constellation, 4);
  assert.equal(migrated.constellationCore, 4);

  const enhanced = gacha.enhanceConstellation({ cardId: "lia" });
  assert.equal(enhanced.state.characterProgress.lia.constellation, 5);
  assert.equal(enhanced.state.characterProgress.lia.constellationCore, 3);
  assert.equal(Object.prototype.hasOwnProperty.call(enhanced.state.resources, "resonanceCore"), false);
});

test("舊共鳴券會按單抽等價轉成星砂，抽卡只使用星砂", () => {
  const gacha = game({
    state: state({ resources: { starSand: 0, tickets: 1, starMarks: 10, echoPowder: 0 } }),
    rng: () => 0.999999
  });
  assert.equal(gacha.getState().resources.starSand, 160);
  assert.equal(Object.prototype.hasOwnProperty.call(gacha.getState().resources, "tickets"), false);
  const before = gacha.getPityStatus("limited-1-0-to-2-0");
  const sandOutcome = gacha.pull({ bannerId: "limited-1-0-to-2-0", count: 1, payment: "starSand" });
  assert.equal(sandOutcome.state.resources.starSand, 0);
  assert.throws(() => gacha.pull({ bannerId: "limited-1-0-to-2-0", count: 1, payment: "ticket" }), /只使用星砂/);

  const exchanged = gacha.exchangeFeatured({ bannerId: "limited-1-0-to-2-0" });
  assert.equal(exchanged.card.id, "celesia");
  assert.equal(exchanged.state.resources.starMarks, 0);
  const after = gacha.getPityStatus("limited-1-0-to-2-0");
  assert.equal(after.bannerId, "limited-1-0-to-2-0");
  assert.equal(after.pullsSince4Star, before.pullsSince4Star + 1);
  assert.equal(after.currentFourStarRate, getFourStarRate(before.nextPullNumber + 1));
  assert.equal(after.currentFourStarRateText, "0%");
  assert.equal(after.pullsUntilHardPity, 49);
  assert.equal(after.guaranteedFeatured, false);
  assert.equal(after.selectedFeaturedId, "celesia");
  assert.throws(() => gacha.exchangeFeatured({ bannerId: "limited-1-0-to-2-0" }), /已使用/);
});

test("可從文件既有的 4★ 中選一隻，選中率是 55%", () => {
  const gacha = game({ rng: () => 0.54 });
  const selected = gacha.selectFeatured({ bannerId: "limited-1-0-to-2-0", cardId: "mave" });
  assert.equal(selected.card.id, "mave");
  assert.equal(gacha.getPityStatus("limited-1-0-to-2-0").selectedFeaturedId, "mave");

  const saved = gacha.getState();
  saved.pity.limited.pullsSince4Star = 49;
  const selectedHit = game({ state: saved, rng: () => 0.54 }).pull({ bannerId: "limited-1-0-to-2-0", count: 1 });
  assert.equal(selectedHit.results[0].rarity, 4);
  assert.equal(selectedHit.results[0].featured, true);
  assert.equal(selectedHit.results[0].card.id, "mave");
});
