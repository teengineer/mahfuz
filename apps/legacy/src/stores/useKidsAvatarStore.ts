import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AvatarItemCategory } from "~/lib/kids-constants";

export interface OwnedItem {
  itemId: string;
  category: AvatarItemCategory;
  equipped: boolean;
  unlockedAt: number;
}

interface KidsAvatarState {
  ownedItems: OwnedItem[];

  // Actions
  unlockItem: (itemId: string, category: AvatarItemCategory) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (itemId: string) => void;
  isOwned: (itemId: string) => boolean;
  getEquipped: () => OwnedItem[];
  getEquippedByCategory: (category: AvatarItemCategory) => OwnedItem | undefined;

  _loadItems: (items: OwnedItem[]) => void;
  _reset: () => void;
}

export const useKidsAvatarStore = create<KidsAvatarState>()(
  persist(
    (set, get) => ({
      ownedItems: [],

      unlockItem: (itemId, category) =>
        set((s) => {
          if (s.ownedItems.some((i) => i.itemId === itemId)) return s;
          return {
            ownedItems: [
              ...s.ownedItems,
              { itemId, category, equipped: false, unlockedAt: Date.now() },
            ],
          };
        }),

      equipItem: (itemId) =>
        set((s) => {
          const item = s.ownedItems.find((i) => i.itemId === itemId);
          if (!item) return s;
          // Unequip other items in the same category, equip this one
          return {
            ownedItems: s.ownedItems.map((i) => {
              if (i.itemId === itemId) return { ...i, equipped: true };
              if (i.category === item.category) return { ...i, equipped: false };
              return i;
            }),
          };
        }),

      unequipItem: (itemId) =>
        set((s) => ({
          ownedItems: s.ownedItems.map((i) =>
            i.itemId === itemId ? { ...i, equipped: false } : i,
          ),
        })),

      isOwned: (itemId) =>
        get().ownedItems.some((i) => i.itemId === itemId),

      getEquipped: () =>
        get().ownedItems.filter((i) => i.equipped),

      getEquippedByCategory: (category) =>
        get().ownedItems.find((i) => i.category === category && i.equipped),

      _loadItems: (items) => set({ ownedItems: items }),
      _reset: () => set({ ownedItems: [] }),
    }),
    { name: "mahfuz-kids-avatar" },
  ),
);
