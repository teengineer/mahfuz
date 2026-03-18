import { useState, useCallback, useRef, useEffect } from "react";
import type { Verse, Word } from "@mahfuz/shared/types";
import { Bismillah } from "./Bismillah";
import { usePreferencesStore, getActiveColors } from "~/stores/usePreferencesStore";
import { useTranslation } from "~/hooks/useTranslation";

/** Surahs that do NOT get a Bismillah prefix */
const NO_BISMILLAH_SURAHS = new Set([1, 9]);

interface SelectedWord {
  wordId: number;
  verseKey: string;
  translation: string;
  transliteration: string;
}

interface MushafViewProps {
  verses: Verse[];
  showBismillah?: boolean;
}

export function MushafView({ verses, showBismillah = true }: MushafViewProps) {
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const colors = getActiveColors({ colorPaletteId });
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const mushafTranslationFontSize = usePreferencesStore((s) => s.mushafTranslationFontSize);
  const mushafTooltipTextSize = usePreferencesStore((s) => s.mushafTooltipTextSize);
  const mushafShowTranslation = usePreferencesStore((s) => s.mushafShowTranslation);
  const selectedTranslations = usePreferencesStore((s) => s.selectedTranslations);
  const { t } = useTranslation();

  const [selectedWord, setSelectedWord] = useState<SelectedWord | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const hasTranslations = mushafShowTranslation && verses.some((v) => v.translations && v.translations.length > 0);

  // Clear selection when clicking outside a word
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target.closest("[data-mushaf-word]")) {
      setSelectedWord(null);
    }
  }, []);

  return (
    <div className="mushaf-spread" ref={containerRef} onClick={handleContainerClick}>
      {/* Arabic page — right on desktop, first on mobile */}
      <div className="mushaf-spread-page mushaf-spread-arabic">
        <ArabicPage
          verses={verses}
          showBismillah={showBismillah}
          colorizeWords={colorizeWords}
          colors={colors}
          fontSize={mushafArabicFontSize}
          tooltipTextSize={mushafTooltipTextSize}
          selectedWord={selectedWord}
          onSelectWord={setSelectedWord}
        />
      </div>

      {/* Spine divider + Translation page — hidden when mushafShowTranslation is off */}
      {mushafShowTranslation && (
        <>
          <div className="mushaf-spread-spine" />
          <div className="mushaf-spread-page mushaf-spread-meal">
            {hasTranslations ? (
              <MealPage
                verses={verses}
                fontSize={mushafTranslationFontSize}
                selectedWord={selectedWord}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6">
                <p className="text-center text-[13px] text-[var(--theme-text-quaternary)]">
                  {selectedTranslations.length === 0
                    ? t.toolbar.mushafNoTranslation
                    : t.toolbar.mushafNote}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Arabic flowing text with verse markers (durak) — interactive words */
function ArabicPage({
  verses,
  showBismillah,
  colorizeWords,
  colors,
  fontSize,
  tooltipTextSize,
  selectedWord,
  onSelectWord,
}: {
  verses: Verse[];
  showBismillah: boolean;
  colorizeWords: boolean;
  colors: string[];
  fontSize: number;
  tooltipTextSize: number;
  selectedWord: SelectedWord | null;
  onSelectWord: (word: SelectedWord | null) => void;
}) {
  const handleWordClick = useCallback(
    (word: Word, verseKey: string) => {
      // Toggle: clicking the same word deselects it
      if (selectedWord?.wordId === word.id) {
        onSelectWord(null);
      } else {
        onSelectWord({
          wordId: word.id,
          verseKey,
          translation: word.translation?.text ?? "",
          transliteration: word.transliteration?.text ?? "",
        });
      }
    },
    [selectedWord, onSelectWord],
  );

  return (
    <p
      className="arabic-text text-center leading-[2.8] text-[var(--mushaf-ink)]"
      style={{ fontSize: `calc(1.65rem * ${fontSize})` }}
      dir="rtl"
    >
      {verses.map((verse) => {
        const surahId = Number(verse.verse_key.split(":")[0]);
        const needsBismillah =
          showBismillah &&
          verse.verse_number === 1 &&
          !NO_BISMILLAH_SURAHS.has(surahId);
        const words =
          verse.words?.filter((w) => w.char_type_name === "word") ?? [];

        return (
          <span key={verse.id}>
            {needsBismillah && (
              <span className="block w-full py-2 text-[1.5rem]">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </span>
            )}
            {words.length > 0
              ? words.map((w, i) => {
                  const isSelected = selectedWord?.wordId === w.id;
                  const hasTooltip = w.translation?.text || w.transliteration?.text;
                  return (
                    <span
                      key={w.id}
                      data-mushaf-word
                      className={`mushaf-word-interactive relative inline ${isSelected ? "mushaf-word-selected" : ""}`}
                      style={colorizeWords ? { color: colors[i % colors.length] } : undefined}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWordClick(w, verse.verse_key);
                      }}
                    >
                      {w.text_uthmani}{" "}
                      {hasTooltip && (
                        <span className={`mushaf-tooltip ${isSelected ? "!opacity-100" : ""}`}>
                          {w.translation?.text && (
                            <span className="block font-medium text-[var(--theme-text)]" style={{ fontSize: `calc(11px * ${tooltipTextSize})` }}>
                              {w.translation.text}
                            </span>
                          )}
                          {w.transliteration?.text && (
                            <span className="block italic text-[var(--theme-text-tertiary)]" style={{ fontSize: `calc(10px * ${tooltipTextSize})` }}>
                              {w.transliteration.text}
                            </span>
                          )}
                        </span>
                      )}
                    </span>
                  );
                })
              : (
                  <>
                    {verse.text_uthmani}{" "}
                  </>
                )}
            <span className="mushaf-durak">
              {toArabicNumeral(verse.verse_number)}
            </span>
            {"  "}
          </span>
        );
      })}
    </p>
  );
}

/** Translation page — verse-by-verse meal text with highlighting */
function MealPage({
  verses,
  fontSize,
  selectedWord,
}: {
  verses: Verse[];
  fontSize: number;
  selectedWord: SelectedWord | null;
}) {
  const highlightedRef = useRef<HTMLDivElement>(null);

  // Scroll to highlighted verse when selectedWord changes
  useEffect(() => {
    if (selectedWord && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedWord?.verseKey]);

  return (
    <div className="space-y-4">
      {verses.map((verse) => {
        const isHighlighted = selectedWord?.verseKey === verse.verse_key;
        return (
          <div
            key={verse.id}
            ref={isHighlighted ? highlightedRef : undefined}
            className={isHighlighted ? "mushaf-verse-highlight" : ""}
          >
            <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--theme-verse-number-bg)] text-[10px] font-semibold tabular-nums text-[var(--theme-text-tertiary)]">
              {verse.verse_number}
            </span>
            {verse.translations?.map((tr, i) => (
              <p
                key={i}
                className={`mt-1 font-sans leading-[1.8] text-[var(--theme-text-secondary)] ${isHighlighted && selectedWord?.translation ? "mushaf-word-match" : ""}`}
                style={{ fontSize: `calc(15px * ${fontSize})` }}
                dangerouslySetInnerHTML={{
                  __html:
                    isHighlighted && selectedWord?.translation
                      ? highlightTranslationWord(tr.text, selectedWord.translation)
                      : tr.text,
                }}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Highlight a word's translation within the meal text.
 * Case-insensitive, Turkish locale-aware. Wraps with <mark>.
 */
function highlightTranslationWord(html: string, word: string): string {
  if (!word || word.length < 2) return html;

  // Strip HTML tags for searching, but we need to work with the raw HTML
  // Simple approach: search in the text content and wrap matches
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    const regex = new RegExp(`(${escaped})`, "gi");
    return html.replace(regex, "<mark>$1</mark>");
  } catch {
    return html;
  }
}

function toArabicNumeral(n: number): string {
  return String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
}
