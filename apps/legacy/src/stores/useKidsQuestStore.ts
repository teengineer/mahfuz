import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { KidsQuestType } from "~/lib/kids-constants";

export interface KidsQuest {
  id: string;
  type: KidsQuestType;
  target: number;
  progress: number;
  completed: boolean;
  rewardClaimed: boolean;
}

interface KidsQuestState {
  date: string; // "YYYY-MM-DD"
  quests: KidsQuest[];
  chestOpened: boolean;

  // Actions
  setQuests: (date: string, quests: KidsQuest[]) => void;
  incrementQuest: (questId: string, amount?: number) => void;
  completeQuest: (questId: string) => void;
  claimReward: (questId: string) => void;
  openChest: () => void;
  allCompleted: () => boolean;

  _reset: () => void;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useKidsQuestStore = create<KidsQuestState>()(
  persist(
    (set, get) => ({
      date: today(),
      quests: [],
      chestOpened: false,

      setQuests: (date, quests) => set({ date, quests, chestOpened: false }),

      incrementQuest: (questId, amount = 1) =>
        set((s) => ({
          quests: s.quests.map((q) => {
            if (q.id !== questId) return q;
            const newProgress = Math.min(q.progress + amount, q.target);
            return {
              ...q,
              progress: newProgress,
              completed: newProgress >= q.target,
            };
          }),
        })),

      completeQuest: (questId) =>
        set((s) => ({
          quests: s.quests.map((q) =>
            q.id === questId ? { ...q, completed: true, progress: q.target } : q,
          ),
        })),

      claimReward: (questId) =>
        set((s) => ({
          quests: s.quests.map((q) =>
            q.id === questId ? { ...q, rewardClaimed: true } : q,
          ),
        })),

      openChest: () => set({ chestOpened: true }),

      allCompleted: () => get().quests.every((q) => q.completed),

      _reset: () => set({ date: today(), quests: [], chestOpened: false }),
    }),
    { name: "mahfuz-kids-quests" },
  ),
);
