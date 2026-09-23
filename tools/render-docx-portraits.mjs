import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
// Use the bundled workspace runtime explicitly; the project does not install
// sharp in node_modules on the deployment host.
const sharp = require("sharp");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.resolve(process.argv[2] || path.join(root, ".tmp-docx-portraits"));
const { cards } = require(path.join(root, "src", "data.js"));

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const MIME_TYPES = Object.freeze({
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
});

/**
 * Sharp/libvips does not resolve relative SVG <image> hrefs in every runtime.
 * Inline local assets before rasterizing so the generated DOCX contains the
 * actual portrait instead of only the overlay label/background.
 */
async function inlineSvgResources(svgPath, stack = new Set()) {
  const absolutePath = path.resolve(svgPath);
  if (stack.has(absolutePath)) {
    throw new Error(`Circular SVG reference while rendering ${absolutePath}`);
  }

  const nextStack = new Set(stack);
  nextStack.add(absolutePath);
  const source = await fs.readFile(absolutePath, "utf8");
  const referencePattern = /(?:href|xlink:href)="([^"]+)"/g;
  const matches = [...source.matchAll(referencePattern)];
  if (!matches.length) return source;

  let result = "";
  let cursor = 0;
  for (const match of matches) {
    result += source.slice(cursor, match.index);
    const reference = match[1];
    let replacement = reference;

    if (!reference.startsWith("data:") && !reference.startsWith("#")) {
      const resourcePath = path.resolve(path.dirname(absolutePath), reference);
      const extension = path.extname(resourcePath).toLowerCase();
      if (extension === ".svg") {
        const nestedSvg = await inlineSvgResources(resourcePath, nextStack);
        replacement = `data:image/svg+xml;base64,${Buffer.from(nestedSvg).toString("base64")}`;
      } else if (MIME_TYPES[extension]) {
        const resource = await fs.readFile(resourcePath);
        replacement = `data:${MIME_TYPES[extension]};base64,${resource.toString("base64")}`;
      }
    }

    result += match[0].replace(reference, replacement);
    cursor = match.index + match[0].length;
  }
  return result + source.slice(cursor);
}

const entries = Object.values(cards);
await Promise.all(entries.map(async (card) => {
  const source = path.resolve(root, String(card.portraitImage || card.image || "").replace(/^\.\//, ""));
  const target = path.join(outputDir, `${card.id}.png`);
  const extension = path.extname(source).toLowerCase();
  const input = extension === ".svg"
    ? Buffer.from(await inlineSvgResources(source))
    : source;
  await sharp(input)
    // The document gallery uses a fixed portrait frame.  Covering the frame
    // keeps the source scene visible to every edge instead of adding white
    // side bands around otherwise complete backgrounds.
    .resize({ width: 560, height: 760, fit: "cover", position: "centre" })
    .png()
    .toFile(target);
}));

console.log(`Rendered ${entries.length} character portraits to ${outputDir}`);
