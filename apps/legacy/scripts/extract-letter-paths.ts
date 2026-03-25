/**
 * Extract Arabic letter glyph outlines from Amiri font.
 * Produces SVG path data for guide rendering + simplified centerline waypoints.
 *
 * Run: npx tsx scripts/extract-letter-paths.ts
 */
// @ts-nocheck
import opentype from "opentype.js";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FONT_PATH = resolve(__dirname, "Amiri-Regular.ttf");
const font = opentype.loadSync(FONT_PATH);

// 28 Arabic letters — Unicode codepoints for isolated forms
const LETTERS: Record<string, { code: number; arabic: string }> = {
  alif:  { code: 0x0627, arabic: "ا" },
  ba:    { code: 0x0628, arabic: "ب" },
  ta:    { code: 0x062A, arabic: "ت" },
  tha:   { code: 0x062B, arabic: "ث" },
  jim:   { code: 0x062C, arabic: "ج" },
  ha:    { code: 0x062D, arabic: "ح" },
  kha:   { code: 0x062E, arabic: "خ" },
  dal:   { code: 0x062F, arabic: "د" },
  dhal:  { code: 0x0630, arabic: "ذ" },
  ra:    { code: 0x0631, arabic: "ر" },
  zay:   { code: 0x0632, arabic: "ز" },
  sin:   { code: 0x0633, arabic: "س" },
  shin:  { code: 0x0634, arabic: "ش" },
  sad:   { code: 0x0635, arabic: "ص" },
  dad:   { code: 0x0636, arabic: "ض" },
  taa:   { code: 0x0637, arabic: "ط" },
  dhaa:  { code: 0x0638, arabic: "ظ" },
  ayn:   { code: 0x0639, arabic: "ع" },
  ghayn: { code: 0x063A, arabic: "غ" },
  fa:    { code: 0x0641, arabic: "ف" },
  qaf:   { code: 0x0642, arabic: "ق" },
  kaf:   { code: 0x0643, arabic: "ك" },
  lam:   { code: 0x0644, arabic: "ل" },
  mim:   { code: 0x0645, arabic: "م" },
  nun:   { code: 0x0646, arabic: "ن" },
  haa:   { code: 0x0647, arabic: "ه" },
  waw:   { code: 0x0648, arabic: "و" },
  ya:    { code: 0x064A, arabic: "ي" },
};

const ORDER = [
  "alif","ba","ta","tha","jim","ha","kha","dal","dhal","ra","zay",
  "sin","shin","sad","dad","taa","dhaa","ayn","ghayn","fa","qaf",
  "kaf","lam","mim","nun","haa","waw","ya",
];

// ── Helpers ──────────────────────────────────────────────────────

interface Point { x: number; y: number; }
interface Contour { points: Point[]; closed: boolean; }

/** Convert opentype path commands to SVG d string */
function pathToSvg(commands: opentype.PathCommand[]): string {
  let d = "";
  for (const cmd of commands) {
    switch (cmd.type) {
      case "M": d += `M${cmd.x.toFixed(1)},${cmd.y.toFixed(1)} `; break;
      case "L": d += `L${cmd.x.toFixed(1)},${cmd.y.toFixed(1)} `; break;
      case "Q": d += `Q${cmd.x1!.toFixed(1)},${cmd.y1!.toFixed(1)} ${cmd.x.toFixed(1)},${cmd.y.toFixed(1)} `; break;
      case "C": d += `C${cmd.x1!.toFixed(1)},${cmd.y1!.toFixed(1)} ${cmd.x2!.toFixed(1)},${cmd.y2!.toFixed(1)} ${cmd.x.toFixed(1)},${cmd.y.toFixed(1)} `; break;
      case "Z": d += "Z "; break;
    }
  }
  return d.trim();
}

/** Compute bounding box of path commands */
function pathBounds(commands: opentype.PathCommand[]): { x1: number; y1: number; x2: number; y2: number } {
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const cmd of commands) {
    if ("x" in cmd && cmd.x !== undefined) {
      x1 = Math.min(x1, cmd.x); x2 = Math.max(x2, cmd.x);
      y1 = Math.min(y1, cmd.y!); y2 = Math.max(y2, cmd.y!);
    }
    if ("x1" in cmd && cmd.x1 !== undefined) {
      x1 = Math.min(x1, cmd.x1); x2 = Math.max(x2, cmd.x1);
      y1 = Math.min(y1, cmd.y1!); y2 = Math.max(y2, cmd.y1!);
    }
    if ("x2" in cmd && cmd.x2 !== undefined) {
      x1 = Math.min(x1, cmd.x2); x2 = Math.max(x2, cmd.x2);
      y1 = Math.min(y1, cmd.y2!); y2 = Math.max(y2, cmd.y2!);
    }
  }
  return { x1, y1, x2, y2 };
}

/** Transform path commands to fit a target box with padding */
function transformPath(
  commands: opentype.PathCommand[],
  targetSize: number,
  padding: number,
): opentype.PathCommand[] {
  const bounds = pathBounds(commands);
  const bw = bounds.x2 - bounds.x1;
  const bh = bounds.y2 - bounds.y1;
  if (bw === 0 || bh === 0) return commands;

  const available = targetSize - padding * 2;
  const scale = Math.min(available / bw, available / bh);
  const cx = bounds.x1 + bw / 2;
  const cy = bounds.y1 + bh / 2;
  const tx = targetSize / 2;
  const ty = targetSize / 2;

  function tr(x: number, y: number): { x: number; y: number } {
    return {
      x: (x - cx) * scale + tx,
      y: (y - cy) * scale + ty,
    };
  }

  return commands.map((cmd) => {
    const c: any = { type: cmd.type };
    if ("x" in cmd && cmd.x !== undefined) {
      const p = tr(cmd.x, cmd.y!);
      c.x = p.x; c.y = p.y;
    }
    if ("x1" in cmd && cmd.x1 !== undefined) {
      const p = tr(cmd.x1, cmd.y1!);
      c.x1 = p.x; c.y1 = p.y;
    }
    if ("x2" in cmd && cmd.x2 !== undefined) {
      const p = tr(cmd.x2, cmd.y2!);
      c.x2 = p.x; c.y2 = p.y;
    }
    return c;
  });
}

/** Extract contours from path commands */
function extractContours(commands: opentype.PathCommand[]): Contour[] {
  const contours: Contour[] = [];
  let current: Point[] = [];
  for (const cmd of commands) {
    if (cmd.type === "M") {
      if (current.length > 0) contours.push({ points: current, closed: false });
      current = [{ x: cmd.x, y: cmd.y! }];
    } else if (cmd.type === "Z") {
      contours.push({ points: current, closed: true });
      current = [];
    } else if ("x" in cmd && cmd.x !== undefined) {
      // For Q/C, sample intermediate points for accurate shape
      if (cmd.type === "Q" && current.length > 0) {
        const p0 = current[current.length - 1];
        for (let t = 0.25; t <= 0.75; t += 0.25) {
          const it = 1 - t;
          current.push({
            x: it * it * p0.x + 2 * it * t * cmd.x1! + t * t * cmd.x,
            y: it * it * p0.y + 2 * it * t * cmd.y1! + t * t * cmd.y!,
          });
        }
      } else if (cmd.type === "C" && current.length > 0) {
        const p0 = current[current.length - 1];
        for (let t = 0.2; t <= 0.8; t += 0.2) {
          const it = 1 - t;
          current.push({
            x: it*it*it*p0.x + 3*it*it*t*cmd.x1! + 3*it*t*t*cmd.x2! + t*t*t*cmd.x,
            y: it*it*it*p0.y + 3*it*it*t*cmd.y1! + 3*it*t*t*cmd.y2! + t*t*t*cmd.y!,
          });
        }
      }
      current.push({ x: cmd.x, y: cmd.y! });
    }
  }
  if (current.length > 0) contours.push({ points: current, closed: false });
  return contours;
}

/** Compute polygon area (signed) */
function polygonArea(pts: Point[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return area / 2;
}

/** Polygon perimeter */
function perimeter(pts: Point[]): number {
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    len += Math.hypot(pts[i+1].x - pts[i].x, pts[i+1].y - pts[i].y);
  }
  return len;
}

/** Separate body contours from dot contours */
function separateDotsFromBody(contours: Contour[]): { body: Contour[]; dots: Contour[] } {
  // Dots are small closed contours (area < threshold)
  const DOT_AREA_THRESHOLD = 800; // tunable
  const body: Contour[] = [];
  const dots: Contour[] = [];
  for (const c of contours) {
    const area = Math.abs(polygonArea(c.points));
    if (area < DOT_AREA_THRESHOLD && c.closed) {
      dots.push(c);
    } else {
      body.push(c);
    }
  }
  return { body, dots };
}

/** Get centroid of a contour */
function centroid(pts: Point[]): Point {
  let sx = 0, sy = 0;
  for (const p of pts) { sx += p.x; sy += p.y; }
  return { x: sx / pts.length, y: sy / pts.length };
}

// ── Main extraction ──────────────────────────────────────────────

const SIZE = 280;
const PAD = 20;

interface LetterResult {
  name: string;
  arabic: string;
  guidePath: string;        // SVG d attribute for the filled guide
  dotCenters: Point[];       // centers of dot contours
  bodyContours: Contour[];   // for centerline analysis
}

const results: LetterResult[] = [];

for (const name of ORDER) {
  const { code, arabic } = LETTERS[name];
  const glyph = font.charToGlyph(String.fromCodePoint(code));
  const path = glyph.getPath(0, 0, 800); // large size for precision

  // Transform to 280x280 viewBox
  const transformed = transformPath(path.commands, SIZE, PAD);
  const guidePath = pathToSvg(transformed);

  // Extract contours for analysis
  const contours = extractContours(transformed);
  const { body, dots } = separateDotsFromBody(contours);
  const dotCenters = dots.map((d) => centroid(d.points));

  results.push({ name, arabic, guidePath, dotCenters, bodyContours: body });
}

// ── Generate preview HTML ────────────────────────────────────────

let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Font-derived Letter Paths</title>
<link href="https://fonts.googleapis.com/css2?family=Amiri&display=swap" rel="stylesheet">
<style>
  body { font-family: sans-serif; background: #f5f5f5; padding: 20px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; max-width: 1400px; margin: 0 auto; }
  .card { background: white; border-radius: 12px; padding: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .card h3 { margin: 4px 0; font-size: 14px; }
  .arabic { font-size: 32px; font-family: 'Amiri', 'Traditional Arabic', serif; }
  svg { border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; }
  .info { font-size: 10px; color: #666; margin-top: 4px; }
</style></head><body>
<h1>Font-derived Letter Outlines (Amiri Naskh, 280×280)</h1>
<p>Gray fill = font glyph outline. Red dots = dot contour centers. These outlines will be used as <code>guidePath</code> for the visual letter guide.</p>
<div class="grid">`;

for (const r of results) {
  let svgContent = `<path d="${r.guidePath}" fill="#374151" opacity="0.6"/>`;
  for (const d of r.dotCenters) {
    svgContent += `<circle cx="${d.x.toFixed(1)}" cy="${d.y.toFixed(1)}" r="5" fill="#ef4444"/>`;
  }

  html += `
  <div class="card">
    <h3>${r.name} <span class="arabic">${r.arabic}</span></h3>
    <svg width="200" height="200" viewBox="0 0 280 280">${svgContent}</svg>
    <div class="info">${r.bodyContours.length} body + ${r.dotCenters.length} dots</div>
  </div>`;
}

html += `</div></body></html>`;
writeFileSync(resolve(__dirname, "..", "preview-font-letters.html"), html);

// ── Output guide path data as TypeScript ─────────────────────────

let tsOutput = `// Auto-generated from Amiri-Regular.ttf\n`;
tsOutput += `// Guide paths for 280x280 viewBox\n\n`;
tsOutput += `export const LETTER_GUIDE_PATHS: Record<string, { guidePath: string; dotCenters: Array<{x: number; y: number}> }> = {\n`;

for (const r of results) {
  tsOutput += `  ${r.name}: {\n`;
  tsOutput += `    guidePath: "${r.guidePath}",\n`;
  tsOutput += `    dotCenters: [${r.dotCenters.map(d => `{x:${d.x.toFixed(1)},y:${d.y.toFixed(1)}}`).join(", ")}],\n`;
  tsOutput += `  },\n`;
}

tsOutput += `};\n`;
writeFileSync(resolve(__dirname, "..", "src", "lib", "letter-guide-paths.ts"), tsOutput);

console.log("✅ preview-font-letters.html — open in browser to inspect font outlines");
console.log("✅ src/lib/letter-guide-paths.ts — guide path data generated");
console.log(`\n📊 Summary:`);
for (const r of results) {
  console.log(`  ${r.name.padEnd(6)} ${r.arabic}  body=${r.bodyContours.length} dots=${r.dotCenters.length}`);
}
