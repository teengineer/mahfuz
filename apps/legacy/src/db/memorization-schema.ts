import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { user } from "./schema";

export const memorizationCard = sqliteTable(
  "memorization_card",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    verseKey: text("verse_key").notNull(),
    easeFactor: real("ease_factor").notNull().default(2.5),
    repetition: integer("repetition").notNull().default(0),
    interval: integer("interval").notNull().default(0),
    nextReviewDate: integer("next_review_date").notNull(),
    confidence: text("confidence").notNull().default("learning"),
    totalReviews: integer("total_reviews").notNull().default(0),
    correctReviews: integer("correct_reviews").notNull().default(0),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("mc_user_verse_idx").on(table.userId, table.verseKey),
    index("mc_user_review_idx").on(table.userId, table.nextReviewDate),
  ],
);

export const reviewEntry = sqliteTable(
  "review_entry",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    cardId: text("card_id").notNull(),
    verseKey: text("verse_key").notNull(),
    grade: integer("grade").notNull(),
    previousEaseFactor: real("previous_ease_factor").notNull(),
    newEaseFactor: real("new_ease_factor").notNull(),
    previousInterval: integer("previous_interval").notNull(),
    newInterval: integer("new_interval").notNull(),
    reviewedAt: integer("reviewed_at").notNull(),
  },
  (table) => [
    index("re_user_reviewed_idx").on(table.userId, table.reviewedAt),
  ],
);

export const memorizationGoals = sqliteTable("memorization_goals", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  newCardsPerDay: integer("new_cards_per_day").notNull().default(5),
  reviewCardsPerDay: integer("review_cards_per_day").notNull().default(20),
  updatedAt: integer("updated_at").notNull(),
});

export const userBadge = sqliteTable(
  "user_badge",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    badgeId: text("badge_id").notNull(),
    unlockedAt: integer("unlocked_at").notNull(),
  },
  (table) => [
    uniqueIndex("ub_user_badge_idx").on(table.userId, table.badgeId),
  ],
);

export const userStats = sqliteTable("user_stats", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  lastReviewDate: integer("last_review_date"),
  totalSevapPoint: integer("total_sevap_point").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
});
