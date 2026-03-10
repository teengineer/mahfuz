import type { TextType } from "@mahfuz/shared/types";

/**
 * Centralized query key constants.
 * Every TanStack Query cache key in the app MUST use these functions
 * to prevent key mismatch bugs between queryOptions and getQueryData.
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
} as const;
