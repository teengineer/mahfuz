import { useState, useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type {
  MemorizationCard,
  MemorizationStats,
  QualityGrade,
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
import { useMemorizationStore, type SessionType } from "~/stores/useMemorizationStore";
import { verseByKeyQueryOptions } from "./useVerses";

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
      // Clean up any duplicate cards (same verseKey)
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

// useReviewSession
export function useReviewSession(userId: string | undefined) {
  const store = useMemorizationStore();
  const queryClient = useQueryClient();

  const startReview = useCallback(
    async (surahId?: number, mode: SessionType = "review") => {
      if (!userId) return;

      const now = Date.now();
      const limit = store.reviewCardsPerDay;

      let entries: MemorizationCardEntry[];
      if (mode === "practice" && surahId) {
        // Practice mode: all cards for surah, no due date filter
        entries = await memorizationRepository.getCardsBySurah(userId, surahId);
      } else if (surahId) {
        const surahCards = await memorizationRepository.getCardsBySurah(
          userId,
          surahId,
        );
        entries = surahCards.filter((c) => c.nextReviewDate <= now);
      } else {
        entries = await memorizationRepository.getDueCards(userId, now, limit);
      }

      const cards = entries.map(entryToCard);

      if (cards.length === 0) return false;

      // Prefetch verse data — load unique surahs (each load caches the full surah)
      const seenSurahs = new Set<string>();
      for (const card of cards) {
        const surahKey = card.verseKey.split(":")[0];
        if (!seenSurahs.has(surahKey)) {
          seenSurahs.add(surahKey);
          queryClient.prefetchQuery(verseByKeyQueryOptions(card.verseKey));
        }
      }

      store.startSession(cards, mode);
      return true;
    },
    [userId, store, queryClient],
  );

  const gradeCurrentCard = useCallback(
    async (grade: QualityGrade) => {
      if (!userId) return;

      const card = store.sessionCards[store.currentCardIndex];
      if (!card) return;

      const now = new Date();
      const result = calculateSM2(card, grade, now);

      // Update the card
      const updatedCard: MemorizationCard = {
        ...card,
        easeFactor: result.easeFactor,
        repetition: result.repetition,
        interval: result.interval,
        nextReviewDate: result.nextReviewDate,
        confidence: result.confidence,
        totalReviews: card.totalReviews + 1,
        correctReviews:
          card.correctReviews + (grade >= SM2_DEFAULTS.PASSING_GRADE ? 1 : 0),
        updatedAt: now,
      };

      // Persist to Dexie
      await memorizationRepository.upsertCard(cardToEntry(updatedCard));

      // Add review entry
      await memorizationRepository.addReview({
        id: crypto.randomUUID(),
        userId,
        cardId: card.id,
        verseKey: card.verseKey,
        grade,
        previousEaseFactor: card.easeFactor,
        newEaseFactor: result.easeFactor,
        previousInterval: card.interval,
        newInterval: result.interval,
        reviewedAt: now.getTime(),
      });

      // Update store
      store.gradeCard(grade);

      // Prefetch next card's verse
      const nextIdx = store.currentCardIndex + 2;
      if (nextIdx < store.sessionCards.length) {
        queryClient.prefetchQuery(
          verseByKeyQueryOptions(store.sessionCards[nextIdx].verseKey),
        );
      }
    },
    [userId, store, queryClient],
  );

  return {
    phase: store.phase,
    sessionType: store.sessionType,
    sessionCards: store.sessionCards,
    currentCardIndex: store.currentCardIndex,
    sessionResults: store.sessionResults,
    revealedWords: store.revealedWords,
    totalWords: store.totalWords,
    startReview,
    gradeCurrentCard,
    nextCard: store.nextCard,
    revealNextWord: store.revealNextWord,
    revealAll: store.revealAll,
    setRevealState: store.setRevealState,
    finishSession: store.finishSession,
    resetSession: store.resetSession,
  };
}

// useAddVerses
export function useAddVerses(userId: string | undefined) {
  const [isAdding, setIsAdding] = useState(false);

  const addVerses = useCallback(
    async (surahId: number, verseNumbers: number[]) => {
      if (!userId) return;
      setIsAdding(true);
      try {
        // Filter out verses that already have a card (prevent duplicates)
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
          nextReviewDate: now, // Due immediately
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
