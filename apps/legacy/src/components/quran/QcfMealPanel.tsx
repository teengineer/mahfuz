import { useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Verse, Chapter } from "@mahfuz/shared/types";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { useTranslation } from "~/hooks/useTranslation";
import { QUERY_KEYS } from "~/lib/query-keys";
import { getSurahName } from "~/lib/surah-name";

interface QcfMealPanelProps {
  verses: Verse[];
  /** QCF page number — filters verses to only those on this page */
  pageNumber: number;
  /** Currently active verse key (for highlight + auto-scroll) */
  currentVerseKey?: string;
}

/**
 * Translation panel displayed next to QCF mushaf pages.
 * Shows verse-by-verse translations for the given page,
 * with active verse highlighting and auto-scroll.
 * Inserts surah dividers when a new surah begins mid-page.
 */
export function QcfMealPanel({ verses, pageNumber, currentVerseKey }: QcfMealPanelProps) {
  const mushafTranslationFontSize = usePreferencesStore((s) => s.mushafTranslationFontSize);
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const allChapters = queryClient.getQueryData<Chapter[]>(QUERY_KEYS.chapters());

  // Filter verses that belong to this page (by Medine page mapping)
  const pageVerses = useMemo(() => {
    return verses.filter((v) => v.page_number === pageNumber);
  }, [verses, pageNumber]);

  const highlightedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to highlighted verse
  useEffect(() => {
    if (currentVerseKey && highlightedRef.current) {
      highlightedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [currentVerseKey]);

  if (pageVerses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <p className="text-[13px] text-[var(--theme-text-quaternary)]">{t.common.page} {pageNumber}</p>
      </div>
    );
  }

  // Track surahId to detect surah transitions
  let prevSurahId: number | null = null;

  return (
    <div className="mushaf-qcf-meal-panel">
      <div className="mb-2 text-[10px] font-medium text-[var(--theme-text-quaternary)]">
        {t.common.page} {pageNumber}
      </div>
      <div className="space-y-3">
        {pageVerses.map((verse) => {
          const isHighlighted = currentVerseKey === verse.verse_key;
          const surahId = Number(verse.verse_key.split(":")[0]);
          const isNewSurah = prevSurahId !== null && surahId !== prevSurahId;
          prevSurahId = surahId;

          // Get surah name for divider
          const chapter = isNewSurah ? allChapters?.find((c) => c.id === surahId) : null;
          const surahName = chapter
            ? getSurahName(chapter.id, chapter.translated_name.name, locale)
            : null;

          return (
            <div key={verse.id}>
              {/* Surah divider */}
              {isNewSurah && (
                <div className="my-4 flex flex-col items-center gap-2">
                  <div className="flex w-full items-center gap-3">
                    <span className="h-px flex-1 bg-[var(--theme-divider)]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-meta-color)]" />
                    <span className="h-px flex-1 bg-[var(--theme-divider)]" />
                  </div>
                  <div className="text-center">
                    {chapter && (
                      <p className="arabic-text text-[1.25rem] leading-tight text-[var(--theme-text)]" dir="rtl">
                        {chapter.name_arabic}
                      </p>
                    )}
                    {surahName && (
                      <p className="mt-0.5 text-[11px] font-medium text-[var(--theme-text-secondary)]">
                        {surahName}
                      </p>
                    )}
                  </div>
                  <div className="flex w-full items-center gap-3">
                    <span className="h-px flex-1 bg-[var(--theme-divider)]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--theme-meta-color)]" />
                    <span className="h-px flex-1 bg-[var(--theme-divider)]" />
                  </div>
                </div>
              )}

              <div
                ref={isHighlighted ? highlightedRef : undefined}
                className={`rounded-lg px-2.5 py-2 transition-colors ${
                  isHighlighted
                    ? "bg-primary-600/10 ring-1 ring-primary-600/20"
                    : ""
                }`}
              >
                <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--theme-verse-number-bg)] text-[10px] font-semibold tabular-nums text-[var(--theme-text-tertiary)]">
                  {verse.verse_number}
                </span>
                {verse.translations?.map((tr, i) => (
                  <p
                    key={i}
                    className="mt-1 font-sans leading-[1.8] text-[var(--theme-text-secondary)]"
                    style={{ fontSize: `calc(14px * ${mushafTranslationFontSize})` }}
                    dangerouslySetInnerHTML={{ __html: tr.text }}
                  />
                ))}
                {(!verse.translations || verse.translations.length === 0) && (
                  <p className="mt-1 text-[12px] italic text-[var(--theme-text-quaternary)]">—</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
