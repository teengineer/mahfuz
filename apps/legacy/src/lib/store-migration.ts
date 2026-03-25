/**
 * Migrates v1 localStorage stores to v2 split stores on first visit.
 * Reads from "mahfuz-preferences" (Zustand format {state:{...}, version:9})
 * and distributes fields to new localStorage keys.
 *
 * Run in __root.tsx inline script to prevent FOUC.
 */

const V2_MIGRATION_KEY = "mahfuz-v2-migrated";

interface V1PreferencesState {
  theme?: string;
  arabicFontId?: string;
  colorizeWords?: boolean;
  colorPaletteId?: string;
  textType?: string;
  viewMode?: string;
  selectedTranslations?: string[];
  normalShowTranslation?: boolean;
  normalShowWordHover?: boolean;
  wbwShowTranslation?: boolean;
  wbwShowWordTranslation?: boolean;
  wbwShowWordTransliteration?: boolean;
  wbwTransliterationFirst?: boolean;
  normalArabicFontSize?: number;
  normalTranslationFontSize?: number;
  wbwArabicFontSize?: number;
  mushafArabicFontSize?: number;
  wordTranslationSize?: number;
  wordTransliterationSize?: number;
  sidebarCollapsed?: boolean;
  hasSeenOnboarding?: boolean;
  showLearnTab?: boolean;
  showMemorizeTab?: boolean;
}

function writeZustandStore(name: string, state: Record<string, unknown>) {
  localStorage.setItem(name, JSON.stringify({ state, version: 0 }));
}

export function migrateV1ToV2(): void {
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(V2_MIGRATION_KEY)) return;

  try {
    const raw = localStorage.getItem("mahfuz-preferences");
    if (!raw) {
      localStorage.setItem(V2_MIGRATION_KEY, "1");
      return;
    }

    const parsed = JSON.parse(raw);
    const s: V1PreferencesState = parsed.state || {};

    // Display prefs
    writeZustandStore("mahfuz-display-prefs", {
      theme: s.theme ?? "sepia",
      arabicFontId: s.arabicFontId ?? "scheherazade-new",
      colorizeWords: s.colorizeWords ?? false,
      colorPaletteId: s.colorPaletteId ?? "pastel",
      textType: s.textType ?? "uthmani",
    });

    // Reading prefs — map old "wordByWord"/"normal" → "metin"
    const oldVm = s.viewMode ?? "normal";
    const migratedViewMode = oldVm === "mushaf" ? "mushaf" : "metin";
    const migratedShowWbw = oldVm === "wordByWord";
    writeZustandStore("mahfuz-reading-prefs", {
      viewMode: migratedViewMode,
      showWordByWord: migratedShowWbw,
      selectedTranslations: s.selectedTranslations ?? ["omer-celik"],
      normalShowTranslation: s.normalShowTranslation ?? true,
      normalShowWordHover: s.normalShowWordHover ?? true,
      wbwShowTranslation: s.wbwShowTranslation ?? false,
      wbwShowWordTranslation: s.wbwShowWordTranslation ?? true,
      wbwShowWordTransliteration: s.wbwShowWordTransliteration ?? true,
      wbwTransliterationFirst: s.wbwTransliterationFirst ?? false,
      normalArabicFontSize: s.normalArabicFontSize ?? 1,
      normalTranslationFontSize: s.normalTranslationFontSize ?? 1,
      wbwArabicFontSize: s.wbwArabicFontSize ?? 1,
      mushafArabicFontSize: s.mushafArabicFontSize ?? 1,
      wordTranslationSize: s.wordTranslationSize ?? 1,
      wordTransliterationSize: s.wordTransliterationSize ?? 1,
    });

    // App UI
    writeZustandStore("mahfuz-app-ui", {
      sidebarCollapsed: s.sidebarCollapsed ?? false,
      hasSeenOnboarding: s.hasSeenOnboarding ?? false,
      showLearnTab: s.showLearnTab ?? true,
      showMemorizeTab: s.showMemorizeTab ?? true,
    });

    // Audio prefs — migrate from "mahfuz-audio"
    const audioRaw = localStorage.getItem("mahfuz-audio");
    if (audioRaw) {
      const audioParsed = JSON.parse(audioRaw);
      const a = audioParsed.state || {};
      writeZustandStore("mahfuz-audio-prefs", {
        reciterId: a.reciterId ?? 7,
        speed: a.speed ?? 1,
        volume: a.volume ?? 1,
        isMuted: a.isMuted ?? false,
        repeatMode: a.repeatMode ?? "none",
      });
    }

    localStorage.setItem(V2_MIGRATION_KEY, "1");
  } catch {
    // Silent fail — user gets fresh defaults
    localStorage.setItem(V2_MIGRATION_KEY, "1");
  }
}
