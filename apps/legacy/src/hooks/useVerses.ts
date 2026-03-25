/**
 * Verse query options — now backed by static Tanzil JSON data.
 * Keeps the same export names for backward compatibility with
 * memorization components and other consumers.
 */
import { queryOptions } from "@tanstack/react-query";
import type { TextType, Verse } from "@mahfuz/shared/types";
import type { PageLayout } from "@mahfuz/shared/constants";
import {
  loadSurahVerses,
  loadQuranMeta,
  loadBerkenarPages,
} from "~/lib/quran-data";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { QUERY_KEYS } from "~/lib/query-keys";

function getTextType(): TextType {
  return usePreferencesStore.getState().textType ?? "uthmani";
}

export const versesByChapterQueryOptions = (
  chapterId: number,
  _page: number = 1,
  _params: Record<string, unknown> = {}
) =>
  queryOptions({
    queryKey: QUERY_KEYS.staticVerses.chapter(chapterId, getTextType()),
    queryFn: async () => {
      const textType = getTextType();
      const verses = await loadSurahVerses(chapterId, textType);
      return {
        verses,
        pagination: { current_page: 1, total_pages: 1, total_records: verses.length, per_page: verses.length },
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const versesByPageQueryOptions = (
  pageNumber: number,
  _params: Record<string, unknown> = {}
) =>
  queryOptions({
    queryKey: QUERY_KEYS.staticVerses.page(pageNumber, getTextType()),
    queryFn: async () => {
      const textType = getTextType();
      const meta = await loadQuranMeta();
      const surahIds = meta.pageToSurahs[pageNumber] ?? [];

      const allVerses = [];
      for (const surahId of surahIds) {
        const verses = await loadSurahVerses(surahId, textType);
        allVerses.push(...verses.filter((v) => v.page_number === pageNumber));
      }

      return {
        verses: allVerses,
        pagination: { current_page: 1, total_pages: 1, total_records: allVerses.length, per_page: allVerses.length },
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const versesByJuzQueryOptions = (
  juzNumber: number,
  _page: number = 1,
  _params: Record<string, unknown> = {}
) =>
  queryOptions({
    queryKey: QUERY_KEYS.staticVerses.juz(juzNumber, getTextType()),
    queryFn: async () => {
      const textType = getTextType();
      const meta = await loadQuranMeta();
      const boundary = meta.juzBoundaries[juzNumber];
      if (!boundary) throw new Error(`Unknown juz: ${juzNumber}`);

      const [startSura, startAya] = boundary.start.split(":").map(Number);
      const [endSura, endAya] = boundary.end.split(":").map(Number);

      const allVerses = [];
      for (let surahId = startSura; surahId <= endSura; surahId++) {
        const verses = await loadSurahVerses(surahId, textType);
        allVerses.push(
          ...verses.filter((v) => {
            if (surahId === startSura && v.verse_number < startAya) return false;
            if (surahId === endSura && v.verse_number > endAya) return false;
            return true;
          })
        );
      }

      return {
        verses: allVerses,
        pagination: { current_page: 1, total_pages: 1, total_records: allVerses.length, per_page: allVerses.length },
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const verseByKeyQueryOptions = (
  verseKey: string,
  _params: Record<string, unknown> = {}
) =>
  queryOptions({
    queryKey: QUERY_KEYS.staticVerse(verseKey, getTextType()),
    queryFn: async () => {
      const textType = getTextType();
      const [surahId, verseNum] = verseKey.split(":").map(Number);
      const verses = await loadSurahVerses(surahId, textType);
      const verse = verses.find((v) => v.verse_number === verseNum);
      if (!verse) throw new Error(`Verse not found: ${verseKey}`);
      return verse;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

/** Berkenar page query — loads verses by berkenar page mapping */
export const versesByBerkenarPageQueryOptions = (pageNumber: number) =>
  queryOptions({
    queryKey: QUERY_KEYS.berkenar.versesPage(pageNumber, getTextType()),
    queryFn: async () => {
      const textType = getTextType();
      const berkenar = await loadBerkenarPages();
      const verseKeys = berkenar.pages[String(pageNumber)] ?? [];
      const surahIds = berkenar.pageToSurahs[String(pageNumber)] ?? [];

      // Load all needed surahs
      const surahVersesMap = new Map<number, Verse[]>();
      for (const sid of surahIds) {
        if (!surahVersesMap.has(sid)) {
          surahVersesMap.set(sid, await loadSurahVerses(sid, textType));
        }
      }

      // Build a lookup and collect in berkenar order
      const allVersesByKey = new Map<string, Verse>();
      for (const [, verses] of surahVersesMap) {
        for (const v of verses) {
          allVersesByKey.set(v.verse_key, v);
        }
      }

      const allVerses: Verse[] = [];
      for (const vk of verseKeys) {
        const v = allVersesByKey.get(vk);
        if (v) allVerses.push(v);
      }

      return {
        verses: allVerses,
        pagination: {
          current_page: 1,
          total_pages: 1,
          total_records: allVerses.length,
          per_page: allVerses.length,
        },
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

type PageVersesResult = {
  verses: Verse[];
  pagination: { current_page: number; total_pages: number; total_records: number; per_page: number };
};

/** Unified dispatcher — picks the right query based on page layout */
export function versesByLayoutPageQueryOptions(
  pageNumber: number,
  layout: PageLayout,
) {
  const opts = layout === "berkenar"
    ? versesByBerkenarPageQueryOptions(pageNumber)
    : versesByPageQueryOptions(pageNumber);
  return opts as ReturnType<typeof queryOptions<PageVersesResult, Error, PageVersesResult, readonly unknown[]>>;
}
