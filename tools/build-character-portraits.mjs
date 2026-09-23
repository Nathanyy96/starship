import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const sharp = require("sharp");
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

/**
 * The SVG is deliberately only a clean image shell.  Name, rarity and element
 * are rendered by the game/document layout above the image.  Keeping metadata
 * out of the asset prevents the old portrait card from covering the character
 * and gives every consumer one identical source image.
 */
function portraitSvg(card, imageHref) {
  const name = escapeXml(card.name);
  const romanizedName = escapeXml(card.romanizedName);
  const element = escapeXml(card.element);
  const rarity = "★".repeat(Number(card.rarity));
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1536" role="img" aria-labelledby="portrait-title portrait-description" data-character-id="${escapeXml(card.id)}">
  <title id="portrait-title">${name}</title>
  <desc id="portrait-description">${name} ${rarity} ${element} · ${romanizedName}</desc>
  <image href="${imageHref}" x="0" y="0" width="1024" height="1536" preserveAspectRatio="xMidYMid meet"/>
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
