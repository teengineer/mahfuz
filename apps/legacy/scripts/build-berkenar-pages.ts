/**
 * Generates berkenar (traditional Ottoman/Turkish) page layout.
 * Each juz = exactly 20 pages → 30 juz × 20 = 600 total pages.
 * Verses are distributed within each juz proportionally by character count.
 *
 * Usage: npx tsx scripts/build-berkenar-pages.ts
 * Output: public/berkenar/pages.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");

interface TanzilVerse {
  v: number;
  t: string;
  p: number;
  j: number;
  h: number;
  rk: number;
  m: number;
  sj?: number;
}

interface TanzilSurahData {
  verses: TanzilVerse[];
}

interface QuranMeta {
  chapters: { id: number; verses_count: number; pages: [number, number] }[];
  juzBoundaries: Record<string, { start: string; end: string }>;
}

// Load metadata
const meta: QuranMeta = JSON.parse(
  readFileSync(join(ROOT, "src/data/quran-meta.json"), "utf-8"),
);

// Load all surah texts
function loadSurah(id: number): TanzilSurahData {
  return JSON.parse(
    readFileSync(join(ROOT, `public/quran/uthmani/${id}.json`), "utf-8"),
  );
}

interface VerseInfo {
  key: string; // "surahId:verseNum"
  surahId: number;
  charCount: number;
}

// Collect all verses for a juz
function getJuzVerses(juzNumber: number): VerseInfo[] {
  const boundary = meta.juzBoundaries[String(juzNumber)];
  if (!boundary) throw new Error(`No boundary for juz ${juzNumber}`);

  const [startSura, startAya] = boundary.start.split(":").map(Number);
  const [endSura, endAya] = boundary.end.split(":").map(Number);

  const verses: VerseInfo[] = [];
  for (let surahId = startSura; surahId <= endSura; surahId++) {
    const data = loadSurah(surahId);
    for (const tv of data.verses) {
      if (surahId === startSura && tv.v < startAya) continue;
      if (surahId === endSura && tv.v > endAya) continue;
      verses.push({
        key: `${surahId}:${tv.v}`,
        surahId,
        charCount: tv.t.length,
      });
    }
  }
  return verses;
}

// Distribute verses into N pages using greedy algorithm
function distributeToPages(verses: VerseInfo[], pageCount: number): VerseInfo[][] {
  if (verses.length === 0) return Array.from({ length: pageCount }, () => []);

  const totalChars = verses.reduce((sum, v) => sum + v.charCount, 0);
  const targetPerPage = totalChars / pageCount;

  const pages: VerseInfo[][] = [];
  let currentPage: VerseInfo[] = [];
  let currentChars = 0;
  let pagesRemaining = pageCount;

  for (let i = 0; i < verses.length; i++) {
    const verse = verses[i];
    currentPage.push(verse);
    currentChars += verse.charCount;

    const versesRemaining = verses.length - i - 1;

    // Should we break to a new page?
    if (pagesRemaining > 1 && versesRemaining > 0) {
      // Break if we've met or exceeded the target for this page
      if (currentChars >= targetPerPage * 0.85) {
        // Check if adding next verse would overshoot more than current undershoot
        const overshoot = currentChars - targetPerPage;
        const nextCharCount = verses[i + 1]?.charCount ?? 0;
        const undershootIfBreak = targetPerPage - currentChars;

        if (overshoot >= 0 || (undershootIfBreak < nextCharCount * 0.5)) {
          pages.push(currentPage);
          currentPage = [];
          currentChars = 0;
          pagesRemaining--;
        }
      }
    }
  }

  // Push remaining verses to last page
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  // Pad if somehow we have fewer pages (shouldn't happen with real data)
  while (pages.length < pageCount) {
    pages.push([]);
  }

  // If we have more pages than expected, merge the extras into the last page
  while (pages.length > pageCount) {
    const extra = pages.pop()!;
    pages[pages.length - 1].push(...extra);
  }

  return pages;
}

// Build the full berkenar mapping
interface BerkenarPagesData {
  totalPages: number;
  pages: Record<string, string[]>;
  pageToSurahs: Record<string, number[]>;
  verseToPage: Record<string, number>;
}

function build(): BerkenarPagesData {
  const PAGES_PER_JUZ = 20;
  const result: BerkenarPagesData = {
    totalPages: 600,
    pages: {},
    pageToSurahs: {},
    verseToPage: {},
  };

  let globalPage = 0;

  for (let juz = 1; juz <= 30; juz++) {
    const juzVerses = getJuzVerses(juz);
    const juzPages = distributeToPages(juzVerses, PAGES_PER_JUZ);

    for (let p = 0; p < PAGES_PER_JUZ; p++) {
      globalPage++;
      const versesOnPage = juzPages[p];
      const verseKeys = versesOnPage.map((v) => v.key);
      const surahIds = [...new Set(versesOnPage.map((v) => v.surahId))];

      result.pages[String(globalPage)] = verseKeys;
      result.pageToSurahs[String(globalPage)] = surahIds;

      for (const vk of verseKeys) {
        result.verseToPage[vk] = globalPage;
      }
    }
  }

  return result;
}

// Run
console.log("Building berkenar page layout...");
const data = build();

// Validate
let totalVerses = 0;
for (const [pageNum, keys] of Object.entries(data.pages)) {
  totalVerses += keys.length;
  if (keys.length === 0) {
    console.warn(`  Warning: page ${pageNum} has 0 verses`);
  }
}
console.log(`  Total pages: ${data.totalPages}`);
console.log(`  Total verses mapped: ${totalVerses}`);
console.log(`  Total unique verse-to-page entries: ${Object.keys(data.verseToPage).length}`);

// Verify each juz has exactly 20 pages
for (let juz = 1; juz <= 30; juz++) {
  const startPage = (juz - 1) * 20 + 1;
  const endPage = juz * 20;
  let juzVerses = 0;
  for (let p = startPage; p <= endPage; p++) {
    juzVerses += (data.pages[String(p)] || []).length;
  }
  if (juzVerses === 0) {
    console.error(`  ERROR: juz ${juz} has 0 verses!`);
  }
}

// Write output
const outDir = join(ROOT, "public/berkenar");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "pages.json");
writeFileSync(outPath, JSON.stringify(data));
console.log(`  Written to: ${outPath}`);
console.log(`  File size: ${(readFileSync(outPath).length / 1024).toFixed(1)} KB`);
console.log("Done!");
