import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { KidsAgeGroup } from "~/lib/kids-constants";
import { getAgeGroup, getLevelForStars } from "~/lib/kids-constants";

export interface KidsProfile {
  id: string;
  name: string;
  birthYear: number;
  avatarId: string;
  ageGroup: KidsAgeGroup;
}

interface KidsState {
  // Active profile
  activeProfileId: string | null;
  profiles: KidsProfile[];

  // Rewards (synced from DB, cached locally)
  stars: number;
  gems: number;
  level: number;
  streak: number;
  freezeDaysLeft: number;

  // Session tracking
  sessionStartedAt: number | null;
  sessionTimeSpent: number; // seconds
  dailyTimeLimit: number; // minutes, 0 = unlimited

  // Actions
  setActiveProfile: (profile: KidsProfile) => void;
  addProfile: (profile: KidsProfile) => void;
  removeProfile: (profileId: string) => void;
  updateProfile: (profileId: string, updates: Partial<Pick<KidsProfile, "name" | "avatarId">>) => void;
  clearActiveProfile: () => void;

  addStars: (amount: number) => void;
  addGems: (amount: number) => void;
  spendGems: (amount: number) => boolean;
  setStreak: (streak: number) => void;
  setFreezeDaysLeft: (days: number) => void;

  startSession: () => void;
  tickSession: () => void;
  endSession: () => void;
  setDailyTimeLimit: (minutes: number) => void;

  // Bulk restore (from sync)
  _restoreRewards: (data: { stars: number; gems: number; level: number; streak: number; freezeDaysLeft: number }) => void;
}

export const useKidsStore = create<KidsState>()(
  persist(
    (set, get) => ({
      activeProfileId: null,
      profiles: [],
      stars: 0,
      gems: 0,
      level: 1,
      streak: 0,
      freezeDaysLeft: 1,
      sessionStartedAt: null,
      sessionTimeSpent: 0,
      dailyTimeLimit: 0,

      setActiveProfile: (profile) =>
        set({ activeProfileId: profile.id }),

      addProfile: (profile) =>
        set((s) => ({ profiles: [...s.profiles, profile] })),

      removeProfile: (profileId) =>
        set((s) => ({
          profiles: s.profiles.filter((p) => p.id !== profileId),
          activeProfileId: s.activeProfileId === profileId ? null : s.activeProfileId,
        })),

      updateProfile: (profileId, updates) =>
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === profileId ? { ...p, ...updates } : p,
          ),
        })),

      clearActiveProfile: () =>
        set({ activeProfileId: null, stars: 0, gems: 0, level: 1, streak: 0 }),

      addStars: (amount) =>
        set((s) => {
          const newStars = s.stars + amount;
          const newLevel = getLevelForStars(newStars).id;
          return { stars: newStars, level: newLevel };
        }),

      addGems: (amount) =>
        set((s) => ({ gems: s.gems + amount })),

      spendGems: (amount) => {
        const { gems } = get();
        if (gems < amount) return false;
        set({ gems: gems - amount });
        return true;
      },

      setStreak: (streak) => set({ streak }),
      setFreezeDaysLeft: (days) => set({ freezeDaysLeft: days }),

      startSession: () =>
        set({ sessionStartedAt: Date.now(), sessionTimeSpent: 0 }),

      tickSession: () =>
        set((s) => {
          if (!s.sessionStartedAt) return s;
          return { sessionTimeSpent: Math.floor((Date.now() - s.sessionStartedAt) / 1000) };
        }),

      endSession: () =>
        set({ sessionStartedAt: null, sessionTimeSpent: 0 }),

      setDailyTimeLimit: (minutes) => set({ dailyTimeLimit: minutes }),

      _restoreRewards: (data) => set(data),
    }),
    {
      name: "mahfuz-kids",
      partialize: (state) => ({
        activeProfileId: state.activeProfileId,
        profiles: state.profiles,
        dailyTimeLimit: state.dailyTimeLimit,
      }),
    },
  ),
);

// Selectors
export const useActiveKidsProfile = () =>
  useKidsStore((s) => s.profiles.find((p) => p.id === s.activeProfileId) ?? null);

export const useKidsAgeGroup = () => {
  const profile = useActiveKidsProfile();
  return profile ? getAgeGroup(profile.birthYear) : "big";
};
