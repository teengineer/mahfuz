import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/Dialog";
import { Popover, PopoverTrigger, PopoverContent } from "~/components/ui/Popover";
import { chapterQueryOptions, chaptersQueryOptions } from "~/hooks/useChapters";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import { wbwByChapterQueryOptions } from "~/hooks/useWbwData";
import { mergeWbwIntoVerses } from "~/lib/quran-data";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";
import { useQcfBatchPreload } from "~/hooks/useQcfPage";
import { VerseList, MushafPageImage, QcfMealPanel } from "~/components/quran";
import { Loading } from "~/components/ui/Loading";
import { Skeleton } from "~/components/ui/Skeleton";
import { TOTAL_CHAPTERS } from "@mahfuz/shared/constants";
import { getJuzForPage } from "@mahfuz/shared";
import { usePageLayout } from "~/lib/page-layout";
import { useBerkenarPageForVerse } from "~/hooks/useBerkenarPage";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import type { ViewMode } from "~/stores/usePreferencesStore";
import { useAudioStore } from "~/stores/useAudioStore";
import type { Chapter } from "@mahfuz/shared/types";
import type { ChapterAudioData } from "@mahfuz/audio-engine";
import { useReadingHistory } from "~/stores/useReadingHistory";
import { useReadingListStore } from "~/stores/useReadingListStore";
import { useTranslatedVerses } from "~/hooks/useTranslatedVerses";
import type { TopicEntry } from "~/data/topic-index-expanded";
import { EXPANDED_TOPIC_INDEX } from "~/data/topic-index-expanded";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";
import { useI18nStore } from "~/stores/useI18nStore";
import { FocusModeIcon } from "~/components/focus/FocusIcons";
import { AddToReadingListButton } from "~/components/browse/AddToReadingListButton";

export const Route = createFileRoute("/_app/$surahId/")({
  validateSearch: (search: Record<string, unknown>) => ({
    verse: search.verse ? Number(search.verse) : undefined,
    topic: typeof search.topic === "string" ? search.topic : undefined,
    lock: search.lock === true || search.lock === "true" || search.lock === "1" ? true : undefined,
  }),
  loader: ({ context, params }) => {
    const chapterId = Number(params.surahId);
    if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > TOTAL_CHAPTERS)
      throw notFound();
    return Promise.all([
      context.queryClient.ensureQueryData(chapterQueryOptions(chapterId)),
      context.queryClient.ensureQueryData(
        versesByChapterQueryOptions(chapterId, 1)
      ),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
    ]);
  },
  pendingComponent: () => (
    <div className="mx-auto max-w-[960px] lg:max-w-[1200px] px-5 py-5 sm:px-6 sm:py-10">
      <div className="mb-6 text-center">
        <Skeleton className="mx-auto mb-2 h-6 w-32" />
        <Skeleton className="mx-auto h-4 w-24" />
      </div>
      <Skeleton className="mx-auto mb-8 h-8 w-64" />
      <div className="space-y-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl p-4">
            <Skeleton className="mb-3 h-6 w-full" />
            <Skeleton lines={2} />
          </div>
        ))}
      </div>
    </div>
  ),
  head: ({ loaderData }) => {
    const chapter = loaderData?.[0];
    if (!chapter) return {};
    const locale = useI18nStore.getState().locale;
    const name = getSurahName(chapter.id, chapter.translated_name.name, locale);
    return {
      meta: [
        {
          title: `${name} (${chapter.name_arabic}) | Mahfuz`,
        },
      ],
    };
  },
  component: SurahView,
});

const VIEW_MODE_ICONS: Record<string, React.ReactNode> = {
  normal: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4h10M3 8h7M3 12h10" />
    </svg>
  ),
  wordByWord: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1.5" y="3" width="4" height="4.5" rx="1" />
      <rect x="7.5" y="3" width="4" height="4.5" rx="1" />
      <rect x="1.5" y="9.5" width="4" height="4.5" rx="1" />
      <rect x="7.5" y="9.5" width="4" height="4.5" rx="1" />
    </svg>
  ),
  mushaf: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2.5h4.5a1.5 1.5 0 0 1 1.5 1.5v10S6.5 13 4.25 13 2 14 2 14V2.5z" />
      <path d="M14 2.5H9.5A1.5 1.5 0 0 0 8 4v10s1.5-1 3.75-1S14 14 14 14V2.5z" />
    </svg>
  ),
};

function SurahView() {
  const { surahId } = Route.useParams();
  const { verse: verseParam, topic: topicParam, lock: lockParam } = Route.useSearch();
  const chapterId = Number(surahId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);

  // Lock mode — prevents scroll & accidental navigation (for child Quran lessons)
  const [lockMode, setLockMode] = useState(!!lockParam);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lockProgress, setLockProgress] = useState(false); // visual feedback during long-press
  const [lockPickerOpen, setLockPickerOpen] = useState(false);

  // Current verse for lock mode display (derived from search param)
  const lockVerseNum = verseParam ?? 1;

  const handleLockUnlockStart = useCallback(() => {
    setLockProgress(true);
    lockTimerRef.current = setTimeout(() => {
      setLockMode(false);
      setLockProgress(false);
      navigate({ search: (prev: Record<string, unknown>) => { const { lock: _, ...rest } = prev; return rest; }, replace: true });
    }, 1500);
  }, [navigate]);

  const handleLockUnlockEnd = useCallback(() => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
    setLockProgress(false);
  }, []);
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const setViewMode = usePreferencesStore((s) => s.setViewMode);
  const mushafShowTranslation = usePreferencesStore((s) => s.mushafShowTranslation);
  const setMushafShowTranslation = usePreferencesStore((s) => s.setMushafShowTranslation);
  const { t, locale } = useTranslation();

  const viewModeOptions = useMemo(() => ([
    { value: "normal" as ViewMode, label: t.quranReader.viewModes.normal, icon: VIEW_MODE_ICONS.normal },
    { value: "wordByWord" as ViewMode, label: t.quranReader.viewModes.wordByWord, icon: VIEW_MODE_ICONS.wordByWord },
    { value: "mushaf" as ViewMode, label: t.quranReader.viewModes.mushaf, icon: VIEW_MODE_ICONS.mushaf },
  ]), [t]);
  const reciterId = useAudioStore((s) => s.reciterId);
  const playSurah = useAudioStore((s) => s.playSurah);
  const playVerse = useAudioStore((s) => s.playVerse);
  const playbackState = useAudioStore((s) => s.playbackState);
  const audioChapterId = useAudioStore((s) => s.chapterId);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);

  // Auto-navigate when audio auto-continues to the next surah
  const prevAudioChapterIdRef = useRef(audioChapterId);
  useEffect(() => {
    const prev = prevAudioChapterIdRef.current;
    prevAudioChapterIdRef.current = audioChapterId;

    // Audio was playing this surah and moved to a different one (auto-continue)
    if (
      prev === chapterId &&
      audioChapterId !== null &&
      audioChapterId !== chapterId
    ) {
      navigate({ to: "/$surahId", params: { surahId: String(audioChapterId) } });
    }
  }, [audioChapterId, chapterId, navigate]);

  const { data: chapter } = useSuspenseQuery(chapterQueryOptions(chapterId));
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const { data: versesData } = useSuspenseQuery(
    versesByChapterQueryOptions(chapterId)
  );
  const focusStartPage = useBerkenarPageForVerse(`${chapterId}:1`, chapter.pages[0]);
  // Lazy-load WBW word data (translation, transliteration, positions) for tooltips + audio word sync
  const { data: wbwData } = useQuery(wbwByChapterQueryOptions(chapterId));
  const versesWithWords = useMemo(
    () => mergeWbwIntoVerses(versesData.verses, wbwData),
    [versesData.verses, wbwData],
  );
  const translatedVerses = useTranslatedVerses(versesWithWords);

  // Batch preload QCF pages for mushaf mode
  const surahPages = useMemo(
    () => Array.from({ length: chapter.pages[1] - chapter.pages[0] + 1 }, (_, i) => chapter.pages[0] + i),
    [chapter.pages],
  );
  useQcfBatchPreload(viewMode === "mushaf" ? surahPages : []);

  // Scroll to verse from ?verse= search param is handled by VerseList's scrollToVerse prop
  // Audio auto-scroll is handled inside VirtualizedVerseList (uses virtualizer.scrollToIndex)

  // Lookup topic by composite key (e.g. "inanc:3")
  const resolvedTopic = useMemo(() => {
    if (!topicParam) return null;
    const [catId, idxStr] = topicParam.split(":");
    const cat = EXPANDED_TOPIC_INDEX.find((c) => c.id === catId);
    if (!cat) return null;
    const idx = Number(idxStr);
    return cat.topics[idx] ?? null;
  }, [topicParam]);

  const visitSurah = useReadingHistory((s) => s.visitSurah);
  const touchItem = useReadingListStore((s) => s.touchItem);
  useEffect(() => {
    visitSurah(chapterId, getSurahName(chapter.id, chapter.translated_name.name, locale));
    touchItem("surah", chapterId);
  }, [chapterId, getSurahName(chapter.id, chapter.translated_name.name, locale), visitSurah, touchItem]);

  // Verse-level tracking with IntersectionObserver
  const visitVerse = useReadingHistory((s) => s.visitVerse);
  useEffect(() => {
    if (viewMode === "mushaf") return; // mushaf doesn't have individual verse elements
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const verseKey = entry.target.getAttribute("data-verse-key");
            if (verseKey) {
              const [s, v] = verseKey.split(":").map(Number);
              if (s && v) visitVerse(s, v, getSurahName(chapter.id, chapter.translated_name.name, locale));
            }
          }
        }
      },
      { threshold: 0.5 },
    );
    const verseEls = document.querySelectorAll("[data-verse-key]");
    verseEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [viewMode, chapterId, visitVerse, chapter, locale]);

  const juzNumber = getJuzForPage(chapter.pages[0]);

  // Fullscreen support for Mushaf mode
  const mushafContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Exit fullscreen when switching away from mushaf
  useEffect(() => {
    if (viewMode !== "mushaf" && document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [viewMode]);

  const toggleFullscreen = useCallback(() => {
    if (!mushafContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      mushafContainerRef.current.requestFullscreen();
    }
  }, []);

  const isPlayingThisSurah =
    audioChapterId === chapterId &&
    (playbackState === "playing" || playbackState === "loading");

  const fetchChapterAudio = useCallback(async (): Promise<ChapterAudioData> => {
    const qdcFile = await queryClient.fetchQuery(
      chapterAudioQueryOptions(reciterId, chapterId),
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
  }, [queryClient, reciterId, chapterId]);

  const handlePlaySurah = useCallback(async () => {
    if (isPlayingThisSurah) {
      togglePlayPause();
      return;
    }
    const audioData = await fetchChapterAudio();
    playSurah(chapterId, getSurahName(chapter.id, chapter.translated_name.name, locale), audioData);
  }, [
    isPlayingThisSurah,
    togglePlayPause,
    fetchChapterAudio,
    playSurah,
    chapterId,
    getSurahName(chapter.id, chapter.translated_name.name, locale),
  ]);

  const handlePlayFromVerse = useCallback(
    async (verseKey: string) => {
      const audioData = await fetchChapterAudio();
      playVerse(
        chapterId,
        getSurahName(chapter.id, chapter.translated_name.name, locale),
        verseKey,
        audioData,
      );
    },
    [fetchChapterAudio, playVerse, chapterId, getSurahName(chapter.id, chapter.translated_name.name, locale)],
  );

  const hasPrev = chapterId > 1;
  const hasNext = chapterId < TOTAL_CHAPTERS;

  const fullscreenIcon = (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 6 2 2 6 2" />
      <polyline points="18 6 18 2 14 2" />
      <polyline points="2 14 2 18 6 18" />
      <polyline points="18 14 18 18 14 18" />
    </svg>
  );

  const exitFullscreenIcon = (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 2 6 6 2 6" />
      <polyline points="14 2 14 6 18 6" />
      <polyline points="6 18 6 14 2 14" />
      <polyline points="14 18 14 14 18 14" />
    </svg>
  );

  return (
    <div className="mx-auto max-w-[720px] lg:max-w-[960px] px-4 py-5 sm:px-6 sm:py-10">
      {/* Topic navigation bar (when coming from Fihrist) */}
      {topicParam && resolvedTopic && (
        <TopicNavBar topic={resolvedTopic} topicKey={topicParam} currentSurahId={chapterId} t={t} locale={locale} />
      )}

      {/* Surah header — centered hero card */}
      <div className="relative mb-4 rounded-2xl bg-[var(--theme-pill-bg)] px-4 py-5 sm:mb-6 sm:py-6">
        <div className="flex flex-col items-center text-center">
          {/* Arabic name (large, centered) */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="group transition-transform active:scale-[0.97]"
          >
            <h1 className="arabic-text text-[2.25rem] leading-tight text-[var(--theme-text)]" dir="rtl">
              {chapter.name_arabic}
            </h1>
            <div className="mt-1 flex items-center justify-center gap-1.5">
              <span className="text-[15px] font-semibold text-[var(--theme-text)]">{getSurahName(chapter.id, chapter.translated_name.name, locale)}</span>
              <svg className="h-3 w-3 text-[var(--theme-text-tertiary)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
          </button>

          {/* Metadata */}
          <p className="mt-1.5 text-[11px] text-[var(--theme-text-tertiary)]">
            {chapter.verses_count} {t.quranReader.versesUnit} · {t.quranReader.pageAbbr}{chapter.pages[0]}–{chapter.pages[1]} · {t.common.juz} {juzNumber}
          </p>

          {/* Action buttons (centered) */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handlePlaySurah}
              className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                {isPlayingThisSurah ? (
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                ) : (
                  <path d="M8 5.14v14l11-7-11-7z" />
                )}
              </svg>
              {isPlayingThisSurah ? t.quranReader.pause : t.quranReader.listen}
            </button>

            <Link
              to="/focus/$pageNumber"
              params={{ pageNumber: String(focusStartPage) }}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[11px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
            >
              <FocusModeIcon width={14} height={14} />
              Focus
            </Link>

            <AddToReadingListButton type="surah" id={chapterId} />

            {/* View mode picker */}
            <Popover open={modeOpen} onOpenChange={setModeOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all active:scale-[0.97] ${
                    modeOpen
                      ? "bg-[var(--theme-text)] text-[var(--theme-bg)]"
                      : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-pill-bg)]"
                  }`}
                >
                  {VIEW_MODE_ICONS[viewMode]}
                  {viewModeOptions.find((o) => o.value === viewMode)?.label}
                </button>
              </PopoverTrigger>
              <PopoverContent align="center" className="w-40 overflow-hidden rounded-xl py-1">
                {viewModeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setViewMode(opt.value); setModeOpen(false); }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-[12px] font-medium transition-colors ${
                      viewMode === opt.value
                        ? "bg-primary-600/10 text-primary-600"
                        : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                    {viewMode === opt.value && (
                      <svg className="ml-auto h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    )}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            <Link
              to="/$surahId/$verseNum"
              params={{ surahId: String(chapterId), verseNum: "1" }}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[11px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M12 3v18M3 12h18" />
              </svg>
              {t.quranReader.verseByVerse}
            </Link>

            {/* Lock mode toggle */}
            <button
              onClick={() => {
                setLockMode(true);
                navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, lock: true }), replace: true });
              }}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[11px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
            >
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              {t.quranReader.lockMode}
            </button>

          </div>
        </div>

        {/* Prev / Next surah navigation (inside card) */}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--theme-border)]/30 pt-3">
          {hasPrev ? (
            <Link
              to="/$surahId"
              params={{ surahId: String(chapterId - 1) }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text)]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              {getSurahName(chapters[chapterId - 2].id, chapters[chapterId - 2].translated_name.name, locale)}
            </Link>
          ) : <span />}
          {hasNext ? (
            <Link
              to="/$surahId"
              params={{ surahId: String(chapterId + 1) }}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text)]"
            >
              {getSurahName(chapters[chapterId].id, chapters[chapterId].translated_name.name, locale)}
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
            </Link>
          ) : <span />}
        </div>
      </div>

      {/* Sticky nav: fullscreen only (mushaf mode) */}
      {viewMode === "mushaf" && (
        <div className="sticky top-0 z-20 -mx-4 mb-4 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-1 py-1 sm:-mx-6 sm:mb-6 sm:px-2">
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={t.quranReader.fullscreen}
              className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[var(--theme-hover-bg)]"
              style={{ color: "var(--theme-text-tertiary)" }}
            >
              {fullscreenIcon}
            </button>
          </div>
        </div>
      )}

      {/* Mushaf fullscreen container */}
      <div
        ref={mushafContainerRef}
        className={isFullscreen ? "h-screen overflow-y-auto bg-[var(--theme-bg)] px-5 py-8 sm:px-6" : ""}
      >
        {/* Exit fullscreen button, inside container so it's visible in fullscreen */}
        {isFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={t.quranReader.exitFullscreen}
            className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-xl transition-colors hover:bg-[var(--theme-hover-bg)]"
            style={{
              background: "color-mix(in srgb, var(--theme-hover-bg) 80%, transparent)",
              color: "var(--theme-text-tertiary)",
            }}
          >
            {exitFullscreenIcon}
          </button>
        )}

        {/* Content: QCF pages for mushaf mode, flowing text otherwise */}
        {viewMode === "mushaf" ? (
          <div className="space-y-4">
            {/* Meal toggle */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMushafShowTranslation(!mushafShowTranslation)}
                title={mushafShowTranslation ? t.toolbar.mushafHideMeal : t.toolbar.mushafShowMeal}
                className="flex h-8 items-center gap-1.5 rounded-full bg-[var(--theme-pill-bg)] px-3 text-[11px] font-medium text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {mushafShowTranslation ? (
                    <>
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  ) : (
                    <>
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" x2="22" y1="2" y2="22" />
                    </>
                  )}
                </svg>
                {mushafShowTranslation ? t.toolbar.mushafHideMeal : t.toolbar.mushafShowMeal}
              </button>
            </div>
            {Array.from(
              { length: chapter.pages[1] - chapter.pages[0] + 1 },
              (_, i) => chapter.pages[0] + i,
            ).map((pageNum) =>
              mushafShowTranslation ? (
                <div key={pageNum} className="mushaf-qcf-spread-with-meal">
                  <MushafPageImage pageNumber={pageNum} onVerseTap={handlePlayFromVerse} />
                  <QcfMealPanel verses={translatedVerses} pageNumber={pageNum} currentVerseKey={currentVerseKey ?? undefined} />
                </div>
              ) : (
                <MushafPageImage key={pageNum} pageNumber={pageNum} onVerseTap={handlePlayFromVerse} />
              )
            )}
          </div>
        ) : (
          <VerseList
            verses={translatedVerses}
            onPlayFromVerse={handlePlayFromVerse}
            onTogglePlayPause={togglePlayPause}
            scrollToVerse={verseParam}
          />
        )}
      </div>

      {/* Surah picker overlay */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent>
          <SurahPicker
            currentChapterId={chapterId}
            chapters={chapters}
            t={t}
            locale={locale}
            onSelect={(id) => {
              setPickerOpen(false);
              navigate({ to: "/$surahId", params: { surahId: String(id) } });
            }}
            onClose={() => setPickerOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Lock mode overlay */}
      {lockMode && (
        <>
          {/* Top banner with navigation controls */}
          <div className="fixed inset-x-0 top-0 z-50 bg-amber-500/95 backdrop-blur-sm">
            {/* Status row */}
            <div className="flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-medium text-white">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              {t.quranReader.lockModeActive}
              <span className="ml-1 opacity-70">— {t.quranReader.lockModeHint}</span>
            </div>
            {/* Navigation row */}
            <div className="flex items-center justify-between border-t border-white/20 px-4 py-2">
              {/* Surah picker */}
              <button
                type="button"
                onClick={() => setLockPickerOpen(true)}
                className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/30 active:scale-[0.97]"
              >
                <span className="arabic-text text-[14px]">{chapter.name_arabic}</span>
                <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6l4 4 4-4" />
                </svg>
              </button>
              {/* Verse navigation */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const prev = Math.max(1, lockVerseNum - 1);
                    navigate({ search: (s: Record<string, unknown>) => ({ ...s, verse: prev }), replace: true });
                  }}
                  disabled={lockVerseNum <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-40"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span className="min-w-[4.5rem] text-center text-[12px] font-semibold tabular-nums text-white">
                  {t.quranReader.verseLabel} {lockVerseNum} / {chapter.verses_count}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = Math.min(chapter.verses_count, lockVerseNum + 1);
                    navigate({ search: (s: Record<string, unknown>) => ({ ...s, verse: next }), replace: true });
                  }}
                  disabled={lockVerseNum >= chapter.verses_count}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-40"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Touch shield — blocks scroll and navigation but allows word taps through */}
          <div
            className="fixed inset-0 z-40"
            style={{ touchAction: "none" }}
            onTouchMove={(e) => e.preventDefault()}
            onWheel={(e) => e.preventDefault()}
          />

          {/* Floating unlock button — requires long press */}
          <button
            type="button"
            onPointerDown={handleLockUnlockStart}
            onPointerUp={handleLockUnlockEnd}
            onPointerLeave={handleLockUnlockEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={`fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-[var(--shadow-modal)] transition-all lg:bottom-8 lg:right-8 ${
              lockProgress
                ? "scale-110 bg-green-500 text-white"
                : "bg-amber-500 text-white active:scale-95"
            }`}
            aria-label={t.quranReader.lockModeUnlock}
          >
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {lockProgress ? (
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 019.9-1" />
                </>
              ) : (
                <>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </>
              )}
            </svg>
            {lockProgress && (
              <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 56 56">
                <circle
                  cx="28" cy="28" r="25"
                  fill="none" stroke="white" strokeWidth="3"
                  strokeDasharray="157" strokeDashoffset="157"
                  style={{ animation: "lock-progress 1.5s linear forwards" }}
                />
              </svg>
            )}
          </button>

          {/* Surah picker dialog in lock mode */}
          <Dialog open={lockPickerOpen} onOpenChange={setLockPickerOpen}>
            <DialogContent>
              <SurahPicker
                currentChapterId={chapterId}
                chapters={chapters}
                t={t}
                locale={locale}
                onSelect={(id) => {
                  setLockPickerOpen(false);
                  navigate({ to: "/$surahId", params: { surahId: String(id) }, search: { lock: true, verse: 1 } });
                }}
                onClose={() => setLockPickerOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}

// -- Surah Picker Overlay --

function SurahPicker({
  currentChapterId,
  chapters,
  onSelect,
  onClose,
  t,
  locale,
}: {
  currentChapterId: number;
  chapters: Chapter[];
  onSelect: (chapterId: number) => void;
  onClose: () => void;
  t: ReturnType<typeof useTranslation>["t"];
  locale: "tr" | "en";
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return chapters;
    return chapters.filter(
      (ch) =>
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        getSurahName(ch.id, ch.translated_name.name, locale).toLowerCase().includes(q) ||
        String(ch.id).startsWith(q),
    );
  }, [chapters, search]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll to current surah on mount (only when not searching)
  useEffect(() => {
    if (!search) {
      requestAnimationFrame(() => {
        currentRef.current?.scrollIntoView({ block: "center" });
      });
    }
  }, [search]);

  return (
    <div className="mx-auto flex w-[92%] max-w-[520px] animate-scale-in flex-col overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-modal)]">
      <DialogTitle className="sr-only">{t.surahPicker.placeholder}</DialogTitle>
      {/* Search header */}
      <div className="flex items-center gap-3 border-b border-[var(--theme-border)] px-4 py-3">
        <svg className="h-4 w-4 shrink-0 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.surahPicker.placeholder}
          className="flex-1 bg-transparent text-[15px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none"
        />
        <button
          onClick={onClose}
          className="text-[13px] font-medium text-primary-600"
        >
          {t.common.close}
        </button>
      </div>

      {/* Surah list */}
      <div className="max-h-[60vh] overflow-y-auto">
        {filtered.map((ch) => {
          const isCurrent = ch.id === currentChapterId;
          return (
            <button
              key={ch.id}
              ref={isCurrent ? currentRef : undefined}
              type="button"
              onClick={() => onSelect(ch.id)}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                isCurrent
                  ? "bg-primary-600/10"
                  : "hover:bg-[var(--theme-hover-bg)]"
              }`}
            >
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums ${
                isCurrent
                  ? "bg-primary-600 text-white"
                  : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)]"
              }`}>
                {ch.id}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[var(--theme-text)]">
                    {getSurahName(ch.id, ch.translated_name.name, locale)}
                  </span>
                  <span className="text-[11px] text-[var(--theme-text-quaternary)]">
                    {ch.name_simple}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-text-tertiary)]">
                  <span>{ch.verses_count} {t.quranReader.versesUnit}</span>
                  <span>·</span>
                  <span>{t.common.page} {ch.pages[0]}–{ch.pages[1]}</span>
                </div>
              </div>
              <span className="arabic-text shrink-0 text-base text-[var(--theme-text-secondary)]" dir="rtl">
                {ch.name_arabic}
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="px-4 py-6 text-center text-[13px] text-[var(--theme-text-tertiary)]">
            {t.common.noResults}
          </p>
        )}
      </div>
    </div>
  );
}

// -- Topic Navigation Bar (when coming from Fihrist) --

function TopicNavBar({ topic, topicKey, currentSurahId, t, locale }: { topic: TopicEntry; topicKey: string; currentSurahId: number; t: ReturnType<typeof useTranslation>["t"]; locale: "tr" | "en" }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to active ref
  useEffect(() => {
    const el = scrollRef.current?.querySelector("[data-active]");
    if (el) el.scrollIntoView({ inline: "center", block: "nearest" });
  }, [currentSurahId]);

  const topicName = locale === "en" ? topic.topicEn : locale === "es" ? topic.topicEs : topic.topic;

  return (
    <div className="mb-6 rounded-2xl bg-[var(--theme-bg-primary)] p-3">
      {/* Header row */}
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-[18px] leading-none">{topic.icon}</span>
        <span className="flex-1 text-[13px] font-semibold text-[var(--theme-text)]">{topicName}</span>
        <Link
          to="/browse/$tab"
          params={{ tab: "index" }}
          search={{ topic: topicKey }}
          className="text-[11px] font-medium text-primary-600 hover:text-primary-700"
        >
          {t.quranReader.backToIndex}
        </Link>
      </div>
      {/* Scrollable refs */}
      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {topic.refs.map((ref) => {
          const [surah, verseRange] = ref.split(":");
          const surahId = Number(surah);
          const firstVerse = verseRange?.split("-")[0];
          const isActive = surahId === currentSurahId;
          return (
            <Link
              key={ref}
              to="/$surahId"
              params={{ surahId: surah }}
              search={{ topic: topicKey, verse: firstVerse ? Number(firstVerse) : undefined }}
              {...(isActive ? { "data-active": true } : {})}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-medium tabular-nums transition-colors ${
                isActive
                  ? "bg-primary-600 text-white"
                  : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] hover:bg-primary-600/10 hover:text-primary-700"
              }`}
            >
              {ref}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
