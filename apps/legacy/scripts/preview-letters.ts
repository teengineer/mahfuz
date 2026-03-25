/**
 * Combined preview: font outline guide + stroke detection paths
 * Run: npx tsx scripts/preview-letters.ts
 */
import { LETTER_STROKES, smoothSvgPath } from "../src/lib/letter-strokes";
import { LETTER_GUIDE_PATHS } from "../src/lib/letter-guide-paths";
import { writeFileSync } from "fs";

const ARABIC: Record<string, string> = {
  alif: "ا", ba: "ب", ta: "ت", tha: "ث",
  jim: "ج", ha: "ح", kha: "خ",
  dal: "د", dhal: "ذ", ra: "ر", zay: "ز",
  sin: "س", shin: "ش",
  sad: "ص", dad: "ض",
  taa: "ط", dhaa: "ظ",
  ayn: "ع", ghayn: "غ",
  fa: "ف", qaf: "ق", kaf: "ك",
  lam: "ل", mim: "م", nun: "ن",
  haa: "ه", waw: "و", ya: "ي",
};

const ORDER = [
  "alif","ba","ta","tha","jim","ha","kha","dal","dhal","ra","zay",
  "sin","shin","sad","dad","taa","dhaa","ayn","ghayn","fa","qaf",
  "kaf","lam","mim","nun","haa","waw","ya",
];

let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Letter Preview — Font Guide + Stroke Paths</title>
<style>
  body { font-family: sans-serif; background: #f5f5f5; padding: 20px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; max-width: 1400px; margin: 0 auto; }
  .card { background: white; border-radius: 12px; padding: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .card h3 { margin: 4px 0; font-size: 14px; }
  .arabic { font-size: 28px; font-family: 'Amiri', serif; }
  svg { border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; }
</style></head><body>
<h1>Combined Preview: Font Guide (gray fill) + Detection Paths (green stroke)</h1>
<p>Gray = font outline (what child sees). Green = stroke detection path (checkpoints). Red dots = waypoints.</p>
<div class="grid">`;

for (const key of ORDER) {
  const strokes = LETTER_STROKES[key];
  const guide = LETTER_GUIDE_PATHS[key];
  const arabic = ARABIC[key] || "?";

  let svg = "";

  // Font outline guide (filled background)
  if (guide) {
    svg += `<path d="${guide.guidePath}" fill="#e5e7eb" stroke="none"/>`;
  }

  // Stroke detection paths (green overlay)
  for (const s of strokes.strokes) {
    if (s.type === "path") {
      const d = smoothSvgPath(s.points);
      svg += `<path d="${d}" fill="none" stroke="#10B981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.8"/>`;
      for (const p of s.points) {
        svg += `<circle cx="${p.x}" cy="${p.y}" r="2.5" fill="#ef4444"/>`;
      }
    } else {
      svg += `<circle cx="${s.points[0].x}" cy="${s.points[0].y}" r="8" fill="#10B981" opacity="0.6"/>`;
    }
  }

  html += `
  <div class="card">
    <h3>${key} <span class="arabic">${arabic}</span></h3>
    <svg width="200" height="200" viewBox="0 0 280 280">${svg}</svg>
  </div>`;
}

html += `</div></body></html>`;

writeFileSync("preview-letters.html", html);
console.log("✅ preview-letters.html — combined font guide + stroke paths");
