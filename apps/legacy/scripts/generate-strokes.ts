/**
 * Generate letter-strokes.ts from reference SVG centerline data.
 * Transforms from source 800×920 viewBox to our 280×280 viewBox,
 * aligning with guide path bounding boxes.
 *
 * Run: npx tsx scripts/generate-strokes.ts
 */

import { writeFileSync } from "fs";

// ── Raw SVG path data (800×920 viewBox) ──────────────────────────────

interface RefStroke {
  d: string;       // SVG path d attribute
  isDot: boolean;  // true if it's a ~1px circle (dot marker)
}

interface RefLetter {
  strokes: RefStroke[];
}

// Detect dot paths: tiny ~1px circle paths used for dots
function isDotPath(d: string): boolean {
  // Dot paths are tiny circles with ~1px diameter
  // They contain coordinates very close together (within 1 unit)
  const nums = d.match(/-?\d+\.?\d*/g)?.map(Number) || [];
  if (nums.length < 4) return false;
  const xs = nums.filter((_, i) => i % 2 === 0);
  const ys = nums.filter((_, i) => i % 2 === 1);
  const xRange = Math.max(...xs) - Math.min(...xs);
  const yRange = Math.max(...ys) - Math.min(...ys);
  return xRange < 3 && yRange < 3;
}

const SOURCE_PATHS: Record<string, RefLetter> = {
  alif: {
    strokes: [
      { d: "M409,279C421.286,372.143 428,543 428,590", isDot: false },
    ],
  },
  ba: {
    strokes: [
      { d: "M565.059,474.456C587.554,508.977 600.483,541.866 589.073,571.738C577.663,601.609 525.792,621.765 453.506,633.193C381.22,644.621 298.917,637.724 236.198,629.193C173.479,620.662 154.455,588.558 157.493,555.579C160.53,522.601 185.629,488.748 224.264,467.012C262.898,445.276 315.069,435.656 366.845,432.419C418.621,429.183 470.004,432.33 503.131,444.24C536.257,456.149 551.128,476.821 554.857,490.74C558.587,504.659 551.176,511.824 537.51,512.825C523.844,513.826 503.922,508.663 484.635,498.914C465.348,489.165 446.696,474.83 433.653,460.605C420.611,446.381 413.177,432.268 418.929,420.267C424.681,408.267 443.618,398.379 465.762,396.084C487.907,393.789 513.258,399.088 531.547,409.76C549.835,420.431 561.061,436.476 565.059,474.456Z", isDot: false },
      { d: "M403.5,637C403.5,637.276 403.276,637.5 403,637.5C402.724,637.5 402.5,637.276 402.5,637C402.5,636.724 402.724,636.5 403,636.5C403.276,636.5 403.5,636.724 403.5,637Z", isDot: true },
    ],
  },
  ta: {
    strokes: [
      { d: "M565.059,474.456C587.554,508.977 600.483,541.866 589.073,571.738C577.663,601.609 525.792,621.765 453.506,633.193C381.22,644.621 298.917,637.724 236.198,629.193C173.479,620.662 154.455,588.558 157.493,555.579C160.53,522.601 185.629,488.748 224.264,467.012C262.898,445.276 315.069,435.656 366.845,432.419C418.621,429.183 470.004,432.33 503.131,444.24C536.257,456.149 551.128,476.821 554.857,490.74C558.587,504.659 551.176,511.824 537.51,512.825C523.844,513.826 503.922,508.663 484.635,498.914C465.348,489.165 446.696,474.83 433.653,460.605C420.611,446.381 413.177,432.268 418.929,420.267C424.681,408.267 443.618,398.379 465.762,396.084C487.907,393.789 513.258,399.088 531.547,409.76C549.835,420.431 561.061,436.476 565.059,474.456Z", isDot: false },
      { d: "M440.5,389C440.5,389.276 440.276,389.5 440,389.5C439.724,389.5 439.5,389.276 439.5,389C439.5,388.724 439.724,388.5 440,388.5C440.276,388.5 440.5,388.724 440.5,389Z", isDot: true },
      { d: "M360.5,389C360.5,389.276 360.276,389.5 360,389.5C359.724,389.5 359.5,389.276 359.5,389C359.5,388.724 359.724,388.5 360,388.5C360.276,388.5 360.5,388.724 360.5,389Z", isDot: true },
    ],
  },
  tha: {
    strokes: [
      { d: "M565.059,474.456C587.554,508.977 600.483,541.866 589.073,571.738C577.663,601.609 525.792,621.765 453.506,633.193C381.22,644.621 298.917,637.724 236.198,629.193C173.479,620.662 154.455,588.558 157.493,555.579C160.53,522.601 185.629,488.748 224.264,467.012C262.898,445.276 315.069,435.656 366.845,432.419C418.621,429.183 470.004,432.33 503.131,444.24C536.257,456.149 551.128,476.821 554.857,490.74C558.587,504.659 551.176,511.824 537.51,512.825C523.844,513.826 503.922,508.663 484.635,498.914C465.348,489.165 446.696,474.83 433.653,460.605C420.611,446.381 413.177,432.268 418.929,420.267C424.681,408.267 443.618,398.379 465.762,396.084C487.907,393.789 513.258,399.088 531.547,409.76C549.835,420.431 561.061,436.476 565.059,474.456Z", isDot: false },
      { d: "M440.5,341C440.5,341.276 440.276,341.5 440,341.5C439.724,341.5 439.5,341.276 439.5,341C439.5,340.724 439.724,340.5 440,340.5C440.276,340.5 440.5,340.724 440.5,341Z", isDot: true },
      { d: "M400.5,301C400.5,301.276 400.276,301.5 400,301.5C399.724,301.5 399.5,301.276 399.5,301C399.5,300.724 399.724,300.5 400,300.5C400.276,300.5 400.5,300.724 400.5,301Z", isDot: true },
      { d: "M360.5,341C360.5,341.276 360.276,341.5 360,341.5C359.724,341.5 359.5,341.276 359.5,341C359.5,340.724 359.724,340.5 360,340.5C360.276,340.5 360.5,340.724 360.5,341Z", isDot: true },
    ],
  },
  jim: {
    strokes: [
      { d: "M287,468.113C340,427.61 389.5,467.613 484,468.113C369,482.112 311.508,571.481 302,621.612C291,679.61 318.5,787.11 540.5,738.61", isDot: false },
      { d: "M441,618.5C441,618.776 440.776,619 440.5,619C440.224,619 440,618.776 440,618.5C440,618.224 440.224,618 440.5,618C440.776,618 441,618.224 441,618.5Z", isDot: true },
    ],
  },
  ha: {
    strokes: [
      { d: "M287,468.113C340,427.61 389.5,467.613 484,468.113C369,482.112 311.508,571.481 302,621.612C291,679.61 318.5,787.11 540.5,738.61", isDot: false },
    ],
  },
  kha: {
    strokes: [
      { d: "M287,468.113C340,427.61 389.5,467.613 484,468.113C369,482.112 311.508,571.481 302,621.612C291,679.61 318.5,787.11 540.5,738.61", isDot: false },
      { d: "M401,348.5C401,348.776 400.776,349 400.5,349C400.224,349 400,348.776 400,348.5C400,348.224 400.224,348 400.5,348C400.776,348 401,348.224 401,348.5Z", isDot: true },
    ],
  },
  dal: {
    strokes: [
      { d: "M390.685,415C469.457,466.058 496.639,525.626 487.209,563.637C479.89,593.137 374.521,583.493 328,583.493", isDot: false },
    ],
  },
  dhal: {
    strokes: [
      { d: "M390.685,415C469.457,466.058 496.639,525.626 487.209,563.637C479.89,593.137 374.521,583.493 328,583.493", isDot: false },
      { d: "M358,352.5C358,352.776 357.776,353 357.5,353C357.224,353 357,352.776 357,352.5C357,352.224 357.224,352 357.5,352C357.776,352 358,352.224 358,352.5Z", isDot: true },
    ],
  },
  ra: {
    strokes: [
      { d: "M412.07,422.615C442.73,458.631 456.329,505.669 435.243,563.171C414.157,620.673 350.933,668.831 253.679,658.697", isDot: false },
    ],
  },
  zay: {
    strokes: [
      { d: "M404.958,422.04C435.576,458.092 449.121,505.145 427.97,562.622C406.818,620.1 343.538,668.186 246.295,657.94", isDot: false },
      { d: "M384.385,354.911C384.336,355.183 384.077,355.364 383.805,355.316C383.533,355.268 383.352,355.008 383.4,354.736C383.448,354.465 383.708,354.283 383.98,354.332C384.252,354.38 384.433,354.639 384.385,354.911Z", isDot: true },
    ],
  },
  sin: {
    strokes: [
      { d: "M632.36,483.001C669.418,554.976 649.871,581.277 608.332,581.277C566.794,581.277 526.02,483 526.02,483C539.102,555.399 544.753,581.277 491.048,581.277C437.343,581.277 412.451,483.001 412.451,483.001C412.451,483.001 428.187,592.434 404.306,651.084C376.207,720.096 256.952,734.307 196.377,696.588C141.86,662.642 162.335,584.402 188.477,524.387", isDot: false },
    ],
  },
  shin: {
    strokes: [
      { d: "M632.36,483.001C669.418,554.976 649.871,581.277 608.332,581.277C566.794,581.277 526.02,483 526.02,483C539.102,555.399 544.753,581.277 491.048,581.277C437.343,581.277 412.451,483.001 412.451,483.001C412.451,483.001 428.187,592.434 404.306,651.084C376.207,720.096 256.952,734.307 196.377,696.588C141.86,662.642 162.335,584.402 188.477,524.387", isDot: false },
      { d: "M559,381.5C559,381.776 558.776,382 558.5,382C558.224,382 558,381.776 558,381.5C558,381.224 558.224,381 558.5,381C558.776,381 559,381.224 559,381.5Z", isDot: true },
      { d: "M509,311.5C509,311.776 508.776,312 508.5,312C508.224,312 508,311.776 508,311.5C508,311.224 508.224,311 508.5,311C508.776,311 509,311.224 509,311.5Z", isDot: true },
      { d: "M459,381.5C459,381.776 458.776,382 458.5,382C458.224,382 458,381.776 458,381.5C458,381.224 458.224,381 458.5,381C458.776,381 459,381.224 459,381.5Z", isDot: true },
    ],
  },
  sad: {
    strokes: [
      { d: "M441,570C498.575,488.497 535.858,448.383 572.869,442.01C625.462,432.954 662,486.684 662,527.739C662,568.794 619.372,570 598.335,570C567.333,570 436.682,570 378,570", isDot: false },
      { d: "M336.655,492C371.411,534.278 389.617,603.223 380.79,655.908C371.963,708.592 230.178,740.463 176.664,702.088C113.172,656.558 138.597,575.255 176.664,492", isDot: false },
    ],
  },
  dad: {
    strokes: [
      { d: "M441,570C498.575,488.497 535.858,448.383 572.869,442.01C625.462,432.954 662,486.684 662,527.739C662,568.794 619.372,570 598.335,570C567.333,570 436.682,570 378,570", isDot: false },
      { d: "M336.655,492C371.411,534.278 389.617,603.223 380.79,655.908C371.963,708.592 230.178,740.463 176.664,702.088C113.172,656.558 138.597,575.255 176.664,492", isDot: false },
      { d: "M509,311.5C509,311.776 508.776,312 508.5,312C508.224,312 508,311.776 508,311.5C508,311.224 508.224,311 508.5,311C508.776,311 509,311.224 509,311.5Z", isDot: true },
    ],
  },
  taa: {
    strokes: [
      { d: "M344,568C401.575,486.497 438.858,446.383 475.869,440.01C528.462,430.954 565,484.684 565,525.739C565,566.794 522.372,568 501.335,568C470.333,568 299.682,568 241,568", isDot: false },
      { d: "M333,244C343.8,311.44 345,455.192 345,567", isDot: false },
    ],
  },
  dhaa: {
    strokes: [
      { d: "M344,568C401.575,486.497 438.858,446.383 475.869,440.01C528.462,430.954 565,484.684 565,525.739C565,566.794 522.372,568 501.335,568C470.333,568 299.682,568 241,568", isDot: false },
      { d: "M333,244C343.8,311.44 345,455.192 345,567", isDot: false },
      { d: "M446,339.5C446,339.776 445.776,340 445.5,340C445.224,340 445,339.776 445,339.5C445,339.224 445.224,339 445.5,339C445.776,339 446,339.224 446,339.5Z", isDot: true },
    ],
  },
  ayn: {
    strokes: [
      { d: "M446.952,338.247C365.452,318.747 324.452,358.247 318.952,380.747C310.397,415.747 325.026,437.856 381.5,448.247C422,455.7 474.258,448.247 474.258,448.247C474.258,448.247 356.758,495.747 312.258,573.247C272.241,642.94 302.758,740.747 502.758,712.747", isDot: false },
    ],
  },
  ghayn: {
    strokes: [
      { d: "M446.952,338.247C365.452,318.747 324.452,358.247 318.952,380.747C310.397,415.747 325.026,437.856 381.5,448.247C422,455.7 474.258,448.247 474.258,448.247C474.258,448.247 356.758,495.747 312.258,573.247C272.241,642.94 302.758,740.747 502.758,712.747", isDot: false },
      { d: "M381,245.5C381,245.776 380.776,246 380.5,246C380.224,246 380,245.776 380,245.5C380,245.224 380.224,245 380.5,245C380.776,245 381,245.224 381,245.5Z", isDot: true },
    ],
  },
  fa: {
    strokes: [
      { d: "M597.062,466.754C559.712,487.07 493.047,487.07 477.233,466.754C461.42,446.438 498.903,365.174 547.515,368.076C596.126,370.978 612.799,507.891 583.515,570C564.078,570 389.072,570 288.921,570C188.77,570 187.012,513.695 224.496,437.655", isDot: false },
      { d: "M521,275.5C521,275.776 520.776,276 520.5,276C520.224,276 520,275.776 520,275.5C520,275.224 520.224,275 520.5,275C520.776,275 521,275.224 521,275.5Z", isDot: true },
    ],
  },
  qaf: {
    strokes: [
      { d: "M576.303,479.013C531.241,507.397 450.621,502.666 432.187,479.013C413.752,455.359 457.768,364.713 514.437,368.092C571.106,371.471 598.414,530.287 562.227,598.545C526.041,666.802 379.524,690.455 297.592,667.478C215.661,644.5 197.911,557.996 251.85,456.623", isDot: false },
      { d: "M541,275.5C541,275.776 540.776,276 540.5,276C540.224,276 540,275.776 540,275.5C540,275.224 540.224,275 540.5,275C540.776,275 541,275.224 541,275.5Z", isDot: true },
      { d: "M461,275.5C461,275.776 460.776,276 460.5,276C460.224,276 460,275.776 460,275.5C460,275.224 460.224,275 460.5,275C460.776,275 461,275.224 461,275.5Z", isDot: true },
    ],
  },
  kaf: {
    strokes: [
      { d: "M547.844,208C559.12,294.218 574.09,493.389 571.757,568C503.516,568 392.114,568 307.542,568C222.97,568 212.471,514.529 245.133,434.943", isDot: false },
      { d: "M421.664,336.088C360.657,333.6 343.227,384.604 370.535,398.288C387.384,406.731 427.281,402.849 442,398.288C421.277,408.862 377.391,442.077 365.305,458", isDot: false },
    ],
  },
  lam: {
    strokes: [
      { d: "M481.663,291C491.329,360.333 503.475,536 502.475,590C501.475,644 432.975,686.166 359.475,669.5C285.975,652.834 286.975,590 313.475,523", isDot: false },
    ],
  },
  mim: {
    strokes: [
      { d: "M313.019,398.427C336.016,332.022 397.142,338.662 424.981,369.449C452.819,400.236 457.056,431.628 497,457.587C463.714,451.55 401.378,436.458 354.172,449.739C306.967,463.02 297.284,497.43 305.757,557.194C314.229,616.959 321.492,686.383 324.518,722", isDot: false },
    ],
  },
  nun: {
    strokes: [
      { d: "M495.245,473C542.56,567.108 542.56,604.014 535.801,647.07C459.606,703.043 333.639,733.797 282.638,675.979C231.637,618.161 283.252,516.056 310.289,473", isDot: false },
      { d: "M401,395.5C401,395.776 400.776,396 400.5,396C400.224,396 400,395.776 400,395.5C400,395.224 400.224,395 400.5,395C400.776,395 401,395.224 401,395.5Z", isDot: true },
    ],
  },
  haa: {
    strokes: [
      { d: "M413.028,375C536.068,378.473 566.105,501.756 560.329,548.639C554.552,595.521 408.984,550.954 376.636,524.33C344.287,497.705 399.164,417.831 451.731,420.725C504.297,423.619 521.562,577 376.636,577C320.604,577 276.125,577 238,577", isDot: false },
    ],
  },
  waw: {
    strokes: [
      { d: "M478.873,562.057C443.044,581.683 378.731,575.027 363.561,555.401C348.392,535.775 384.35,457.269 430.983,460.073C477.616,462.877 493.048,585.608 464.956,645.608C436.864,705.609 374.499,724.674 320,719.067", isDot: false },
    ],
  },
  ya: {
    strokes: [
      { d: "M548.651,467.765C547.155,534.979 509.637,590.027 442.549,618.756C375.461,647.485 278.803,649.896 221.648,621.411C164.493,592.927 146.84,533.548 173.131,486.694C199.421,439.84 269.654,405.511 340.14,389.992C410.626,374.472 481.365,377.762 530.135,395.753C578.905,413.744 605.706,446.437 602.958,483.16C600.211,519.882 567.913,560.635 518.707,588.093C469.501,615.551 403.386,629.715 347.476,628.139C291.566,626.563 245.861,609.247 215.506,581.948C185.151,554.649 170.147,517.366 169.009,481.044C167.872,444.722 180.601,409.361 206.012,381.635C231.423,353.91 269.518,333.819 307.78,321.923C346.043,310.027 384.473,306.326 417.458,309.614C450.443,312.902 477.984,323.178 498.479,338.62C518.975,354.062 532.424,374.671 540.63,397.744C548.836,420.817 551.798,446.354 548.651,467.765Z", isDot: false },
      { d: "M420.5,788.5C420.5,788.776 420.276,789 420,789C419.724,789 419.5,788.776 419.5,788.5C419.5,788.224 419.724,788 420,788C420.276,788 420.5,788.224 420.5,788.5Z", isDot: true },
      { d: "M342.5,788.5C342.5,788.776 342.276,789 342,789C341.724,789 341.5,788.776 341.5,788.5C341.5,788.224 341.724,788 342,788C342.276,788 342.5,788.224 342.5,788.5Z", isDot: true },
    ],
  },
};

// ── SVG path parsing ────────────────────────────────────────────────

interface Point { x: number; y: number; }

function parseSvgPath(d: string): Point[] {
  // Tokenize: split on commands, keeping numbers
  const tokens: string[] = [];
  const re = /([MmCcLlSsQqTtAaHhVvZz])|(-?\d+\.?\d*(?:e[+-]?\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    tokens.push(m[0]);
  }

  const points: Point[] = [];
  let cx = 0, cy = 0;
  let i = 0;

  function readNum(): number {
    return parseFloat(tokens[i++]);
  }

  function hasNum(): boolean {
    return i < tokens.length && !isNaN(parseFloat(tokens[i]));
  }

  while (i < tokens.length) {
    const cmd = tokens[i++];

    if (cmd === "M") {
      cx = readNum(); cy = readNum();
      points.push({ x: cx, y: cy });
      while (hasNum()) {
        cx = readNum(); cy = readNum();
        points.push({ x: cx, y: cy });
      }
    } else if (cmd === "C") {
      while (hasNum()) {
        const cp1x = readNum(), cp1y = readNum();
        const cp2x = readNum(), cp2y = readNum();
        const ex = readNum(), ey = readNum();
        const STEPS = 16;
        for (let s = 1; s <= STEPS; s++) {
          const t = s / STEPS;
          const t1 = 1 - t;
          const x = t1*t1*t1*cx + 3*t1*t1*t*cp1x + 3*t1*t*t*cp2x + t*t*t*ex;
          const y = t1*t1*t1*cy + 3*t1*t1*t*cp1y + 3*t1*t*t*cp2y + t*t*t*ey;
          points.push({ x, y });
        }
        cx = ex; cy = ey;
      }
    } else if (cmd === "Q") {
      while (hasNum()) {
        const cpx = readNum(), cpy = readNum();
        const ex = readNum(), ey = readNum();
        const STEPS = 8;
        for (let s = 1; s <= STEPS; s++) {
          const t = s / STEPS;
          const t1 = 1 - t;
          const x = t1*t1*cx + 2*t1*t*cpx + t*t*ex;
          const y = t1*t1*cy + 2*t1*t*cpy + t*t*ey;
          points.push({ x, y });
        }
        cx = ex; cy = ey;
      }
    } else if (cmd === "L") {
      while (hasNum()) {
        cx = readNum(); cy = readNum();
        points.push({ x: cx, y: cy });
      }
    } else if (cmd === "Z" || cmd === "z") {
      // Close path — skip
    }
  }

  return points;
}

function getBBox(points: Point[]): { minX: number; minY: number; maxX: number; maxY: number; } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

// Parse guide path — use only first sub-path (main body) for bbox
// This prevents dot/diacritic sub-paths from inflating the bbox
function parseGuideBBox(guidePath: string): { minX: number; minY: number; maxX: number; maxY: number; } {
  // Split at "Z" and use only the first sub-path
  const firstSubPath = guidePath.split(/Z/i)[0] + "Z";
  const points = parseSvgPath(firstSubPath);
  return getBBox(points);
}

// ── Guide path bounding boxes (from letter-guide-paths.ts) ─────────
import { LETTER_GUIDE_PATHS } from "../src/lib/letter-guide-paths";

// ── Manual centerline overrides for letters with different shapes ───
// These letters have source shapes too different from Amiri outlines.
// Centerlines manually traced through the Amiri guide path centers.
type ManualStroke = { type: "path" | "dot"; points: Point[] };

const MANUAL_OVERRIDES: Record<string, ManualStroke[]> = {
  // ba ب — flat bowl opening right, dot below
  ba: [
    { type: "path", points: [
      { x: 245, y: 58 }, { x: 250, y: 78 }, { x: 250, y: 100 },
      { x: 240, y: 118 }, { x: 220, y: 132 }, { x: 195, y: 142 },
      { x: 165, y: 150 }, { x: 130, y: 150 }, { x: 95, y: 142 },
      { x: 65, y: 125 }, { x: 45, y: 105 }, { x: 40, y: 82 },
    ] },
    { type: "dot", points: [{ x: 148, y: 215 }] },
  ],
  // ta ت — same bowl shifted down, 2 dots above
  ta: [
    { type: "path", points: [
      { x: 245, y: 112 }, { x: 250, y: 132 }, { x: 250, y: 154 },
      { x: 240, y: 172 }, { x: 220, y: 186 }, { x: 195, y: 196 },
      { x: 165, y: 204 }, { x: 130, y: 204 }, { x: 95, y: 196 },
      { x: 65, y: 179 }, { x: 45, y: 159 }, { x: 40, y: 136 },
    ] },
    { type: "dot", points: [{ x: 155, y: 82 }] },
    { type: "dot", points: [{ x: 122, y: 82 }] },
  ],
  // tha ث — same bowl shifted down more, 3 dots above (triangle)
  tha: [
    { type: "path", points: [
      { x: 245, y: 127 }, { x: 250, y: 147 }, { x: 250, y: 169 },
      { x: 240, y: 187 }, { x: 220, y: 201 }, { x: 195, y: 211 },
      { x: 165, y: 219 }, { x: 130, y: 219 }, { x: 95, y: 211 },
      { x: 65, y: 194 }, { x: 45, y: 174 }, { x: 40, y: 151 },
    ] },
    { type: "dot", points: [{ x: 150, y: 94 }] },
    { type: "dot", points: [{ x: 133, y: 63 }] },
    { type: "dot", points: [{ x: 116, y: 94 }] },
  ],
  // jim ج, ha ح, kha خ — use source SVG data (bbox-mapped to guide)
  // ya ي — S-curve from top-right to bottom-left, 2 dots below
  ya: [
    { type: "path", points: [
      { x: 220, y: 30 }, { x: 210, y: 42 }, { x: 192, y: 52 },
      { x: 170, y: 68 }, { x: 155, y: 88 }, { x: 160, y: 105 },
      { x: 185, y: 112 }, { x: 210, y: 125 }, { x: 205, y: 145 },
      { x: 185, y: 158 }, { x: 155, y: 168 }, { x: 120, y: 170 },
      { x: 85, y: 160 }, { x: 62, y: 140 }, { x: 55, y: 110 },
      { x: 65, y: 80 },
    ] },
    { type: "dot", points: [{ x: 138, y: 238 }] },
    { type: "dot", points: [{ x: 110, y: 250 }] },
  ],
};

// ── Transform source paths to our coordinate system ─────────────────

function transformLetter(
  key: string,
  source: RefLetter,
): { strokes: Array<{ type: "path" | "dot"; points: Point[] }> } {
  const guide = LETTER_GUIDE_PATHS[key];
  if (!guide) {
    console.warn(`No guide path for ${key}, using simple scale`);
    // Fallback: simple scale from 800×920 to 280×280
    const sx = 280 / 800;
    const sy = 280 / 920;
    const s = Math.min(sx, sy);
    const ox = (280 - 800 * s) / 2;
    const oy = (280 - 920 * s) / 2;
    return {
      strokes: source.strokes.map((stroke) => {
        if (stroke.isDot) {
          const pts = parseSvgPath(stroke.d);
          const center = pts.length > 0
            ? { x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length }
            : { x: 400, y: 460 };
          return { type: "dot" as const, points: [{ x: Math.round(center.x * s + ox), y: Math.round(center.y * s + oy) }] };
        }
        const pts = parseSvgPath(stroke.d);
        const sampled = sampleEvenly(pts, 12);
        return { type: "path" as const, points: sampled.map(p => ({ x: round1(p.x * s + ox), y: round1(p.y * s + oy) })) };
      }),
    };
  }

  // Get guide path bbox
  const guideBBox = parseGuideBBox(guide.guidePath);

  // Collect all non-dot path points to compute source bbox
  const allSrcPathPts: Point[] = [];
  for (const stroke of source.strokes) {
    if (!stroke.isDot) {
      allSrcPathPts.push(...parseSvgPath(stroke.d));
    }
  }
  const srcBBox = getBBox(allSrcPathPts);

  // Compute scale + offset to map source bbox → guide bbox
  // Add small padding to guide bbox
  const pad = 4;
  const gw = (guideBBox.maxX - guideBBox.minX) - pad * 2;
  const gh = (guideBBox.maxY - guideBBox.minY) - pad * 2;
  const sw = srcBBox.maxX - srcBBox.minX;
  const sh = srcBBox.maxY - srcBBox.minY;

  // Uniform scale to fit, preserving aspect ratio
  const scale = Math.min(gw / (sw || 1), gh / (sh || 1));

  // Center within guide bbox
  const srcCx = (srcBBox.minX + srcBBox.maxX) / 2;
  const srcCy = (srcBBox.minY + srcBBox.maxY) / 2;
  const dstCx = (guideBBox.minX + guideBBox.maxX) / 2;
  const dstCy = (guideBBox.minY + guideBBox.maxY) / 2;

  function mapPoint(p: Point): Point {
    return {
      x: round1((p.x - srcCx) * scale + dstCx),
      y: round1((p.y - srcCy) * scale + dstCy),
    };
  }

  const result: Array<{ type: "path" | "dot"; points: Point[] }> = [];

  for (const stroke of source.strokes) {
    if (stroke.isDot) {
      const pts = parseSvgPath(stroke.d);
      const center = pts.length > 0
        ? { x: pts.reduce((a, p) => a + p.x, 0) / pts.length, y: pts.reduce((a, p) => a + p.y, 0) / pts.length }
        : { x: 400, y: 460 };
      result.push({ type: "dot", points: [mapPoint(center)] });
    } else {
      const pts = parseSvgPath(stroke.d);
      const numSamples = Math.max(8, Math.min(20, Math.round(pathLength(pts) * scale / 12)));
      const sampled = sampleEvenly(pts, numSamples);
      result.push({ type: "path", points: sampled.map(mapPoint) });
    }
  }

  return { strokes: result };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function pathLength(pts: Point[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    len += Math.sqrt(dx * dx + dy * dy);
  }
  return len;
}

function sampleEvenly(pts: Point[], n: number): Point[] {
  if (pts.length < 2 || n < 2) return pts.slice(0, Math.max(1, n));
  const totalLen = pathLength(pts);
  const spacing = totalLen / (n - 1);
  const result: Point[] = [{ ...pts[0] }];
  let distSinceLastSample = 0;

  for (let i = 0; i < pts.length - 1 && result.length < n - 1; i++) {
    const dx = pts[i + 1].x - pts[i].x;
    const dy = pts[i + 1].y - pts[i].y;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    if (segLen < 0.001) continue;
    let pos = 0;

    while (result.length < n - 1) {
      const remaining = spacing - distSinceLastSample;
      if (pos + remaining > segLen + 0.001) {
        distSinceLastSample += segLen - pos;
        break;
      }
      pos += remaining;
      distSinceLastSample = 0;
      const t = Math.min(pos / segLen, 1);
      result.push({
        x: pts[i].x + dx * t,
        y: pts[i].y + dy * t,
      });
    }
  }

  // Always include last point
  result.push({ ...pts[pts.length - 1] });
  return result;
}

// ── Generate output ─────────────────────────────────────────────────

const ORDER = [
  "alif", "ba", "ta", "tha", "jim", "ha", "kha", "dal", "dhal", "ra", "zay",
  "sin", "shin", "sad", "dad", "taa", "dhaa", "ayn", "ghayn", "fa", "qaf",
  "kaf", "lam", "mim", "nun", "haa", "waw", "ya",
];

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

let output = `// ── Guided stroke data for Arabic letter tracing ─────────────────
// Each letter defined with ordered strokes (path or dot).
// Coordinates on a 280×280 viewBox. Letters centered and scaled
// to fill ~70-80% of the canvas. Strokes in Arabic writing order.
//
// Generated from reference SVG centerline data,
// transformed to align with Amiri font guide outlines.

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
// Centerlines derived from reference SVG data, mapped to Amiri outlines.

export const LETTER_STROKES: Record<string, LetterStrokeData> = {
`;

for (const key of ORDER) {
  const source = SOURCE_PATHS[key];
  if (!source) {
    console.warn(`Missing source data for: ${key}`);
    continue;
  }

  // Use manual override if available, otherwise transform from source
  const manual = MANUAL_OVERRIDES[key];
  const transformed = manual
    ? { strokes: manual }
    : transformLetter(key, source);
  const arabic = ARABIC[key] || "?";

  output += `  // ${key} ${arabic}\n`;
  output += `  ${key}: {\n`;
  output += `    strokes: [\n`;

  for (const stroke of transformed.strokes) {
    output += `      {\n`;
    output += `        type: "${stroke.type}",\n`;
    output += `        points: [\n`;
    for (const p of stroke.points) {
      output += `          { x: ${p.x}, y: ${p.y} },\n`;
    }
    output += `        ],\n`;
    output += `      },\n`;
  }

  output += `    ],\n`;
  output += `  },\n`;
}

output += `};\n`;

writeFileSync("src/lib/letter-strokes.ts", output);
console.log("✅ Generated src/lib/letter-strokes.ts");

// Also regenerate preview
console.log("Run: npx tsx scripts/preview-letters.ts  to update preview");
