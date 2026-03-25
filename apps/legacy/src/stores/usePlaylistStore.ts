import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QDCAudioFile } from "@mahfuz/shared/types";
import { buildFilteredAudio } from "~/lib/playlist-helpers";
import { useAudioStore } from "./useAudioStore";

export interface PlaylistItem {
  id: string;
  surahId: number;
  surahNameAr: string;
  surahNameTr: string;
  versesCount: number;
  fromVerse: number;
  toVerse: number;
  repeatCount: number;
}

export type FetchAudioFn = (reciterId: number, surahId: number) => Promise<QDCAudioFile>;

interface PlaylistState {
  // Persisted
  items: PlaylistItem[];

  // Ephemeral playback state
  isActive: boolean;
  currentItemIndex: number;
  remainingRepeats: number;
  isLoadingNext: boolean;
  _userPaused: boolean;

  // CRUD actions
  addItem: (surahId: number, surahNameAr: string, surahNameTr: string, versesCount: number, fromVerse?: number, toVerse?: number) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, patch: Partial<Pick<PlaylistItem, "fromVerse" | "toVerse" | "repeatCount">>) => void;
  moveItem: (fromIndex: number, toIndex: number) => void;
  splitItem: (id: string, chunkSize: number) => void;
  clearPlaylist: () => void;

  // Playback actions
  startPlaylist: (fetchAudio: FetchAudioFn) => Promise<void>;
  stopPlaylist: () => void;
  pausePlaylist: () => void;
  resumePlaylist: () => void;
  skipToNext: (fetchAudio: FetchAudioFn) => Promise<void>;

  // Internal: called from useAudioStore callbacks
  _handleVerseEnd: (verseKey: string) => void;
  _handlePlaybackEnded: () => void;

  // Internal ref for fetch function (not persisted)
  _fetchAudioRef: FetchAudioFn | null;
}

async function playCurrentItem(
  get: () => PlaylistState,
  set: (partial: Partial<PlaylistState>) => void,
  fetchAudio: FetchAudioFn,
) {
  const { items, currentItemIndex } = get();
  if (currentItemIndex >= items.length) {
    set({ isActive: false, isLoadingNext: false });
    return;
  }

  const item = items[currentItemIndex];
  const audioStore = useAudioStore.getState();
  const { reciterId } = audioStore;

  set({ isLoadingNext: true });

  try {
    const qdcFile = await fetchAudio(reciterId, item.surahId);
    const audioData = buildFilteredAudio(qdcFile, item.fromVerse, item.toVerse);

    // Check we're still active and not paused after async fetch
    if (!get().isActive || get()._userPaused) return;

    set({ isLoadingNext: false });

    const displayName = item.surahNameTr || item.surahNameAr;
    audioStore.playSurah(item.surahId, displayName, audioData);
  } catch {
    set({ isActive: false, isLoadingNext: false });
  }
}

export const usePlaylistStore = create<PlaylistState>()(
  persist(
    (set, get) => ({
      items: [],
      isActive: false,
      currentItemIndex: 0,
      remainingRepeats: 1,
      isLoadingNext: false,
      _userPaused: false,
      _fetchAudioRef: null,

      addItem: (surahId, surahNameAr, surahNameTr, versesCount, fromVerse?, toVerse?) => {
        const item: PlaylistItem = {
          id: crypto.randomUUID(),
          surahId,
          surahNameAr,
          surahNameTr,
          versesCount,
          fromVerse: fromVerse ?? 1,
          toVerse: toVerse ?? versesCount,
          repeatCount: 1,
        };
        set({ items: [...get().items, item] });
      },

      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },

      updateItem: (id, patch) => {
        set({
          items: get().items.map((i) =>
            i.id === id ? { ...i, ...patch } : i,
          ),
        });
      },

      moveItem: (fromIndex, toIndex) => {
        const items = [...get().items];
        const [moved] = items.splice(fromIndex, 1);
        items.splice(toIndex, 0, moved);
        set({ items });
      },

      splitItem: (id, chunkSize) => {
        const items = [...get().items];
        const idx = items.findIndex((i) => i.id === id);
        if (idx === -1) return;

        const item = items[idx];
        const chunks: PlaylistItem[] = [];
        for (let v = item.fromVerse; v <= item.toVerse; v += chunkSize) {
          chunks.push({
            id: crypto.randomUUID(),
            surahId: item.surahId,
            surahNameAr: item.surahNameAr,
            surahNameTr: item.surahNameTr,
            versesCount: item.versesCount,
            fromVerse: v,
            toVerse: Math.min(v + chunkSize - 1, item.toVerse),
            repeatCount: item.repeatCount,
          });
        }

        items.splice(idx, 1, ...chunks);
        set({ items });
      },

      clearPlaylist: () => {
        set({ items: [], isActive: false, currentItemIndex: 0, remainingRepeats: 1 });
      },

      startPlaylist: async (fetchAudio) => {
        const { items } = get();
        if (items.length === 0) return;

        set({
          isActive: true,
          _userPaused: false,
          currentItemIndex: 0,
          remainingRepeats: items[0].repeatCount === 0 ? 1 : items[0].repeatCount,
          _fetchAudioRef: fetchAudio,
        });

        await playCurrentItem(get, set as (p: Partial<PlaylistState>) => void, fetchAudio);
      },

      stopPlaylist: () => {
        set({ isActive: false, isLoadingNext: false, _userPaused: false, _fetchAudioRef: null });
      },

      pausePlaylist: () => {
        set({ _userPaused: true });
      },

      resumePlaylist: () => {
        set({ _userPaused: false });
      },

      skipToNext: async (fetchAudio) => {
        const { items, currentItemIndex, isActive } = get();
        if (!isActive) return;

        const nextIndex = currentItemIndex + 1;
        if (nextIndex >= items.length) {
          set({ isActive: false, _fetchAudioRef: null });
          useAudioStore.getState().engine?.stop();
          return;
        }

        set({
          currentItemIndex: nextIndex,
          remainingRepeats: items[nextIndex].repeatCount,
          _fetchAudioRef: fetchAudio,
        });

        useAudioStore.getState().engine?.stop();
        await playCurrentItem(get, set as (p: Partial<PlaylistState>) => void, fetchAudio);
      },

      _handleVerseEnd: (verseKey: string) => {
        const { isActive, items, currentItemIndex, remainingRepeats, _fetchAudioRef, _userPaused } = get();
        if (!isActive || _userPaused || currentItemIndex >= items.length) return;

        const item = items[currentItemIndex];
        const lastVerseKey = `${item.surahId}:${item.toVerse}`;
        if (verseKey !== lastVerseKey) return;

        // Stop the engine — MP3 keeps playing past verse range otherwise
        useAudioStore.getState().engine?.stop();

        // repeatCount 0 = infinite: always replay, never advance
        if (item.repeatCount === 0) {
          set({ remainingRepeats: remainingRepeats + 1 });
          if (_fetchAudioRef) {
            playCurrentItem(get, set as (p: Partial<PlaylistState>) => void, _fetchAudioRef);
          }
          return;
        }

        const newRepeats = remainingRepeats - 1;

        if (newRepeats > 0) {
          set({ remainingRepeats: newRepeats });
          if (_fetchAudioRef) {
            playCurrentItem(get, set as (p: Partial<PlaylistState>) => void, _fetchAudioRef);
          }
        } else {
          const nextIndex = currentItemIndex + 1;
          if (nextIndex < items.length) {
            set({
              currentItemIndex: nextIndex,
              remainingRepeats: items[nextIndex].repeatCount === 0 ? 1 : items[nextIndex].repeatCount,
            });
            if (_fetchAudioRef) {
              playCurrentItem(get, set as (p: Partial<PlaylistState>) => void, _fetchAudioRef);
            }
          } else {
            set({ isActive: false, _fetchAudioRef: null });
          }
        }
      },

      _handlePlaybackEnded: () => {
        const { isActive, items, currentItemIndex, remainingRepeats, _fetchAudioRef, _userPaused } = get();
        if (!isActive || _userPaused || currentItemIndex >= items.length) return;

        const item = items[currentItemIndex];

        // repeatCount 0 = infinite: always replay
        if (item.repeatCount === 0) {
          set({ remainingRepeats: remainingRepeats + 1 });
          if (_fetchAudioRef) {
            playCurrentItem(get, set as (p: Partial<PlaylistState>) => void, _fetchAudioRef);
          }
          return;
        }

        const newRepeats = remainingRepeats - 1;
        if (newRepeats > 0) {
          set({ remainingRepeats: newRepeats });
          if (_fetchAudioRef) {
            playCurrentItem(get, set as (p: Partial<PlaylistState>) => void, _fetchAudioRef);
          }
        } else {
          const nextIndex = currentItemIndex + 1;
          if (nextIndex < items.length) {
            set({
              currentItemIndex: nextIndex,
              remainingRepeats: items[nextIndex].repeatCount === 0 ? 1 : items[nextIndex].repeatCount,
            });
            if (_fetchAudioRef) {
              playCurrentItem(get, set as (p: Partial<PlaylistState>) => void, _fetchAudioRef);
            }
          } else {
            set({ isActive: false, _fetchAudioRef: null });
          }
        }
      },
    }),
    {
      name: "mahfuz-playlist",
      partialize: (state) => ({
        items: state.items,
      }),
    },
  ),
);
