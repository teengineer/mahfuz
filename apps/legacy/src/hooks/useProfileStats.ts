import { useState, useEffect, useCallback } from "react";
import { memorizationRepository } from "@mahfuz/db";
import type { UserBadgeEntry } from "@mahfuz/db";
import { computeStats, computeStreak, computeQuranProgress, computeDailyHistory } from "@mahfuz/memorization";
import type { MemorizationStats } from "@mahfuz/shared/types";
import type { DailyHistoryEntry } from "~/components/memorization/ImprovementChart";

interface ProfileStats {
  stats: MemorizationStats | null;
  masteredVerses: number;
  masteredSurahs: number;
  longestStreak: number;
  last7Days: boolean[];
  dailyHistory: DailyHistoryEntry[];
  badges: UserBadgeEntry[];
}

function getTodayStart(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function useProfileStats(userId: string | undefined) {
  const [data, setData] = useState<ProfileStats>({
    stats: null,
    masteredVerses: 0,
    masteredSurahs: 0,
    longestStreak: 0,
    last7Days: Array(7).fill(false),
    dailyHistory: [],
    badges: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const allCards = await memorizationRepository.getAllCards(userId);
      const cards = allCards.map((e) => ({
        ...e,
        nextReviewDate: new Date(e.nextReviewDate),
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
      }));

      const todayStart = getTodayStart();
      const reviewsToday = await memorizationRepository.getReviewsToday(userId, todayStart);
      const reviewDates = await memorizationRepository.getReviewDates(userId);
      const streak = computeStreak(reviewDates);
      const stats = computeStats(cards, reviewsToday.length, streak);
      const { masteredVerses, masteredSurahs } = computeQuranProgress(cards);

      // Compute longest streak (walk all days)
      const daySet = new Set<string>();
      for (const ts of reviewDates) {
        const d = new Date(ts);
        daySet.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
      }
      let longestStreak = 0;
      let tempStreak = 0;
      const sortedDays = Array.from(daySet).sort();
      for (let i = 0; i < sortedDays.length; i++) {
        if (i === 0) { tempStreak = 1; }
        else {
          const [py, pm, pd] = sortedDays[i - 1].split("-").map(Number);
          const [cy, cm, cd] = sortedDays[i].split("-").map(Number);
          const prev = new Date(py, pm, pd);
          const curr = new Date(cy, cm, cd);
          const diff = (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000);
          tempStreak = diff === 1 ? tempStreak + 1 : 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
      }

      // Last 7 days activity
      const now = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        return daySet.has(key);
      });

      // Daily history (reviews with grade info)
      const allReviewEntries = await memorizationRepository.getReviewsToday(userId, 0); // get all
      const dailyHistory = computeDailyHistory(
        allReviewEntries.map((r) => ({ reviewedAt: r.reviewedAt, grade: r.grade })),
        30,
      );

      const badges = await memorizationRepository.getUnlockedBadges(userId);

      setData({ stats, masteredVerses, masteredSurahs, longestStreak, last7Days, dailyHistory, badges });
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  return { ...data, isLoading, refresh: load };
}
