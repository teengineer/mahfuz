import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getActiveLayout, getTotalPages } from "~/lib/page-layout";

export interface DailyLog {
  date: string; // YYYY-MM-DD
  pagesRead: number;
  versesRead: number;
  minutesRead: number;
}

interface ReadingStatsState {
  completedPages: number[];
  dailyLogs: DailyLog[];
  currentStreak: number;
  longestStreak: number;
  khatamCount: number;

  markPageRead: (pageNumber: number) => void;
  logDailyReading: (pages: number, verses: number, minutes: number) => void;
  _setAll: (data: Partial<Pick<ReadingStatsState, "completedPages" | "dailyLogs" | "currentStreak" | "longestStreak" | "khatamCount">>) => void;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcStreak(logs: DailyLog[]): { current: number; longest: number } {
  if (logs.length === 0) return { current: 0, longest: 0 };
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const today = todayStr();
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let current = 0;
  let longest = 0;
  let streak = 0;
  let expectedDate = sorted[0].date === today || sorted[0].date === yesterday ? sorted[0].date : null;

  if (!expectedDate) return { current: 0, longest: Math.max(...logs.map(() => 1)) };

  for (const log of sorted) {
    if (log.date === expectedDate) {
      streak++;
      const d = new Date(expectedDate);
      d.setDate(d.getDate() - 1);
      expectedDate = d.toISOString().slice(0, 10);
    } else {
      longest = Math.max(longest, streak);
      break;
    }
  }
  current = streak;
  longest = Math.max(longest, current);
  return { current, longest };
}

export const useReadingStats = create<ReadingStatsState>()(
  persist(
    (set, get) => ({
      completedPages: [],
      dailyLogs: [],
      currentStreak: 0,
      longestStreak: 0,
      khatamCount: 0,

      markPageRead: (pageNumber) => {
        const { completedPages, khatamCount, logDailyReading } = get();
        if (completedPages.includes(pageNumber)) return;
        const newPages = [...completedPages, pageNumber];
        const totalPages = getTotalPages(getActiveLayout());
        if (newPages.length >= totalPages) {
          set({ completedPages: [], khatamCount: khatamCount + 1 });
        } else {
          set({ completedPages: newPages });
        }
        // Auto-log daily reading when a new page is marked
        logDailyReading(1, 0, 0);
      },

      logDailyReading: (pages, verses, minutes) => {
        const { dailyLogs } = get();
        const today = todayStr();
        const existing = dailyLogs.find((l) => l.date === today);
        let newLogs: DailyLog[];
        if (existing) {
          newLogs = dailyLogs.map((l) =>
            l.date === today
              ? { ...l, pagesRead: l.pagesRead + pages, versesRead: l.versesRead + verses, minutesRead: l.minutesRead + minutes }
              : l,
          );
        } else {
          newLogs = [...dailyLogs.slice(-89), { date: today, pagesRead: pages, versesRead: verses, minutesRead: minutes }];
        }
        const { current, longest } = calcStreak(newLogs);
        set({ dailyLogs: newLogs, currentStreak: current, longestStreak: longest });
      },

      _setAll: (data) => set({
        ...(data.completedPages !== undefined && { completedPages: data.completedPages }),
        ...(data.dailyLogs !== undefined && { dailyLogs: data.dailyLogs }),
        ...(data.currentStreak !== undefined && { currentStreak: data.currentStreak }),
        ...(data.longestStreak !== undefined && { longestStreak: data.longestStreak }),
        ...(data.khatamCount !== undefined && { khatamCount: data.khatamCount }),
      }),
    }),
    {
      name: "mahfuz-reading-stats",
      partialize: (state) => ({
        completedPages: state.completedPages,
        dailyLogs: state.dailyLogs,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        khatamCount: state.khatamCount,
      }),
    },
  ),
);
