import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ReadingHistoryState {
  lastSurahId: number | null;
  lastSurahName: string | null;
  lastPageNumber: number | null;
  lastJuzNumber: number | null;
  lastVerseKey: string | null;
  lastVerseNum: number | null;

  visitSurah: (id: number, name?: string) => void;
  visitVerse: (surahId: number, verseNum: number, surahName?: string) => void;
  visitPage: (page: number) => void;
  visitJuz: (juz: number) => void;
  _setAll: (data: {
    lastSurahId: number | null;
    lastSurahName: string | null;
    lastPageNumber: number | null;
    lastJuzNumber: number | null;
    lastVerseKey?: string | null;
    lastVerseNum?: number | null;
  }, syncUpdatedAt: number) => void;
}

export const useReadingHistory = create<ReadingHistoryState>()(
  persist(
    (set) => ({
      lastSurahId: null,
      lastSurahName: null,
      lastPageNumber: null,
      lastJuzNumber: null,
      lastVerseKey: null,
      lastVerseNum: null,

      visitSurah: (id, name) => set({ lastSurahId: id, lastSurahName: name ?? null }),
      visitVerse: (surahId, verseNum, surahName) => set({
        lastSurahId: surahId,
        lastSurahName: surahName ?? null,
        lastVerseKey: `${surahId}:${verseNum}`,
        lastVerseNum: verseNum,
      }),
      visitPage: (page) => set({ lastPageNumber: page }),
      visitJuz: (juz) => set({ lastJuzNumber: juz }),
      _setAll: (data) => set({
        lastSurahId: data.lastSurahId,
        lastSurahName: data.lastSurahName,
        lastPageNumber: data.lastPageNumber,
        lastJuzNumber: data.lastJuzNumber,
        lastVerseKey: data.lastVerseKey ?? null,
        lastVerseNum: data.lastVerseNum ?? null,
      }),
    }),
    { name: "mahfuz-reading-history" },
  ),
);
