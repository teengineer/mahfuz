import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery, useQueries } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { wbwByChapterQueryOptions } from "~/hooks/useWbwData";
import { mergeWbwIntoVerses } from "~/lib/quran-data";
import { Bismillah, VerseList, ReadingToolbar, MushafPageImage, QcfMealPanel } from "~/components/quran";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import type { ViewMode } from "~/stores/usePreferencesStore";
import { useReaderAudio } from "~/hooks/useReaderAudio";
import { usePageTracking } from "~/hooks/usePageTracking";
import { useSwipeNavigation } from "~/hooks/useSwipeNavigation";
import { useReadingHistory } from "~/stores/useReadingHistory";
import { useReadingListStore } from "~/stores/useReadingListStore";
import { useReadingStats } from "~/stores/useReadingStats";
import { useTranslatedVerses } from "~/hooks/useTranslatedVerses";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";
import { AddToReadingListButton } from "~/components/browse/AddToReadingListButton";
import { FocusModeIcon } from "~/components/focus/FocusIcons";
import {
  usePageLayout,
  getActiveLayout,
  getTotalPages,
  getJuzForPageByLayout,
  getAllJuzRangesByLayout,
  getPagesForJuzByLayout,
} from "~/lib/page-layout";
import { getJuzForPage } from "@mahfuz/shared";
import { TOTAL_CHAPTERS, TOTAL_JUZ } from "@mahfuz/shared/constants";
import type { Chapter, Verse } from "@mahfuz/shared/types";
import type { ChapterAudioData } from "@mahfuz/audio-engine";
import type { Locale } from "~/stores/useI18nStore";
import { useBerkenarPageForVerse } from "~/hooks/useBerkenarPage";
import { useQcfBatchPreload } from "~/hooks/useQcfPage";

// ---- View Mode Icons (shared) ----

const VIEW_MODE_ICONS: Record<string, React.ReactNode> = {
  metin: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 4h10M3 8h7M3 12h10" />
    </svg>
  ),
  mushaf: (
    <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 2.5h4.5a1.5 1.5 0 0 1 1.5 1.5v10S6.5 13 4.25 13 2 14 2 14V2.5z" />
      <path d="M14 2.5H9.5A1.5 1.5 0 0 0 8 4v10s1.5-1 3.75-1S14 14 14 14V2.5z" />
    </svg>
  ),
};

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

// ---- Types ----

export type ReaderSource = "surah" | "page" | "juz";

interface UnifiedReaderProps {
  source: ReaderSource;
  /** Verses to display (already fetched by the route) */
  verses: Verse[];
  /** All chapters list (for navigation, pickers) */
  chapters: Chapter[];
  /** Current chapter (for surah source) */
  chapter?: Chapter;
  /** For surah: chapterId. For page: pageNumber. For juz: juzNumber */
  currentId: number;
  /** Total count (for navigation bounds) */
  totalCount: number;
  /** Optional scroll-to verse number */
  scrollToVerse?: number;
  /** Focus mode page for entry button */
  focusPageNumber?: number;
  /** Extra header content (e.g. TopicNavBar for surah) */
  headerExtra?: React.ReactNode;
  /** Extra overlay content (e.g. LockMode for surah) */
  overlay?: React.ReactNode;
  /** Picker component to render in dialog */
  picker?: (props: { onClose: () => void }) => React.ReactNode;
  /** Custom reading list type */
  readingListType?: "surah" | "page" | "juz";
}

export function UnifiedReader({
  source,
  verses,
  chapters,
  chapter,
  currentId,
  totalCount,
  scrollToVerse,
  focusPageNumber,
  headerExtra,
  overlay,
  picker,
  readingListType,
}: UnifiedReaderProps) {
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const layout = usePageLayout();
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const setViewMode = usePreferencesStore((s) => s.setViewMode);
  const showWordByWord = usePreferencesStore((s) => s.showWordByWord);
  const mushafShowTranslation = usePreferencesStore((s) => s.mushafShowTranslation);
  const setMushafShowTranslation = usePreferencesStore((s) => s.setMushafShowTranslation);

  const [pickerOpen, setPickerOpen] = useState(false);

  // View mode options
  const viewModeOptions = useMemo(() => ([
    { value: "metin" as ViewMode, label: t.quranReader.viewModes.metin, icon: VIEW_MODE_ICONS.metin },
    { value: "mushaf" as ViewMode, label: t.quranReader.viewModes.mushaf, icon: VIEW_MODE_ICONS.mushaf },
  ]), [t]);

  // WBW data loading for word-by-word mode
  const surahIdsOnVerses = useMemo(() => {
    const ids = new Set<number>();
    for (const v of verses) {
      ids.add(Number(v.verse_key.split(":")[0]));
    }
    return Array.from(ids);
  }, [verses]);

  const isWbw = viewMode === "metin" && showWordByWord;
  const wbwQueries = useQueries({
    queries: surahIdsOnVerses.map((chId) => ({
      ...wbwByChapterQueryOptions(chId),
      enabled: isWbw,
    })),
  });

  const versesWithWords = useMemo(() => {
    if (!isWbw) return verses;
    let merged = verses;
    for (const q of wbwQueries) {
      if (q.data) merged = mergeWbwIntoVerses(merged, q.data);
    }
    return merged;
  }, [isWbw, verses, wbwQueries]);

  const translatedVerses = useTranslatedVerses(versesWithWords);

  // Page tracking for khatam progress
  usePageTracking(translatedVerses, viewMode !== "mushaf");

  // Audio
  const audio = useReaderAudio();

  // Resolve surah name for a verseKey
  const getSurahNameForVerse = useCallback(
    (verseKey: string) => {
      const chId = Number(verseKey.split(":")[0]);
      const ch = chapters.find((c) => c.id === chId);
      return ch ? getSurahName(ch.id, ch.translated_name.name, locale) : `Sure ${chId}`;
    },
    [chapters, locale],
  );

  const handlePlayFromVerse = useCallback(
    async (verseKey: string) => {
      const name = getSurahNameForVerse(verseKey);
      await audio.handlePlayFromVerse(verseKey, name);
    },
    [audio, getSurahNameForVerse],
  );

  // Play action (play first verse of current content)
  const firstVerse = translatedVerses[0];
  const firstChapterId = firstVerse ? Number(firstVerse.verse_key.split(":")[0]) : null;
  const isPlayingThis =
    firstChapterId !== null &&
    audio.audioChapterId === firstChapterId &&
    (audio.playbackState === "playing" || audio.playbackState === "loading");

  const handlePlayAll = useCallback(async () => {
    if (isPlayingThis) {
      audio.togglePlayPause();
      return;
    }
    if (!firstVerse || !firstChapterId) return;
    const audioData = await audio.buildChapterAudio(firstChapterId);
    const name = getSurahNameForVerse(firstVerse.verse_key);
    if (source === "surah") {
      audio.playSurah(firstChapterId, name, audioData);
    } else {
      audio.playVerse(firstChapterId, name, firstVerse.verse_key, audioData);
    }
  }, [isPlayingThis, audio, firstVerse, firstChapterId, getSurahNameForVerse, source]);

  // Mushaf pages
  const mushafPages = useMemo(() => {
    if (source === "surah" && chapter) {
      return Array.from(
        { length: chapter.pages[1] - chapter.pages[0] + 1 },
        (_, i) => chapter.pages[0] + i,
      );
    }
    if (source === "page") return [currentId];
    if (source === "juz") {
      const [start, end] = getPagesForJuzByLayout(currentId, layout);
      return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }
    return [];
  }, [source, chapter, currentId, layout]);

  // QCF preload for mushaf mode
  useQcfBatchPreload(viewMode === "mushaf" ? mushafPages : []);

  // Mark mushaf pages read (no verse elements in DOM for IntersectionObserver)
  const markPageRead = useReadingStats((s) => s.markPageRead);
  useEffect(() => {
    if (viewMode === "mushaf") {
      for (const p of mushafPages) markPageRead(p);
    }
  }, [viewMode, mushafPages, markPageRead]);

  // Fullscreen support for mushaf
  const mushafContainerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (viewMode !== "mushaf" && document.fullscreenElement) {
      document.exitFullscreen();
    }
  }, [viewMode]);

  const toggleFullscreen = useCallback(() => {
    if (!mushafContainerRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else mushafContainerRef.current.requestFullscreen();
  }, []);

  // Navigation
  const hasPrev = currentId > 1;
  const hasNext = currentId < totalCount;

  const navRoute = source === "surah" ? "/$surahId" : source === "page" ? "/page/$pageNumber" : "/juz/$juzId";
  const navParamKey = source === "surah" ? "surahId" : source === "page" ? "pageNumber" : "juzId";

  const goNext = useCallback(() => {
    if (hasNext) navigate({ to: navRoute as any, params: { [navParamKey]: String(currentId + 1) } as any });
  }, [hasNext, navigate, navRoute, navParamKey, currentId]);

  const goPrev = useCallback(() => {
    if (hasPrev) navigate({ to: navRoute as any, params: { [navParamKey]: String(currentId - 1) } as any });
  }, [hasPrev, navigate, navRoute, navParamKey, currentId]);

  // Keyboard navigation
  useEffect(() => {
    if (source === "surah") return; // surah uses its own
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "ArrowRight") goNext();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [source, goPrev, goNext]);

  // Swipe navigation
  const swipeContainerRef = useRef<HTMLDivElement>(null);
  const swipeEnabled = viewMode !== "mushaf" && source !== "surah";
  useSwipeNavigation(swipeContainerRef, {
    onSwipeLeft: swipeEnabled ? goPrev : () => {},
    onSwipeRight: swipeEnabled ? goNext : () => {},
  });

  // Auto-navigate when audio continues to next surah (surah mode only)
  const prevAudioChapterIdRef = useRef(audio.audioChapterId);
  useEffect(() => {
    if (source !== "surah") return;
    const prev = prevAudioChapterIdRef.current;
    prevAudioChapterIdRef.current = audio.audioChapterId;
    if (
      prev === currentId &&
      audio.audioChapterId !== null &&
      audio.audioChapterId !== currentId
    ) {
      navigate({ to: "/$surahId" as any, params: { surahId: String(audio.audioChapterId) } as any });
    }
  }, [audio.audioChapterId, currentId, navigate, source]);

  // Group verses by chapter for page/juz views
  const verseGroups = useMemo(() => {
    if (source === "surah") return null; // surah shows a single VerseList
    const groups: { chapterId: number; chapter: Chapter | undefined; verses: Verse[] }[] = [];
    let currentChapterId = -1;
    for (const verse of translatedVerses) {
      const chId = Number(verse.verse_key.split(":")[0]);
      if (chId !== currentChapterId) {
        currentChapterId = chId;
        groups.push({
          chapterId: chId,
          chapter: chapters.find((ch) => ch.id === chId),
          verses: [],
        });
      }
      groups[groups.length - 1].verses.push(verse);
    }
    return groups;
  }, [source, translatedVerses, chapters]);

  // Reading history tracking
  const visitSurah = useReadingHistory((s) => s.visitSurah);
  const visitPage = useReadingHistory((s) => s.visitPage);
  const visitJuz = useReadingHistory((s) => s.visitJuz);
  const touchItem = useReadingListStore((s) => s.touchItem);

  useEffect(() => {
    if (source === "surah" && chapter) {
      visitSurah(currentId, getSurahName(chapter.id, chapter.translated_name.name, locale));
      touchItem("surah", currentId);
    } else if (source === "page") {
      visitPage(currentId);
      touchItem("page", currentId);
    } else if (source === "juz") {
      visitJuz(currentId);
      touchItem("juz", currentId);
    }
  }, [source, currentId, chapter, locale, visitSurah, visitPage, visitJuz, touchItem]);

  // Verse-level IntersectionObserver tracking for reading history (surah only)
  const visitVerse = useReadingHistory((s) => s.visitVerse);
  useEffect(() => {
    if (source !== "surah" || viewMode === "mushaf") return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const verseKey = entry.target.getAttribute("data-verse-key");
            if (verseKey && chapter) {
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
  }, [source, viewMode, currentId, visitVerse, chapter, locale]);

  // Auto-scroll to playing verse — handled by VerseList virtualizer, no duplicate here

  // Header info
  const headerTitle = useMemo(() => {
    if (source === "surah" && chapter) return chapter.name_arabic;
    if (source === "page") return `${t.common.page} ${currentId}`;
    return `${t.common.juz} ${currentId}`;
  }, [source, chapter, currentId, t]);

  const headerSubtitle = useMemo(() => {
    if (source === "surah" && chapter) {
      const juzNumber = getJuzForPage(chapter.pages[0]);
      return `${chapter.verses_count} ${t.quranReader.versesUnit} · ${t.quranReader.pageAbbr}${chapter.pages[0]}–${chapter.pages[1]} · ${t.common.juz} ${juzNumber}`;
    }
    if (source === "page" && verseGroups) {
      const first = verseGroups[0]?.chapter;
      const last = verseGroups[verseGroups.length - 1]?.chapter;
      const juzNumber = getJuzForPageByLayout(currentId, layout);
      let surahs = first ? getSurahName(first.id, first.translated_name.name, locale) : "";
      if (last && last.id !== first?.id) surahs += `–${getSurahName(last.id, last.translated_name.name, locale)}`;
      return `${surahs} · ${translatedVerses.length} ${t.quranReader.versesUnit} · ${t.common.juz} ${juzNumber}`;
    }
    if (source === "juz") {
      const [pageStart, pageEnd] = getPagesForJuzByLayout(currentId, layout);
      const surahIds = [...new Set(translatedVerses.map((v) => Number(v.verse_key.split(":")[0])))];
      const first = chapters.find((c) => c.id === surahIds[0]);
      const last = chapters.find((c) => c.id === surahIds[surahIds.length - 1]);
      let surahs = first ? getSurahName(first.id, first.translated_name.name, locale) : "";
      if (last && last.id !== first?.id) surahs += `–${getSurahName(last.id, last.translated_name.name, locale)}`;
      return `${surahs} · ${translatedVerses.length} ${t.quranReader.versesUnit} · ${t.quranReader.pageAbbr}${pageStart}–${pageEnd}`;
    }
    return "";
  }, [source, chapter, currentId, verseGroups, translatedVerses, chapters, layout, locale, t]);

  const surahDisplayName = chapter ? getSurahName(chapter.id, chapter.translated_name.name, locale) : "";
  const focusPage = focusPageNumber ?? (source === "page" ? currentId : undefined);

  // Navigation labels
  const prevLabel = source === "surah"
    ? (hasPrev ? getSurahName(chapters[currentId - 2]?.id ?? 0, chapters[currentId - 2]?.translated_name.name ?? "", locale) : "")
    : source === "page" ? t.quranReader.prevPage
    : t.quranReader.prevJuz;
  const nextLabel = source === "surah"
    ? (hasNext ? getSurahName(chapters[currentId]?.id ?? 0, chapters[currentId]?.translated_name.name ?? "", locale) : "")
    : source === "page" ? t.quranReader.nextPage
    : t.quranReader.nextJuz;

  // ---- Render ----

  return (
    <div
      ref={swipeContainerRef}
      className="mx-auto max-w-[720px] lg:max-w-[960px] px-4 py-5 sm:px-6 sm:py-10"
      style={source !== "surah" ? { touchAction: "pan-y" } : undefined}
    >
      {headerExtra}

      {/* Header card */}
      {source === "surah" && chapter ? (
        <SurahHeader
          chapter={chapter}
          surahDisplayName={surahDisplayName}
          headerSubtitle={headerSubtitle}
          isPlayingThis={isPlayingThis}
          onPlay={handlePlayAll}
          onPickerOpen={() => setPickerOpen(true)}
          focusPage={focusPage}
          viewMode={viewMode}
          viewModeOptions={viewModeOptions}
          setViewMode={setViewMode}
          currentId={currentId}
          hasPrev={hasPrev}
          hasNext={hasNext}
          chapters={chapters}
          t={t}
          locale={locale}
        />
      ) : (
        <CompactHeader
          title={headerTitle}
          subtitle={headerSubtitle}
          isPlayingThis={isPlayingThis}
          onPlay={handlePlayAll}
          onPickerOpen={() => setPickerOpen(true)}
          focusPage={focusPage}
          source={source}
          currentId={currentId}
          readingListType={readingListType ?? source}
          t={t}
        />
      )}

      {/* Sticky toolbar (page/juz) */}
      {source !== "surah" && (
        <div className="sticky top-0 z-20 -mx-4 mb-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-1 py-2 sm:-mx-6 sm:px-2">
          <div className="flex items-center justify-between">
            {hasPrev ? (
              <Link
                to={navRoute as any}
                params={{ [navParamKey]: String(currentId - 1) } as any}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </Link>
            ) : <span className="w-8 shrink-0" />}

            <div className="flex min-w-0 flex-1 items-center justify-center">
              <div className="flex items-center rounded-xl bg-[var(--theme-pill-bg)] p-1">
                <SegmentedControl options={viewModeOptions} value={viewMode} onChange={setViewMode} iconOnlyMobile transparent />
                <div className="mx-0.5 h-4 w-px bg-[var(--theme-border)]" />
                <ReadingToolbar segmentStyle />
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5">
              {viewMode === "mushaf" && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={t.quranReader.fullscreen}
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-[var(--theme-hover-bg)]"
                  style={{ color: "var(--theme-text-tertiary)" }}
                >
                  {fullscreenIcon}
                </button>
              )}
              {hasNext ? (
                <Link
                  to={navRoute as any}
                  params={{ [navParamKey]: String(currentId + 1) } as any}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
              ) : <span className="w-8 shrink-0" />}
            </div>
          </div>
        </div>
      )}

      {/* Mushaf-only sticky fullscreen bar (surah view) */}
      {source === "surah" && viewMode === "mushaf" && (
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

      {/* Content area */}
      <div
        ref={mushafContainerRef}
        className={isFullscreen ? "h-screen overflow-y-auto bg-[var(--theme-bg)] px-5 py-8 sm:px-6" : ""}
      >
        {isFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={t.quranReader.exitFullscreen}
            className="fixed top-4 right-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl backdrop-blur-xl transition-colors hover:bg-[var(--theme-hover-bg)]"
            style={{ background: "color-mix(in srgb, var(--theme-hover-bg) 80%, transparent)", color: "var(--theme-text-tertiary)" }}
          >
            {exitFullscreenIcon}
          </button>
        )}

        {viewMode === "mushaf" ? (
          <MushafContent
            pages={mushafPages}
            verses={translatedVerses}
            currentVerseKey={audio.currentVerseKey ?? undefined}
            mushafShowTranslation={mushafShowTranslation}
            setMushafShowTranslation={setMushafShowTranslation}
            onVerseTap={handlePlayFromVerse}
            layout={layout}
            totalPages={getTotalPages(layout)}
            source={source}
            t={t}
          />
        ) : source === "surah" ? (
          <VerseList
            verses={translatedVerses}
            onPlayFromVerse={handlePlayFromVerse}
            onTogglePlayPause={audio.togglePlayPause}
            scrollToVerse={scrollToVerse}
          />
        ) : (
          <GroupedVerseContent
            verseGroups={verseGroups!}
            chapters={chapters}
            onPlayFromVerse={handlePlayFromVerse}
            locale={locale}
          />
        )}
      </div>

      {/* Bottom navigation */}
      <div className="mt-10 flex items-center justify-between border-t border-[var(--theme-divider)]/40 pt-6">
        {hasPrev ? (
          <Link
            to={navRoute as any}
            params={{ [navParamKey]: String(currentId - 1) } as any}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text)] sm:text-[15px] sm:text-primary-600 sm:hover:text-primary-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            {prevLabel}
          </Link>
        ) : <span />}
        {source !== "surah" && (
          <span className="text-[12px] text-[var(--theme-text-quaternary)]">
            {currentId} / {totalCount}
          </span>
        )}
        {hasNext ? (
          <Link
            to={navRoute as any}
            params={{ [navParamKey]: String(currentId + 1) } as any}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text)] sm:text-[15px] sm:text-primary-600 sm:hover:text-primary-700"
          >
            {nextLabel}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        ) : <span />}
      </div>

      {/* Picker overlay */}
      {pickerOpen && picker && picker({ onClose: () => setPickerOpen(false) })}

      {/* Extra overlay (e.g. lock mode) */}
      {overlay}
    </div>
  );
}

// ---- Sub-components ----

function SurahHeader({
  chapter,
  surahDisplayName,
  headerSubtitle,
  isPlayingThis,
  onPlay,
  onPickerOpen,
  focusPage,
  viewMode,
  viewModeOptions,
  setViewMode,
  currentId,
  hasPrev,
  hasNext,
  chapters,
  t,
  locale,
}: {
  chapter: Chapter;
  surahDisplayName: string;
  headerSubtitle: string;
  isPlayingThis: boolean;
  onPlay: () => void;
  onPickerOpen: () => void;
  focusPage?: number;
  viewMode: ViewMode;
  viewModeOptions: { value: ViewMode; label: string; icon: React.ReactNode }[];
  setViewMode: (mode: ViewMode) => void;
  currentId: number;
  hasPrev: boolean;
  hasNext: boolean;
  chapters: Chapter[];
  t: any;
  locale: Locale;
}) {
  const [modeOpen, setModeOpen] = useState(false);

  return (
    <div className="relative mb-4 rounded-2xl bg-[var(--theme-pill-bg)] px-4 py-5 sm:mb-6 sm:py-6">
      <div className="flex flex-col items-center text-center">
        <button
          type="button"
          onClick={onPickerOpen}
          className="group transition-transform active:scale-[0.97]"
        >
          <h1 className="arabic-text text-[2.25rem] leading-tight text-[var(--theme-text)]" dir="rtl">
            {chapter.name_arabic}
          </h1>
          <div className="mt-1 flex items-center justify-center gap-1.5">
            <span className="text-[15px] font-semibold text-[var(--theme-text)]">{surahDisplayName}</span>
            <svg className="h-3 w-3 text-[var(--theme-text-tertiary)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 6l4 4 4-4" />
            </svg>
          </div>
        </button>

        <p className="mt-1.5 text-[11px] text-[var(--theme-text-tertiary)]">{headerSubtitle}</p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={onPlay}
            className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              {isPlayingThis ? <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /> : <path d="M8 5.14v14l11-7-11-7z" />}
            </svg>
            {isPlayingThis ? t.quranReader.pause : t.quranReader.listen}
          </button>

          {focusPage && (
            <Link
              to="/focus/$pageNumber"
              params={{ pageNumber: String(focusPage) }}
              search={{ from: "surah", fromId: currentId }}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[11px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
            >
              <FocusModeIcon width={14} height={14} />
              Focus
            </Link>
          )}

          <AddToReadingListButton type="surah" id={currentId} />

          {/* View mode toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setModeOpen(!modeOpen)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium transition-all active:scale-[0.97] ${
                modeOpen
                  ? "bg-[var(--theme-text)] text-[var(--theme-bg)]"
                  : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-pill-bg)]"
              }`}
            >
              {VIEW_MODE_ICONS[viewMode]}
              {viewModeOptions.find((o) => o.value === viewMode)?.label}
            </button>
            {modeOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setModeOpen(false)} />
                <div className="absolute top-full left-1/2 z-50 mt-1 w-40 -translate-x-1/2 overflow-hidden rounded-xl bg-[var(--theme-bg-primary)] py-1 shadow-[var(--shadow-modal)]">
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
                </div>
              </>
            )}
          </div>

          <Link
            to="/$surahId/$verseNum"
            params={{ surahId: String(currentId), verseNum: "1" }}
            className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-hover-bg)] px-3 py-1.5 text-[11px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M12 3v18M3 12h18" />
            </svg>
            {t.quranReader.verseByVerse}
          </Link>
        </div>
      </div>

      {/* Prev/Next surah nav */}
      <div className="mt-4 flex items-center justify-between border-t border-[var(--theme-border)]/30 pt-3">
        {hasPrev ? (
          <Link
            to="/$surahId"
            params={{ surahId: String(currentId - 1) } as any}
            search={{} as any}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text)]"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            {getSurahName(chapters[currentId - 2].id, chapters[currentId - 2].translated_name.name, locale)}
          </Link>
        ) : <span />}
        {hasNext ? (
          <Link
            to="/$surahId"
            params={{ surahId: String(currentId + 1) } as any}
            search={{} as any}
            className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:text-[var(--theme-text)]"
          >
            {getSurahName(chapters[currentId].id, chapters[currentId].translated_name.name, locale)}
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </Link>
        ) : <span />}
      </div>
    </div>
  );
}

function CompactHeader({
  title,
  subtitle,
  isPlayingThis,
  onPlay,
  onPickerOpen,
  focusPage,
  source,
  currentId,
  readingListType,
  t,
}: {
  title: string;
  subtitle: string;
  isPlayingThis: boolean;
  onPlay: () => void;
  onPickerOpen: () => void;
  focusPage?: number;
  source: ReaderSource;
  currentId: number;
  readingListType: "surah" | "page" | "juz";
  t: any;
}) {
  return (
    <div className="relative mb-6 overflow-hidden rounded-2xl bg-[var(--theme-pill-bg)] px-4 py-3.5">
      <div className="relative z-10 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onPickerOpen}
          className="group min-w-0 text-left transition-transform active:scale-[0.97]"
        >
          <div className="flex items-center gap-2">
            <span className="text-[1.75rem] font-semibold tabular-nums leading-none text-[var(--theme-text)]">{currentId}</span>
            <div className="flex items-center gap-1">
              <span className="text-[15px] font-semibold text-[var(--theme-text)]">{title}</span>
              <svg className="h-3 w-3 text-[var(--theme-text-tertiary)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6l4 4 4-4" />
              </svg>
            </div>
          </div>
          <p className="mt-0.5 text-[11px] text-[var(--theme-text-tertiary)]">{subtitle}</p>
        </button>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={onPlay}
            className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
          >
            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
              {isPlayingThis ? <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /> : <path d="M8 5.14v14l11-7-11-7z" />}
            </svg>
            {isPlayingThis ? t.quranReader.pause : t.quranReader.listen}
          </button>
          {focusPage && (
            <Link
              to="/focus/$pageNumber"
              params={{ pageNumber: String(focusPage) }}
              search={{ from: source, fromId: currentId }}
              className="inline-flex items-center gap-1 rounded-full bg-[var(--theme-pill-bg)] px-3 py-1.5 text-[11px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-hover-bg)] active:scale-[0.97]"
            >
              <FocusModeIcon width={14} height={14} />
              Focus
            </Link>
          )}
          <AddToReadingListButton type={readingListType} id={currentId} />
        </div>
      </div>
    </div>
  );
}

function MushafContent({
  pages,
  verses,
  currentVerseKey,
  mushafShowTranslation,
  setMushafShowTranslation,
  onVerseTap,
  layout,
  totalPages,
  source,
  t,
}: {
  pages: number[];
  verses: Verse[];
  currentVerseKey?: string;
  mushafShowTranslation: boolean;
  setMushafShowTranslation: (v: boolean) => void;
  onVerseTap: (verseKey: string) => void;
  layout: any;
  totalPages: number;
  source: ReaderSource;
  t: any;
}) {
  if (layout === "berkenar") {
    return (
      <div className="mb-4 rounded-xl bg-amber-500/10 px-4 py-2.5 text-[12px] text-amber-700">
        {t.settings?.berkenarNoMushaf ?? "Berkenar düzeninde matbu mushaf görünümü desteklenmiyor. Akan metin gösteriliyor."}
      </div>
    );
  }

  return (
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

      {pages.map((pageNum) =>
        mushafShowTranslation ? (
          <div key={pageNum} className="mushaf-qcf-spread-with-meal">
            <MushafPageImage pageNumber={pageNum} onVerseTap={onVerseTap} />
            <QcfMealPanel verses={verses} pageNumber={pageNum} currentVerseKey={currentVerseKey} />
          </div>
        ) : source === "page" && pages.length === 1 ? (
          // Single page — show two-page spread
          pageNum > 2 && pageNum % 2 === 1 ? (
            <div key={pageNum} className="mushaf-qcf-spread">
              <MushafPageImage pageNumber={pageNum - 1} onVerseTap={onVerseTap} />
              <MushafPageImage pageNumber={pageNum} onVerseTap={onVerseTap} />
            </div>
          ) : pageNum > 2 && pageNum % 2 === 0 ? (
            <div key={pageNum} className="mushaf-qcf-spread">
              <MushafPageImage pageNumber={pageNum} onVerseTap={onVerseTap} />
              <MushafPageImage pageNumber={pageNum + 1 <= totalPages ? pageNum + 1 : pageNum} onVerseTap={onVerseTap} />
            </div>
          ) : (
            <MushafPageImage key={pageNum} pageNumber={pageNum} onVerseTap={onVerseTap} />
          )
        ) : (
          <MushafPageImage key={pageNum} pageNumber={pageNum} onVerseTap={onVerseTap} />
        ),
      )}
    </div>
  );
}

function GroupedVerseContent({
  verseGroups,
  chapters,
  onPlayFromVerse,
  locale,
}: {
  verseGroups: { chapterId: number; chapter: Chapter | undefined; verses: Verse[] }[];
  chapters: Chapter[];
  onPlayFromVerse: (verseKey: string) => void;
  locale: Locale;
}) {
  return (
    <>
      {verseGroups.map((group, groupIndex) => {
        const isNewSurah = group.verses[0]?.verse_number === 1;
        return (
          <div key={group.chapterId}>
            {(groupIndex > 0 || isNewSurah) && group.chapter && (
              <div className={`mb-6 text-center ${groupIndex > 0 ? "mt-14" : "mt-0"}`}>
                <Link
                  to="/$surahId"
                  params={{ surahId: String(group.chapterId) } as any}
                  search={{} as any}
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--theme-pill-bg)] px-4 py-2 transition-colors hover:shadow-[var(--shadow-elevated)]"
                >
                  <span className="arabic-text text-lg leading-none text-[var(--theme-text)]">
                    {group.chapter.name_arabic}
                  </span>
                  <span className="text-[13px] font-medium text-[var(--theme-text-secondary)]">
                    {getSurahName(group.chapter.id, group.chapter.translated_name.name, locale)}
                  </span>
                </Link>
              </div>
            )}

            {isNewSurah && group.chapter?.bismillah_pre && <Bismillah />}

            <VerseList
              verses={group.verses}
              onPlayFromVerse={onPlayFromVerse}
            />
          </div>
        );
      })}
    </>
  );
}
