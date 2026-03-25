import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  MemorizationStats,
  QualityGrade,
} from "@mahfuz/shared/types";

// --- New mode-aware types ---
export type MemorizeMode = "learn" | "listen" | "test" | "type" | "immersive";
export type SessionPhase = "idle" | "selecting" | "active" | "results";
export type MemorizeSourceType = "surah" | "page" | "juz";
export interface MemorizeSource { type: MemorizeSourceType; id: number }

export interface WordResult {
  wordPosition: number;
  verseKey: string;
  correct: boolean;
  mode: MemorizeMode;
  timeMs: number;
}

export interface VerseResult {
  verseKey: string;
  mode: MemorizeMode;
  wordsCorrect: number;
  wordsTotal: number;
  timeMs: number;
}

export interface ModeResult {
  mode: MemorizeMode;
  source: MemorizeSource;
  verseResults: VerseResult[];
  totalCorrect: number;
  totalWords: number;
  completedAt: number;
}

interface MemorizationStoreState {
  // Mode session
  phase: SessionPhase;
  activeMode: MemorizeMode | null;
  activeSource: MemorizeSource | null;
  currentVerseIndex: number;
  totalVerses: number;
  wordResults: WordResult[];
  verseResults: VerseResult[];
  lastModeResult: ModeResult | null;

  // Stats (loaded from DB)
  stats: MemorizationStats | null;

  // Goals (persisted)
  newCardsPerDay: number;
  reviewCardsPerDay: number;

  // Actions
  startMode: (mode: MemorizeMode, source: MemorizeSource, totalVerses: number) => void;
  advanceVerse: () => void;
  setCurrentVerse: (index: number) => void;
  recordWordResult: (result: WordResult) => void;
  completeVerse: (result: VerseResult) => void;
  finishMode: (result: ModeResult) => void;
  resetSession: () => void;
  setStats: (stats: MemorizationStats) => void;
  setGoals: (newCards: number, reviewCards: number) => void;
}

export const useMemorizationStore = create<MemorizationStoreState>()(
  persist(
    (set, get) => ({
      // Session state
      phase: "idle",
      activeMode: null,
      activeSource: null,
      currentVerseIndex: 0,
      totalVerses: 0,
      wordResults: [],
      verseResults: [],
      lastModeResult: null,
      stats: null,

      // Defaults
      newCardsPerDay: 5,
      reviewCardsPerDay: 20,

      startMode: (mode, source, totalVerses) =>
        set({
          phase: "active",
          activeMode: mode,
          activeSource: source,
          currentVerseIndex: 0,
          totalVerses,
          wordResults: [],
          verseResults: [],
          lastModeResult: null,
        }),

      advanceVerse: () => {
        const { currentVerseIndex, totalVerses } = get();
        const next = currentVerseIndex + 1;
        if (next < totalVerses) {
          set({ currentVerseIndex: next });
        }
      },

      setCurrentVerse: (index) => set({ currentVerseIndex: index }),

      recordWordResult: (result) => {
        const { wordResults } = get();
        set({ wordResults: [...wordResults, result] });
      },

      completeVerse: (result) => {
        const { verseResults } = get();
        set({ verseResults: [...verseResults, result] });
      },

      finishMode: (result) =>
        set({
          phase: "results",
          lastModeResult: result,
        }),

      resetSession: () =>
        set({
          phase: "idle",
          activeMode: null,
          activeSource: null,
          currentVerseIndex: 0,
          totalVerses: 0,
          wordResults: [],
          verseResults: [],
          lastModeResult: null,
        }),

      setStats: (stats) => set({ stats }),

      setGoals: (newCards, reviewCards) =>
        set({ newCardsPerDay: newCards, reviewCardsPerDay: reviewCards }),
    }),
    {
      name: "mahfuz-memorization",
      partialize: (state) => ({
        newCardsPerDay: state.newCardsPerDay,
        reviewCardsPerDay: state.reviewCardsPerDay,
      }),
    },
  ),
);

// Grade conversion helpers
export function gradeFromAccuracy(
  accuracy: number,
  mode: MemorizeMode,
): QualityGrade {
  if (mode === "learn" || mode === "listen") return 3;
  if (mode === "immersive") return 2;
  if (mode === "type") {
    if (accuracy >= 0.9) return 5;
    if (accuracy >= 0.7) return 4;
    if (accuracy >= 0.5) return 3;
    return 1;
  }
  // test mode
  if (accuracy >= 0.9) return 5;
  if (accuracy >= 0.7) return 4;
  if (accuracy >= 0.5) return 3;
  if (accuracy >= 0.3) return 2;
  return 1;
}
