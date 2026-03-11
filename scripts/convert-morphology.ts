/**
 * Convert Quranic Arabic Corpus morphology data (mustafa0x/quran-morphology)
 * into per-surah JSON files and a root index.
 *
 * Input:  scripts/morphology-source/quran-morphology.txt
 * Output: apps/web/public/quran/morphology/{1-114}.json
 *         apps/web/public/quran/roots.json
 *
 * Usage: npx tsx scripts/convert-morphology.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

// ---------- Paths ----------
const ROOT_DIR = join(import.meta.dirname, "..");
const INPUT = join(ROOT_DIR, "scripts/morphology-source/quran-morphology.txt");
const OUT_MORPH = join(ROOT_DIR, "apps/web/public/quran/morphology");
const OUT_ROOTS = join(ROOT_DIR, "apps/web/public/quran/roots.json");
const OUT_ENRICHMENT = join(ROOT_DIR, "apps/web/public/quran/enrichment");

// ---------- Feature parsing ----------

interface ParsedFeatures {
  root?: string;
  lemma?: string;
  per?: 1 | 2 | 3;
  gen?: "M" | "F";
  num?: "S" | "D" | "P";
  cas?: "NOM" | "ACC" | "GEN";
  mood?: "IND" | "SUBJ" | "JUS";
  state?: "DEF" | "INDEF";
  voice?: "ACT" | "PASS";
  form?: number;
  asp?: "PERF" | "IMPF" | "IMPV";
  der?: "VN" | "AP" | "PP";
  isPrefix?: boolean;
  isSuffix?: boolean;
  isPron?: boolean;
}

function parseFeatures(featStr: string): ParsedFeatures {
  const result: ParsedFeatures = {};
  const parts = featStr.split("|");

  for (const part of parts) {
    // ROOT:xxx
    if (part.startsWith("ROOT:")) {
      result.root = part.slice(5);
      continue;
    }
    // LEM:xxx
    if (part.startsWith("LEM:")) {
      result.lemma = part.slice(4);
      continue;
    }
    // VF:n (verb form)
    if (part.startsWith("VF:")) {
      result.form = parseInt(part.slice(3), 10);
      continue;
    }
    // MOOD:xxx
    if (part.startsWith("MOOD:")) {
      const m = part.slice(5);
      if (m === "IND" || m === "SUBJ" || m === "JUS") result.mood = m;
      continue;
    }
    // FAM:xxx — ignore
    if (part.startsWith("FAM:")) continue;

    // Simple flags
    switch (part) {
      // Person
      case "1S": result.per = 1; result.num = "S"; break;
      case "2MS": result.per = 2; result.gen = "M"; result.num = "S"; break;
      case "2FS": result.per = 2; result.gen = "F"; result.num = "S"; break;
      case "3MS": result.per = 3; result.gen = "M"; result.num = "S"; break;
      case "3FS": result.per = 3; result.gen = "F"; result.num = "S"; break;
      case "2D": result.per = 2; result.num = "D"; break;
      case "3MD": result.per = 3; result.gen = "M"; result.num = "D"; break;
      case "3FD": result.per = 3; result.gen = "F"; result.num = "D"; break;
      case "1P": result.per = 1; result.num = "P"; break;
      case "2MP": result.per = 2; result.gen = "M"; result.num = "P"; break;
      case "2FP": result.per = 2; result.gen = "F"; result.num = "P"; break;
      case "3MP": result.per = 3; result.gen = "M"; result.num = "P"; break;
      case "3FP": result.per = 3; result.gen = "F"; result.num = "P"; break;
      // Gender
      case "M": result.gen = "M"; break;
      case "F": result.gen = "F"; break;
      // Number
      case "MS": result.gen = "M"; result.num = "S"; break;
      case "FS": result.gen = "F"; result.num = "S"; break;
      case "MD": result.gen = "M"; result.num = "D"; break;
      case "FD": result.gen = "F"; result.num = "D"; break;
      case "MP": result.gen = "M"; result.num = "P"; break;
      case "FP": result.gen = "F"; result.num = "P"; break;
      // Case
      case "NOM": result.cas = "NOM"; break;
      case "ACC": result.cas = "ACC"; break;
      case "GEN": result.cas = "GEN"; break;
      // State
      case "DEF": result.state = "DEF"; break;
      case "INDEF": result.state = "INDEF"; break;
      // Voice
      case "PASS": result.voice = "PASS"; break;
      case "ACT": result.voice = "ACT"; break;
      // Aspect
      case "PERF": result.asp = "PERF"; break;
      case "IMPF": result.asp = "IMPF"; break;
      case "IMPV": result.asp = "IMPV"; break;
      // Derivation
      case "ACT_PCPL": result.der = "AP"; break;
      case "PASS_PCPL": result.der = "PP"; break;
      case "VN": result.der = "VN"; break;
      // Morpheme flags
      case "PREF": result.isPrefix = true; break;
      case "SUFF": result.isSuffix = true; break;
      // POS shortcuts handled by caller
      case "PRON": result.isPron = true; break;
      default:
        break;
    }
  }
  return result;
}

function determinePrimaryPos(posCol: string, features: ParsedFeatures): string {
  if (posCol === "V") return "V";
  if (posCol === "P") {
    // Check features for more specific POS
    const parts = features.lemma ? [] : [];
    // P column items can be: P, CONJ, DET, NEG, DIST, ADDR, REM, etc.
    // The feature string has the real tag
    return "P"; // default, refined below
  }
  if (posCol === "N") {
    if (features.isPron) return "PRON";
    return "N";
  }
  return posCol;
}

// ---------- Types for in-memory structures ----------

interface MorphemeLine {
  surah: number;
  verse: number;
  wordGroup: number;
  morphemeIdx: number;
  arabicText: string;
  posCol: string;
  features: string;
}

interface WordData {
  position: number;
  arabicText: string;
  root?: string;
  lemma?: string;
  pos: string;
  morphemes: Array<{ ar: string; pos: string; prefix?: true; suffix?: true }>;
  features: {
    per?: 1 | 2 | 3;
    gen?: "M" | "F";
    num?: "S" | "D" | "P";
    cas?: "NOM" | "ACC" | "GEN";
    mood?: "IND" | "SUBJ" | "JUS";
    state?: "DEF" | "INDEF";
    voice?: "ACT" | "PASS";
    form?: number;
    asp?: "PERF" | "IMPF" | "IMPV";
    der?: "VN" | "AP" | "PP";
  };
}

// ---------- Root tracking ----------
interface RootTracker {
  count: number;
  forms: Set<string>;
  locations: Set<string>;
}

// ---------- Main ----------

function main() {
  console.log("Reading morphology source...");
  const raw = readFileSync(INPUT, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());

  console.log(`Parsed ${lines.length} morpheme lines`);

  // Group by surah → verse → wordGroup
  // surahData[surah][verse] = WordData[]
  const surahData: Map<number, Map<number, WordData[]>> = new Map();
  const rootTracker: Map<string, RootTracker> = new Map();

  // Parse all lines
  const parsedLines: MorphemeLine[] = [];
  for (const line of lines) {
    const [locStr, arabicText, posCol, features] = line.split("\t");
    if (!locStr || !arabicText || !posCol) continue;

    const locParts = locStr.split(":");
    if (locParts.length !== 4) continue;

    parsedLines.push({
      surah: parseInt(locParts[0], 10),
      verse: parseInt(locParts[1], 10),
      wordGroup: parseInt(locParts[2], 10),
      morphemeIdx: parseInt(locParts[3], 10),
      arabicText,
      posCol,
      features: features || "",
    });
  }

  // Group morphemes by word (surah:verse:wordGroup)
  const wordGroupMap = new Map<string, MorphemeLine[]>();
  for (const pl of parsedLines) {
    const key = `${pl.surah}:${pl.verse}:${pl.wordGroup}`;
    if (!wordGroupMap.has(key)) wordGroupMap.set(key, []);
    wordGroupMap.get(key)!.push(pl);
  }

  // Process each word group
  for (const [key, morphemes] of wordGroupMap) {
    const { surah, verse, wordGroup } = morphemes[0];

    // Combine morphemes into display word
    const fullText = morphemes.map((m) => m.arabicText).join("");

    // Find stem morpheme (the one with ROOT or the main POS)
    let stemRoot: string | undefined;
    let stemLemma: string | undefined;
    let stemPos = "N";
    let stemFeats: ParsedFeatures = {};

    const morphemeList: Array<{ ar: string; pos: string; prefix?: true; suffix?: true }> = [];

    for (const m of morphemes) {
      const feats = parseFeatures(m.features);
      const realPos = getRealPos(m.posCol, m.features);

      const morpheme: { ar: string; pos: string; prefix?: true; suffix?: true } = {
        ar: m.arabicText,
        pos: realPos,
      };
      if (feats.isPrefix) morpheme.prefix = true;
      if (feats.isSuffix) morpheme.suffix = true;

      morphemeList.push(morpheme);

      // Track stem info (non-prefix, non-suffix with ROOT)
      if (feats.root) {
        stemRoot = feats.root;
        stemLemma = feats.lemma;
        stemPos = m.posCol === "V" ? "V" : realPos;
        stemFeats = feats;
      } else if (!feats.isPrefix && !feats.isSuffix && !stemRoot) {
        // No root but could be stem (e.g., pronouns, particles)
        stemPos = realPos;
        stemFeats = feats;
        stemLemma = feats.lemma;
      }
    }

    // Build clean features object (omit undefined)
    const f: WordData["features"] = {};
    const sf = stemFeats;
    if (sf.per) f.per = sf.per;
    if (sf.gen) f.gen = sf.gen;
    if (sf.num) f.num = sf.num;
    if (sf.cas) f.cas = sf.cas;
    if (sf.mood) f.mood = sf.mood;
    if (sf.state) f.state = sf.state;
    if (sf.voice) f.voice = sf.voice;
    if (sf.form) f.form = sf.form;
    if (sf.asp) f.asp = sf.asp;
    if (sf.der) f.der = sf.der;

    const wordData: WordData = {
      position: wordGroup,
      arabicText: fullText,
      pos: stemPos,
      morphemes: morphemeList,
      features: f,
    };
    if (stemRoot) wordData.root = stemRoot;
    if (stemLemma) wordData.lemma = stemLemma;

    // Add to surah data
    if (!surahData.has(surah)) surahData.set(surah, new Map());
    const verseMap = surahData.get(surah)!;
    if (!verseMap.has(verse)) verseMap.set(verse, []);
    verseMap.get(verse)!.push(wordData);

    // Track root
    if (stemRoot) {
      const verseKey = `${surah}:${verse}`;
      if (!rootTracker.has(stemRoot)) {
        rootTracker.set(stemRoot, { count: 0, forms: new Set(), locations: new Set() });
      }
      const rt = rootTracker.get(stemRoot)!;
      rt.count++;
      if (stemLemma) rt.forms.add(stemLemma);
      rt.locations.add(verseKey);
    }
  }

  // Write per-surah JSON files
  mkdirSync(OUT_MORPH, { recursive: true });
  mkdirSync(OUT_ENRICHMENT, { recursive: true });

  let totalWords = 0;
  for (const [surah, verseMap] of surahData) {
    const verses: Record<string, unknown[]> = {};
    for (const [verse, words] of verseMap) {
      // Sort by position
      words.sort((a, b) => a.position - b.position);
      totalWords += words.length;

      verses[String(verse)] = words.map((w) => {
        const entry: Record<string, unknown> = {
          p: w.position,
          ar: w.arabicText,
          pos: w.pos,
          morphemes: w.morphemes,
          f: w.features,
        };
        if (w.root) entry.root = w.root;
        if (w.lemma) entry.lemma = w.lemma;
        return entry;
      });
    }

    const outPath = join(OUT_MORPH, `${surah}.json`);
    writeFileSync(outPath, JSON.stringify({ verses }, null, 0));
  }

  // Write roots.json
  const roots: Record<string, unknown> = {};
  for (const [root, tracker] of rootTracker) {
    const letters = root.split("").join(" ");
    // Take first 30 locations to keep file size manageable
    const locations = Array.from(tracker.locations).slice(0, 30);
    roots[root] = {
      root,
      letters,
      meaning: { tr: "", en: "" }, // to be filled by curated data
      count: tracker.count,
      formCount: tracker.forms.size,
      locations,
    };
  }
  writeFileSync(OUT_ROOTS, JSON.stringify({ roots }, null, 0));

  console.log(`Done! ${surahData.size} surahs, ${totalWords} words, ${rootTracker.size} roots`);
  console.log(`Output: ${OUT_MORPH}/{1-114}.json`);
  console.log(`Output: ${OUT_ROOTS}`);
}

/** Extract the real POS tag from the features column */
function getRealPos(posCol: string, features: string): string {
  const parts = features.split("|");

  // Check for specific POS tags in features
  for (const part of parts) {
    switch (part) {
      case "P": return "P";
      case "CONJ": return "CONJ";
      case "NEG": return "NEG";
      case "PRON": return "PRON";
      case "REL": return "REL";
      case "DEM": return "DEM";
      case "INTG": return "INTG";
      case "COND": return "COND";
      case "EMPH": return "EMPH";
      case "CERT": return "CERT";
      case "RES": return "RES";
      case "VOC": return "VOC";
      case "LOC": return "LOC";
      case "T": return "T";
      case "ACC": return "ACC";
      case "FUT": return "FUT";
      case "PREV": return "PREV";
      case "PRO": return "PRO";
      case "INL": return "INL";
      case "DET": return "DET";
      case "ANS": return "ANS";
      case "AVR": return "AVR";
      case "EXH": return "EXH";
      case "EXP": return "EXP";
      case "INC": return "INC";
      case "INT": return "INT";
      case "REM": return "REM";
      case "SUP": return "SUP";
      case "SUR": return "SUR";
      case "AMD": return "AMD";
      case "RSLT": return "RSLT";
      case "CIRC": return "CIRC";
      case "COM": return "COM";
      case "DIST": return "DEM";
      case "ADDR": return "PRON";
      case "SUB": return "SUB";
      case "PN": return "PN";
      case "ADJ": return "ADJ";
    }
  }

  return posCol; // fallback to column POS
}

main();
