/**
 * Quran.com API'den Tefsîr-i Müyesser (التفسير الميسر) Arapça mealini çeker.
 * Kaynak: tafsir resource_id=16
 *
 * Çıktı: public/translations/muyassar-ar.json
 */

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

const TAFSIR_ID = 16;
const API_BASE = "https://api.quran.com/api/v4/tafsirs";
const OUT_FILE = resolve(import.meta.dirname, "../public/translations/muyassar-ar.json");
const TOTAL_SURAHS = 114;
const DELAY_MS = 300;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}

async function fetchChapter(surahId: number): Promise<Record<string, string>> {
  const verses: Record<string, string> = {};
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = `${API_BASE}/${TAFSIR_ID}/by_chapter/${surahId}?page=${page}&per_page=50`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`  HATA: ${surahId} sure, sayfa ${page} — ${res.status}`);
      break;
    }
    const data = await res.json();
    totalPages = data.pagination?.total_pages || 1;

    for (const t of data.tafsirs || []) {
      verses[t.verse_key] = stripHtml(t.text);
    }

    page++;
    if (page <= totalPages) await sleep(DELAY_MS);
  }

  return verses;
}

async function main() {
  console.log("Tefsîr-i Müyesser (Arapça) indiriliyor...\n");

  const allVerses: Record<string, string> = {};
  let totalCount = 0;

  for (let surahId = 1; surahId <= TOTAL_SURAHS; surahId++) {
    const verses = await fetchChapter(surahId);
    const count = Object.keys(verses).length;
    totalCount += count;
    Object.assign(allVerses, verses);
    console.log(`  ✓ Sure ${surahId}: ${count} ayet`);
    await sleep(DELAY_MS);
  }

  const output = {
    id: "muyassar-ar",
    name: "التفسير الميسر",
    verses: allVerses,
  };

  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), "utf-8");
  console.log(`\n✓ Toplam ${totalCount} ayet → ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("HATA:", err);
  process.exit(1);
});
