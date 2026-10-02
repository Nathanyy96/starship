"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { GachaGame } = require("../src/gacha.js");
const { banners, shopCatalog, voyageConfig } = require("../src/data.js");

const makeGame = (state, catalog = shopCatalog) => new GachaGame({ banners, state, shopCatalog: catalog, voyageConfig });
const richState = () => ({ resources: { starSand: 10000, starMarks: 0, characterExp: 150000 }, collection: { mave: 1 } });

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
  const id = shopCatalog.skins[0].id;
  assert.throws(() => game.equipSkin({ cardId: "mave", skinId: id }), /尚未擁有/);
  game.shopAction({ kind: "skin", id, payment: "starSand" });
  assert.equal(game.getState().resources.starSand, 7600);
  assert.throws(() => game.shopAction({ kind: "skin", id, payment: "starSand" }), /已擁有/);
  assert.throws(() => game.equipSkin({ cardId: "reyn", skinId: id }), /請先取得角色/);
  game.equipSkin({ cardId: "mave", skinId: id });
  assert.equal(makeGame(game.getState()).getState().cosmetics.equippedSkins.mave, id);
  game.equipSkin({ cardId: "mave", skinId: "" });
  assert.equal(game.getState().cosmetics.equippedSkins.mave, undefined);
});

test("unreleased character skin can be reserved without unlocking the character", () => {
  const game = makeGame(richState());
  const skin = shopCatalog.skins.find((item) => item.characterId === "harlow");
  game.shopAction({ kind: "skin", id: skin.id, payment: "starSand" });
  assert.ok(game.getState().cosmetics.skins[skin.id]);
  assert.equal(game.getState().collection.harlow, undefined);
  assert.throws(() => game.equipSkin({ cardId: "harlow", skinId: skin.id }), /請先取得角色/);
});
