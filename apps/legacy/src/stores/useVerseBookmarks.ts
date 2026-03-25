import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface VerseBookmark {
  verseKey: string;
  addedAt: number;
}

interface VerseBookmarksState {
  bookmarks: VerseBookmark[];
  addBookmark: (verseKey: string) => void;
  removeBookmark: (verseKey: string) => void;
  isBookmarked: (verseKey: string) => boolean;
  toggleBookmark: (verseKey: string) => boolean;
  _setBookmarks: (bookmarks: VerseBookmark[]) => void;
}

export const useVerseBookmarks = create<VerseBookmarksState>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      addBookmark: (verseKey) => {
        const { bookmarks } = get();
        if (bookmarks.some((b) => b.verseKey === verseKey)) return;
        set({ bookmarks: [...bookmarks, { verseKey, addedAt: Date.now() }] });
        if (typeof localStorage !== "undefined") {
          const { setSyncTimestamp } = require("~/lib/sync-metadata");
          setSyncTimestamp("preferences", Date.now());
        }
      },
      removeBookmark: (verseKey) => {
        set({ bookmarks: get().bookmarks.filter((b) => b.verseKey !== verseKey) });
        if (typeof localStorage !== "undefined") {
          const { setSyncTimestamp } = require("~/lib/sync-metadata");
          setSyncTimestamp("preferences", Date.now());
        }
      },
      isBookmarked: (verseKey) => get().bookmarks.some((b) => b.verseKey === verseKey),
      toggleBookmark: (verseKey) => {
        const { bookmarks } = get();
        const exists = bookmarks.some((b) => b.verseKey === verseKey);
        if (exists) {
          set({ bookmarks: bookmarks.filter((b) => b.verseKey !== verseKey) });
        } else {
          set({ bookmarks: [...bookmarks, { verseKey, addedAt: Date.now() }] });
        }
        if (typeof localStorage !== "undefined") {
          const { setSyncTimestamp } = require("~/lib/sync-metadata");
          setSyncTimestamp("preferences", Date.now());
        }
        return !exists;
      },
      _setBookmarks: (bookmarks) => set({ bookmarks }),
    }),
    { name: "mahfuz-verse-bookmarks" },
  ),
);
