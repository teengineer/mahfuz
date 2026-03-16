/**
 * Generate per-surah morphology JSON + roots index + frequency sets + enrichment.
 *
 * This extends convert-morphology.ts to output into the discover/ directory
 * with the correct types for the Keşfet module.
 *
 * Input:  scripts/morphology-source/quran-morphology.txt
 * Output: apps/web/public/discover/morphology/{1-114}.json
 *         apps/web/public/discover/roots-index.json
 *         apps/web/public/discover/frequency-sets.json
 *         apps/web/public/discover/roots-enrichment.json
 *
 * Usage: npx tsx scripts/fetch-morphology.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const INPUT = join(ROOT_DIR, "scripts/morphology-source/quran-morphology.txt");
const OUT_DIR = join(ROOT_DIR, "apps/web/public/discover");
const OUT_MORPH = join(OUT_DIR, "morphology");
const OUT_ROOTS = join(OUT_DIR, "roots-index.json");
const OUT_FREQ = join(OUT_DIR, "frequency-sets.json");
const OUT_ENRICHMENT = join(OUT_DIR, "roots-enrichment.json");
const TERMS_FILE = join(ROOT_DIR, "scripts/morphology-source/morphology-terms.json");

// ---------- Feature parsing (same as convert-morphology.ts) ----------

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
    if (part.startsWith("ROOT:")) { result.root = part.slice(5); continue; }
    if (part.startsWith("LEM:")) { result.lemma = part.slice(4); continue; }
    if (part.startsWith("VF:")) { result.form = parseInt(part.slice(3), 10); continue; }
    if (part.startsWith("MOOD:")) {
      const m = part.slice(5);
      if (m === "IND" || m === "SUBJ" || m === "JUS") result.mood = m;
      continue;
    }
    if (part.startsWith("FAM:")) continue;

    switch (part) {
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
      case "M": result.gen = "M"; break;
      case "F": result.gen = "F"; break;
      case "MS": result.gen = "M"; result.num = "S"; break;
      case "FS": result.gen = "F"; result.num = "S"; break;
      case "MD": result.gen = "M"; result.num = "D"; break;
      case "FD": result.gen = "F"; result.num = "D"; break;
      case "MP": result.gen = "M"; result.num = "P"; break;
      case "FP": result.gen = "F"; result.num = "P"; break;
      case "NOM": result.cas = "NOM"; break;
      case "ACC": result.cas = "ACC"; break;
      case "GEN": result.cas = "GEN"; break;
      case "DEF": result.state = "DEF"; break;
      case "INDEF": result.state = "INDEF"; break;
      case "PASS": result.voice = "PASS"; break;
      case "ACT": result.voice = "ACT"; break;
      case "PERF": result.asp = "PERF"; break;
      case "IMPF": result.asp = "IMPF"; break;
      case "IMPV": result.asp = "IMPV"; break;
      case "ACT_PCPL": result.der = "AP"; break;
      case "PASS_PCPL": result.der = "PP"; break;
      case "VN": result.der = "VN"; break;
      case "PREF": result.isPrefix = true; break;
      case "SUFF": result.isSuffix = true; break;
      case "PRON": result.isPron = true; break;
    }
  }
  return result;
}

function getRealPos(posCol: string, features: string): string {
  const parts = features.split("|");
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
      case "SUB": return "SUB";
      case "PN": return "PN";
      case "ADJ": return "ADJ";
    }
  }
  return posCol;
}

// ---------- Curated root meanings (top ~100) ----------

const ROOT_MEANINGS: Record<string, { tr: string; en: string }> = {
  "ٱلل": { tr: "Allah", en: "God/Allah" },
  "ربب": { tr: "Rab, terbiye etmek", en: "Lord, to nurture" },
  "قول": { tr: "Söylemek, söz", en: "To say, speech" },
  "علم": { tr: "Bilmek, bilgi", en: "To know, knowledge" },
  "كون": { tr: "Olmak, oluş", en: "To be, existence" },
  "أمن": { tr: "İman etmek, güvenmek", en: "To believe, to trust" },
  "عمل": { tr: "Yapmak, amel", en: "To do, deed" },
  "أرض": { tr: "Yer, yeryüzü", en: "Earth, land" },
  "جعل": { tr: "Kılmak, yapmak", en: "To make, to place" },
  "نفس": { tr: "Nefis, can, kişi", en: "Self, soul, person" },
  "سمو": { tr: "Gökyüzü, yükselmek", en: "Heaven, to rise" },
  "أتي": { tr: "Gelmek, getirmek", en: "To come, to bring" },
  "كفر": { tr: "İnkâr etmek, örtmek", en: "To disbelieve, to cover" },
  "يوم": { tr: "Gün", en: "Day" },
  "خلق": { tr: "Yaratmak, yaratılış", en: "To create, creation" },
  "رحم": { tr: "Merhamet, rahmet", en: "Mercy, compassion" },
  "أخذ": { tr: "Almak, tutmak", en: "To take, to seize" },
  "جنن": { tr: "Cennet, örtmek", en: "Paradise, to cover" },
  "نزل": { tr: "İndirmek, inmek", en: "To send down, to descend" },
  "دعو": { tr: "Çağırmak, dua etmek", en: "To call, to pray" },
  "حقق": { tr: "Hak, gerçek", en: "Truth, right" },
  "شيأ": { tr: "Şey, nesne", en: "Thing, object" },
  "سبل": { tr: "Yol, sebil", en: "Way, path" },
  "أهل": { tr: "Ehil, aile, halk", en: "Family, people" },
  "بعد": { tr: "Sonra, uzak", en: "After, far" },
  "نصر": { tr: "Yardım etmek, zafer", en: "To help, victory" },
  "عبد": { tr: "Kulluk etmek, kul", en: "To worship, servant" },
  "هدي": { tr: "Hidayet, yol göstermek", en: "Guidance, to guide" },
  "صلو": { tr: "Namaz, dua", en: "Prayer, worship" },
  "أكل": { tr: "Yemek", en: "To eat, food" },
  "قبل": { tr: "Önce, kabul etmek", en: "Before, to accept" },
  "وجد": { tr: "Bulmak", en: "To find" },
  "حسب": { tr: "Hesap, saymak", en: "Account, to reckon" },
  "ظلم": { tr: "Zulüm, karanlık", en: "Oppression, darkness" },
  "نور": { tr: "Nur, ışık", en: "Light" },
  "كتب": { tr: "Yazmak, kitap", en: "To write, book" },
  "سمع": { tr: "İşitmek, duymak", en: "To hear" },
  "بصر": { tr: "Görmek, basiret", en: "To see, insight" },
  "ولد": { tr: "Çocuk, doğurmak", en: "Child, to give birth" },
  "ملك": { tr: "Mülk, hükümdar", en: "Kingdom, king" },
  "قدر": { tr: "Kader, güç, ölçü", en: "Destiny, power, measure" },
  "حكم": { tr: "Hüküm, hikmet", en: "Judgment, wisdom" },
  "فعل": { tr: "Yapmak, fiil", en: "To do, action" },
  "شرك": { tr: "Şirk, ortak koşmak", en: "Polytheism, to associate" },
  "ذكر": { tr: "Anmak, zikir, erkek", en: "To remember, male" },
  "نهر": { tr: "Nehir", en: "River" },
  "غفر": { tr: "Bağışlamak, mağfiret", en: "To forgive" },
  "توب": { tr: "Tövbe etmek", en: "To repent" },
  "شكر": { tr: "Şükretmek", en: "To be grateful" },
  "صبر": { tr: "Sabır, sabretmek", en: "Patience, to be patient" },
};

// ---------- Main ----------

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
  features: Record<string, unknown>;
}

interface RootTracker {
  count: number;
  forms: Set<string>;
  locations: Set<string>;
}

function main() {
  console.log("Reading morphology source...");
  const raw = readFileSync(INPUT, "utf-8");
  const lines = raw.split("\n").filter((l) => l.trim());
  console.log(`Parsed ${lines.length} morpheme lines`);

  const surahData: Map<number, Map<number, WordData[]>> = new Map();
  const rootTracker: Map<string, RootTracker> = new Map();

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

  const wordGroupMap = new Map<string, MorphemeLine[]>();
  for (const pl of parsedLines) {
    const key = `${pl.surah}:${pl.verse}:${pl.wordGroup}`;
    if (!wordGroupMap.has(key)) wordGroupMap.set(key, []);
    wordGroupMap.get(key)!.push(pl);
  }

  for (const [, morphemes] of wordGroupMap) {
    const { surah, verse, wordGroup } = morphemes[0];
    const fullText = morphemes.map((m) => m.arabicText).join("");

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

      if (feats.root) {
        stemRoot = feats.root;
        stemLemma = feats.lemma;
        stemPos = m.posCol === "V" ? "V" : realPos;
        stemFeats = feats;
      } else if (!feats.isPrefix && !feats.isSuffix && !stemRoot) {
        stemPos = realPos;
        stemFeats = feats;
        stemLemma = feats.lemma;
      }
    }

    const f: Record<string, unknown> = {};
    if (stemFeats.per) f.per = stemFeats.per;
    if (stemFeats.gen) f.gen = stemFeats.gen;
    if (stemFeats.num) f.num = stemFeats.num;
    if (stemFeats.cas) f.cas = stemFeats.cas;
    if (stemFeats.mood) f.mood = stemFeats.mood;
    if (stemFeats.state) f.state = stemFeats.state;
    if (stemFeats.voice) f.voice = stemFeats.voice;
    if (stemFeats.form) f.form = stemFeats.form;
    if (stemFeats.asp) f.asp = stemFeats.asp;
    if (stemFeats.der) f.der = stemFeats.der;

    const wordData: WordData = {
      position: wordGroup,
      arabicText: fullText,
      pos: stemPos,
      morphemes: morphemeList,
      features: f,
    };
    if (stemRoot) wordData.root = stemRoot;
    if (stemLemma) wordData.lemma = stemLemma;

    if (!surahData.has(surah)) surahData.set(surah, new Map());
    const verseMap = surahData.get(surah)!;
    if (!verseMap.has(verse)) verseMap.set(verse, []);
    verseMap.get(verse)!.push(wordData);

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

  // Write per-surah morphology JSON
  mkdirSync(OUT_MORPH, { recursive: true });

  let totalWords = 0;
  for (const [surah, verseMap] of surahData) {
    const verses: Record<string, unknown[]> = {};
    for (const [verse, words] of verseMap) {
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
    writeFileSync(join(OUT_MORPH, `${surah}.json`), JSON.stringify({ verses }));
  }

  // Build roots index
  const roots: Record<string, unknown> = {};
  const rootsByCount: Array<{ root: string; count: number }> = [];

  for (const [root, tracker] of rootTracker) {
    const letters = root.split("").join(" ");
    const locations = Array.from(tracker.locations).slice(0, 20);
    const meaning = ROOT_MEANINGS[root] || { tr: "", en: "" };
    roots[root] = {
      root,
      letters,
      meaning,
      count: tracker.count,
      formCount: tracker.forms.size,
      locations,
    };
    rootsByCount.push({ root, count: tracker.count });
  }
  writeFileSync(OUT_ROOTS, JSON.stringify({ roots }));

  // Build frequency sets
  rootsByCount.sort((a, b) => b.count - a.count);

  const setConfigs = [
    { id: "top-10", tr: "En Sık 10", en: "Top 10", size: 10 },
    { id: "top-50", tr: "En Sık 50", en: "Top 50", size: 50 },
    { id: "top-100", tr: "En Sık 100", en: "Top 100", size: 100 },
    { id: "top-200", tr: "En Sık 200", en: "Top 200", size: 200 },
    { id: "top-500", tr: "En Sık 500", en: "Top 500", size: 500 },
    { id: "all", tr: "Tümü", en: "All", size: rootsByCount.length },
  ];

  const sets = setConfigs.map((cfg) => ({
    id: cfg.id,
    label: { tr: cfg.tr, en: cfg.en },
    words: rootsByCount.slice(0, cfg.size).map((r) => ({
      root: r.root,
      count: r.count,
      meaning: ROOT_MEANINGS[r.root] || { tr: "", en: "" },
    })),
  }));
  writeFileSync(OUT_FREQ, JSON.stringify({ sets }));

  // Write enrichment (starter: top 50 roots only)
  const enrichment: Record<string, unknown> = {};
  for (const r of rootsByCount.slice(0, 50)) {
    enrichment[r.root] = {
      rhetoric: { tr: "", en: "" },
      etymology: { tr: "", en: "" },
      semanticField: { tr: "", en: "" },
      relatedRoots: [],
    };
  }
  writeFileSync(OUT_ENRICHMENT, JSON.stringify(enrichment));

  console.log(`Done! ${surahData.size} surahs, ${totalWords} words, ${rootTracker.size} roots`);
  console.log(`Output: ${OUT_MORPH}/{1-114}.json`);
  console.log(`Output: ${OUT_ROOTS}`);
  console.log(`Output: ${OUT_FREQ}`);
  console.log(`Output: ${OUT_ENRICHMENT}`);
}

main();
