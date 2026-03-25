import { tr } from "./tr";
import type { LocaleConfig, Messages } from "./types";

/**
 * Central locale registry.
 *
 * Default locale (tr) is always bundled. Other complete locales (en, es) are
 * loaded dynamically on first use to reduce initial bundle size.
 *
 * To add a new language:
 *   1. Create `locales/<code>/index.ts` exporting translations
 *   2. Add an entry here (with a loader if complete)
 *   3. Done — Locale type auto-extends, UI picks it up
 */

/** Dynamic loaders for non-default complete locales */
const localeLoaders: Record<string, () => Promise<Messages>> = {
  en: () => import("./en").then((m) => m.en),
  es: () => import("./es").then((m) => m.es),
  fr: () => import("./fr").then((m) => m.fr),
  ar: () => import("./ar").then((m) => m.ar),
};

const registry = {
  tr: {
    messages: tr,
    displayName: "Türkçe",
    dir: "ltr",
    bcp47: "tr",
    complete: true,
  },
  en: {
    messages: {} as Messages,
    displayName: "English",
    dir: "ltr",
    bcp47: "en",
    complete: true,
  },
  es: {
    messages: {} as Messages,
    displayName: "Español",
    dir: "ltr",
    bcp47: "es",
    complete: true,
  },
  ar: {
    messages: {} as Messages,
    displayName: "العربية",
    dir: "rtl",
    bcp47: "ar",
    complete: true,
  },
  bn: {
    messages: {},
    displayName: "বাংলা",
    dir: "ltr",
    bcp47: "bn",
    complete: false,
  },
  fa: {
    messages: {},
    displayName: "فارسی",
    dir: "rtl",
    bcp47: "fa",
    complete: false,
  },
  fr: {
    messages: {} as Messages,
    displayName: "Français",
    dir: "ltr",
    bcp47: "fr",
    complete: true,
  },
  id: {
    messages: {},
    displayName: "Indonesia",
    dir: "ltr",
    bcp47: "id",
    complete: false,
  },
  it: {
    messages: {},
    displayName: "Italiano",
    dir: "ltr",
    bcp47: "it",
    complete: false,
  },
  nl: {
    messages: {},
    displayName: "Dutch",
    dir: "ltr",
    bcp47: "nl",
    complete: false,
  },
  pt: {
    messages: {},
    displayName: "Português",
    dir: "ltr",
    bcp47: "pt",
    complete: false,
  },
  ru: {
    messages: {},
    displayName: "русский",
    dir: "ltr",
    bcp47: "ru",
    complete: false,
  },
  sq: {
    messages: {},
    displayName: "Shqip",
    dir: "ltr",
    bcp47: "sq",
    complete: false,
  },
  th: {
    messages: {},
    displayName: "ภาษาไทย",
    dir: "ltr",
    bcp47: "th",
    complete: false,
  },
  ur: {
    messages: {},
    displayName: "اردو",
    dir: "rtl",
    bcp47: "ur",
    complete: false,
  },
  zh: {
    messages: {},
    displayName: "简体中文",
    dir: "ltr",
    bcp47: "zh",
    complete: false,
  },
  ms: {
    messages: {},
    displayName: "Melayu",
    dir: "ltr",
    bcp47: "ms",
    complete: false,
  },
  sw: {
    messages: {},
    displayName: "Kiswahili",
    dir: "ltr",
    bcp47: "sw",
    complete: false,
  },
  vi: {
    messages: {},
    displayName: "Tiếng Việt",
    dir: "ltr",
    bcp47: "vi",
    complete: false,
  },
} as const satisfies Record<string, LocaleConfig>;

/** Union of all registered locale codes — auto-extends when entries are added. */
export type Locale = keyof typeof registry;

/** Default locale used as fallback source. */
export const DEFAULT_LOCALE: Locale = "tr";

/** All registered locale codes as an array (for iteration / validation). */
export const LOCALE_CODES = Object.keys(registry) as Locale[];

/** Get config for a specific locale. */
export function getLocaleConfig(locale: Locale): LocaleConfig {
  return registry[locale];
}

/** Get all locale configs as `[code, config]` pairs. */
export function getAllLocaleConfigs(): { code: Locale; config: LocaleConfig }[] {
  return LOCALE_CODES.map((code) => ({ code, config: registry[code] }));
}

/**
 * Load messages for a locale dynamically.
 * Returns immediately for tr (always bundled) and already-loaded locales.
 * Triggers async load for en/es on first access.
 */
export async function loadLocaleMessages(locale: Locale): Promise<Messages> {
  const config = registry[locale];

  // tr is always bundled
  if (locale === "tr") return config.messages as Messages;

  // Already loaded (messages object has keys)
  if (Object.keys(config.messages).length > 0) return config.messages as Messages;

  // Dynamic load
  const loader = localeLoaders[locale];
  if (loader) {
    const messages = await loader();
    // Cache into registry so subsequent calls are sync
    (registry[locale] as { messages: Messages | Record<string, never> }).messages = messages;
    return messages;
  }

  // Incomplete locale — return empty (will be merged with tr fallback)
  return config.messages as Messages;
}
