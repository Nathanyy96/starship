"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const crypto = require("node:crypto");
const serverData = require("../src/data.js");

const root = path.resolve(__dirname, "..");

function browserData() {
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const scripts = [...html.matchAll(/<script\s+src="\.\/([^"]+)"/g)].map((match) => match[1].split("?")[0]);
  const dataIndex = scripts.indexOf("src/data.js");
  assert.ok(dataIndex > 0, "正式頁面必須載入資料模組");
  const context = vm.createContext({ console });
  scripts.slice(0, dataIndex + 1).forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context, { filename: file, timeout: 5000 });
  });
  return context.StarshipGachaData;
}

function publishedSignature(data) {
  return Array.from(data.storyChapters, (chapter) => ({
    id: chapter.id,
    title: chapter.title,
    scenes: Array.from(chapter.scenes, (scene) => ({
      id: scene.id,
      textHash: crypto.createHash("sha256").update(String(scene.body || "")).digest("hex")
    }))
  }));
}

test("正式網頁與伺服器的 1.0 角色及劇情正文一致", () => {
  const browser = browserData();
  assert.deepEqual(Array.from(browser.activeCards, (card) => card.id), serverData.activeCards.map((card) => card.id));
  assert.deepEqual(publishedSignature(browser), publishedSignature(serverData));
  assert.deepEqual(serverData.storyChapters.map((chapter) => chapter.id), ["main-1-0"]);
});
