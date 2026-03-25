import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { versesByLayoutPageQueryOptions } from "~/hooks/useVerses";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { Loading } from "~/components/ui/Loading";
import {
  usePageLayout,
  getActiveLayout,
  getTotalPages,
  getJuzForPageByLayout,
  getAllJuzRangesByLayout,
} from "~/lib/page-layout";
import type { Chapter } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { UnifiedReader } from "~/components/reader/UnifiedReader";

export const Route = createFileRoute("/_app/page/$pageNumber")({
  loader: ({ context, params }) => {
    const pageNum = Number(params.pageNumber);
    const layout = getActiveLayout();
    return Promise.all([
      context.queryClient.ensureQueryData(versesByLayoutPageQueryOptions(pageNum, layout)),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
    ]);
  },
  pendingComponent: () => <Loading text="Sayfa yükleniyor..." />,
  head: ({ params }) => ({
    meta: [{ title: `Sayfa ${params.pageNumber} | Mahfuz` }],
  }),
  component: PageView,
});

function PageView() {
  const { pageNumber } = Route.useParams();
  const pageNum = Number(pageNumber);
  const navigate = useNavigate();
  const layout = usePageLayout();
  const totalPages = getTotalPages(layout);
  const { t } = useTranslation();

  const { data: versesData } = useSuspenseQuery(versesByLayoutPageQueryOptions(pageNum, layout));
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  return (
    <UnifiedReader
      source="page"
      verses={versesData.verses}
      chapters={chapters}
      currentId={pageNum}
      totalCount={totalPages}
      focusPageNumber={pageNum}
      picker={({ onClose }) => (
        <PagePicker
          currentPage={pageNum}
          chapters={chapters}
          layout={layout}
          t={t}
          onSelect={(p) => {
            onClose();
            navigate({ to: "/page/$pageNumber", params: { pageNumber: String(p) } });
          }}
          onClose={onClose}
        />
      )}
    />
  );
}

// -- Page Picker Overlay --

function PagePicker({
  currentPage,
  chapters,
  layout,
  onSelect,
  onClose,
  t,
}: {
  currentPage: number;
  chapters: Chapter[];
  layout: import("@mahfuz/shared/constants").PageLayout;
  onSelect: (page: number) => void;
  onClose: () => void;
  t: ReturnType<typeof import("~/hooks/useTranslation").useTranslation>["t"];
}) {
  const juzRanges = getAllJuzRangesByLayout(layout);
  const currentJuz = getJuzForPageByLayout(currentPage, layout);
  const currentJuzRef = useRef<HTMLDivElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const [activeJuz, setActiveJuz] = useState<number | null>(null);

  const pageChapterMap = useMemo(() => {
    const map: Record<number, string> = {};
    for (const ch of chapters) {
      for (let p = ch.pages[0]; p <= ch.pages[1]; p++) {
        map[p] = ch.name_simple;
      }
    }
    return map;
  }, [chapters]);

  useEffect(() => {
    requestAnimationFrame(() => {
      currentJuzRef.current?.scrollIntoView({ block: "center" });
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const getJuzFromY = useCallback((clientY: number) => {
    const el = scrubberRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    return Math.min(30, Math.floor(ratio * 30) + 1);
  }, []);

  const scrollToJuz = useCallback((juz: number) => {
    document.getElementById(`picker-juz-${juz}`)?.scrollIntoView({ behavior: "auto", block: "start" });
  }, []);

  const handleScrubStart = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const juz = getJuzFromY(e.clientY);
    if (juz) { setActiveJuz(juz); scrollToJuz(juz); }
  }, [getJuzFromY, scrollToJuz]);

  const handleScrubMove = useCallback((e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const juz = getJuzFromY(e.clientY);
    if (juz && juz !== activeJuz) { setActiveJuz(juz); scrollToJuz(juz); }
  }, [getJuzFromY, activeJuz, scrollToJuz]);

  const handleScrubEnd = useCallback(() => { setActiveJuz(null); }, []);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="mx-auto mt-10 flex w-[92%] max-w-[600px] animate-scale-in flex-col overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-modal)] sm:mt-14">
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
          <h2 className="text-[15px] font-semibold text-[var(--theme-text)]">{t.quranReader.goToPage}</h2>
          <button onClick={onClose} className="text-[13px] font-medium text-primary-600">{t.common.close}</button>
        </div>

        <div className="relative flex max-h-[70vh] min-h-0">
          <div className="flex-1 overflow-y-auto px-3 py-3 pr-8">
            {juzRanges.map(({ juz, start, end }) => (
              <div key={juz} id={`picker-juz-${juz}`} ref={juz === currentJuz ? currentJuzRef : undefined} className="mb-5 last:mb-0">
                <p className="sticky top-0 z-10 mb-2 bg-[var(--theme-bg-primary)] py-1 text-[13px] font-semibold text-[var(--theme-text)]">
                  {t.common.juz} {juz}
                  <span className="ml-2 text-[12px] font-normal text-[var(--theme-text-tertiary)]">{t.common.page} {start}–{end}</span>
                </p>
                <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 md:grid-cols-10">
                  {Array.from({ length: end - start + 1 }, (_, i) => {
                    const page = start + i;
                    const isCurrent = page === currentPage;
                    const chapterName = pageChapterMap[page];
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => onSelect(page)}
                        className={`flex flex-col items-center rounded-xl px-1 py-2 transition-all ${
                          isCurrent
                            ? "bg-primary-600 text-white shadow-sm"
                            : "bg-[var(--theme-hover-bg)]/60 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                        }`}
                      >
                        <span className="text-[13px] font-semibold tabular-nums leading-tight">{page}</span>
                        {chapterName && (
                          <span className={`mt-0.5 max-w-full truncate text-[8px] leading-tight ${isCurrent ? "text-white/80" : "text-[var(--theme-text-quaternary)]"}`}>
                            {chapterName}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div
            ref={scrubberRef}
            className="absolute right-0 top-0 bottom-0 flex w-7 cursor-pointer flex-col items-center justify-around py-2 select-none touch-none"
            onPointerDown={handleScrubStart}
            onPointerMove={handleScrubMove}
            onPointerUp={handleScrubEnd}
            onPointerCancel={handleScrubEnd}
          >
            {Array.from({ length: 30 }, (_, i) => {
              const juz = i + 1;
              const isActive = juz === activeJuz;
              const isCurr = juz === currentJuz;
              return (
                <span
                  key={juz}
                  className={`text-[9px] font-semibold tabular-nums leading-none transition-all ${
                    isActive ? "scale-125 text-primary-600" : isCurr ? "text-primary-600" : "text-[var(--theme-text-quaternary)]"
                  }`}
                >
                  {juz}
                </span>
              );
            })}
          </div>

          {activeJuz && (
            <div className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 rounded-xl bg-primary-600 px-3 py-1.5 text-[13px] font-semibold text-white shadow-lg">
              {t.common.juz} {activeJuz}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
