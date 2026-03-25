import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ReadingListItem {
  type: "surah" | "juz" | "page";
  id: number;
  addedAt: number;
  lastReadAt: number | null;
}

interface ReadingListState {
  items: ReadingListItem[];
  addItem: (type: ReadingListItem["type"], id: number) => void;
  removeItem: (type: ReadingListItem["type"], id: number) => void;
  touchItem: (type: ReadingListItem["type"], id: number) => void;
  isInList: (type: ReadingListItem["type"], id: number) => boolean;
  _setItems: (items: ReadingListItem[], syncUpdatedAt: number) => void;
}

function sortItems(items: ReadingListItem[]) {
  return [...items].sort((a, b) => (b.lastReadAt ?? b.addedAt) - (a.lastReadAt ?? a.addedAt));
}

export const useReadingList = create<ReadingListState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (type, id) => {
        const { items } = get();
        if (items.some((i) => i.type === type && i.id === id)) return;
        const next = [...items, { type, id, addedAt: Date.now(), lastReadAt: null }];
        set({ items: sortItems(next).slice(0, 20) });
      },
      removeItem: (type, id) => {
        set({ items: get().items.filter((i) => !(i.type === type && i.id === id)) });
      },
      touchItem: (type, id) => {
        const items = get().items.map((i) =>
          i.type === type && i.id === id ? { ...i, lastReadAt: Date.now() } : i,
        );
        set({ items: sortItems(items) });
      },
      isInList: (type, id) => get().items.some((i) => i.type === type && i.id === id),
      _setItems: (items) => set({ items: sortItems(items) }),
    }),
    { name: "mahfuz-reading-list" },
  ),
);
