"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { GachaGame, getFourStarRate } = require("../src/gacha.js");
const { banners, activeCards, futureCards, storyChapters, version3Cards, characterBattleStats } = require("../src/data.js");

test("現行卡池只開放文件 1.0–1.5，2.0 以後先保留", () => {
  assert.equal(activeCards.some((card) => card.releaseVersion === "2.0"), false);
  assert.equal(activeCards.every((card) => Number(card.releaseVersion) <= 1.5), true);
  assert.equal(futureCards.some((card) => card.releaseVersion === "2.0"), true);
  assert.equal(banners[0].featured4Stars.every((card) => Number(card.releaseVersion) <= 1.5), true);
});

test("後續角色都有完整立繪來源，但不會混入現行卡池", () => {
  assert.equal(activeCards.every((card) => card.portraitImage), true);
  assert.equal(futureCards.every((card) => card.portraitImage), true);
  assert.equal(activeCards.some((card) => card.id === "cenya"), false);
  assert.equal(version3Cards.some((card) => card.id === "cenya" && card.rarity === 3), true);
  assert.equal(Object.keys(characterBattleStats).includes("cenya"), true);
});

test("第三大版本 3.0–3.5 主線與支線都已建檔但保持鎖定", () => {
  const futureStory = storyChapters.filter((chapter) => Number(chapter.version) >= 3);
  assert.equal(futureStory.length, 12);
  assert.equal(futureStory.every((chapter) => chapter.releaseOpen === false && chapter.scenes.length === 3), true);
  assert.equal(futureStory.some((chapter) => chapter.id === "main-3-5"), true);
  assert.equal(futureStory.some((chapter) => chapter.id === "side-3-5-finale"), true);
});

function state(overrides) {
  return Object.assign({
    resources: { starSand: 100000, tickets: 3, starMarks: 0, echoPowder: 0 },
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
  assert.deepEqual(second.results[0].duplicateReward, { starSand: 50, starMarks: 1, echoPowder: 0, characterExp: 0, resonanceCore: 1 });
  assert.equal(second.state.resources.starMarks, 1);
  assert.equal(second.state.resources.starSand, 100000 - 160 * 2 + 50);
});

test("共鳴券只消耗券，不消耗星砂；精選兌換不改保底", () => {
  const gacha = game({
    state: state({ resources: { starSand: 0, tickets: 1, starMarks: 10, echoPowder: 0 } }),
    rng: () => 0.999999
  });
  const before = gacha.getPityStatus("limited-1-0-to-2-0");
  const ticketOutcome = gacha.pull({ bannerId: "limited-1-0-to-2-0", count: 1, payment: "ticket" });
  assert.equal(ticketOutcome.state.resources.tickets, 0);
  assert.equal(ticketOutcome.state.resources.starSand, 0);

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
