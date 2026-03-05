import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ReadingHistory {
  lastSurahId: number | null;
  lastSurahName: string | null;
  lastPageNumber: number | null;
  lastJuzNumber: number | null;
  visitSurah: (id: number, name: string) => void;
  visitPage: (page: number) => void;
  visitJuz: (juz: number) => void;
}

export const useReadingHistory = create<ReadingHistory>()(
  persist(
    (set) => ({
      lastSurahId: null,
      lastSurahName: null,
      lastPageNumber: null,
      lastJuzNumber: null,
      visitSurah: (id, name) => set({ lastSurahId: id, lastSurahName: name }),
      visitPage: (page) => set({ lastPageNumber: page }),
      visitJuz: (juz) => set({ lastJuzNumber: juz }),
    }),
    { name: "mahfuz-reading-history" },
  ),
);
