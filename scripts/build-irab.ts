/**
 * Build per-surah i'rab / syntax data from morphology files.
 *
 * This generates basic syntactic role annotations derived from the
 * morphological POS tags and case/state features.
 *
 * Input:  apps/web/public/discover/morphology/{1-114}.json
 * Output: apps/web/public/discover/irab/{1-114}.json
 *
 * Usage: npx tsx scripts/build-irab.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const MORPH_DIR = join(ROOT_DIR, "apps/web/public/discover/morphology");
const OUT_DIR = join(ROOT_DIR, "apps/web/public/discover/irab");

interface WordMorph {
  p: number;
  ar: string;
  pos: string;
  root?: string;
  lemma?: string;
  morphemes: Array<{ ar: string; pos: string; prefix?: true; suffix?: true }>;
  f: {
    per?: number;
    gen?: string;
    num?: string;
    cas?: string;
    mood?: string;
    state?: string;
    voice?: string;
    form?: number;
    asp?: string;
    der?: string;
  };
}

interface SyntaxNode {
  p: number;
  ar: string;
  role: string;
  caseLabel?: { tr: string; en: string; ar: string };
  parent?: number;
  depLabel?: string;
  irabDesc?: { tr: string; en: string };
}

const CASE_LABELS: Record<string, { tr: string; en: string; ar: string }> = {
  NOM: { tr: "Merfû (yalın)", en: "Nominative", ar: "مرفوع" },
  ACC: { tr: "Mansûb (belirtme)", en: "Accusative", ar: "منصوب" },
  GEN: { tr: "Mecrûr (tamlayan)", en: "Genitive", ar: "مجرور" },
};

function deriveRole(word: WordMorph, prevWord?: WordMorph): string {
  const { pos, f } = word;

  // Verb → fiil
  if (pos === "V") return "fiil";

  // Preposition → harf (jar-majrur when followed by noun)
  if (pos === "P") return "harf";

  // Conjunction
  if (pos === "CONJ" || pos === "SUB") return "atf";

  // Vocative
  if (pos === "VOC") return "nida";

  // Negative, emphatic, etc. particles
  if (["NEG", "EMPH", "CERT", "RES", "FUT", "PREV", "PRO"].includes(pos)) return "harf";

  // If preceded by preposition → jar-majrur
  if (prevWord && prevWord.pos === "P" && f.cas === "GEN") return "jar-majrur";

  // Noun/Adjective with case info
  if (pos === "N" || pos === "PN" || pos === "ADJ" || pos === "PRON" || pos === "DEM" || pos === "REL") {
    if (f.cas === "NOM") {
      // After a verb → fail (subject)
      if (prevWord?.pos === "V") return "fail";
      return "mubtada";
    }
    if (f.cas === "ACC") {
      // After a verb → mafool
      if (prevWord?.pos === "V") return "mafool";
      return "khabar";
    }
    if (f.cas === "GEN") {
      if (prevWord?.pos === "P") return "jar-majrur";
      return "mudaf-ilayh";
    }

    // Adjective → naat
    if (pos === "ADJ") return "naat";

    // Default for nouns
    return "mubtada";
  }

  return "harf";
}

function deriveIrabDesc(role: string, word: WordMorph): { tr: string; en: string } | undefined {
  const caseName = word.f.cas ? CASE_LABELS[word.f.cas] : undefined;
  if (!caseName) return undefined;

  const ROLE_TR: Record<string, string> = {
    mubtada: "Mübteda",
    khabar: "Haber",
    fail: "Fâil",
    mafool: "Mef'ûlün bih",
    "jar-majrur": "Câr-mecrûr",
    naat: "Na't (sıfat)",
    "mudaf-ilayh": "Muzâfun ileyh",
    fiil: "Fiil",
    harf: "Harf",
    atf: "Atıf",
    nida: "Nidâ",
  };

  const ROLE_EN: Record<string, string> = {
    mubtada: "Subject",
    khabar: "Predicate",
    fail: "Agent",
    mafool: "Direct object",
    "jar-majrur": "Prepositional phrase",
    naat: "Adjective",
    "mudaf-ilayh": "Possessive",
    fiil: "Verb",
    harf: "Particle",
    atf: "Conjunction",
    nida: "Vocative",
  };

  return {
    tr: `${ROLE_TR[role] || role} — ${caseName.tr}`,
    en: `${ROLE_EN[role] || role} — ${caseName.en}`,
  };
}

function main() {
  if (!existsSync(MORPH_DIR)) {
    console.error("Morphology data not found. Run fetch-morphology.ts first.");
    process.exit(1);
  }

  mkdirSync(OUT_DIR, { recursive: true });

  let totalVerses = 0;
  for (let surah = 1; surah <= 114; surah++) {
    const morphPath = join(MORPH_DIR, `${surah}.json`);
    if (!existsSync(morphPath)) continue;

    const data = JSON.parse(readFileSync(morphPath, "utf-8")) as { verses: Record<string, WordMorph[]> };
    const syntaxVerses: Record<string, SyntaxNode[]> = {};

    for (const [verseNum, words] of Object.entries(data.verses)) {
      totalVerses++;
      const nodes: SyntaxNode[] = [];

      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const prevWord = i > 0 ? words[i - 1] : undefined;
        const role = deriveRole(word, prevWord);

        const node: SyntaxNode = {
          p: word.p,
          ar: word.ar,
          role,
        };

        if (word.f.cas && CASE_LABELS[word.f.cas]) {
          node.caseLabel = CASE_LABELS[word.f.cas];
        }

        const irabDesc = deriveIrabDesc(role, word);
        if (irabDesc) node.irabDesc = irabDesc;

        // Simple dependency: nouns/adjectives depend on preceding verb or preposition
        if (prevWord) {
          if ((role === "fail" || role === "mafool") && prevWord.pos === "V") {
            node.parent = prevWord.p;
            node.depLabel = role === "fail" ? "nsubj" : "obj";
          } else if (role === "jar-majrur" && prevWord.pos === "P") {
            node.parent = prevWord.p;
            node.depLabel = "case";
          } else if (role === "naat") {
            node.parent = prevWord.p;
            node.depLabel = "amod";
          } else if (role === "mudaf-ilayh") {
            node.parent = prevWord.p;
            node.depLabel = "nmod";
          }
        }

        nodes.push(node);
      }

      syntaxVerses[verseNum] = nodes;
    }

    writeFileSync(join(OUT_DIR, `${surah}.json`), JSON.stringify({ verses: syntaxVerses }));
  }

  console.log(`Done! 114 surahs, ${totalVerses} verses processed`);
  console.log(`Output: ${OUT_DIR}/{1-114}.json`);
}

main();
