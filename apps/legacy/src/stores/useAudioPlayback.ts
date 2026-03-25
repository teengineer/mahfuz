import { create } from "zustand";

export type PlaybackState = "idle" | "loading" | "playing" | "paused" | "ended";

interface AudioPlaybackState {
  playbackState: PlaybackState;
  currentVerseKey: string | null;
  currentWordPosition: number | null;
  currentTime: number;
  duration: number;
  chapterId: number | null;
  chapterName: string | null;
  verseKeys: string[];
  isVisible: boolean;
  isExpanded: boolean;

  // Actions
  setPlaybackState: (state: PlaybackState) => void;
  setCurrentVerse: (verseKey: string | null) => void;
  setWordPosition: (position: number | null) => void;
  setTimeUpdate: (currentTime: number, duration: number) => void;
  setContext: (chapterId: number, chapterName: string, verseKeys: string[]) => void;
  setVisible: (visible: boolean) => void;
  setExpanded: (expanded: boolean) => void;
  reset: () => void;
}

const initialState = {
  playbackState: "idle" as PlaybackState,
  currentVerseKey: null,
  currentWordPosition: null,
  currentTime: 0,
  duration: 0,
  chapterId: null,
  chapterName: null,
  verseKeys: [] as string[],
  isVisible: false,
  isExpanded: false,
};

export const useAudioPlayback = create<AudioPlaybackState>()((set) => ({
  ...initialState,
  setPlaybackState: (playbackState) => set({ playbackState }),
  setCurrentVerse: (currentVerseKey) => set({ currentVerseKey }),
  setWordPosition: (currentWordPosition) => set({ currentWordPosition }),
  setTimeUpdate: (currentTime, duration) => set({ currentTime, duration }),
  setContext: (chapterId, chapterName, verseKeys) =>
    set({ chapterId, chapterName, verseKeys, isVisible: true }),
  setVisible: (isVisible) => set({ isVisible }),
  setExpanded: (isExpanded) => set({ isExpanded }),
  reset: () => set(initialState),
}));
