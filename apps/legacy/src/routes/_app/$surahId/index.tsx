import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/Dialog";
import { chapterQueryOptions, chaptersQueryOptions } from "~/hooks/useChapters";
import { EmojiIcon } from "~/components/icons/EmojiIcon";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import { wbwByChapterQueryOptions } from "~/hooks/useWbwData";
import { mergeWbwIntoVerses } from "~/lib/quran-data";
import { Loading } from "~/components/ui/Loading";
import { Skeleton } from "~/components/ui/Skeleton";
import { TOTAL_CHAPTERS } from "@mahfuz/shared/constants";
import { useBerkenarPageForVerse } from "~/hooks/useBerkenarPage";
import type { Chapter } from "@mahfuz/shared/types";
import { useReadingListStore } from "~/stores/useReadingListStore";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";
import { useI18nStore } from "~/stores/useI18nStore";
import type { TopicEntry } from "~/data/topic-index-expanded";
import { EXPANDED_TOPIC_INDEX } from "~/data/topic-index-expanded";
import { UnifiedReader } from "~/components/reader/UnifiedReader";

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
      context.queryClient.ensureQueryData(versesByChapterQueryOptions(chapterId, 1)),
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
      meta: [{ title: `${name} (${chapter.name_arabic}) | Mahfuz` }],
    };
  },
  component: SurahView,
});

function SurahView() {
  const { surahId } = Route.useParams();
  const { verse: verseParam, topic: topicParam, lock: lockParam } = Route.useSearch();
  const chapterId = Number(surahId);
  const navigate = useNavigate();
  const { t, locale } = useTranslation();

  // Lock mode
  const [lockMode, setLockMode] = useState(!!lockParam);
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lockProgress, setLockProgress] = useState(false);
  const [lockPickerOpen, setLockPickerOpen] = useState(false);
  const lockVerseNum = verseParam ?? 1;

  const handleLockUnlockStart = useCallback(() => {
    setLockProgress(true);
    lockTimerRef.current = setTimeout(() => {
      setLockMode(false);
      setLockProgress(false);
      navigate({ search: (prev: any) => { const { lock: _, ...rest } = prev; return rest; }, replace: true } as any);
    }, 1500);
  }, [navigate]);

  const handleLockUnlockEnd = useCallback(() => {
    if (lockTimerRef.current) { clearTimeout(lockTimerRef.current); lockTimerRef.current = null; }
    setLockProgress(false);
  }, []);

  const { data: chapter } = useSuspenseQuery(chapterQueryOptions(chapterId));
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const { data: versesData } = useSuspenseQuery(versesByChapterQueryOptions(chapterId));
  const focusStartPage = useBerkenarPageForVerse(`${chapterId}:1`, chapter.pages[0]);

  // Topic resolution
  const resolvedTopic = useMemo(() => {
    if (!topicParam) return null;
    const [catId, idxStr] = topicParam.split(":");
    const cat = EXPANDED_TOPIC_INDEX.find((c) => c.id === catId);
    if (!cat) return null;
    return cat.topics[Number(idxStr)] ?? null;
  }, [topicParam]);

  // WBW data
  const { data: wbwData } = useQuery(wbwByChapterQueryOptions(chapterId));
  const versesWithWords = useMemo(
    () => mergeWbwIntoVerses(versesData.verses, wbwData),
    [versesData.verses, wbwData],
  );

  return (
    <UnifiedReader
      source="surah"
      verses={versesWithWords}
      chapters={chapters}
      chapter={chapter}
      currentId={chapterId}
      totalCount={TOTAL_CHAPTERS}
      scrollToVerse={verseParam}
      focusPageNumber={focusStartPage}
      headerExtra={
        topicParam && resolvedTopic ? (
          <TopicNavBar topic={resolvedTopic} topicKey={topicParam} currentSurahId={chapterId} t={t} locale={locale} />
        ) : undefined
      }
      overlay={
        lockMode ? (
          <LockModeOverlay
            chapter={chapter}
            chapters={chapters}
            lockVerseNum={lockVerseNum}
            lockProgress={lockProgress}
            lockPickerOpen={lockPickerOpen}
            setLockPickerOpen={setLockPickerOpen}
            onLockUnlockStart={handleLockUnlockStart}
            onLockUnlockEnd={handleLockUnlockEnd}
            onSetLockMode={setLockMode}
            navigate={navigate}
            t={t}
            locale={locale}
          />
        ) : undefined
      }
      picker={({ onClose }) => (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
          <DialogContent>
            <SurahPicker
              currentChapterId={chapterId}
              chapters={chapters}
              t={t}
              locale={locale}
              onSelect={(id) => { onClose(); navigate({ to: "/$surahId", params: { surahId: String(id) } } as any); }}
              onClose={onClose}
            />
          </DialogContent>
        </Dialog>
      )}
    />
  );
}

// -- Lock Mode Overlay --
function LockModeOverlay({
  chapter, chapters, lockVerseNum, lockProgress, lockPickerOpen, setLockPickerOpen,
  onLockUnlockStart, onLockUnlockEnd, onSetLockMode, navigate, t, locale,
}: any) {
  return (
    <>
      <div className="fixed inset-x-0 top-0 z-50 bg-amber-500/95 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 px-4 py-2 text-[12px] font-medium text-white">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>
          {t.quranReader.lockModeActive}
          <span className="ml-1 opacity-70">— {t.quranReader.lockModeHint}</span>
        </div>
        <div className="flex items-center justify-between border-t border-white/20 px-4 py-2">
          <button type="button" onClick={() => setLockPickerOpen(true)} className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-white/30 active:scale-[0.97]">
            <span className="arabic-text text-[14px]">{chapter.name_arabic}</span>
            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6l4 4 4-4" /></svg>
          </button>
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => { const prev = Math.max(1, lockVerseNum - 1); navigate({ search: (s: any) => ({ ...s, verse: prev }), replace: true }); }} disabled={lockVerseNum <= 1} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-40">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <span className="min-w-[4.5rem] text-center text-[12px] font-semibold tabular-nums text-white">{t.quranReader.verseLabel} {lockVerseNum} / {chapter.verses_count}</span>
            <button type="button" onClick={() => { const next = Math.min(chapter.verses_count, lockVerseNum + 1); navigate({ search: (s: any) => ({ ...s, verse: next }), replace: true }); }} disabled={lockVerseNum >= chapter.verses_count} className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white transition-colors hover:bg-white/30 disabled:opacity-40">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </div>
      <div className="fixed inset-0 z-40" style={{ touchAction: "none" }} onTouchMove={(e) => e.preventDefault()} onWheel={(e) => e.preventDefault()} />
      <button type="button" onPointerDown={onLockUnlockStart} onPointerUp={onLockUnlockEnd} onPointerLeave={onLockUnlockEnd} onContextMenu={(e) => e.preventDefault()} className={`fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-[var(--shadow-modal)] transition-all lg:bottom-8 lg:right-8 ${lockProgress ? "scale-110 bg-green-500 text-white" : "bg-amber-500 text-white active:scale-95"}`} aria-label={t.quranReader.lockModeUnlock}>
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          {lockProgress ? (<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 019.9-1" /></>) : (<><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>)}
        </svg>
        {lockProgress && (
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="25" fill="none" stroke="white" strokeWidth="3" strokeDasharray="157" strokeDashoffset="157" style={{ animation: "lock-progress 1.5s linear forwards" }} />
          </svg>
        )}
      </button>
      <Dialog open={lockPickerOpen} onOpenChange={setLockPickerOpen}>
        <DialogContent>
          <SurahPicker currentChapterId={chapter.id} chapters={chapters} t={t} locale={locale} onSelect={(id: number) => { setLockPickerOpen(false); navigate({ to: "/$surahId", params: { surahId: String(id) }, search: { lock: true, verse: 1 } } as any); }} onClose={() => setLockPickerOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

// -- Surah Picker --
function SurahPicker({ currentChapterId, chapters, onSelect, onClose, t, locale }: {
  currentChapterId: number; chapters: Chapter[]; onSelect: (chapterId: number) => void; onClose: () => void; t: any; locale: any;
}) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return chapters;
    return chapters.filter((ch) =>
      ch.name_simple.toLowerCase().includes(q) || ch.name_arabic.includes(q) ||
      getSurahName(ch.id, ch.translated_name.name, locale).toLowerCase().includes(q) || String(ch.id).startsWith(q),
    );
  }, [chapters, search, locale]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { if (!search) requestAnimationFrame(() => { currentRef.current?.scrollIntoView({ block: "center" }); }); }, [search]);

  return (
    <div className="mx-auto flex w-[92%] max-w-[520px] animate-scale-in flex-col overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-modal)]">
      <DialogTitle className="sr-only">{t.surahPicker.placeholder}</DialogTitle>
      <div className="flex items-center gap-3 border-b border-[var(--theme-border)] px-4 py-3">
        <svg className="h-4 w-4 shrink-0 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" /></svg>
        <input ref={inputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.surahPicker.placeholder} className="flex-1 bg-transparent text-[15px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none" />
        <button onClick={onClose} className="text-[13px] font-medium text-primary-600">{t.common.close}</button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {filtered.map((ch) => {
          const isCurrent = ch.id === currentChapterId;
          return (
            <button key={ch.id} ref={isCurrent ? currentRef : undefined} type="button" onClick={() => onSelect(ch.id)} className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${isCurrent ? "bg-primary-600/10" : "hover:bg-[var(--theme-hover-bg)]"}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums ${isCurrent ? "bg-primary-600 text-white" : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)]"}`}>{ch.id}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[var(--theme-text)]">{getSurahName(ch.id, ch.translated_name.name, locale)}</span>
                  <span className="text-[11px] text-[var(--theme-text-quaternary)]">{ch.name_simple}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--theme-text-tertiary)]">
                  <span>{ch.verses_count} {t.quranReader.versesUnit}</span><span>·</span><span>{t.common.page} {ch.pages[0]}–{ch.pages[1]}</span>
                </div>
              </div>
              <span className="arabic-text shrink-0 text-base text-[var(--theme-text-secondary)]" dir="rtl">{ch.name_arabic}</span>
            </button>
          );
        })}
        {filtered.length === 0 && <p className="px-4 py-6 text-center text-[13px] text-[var(--theme-text-tertiary)]">{t.common.noResults}</p>}
      </div>
    </div>
  );
}

// -- Topic Navigation Bar --
function TopicNavBar({ topic, topicKey, currentSurahId, t, locale }: { topic: TopicEntry; topicKey: string; currentSurahId: number; t: any; locale: any }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current?.querySelector("[data-active]");
    if (el) el.scrollIntoView({ inline: "center", block: "nearest" });
  }, [currentSurahId]);
  const topicName = locale === "en" ? topic.topicEn : locale === "es" ? topic.topicEs : topic.topic;
  return (
    <div className="mb-6 rounded-2xl bg-[var(--theme-bg-primary)] p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <EmojiIcon emoji={topic.icon} className="h-[18px] w-[18px]" />
        <span className="flex-1 text-[13px] font-semibold text-[var(--theme-text)]">{topicName}</span>
        <Link to="/browse/$tab" params={{ tab: "index" }} search={{ topic: topicKey }} className="text-[11px] font-medium text-primary-600 hover:text-primary-700">{t.quranReader.backToIndex}</Link>
      </div>
      <div ref={scrollRef} className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
        {topic.refs.map((ref) => {
          const [surah, verseRange] = ref.split(":");
          const surahId = Number(surah);
          const firstVerse = verseRange?.split("-")[0];
          const isActive = surahId === currentSurahId;
          return (
            <Link key={ref} to="/$surahId" params={{ surahId: surah }} search={{ topic: topicKey, verse: firstVerse ? Number(firstVerse) : undefined } as any} {...(isActive ? { "data-active": true } : {})} className={`shrink-0 rounded-lg px-2.5 py-1 text-[12px] font-medium tabular-nums transition-colors ${isActive ? "bg-primary-600 text-white" : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] hover:bg-primary-600/10 hover:text-primary-700"}`}>
              {ref}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
