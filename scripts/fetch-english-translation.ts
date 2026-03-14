/**
 * fetch-english-translation.ts
 *
 * Downloads the Sahih International English translation from quran.com API v4
 * and converts it to the unified local JSON format.
 *
 * Usage: npx tsx scripts/fetch-english-translation.ts
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, "..", "apps", "web", "public", "translations");

const API_BASE = "https://api.quran.com/api/v4";
const RESOURCE_ID = 20; // Sahih International
const TOTAL_CHAPTERS = 114;

interface ApiTranslation {
  id: number;
  resource_id: number;
  text: string;
}

interface ApiResponse {
  translations: ApiTranslation[];
  pagination: {
    per_page: number;
    current_page: number;
    next_page: number | null;
    total_pages: number;
    total_records: number;
  };
}

async function fetchChapterTranslations(chapterId: number): Promise<Record<string, string>> {
  const verses: Record<string, string> = {};
  let page = 1;

  while (true) {
    const url = `${API_BASE}/quran/translations/${RESOURCE_ID}?chapter_number=${chapterId}&page=${page}`;
    const resp = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!resp.ok) {
      throw new Error(`API error for chapter ${chapterId} page ${page}: ${resp.status}`);
    }

    const data: ApiResponse = await resp.json();

    for (const t of data.translations) {
      // The API returns translations in verse order
      // We need the verse_key, which we can derive from the verse id
      // But the translations endpoint uses sequential indexing
      // Better to use the verses endpoint
    }

    // Actually, let's use a different approach - fetch verses with translations
    break;
  }

  return verses;
}

// Better approach: use /verses endpoint which includes verse_key
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

async function fetchAllVerses(): Promise<Record<string, string>> {
  const verses: Record<string, string> = {};

  for (let chapter = 1; chapter <= TOTAL_CHAPTERS; chapter++) {
    if (chapter % 10 === 1 || chapter === TOTAL_CHAPTERS) {
      console.log(`  Chapter ${chapter}/${TOTAL_CHAPTERS}...`);
    }

    let page = 1;
    while (true) {
      const url = `${API_BASE}/verses/by_chapter/${chapter}?language=en&translations=${RESOURCE_ID}&per_page=50&page=${page}&fields=verse_key`;
      const resp = await fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!resp.ok) {
        throw new Error(`API error for chapter ${chapter} page ${page}: ${resp.status}`);
      }

      const data: VerseApiResponse = await resp.json();

      for (const v of data.verses) {
        const translation = v.translations?.[0];
        if (translation) {
          // Clean HTML tags from translation text
          const text = translation.text
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
          verses[v.verse_key] = text;
        }
      }

      if (!data.pagination.next_page) break;
      page++;
    }

    // Small delay to be respectful to the API
    await new Promise((r) => setTimeout(r, 100));
  }

  return verses;
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  console.log("Fetching Sahih International English translation from quran.com API...");
  const verses = await fetchAllVerses();

  const count = Object.keys(verses).length;
  console.log(`\nFetched ${count} verses`);

  if (count < 6236) {
    console.warn(`  Warning: Expected 6236 verses, got ${count}`);
  }

  const output = {
    id: "sahih-international",
    name: "Sahih International",
    verses,
  };

  const outPath = join(OUTPUT_DIR, "sahih-international.json");
  writeFileSync(outPath, JSON.stringify(output, null, 0));
  console.log(`Wrote ${outPath}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
