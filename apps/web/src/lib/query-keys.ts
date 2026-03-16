import type { TextType } from "@mahfuz/shared/types";

/**
 * Centralized query key constants.
 * Every TanStack Query cache key MUST use these functions.
 */
export const QUERY_KEYS = {
  // Chapters
  chapters: () => ["chapters-static"] as const,
  chapter: (id: number) => ["chapter-static", id] as const,

  // Verses (static Tanzil data)
  staticVerses: {
    chapter: (chapterId: number, textType: TextType) =>
      ["static-verses", "chapter", chapterId, textType] as const,
    page: (pageNumber: number, textType: TextType) =>
      ["static-verses", "page", pageNumber, textType] as const,
    juz: (juzNumber: number, textType: TextType) =>
      ["static-verses", "juz", juzNumber, textType] as const,
  },
  staticVerse: (verseKey: string, textType: TextType) =>
    ["static-verse", verseKey, textType] as const,

  // Word-by-word
  wbw: {
    chapter: (chapterId: number) => ["wbw", "chapter", chapterId] as const,
  },

  // Search
  search: (query: string, page: number, size: number) =>
    ["search", query, page, size] as const,

  // Audio
  verseAudio: (reciterId: number, chapterId: number) =>
    ["verseAudio", reciterId, chapterId] as const,
  chapterAudio: (reciterId: number, chapterId: number) =>
    ["chapterAudio", reciterId, chapterId] as const,

  // Translations
  localTranslation: (id: string) => ["local-translation", id] as const,

  // Juz
  juzs: () => ["juzs"] as const,

  // Memorization (Dexie-backed)
  memorization: {
    all: (userId: string) => ["memorization", userId] as const,
    cards: (userId: string) => ["memorization", "cards", userId] as const,
    dueCards: (userId: string) => ["memorization", "due-cards", userId] as const,
    surahCards: (userId: string, surahId: number) =>
      ["memorization", "surah-cards", userId, surahId] as const,
    stats: (userId: string) => ["memorization", "stats", userId] as const,
    goals: (userId: string) => ["memorization", "goals", userId] as const,
    reviewsToday: (userId: string) =>
      ["memorization", "reviews-today", userId] as const,
    reviewDates: (userId: string) =>
      ["memorization", "review-dates", userId] as const,
  },

  // Learn (Dexie-backed)
  learn: {
    all: (userId: string) => ["learn", userId] as const,
    dashboard: (userId: string) => ["learn", "dashboard", userId] as const,
    stageProgress: (userId: string, stageId: number) =>
      ["learn", "stage-progress", userId, stageId] as const,
    completedLessons: (userId: string) =>
      ["learn", "completed-lessons", userId] as const,
    concepts: (userId: string) => ["learn", "concepts", userId] as const,
    sevapPoints: (userId: string) => ["learn", "sevap", userId] as const,
  },

  // Quest (Dexie-backed)
  quest: {
    all: (userId: string) => ["quest", userId] as const,
    progress: (userId: string, questId: string) =>
      ["quest", "progress", userId, questId] as const,
    allProgress: (userId: string) =>
      ["quest", "all-progress", userId] as const,
  },

  // Badges (Dexie-backed)
  badges: {
    all: (userId: string) => ["badges", userId] as const,
  },

  // Discover (static JSON)
  discover: {
    rootsIndex: () => ["discover", "roots-index"] as const,
    rootDetail: (rootKey: string) => ["discover", "root-detail", rootKey] as const,
    rootEnrichment: () => ["discover", "roots-enrichment"] as const,
    morphology: (surahId: number) => ["discover", "morphology", surahId] as const,
    concepts: () => ["discover", "concepts"] as const,
    syntax: (surahId: number) => ["discover", "syntax", surahId] as const,
    frequencySets: () => ["discover", "frequency-sets"] as const,
  },

  // Annotations (Dexie-backed, Focus Mode)
  annotations: {
    all: (userId: string) => ["annotations", userId] as const,
    page: (userId: string, pageNumber: number) =>
      ["annotations", "page", userId, pageNumber] as const,
    textNotes: (userId: string, pageNumber: number) =>
      ["annotations", "text-notes", userId, pageNumber] as const,
  },
} as const;
