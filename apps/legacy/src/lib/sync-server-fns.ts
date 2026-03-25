import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "./auth";
import { db } from "~/db";
import {
  memorizationCard,
  reviewEntry,
  memorizationGoals,
  userBadge,
  userStats,
} from "~/db/memorization-schema";
import {
  lessonProgress,
  learnConcept,
  questProgress,
  userPreferences,
  readingListItem,
  readingHistory,
} from "~/db/sync-schema";
import { eq, and, gt } from "drizzle-orm";

// ── Push payload ──

interface PushPayload {
  cards: Array<{
    id: string;
    verseKey: string;
    easeFactor: number;
    repetition: number;
    interval: number;
    nextReviewDate: number;
    confidence: string;
    totalReviews: number;
    correctReviews: number;
    createdAt: number;
    updatedAt: number;
  }>;
  reviews: Array<{
    id: string;
    cardId: string;
    verseKey: string;
    grade: number;
    previousEaseFactor: number;
    newEaseFactor: number;
    previousInterval: number;
    newInterval: number;
    reviewedAt: number;
  }>;
  goals?: {
    newCardsPerDay: number;
    reviewCardsPerDay: number;
    updatedAt: number;
  };
  lessonProgressItems?: Array<{
    id: string;
    stageId: number;
    lessonId: string;
    status: string;
    score: number;
    sevapPointEarned: number;
    completedAt: number;
    updatedAt: number;
  }>;
  learnConcepts?: Array<{
    id: string;
    conceptId: string;
    correctCount: number;
    incorrectCount: number;
    masteryLevel: number;
    nextReviewAt: number;
    updatedAt: number;
  }>;
  questProgressItems?: Array<{
    id: string;
    questId: string;
    wordsCorrect: string[];
    totalAttempts: number;
    totalCorrect: number;
    sessionsCompleted: number;
    bestSessionScore: number;
    lastPlayedAt: number;
    updatedAt: number;
  }>;
  preferences?: {
    data: string; // JSON blob
    updatedAt: number;
  };
  readingListItems?: Array<{
    id: string;
    type: string;
    itemId: number;
    addedAt: number;
    lastReadAt: number | null;
    deleted: boolean;
    updatedAt: number;
  }>;
  readingHistoryData?: {
    lastSurahId: number | null;
    lastSurahName: string | null;
    lastPageNumber: number | null;
    lastJuzNumber: number | null;
    lastVerseKey?: string | null;
    lastVerseNum?: number | null;
    updatedAt: number;
  };
}

// ── Pull response ──

interface PullResponse {
  cards: Array<{
    id: string;
    verseKey: string;
    easeFactor: number;
    repetition: number;
    interval: number;
    nextReviewDate: number;
    confidence: string;
    totalReviews: number;
    correctReviews: number;
    createdAt: number;
    updatedAt: number;
  }>;
  reviews: Array<{
    id: string;
    cardId: string;
    verseKey: string;
    grade: number;
    previousEaseFactor: number;
    newEaseFactor: number;
    previousInterval: number;
    newInterval: number;
    reviewedAt: number;
  }>;
  goals: {
    newCardsPerDay: number;
    reviewCardsPerDay: number;
    updatedAt: number;
  } | null;
  badges: Array<{ badgeId: string; unlockedAt: number }>;
  stats: {
    currentStreak: number;
    longestStreak: number;
    lastReviewDate: number | null;
    totalSevapPoint: number;
    updatedAt: number;
  } | null;
  lessonProgressItems: Array<{
    id: string;
    stageId: number;
    lessonId: string;
    status: string;
    score: number;
    sevapPointEarned: number;
    completedAt: number;
    updatedAt: number;
  }>;
  learnConcepts: Array<{
    id: string;
    conceptId: string;
    correctCount: number;
    incorrectCount: number;
    masteryLevel: number;
    nextReviewAt: number;
    updatedAt: number;
  }>;
  questProgressItems: Array<{
    id: string;
    questId: string;
    wordsCorrect: string;
    totalAttempts: number;
    totalCorrect: number;
    sessionsCompleted: number;
    bestSessionScore: number;
    lastPlayedAt: number;
    updatedAt: number;
  }>;
  preferences: {
    data: string;
    updatedAt: number;
  } | null;
  readingListItems: Array<{
    id: string;
    type: string;
    itemId: number;
    addedAt: number;
    lastReadAt: number | null;
    deleted: number;
    updatedAt: number;
  }>;
  readingHistoryData: {
    lastSurahId: number | null;
    lastSurahName: string | null;
    lastPageNumber: number | null;
    lastJuzNumber: number | null;
    lastVerseKey?: string | null;
    lastVerseNum?: number | null;
    updatedAt: number;
  } | null;
}

// ── Auth helper ──

async function getAuthUser() {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

// ── Push ──

export const pushChanges = createServerFn({ method: "POST" })
  .inputValidator((data: PushPayload) => data)
  .handler(async ({ data }) => {
    const userId = await getAuthUser();

    // Upsert memorization cards (LWW)
    for (const card of data.cards) {
      const existing = await db
        .select({ updatedAt: memorizationCard.updatedAt })
        .from(memorizationCard)
        .where(
          and(
            eq(memorizationCard.userId, userId),
            eq(memorizationCard.verseKey, card.verseKey),
          ),
        )
        .get();

      if (existing && existing.updatedAt >= card.updatedAt) continue;

      await db
        .insert(memorizationCard)
        .values({
          id: card.id,
          userId,
          verseKey: card.verseKey,
          easeFactor: card.easeFactor,
          repetition: card.repetition,
          interval: card.interval,
          nextReviewDate: card.nextReviewDate,
          confidence: card.confidence,
          totalReviews: card.totalReviews,
          correctReviews: card.correctReviews,
          createdAt: card.createdAt,
          updatedAt: card.updatedAt,
        })
        .onConflictDoUpdate({
          target: [memorizationCard.userId, memorizationCard.verseKey],
          set: {
            easeFactor: card.easeFactor,
            repetition: card.repetition,
            interval: card.interval,
            nextReviewDate: card.nextReviewDate,
            confidence: card.confidence,
            totalReviews: card.totalReviews,
            correctReviews: card.correctReviews,
            updatedAt: card.updatedAt,
          },
        });
    }

    // Insert reviews (idempotent)
    for (const review of data.reviews) {
      await db
        .insert(reviewEntry)
        .values({
          id: review.id,
          userId,
          cardId: review.cardId,
          verseKey: review.verseKey,
          grade: review.grade,
          previousEaseFactor: review.previousEaseFactor,
          newEaseFactor: review.newEaseFactor,
          previousInterval: review.previousInterval,
          newInterval: review.newInterval,
          reviewedAt: review.reviewedAt,
        })
        .onConflictDoNothing();
    }

    // Upsert goals
    if (data.goals) {
      await db
        .insert(memorizationGoals)
        .values({
          userId,
          newCardsPerDay: data.goals.newCardsPerDay,
          reviewCardsPerDay: data.goals.reviewCardsPerDay,
          updatedAt: data.goals.updatedAt,
        })
        .onConflictDoUpdate({
          target: memorizationGoals.userId,
          set: {
            newCardsPerDay: data.goals.newCardsPerDay,
            reviewCardsPerDay: data.goals.reviewCardsPerDay,
            updatedAt: data.goals.updatedAt,
          },
        });
    }

    // Lesson progress (LWW)
    if (data.lessonProgressItems) {
      for (const item of data.lessonProgressItems) {
        const existing = await db
          .select({ updatedAt: lessonProgress.updatedAt })
          .from(lessonProgress)
          .where(
            and(
              eq(lessonProgress.userId, userId),
              eq(lessonProgress.lessonId, item.lessonId),
            ),
          )
          .get();

        if (existing && existing.updatedAt >= item.updatedAt) continue;

        await db
          .insert(lessonProgress)
          .values({
            id: item.id,
            userId,
            stageId: item.stageId,
            lessonId: item.lessonId,
            status: item.status,
            score: item.score,
            sevapPointEarned: item.sevapPointEarned,
            completedAt: item.completedAt,
            updatedAt: item.updatedAt,
          })
          .onConflictDoUpdate({
            target: [lessonProgress.userId, lessonProgress.lessonId],
            set: {
              stageId: item.stageId,
              status: item.status,
              score: item.score,
              sevapPointEarned: item.sevapPointEarned,
              completedAt: item.completedAt,
              updatedAt: item.updatedAt,
            },
          });
      }
    }

    // Learn concepts (LWW)
    if (data.learnConcepts) {
      for (const item of data.learnConcepts) {
        const existing = await db
          .select({ updatedAt: learnConcept.updatedAt })
          .from(learnConcept)
          .where(
            and(
              eq(learnConcept.userId, userId),
              eq(learnConcept.conceptId, item.conceptId),
            ),
          )
          .get();

        if (existing && existing.updatedAt >= item.updatedAt) continue;

        await db
          .insert(learnConcept)
          .values({
            id: item.id,
            userId,
            conceptId: item.conceptId,
            correctCount: item.correctCount,
            incorrectCount: item.incorrectCount,
            masteryLevel: item.masteryLevel,
            nextReviewAt: item.nextReviewAt,
            updatedAt: item.updatedAt,
          })
          .onConflictDoUpdate({
            target: [learnConcept.userId, learnConcept.conceptId],
            set: {
              correctCount: item.correctCount,
              incorrectCount: item.incorrectCount,
              masteryLevel: item.masteryLevel,
              nextReviewAt: item.nextReviewAt,
              updatedAt: item.updatedAt,
            },
          });
      }
    }

    // Quest progress (LWW + wordsCorrect union)
    if (data.questProgressItems) {
      for (const item of data.questProgressItems) {
        const existing = await db
          .select()
          .from(questProgress)
          .where(
            and(
              eq(questProgress.userId, userId),
              eq(questProgress.questId, item.questId),
            ),
          )
          .get();

        if (existing && existing.updatedAt >= item.updatedAt) continue;

        // Union wordsCorrect if server has existing data
        let wordsCorrectJson = JSON.stringify(item.wordsCorrect);
        if (existing) {
          const serverWords: string[] = JSON.parse(existing.wordsCorrect);
          const merged = Array.from(
            new Set([...serverWords, ...item.wordsCorrect]),
          );
          wordsCorrectJson = JSON.stringify(merged);
        }

        await db
          .insert(questProgress)
          .values({
            id: item.id,
            userId,
            questId: item.questId,
            wordsCorrect: wordsCorrectJson,
            totalAttempts: item.totalAttempts,
            totalCorrect: item.totalCorrect,
            sessionsCompleted: item.sessionsCompleted,
            bestSessionScore: item.bestSessionScore,
            lastPlayedAt: item.lastPlayedAt,
            updatedAt: item.updatedAt,
          })
          .onConflictDoUpdate({
            target: [questProgress.userId, questProgress.questId],
            set: {
              wordsCorrect: wordsCorrectJson,
              totalAttempts: item.totalAttempts,
              totalCorrect: item.totalCorrect,
              sessionsCompleted: item.sessionsCompleted,
              bestSessionScore: item.bestSessionScore,
              lastPlayedAt: item.lastPlayedAt,
              updatedAt: item.updatedAt,
            },
          });
      }
    }

    // Preferences (LWW blob)
    if (data.preferences) {
      const existing = await db
        .select({ updatedAt: userPreferences.updatedAt })
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId))
        .get();

      if (!existing || existing.updatedAt < data.preferences.updatedAt) {
        await db
          .insert(userPreferences)
          .values({
            userId,
            data: data.preferences.data,
            updatedAt: data.preferences.updatedAt,
          })
          .onConflictDoUpdate({
            target: userPreferences.userId,
            set: {
              data: data.preferences.data,
              updatedAt: data.preferences.updatedAt,
            },
          });
      }
    }

    // Reading list items (LWW per item + soft delete)
    if (data.readingListItems) {
      for (const item of data.readingListItems) {
        const existing = await db
          .select({ updatedAt: readingListItem.updatedAt })
          .from(readingListItem)
          .where(
            and(
              eq(readingListItem.userId, userId),
              eq(readingListItem.type, item.type),
              eq(readingListItem.itemId, item.itemId),
            ),
          )
          .get();

        if (existing && existing.updatedAt >= item.updatedAt) continue;

        await db
          .insert(readingListItem)
          .values({
            id: item.id,
            userId,
            type: item.type,
            itemId: item.itemId,
            addedAt: item.addedAt,
            lastReadAt: item.lastReadAt,
            deleted: item.deleted ? 1 : 0,
            updatedAt: item.updatedAt,
          })
          .onConflictDoUpdate({
            target: [
              readingListItem.userId,
              readingListItem.type,
              readingListItem.itemId,
            ],
            set: {
              addedAt: item.addedAt,
              lastReadAt: item.lastReadAt,
              deleted: item.deleted ? 1 : 0,
              updatedAt: item.updatedAt,
            },
          });
      }
    }

    // Reading history (LWW)
    if (data.readingHistoryData) {
      const existing = await db
        .select({ updatedAt: readingHistory.updatedAt })
        .from(readingHistory)
        .where(eq(readingHistory.userId, userId))
        .get();

      if (
        !existing ||
        existing.updatedAt < data.readingHistoryData.updatedAt
      ) {
        await db
          .insert(readingHistory)
          .values({
            userId,
            lastSurahId: data.readingHistoryData.lastSurahId,
            lastSurahName: data.readingHistoryData.lastSurahName,
            lastPageNumber: data.readingHistoryData.lastPageNumber,
            lastJuzNumber: data.readingHistoryData.lastJuzNumber,
            lastVerseKey: data.readingHistoryData.lastVerseKey ?? null,
            lastVerseNum: data.readingHistoryData.lastVerseNum ?? null,
            updatedAt: data.readingHistoryData.updatedAt,
          })
          .onConflictDoUpdate({
            target: readingHistory.userId,
            set: {
              lastSurahId: data.readingHistoryData.lastSurahId,
              lastSurahName: data.readingHistoryData.lastSurahName,
              lastPageNumber: data.readingHistoryData.lastPageNumber,
              lastJuzNumber: data.readingHistoryData.lastJuzNumber,
              lastVerseKey: data.readingHistoryData.lastVerseKey ?? null,
              lastVerseNum: data.readingHistoryData.lastVerseNum ?? null,
              updatedAt: data.readingHistoryData.updatedAt,
            },
          });
      }
    }

    return { ok: true };
  });

// ── Pull ──

export const pullChanges = createServerFn({ method: "GET" })
  .inputValidator((data: { since: number }) => data)
  .handler(async ({ data }): Promise<PullResponse> => {
    const userId = await getAuthUser();

    const cards = await db
      .select()
      .from(memorizationCard)
      .where(
        and(
          eq(memorizationCard.userId, userId),
          gt(memorizationCard.updatedAt, data.since),
        ),
      );

    const reviews = await db
      .select()
      .from(reviewEntry)
      .where(
        and(
          eq(reviewEntry.userId, userId),
          gt(reviewEntry.reviewedAt, data.since),
        ),
      );

    const goalsRow = await db
      .select()
      .from(memorizationGoals)
      .where(eq(memorizationGoals.userId, userId))
      .get();

    const badges = await db
      .select({ badgeId: userBadge.badgeId, unlockedAt: userBadge.unlockedAt })
      .from(userBadge)
      .where(eq(userBadge.userId, userId));

    const statsRow = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId))
      .get();

    const lessonProgressRows = await db
      .select()
      .from(lessonProgress)
      .where(
        and(
          eq(lessonProgress.userId, userId),
          gt(lessonProgress.updatedAt, data.since),
        ),
      );

    const learnConceptRows = await db
      .select()
      .from(learnConcept)
      .where(
        and(
          eq(learnConcept.userId, userId),
          gt(learnConcept.updatedAt, data.since),
        ),
      );

    const questProgressRows = await db
      .select()
      .from(questProgress)
      .where(
        and(
          eq(questProgress.userId, userId),
          gt(questProgress.updatedAt, data.since),
        ),
      );

    const prefsRow = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .get();

    const readingListRows = await db
      .select()
      .from(readingListItem)
      .where(
        and(
          eq(readingListItem.userId, userId),
          gt(readingListItem.updatedAt, data.since),
        ),
      );

    const readingHistoryRow = await db
      .select()
      .from(readingHistory)
      .where(eq(readingHistory.userId, userId))
      .get();

    return {
      cards: cards.map((c) => ({
        id: c.id,
        verseKey: c.verseKey,
        easeFactor: c.easeFactor,
        repetition: c.repetition,
        interval: c.interval,
        nextReviewDate: c.nextReviewDate,
        confidence: c.confidence,
        totalReviews: c.totalReviews,
        correctReviews: c.correctReviews,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      reviews: reviews.map((r) => ({
        id: r.id,
        cardId: r.cardId,
        verseKey: r.verseKey,
        grade: r.grade,
        previousEaseFactor: r.previousEaseFactor,
        newEaseFactor: r.newEaseFactor,
        previousInterval: r.previousInterval,
        newInterval: r.newInterval,
        reviewedAt: r.reviewedAt,
      })),
      goals: goalsRow
        ? {
            newCardsPerDay: goalsRow.newCardsPerDay,
            reviewCardsPerDay: goalsRow.reviewCardsPerDay,
            updatedAt: goalsRow.updatedAt,
          }
        : null,
      badges,
      stats: statsRow
        ? {
            currentStreak: statsRow.currentStreak,
            longestStreak: statsRow.longestStreak,
            lastReviewDate: statsRow.lastReviewDate,
            totalSevapPoint: statsRow.totalSevapPoint,
            updatedAt: statsRow.updatedAt,
          }
        : null,
      lessonProgressItems: lessonProgressRows.map((r) => ({
        id: r.id,
        stageId: r.stageId,
        lessonId: r.lessonId,
        status: r.status,
        score: r.score,
        sevapPointEarned: r.sevapPointEarned,
        completedAt: r.completedAt,
        updatedAt: r.updatedAt,
      })),
      learnConcepts: learnConceptRows.map((r) => ({
        id: r.id,
        conceptId: r.conceptId,
        correctCount: r.correctCount,
        incorrectCount: r.incorrectCount,
        masteryLevel: r.masteryLevel,
        nextReviewAt: r.nextReviewAt,
        updatedAt: r.updatedAt,
      })),
      questProgressItems: questProgressRows.map((r) => ({
        id: r.id,
        questId: r.questId,
        wordsCorrect: r.wordsCorrect,
        totalAttempts: r.totalAttempts,
        totalCorrect: r.totalCorrect,
        sessionsCompleted: r.sessionsCompleted,
        bestSessionScore: r.bestSessionScore,
        lastPlayedAt: r.lastPlayedAt,
        updatedAt: r.updatedAt,
      })),
      preferences:
        prefsRow && prefsRow.updatedAt > data.since
          ? { data: prefsRow.data, updatedAt: prefsRow.updatedAt }
          : null,
      readingListItems: readingListRows.map((r) => ({
        id: r.id,
        type: r.type,
        itemId: r.itemId,
        addedAt: r.addedAt,
        lastReadAt: r.lastReadAt,
        deleted: r.deleted,
        updatedAt: r.updatedAt,
      })),
      readingHistoryData:
        readingHistoryRow && readingHistoryRow.updatedAt > data.since
          ? {
              lastSurahId: readingHistoryRow.lastSurahId,
              lastSurahName: readingHistoryRow.lastSurahName,
              lastPageNumber: readingHistoryRow.lastPageNumber,
              lastJuzNumber: readingHistoryRow.lastJuzNumber,
              lastVerseKey: readingHistoryRow.lastVerseKey ?? null,
              lastVerseNum: readingHistoryRow.lastVerseNum ?? null,
              updatedAt: readingHistoryRow.updatedAt,
            }
          : null,
    };
  });
