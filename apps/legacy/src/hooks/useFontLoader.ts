import { useEffect } from "react";
import {
  usePreferencesStore,
  getArabicFont,
  getArabicFontSizeForMode,
  getTranslationFontSizeForMode,
} from "~/stores/usePreferencesStore";
import { useDisplayPrefs } from "~/stores/useDisplayPrefs";

const injectedLinks = new Set<string>();

function injectGoogleFont(url: string) {
  if (injectedLinks.has(url)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
  injectedLinks.add(url);
}

const THEME_META_COLORS: Record<string, string> = {
  light: "#059669",
  crystal: "#007AFF",
  sepia: "#8b7332",
  dark: "#1a1a1a",
  dimmed: "#22272e",
  teal: "#1c3f44",
  black: "#000000",
};

export function useFontLoader() {
  const arabicFontId = usePreferencesStore((s) => s.arabicFontId);
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const normalTranslationFontSize = usePreferencesStore((s) => s.normalTranslationFontSize);
  const wbwArabicFontSize = usePreferencesStore((s) => s.wbwArabicFontSize);
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const mushafTranslationFontSize = usePreferencesStore((s) => s.mushafTranslationFontSize);
  const theme = usePreferencesStore((s) => s.theme);

  useEffect(() => {
    const font = getArabicFont(arabicFontId);

    if (font.source === "google" && font.googleUrl) {
      injectGoogleFont(font.googleUrl);
    }

    const showWordByWord = usePreferencesStore.getState().showWordByWord;
    const arabicFontSize = getArabicFontSizeForMode({ viewMode, showWordByWord, normalArabicFontSize, wbwArabicFontSize, mushafArabicFontSize });
    const translationFontSize = getTranslationFontSizeForMode({ viewMode, normalTranslationFontSize, mushafTranslationFontSize });

    const html = document.documentElement;
    html.style.setProperty(
      "--font-arabic",
      `${font.family}, "Traditional Arabic", serif`,
    );
    html.style.setProperty("--arabic-font-scale", String(arabicFontSize));
    html.style.setProperty(
      "--translation-font-scale",
      String(translationFontSize),
    );
  }, [arabicFontId, viewMode, normalArabicFontSize, normalTranslationFontSize, wbwArabicFontSize, mushafArabicFontSize, mushafTranslationFontSize]);

  const autoTheme = useDisplayPrefs((s) => s.autoTheme);
  const dayTheme = useDisplayPrefs((s) => s.dayTheme);
  const nightTheme = useDisplayPrefs((s) => s.nightTheme);

  useEffect(() => {
    function applyTheme(t: string) {
      document.documentElement.setAttribute("data-theme", t);
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", THEME_META_COLORS[t] || "#059669");
      }
    }

    if (autoTheme) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const resolve = () => (mq.matches ? nightTheme : dayTheme);
      applyTheme(resolve());
      const handler = () => applyTheme(resolve());
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    } else {
      applyTheme(theme);
    }
  }, [theme, autoTheme, dayTheme, nightTheme]);
}
