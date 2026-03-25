import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import type { Chapter } from "@mahfuz/shared/types";
import {
  usePageLayout,
  getTotalPages,
  getAllJuzRangesByLayout,
} from "~/lib/page-layout";

function getChapterForPage(page: number, chapters: Chapter[]): Chapter | undefined {
  return chapters.find((ch) => page >= ch.pages[0] && page <= ch.pages[1]);
}

export function PageListPanel() {
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const layout = usePageLayout();
  const totalPages = getTotalPages(layout);

  if (layout === "berkenar") {
    const juzRanges = getAllJuzRangesByLayout(layout);
    return (
      <>
        <p className="mb-4 text-[13px] text-[var(--theme-text-tertiary)]">
          {totalPages} sayfa · Berkenar düzeni
        </p>
        {juzRanges.map(({ juz, start, end }) => (
          <div key={juz} className="mb-5 last:mb-0">
            <p className="sticky top-0 z-10 mb-2 bg-[var(--theme-bg)] py-1 text-[13px] font-semibold text-[var(--theme-text)]">
              Cüz {juz}
              <span className="ml-2 text-[12px] font-normal text-[var(--theme-text-tertiary)]">
                Sayfa {start}–{end}
              </span>
            </p>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
              {Array.from({ length: end - start + 1 }, (_, i) => {
                const page = start + i;
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
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      <p className="mb-4 text-[13px] text-[var(--theme-text-tertiary)]">
        {totalPages} sayfa
      </p>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {Array.from({ length: totalPages }, (_, i) => {
          const page = i + 1;
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
    </>
  );
}
