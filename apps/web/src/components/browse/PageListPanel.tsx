import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useRef, useCallback } from "react";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { getAllJuzRanges } from "@mahfuz/shared";
import type { Chapter } from "@mahfuz/shared/types";

function getChapterForPage(page: number, chapters: Chapter[]): Chapter | undefined {
  return chapters.find((ch) => page >= ch.pages[0] && page <= ch.pages[1]);
}

export function PageListPanel() {
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const juzRanges = getAllJuzRanges();
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const scrollToJuz = useCallback((juz: number) => {
    sectionRefs.current[juz]?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <>
      {/* Quick juz jump bar */}
      <div className="mb-6 flex flex-wrap gap-1">
        {Array.from({ length: 30 }, (_, i) => (
          <button
            key={i + 1}
            type="button"
            onClick={() => scrollToJuz(i + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-medium tabular-nums text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
          >
            {i + 1}
          </button>
        ))}
      </div>

      <p className="mb-4 text-[13px] text-[var(--theme-text-tertiary)]">
        604 sayfa · 30 cüz
      </p>

      {/* Juz sections */}
      <div className="space-y-8">
        {juzRanges.map(({ juz, start, end }) => (
          <div
            key={juz}
            ref={(el) => { sectionRefs.current[juz] = el; }}
          >
            <h2 className="mb-3 text-[15px] font-semibold text-[var(--theme-text)]">
              Cüz {juz}
              <span className="ml-2 text-[13px] font-normal text-[var(--theme-text-tertiary)]">
                Sayfa {start}–{end}
              </span>
            </h2>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
              {Array.from({ length: end - start + 1 }, (_, i) => {
                const page = start + i;
                const ch = getChapterForPage(page, chapters);
                return (
                  <Link
                    key={page}
                    to="/page/$pageNumber"
                    params={{ pageNumber: String(page) }}
                    className="flex flex-col items-center rounded-xl bg-[var(--theme-bg-primary)] px-1 py-2.5 transition-all hover:shadow-[var(--shadow-elevated)] active:scale-[0.97]"
                  >
                    <span className="text-[14px] font-semibold tabular-nums text-[var(--theme-text)]">
                      {page}
                    </span>
                    {ch && (
                      <span className="mt-0.5 max-w-full truncate text-[9px] text-[var(--theme-text-quaternary)]">
                        {ch.name_simple}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
