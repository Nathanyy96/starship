import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("C:/Users/natha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
const { cards } = require("../src/data.js");
const portraitCards = Object.values(cards);

const root = process.cwd();
const cardsDir = path.join(root, "assets", "cards");
const generatedDir = path.join(cardsDir, "generated");
const completeDir = path.join(cardsDir, "complete");

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function stars(rarity) {
  return "★".repeat(Number(rarity)) + "☆".repeat(Math.max(0, 4 - Number(rarity)));
}

function portraitSvg(card, imageHref) {
  const accent = card.accent || "#86c8d7";
  const name = escapeXml(card.name);
  const romanizedName = escapeXml(card.romanizedName);
  const element = escapeXml(card.element);
  const rarity = escapeXml(stars(card.rarity));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1760" role="img" aria-label="${name} ${rarity} ${element}">
  <rect width="1024" height="1760" fill="#080d22"/>
  <image href="${imageHref}" x="0" y="0" width="1024" height="1536" preserveAspectRatio="xMidYMid meet"/>
  <defs>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="#000" flood-opacity=".8"/>
    </filter>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#05091a" stop-opacity=".96"/>
      <stop offset="1" stop-color="${escapeXml(accent)}" stop-opacity=".64"/>
    </linearGradient>
  </defs>
  <!-- Metadata sits in a footer outside the artwork; it never covers the face or body. -->
  <g transform="translate(38 1570)" filter="url(#softShadow)">
    <rect x="0" y="0" width="948" height="150" rx="24" fill="url(#panel)" stroke="#e5edff" stroke-opacity=".5"/>
    <text x="30" y="38" fill="#d9faff" font-family="Noto Sans TC, Microsoft JhengHei, sans-serif" font-size="20" font-weight="700" letter-spacing="4">STAR-LAW / PORTRAIT</text>
    <text x="30" y="91" fill="#ffffff" font-family="Noto Sans TC, Microsoft JhengHei, sans-serif" font-size="38" font-weight="800">${name}</text>
    <text x="30" y="126" fill="#ffe5a4" font-family="Noto Sans TC, Microsoft JhengHei, sans-serif" font-size="25" font-weight="800" letter-spacing="3">${rarity}</text>
    <text x="250" y="126" fill="#c6d3ed" font-family="Segoe UI, sans-serif" font-size="18" letter-spacing="2">${romanizedName}</text>
    <rect x="790" y="47" width="128" height="52" rx="22" fill="#071329" fill-opacity=".72" stroke="#d6e7ff" stroke-opacity=".55"/>
    <text x="854" y="81" text-anchor="middle" fill="#e9faff" font-family="Noto Sans TC, Microsoft JhengHei, sans-serif" font-size="22" font-weight="800">${element}</text>
  </g>
</svg>
`;
}

fs.mkdirSync(generatedDir, { recursive: true });
fs.mkdirSync(completeDir, { recursive: true });

const results = [];
for (const card of portraitCards) {
  const generatedPath = path.join(generatedDir, `${card.id}.png`);
  const finalPngPath = path.join(cardsDir, `${card.id}.png`);
  const sourcePngPath = fs.existsSync(generatedPath) ? generatedPath : finalPngPath;
  if (!fs.existsSync(sourcePngPath)) throw new Error(`Missing portrait source: ${sourcePngPath}`);

  const metadata = await sharp(sourcePngPath).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Invalid image: ${generatedPath}`);
  if (process.env.STARSHIP_REBUILD_PNG === "1" && sourcePngPath === generatedPath) {
    await sharp(generatedPath)
      .resize({ width: 1024, height: 1536, fit: "cover", position: "centre" })
      .png({ compressionLevel: 9 })
      .toFile(`${finalPngPath}.tmp`);
    fs.renameSync(`${finalPngPath}.tmp`, finalPngPath);
  }

  const completePath = path.join(completeDir, `${card.id}.svg`);
  fs.writeFileSync(completePath, portraitSvg(card, `../${card.id}.png`), "utf8");

  // Keep the old SVG path useful for any cached page or older document link.
  const legacySvgPath = path.join(cardsDir, `${card.id}.svg`);
  fs.writeFileSync(legacySvgPath, portraitSvg(card, `${card.id}.png`), "utf8");
  results.push({ id: card.id, width: metadata.width, height: metadata.height, png: finalPngPath, portrait: completePath });
}

console.log(JSON.stringify({ count: results.length, portraits: results }, null, 2));
