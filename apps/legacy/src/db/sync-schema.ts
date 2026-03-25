import {
  sqliteTable,
  text,
  integer,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import { user } from "./schema";

/** Learn module: lesson completion progress */
export const lessonProgress = sqliteTable(
  "lesson_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stageId: integer("stage_id").notNull(),
    lessonId: text("lesson_id").notNull(),
    status: text("status").notNull().default("not_started"),
    score: integer("score").notNull().default(0),
    sevapPointEarned: integer("sevap_point_earned").notNull().default(0),
    completedAt: integer("completed_at").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("lp_user_lesson_idx").on(table.userId, table.lessonId),
    index("lp_user_stage_idx").on(table.userId, table.stageId),
  ],
);

/** Learn module: concept mastery (simplified SRS) */
export const learnConcept = sqliteTable(
  "learn_concept",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    conceptId: text("concept_id").notNull(),
    correctCount: integer("correct_count").notNull().default(0),
    incorrectCount: integer("incorrect_count").notNull().default(0),
    masteryLevel: integer("mastery_level").notNull().default(0),
    nextReviewAt: integer("next_review_at").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("lc_user_concept_idx").on(table.userId, table.conceptId),
  ],
);

/** Side quests: per-quest progress */
export const questProgress = sqliteTable(
  "quest_progress",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questId: text("quest_id").notNull(),
    wordsCorrect: text("words_correct").notNull().default("[]"), // JSON array
    totalAttempts: integer("total_attempts").notNull().default(0),
    totalCorrect: integer("total_correct").notNull().default(0),
    sessionsCompleted: integer("sessions_completed").notNull().default(0),
    bestSessionScore: integer("best_session_score").notNull().default(0),
    lastPlayedAt: integer("last_played_at").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("qp_user_quest_idx").on(table.userId, table.questId),
  ],
);

/** User preferences (JSON blob per user) */
export const userPreferences = sqliteTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  data: text("data").notNull().default("{}"), // JSON blob
  updatedAt: integer("updated_at").notNull(),
});

/** Reading list items (bookmarks) */
export const readingListItem = sqliteTable(
  "reading_list_item",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "surah" | "juz" | "page"
    itemId: integer("item_id").notNull(),
    addedAt: integer("added_at").notNull(),
    lastReadAt: integer("last_read_at"),
    deleted: integer("deleted").notNull().default(0), // soft delete
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("rli_user_type_item_idx").on(
      table.userId,
      table.type,
      table.itemId,
    ),
  ],
);

/** Annotation pages (strokes per Quran page, Focus Mode) */
export const annotationPage = sqliteTable(
  "annotation_page",
  {
    id: text("id").primaryKey(), // "${userId}:${pageNumber}"
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    pageNumber: integer("page_number").notNull(),
    strokes: text("strokes").notNull().default("[]"), // JSON
    deleted: integer("deleted").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("ap_user_page_idx").on(table.userId, table.pageNumber),
  ],
);

/** Text notes on verses (Focus Mode) */
export const textNote = sqliteTable(
  "text_note",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    verseKey: text("verse_key").notNull(),
    pageNumber: integer("page_number").notNull(),
    content: text("content").notNull(),
    color: text("color").notNull().default("#dc2626"),
    positionX: real("position_x").notNull().default(0.5),
    positionY: real("position_y").notNull().default(0.5),
    deleted: integer("deleted").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("tn_user_page_idx").on(table.userId, table.pageNumber),
    index("tn_user_verse_idx").on(table.userId, table.verseKey),
  ],
);

/** Reading history (last position per user) */
export const readingHistory = sqliteTable("reading_history", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  lastSurahId: integer("last_surah_id"),
  lastSurahName: text("last_surah_name"),
  lastPageNumber: integer("last_page_number"),
  lastJuzNumber: integer("last_juz_number"),
  lastVerseKey: text("last_verse_key"),
  lastVerseNum: integer("last_verse_num"),
  updatedAt: integer("updated_at").notNull(),
});
