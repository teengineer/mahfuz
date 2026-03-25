import { createFileRoute, useNavigate, useRouter, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect } from "react";
import { chapterQueryOptions } from "~/hooks/useChapters";
import { verseByKeyQueryOptions } from "~/hooks/useVerses";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";
import { Loading } from "~/components/ui/Loading";
import { usePreferencesStore, getActiveColors } from "~/stores/usePreferencesStore";
import { useAudioStore } from "~/stores/useAudioStore";
import { useTranslatedVerses } from "~/hooks/useTranslatedVerses";
import { TranslationBlock } from "~/components/quran/TranslationBlock";
import { TOTAL_CHAPTERS } from "@mahfuz/shared/constants";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";
import { useReadingHistory } from "~/stores/useReadingHistory";
import { useReadingStats } from "~/stores/useReadingStats";
import { useSwipeNavigation } from "~/hooks/useSwipeNavigation";

import type { ChapterAudioData } from "@mahfuz/audio-engine";

export const Route = createFileRoute("/_app/$surahId/$verseNum")({
  loader: ({ context, params }) => {
    const surah = Number(params.surahId);
    const verse = Number(params.verseNum);
    if (!Number.isInteger(surah) || surah < 1 || surah > TOTAL_CHAPTERS || !Number.isInteger(verse) || verse < 1)
      throw notFound();
    const verseKey = `${surah}:${verse}`;
    return Promise.all([
      context.queryClient.ensureQueryData(chapterQueryOptions(surah)),
      context.queryClient.ensureQueryData(verseByKeyQueryOptions(verseKey)),
    ]);
  },
  pendingComponent: () => <Loading text="Ayet yükleniyor..." />,
  head: ({ params }) => {
    return {
      meta: [{ title: `${params.surahId}:${params.verseNum} | Mahfuz` }],
    };
  },
  component: VerseReaderView,
});

/* Main Component */

function VerseReaderView() {
  const { surahId, verseNum: verseNumParam } = Route.useParams();
  const surah = Number(surahId);
  const verseNum = Number(verseNumParam);
  const navigate = useNavigate();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();

  const { data: chapter } = useSuspenseQuery(chapterQueryOptions(surah));
  const verseKey = `${surah}:${verseNum}`;
  const { data: verse } = useSuspenseQuery(verseByKeyQueryOptions(verseKey));

  // Preferences
  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const normalTranslationFontSize = usePreferencesStore((s) => s.normalTranslationFontSize);
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const colors = getActiveColors({ colorPaletteId });

  // Audio
  const reciterId = useAudioStore((s) => s.reciterId);
  const playVerseAction = useAudioStore((s) => s.playVerse);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);
  const playbackState = useAudioStore((s) => s.playbackState);
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const currentWordPosition = useAudioStore((s) => s.currentWordPosition);

  const isCurrentVerse = currentVerseKey === verseKey;
  const isPlaying = isCurrentVerse && playbackState === "playing";
  const isPaused = isCurrentVerse && playbackState === "paused";
  const activeWordPos = isPlaying ? currentWordPosition : null;

  // Auto-advance: when audio engine moves to next verse, navigate to it
  useEffect(() => {
    if (!currentVerseKey || currentVerseKey === verseKey) return;
    // Audio moved to a different verse, follow it
    const [s, v] = currentVerseKey.split(":").map(Number);
    if (s && v && s === surah && playbackState === "playing") {
      navigate({ to: "/$surahId/$verseNum", params: { surahId: String(s), verseNum: String(v) } });
    }
  }, [currentVerseKey, verseKey, surah, playbackState, navigate]);

  // Multi-translation support
  const translatedVerses = useTranslatedVerses([verse]);
  const displayVerse = translatedVerses[0] ?? verse;

  // Navigation
  const totalVerses = chapter.verses_count;
  const hasPrev = verseNum > 1;
  const hasNext = verseNum < totalVerses;
  const [showEndPrompt, setShowEndPrompt] = useState(false);

  const goTo = useCallback(
    (s: number, v: number) => {
      setShowEndPrompt(false);
      navigate({ to: "/$surahId/$verseNum", params: { surahId: String(s), verseNum: String(v) } });
    },
    [navigate],
  );

  const goNext = useCallback(() => {
    if (hasNext) {
      goTo(surah, verseNum + 1);
    } else {
      setShowEndPrompt(true);
    }
  }, [hasNext, surah, verseNum, goTo]);

  const goPrev = useCallback(() => {
    if (hasPrev) {
      goTo(surah, verseNum - 1);
    }
  }, [hasPrev, surah, verseNum, goTo]);

  const goNextSurah = useCallback(() => {
    if (surah < TOTAL_CHAPTERS) {
      goTo(surah + 1, 1);
    }
  }, [surah, goTo]);

  const goBack = useCallback(() => {
    router.history.back();
  }, [router]);

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        goBack();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, goBack]);

  // Swipe
  const containerRef = useRef<HTMLDivElement>(null);
  useSwipeNavigation(containerRef, {
    onSwipeLeft: goNext,
    onSwipeRight: goPrev,
  });

  // Prefetch next verse
  useEffect(() => {
    if (hasNext) {
      queryClient.prefetchQuery(verseByKeyQueryOptions(`${surah}:${verseNum + 1}`));
    } else if (surah < TOTAL_CHAPTERS) {
      queryClient.prefetchQuery(chapterQueryOptions(surah + 1));
      queryClient.prefetchQuery(verseByKeyQueryOptions(`${surah + 1}:1`));
    }
  }, [surah, verseNum, hasNext, queryClient]);

  // Track verse-level reading + page for khatam
  const visitVerse = useReadingHistory((s) => s.visitVerse);
  const markPageRead = useReadingStats((s) => s.markPageRead);
  useEffect(() => {
    visitVerse(surah, verseNum, getSurahName(chapter.id, chapter.translated_name.name, locale));
    if (verse.page_number) markPageRead(verse.page_number);
  }, [surah, verseNum, visitVerse, chapter, locale, verse.page_number, markPageRead]);

  // Audio
  const fetchChapterAudio = useCallback(async (): Promise<ChapterAudioData> => {
    const qdcFile = await queryClient.fetchQuery(
      chapterAudioQueryOptions(reciterId, surah),
    );
    return {
      audioUrl: qdcFile.audio_url,
      verseTimings: qdcFile.verse_timings.map((t) => ({
        verseKey: t.verse_key,
        from: t.timestamp_from,
        to: t.timestamp_to,
        segments: t.segments,
      })),
    };
  }, [queryClient, reciterId, surah]);

  const handlePlayVerse = useCallback(async () => {
    if (isPlaying || isPaused) {
      togglePlayPause();
      return;
    }
    const audioData = await fetchChapterAudio();
    playVerseAction(surah, getSurahName(chapter.id, chapter.translated_name.name, locale), verseKey, audioData);
  }, [isPlaying, isPaused, togglePlayPause, fetchChapterAudio, playVerseAction, surah, getSurahName(chapter.id, chapter.translated_name.name, locale), verseKey]);

  // Copy to clipboard
  const [expandedTranslations, setExpandedTranslations] = useState<Set<number>>(
    () => new Set([0]),
  );
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const arabicText = displayVerse.words
      ? displayVerse.words
          .filter((w) => w.char_type_name === "word")
          .map((w) => w.text_uthmani)
          .join(" ")
      : displayVerse.text_uthmani;

    const parts = [`${getSurahName(chapter.id, chapter.translated_name.name, locale)} ${verseKey}`, ``, arabicText];

    if (displayVerse.translations) {
      const expanded = displayVerse.translations.length === 1
        ? displayVerse.translations
        : displayVerse.translations.filter((_, i) => expandedTranslations.has(i));

      for (const t of expanded) {
        const plainText = t.text.replace(/<[^>]*>/g, "");
        parts.push("", "${t.resource_name}: ${plainText}");
      }
    }

    await navigator.clipboard.writeText(parts.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [displayVerse, getSurahName(chapter.id, chapter.translated_name.name, locale), verseKey, expandedTranslations]);

  const progress = Math.round((verseNum / totalVerses) * 100);

  return (
    <div
      ref={containerRef}
      className="flex min-h-[calc(100dvh-60px)] flex-col"
      style={{ touchAction: "pan-y" }}
    >
      {/* Header */}
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 lg:px-8">
        <button
          onClick={goBack}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
          aria-label={t.common.back}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-[14px] font-semibold text-[var(--theme-text)]">
            {getSurahName(chapter.id, chapter.translated_name.name, locale)}
          </p>
        </div>
        <span className="text-[13px] tabular-nums text-[var(--theme-text-tertiary)]">
          {verseNum}/{totalVerses}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mx-auto w-full max-w-5xl px-4 lg:px-8">
        <div className="h-1 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
          <div
            className="h-full rounded-full bg-primary-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Verse card area — stacked on mobile, side-by-side on desktop */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-6 lg:px-8">
        <div className="flex w-full max-w-lg flex-col items-stretch gap-5 lg:max-w-5xl lg:flex-row lg:gap-8">
          {/* Arabic card */}
          <div className="relative flex-1 animate-fade-in rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8 lg:flex lg:flex-col lg:justify-center">
            {/* Copy button, top right */}
            <button
              onClick={handleCopy}
              className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                copied
                  ? "bg-green-500 text-white"
                  : "text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)]"
              }`}
              aria-label={t.quranReader.copy}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                {copied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                ) : (
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </>
                )}
              </svg>
            </button>
            <div dir="rtl" className="text-center">
              <p
                className="arabic-text leading-[2.6] text-[var(--theme-text)] lg:leading-[2.8]"
                style={{ fontSize: `calc(2rem * ${normalArabicFontSize})` }}
              >
                {displayVerse.words
                  ? displayVerse.words
                      .filter((w) => w.char_type_name === "word")
                      .map((w, i) => {
                        const isActiveWord =
                          activeWordPos !== null && w.position === activeWordPos;
                        return (
                          <span
                            key={w.id}
                            className={`word-highlight ${isActiveWord ? `active` : ``}`}
                            style={
                              colorizeWords && colors.length > 0
                                ? { color: isActiveWord ? undefined : colors[i % colors.length] }
                                : undefined
                            }
                          >
                            {w.text_uthmani}{" "}
                          </span>
                        );
                      })
                  : displayVerse.text_uthmani}
              </p>
            </div>

            {/* Play button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handlePlayVerse}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                  isPlaying
                    ? "bg-primary-600 text-white shadow-sm"
                    : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
                }`}
                aria-label={isPlaying ? t.quranReader.pauseVerse : t.quranReader.listenVerse}
              >
                <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor">
                  {isPlaying ? (
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  ) : (
                    <path d="M8 5.14v14l11-7-11-7z" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Translation — right column on desktop */}
          {displayVerse.translations && displayVerse.translations.length > 0 && (
            <div className="w-full animate-fade-in lg:flex lg:w-[40%] lg:flex-col lg:justify-center">
              <TranslationBlock
                translations={displayVerse.translations}
                fontSize={normalTranslationFontSize}
                onExpandedChange={setExpandedTranslations}
              />
            </div>
          )}
        </div>

        {/* End-of-surah prompt */}
        {showEndPrompt && (
          <div className="mt-6 w-full max-w-lg animate-fade-in rounded-2xl bg-[var(--theme-bg-primary)] p-5 text-center shadow-[var(--shadow-card)] lg:max-w-xl">
            <p className="mb-3 text-[14px] font-medium text-[var(--theme-text)]">
              {t.quranReader.surahEnd}
              {surah < TOTAL_CHAPTERS && ` ${t.quranReader.nextSurahPrompt}`}
            </p>
            {surah < TOTAL_CHAPTERS && (
              <button
                onClick={goNextSurah}
                className="rounded-full bg-primary-600 px-5 py-2 text-[13px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
              >
                {t.quranReader.nextSurah}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-[var(--theme-border)] px-4 py-3 lg:px-8">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3 lg:max-w-xl">
          <button
            onClick={goPrev}
            disabled={!hasPrev}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[14px] font-medium transition-all disabled:opacity-30 bg-[var(--theme-hover-bg)] text-[var(--theme-text)] hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t.quranReader.prev}
          </button>
          <button
            onClick={goBack}
            className="flex h-11 items-center justify-center rounded-xl px-5 text-[14px] font-medium text-primary-600 transition-all hover:bg-primary-600/10 active:scale-[0.97]"
          >
            {t.quranReader.done}
          </button>
          <button
            onClick={goNext}
            disabled={!hasNext && showEndPrompt}
            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl text-[14px] font-medium transition-all disabled:opacity-30 bg-[var(--theme-hover-bg)] text-[var(--theme-text)] hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
          >
            {t.quranReader.next}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
