import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface LetterProgress {
  letterId: string;
  completed: boolean;
  stars: number;
  traced: boolean;
  matched: boolean;
  quizzed: boolean;
}

export interface SurahProgress {
  surahId: number;
  listened: boolean;
  repeated: boolean;
  ordered: boolean;
  filled: boolean;
  memorized: boolean;
  certificateAt: number | null;
}

interface KidsProgressState {
  // Letter progress (keyed by letterId)
  letters: Record<string, LetterProgress>;
  // Surah progress (keyed by surahId)
  surahs: Record<number, SurahProgress>;

  // Letter actions
  markLetterTraced: (letterId: string) => void;
  markLetterMatched: (letterId: string) => void;
  markLetterQuizzed: (letterId: string) => void;
  completeLetter: (letterId: string, stars: number) => void;

  // Surah actions
  markSurahListened: (surahId: number) => void;
  markSurahRepeated: (surahId: number) => void;
  markSurahOrdered: (surahId: number) => void;
  markSurahFilled: (surahId: number) => void;
  markSurahMemorized: (surahId: number) => void;
  grantCertificate: (surahId: number) => void;

  // Stats
  completedLetterCount: () => number;
  completedSurahCount: () => number;

  // Reset for profile switch
  _loadProgress: (letters: Record<string, LetterProgress>, surahs: Record<number, SurahProgress>) => void;
  _reset: () => void;
}

function ensureLetter(letters: Record<string, LetterProgress>, letterId: string): LetterProgress {
  return letters[letterId] ?? { letterId, completed: false, stars: 0, traced: false, matched: false, quizzed: false };
}

function ensureSurah(surahs: Record<number, SurahProgress>, surahId: number): SurahProgress {
  return surahs[surahId] ?? { surahId, listened: false, repeated: false, ordered: false, filled: false, memorized: false, certificateAt: null };
}

export const useKidsProgressStore = create<KidsProgressState>()(
  persist(
    (set, get) => ({
      letters: {},
      surahs: {},

      markLetterTraced: (letterId) =>
        set((s) => ({
          letters: { ...s.letters, [letterId]: { ...ensureLetter(s.letters, letterId), traced: true } },
        })),

      markLetterMatched: (letterId) =>
        set((s) => ({
          letters: { ...s.letters, [letterId]: { ...ensureLetter(s.letters, letterId), matched: true } },
        })),

      markLetterQuizzed: (letterId) =>
        set((s) => ({
          letters: { ...s.letters, [letterId]: { ...ensureLetter(s.letters, letterId), quizzed: true } },
        })),

      completeLetter: (letterId, stars) =>
        set((s) => ({
          letters: {
            ...s.letters,
            [letterId]: { ...ensureLetter(s.letters, letterId), completed: true, stars },
          },
        })),

      markSurahListened: (surahId) =>
        set((s) => ({
          surahs: { ...s.surahs, [surahId]: { ...ensureSurah(s.surahs, surahId), listened: true } },
        })),

      markSurahRepeated: (surahId) =>
        set((s) => ({
          surahs: { ...s.surahs, [surahId]: { ...ensureSurah(s.surahs, surahId), repeated: true } },
        })),

      markSurahOrdered: (surahId) =>
        set((s) => ({
          surahs: { ...s.surahs, [surahId]: { ...ensureSurah(s.surahs, surahId), ordered: true } },
        })),

      markSurahFilled: (surahId) =>
        set((s) => ({
          surahs: { ...s.surahs, [surahId]: { ...ensureSurah(s.surahs, surahId), filled: true } },
        })),

      markSurahMemorized: (surahId) =>
        set((s) => ({
          surahs: { ...s.surahs, [surahId]: { ...ensureSurah(s.surahs, surahId), memorized: true } },
        })),

      grantCertificate: (surahId) =>
        set((s) => ({
          surahs: {
            ...s.surahs,
            [surahId]: { ...ensureSurah(s.surahs, surahId), memorized: true, certificateAt: Date.now() },
          },
        })),

      completedLetterCount: () =>
        Object.values(get().letters).filter((l) => l.completed).length,

      completedSurahCount: () =>
        Object.values(get().surahs).filter((s) => s.memorized).length,

      _loadProgress: (letters, surahs) => set({ letters, surahs }),
      _reset: () => set({ letters: {}, surahs: {} }),
    }),
    { name: "mahfuz-kids-progress" },
  ),
);
