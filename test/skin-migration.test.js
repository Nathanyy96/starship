"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { GachaGame } = require("../src/gacha.js");
const { banners, voyageConfig, shopCatalog } = require("../src/data.js");
const oldId = "skin-mave-luminous-archive";
const newId = "skin-mave-summer-beach-party";
const load = (state) => new GachaGame({ banners, voyageConfig, shopCatalog, state });

test("retired skin transfers ownership without changing player progress or allowing repeat rewards", () => {
  const unlock = { unlockedAt: "2026-09-01", source: "star-sea-voyage", ending: "special" };
  const input = { resources: { starSand: 8765, characterExp: 4321 }, collection: { mave: 3 },
    characterProgress: { mave: { level: 72, constellation: 2, affinity: 9 } },
    cosmetics: { skins: { [oldId]: unlock } },
    voyageProgress: { status: "complete", claimedRewards: { special: { claimedAt: "2026-09-01", skinId: oldId } },
      lastEnding: { id: "special", reward: { skinId: oldId } } } };
  const inputCopy = structuredClone(input);
  const first = load(input).getState();
  assert.deepEqual(input, inputCopy);
  assert.deepEqual(first.cosmetics.skins[newId], unlock);
  assert.equal(first.cosmetics.skins[oldId], undefined);
  assert.equal(first.voyageProgress.claimedRewards.special.skinId, newId);
  assert.equal(first.voyageProgress.lastEnding.reward.skinId, newId);
  assert.equal(first.resources.starSand, 8765);
  assert.equal(first.resources.characterExp, 4321);
  assert.equal(first.collection.mave, 3);
  assert.equal(first.characterProgress.mave.level, 72);
  assert.equal(first.characterProgress.mave.constellation, 2);
  assert.deepEqual(load(first).getState(), first);
});

test("existing summer ownership is preserved and claim-only legacy ownership can recover", () => {
  const newer = { unlockedAt: "2026-09-20", source: "existing-summer" };
  const both = load({ cosmetics: { skins: { [oldId]: { unlockedAt: "old" }, [newId]: newer } } }).getState();
  assert.deepEqual(both.cosmetics.skins[newId], newer);
  const recovered = load({ voyageProgress: { claimedRewards: { special: { claimedAt: "2026-09-01", skinId: oldId } } } }).getState();
  assert.equal(recovered.cosmetics.skins[newId].unlockedAt, "2026-09-01");
  assert.equal(load({}).getState().cosmetics.skins[newId], undefined);
});

test("special ending grants resources once and no longer grants a free skin", () => {
  const game = load({ collection: { mave: 1, reyn: 1 }, voyageProgress: { flags: { harmonized: true } } });
  assert.equal(game._finishVoyage(["mave", "reyn"]).reward.skinId, null);
  const sand = game.getState().resources.starSand;
  assert.equal(game._finishVoyage(["mave", "reyn"]).alreadyClaimed, true);
  assert.equal(game.getState().resources.starSand, sand);
  assert.equal(game.getState().cosmetics.skins[newId], undefined);
  assert.equal(voyageConfig.seasonSkin.id, newId);
  assert.deepEqual(voyageConfig.seasonSkins.map(s => s.id), [newId, "skin-harlow-summer-beach-party"]);
  for (const skin of voyageConfig.seasonSkins) assert.ok(fs.existsSync(path.resolve(__dirname, "..", skin.previewImage)));
  assert.equal(fs.existsSync(path.resolve(__dirname, "../assets/cards/skins/mave-luminous-archive.png")), false);
});
