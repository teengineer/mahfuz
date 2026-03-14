/**
 * fetch-multilingual-translations.ts
 *
 * Downloads 17 Quran translations (one per language) from quran.com API v4
 * and saves them in the unified local JSON format.
 *
 * Usage: npx tsx scripts/fetch-multilingual-translations.ts
 *
 * Pass specific IDs to fetch only those:
 *   npx tsx scripts/fetch-multilingual-translations.ts kuliev ma-jian
 */

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "apps", "web", "public", "translations");

const API_BASE = "https://api.quran.com/api/v4";
const TOTAL_CHAPTERS = 114;

interface Translation {
  apiId: number;
  localId: string;
  name: string;
  language: string;
}

const TRANSLATIONS: Translation[] = [
  { apiId: 161, localId: "taisirul-quran", name: "Taisirul Quran", language: "bn" },
  { apiId: 135, localId: "islamhouse-fa", name: "IslamHouse.com", language: "fa" },
  { apiId: 136, localId: "montada-fr", name: "Montada Islamic Foundation", language: "fr" },
  { apiId: 134, localId: "kfqpc-id", name: "King Fahad Quran Complex", language: "id" },
  { apiId: 153, localId: "piccardo", name: "Hamza Roberto Piccardo", language: "it" },
  { apiId: 235, localId: "abdalsalaam-nl", name: "Malak Faris Abdalsalaam", language: "nl" },
  { apiId: 103, localId: "helmi-nasr", name: "Helmi Nasr", language: "pt" },
  { apiId: 45, localId: "kuliev", name: "Elmir Kuliev", language: "ru" },
  { apiId: 88, localId: "nahi", name: "Hasan Efendi Nahi", language: "sq" },
  { apiId: 51, localId: "kfqpc-th", name: "King Fahad Quran Complex", language: "th" },
  { apiId: 54, localId: "junagarhi", name: "Muhammad Junagarhi", language: "ur" },
  { apiId: 56, localId: "ma-jian", name: "Ma Jian", language: "zh" },
  { apiId: 39, localId: "basmeih", name: "Abdullah Muhammad Basmeih", language: "ms" },
  { apiId: 83, localId: "isa-garcia", name: "Sheikh Isa Garcia", language: "es" },
  { apiId: 49, localId: "barwani", name: "Ali Muhsin Al-Barwani", language: "sw" },
  { apiId: 220, localId: "ruwwad-vi", name: "Ruwwad Center", language: "vi" },
];

interface VerseApiResponse {
  verses: {
    id: number;
    verse_number: number;
    verse_key: string;
    translations: {
      id: number;
      resource_id: number;
      text: string;
    }[];
  }[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

function cleanHtml(text: string): string {
  return text
    .replace(/<sup[^>]*>.*?<\/sup>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const resp = await fetch(url, { headers: { Accept: "application/json" } });
    if (resp.ok) return resp;
    if (resp.status === 429 || resp.status >= 500) {
      const wait = attempt * 2000;
      console.warn(`    Retry ${attempt}/${retries} after ${resp.status}, waiting ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }
    throw new Error(`API error: ${resp.status} ${resp.statusText} for ${url}`);
  }
  throw new Error(`Failed after ${retries} retries for ${url}`);
}

async function fetchTranslation(t: Translation): Promise<Record<string, string>> {
  const verses: Record<string, string> = {};

  for (let chapter = 1; chapter <= TOTAL_CHAPTERS; chapter++) {
    if (chapter % 20 === 1 || chapter === TOTAL_CHAPTERS) {
      console.log(`  [${t.localId}] Chapter ${chapter}/${TOTAL_CHAPTERS}...`);
    }

    let page = 1;
    while (true) {
      const url = `${API_BASE}/verses/by_chapter/${chapter}?language=${t.language}&translations=${t.apiId}&per_page=50&page=${page}&fields=verse_key`;
      const resp = await fetchWithRetry(url);
      const data: VerseApiResponse = await resp.json();

      for (const v of data.verses) {
        const translation = v.translations?.[0];
        if (translation) {
          verses[v.verse_key] = cleanHtml(translation.text);
        }
      }

      if (!data.pagination.next_page) break;
      page++;
    }

    // Be respectful to the API
    await new Promise((r) => setTimeout(r, 100));
  }

  return verses;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  // Filter by CLI args if provided
  const args = process.argv.slice(2);
  const targets = args.length > 0
    ? TRANSLATIONS.filter((t) => args.includes(t.localId))
    : TRANSLATIONS;

  if (args.length > 0 && targets.length === 0) {
    console.error(`No matching translations for: ${args.join(", ")}`);
    console.error(`Available: ${TRANSLATIONS.map((t) => t.localId).join(", ")}`);
    process.exit(1);
  }

  console.log(`Fetching ${targets.length} translation(s)...\n`);

  for (const t of targets) {
    const outPath = join(OUTPUT_DIR, `${t.localId}.json`);

    if (existsSync(outPath) && args.length === 0) {
      console.log(`[${t.localId}] Already exists, skipping (pass ID to re-fetch)`);
      continue;
    }

    console.log(`[${t.localId}] Fetching "${t.name}" (API ID ${t.apiId})...`);
    const verses = await fetchTranslation(t);
    const count = Object.keys(verses).length;

    if (count < 6200) {
      console.warn(`  WARNING: Only got ${count} verses (expected ~6236)`);
    } else {
      console.log(`  Got ${count} verses`);
    }

    const output = { id: t.localId, name: t.name, verses };
    writeFileSync(outPath, JSON.stringify(output, null, 0));
    console.log(`  Wrote ${outPath}\n`);

    // Pause between translations
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
