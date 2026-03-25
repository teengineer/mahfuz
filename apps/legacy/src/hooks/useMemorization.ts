import { useState, useEffect, useCallback } from "react";
import type {
  MemorizationCard,
  MemorizationStats,
  ConfidenceLevel,
  VerseKey,
} from "@mahfuz/shared/types";
import { SM2_DEFAULTS } from "@mahfuz/shared/constants";
import { calculateSM2 } from "@mahfuz/memorization";
import { computeStats, computeStreak } from "@mahfuz/memorization";
import {
  memorizationRepository,
  type MemorizationCardEntry,
} from "@mahfuz/db";
import {
  useMemorizationStore,
  gradeFromAccuracy,
  type ModeResult,
} from "~/stores/useMemorizationStore";

// Helpers
function entryToCard(e: MemorizationCardEntry): MemorizationCard {
  return {
    ...e,
    nextReviewDate: new Date(e.nextReviewDate),
    createdAt: new Date(e.createdAt),
    updatedAt: new Date(e.updatedAt),
  };
}

function cardToEntry(c: MemorizationCard): MemorizationCardEntry {
  return {
    ...c,
    nextReviewDate: c.nextReviewDate.getTime(),
    createdAt: c.createdAt.getTime(),
    updatedAt: c.updatedAt.getTime(),
  };
}

function getTodayStart(): number {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// useMemorizationDashboard
export function useMemorizationDashboard(userId: string | undefined) {
  const [stats, setStats] = useState<MemorizationStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setStoreStats = useMemorizationStore((s) => s.setStats);

  const refreshStats = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      await memorizationRepository.deduplicateCards(userId);
      const allCards = await memorizationRepository.getAllCards(userId);
      const cards = allCards.map(entryToCard);
      const todayStart = getTodayStart();
      const reviewsToday = await memorizationRepository.getReviewsToday(
        userId,
        todayStart,
      );
      const reviewDates = await memorizationRepository.getReviewDates(userId);
      const streak = computeStreak(reviewDates);
      const computed = computeStats(cards, reviewsToday.length, streak);
      setStats(computed);
      setStoreStats(computed);
    } finally {
      setIsLoading(false);
    }
  }, [userId, setStoreStats]);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  return { stats, isLoading, refreshStats };
}

// useAddVerses
export function useAddVerses(userId: string | undefined) {
  const [isAdding, setIsAdding] = useState(false);

  const addVerses = useCallback(
    async (surahId: number, verseNumbers: number[]) => {
      if (!userId) return;
      setIsAdding(true);
      try {
        const existing = await memorizationRepository.getCardsBySurah(userId, surahId);
        const existingKeys = new Set(existing.map((c) => c.verseKey));
        const newVerses = verseNumbers.filter(
          (num) => !existingKeys.has(`${surahId}:${num}` as VerseKey),
        );
        if (newVerses.length === 0) return;

        const now = Date.now();
        const cards: MemorizationCardEntry[] = newVerses.map((num) => ({
          id: crypto.randomUUID(),
          userId,
          verseKey: `${surahId}:${num}` as VerseKey,
          easeFactor: SM2_DEFAULTS.INITIAL_EASE_FACTOR,
          repetition: 0,
          interval: 0,
          nextReviewDate: now,
          confidence: "learning" as ConfidenceLevel,
          totalReviews: 0,
          correctReviews: 0,
          createdAt: now,
          updatedAt: now,
        }));
        await memorizationRepository.createCards(cards);
      } finally {
        setIsAdding(false);
      }
    },
    [userId],
  );

  return { addVerses, isAdding };
}

// useSurahProgress
export function useSurahProgress(
  userId: string | undefined,
  surahId: number,
) {
  const [progressMap, setProgressMap] = useState<
    Map<string, { confidence: ConfidenceLevel; nextReview: Date }>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const entries = await memorizationRepository.getCardsBySurah(
        userId,
        surahId,
      );
      const map = new Map<
        string,
        { confidence: ConfidenceLevel; nextReview: Date }
      >();
      for (const e of entries) {
        map.set(e.verseKey, {
          confidence: e.confidence,
          nextReview: new Date(e.nextReviewDate),
        });
      }
      setProgressMap(map);
    } finally {
      setIsLoading(false);
    }
  }, [userId, surahId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { progressMap, isLoading, refresh };
}

/**
 * useGradeFromMode — Converts ModeResult into SM-2 grades per verse.
 * Auto-creates cards for verses that don't have one yet.
 */
export function useGradeFromMode(userId: string | undefined) {
  const [isGrading, setIsGrading] = useState(false);

  const gradeMode = useCallback(
    async (result: ModeResult) => {
      if (!userId) return;
      setIsGrading(true);
      try {
        const now = new Date();

        for (const vr of result.verseResults) {
          const accuracy = vr.wordsTotal > 0 ? vr.wordsCorrect / vr.wordsTotal : 0;
          const grade = gradeFromAccuracy(accuracy, result.mode);

          // Get or create card — extract surahId from verseKey for lookup
          const surahIdFromKey = Number(vr.verseKey.split(":")[0]);
          let entries = await memorizationRepository.getCardsBySurah(
            userId,
            surahIdFromKey,
          );
          let entry = entries.find((e) => e.verseKey === vr.verseKey);

          if (!entry) {
            // Auto-create card
            entry = {
              id: crypto.randomUUID(),
              userId,
              verseKey: vr.verseKey as VerseKey,
              easeFactor: SM2_DEFAULTS.INITIAL_EASE_FACTOR,
              repetition: 0,
              interval: 0,
              nextReviewDate: Date.now(),
              confidence: "learning" as ConfidenceLevel,
              totalReviews: 0,
              correctReviews: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            await memorizationRepository.upsertCard(entry);
          }

          const card = entryToCard(entry);
          const sm2Result = calculateSM2(card, grade, now);

          const updatedCard: MemorizationCard = {
            ...card,
            easeFactor: sm2Result.easeFactor,
            repetition: sm2Result.repetition,
            interval: sm2Result.interval,
            nextReviewDate: sm2Result.nextReviewDate,
            confidence: sm2Result.confidence,
            totalReviews: card.totalReviews + 1,
            correctReviews:
              card.correctReviews + (grade >= SM2_DEFAULTS.PASSING_GRADE ? 1 : 0),
            updatedAt: now,
          };

          await memorizationRepository.upsertCard(cardToEntry(updatedCard));

          await memorizationRepository.addReview({
            id: crypto.randomUUID(),
            userId,
            cardId: card.id,
            verseKey: vr.verseKey,
            grade,
            previousEaseFactor: card.easeFactor,
            newEaseFactor: sm2Result.easeFactor,
            previousInterval: card.interval,
            newInterval: sm2Result.interval,
            reviewedAt: now.getTime(),
          });
        }
      } finally {
        setIsGrading(false);
      }
    },
    [userId],
  );

  return { gradeMode, isGrading };
}
