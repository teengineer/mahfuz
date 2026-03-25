/**
 * Extract SVG glyph outlines for 28 Arabic letters from Amiri font.
 * Outputs: public/kids/letter-paths.json
 *
 * Usage: node apps/legacy/scripts/build-letter-paths.mjs
 */
import opentype from "opentype.js";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_PATH = resolve(__dirname, "../public/fonts/Amiri-Regular.ttf");
const OUT_DIR = resolve(__dirname, "../public/kids");
const OUT_PATH = resolve(OUT_DIR, "letter-paths.json");

// 28 Arabic letters — isolated Unicode code points
const LETTERS = [
  { id: "alif", char: "\u0627", dots: [] },
  { id: "ba", char: "\u0628", dots: [{ pos: "below", count: 1 }] },
  { id: "ta", char: "\u062A", dots: [{ pos: "above", count: 2 }] },
  { id: "tha", char: "\u062B", dots: [{ pos: "above", count: 3 }] },
  { id: "jim", char: "\u062C", dots: [{ pos: "below", count: 1 }] },
  { id: "ha", char: "\u062D", dots: [] },
  { id: "kha", char: "\u062E", dots: [{ pos: "above", count: 1 }] },
  { id: "dal", char: "\u062F", dots: [] },
  { id: "dhal", char: "\u0630", dots: [{ pos: "above", count: 1 }] },
  { id: "ra", char: "\u0631", dots: [] },
  { id: "zay", char: "\u0632", dots: [{ pos: "above", count: 1 }] },
  { id: "sin", char: "\u0633", dots: [] },
  { id: "shin", char: "\u0634", dots: [{ pos: "above", count: 3 }] },
  { id: "sad", char: "\u0635", dots: [] },
  { id: "dad", char: "\u0636", dots: [{ pos: "above", count: 1 }] },
  { id: "taa", char: "\u0637", dots: [] },
  { id: "dhaa", char: "\u0638", dots: [{ pos: "above", count: 1 }] },
  { id: "ayn", char: "\u0639", dots: [] },
  { id: "ghayn", char: "\u063A", dots: [{ pos: "above", count: 1 }] },
  { id: "fa", char: "\u0641", dots: [{ pos: "above", count: 1 }] },
  { id: "qaf", char: "\u0642", dots: [{ pos: "above", count: 2 }] },
  { id: "kaf", char: "\u0643", dots: [] },
  { id: "lam", char: "\u0644", dots: [] },
  { id: "mim", char: "\u0645", dots: [] },
  { id: "nun", char: "\u0646", dots: [{ pos: "above", count: 1 }] },
  { id: "haa", char: "\u0647", dots: [] },
  { id: "waw", char: "\u0648", dots: [] },
  { id: "ya", char: "\u064A", dots: [{ pos: "below", count: 2 }] },
];

const VIEWBOX = 280;
const PADDING = 20;
const TARGET = VIEWBOX - PADDING * 2; // 240px usable area

function extractLetterPath(font, char) {
  const glyph = font.charToGlyph(char);
  if (!glyph || glyph.index === 0) {
    console.warn(`  ⚠ Glyph not found for ${char} (U+${char.codePointAt(0).toString(16).toUpperCase()})`);
    return null;
  }

  // Get the path at a large size for precision
  const fontSize = 1000;
  const path = glyph.getPath(0, 0, fontSize);

  // Calculate bounding box
  const bb = path.getBoundingBox();
  const glyphW = bb.x2 - bb.x1;
  const glyphH = bb.y2 - bb.y1;

  if (glyphW === 0 || glyphH === 0) {
    console.warn(`  ⚠ Empty glyph for ${char}`);
    return null;
  }

  // Scale to fit within TARGET, maintaining aspect ratio
  const scale = Math.min(TARGET / glyphW, TARGET / glyphH);
  const scaledW = glyphW * scale;
  const scaledH = glyphH * scale;

  // Center in viewbox
  const offsetX = PADDING + (TARGET - scaledW) / 2 - bb.x1 * scale;
  const offsetY = PADDING + (TARGET - scaledH) / 2 - bb.y1 * scale;

  // Transform path commands
  const commands = path.commands.map((cmd) => {
    const t = { ...cmd };
    if (t.x !== undefined) {
      t.x = t.x * scale + offsetX;
      t.y = t.y * scale + offsetY;
    }
    if (t.x1 !== undefined) {
      t.x1 = t.x1 * scale + offsetX;
      t.y1 = t.y1 * scale + offsetY;
    }
    if (t.x2 !== undefined) {
      t.x2 = t.x2 * scale + offsetX;
      t.y2 = t.y2 * scale + offsetY;
    }
    return t;
  });

  // Convert to SVG path string
  let d = "";
  for (const cmd of commands) {
    switch (cmd.type) {
      case "M":
        d += `M${r(cmd.x)} ${r(cmd.y)}`;
        break;
      case "L":
        d += `L${r(cmd.x)} ${r(cmd.y)}`;
        break;
      case "C":
        d += `C${r(cmd.x1)} ${r(cmd.y1)} ${r(cmd.x2)} ${r(cmd.y2)} ${r(cmd.x)} ${r(cmd.y)}`;
        break;
      case "Q":
        d += `Q${r(cmd.x1)} ${r(cmd.y1)} ${r(cmd.x)} ${r(cmd.y)}`;
        break;
      case "Z":
        d += "Z";
        break;
    }
  }

  return {
    d,
    width: r(scaledW),
    height: r(scaledH),
    centerX: r(VIEWBOX / 2),
    centerY: r(PADDING + scaledH / 2),
  };
}

function r(n) {
  return Math.round(n * 10) / 10;
}

async function main() {
  console.log("Loading Amiri font...");
  const font = await opentype.load(FONT_PATH);
  console.log(`Font loaded: ${font.names.fontFamily?.en || "Unknown"}`);

  const result = {};

  for (const letter of LETTERS) {
    console.log(`Extracting ${letter.id} (${letter.char})...`);
    const pathData = extractLetterPath(font, letter.char);
    if (pathData) {
      result[letter.id] = {
        ...pathData,
        dots: letter.dots,
      };
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(result, null, 2));
  console.log(`\n✓ Wrote ${Object.keys(result).length} letter paths to ${OUT_PATH}`);

  // Print file size
  const size = (JSON.stringify(result).length / 1024).toFixed(1);
  console.log(`  Size: ${size} KB`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
