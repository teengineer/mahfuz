/**
 * Word-by-word data hook — fetches from quran.com API ONLY for WBW mode.
 * This is the only remaining quran.com text API dependency.
 *
 * quran.com's Turkish WBW data is ~91% complete; the remaining ~9% falls
 * back to English.  We ship a local fallback dictionary
 * (public/data/wbw-tr-fallback.json, ~160 KB) keyed by "verse_key:position"
 * that supplies Turkish translations for every missing word.
 */
import { queryOptions } from "@tanstack/react-query";
import { quranApi } from "~/lib/api";
import type { GetVersesParams, Verse } from "@mahfuz/shared/types";
import { QUERY_KEYS } from "~/lib/query-keys";

/** quran.com API language codes → language_name values */
const LANG_CODE_TO_NAME: Record<string, string> = {
  tr: "turkish",
  en: "english",
  ar: "arabic",
};

/** Lazy-loaded fallback dictionary – fetched once, then cached. */
let fallbackDict: Record<string, string> | null = null;
let fallbackLoading: Promise<Record<string, string>> | null = null;

async function loadFallbackDict(): Promise<Record<string, string>> {
  if (fallbackDict) return fallbackDict;
  if (fallbackLoading) return fallbackLoading;

  fallbackLoading = fetch("/data/wbw-tr-fallback.json")
    .then((r) => r.json() as Promise<Record<string, string>>)
    .then((data) => {
      fallbackDict = data;
      return data;
    })
    .catch(() => {
      // If fetch fails, use empty dict — words will be stripped instead.
      fallbackDict = {};
      return fallbackDict;
    });

  return fallbackLoading;
}

const WBW_PARAMS: GetVersesParams = {
  words: true,
  perPage: 286, // max verses in a chapter (Baqara) — load all at once
  wordFields: ["text_uthmani", "text_imlaei"],
  translationFields: [],
  fields: ["text_uthmani"],
};

/**
 * Fetch word-by-word data for all verses in a chapter.
 * Only used when viewMode === "wordByWord".
 */
export const wbwByChapterQueryOptions = (chapterId: number) =>
  queryOptions({
    queryKey: QUERY_KEYS.wbw.chapter(chapterId),
    queryFn: () => fetchAllWbw(chapterId, WBW_PARAMS),
    staleTime: Infinity,
    gcTime: Infinity,
  });

/** WBW with transliteration + translation — used by memorization modes */
const MEMORIZE_WBW_PARAMS: GetVersesParams = {
  words: true,
  perPage: 286,
  wordFields: [
    "text_uthmani",
    "text_imlaei",
    "translation",
    "transliteration",
  ],
  translationFields: [],
  fields: ["text_uthmani"],
};

export const memorizeWbwByChapterQueryOptions = (chapterId: number) =>
  queryOptions({
    queryKey: [...QUERY_KEYS.wbw.chapter(chapterId), "memorize"],
    queryFn: () => fetchAllWbw(chapterId, MEMORIZE_WBW_PARAMS),
    staleTime: Infinity,
    gcTime: Infinity,
  });

async function fetchAllWbw(chapterId: number, params: GetVersesParams) {
  const firstPage = await quranApi.verses.byChapter(chapterId, {
    ...params,
    page: 1,
  });

  let allVerses = [...firstPage.verses];

  if (firstPage.pagination && firstPage.pagination.total_pages > 1) {
    for (let p = 2; p <= firstPage.pagination.total_pages; p++) {
      const pageData = await quranApi.verses.byChapter(chapterId, {
        ...params,
        page: p,
      });
      allVerses.push(...pageData.verses);
    }
  }

  return patchMismatchedTranslations(allVerses);
}

/**
 * Replace non-Turkish word translations with local fallback data.
 * Falls back to empty string only if the fallback dictionary has no entry.
 */
async function patchMismatchedTranslations(verses: Verse[]): Promise<Verse[]> {
  const expectedLang =
    LANG_CODE_TO_NAME[quranApi.getLanguage()] ?? "turkish";

  const dict = await loadFallbackDict();

  for (const verse of verses) {
    if (!verse.words) continue;
    for (const word of verse.words) {
      if (
        word.translation &&
        word.translation.language_name !== expectedLang
      ) {
        const key = `${verse.verse_key}:${word.position}`;
        const fallback = dict[key] ?? "";
        word.translation = { text: fallback, language_name: expectedLang };
      }
    }
  }

  return verses;
}
