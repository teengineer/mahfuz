import { queryOptions } from "@tanstack/react-query";
import type { TextType, Verse } from "@mahfuz/shared/types";
import {
  loadSurahText,
  loadSurahVerses,
  loadQuranMeta,
} from "~/lib/quran-data";
import { QUERY_KEYS } from "~/lib/query-keys";

/**
 * All verses for a surah — loaded from static JSON (no pagination needed).
 */
export const staticVersesByChapterQueryOptions = (
  chapterId: number,
  textType: TextType
) =>
  queryOptions({
    queryKey: QUERY_KEYS.staticVerses.chapter(chapterId, textType),
    queryFn: async () => {
      const data = await loadSurahText(chapterId, textType);
      const verses = await loadSurahVerses(chapterId, textType);
      return {
        verses,
        bismillah: data.bismillah,
      };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

/**
 * All verses on a mushaf page — loads meta to find surahs, then loads & filters.
 */
export const staticVersesByPageQueryOptions = (
  pageNumber: number,
  textType: TextType
) =>
  queryOptions({
    queryKey: QUERY_KEYS.staticVerses.page(pageNumber, textType),
    queryFn: async () => {
      const meta = await loadQuranMeta();
      const surahIds = meta.pageToSurahs[pageNumber] ?? [];

      const allVerses: Verse[] = [];
      for (const surahId of surahIds) {
        const verses = await loadSurahVerses(surahId, textType);
        const pageVerses = verses.filter((v) => v.page_number === pageNumber);
        allVerses.push(...pageVerses);
      }

      return { verses: allVerses };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

/**
 * All verses in a juz — loads meta to find surah range, then loads & filters.
 */
export const staticVersesByJuzQueryOptions = (
  juzNumber: number,
  textType: TextType
) =>
  queryOptions({
    queryKey: QUERY_KEYS.staticVerses.juz(juzNumber, textType),
    queryFn: async () => {
      const meta = await loadQuranMeta();
      const boundary = meta.juzBoundaries[juzNumber];
      if (!boundary) throw new Error(`Unknown juz: ${juzNumber}`);

      const [startSura, startAya] = boundary.start.split(":").map(Number);
      const [endSura, endAya] = boundary.end.split(":").map(Number);

      const allVerses: Verse[] = [];
      for (let surahId = startSura; surahId <= endSura; surahId++) {
        const verses = await loadSurahVerses(surahId, textType);
        const filtered = verses.filter((v) => {
          if (surahId === startSura && v.verse_number < startAya) return false;
          if (surahId === endSura && v.verse_number > endAya) return false;
          return true;
        });
        allVerses.push(...filtered);
      }

      return { verses: allVerses };
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

/**
 * Single verse by key — loads the surah and finds the verse.
 */
export const staticVerseByKeyQueryOptions = (
  verseKey: string,
  textType: TextType
) =>
  queryOptions({
    queryKey: QUERY_KEYS.staticVerse(verseKey, textType),
    queryFn: async () => {
      const [surahId, verseNum] = verseKey.split(":").map(Number);
      const verses = await loadSurahVerses(surahId, textType);
      const verse = verses.find((v) => v.verse_number === verseNum);
      if (!verse) throw new Error(`Verse not found: ${verseKey}`);
      return verse;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
