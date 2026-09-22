import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { activeCards, futureCards, version3Cards } = require("../src/data.js");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(root, "assets", "cards", "complete");

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function portraitSvg(card) {
  const source = path.basename(card.image);
  const stars = "★".repeat(card.rarity);
  const name = escapeXml(card.name);
  const romanized = escapeXml(card.romanizedName);
  const element = escapeXml(card.element);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536" role="img" aria-labelledby="portrait-title portrait-description" data-character-id="${escapeXml(card.id)}">
  <title id="portrait-title">${name}</title>
  <desc id="portrait-description">${name} ${stars} ${element} · ${romanized}</desc>
  <image href="../${source}" x="0" y="0" width="1024" height="1536" preserveAspectRatio="xMidYMid meet"/>
</svg>
`;
}

const uniqueCards = new Map();
[...activeCards, ...futureCards, ...version3Cards].forEach((card) => {
  if (card && card.image) uniqueCards.set(card.id, card);
});
fs.mkdirSync(outputDir, { recursive: true });
for (const card of uniqueCards.values()) {
  fs.writeFileSync(path.join(outputDir, `${card.id}.svg`), portraitSvg(card), "utf8");
}
console.log(`generated ${uniqueCards.size} complete portraits in ${path.relative(root, outputDir)}`);
