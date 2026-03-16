import { memo, useState, useCallback, useEffect, useRef } from "react";
import type { Word, WordMorphology } from "@mahfuz/shared/types";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { useShallow } from "zustand/react/shallow";
import { useReadingPrefs } from "~/stores/useReadingPrefs";
import { MorphologyPopover } from "./MorphologyPopover";

interface WordByWordProps {
  words: Word[];
  colorizeWords?: boolean;
  colors?: string[];
  activeWordPosition?: number | null;
  /** Per-word morphology data, keyed by position (1-based) */
  morphologyData?: WordMorphology[];
}

export const WordByWord = memo(function WordByWord({
  words,
  colorizeWords = false,
  colors = [],
  activeWordPosition,
  morphologyData,
}: WordByWordProps) {
  const showGrammar = useReadingPrefs((s) => s.wbwShowGrammar);
  // Consolidated preferences selector — single subscription instead of 6
  const prefs = usePreferencesStore(useShallow((s) => ({
    showTranslation: s.wbwShowWordTranslation,
    showTransliteration: s.wbwShowWordTransliteration,
    translationSize: s.wordTranslationSize,
    transliterationSize: s.wordTransliterationSize,
    transliterationFirst: s.wbwTransliterationFirst,
    wbwArabicFontSize: s.wbwArabicFontSize,
    wbwPopupTextSize: s.wbwPopupTextSize,
  })));

  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWordClick = useCallback((wordId: number) => {
    setSelectedWordId((prev) => (prev === wordId ? null : wordId));
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    if (selectedWordId === null) return;
    function onPointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSelectedWordId(null);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [selectedWordId]);

  const wordItems = words.filter((w) => w.char_type_name === "word");

  const colorStyle = (i: number, isActive: boolean, opacity?: number) =>
    colorizeWords && colors.length > 0 && !isActive
      ? { color: colors[i % colors.length], ...(opacity != null ? { opacity } : {}) }
      : {};

  return (
    <div ref={containerRef} className="flex flex-wrap justify-end gap-x-5 gap-y-4">
      {wordItems.map((word, i) => {
        const isActive =
          activeWordPosition != null && word.position === activeWordPosition;
        const isSelected = selectedWordId === word.id;
        const hasPopup = word.translation?.text || word.transliteration?.text;

        const translationEl = prefs.showTranslation && (
          <span
            key="tr"
            className="font-sans text-[var(--theme-text-tertiary)] transition-colors"
            style={{
              fontSize: `calc(11px * ${prefs.translationSize})`,
              ...(isActive
                ? { color: "var(--theme-highlight-text)" }
                : colorStyle(i, isActive)),
            }}
          >
            {word.translation?.text}
          </span>
        );

        const transliterationEl = prefs.showTransliteration && (
          <span
            key="tl"
            className="font-sans text-[var(--theme-text-quaternary)] transition-colors"
            style={{
              fontSize: `calc(10px * ${prefs.transliterationSize})`,
              ...(isActive
                ? { color: "var(--theme-highlight-text)" }
                : colorStyle(i, isActive, 0.75)),
            }}
          >
            {word.transliteration?.text}
          </span>
        );

        return (
          <div
            key={word.id}
            className={`relative flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 transition-colors ${
              isActive ? "" : "hover:bg-[var(--theme-pill-bg)]"
            } ${isSelected ? "bg-[var(--theme-pill-bg)]" : ""}`}
            onClick={() => handleWordClick(word.id)}
          >
            <span
              className={`word-highlight arabic-text cursor-pointer ${isActive ? "active" : ""}`}
              style={{
                fontSize: `calc(1.5rem * ${prefs.wbwArabicFontSize})`,
                ...(colorizeWords && colors.length > 0 && !isActive
                  ? { color: colors[i % colors.length] }
                  : isActive
                    ? {}
                    : { color: "var(--theme-text)" }),
              }}
            >
              {word.text_uthmani}
            </span>
            {prefs.transliterationFirst ? (
              <>{transliterationEl}{translationEl}</>
            ) : (
              <>{translationEl}{transliterationEl}</>
            )}

            {/* Tap-to-select popup */}
            {isSelected && hasPopup && !showGrammar && (
              <span className="absolute bottom-full left-1/2 z-30 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[var(--theme-bg-elevated)] px-3 py-2 shadow-[var(--shadow-float)]">
                {word.translation?.text && (
                  <span className="block font-sans font-medium text-[var(--theme-text)]" style={{ fontSize: `calc(12px * ${prefs.wbwPopupTextSize})` }}>
                    {word.translation.text}
                  </span>
                )}
                {word.transliteration?.text && (
                  <span className="block font-sans italic text-[var(--theme-text-tertiary)]" style={{ fontSize: `calc(11px * ${prefs.wbwPopupTextSize})` }}>
                    {word.transliteration.text}
                  </span>
                )}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--theme-bg-elevated)]" />
              </span>
            )}
            {/* Grammar popover */}
            {isSelected && showGrammar && morphologyData && (() => {
              const morph = morphologyData.find((m) => m.p === word.position);
              return morph ? <MorphologyPopover morph={morph} onClose={() => setSelectedWordId(null)} /> : null;
            })()}
          </div>
        );
      })}
      {words
        .filter((w) => w.char_type_name === "end")
        .map((w) => (
          <span
            key={w.id}
            className="arabic-text self-start text-[var(--theme-text-quaternary)]"
            style={{ fontSize: `calc(1.5rem * ${prefs.wbwArabicFontSize})` }}
          >
            {w.text}
          </span>
        ))}
    </div>
  );
});
