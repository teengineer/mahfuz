import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { user } from "./schema";

// ── Child Profiles ──────────────────────────────────────────────

export const kidsProfile = sqliteTable(
  "kids_profile",
  {
    id: text("id").primaryKey(),
    parentUserId: text("parent_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    birthYear: integer("birth_year").notNull(),
    avatarId: text("avatar_id").notNull().default("avatar-1"),
    avatarData: text("avatar_data"), // JSON: equipped accessories
    pinHash: text("pin_hash"), // parent PIN hash (4-digit)
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    index("kp_parent_idx").on(table.parentUserId),
  ],
);

// ── Letter Progress ─────────────────────────────────────────────

export const kidsLetterProgress = sqliteTable(
  "kids_letter_progress",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => kidsProfile.id, { onDelete: "cascade" }),
    letterId: text("letter_id").notNull(), // e.g. "alif", "ba", "ta"
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    stars: integer("stars").notNull().default(0),
    traced: integer("traced", { mode: "boolean" }).notNull().default(false),
    matched: integer("matched", { mode: "boolean" }).notNull().default(false),
    quizzed: integer("quizzed", { mode: "boolean" }).notNull().default(false),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("klp_profile_letter_idx").on(table.profileId, table.letterId),
  ],
);

// ── Surah Progress ──────────────────────────────────────────────

export const kidsSurahProgress = sqliteTable(
  "kids_surah_progress",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => kidsProfile.id, { onDelete: "cascade" }),
    surahId: integer("surah_id").notNull(),
    listened: integer("listened", { mode: "boolean" }).notNull().default(false),
    repeated: integer("repeated", { mode: "boolean" }).notNull().default(false),
    ordered: integer("ordered", { mode: "boolean" }).notNull().default(false),
    filled: integer("filled", { mode: "boolean" }).notNull().default(false),
    memorized: integer("memorized", { mode: "boolean" }).notNull().default(false),
    certificateAt: integer("certificate_at"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("ksp_profile_surah_idx").on(table.profileId, table.surahId),
  ],
);

// ── Rewards (stars, gems, level) ────────────────────────────────

export const kidsRewards = sqliteTable("kids_rewards", {
  profileId: text("profile_id")
    .primaryKey()
    .references(() => kidsProfile.id, { onDelete: "cascade" }),
  stars: integer("stars").notNull().default(0),
  gems: integer("gems").notNull().default(0),
  level: integer("level").notNull().default(1),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  freezeDaysLeft: integer("freeze_days_left").notNull().default(1),
  lastActivityDate: integer("last_activity_date"),
  updatedAt: integer("updated_at").notNull(),
});

// ── Badges ──────────────────────────────────────────────────────

export const kidsBadges = sqliteTable(
  "kids_badges",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => kidsProfile.id, { onDelete: "cascade" }),
    badgeId: text("badge_id").notNull(),
    unlockedAt: integer("unlocked_at").notNull(),
  },
  (table) => [
    uniqueIndex("kb_profile_badge_idx").on(table.profileId, table.badgeId),
  ],
);

// ── Avatar Items ────────────────────────────────────────────────

export const kidsAvatarItems = sqliteTable(
  "kids_avatar_items",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => kidsProfile.id, { onDelete: "cascade" }),
    itemId: text("item_id").notNull(),
    equipped: integer("equipped", { mode: "boolean" }).notNull().default(false),
    unlockedAt: integer("unlocked_at").notNull(),
  },
  (table) => [
    uniqueIndex("kai_profile_item_idx").on(table.profileId, table.itemId),
  ],
);

// ── Daily Quests ────────────────────────────────────────────────

export const kidsDailyQuests = sqliteTable(
  "kids_daily_quests",
  {
    id: text("id").primaryKey(),
    profileId: text("profile_id")
      .notNull()
      .references(() => kidsProfile.id, { onDelete: "cascade" }),
    date: text("date").notNull(), // "YYYY-MM-DD"
    questType: text("quest_type").notNull(), // "listen_surah" | "learn_letters" | "review_surah" | "quiz"
    target: integer("target").notNull().default(1),
    progress: integer("progress").notNull().default(0),
    completed: integer("completed", { mode: "boolean" }).notNull().default(false),
    rewardClaimed: integer("reward_claimed", { mode: "boolean" }).notNull().default(false),
  },
  (table) => [
    index("kdq_profile_date_idx").on(table.profileId, table.date),
  ],
);

// ── Parent Settings ─────────────────────────────────────────────

export const kidsSettings = sqliteTable("kids_settings", {
  profileId: text("profile_id")
    .primaryKey()
    .references(() => kidsProfile.id, { onDelete: "cascade" }),
  dailyTimeLimit: integer("daily_time_limit").notNull().default(0), // minutes, 0 = unlimited
  dailyGoalType: text("daily_goal_type").notNull().default("minutes"), // "minutes" | "verses" | "letters"
  dailyGoalValue: integer("daily_goal_value").notNull().default(10),
  updatedAt: integer("updated_at").notNull(),
});
