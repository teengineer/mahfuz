/**
 * Compute high-quality centerline waypoints from letter-guide-paths.ts outlines.
 *
 * Algorithm:
 * 1. Parse SVG path → polyline (sampling beziers)
 * 2. Rasterize at 2× resolution (560×560) for precision
 * 3. Compute chamfer distance transform (distance to boundary)
 * 4. Zhang-Suen thinning → raw skeleton
 * 5. Refine skeleton: hill-climb each point toward distance-field maximum (true center)
 * 6. Trace skeleton into ordered stroke sequences
 * 7. Gaussian smooth the traced path
 * 8. Downsample to 280×280 coordinate space
 * 9. Sample at ~20px spacing
 *
 * Run: npx tsx scripts/compute-centerlines.ts
 */
import { LETTER_GUIDE_PATHS } from "../src/lib/letter-guide-paths";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Constants ──────────────────────────────────────────────────

const SCALE = 2; // 2× supersampling
const W = 280 * SCALE;
const H = 280 * SCALE;

// ─── SVG Path Parser ────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
}

function parseSvgPath(d: string): Point[][] {
  const subPaths: Point[][] = [];
  let current: Point[] = [];
  let cx = 0, cy = 0, startX = 0, startY = 0;

  const tokens: string[] = [];
  const re = /([MLQCZmlqcz])|(-?\d+\.?\d*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) tokens.push(m[0]);

  let i = 0;
  const num = () => parseFloat(tokens[i++]);

  while (i < tokens.length) {
    const cmd = tokens[i++];
    switch (cmd) {
      case "M": {
        if (current.length > 0) subPaths.push(current);
        cx = num(); cy = num(); startX = cx; startY = cy;
        current = [{ x: cx, y: cy }];
        while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
          cx = num(); cy = num(); current.push({ x: cx, y: cy });
        }
        break;
      }
      case "L": {
        while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
          cx = num(); cy = num(); current.push({ x: cx, y: cy });
        }
        break;
      }
      case "Q": {
        while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
          const cpx = num(), cpy = num(), ex = num(), ey = num();
          for (let s = 1; s <= 16; s++) {
            const t = s / 16, t1 = 1 - t;
            current.push({
              x: t1 * t1 * cx + 2 * t1 * t * cpx + t * t * ex,
              y: t1 * t1 * cy + 2 * t1 * t * cpy + t * t * ey,
            });
          }
          cx = ex; cy = ey;
        }
        break;
      }
      case "C": {
        while (i < tokens.length && !isNaN(parseFloat(tokens[i]))) {
          const c1x = num(), c1y = num(), c2x = num(), c2y = num(), ex = num(), ey = num();
          for (let s = 1; s <= 20; s++) {
            const t = s / 20, t1 = 1 - t;
            current.push({
              x: t1*t1*t1*cx + 3*t1*t1*t*c1x + 3*t1*t*t*c2x + t*t*t*ex,
              y: t1*t1*t1*cy + 3*t1*t1*t*c1y + 3*t1*t*t*c2y + t*t*t*ey,
            });
          }
          cx = ex; cy = ey;
        }
        break;
      }
      case "Z": case "z": {
        current.push({ x: startX, y: startY });
        subPaths.push(current);
        current = [];
        cx = startX; cy = startY;
        break;
      }
    }
  }
  if (current.length > 0) subPaths.push(current);
  return subPaths;
}

// ─── Rasterizer (even-odd fill) at SCALE× ───────────────────────

function rasterize(subPaths: Point[][]): Uint8Array {
  const bitmap = new Uint8Array(W * H);
  // Scale all points
  const scaled = subPaths.map(sp => sp.map(p => ({ x: p.x * SCALE, y: p.y * SCALE })));

  for (let y = 0; y < H; y++) {
    const crossings: number[] = [];
    const sy = y + 0.5;
    for (const poly of scaled) {
      for (let i = 0; i < poly.length - 1; i++) {
        const p0 = poly[i], p1 = poly[i + 1];
        if ((p0.y <= sy && p1.y > sy) || (p1.y <= sy && p0.y > sy)) {
          const t = (sy - p0.y) / (p1.y - p0.y);
          crossings.push(p0.x + t * (p1.x - p0.x));
        }
      }
    }
    crossings.sort((a, b) => a - b);
    for (let c = 0; c < crossings.length - 1; c += 2) {
      const x0 = Math.max(0, Math.ceil(crossings[c]));
      const x1 = Math.min(W - 1, Math.floor(crossings[c + 1]));
      for (let x = x0; x <= x1; x++) bitmap[y * W + x] = 1;
    }
  }
  return bitmap;
}

// ─── Chamfer Distance Transform ─────────────────────────────────

function distanceTransform(bitmap: Uint8Array): Float32Array {
  const dt = new Float32Array(W * H);
  const INF = 1e6;

  // Initialize: 0 for outside, INF for inside
  for (let i = 0; i < W * H; i++) {
    dt[i] = bitmap[i] ? INF : 0;
  }

  // Forward pass (top-left → bottom-right)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (dt[idx] === 0) continue;
      let d = dt[idx];
      if (x > 0) d = Math.min(d, dt[idx - 1] + 1.0);
      if (y > 0) d = Math.min(d, dt[idx - W] + 1.0);
      if (x > 0 && y > 0) d = Math.min(d, dt[(y-1)*W + (x-1)] + 1.414);
      if (x < W-1 && y > 0) d = Math.min(d, dt[(y-1)*W + (x+1)] + 1.414);
      dt[idx] = d;
    }
  }

  // Backward pass (bottom-right → top-left)
  for (let y = H - 1; y >= 0; y--) {
    for (let x = W - 1; x >= 0; x--) {
      const idx = y * W + x;
      if (dt[idx] === 0) continue;
      let d = dt[idx];
      if (x < W-1) d = Math.min(d, dt[idx + 1] + 1.0);
      if (y < H-1) d = Math.min(d, dt[idx + W] + 1.0);
      if (x < W-1 && y < H-1) d = Math.min(d, dt[(y+1)*W + (x+1)] + 1.414);
      if (x > 0 && y < H-1) d = Math.min(d, dt[(y+1)*W + (x-1)] + 1.414);
      dt[idx] = d;
    }
  }

  return dt;
}

// ─── Zhang-Suen Thinning ────────────────────────────────────────

function zhangSuenThin(bitmap: Uint8Array): Uint8Array {
  const img = new Uint8Array(bitmap);
  const get = (x: number, y: number) =>
    x >= 0 && x < W && y >= 0 && y < H ? img[y * W + x] : 0;

  let changed = true;
  while (changed) {
    changed = false;

    for (let pass = 0; pass < 2; pass++) {
      const toRemove: number[] = [];
      for (let y = 1; y < H - 1; y++) {
        for (let x = 1; x < W - 1; x++) {
          if (!get(x, y)) continue;
          const p2=get(x,y-1), p3=get(x+1,y-1), p4=get(x+1,y);
          const p5=get(x+1,y+1), p6=get(x,y+1), p7=get(x-1,y+1);
          const p8=get(x-1,y), p9=get(x-1,y-1);
          const B = p2+p3+p4+p5+p6+p7+p8+p9;
          if (B < 2 || B > 6) continue;
          const seq = [p2,p3,p4,p5,p6,p7,p8,p9,p2];
          let A = 0;
          for (let k = 0; k < 8; k++) if (seq[k]===0 && seq[k+1]===1) A++;
          if (A !== 1) continue;
          if (pass === 0) {
            if (p2*p4*p6 !== 0 || p4*p6*p8 !== 0) continue;
          } else {
            if (p2*p4*p8 !== 0 || p2*p6*p8 !== 0) continue;
          }
          toRemove.push(y * W + x);
        }
      }
      for (const idx of toRemove) { img[idx] = 0; changed = true; }
    }
  }
  return img;
}

// ─── Skeleton Refinement: snap to distance-field ridge ──────────

function refineSkeleton(skelPoints: Point[], dt: Float32Array): Point[] {
  // For each skeleton point, hill-climb on distance field to find true center
  return skelPoints.map(p => {
    let x = p.x, y = p.y;
    // Hill-climb: move toward highest distance in 3×3 neighborhood
    for (let iter = 0; iter < 5; iter++) {
      let bestX = x, bestY = y;
      let bestD = dt[Math.round(y) * W + Math.round(x)] || 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = Math.round(x) + dx, ny = Math.round(y) + dy;
          if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
            const d = dt[ny * W + nx];
            if (d > bestD) { bestD = d; bestX = nx; bestY = ny; }
          }
        }
      }
      if (bestX === x && bestY === y) break;
      x = bestX; y = bestY;
    }
    return { x, y };
  });
}

// ─── Skeleton Tracing ───────────────────────────────────────────

interface Stroke { points: Point[]; }

function traceSkeletonStrokes(skel: Uint8Array): Stroke[] {
  const visited = new Uint8Array(W * H);
  const strokes: Stroke[] = [];

  const endpoints: Point[] = [];
  const allPoints: Point[] = [];

  const neighborCount = (x: number, y: number) => {
    let c = 0;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x+dx, ny = y+dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && skel[ny*W+nx]) c++;
      }
    return c;
  };

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!skel[y * W + x]) continue;
      allPoints.push({ x, y });
      if (neighborCount(x, y) === 1) endpoints.push({ x, y });
    }
  }

  if (allPoints.length === 0) return [];

  const getNeighbors = (x: number, y: number) => {
    const nbrs: Point[] = [];
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x+dx, ny = y+dy;
        if (nx >= 0 && nx < W && ny >= 0 && ny < H && skel[ny*W+nx] && !visited[ny*W+nx])
          nbrs.push({ x: nx, y: ny });
      }
    return nbrs;
  };

  const trace = (start: Point): Point[] => {
    const path = [start];
    visited[start.y * W + start.x] = 1;
    let cur = start;
    while (true) {
      const nbrs = getNeighbors(cur.x, cur.y);
      if (nbrs.length === 0) break;
      // Prefer continuing in the same direction
      let next = nbrs[0];
      if (nbrs.length > 1 && path.length >= 2) {
        const prev = path[path.length - 2];
        const dx = cur.x - prev.x, dy = cur.y - prev.y;
        let bestDot = -Infinity;
        for (const n of nbrs) {
          const dot = (n.x - cur.x) * dx + (n.y - cur.y) * dy;
          if (dot > bestDot) { bestDot = dot; next = n; }
        }
      }
      visited[next.y * W + next.x] = 1;
      path.push(next);
      cur = next;
    }
    return path;
  };

  // Trace from endpoints first, then remaining loops
  for (const ep of endpoints) {
    if (visited[ep.y * W + ep.x]) continue;
    const path = trace(ep);
    if (path.length >= 10) strokes.push({ points: path });
  }
  for (const sp of allPoints) {
    if (visited[sp.y * W + sp.x]) continue;
    const path = trace(sp);
    if (path.length >= 10) strokes.push({ points: path });
  }

  return strokes;
}

// ─── Path Processing ────────────────────────────────────────────

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Gaussian smooth a path of points */
function gaussianSmooth(points: Point[], sigma: number, iterations: number): Point[] {
  let pts = points.map(p => ({ ...p }));
  const radius = Math.ceil(sigma * 2);

  for (let iter = 0; iter < iterations; iter++) {
    const smoothed: Point[] = [];
    for (let i = 0; i < pts.length; i++) {
      let sx = 0, sy = 0, sw = 0;
      for (let j = Math.max(0, i - radius); j <= Math.min(pts.length - 1, i + radius); j++) {
        const d = j - i;
        const w = Math.exp(-(d * d) / (2 * sigma * sigma));
        sx += pts[j].x * w;
        sy += pts[j].y * w;
        sw += w;
      }
      smoothed.push({ x: sx / sw, y: sy / sw });
    }
    // Keep first and last points pinned
    smoothed[0] = { ...pts[0] };
    smoothed[smoothed.length - 1] = { ...pts[pts.length - 1] };
    pts = smoothed;
  }
  return pts;
}

/** Downsample from SCALE× coordinates to 280×280 */
function downsample(points: Point[]): Point[] {
  return points.map(p => ({ x: p.x / SCALE, y: p.y / SCALE }));
}

function simplifyRDP(pts: Point[], epsilon: number): Point[] {
  if (pts.length <= 2) return [...pts];
  let maxDist = 0, maxIdx = 0;
  const first = pts[0], last = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) {
    const d = ptLineDist(pts[i], first, last);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > epsilon) {
    const left = simplifyRDP(pts.slice(0, maxIdx + 1), epsilon);
    const right = simplifyRDP(pts.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function ptLineDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return dist(p, a);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return dist(p, { x: a.x + t * dx, y: a.y + t * dy });
}

function sampleAtSpacing(points: Point[], spacing: number): Point[] {
  if (points.length < 2) return points.map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
  const result = [{ x: Math.round(points[0].x), y: Math.round(points[0].y) }];
  let carry = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1].x - points[i].x, dy = points[i+1].y - points[i].y;
    const segLen = Math.hypot(dx, dy);
    let pos = carry;
    while (pos + spacing <= segLen) {
      pos += spacing;
      const t = pos / segLen;
      result.push({ x: Math.round(points[i].x + dx * t), y: Math.round(points[i].y + dy * t) });
    }
    carry = segLen - pos;
  }
  const last = points[points.length - 1];
  const lastR = { x: Math.round(last.x), y: Math.round(last.y) };
  if (dist(result[result.length - 1], lastR) > 5) result.push(lastR);
  return result;
}

function orientStroke(points: Point[]): Point[] {
  const first = points[0], last = points[points.length - 1];
  const dx = last.x - first.x, dy = last.y - first.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) return [...points].reverse(); // Arabic: right to left
  } else {
    if (dy < 0) return [...points].reverse(); // top to bottom
  }
  return points;
}

function strokeLength(pts: Point[]): number {
  let len = 0;
  for (let i = 0; i < pts.length - 1; i++) len += dist(pts[i], pts[i + 1]);
  return len;
}

// ─── Main ───────────────────────────────────────────────────────

const ORDER = [
  "alif","ba","ta","tha","jim","ha","kha","dal","dhal","ra","zay",
  "sin","shin","sad","dad","taa","dhaa","ayn","ghayn","fa","qaf",
  "kaf","lam","mim","nun","haa","waw","ya",
];

const ARABIC: Record<string, string> = {
  alif: "ا", ba: "ب", ta: "ت", tha: "ث", jim: "ج", ha: "ح", kha: "خ",
  dal: "د", dhal: "ذ", ra: "ر", zay: "ز", sin: "س", shin: "ش",
  sad: "ص", dad: "ض", taa: "ط", dhaa: "ظ", ayn: "ع", ghayn: "غ",
  fa: "ف", qaf: "ق", kaf: "ك", lam: "ل", mim: "م", nun: "ن",
  haa: "ه", waw: "و", ya: "ي",
};

// Dot positions from guide path sub-path centroids
const DOT_POSITIONS: Record<string, Point[]> = {
  ba:    [{ x: 149, y: 217 }],
  ta:    [{ x: 159, y: 74 }, { x: 125, y: 96 }],
  tha:   [{ x: 159, y: 89 }, { x: 125, y: 111 }, { x: 135, y: 67 }],
  jim:   [{ x: 138, y: 149 }],
  kha:   [{ x: 127, y: 36 }],
  dhal:  [{ x: 133, y: 46 }],
  zay:   [{ x: 148, y: 40 }],
  shin:  [{ x: 219, y: 56 }, { x: 191, y: 74 }, { x: 199, y: 36 }],
  dad:   [{ x: 186, y: 63 }],
  dhaa:  [{ x: 194, y: 99 }],
  ghayn: [{ x: 95, y: 35 }],
  fa:    [{ x: 220, y: 136 }, { x: 179, y: 58 }],
  qaf:   [{ x: 198, y: 32 }, { x: 162, y: 54 }],
  mim:   [{ x: 131, y: 63 }],
  nun:   [{ x: 133, y: 44 }],
  waw:   [{ x: 187, y: 81 }],
  ya:    [{ x: 148, y: 226 }, { x: 114, y: 248 }],
};

interface StrokeData { type: "path" | "dot"; points: Point[]; }
interface LetterResult { strokes: StrokeData[]; }

console.log(`Computing centerlines at ${SCALE}× resolution (${W}×${H})...\n`);

const results: Record<string, LetterResult> = {};

for (const key of ORDER) {
  const guide = LETTER_GUIDE_PATHS[key];
  if (!guide) { results[key] = { strokes: [] }; continue; }

  // 1. Parse and rasterize at 2× resolution
  const subPaths = parseSvgPath(guide.guidePath);
  const bitmap = rasterize(subPaths);

  // 2. Distance transform
  const dt = distanceTransform(bitmap);

  // 3. Zhang-Suen thinning
  const skeleton = zhangSuenThin(bitmap);

  // 4. Trace skeleton into ordered sequences
  let rawStrokes = traceSkeletonStrokes(skeleton);
  rawStrokes = rawStrokes.filter(s => s.points.length >= 10);
  rawStrokes.sort((a, b) => b.points.length - a.points.length);

  // 5. Process each stroke
  const resultStrokes: StrokeData[] = [];

  for (const stroke of rawStrokes) {
    // Refine: snap skeleton points to distance-field ridge (true center)
    let refined = refineSkeleton(stroke.points, dt);

    // Gaussian smooth (at 2× scale, use sigma=4, 3 iterations)
    refined = gaussianSmooth(refined, 4, 3);

    // Downsample to 280×280 coordinate space
    let ds = downsample(refined);

    // Simplify with generous epsilon to get smooth waypoints
    ds = simplifyRDP(ds, 2.5);

    // Orient for Arabic writing direction
    ds = orientStroke(ds);

    // Sample at 20px spacing
    const sampled = sampleAtSpacing(ds, 20);

    // Skip very short strokes (noise from dot shapes etc.)
    if (sampled.length <= 3 && strokeLength(sampled) < 30) continue;

    if (sampled.length >= 2) {
      resultStrokes.push({ type: "path", points: sampled });
    }
  }

  // 6. Add dots
  const dots = DOT_POSITIONS[key] || [];
  for (const dot of dots) {
    resultStrokes.push({ type: "dot", points: [dot] });
  }

  results[key] = { strokes: resultStrokes };

  const pathCount = resultStrokes.filter(s => s.type === "path").length;
  const dotCount = resultStrokes.filter(s => s.type === "dot").length;
  const totalWP = resultStrokes.filter(s => s.type === "path").reduce((sum, s) => sum + s.points.length, 0);
  console.log(`  ${key.padEnd(6)} ${ARABIC[key]}  strokes=${pathCount} dots=${dotCount} waypoints=${totalWP}`);
}

// ─── Generate letter-strokes.ts ─────────────────────────────────

function fmtPt(p: Point): string { return `{ x: ${p.x}, y: ${p.y} }`; }

let ts = `// ── Guided stroke data for Arabic letter tracing ─────────────────
// Each letter defined with ordered strokes (path or dot).
// Coordinates on a 280×280 viewBox. Letters centered and scaled
// to fill ~70-80% of the canvas. Strokes in Arabic writing order.
//
// AUTO-GENERATED by compute-centerlines.ts from letter-guide-paths.ts
// Centerlines: 2× rasterize → distance transform → skeleton → refinement → smooth.

export interface StrokePoint {
  x: number;
  y: number;
}

export interface LetterStroke {
  type: "path" | "dot";
  points: StrokePoint[];
}

export interface LetterStrokeData {
  strokes: LetterStroke[];
}

// ── Geometry helpers ─────────────────────────────────────────────

export function dist(a: StrokePoint, b: StrokePoint): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Sample a polyline at regular intervals to create checkpoints */
export function samplePath(
  points: StrokePoint[],
  spacing: number,
): StrokePoint[] {
  if (points.length < 2) return [...points];
  const samples: StrokePoint[] = [{ ...points[0] }];
  let carry = 0;

  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    let pos = carry;

    while (pos + spacing <= segLen) {
      pos += spacing;
      const t = pos / segLen;
      samples.push({
        x: points[i].x + dx * t,
        y: points[i].y + dy * t,
      });
    }
    carry = segLen - pos;
  }

  const last = points[points.length - 1];
  if (dist(samples[samples.length - 1], last) > 2) {
    samples.push({ ...last });
  }
  return samples;
}

/** Convert waypoints to SVG path \`d\` attribute (line segments) */
export function pointsToSvgPath(points: StrokePoint[]): string {
  if (points.length === 0) return "";
  return points
    .map(
      (p, i) =>
        \`\${i === 0 ? "M" : "L"} \${p.x.toFixed(1)} \${p.y.toFixed(1)}\`,
    )
    .join(" ");
}

/** Convert waypoints to smooth SVG path using Catmull-Rom → cubic bezier */
export function smoothSvgPath(points: StrokePoint[]): string {
  if (points.length === 0) return "";
  if (points.length === 1)
    return \`M \${points[0].x.toFixed(1)} \${points[0].y.toFixed(1)}\`;
  if (points.length === 2)
    return \`M \${points[0].x.toFixed(1)} \${points[0].y.toFixed(1)} L \${points[1].x.toFixed(1)} \${points[1].y.toFixed(1)}\`;

  let d = \`M \${points[0].x.toFixed(1)} \${points[0].y.toFixed(1)}\`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += \` C \${cp1x.toFixed(1)} \${cp1y.toFixed(1)}, \${cp2x.toFixed(1)} \${cp2y.toFixed(1)}, \${p2.x.toFixed(1)} \${p2.y.toFixed(1)}\`;
  }

  return d;
}

/** Sample points along a smooth Catmull-Rom curve for accurate checkpoints */
export function sampleSmoothPath(
  points: StrokePoint[],
  spacing: number,
): StrokePoint[] {
  if (points.length < 2) return [...points];

  const dense: StrokePoint[] = [];
  const STEPS_PER_SEG = 20;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    for (let s = 0; s <= (i === points.length - 2 ? STEPS_PER_SEG : STEPS_PER_SEG - 1); s++) {
      const t = s / STEPS_PER_SEG;
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y =
        0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      dense.push({ x, y });
    }
  }

  return samplePath(dense, spacing);
}

/** Get angle from point a to point b in degrees */
export function angleDeg(a: StrokePoint, b: StrokePoint): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

// ── Stroke data for all 28 Arabic letters (isolated form) ────────
// Coordinates tuned for a 280×280 viewBox. Each letter is centered
// and scaled to be clearly visible and easy to trace.
// Centerlines extracted from Amiri Naskh font guide outlines.

export const LETTER_STROKES: Record<string, LetterStrokeData> = {\n`;

for (const name of ORDER) {
  const data = results[name];
  const num = ORDER.indexOf(name) + 1;
  ts += `  // ${num}. ${name} ${ARABIC[name]}\n`;
  ts += `  ${name}: {\n    strokes: [\n`;
  for (const stroke of data.strokes) {
    ts += `      {\n        type: "${stroke.type}",\n        points: [\n`;
    for (const p of stroke.points) ts += `          ${fmtPt(p)},\n`;
    ts += `        ],\n      },\n`;
  }
  ts += `    ],\n  },\n\n`;
}

ts += `};\n`;

writeFileSync(resolve(__dirname, "..", "src", "lib", "letter-strokes.ts"), ts);
console.log("\n✅ src/lib/letter-strokes.ts updated");

// ─── Generate combined preview HTML ─────────────────────────────

let html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Letter Preview — Font Guide + Centerline</title>
<style>
  body { font-family: sans-serif; background: #f5f5f5; padding: 20px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; max-width: 1400px; margin: 0 auto; }
  .card { background: white; border-radius: 12px; padding: 12px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
  .card h3 { margin: 4px 0; font-size: 14px; }
  .arabic { font-size: 28px; font-family: 'Amiri', serif; }
  svg { border: 1px solid #e5e7eb; border-radius: 8px; background: #fafafa; }
</style></head><body>
<h1>Font Guide (gray) + Centerline (green dashed) + Waypoints</h1>
<p>Green dashed = centerline path. Blue = start. Red = end. Yellow = waypoints.</p>
<div class="grid">`;

for (const key of ORDER) {
  const guide = LETTER_GUIDE_PATHS[key];
  const data = results[key];
  let svg = "";

  if (guide) svg += `<path d="${guide.guidePath}" fill="#d4d0d5" stroke="none"/>`;

  for (const s of data.strokes) {
    if (s.type === "path") {
      const pts = s.points;
      if (pts.length >= 2) {
        // Build Catmull-Rom smooth path
        let d = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 0; i < pts.length - 1; i++) {
          const p0 = pts[Math.max(0, i - 1)];
          const p1 = pts[i];
          const p2 = pts[i + 1];
          const p3 = pts[Math.min(pts.length - 1, i + 2)];
          const c1x = p1.x + (p2.x - p0.x) / 6;
          const c1y = p1.y + (p2.y - p0.y) / 6;
          const c2x = p2.x - (p3.x - p1.x) / 6;
          const c2y = p2.y - (p3.y - p1.y) / 6;
          d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x} ${p2.y}`;
        }
        // Dashed centerline
        svg += `<path d="${d}" fill="none" stroke="#6B5B73" stroke-width="3" stroke-dasharray="6,4" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>`;
      }
      if (pts.length > 0) {
        svg += `<circle cx="${pts[0].x}" cy="${pts[0].y}" r="5" fill="#3B82F6"/>`;
        svg += `<circle cx="${pts[pts.length-1].x}" cy="${pts[pts.length-1].y}" r="5" fill="#EF4444"/>`;
      }
      for (let i = 1; i < pts.length - 1; i++) {
        svg += `<circle cx="${pts[i].x}" cy="${pts[i].y}" r="2" fill="#F59E0B"/>`;
      }
    } else {
      svg += `<circle cx="${s.points[0].x}" cy="${s.points[0].y}" r="6" fill="#6B5B73" opacity="0.7"/>`;
    }
  }

  html += `\n  <div class="card">
    <h3>${key} <span class="arabic">${ARABIC[key]}</span></h3>
    <svg width="200" height="200" viewBox="0 0 280 280">${svg}</svg>
  </div>`;
}

html += `\n</div></body></html>`;
writeFileSync(resolve(__dirname, "..", "preview-letters.html"), html);
console.log("✅ preview-letters.html generated");
