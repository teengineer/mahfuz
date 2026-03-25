/**
 * Static Quran data loader — reads from Tanzil.net JSON files.
 * TanStack Query is the sole cache layer (no Map caches).
 */
import type {
  TextType,
  TanzilSurahData,
  QuranMeta,
  StaticChapter,
  Chapter,
  Verse,
} from "@mahfuz/shared/types";
import { createIsomorphicFn } from "@tanstack/react-start";
import quranMetaJson from "../data/quran-meta.json";

const loadJsonFile = createIsomorphicFn()
  .client(async (publicPath: string) => {
    const resp = await fetch(publicPath);
    if (!resp.ok) throw new Error(`Failed to load ${publicPath}: ${resp.status}`);
    return resp.json();
  })
  .server(async (publicPath: string) => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const candidates = [
      join(process.cwd(), "public", publicPath),
      join(process.cwd(), "dist", "client", publicPath),
    ];
    for (const filePath of candidates) {
      try {
        const raw = await readFile(filePath, "utf-8");
        return JSON.parse(raw);
      } catch {
        continue;
      }
    }
    const siteUrl = process.env.URL || process.env.DEPLOY_PRIME_URL;
    if (siteUrl) {
      const resp = await fetch(`${siteUrl}${publicPath}`);
      if (resp.ok) return resp.json();
    }
    throw new Error(`[quran-data] Failed to load ${publicPath} from disk`);
  });

export async function loadQuranMeta(): Promise<QuranMeta> {
  return quranMetaJson as unknown as QuranMeta;
}

export interface BerkenarPagesData {
  totalPages: number;
  pages: Record<string, string[]>;
  pageToSurahs: Record<string, number[]>;
  verseToPage: Record<string, number>;
}

export async function loadBerkenarPages(): Promise<BerkenarPagesData> {
  return loadJsonFile("/berkenar/pages.json");
}

export async function loadSurahText(
  surahId: number,
  textType: TextType,
): Promise<TanzilSurahData> {
  return loadJsonFile(`/quran/${textType}/${surahId}.json`);
}

export async function loadSurahVerses(
  surahId: number,
  textType: TextType,
): Promise<Verse[]> {
  const data = await loadSurahText(surahId, textType);
  return tanzilToVerses(data, surahId, textType);
}

export function staticChapterToChapter(sc: StaticChapter): Chapter {
  return {
    id: sc.id,
    revelation_place: sc.revelation_place as "makkah" | "madinah",
    revelation_order: sc.revelation_order,
    bismillah_pre: sc.bismillah_pre,
    name_simple: sc.name_simple,
    name_complex: sc.name_simple,
    name_arabic: sc.name_arabic,
    verses_count: sc.verses_count,
    pages: sc.pages,
    translated_name: {
      name: sc.name_translation,
      language_name: "english",
    },
  };
}

export function tanzilToVerses(
  data: TanzilSurahData,
  surahId: number,
  textType: TextType,
): Verse[] {
  return data.verses.map((tv) => {
    const verse: Verse = {
      id: surahId * 1000 + tv.v,
      verse_number: tv.v,
      verse_key: `${surahId}:${tv.v}`,
      hizb_number: Math.ceil(tv.h / 4),
      rub_el_hizb_number: tv.h,
      ruku_number: tv.rk,
      manzil_number: tv.m,
      sajdah_number: tv.sj ? tv.sj : null,
      page_number: tv.p,
      juz_number: tv.j,
    };

    verse.text_uthmani = tv.t;
    verse.text_imlaei = tv.t;

    const wordTexts = tv.t.split(/\s+/).filter(Boolean);
    verse.words = wordTexts.map((wt, idx) => ({
      id: surahId * 1000000 + tv.v * 1000 + idx + 1,
      position: idx + 1,
      audio_url: null,
      char_type_name: "word" as const,
      text_uthmani: wt,
      text_imlaei: wt,
      text: wt,
      page_number: tv.p,
      line_number: 1,
      translation: { text: "", language_name: "turkish" },
      transliteration: { text: "", language_name: "english" },
    }));

    return verse;
  });
}

export function mergeWbwIntoVerses(
  staticVerses: Verse[],
  wbwVerses: Verse[] | undefined,
): Verse[] {
  if (!wbwVerses?.length) return staticVerses;

  const wbwMap = new Map<string, Verse>();
  for (const v of wbwVerses) {
    wbwMap.set(v.verse_key, v);
  }

  return staticVerses.map((sv) => {
    const wv = wbwMap.get(sv.verse_key);
    if (!wv?.words) return sv;
    return {
      ...sv,
      words: wv.words,
      text_uthmani: sv.text_uthmani || wv.text_uthmani,
      text_imlaei: sv.text_imlaei || wv.text_imlaei,
    };
  });
}
