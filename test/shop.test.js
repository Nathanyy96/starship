"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { GachaGame } = require("../src/gacha.js");
const { banners, shopCatalog, voyageConfig } = require("../src/data.js");

const makeGame = (state, catalog = shopCatalog) => new GachaGame({ banners, state, shopCatalog: catalog, voyageConfig });
const richState = () => ({ resources: { starSand: 10000, starMarks: 0, characterExp: 150000 }, collection: { mave: 1, celesia: 1 } });

test("shop material supports either payment, tracks inventory and enforces a shared seasonal limit", () => {
  const game = makeGame(richState());
  const id = shopCatalog.materials[0].id;
  game.shopAction({ kind: "material", id, payment: "starSand" });
  game.shopAction({ kind: "material", id, payment: "characterExp" });
  assert.equal(game.getState().breakthroughMaterials[id], 2);
  assert.equal(game.getState().resources.starSand, 9520);
  assert.equal(game.getState().resources.characterExp, 138000);
  for (let i = 2; i < 6; i++) game.shopAction({ kind: "material", id, payment: "starSand" });
  assert.throws(() => game.shopAction({ kind: "material", id, payment: "characterExp" }), /上限/);
  assert.equal(makeGame(game.getState()).getState().shopProgress.purchases[id], 6);
});

test("shop conversion loses value in a round trip and exp-to-sand has a seasonal cap", () => {
  const game = makeGame(richState());
  game.shopAction({ kind: "conversion", id: "sand-to-exp" });
  game.shopAction({ kind: "conversion", id: "exp-to-sand" });
  assert.equal(game.getState().resources.starSand, 9920);
  assert.equal(game.getState().resources.characterExp, 147000);
  for (let i = 1; i < 20; i++) game.shopAction({ kind: "conversion", id: "exp-to-sand" });
  assert.throws(() => game.shopAction({ kind: "conversion", id: "exp-to-sand" }), /上限/);
  const next = structuredClone(shopCatalog); next.version = "next-season";
  assert.equal(makeGame(game.getState(), next).shopAction({ kind: "conversion", id: "exp-to-sand" }).state.shopProgress.conversions["exp-to-sand"], 1);
});

test("skin is bought once, stays owned, and only its character may equip it", () => {
  const game = makeGame(richState());
  const id = shopCatalog.skins.find(item => item.characterId === "celesia").id;
  assert.throws(() => game.equipSkin({ cardId: "celesia", skinId: id }), /尚未擁有/);
  game.shopAction({ kind: "skin", id, payment: "starSand" });
  assert.equal(game.getState().resources.starSand, 7600);
  assert.throws(() => game.shopAction({ kind: "skin", id, payment: "starSand" }), /已擁有/);
  assert.throws(() => game.equipSkin({ cardId: "reyn", skinId: id }), /請先取得角色/);
  game.equipSkin({ cardId: "celesia", skinId: id });
  assert.equal(makeGame(game.getState()).getState().cosmetics.equippedSkins.celesia, id);
  game.equipSkin({ cardId: "celesia", skinId: "" });
  assert.equal(game.getState().cosmetics.equippedSkins.celesia, undefined);
});

test("Mave and Harlow skins cannot be purchased; existing unlocks remain usable", () => {
  const game = makeGame(richState());
  const before = game.getState();
  for (const characterId of ["mave", "harlow"]) {
    const skin = shopCatalog.skins.find(item => item.characterId === characterId);
    assert.equal(skin.forSale, false);
    assert.throws(() => game.shopAction({ kind: "skin", id: skin.id, payment: "starSand" }), /尚未開放販售/);
  }
  assert.deepEqual(game.getState().resources, before.resources);
  assert.deepEqual(game.getState().cosmetics, before.cosmetics);
  const owned = richState();
  const id = shopCatalog.skins.find(item => item.characterId === "mave").id;
  owned.cosmetics = { skins: { [id]: { source: "previous-purchase" } } };
  const legacy = makeGame(owned);
  legacy.equipSkin({ cardId: "mave", skinId: id });
  assert.ok(legacy.getState().cosmetics.skins[id]);
  assert.equal(legacy.getState().cosmetics.equippedSkins.mave, id);
});

test("five new catalog outfits have art, cost 2400 sand, and equip only on their owner", () => {
  const ids = ["celesia", "chodan", "magenta", "hina", "siyeon"];
  for (const characterId of ids) {
    const skin = shopCatalog.skins.find((item) => item.characterId === characterId);
    assert.ok(skin, characterId);
    assert.equal(skin.sandCost, 2400);
    assert.ok(fs.existsSync(path.resolve(__dirname, "..", skin.image)));
    const game = makeGame({ resources: { starSand: 3000 }, collection: { [characterId]: 1 } });
    game.shopAction({ kind: "skin", id: skin.id, payment: "starSand" });
    game.equipSkin({ cardId: characterId, skinId: skin.id });
    assert.equal(game.getState().cosmetics.equippedSkins[characterId], skin.id);
  }
});
