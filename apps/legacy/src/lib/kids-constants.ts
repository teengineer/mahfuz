// ── Age Groups ──────────────────────────────────────────────────

export type KidsAgeGroup = "small" | "big";

export const AGE_GROUPS = {
  small: { min: 4, max: 7, label: "4-7" },
  big: { min: 8, max: 12, label: "8-12" },
} as const;

export function getAgeGroup(birthYear: number): KidsAgeGroup {
  const age = new Date().getFullYear() - birthYear;
  return age <= 7 ? "small" : "big";
}

// ── Levels ──────────────────────────────────────────────────────

export interface KidsLevel {
  id: number;
  key: string;
  starsRequired: number;
  color: string;
}

export const KIDS_LEVELS: KidsLevel[] = [
  { id: 1, key: "seed", starsRequired: 0, color: "#8B6914" },
  { id: 2, key: "sprout", starsRequired: 30, color: "#22C55E" },
  { id: 3, key: "leaf", starsRequired: 80, color: "#16A34A" },
  { id: 4, key: "flower", starsRequired: 160, color: "#EC4899" },
  { id: 5, key: "tree", starsRequired: 300, color: "#15803D" },
  { id: 6, key: "garden", starsRequired: 500, color: "#059669" },
  { id: 7, key: "forest", starsRequired: 800, color: "#065F46" },
  { id: 8, key: "mountain", starsRequired: 1200, color: "#78716C" },
  { id: 9, key: "star", starsRequired: 1800, color: "#EAB308" },
  { id: 10, key: "sun", starsRequired: 2500, color: "#F59E0B" },
];

export function getLevelForStars(stars: number): KidsLevel {
  for (let i = KIDS_LEVELS.length - 1; i >= 0; i--) {
    if (stars >= KIDS_LEVELS[i].starsRequired) return KIDS_LEVELS[i];
  }
  return KIDS_LEVELS[0];
}

export function getNextLevel(currentLevel: number): KidsLevel | null {
  return KIDS_LEVELS[currentLevel] ?? null; // currentLevel is 1-indexed, array is 0-indexed
}

// ── Reward Table ────────────────────────────────────────────────

export const REWARDS = {
  learnLetter: 3,
  memorizeVerse: 5,
  completeSurah: 20,
  dailyQuest: 5,
  dailyAllQuests: 1, // gem
  weekStreak: 3, // gems
  quizPerfect: 10,
} as const;

// ── Arabic Letters ──────────────────────────────────────────────

export interface ArabicLetter {
  id: string;
  arabic: string;
  name: string; // transliterated name
  nameAr: string; // Arabic name
  order: number;
}

/** Letters that do not connect to the following letter (only have isolated & final forms) */
const NON_CONNECTORS = new Set(["ا", "د", "ذ", "ر", "ز", "و"]);

const ZWJ = "\u200D"; // Zero Width Joiner

/** Get the four positional forms of an Arabic letter */
export function getLetterForms(letter: string) {
  const nc = NON_CONNECTORS.has(letter);
  return {
    isolated: letter,
    initial: nc ? letter : letter + ZWJ,
    medial: nc ? ZWJ + letter : ZWJ + letter + ZWJ,
    final: ZWJ + letter,
  };
}

export const ARABIC_LETTERS: ArabicLetter[] = [
  { id: "alif", arabic: "ا", name: "Elif", nameAr: "أَلِف", order: 1 },
  { id: "ba", arabic: "ب", name: "Ba", nameAr: "بَاء", order: 2 },
  { id: "ta", arabic: "ت", name: "Ta", nameAr: "تَاء", order: 3 },
  { id: "tha", arabic: "ث", name: "Sa", nameAr: "ثَاء", order: 4 },
  { id: "jim", arabic: "ج", name: "Cim", nameAr: "جِيم", order: 5 },
  { id: "ha", arabic: "ح", name: "Ha", nameAr: "حَاء", order: 6 },
  { id: "kha", arabic: "خ", name: "Hı", nameAr: "خَاء", order: 7 },
  { id: "dal", arabic: "د", name: "Dal", nameAr: "دَال", order: 8 },
  { id: "dhal", arabic: "ذ", name: "Zel", nameAr: "ذَال", order: 9 },
  { id: "ra", arabic: "ر", name: "Ra", nameAr: "رَاء", order: 10 },
  { id: "zay", arabic: "ز", name: "Ze", nameAr: "زَاي", order: 11 },
  { id: "sin", arabic: "س", name: "Sin", nameAr: "سِين", order: 12 },
  { id: "shin", arabic: "ش", name: "Şın", nameAr: "شِين", order: 13 },
  { id: "sad", arabic: "ص", name: "Sad", nameAr: "صَاد", order: 14 },
  { id: "dad", arabic: "ض", name: "Dad", nameAr: "ضَاد", order: 15 },
  { id: "taa", arabic: "ط", name: "Tı", nameAr: "طَاء", order: 16 },
  { id: "dhaa", arabic: "ظ", name: "Zı", nameAr: "ظَاء", order: 17 },
  { id: "ayn", arabic: "ع", name: "Ayın", nameAr: "عَيْن", order: 18 },
  { id: "ghayn", arabic: "غ", name: "Gayın", nameAr: "غَيْن", order: 19 },
  { id: "fa", arabic: "ف", name: "Fe", nameAr: "فَاء", order: 20 },
  { id: "qaf", arabic: "ق", name: "Kaf", nameAr: "قَاف", order: 21 },
  { id: "kaf", arabic: "ك", name: "Kef", nameAr: "كَاف", order: 22 },
  { id: "lam", arabic: "ل", name: "Lam", nameAr: "لَام", order: 23 },
  { id: "mim", arabic: "م", name: "Mim", nameAr: "مِيم", order: 24 },
  { id: "nun", arabic: "ن", name: "Nun", nameAr: "نُون", order: 25 },
  { id: "haa", arabic: "ه", name: "He", nameAr: "هَاء", order: 26 },
  { id: "waw", arabic: "و", name: "Vav", nameAr: "وَاو", order: 27 },
  { id: "ya", arabic: "ي", name: "Ye", nameAr: "يَاء", order: 28 },
];

// ── Kids Surah List (short surahs for memorization) ─────────────

export interface KidsSurah {
  id: number;
  verseCount: number;
  difficulty: "easy" | "medium" | "hard";
}

export const KIDS_SURAHS: KidsSurah[] = [
  { id: 1, verseCount: 7, difficulty: "easy" },     // Fatiha
  { id: 112, verseCount: 4, difficulty: "easy" },    // İhlas
  { id: 113, verseCount: 5, difficulty: "easy" },    // Felak
  { id: 114, verseCount: 6, difficulty: "easy" },    // Nas
  { id: 108, verseCount: 3, difficulty: "easy" },    // Kevser
  { id: 110, verseCount: 3, difficulty: "easy" },    // Nasr
  { id: 111, verseCount: 5, difficulty: "easy" },    // Tebbet
  { id: 109, verseCount: 6, difficulty: "easy" },    // Kafirun
  { id: 107, verseCount: 7, difficulty: "medium" },  // Maun
  { id: 106, verseCount: 4, difficulty: "medium" },  // Kureyş
  { id: 105, verseCount: 5, difficulty: "medium" },  // Fil
  { id: 104, verseCount: 9, difficulty: "medium" },  // Hümeze
  { id: 103, verseCount: 3, difficulty: "medium" },  // Asr
  { id: 102, verseCount: 8, difficulty: "medium" },  // Tekasür
  { id: 101, verseCount: 11, difficulty: "medium" }, // Karia
  { id: 100, verseCount: 11, difficulty: "hard" },   // Adiyat
  { id: 99, verseCount: 8, difficulty: "hard" },     // Zilzal
  { id: 97, verseCount: 5, difficulty: "hard" },     // Kadir
  { id: 96, verseCount: 19, difficulty: "hard" },    // Alak
  { id: 95, verseCount: 8, difficulty: "hard" },     // Tin
];

// ── Kids Badges ─────────────────────────────────────────────────

export interface KidsBadge {
  id: string;
  icon: string;
  category: "letter" | "surah" | "streak" | "quiz" | "special";
}

export const KIDS_BADGES: KidsBadge[] = [
  // Letter badges
  { id: "first-letter", icon: "👣", category: "letter" },
  { id: "ten-letters", icon: "📝", category: "letter" },
  { id: "alif-ba-hero", icon: "🦸", category: "letter" },

  // Surah badges
  { id: "first-surah", icon: "🌟", category: "surah" },
  { id: "five-surahs", icon: "📚", category: "surah" },
  { id: "ten-surahs", icon: "👑", category: "surah" },
  { id: "twenty-surahs", icon: "🏆", category: "surah" },

  // Streak badges
  { id: "streak-7", icon: "🔥", category: "streak" },
  { id: "streak-30", icon: "🔥", category: "streak" },
  { id: "streak-100", icon: "🔥", category: "streak" },

  // Quiz badges
  { id: "quiz-perfect", icon: "💯", category: "quiz" },
  { id: "quiz-master", icon: "🤝", category: "quiz" },

  // Special badges
  { id: "early-bird", icon: "🐦", category: "special" },
  { id: "treasure-hunter", icon: "💎", category: "special" },
  { id: "daily-champion", icon: "⭐", category: "special" },
];

// ── Avatar Items ────────────────────────────────────────────────

export type AvatarItemCategory = "hat" | "background" | "frame" | "accessory";

export interface AvatarItem {
  id: string;
  category: AvatarItemCategory;
  gemCost: number;
}

export const AVATAR_ITEMS: AvatarItem[] = [
  // Hats
  { id: "hat-crown", category: "hat", gemCost: 5 },
  { id: "hat-star", category: "hat", gemCost: 3 },
  { id: "hat-flower", category: "hat", gemCost: 2 },
  { id: "hat-moon", category: "hat", gemCost: 4 },

  // Backgrounds
  { id: "bg-meadow", category: "background", gemCost: 3 },
  { id: "bg-sky", category: "background", gemCost: 3 },
  { id: "bg-desert", category: "background", gemCost: 4 },
  { id: "bg-ocean", category: "background", gemCost: 5 },

  // Frames
  { id: "frame-gold", category: "frame", gemCost: 5 },
  { id: "frame-silver", category: "frame", gemCost: 3 },
  { id: "frame-stars", category: "frame", gemCost: 4 },

  // Accessories
  { id: "acc-book", category: "accessory", gemCost: 2 },
  { id: "acc-lamp", category: "accessory", gemCost: 3 },
  { id: "acc-crescent", category: "accessory", gemCost: 4 },
];

// ── Base Avatars ────────────────────────────────────────────────

export const BASE_AVATARS = [
  "avatar-1", "avatar-2", "avatar-3", "avatar-4",
  "avatar-5", "avatar-6", "avatar-7", "avatar-8",
] as const;

export type BaseAvatarId = (typeof BASE_AVATARS)[number];

// ── Quest Types ─────────────────────────────────────────────────

export type KidsQuestType = "listen_surah" | "learn_letters" | "review_surah" | "quiz";

// ── Daily Time Limit Options ────────────────────────────────────

export const TIME_LIMIT_OPTIONS = [0, 5, 10, 15, 20, 30] as const; // 0 = unlimited

// ── Kids Theme Colors ───────────────────────────────────────────

export const KIDS_COLORS = {
  primary: "#10B981",    // emerald
  secondary: "#3B82F6",  // blue
  accent: "#F59E0B",     // amber/orange
  fun: "#8B5CF6",        // purple
  bg: "#FFF7ED",         // warm cream
  bgAlt: "#ECFDF5",     // light emerald
  star: "#FBBF24",       // gold star
  gem: "#818CF8",        // indigo gem
  error: "#F97316",      // soft orange (not red!)
  success: "#34D399",    // emerald light
} as const;
