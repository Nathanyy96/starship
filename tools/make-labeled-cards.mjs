import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const data = require("../src/data.js");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "assets", "cards", "labeled");
fs.mkdirSync(outputDirectory, { recursive: true });

function xml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

function safeColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#8f7cff";
}

function makeSvg(card) {
  const width = 1600;
  const height = 1000;
  const accent = safeColor(card.accent);
  let imageMarkup = "";
  if (card.image) {
    const imagePath = path.resolve(root, card.image.replace(/^\.\//, ""));
    if (fs.existsSync(imagePath)) {
      const imageData = fs.readFileSync(imagePath).toString("base64");
      imageMarkup = `<image href="data:image/png;base64,${imageData}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
    }
  }
  const stars = "★".repeat(card.rarity);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#071026" stop-opacity=".04"/><stop offset=".58" stop-color="#071026" stop-opacity=".24"/><stop offset="1" stop-color="#05091a" stop-opacity=".95"/></linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent}" stop-opacity=".58"/><stop offset="1" stop-color="#0b1735" stop-opacity=".08"/></linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="9" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="${width}" height="${height}" fill="#0a1028"/>
  ${imageMarkup}
  <rect width="${width}" height="${height}" fill="url(#shade)"/>
  <rect width="${width}" height="${height}" fill="url(#accent)" opacity=".3"/>
  <circle cx="1370" cy="150" r="74" fill="none" stroke="#dbe8ff" stroke-opacity=".35" stroke-width="3"/>
  <circle cx="1370" cy="150" r="98" fill="none" stroke="${accent}" stroke-opacity=".3" stroke-width="2"/>
  <text x="74" y="82" fill="#eaf2ff" fill-opacity=".72" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="27" letter-spacing="12">星界之律</text>
  <text x="74" y="819" fill="#ffffff" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="66" font-weight="800" letter-spacing="5">${xml(card.name)}</text>
  <text x="80" y="866" fill="#d6e1ff" fill-opacity=".82" font-family="Arial, sans-serif" font-size="28" letter-spacing="6">${xml(card.romanizedName)}</text>
  <text x="74" y="935" fill="#ffe8a5" font-family="Arial, sans-serif" font-size="34" letter-spacing="9" filter="url(#glow)">${stars}</text>
  <circle cx="1450" cy="875" r="45" fill="#09132e" fill-opacity=".72" stroke="#e4efff" stroke-opacity=".68" stroke-width="2"/>
  <text x="1450" y="890" text-anchor="middle" fill="#ffffff" font-family="Microsoft JhengHei, Noto Sans TC, sans-serif" font-size="38" font-weight="800">${xml(card.element)}</text>
</svg>`;
}

const cards = data.activeCards.concat(data.futureCards);
for (const card of cards) {
  if (!card.image) continue;
  const outputPath = path.join(outputDirectory, card.id + ".svg");
  fs.writeFileSync(outputPath, makeSvg(card), "utf8");
  console.log(outputPath);
}
