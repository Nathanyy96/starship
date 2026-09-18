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
  const accent = escapeXml(card.accent || "#9e92ff");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1024 1536" role="img" aria-label="${name} ${stars} ${element}">
  <rect width="1024" height="1536" fill="#080d22"/>
  <image href="../${source}" x="0" y="0" width="1024" height="1536" preserveAspectRatio="xMidYMid meet"/>
  <defs>
    <linearGradient id="labelGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#05091a" stop-opacity=".94"/>
      <stop offset="1" stop-color="${accent}" stop-opacity=".58"/>
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000" flood-opacity=".8"/>
    </filter>
  </defs>
  <g transform="translate(38 38)" filter="url(#softShadow)">
    <rect x="0" y="0" width="360" height="206" rx="24" fill="url(#labelGradient)" stroke="#e5edff" stroke-opacity=".46"/>
    <text x="30" y="55" fill="#d9faff" font-family="Noto Sans TC, Microsoft JhengHei, sans-serif" font-size="22" font-weight="700" letter-spacing="5">STAR-LAW</text>
    <text x="30" y="112" fill="#ffffff" font-family="Noto Sans TC, Microsoft JhengHei, sans-serif" font-size="39" font-weight="800">${name}</text>
    <text x="30" y="151" fill="#ffe5a4" font-family="Noto Sans TC, Microsoft JhengHei, sans-serif" font-size="27" font-weight="800" letter-spacing="3">${stars}</text>
    <rect x="184" y="126" width="136" height="48" rx="20" fill="#071329" fill-opacity=".65" stroke="#d6e7ff" stroke-opacity=".5"/>
    <text x="252" y="159" text-anchor="middle" fill="#e9faff" font-family="Noto Sans TC, Microsoft JhengHei, sans-serif" font-size="22" font-weight="800">${element}</text>
    <text x="30" y="188" fill="#c6d3ed" font-family="Segoe UI, sans-serif" font-size="15" letter-spacing="2">${romanized}</text>
  </g>
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
