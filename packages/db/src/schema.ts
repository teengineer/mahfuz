import Dexie, { type EntityTable } from "dexie";
import type { ConfidenceLevel, QualityGrade, VerseKey } from "@mahfuz/shared/types";

/** Generic cache entry stored in IndexedDB */
export interface CacheEntry {
  key: string;
  data: string;
  cachedAt: number;
}

/** Memorization card stored in IndexedDB (dates as epoch ms) */
export interface MemorizationCardEntry {
  id: string;
  userId: string;
  verseKey: VerseKey;
  easeFactor: number;
  repetition: number;
  interval: number;
  nextReviewDate: number; // epoch ms
  confidence: ConfidenceLevel;
  totalReviews: number;
  correctReviews: number;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/** Review entry stored in IndexedDB */
export interface ReviewEntryRecord {
  id: string;
  userId: string;
  cardId: string;
  verseKey: VerseKey;
  grade: QualityGrade;
  previousEaseFactor: number;
  newEaseFactor: number;
  previousInterval: number;
  newInterval: number;
  reviewedAt: number; // epoch ms
}

/** Daily memorization goals stored in IndexedDB */
export interface MemorizationGoalsEntry {
  userId: string;
  newCardsPerDay: number;
  reviewCardsPerDay: number;
}

/** Sync queue record for offline-first sync */
export interface SyncQueueRecord {
  id: string;
  table:
    | "memorization_cards"
    | "review_entries"
    | "memorization_goals"
    | "lesson_progress"
    | "learn_concepts"
    | "quest_progress";
  recordId: string;
  action: "upsert" | "delete";
  data: string; // JSON stringified record
  synced: 0 | 1;
  createdAt: number;
}

/** User badge entry stored in IndexedDB */
export interface UserBadgeEntry {
  id: string;
  userId: string;
  badgeId: string;
  unlockedAt: number;
}

/** Lesson progress entry for Learn module */
export interface LessonProgressEntry {
  id: string;
  userId: string;
  stageId: number;
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  score: number;
  sevapPointEarned: number;
  completedAt: number;
  updatedAt: number; // epoch ms
}

/** Concept mastery entry for Learn module simplified SRS */
export interface LearnConceptEntry {
  id: string;
  userId: string;
  conceptId: string;
  correctCount: number;
  incorrectCount: number;
  masteryLevel: 0 | 1 | 2 | 3;
  nextReviewAt: number;
  updatedAt: number; // epoch ms
}

/** Annotation page entry for Focus Mode (strokes per page) */
export interface AnnotationPageEntry {
  id: string; // "${userId}:${pageNumber}"
  userId: string;
  pageNumber: number; // 1-604
  strokes: string; // JSON-serialized Stroke[]
  updatedAt: number;
}

/** Text note entry for Focus Mode */
export interface TextNoteEntry {
  id: string; // nanoid
  userId: string;
  verseKey: VerseKey;
  pageNumber: number; // for page-level queries
  content: string;
  color: string;
  positionX: number; // 0-1 normalized
  positionY: number; // 0-1 normalized
  createdAt: number;
  updatedAt: number;
}

/** Quest progress entry for Side Quests */
export interface QuestProgressEntry {
  id: string;
  userId: string;
  questId: string;
  wordsCorrect: string[];
  totalAttempts: number;
  totalCorrect: number;
  sessionsCompleted: number;
  bestSessionScore: number;
  lastPlayedAt: number;
  updatedAt: number; // epoch ms
}

/** Dexie database for Mahfuz offline cache + memorization */
export class MahfuzDB extends Dexie {
  cache!: EntityTable<CacheEntry, "key">;
  memorization_cards!: EntityTable<MemorizationCardEntry, "id">;
  review_entries!: EntityTable<ReviewEntryRecord, "id">;
  memorization_goals!: EntityTable<MemorizationGoalsEntry, "userId">;
  sync_queue!: EntityTable<SyncQueueRecord, "id">;
  user_badges!: EntityTable<UserBadgeEntry, "id">;
  lesson_progress!: EntityTable<LessonProgressEntry, "id">;
  learn_concepts!: EntityTable<LearnConceptEntry, "id">;
  quest_progress!: EntityTable<QuestProgressEntry, "id">;
  annotation_pages!: EntityTable<AnnotationPageEntry, "id">;
  text_notes!: EntityTable<TextNoteEntry, "id">;

  constructor() {
    super("mahfuz-cache");

    this.version(1).stores({
      cache: "key",
    });

    this.version(2).stores({
      cache: "key",
      memorization_cards:
        "id, [userId+verseKey], [userId+nextReviewDate], [userId+confidence]",
      review_entries: "id, cardId, [userId+reviewedAt]",
      memorization_goals: "userId",
    });

    this.version(3).stores({
      cache: "key",
      memorization_cards:
        "id, [userId+verseKey], [userId+nextReviewDate], [userId+confidence]",
      review_entries: "id, cardId, [userId+reviewedAt]",
      memorization_goals: "userId",
      sync_queue: "id, [table+synced], createdAt",
      user_badges: "id, [userId+badgeId], userId",
    });

    this.version(4).stores({
      cache: "key",
      memorization_cards:
        "id, [userId+verseKey], [userId+nextReviewDate], [userId+confidence]",
      review_entries: "id, cardId, [userId+reviewedAt]",
      memorization_goals: "userId",
      sync_queue: "id, [table+synced], createdAt",
      user_badges: "id, [userId+badgeId], userId",
      lesson_progress: "id, [userId+stageId], [userId+status], lessonId",
      learn_concepts: "id, [userId+conceptId], [userId+nextReviewAt], userId",
    });

    this.version(5).stores({
      cache: "key",
      memorization_cards:
        "id, [userId+verseKey], [userId+nextReviewDate], [userId+confidence]",
      review_entries: "id, cardId, [userId+reviewedAt]",
      memorization_goals: "userId",
      sync_queue: "id, [table+synced], createdAt",
      user_badges: "id, [userId+badgeId], userId",
      lesson_progress: "id, [userId+stageId], [userId+status], lessonId",
      learn_concepts: "id, [userId+conceptId], [userId+nextReviewAt], userId",
      quest_progress: "id, [userId+questId], userId",
    });

    // v6: add updatedAt to learn/quest tables for sync
    this.version(6)
      .stores({
        cache: "key",
        memorization_cards:
          "id, [userId+verseKey], [userId+nextReviewDate], [userId+confidence]",
        review_entries: "id, cardId, [userId+reviewedAt]",
        memorization_goals: "userId",
        sync_queue: "id, [table+synced], createdAt",
        user_badges: "id, [userId+badgeId], userId",
        lesson_progress:
          "id, [userId+stageId], [userId+status], lessonId, [userId+updatedAt]",
        learn_concepts:
          "id, [userId+conceptId], [userId+nextReviewAt], userId, [userId+updatedAt]",
        quest_progress: "id, [userId+questId], userId, [userId+updatedAt]",
      })
      .upgrade((tx) => {
        const now = Date.now();
        return Promise.all([
          tx
            .table("lesson_progress")
            .toCollection()
            .modify((entry: Record<string, unknown>) => {
              if (!entry.updatedAt) entry.updatedAt = entry.completedAt || now;
            }),
          tx
            .table("learn_concepts")
            .toCollection()
            .modify((entry: Record<string, unknown>) => {
              if (!entry.updatedAt) entry.updatedAt = now;
            }),
          tx
            .table("quest_progress")
            .toCollection()
            .modify((entry: Record<string, unknown>) => {
              if (!entry.updatedAt) entry.updatedAt = entry.lastPlayedAt || now;
            }),
        ]);
      });

    // v7: annotation_pages + text_notes for Focus Mode
    this.version(7).stores({
      cache: "key",
      memorization_cards:
        "id, [userId+verseKey], [userId+nextReviewDate], [userId+confidence]",
      review_entries: "id, cardId, [userId+reviewedAt]",
      memorization_goals: "userId",
      sync_queue: "id, [table+synced], createdAt",
      user_badges: "id, [userId+badgeId], userId",
      lesson_progress:
        "id, [userId+stageId], [userId+status], lessonId, [userId+updatedAt]",
      learn_concepts:
        "id, [userId+conceptId], [userId+nextReviewAt], userId, [userId+updatedAt]",
      quest_progress: "id, [userId+questId], userId, [userId+updatedAt]",
      annotation_pages: "id, [userId+pageNumber]",
      text_notes: "id, [userId+pageNumber]",
    });

    // v8: add standalone userId index to lesson_progress (needed for .where("userId") queries)
    this.version(8).stores({
      cache: "key",
      memorization_cards:
        "id, [userId+verseKey], [userId+nextReviewDate], [userId+confidence]",
      review_entries: "id, cardId, [userId+reviewedAt]",
      memorization_goals: "userId",
      sync_queue: "id, [table+synced], createdAt",
      user_badges: "id, [userId+badgeId], userId",
      lesson_progress:
        "id, userId, [userId+stageId], [userId+status], lessonId, [userId+updatedAt]",
      learn_concepts:
        "id, [userId+conceptId], [userId+nextReviewAt], userId, [userId+updatedAt]",
      quest_progress: "id, [userId+questId], userId, [userId+updatedAt]",
      annotation_pages: "id, [userId+pageNumber]",
      text_notes: "id, [userId+pageNumber]",
    });
  }
}

export const db = new MahfuzDB();
