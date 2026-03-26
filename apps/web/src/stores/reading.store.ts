import { create } from "zustand";
import { persist } from "zustand/middleware";

const MAX_RECENT = 4;

export interface ReadingPosition {
  surahId: number;
  ayahNumber: number;
  pageNumber: number;
}

interface ReadingState {
  /** Most recent position (backward compat) */
  lastPosition: ReadingPosition | null;
  /** MRU list — max 4, deduplicated by surahId */
  recentPositions: ReadingPosition[];
}

interface ReadingActions {
  savePosition: (position: ReadingPosition) => void;
}

export const useReadingStore = create<ReadingState & ReadingActions>()(
  persist(
    (set, get) => ({
      lastPosition: null,
      recentPositions: [],
      savePosition: (position) => {
        const prev = get().recentPositions;
        // Remove existing entry for same surah, prepend new one
        const filtered = prev.filter((p) => p.surahId !== position.surahId);
        const next = [position, ...filtered].slice(0, MAX_RECENT);
        set({ lastPosition: position, recentPositions: next });
      },
    }),
    {
      name: "mahfuz-core-reading",
    },
  ),
);
