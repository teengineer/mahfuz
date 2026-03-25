import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { useReadingHistory } from "~/stores/useReadingHistory";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";
import { ContinueReadingSection } from "~/components/browse/ContinueReadingSection";

export function ContinueReadingHome() {
  const { t, locale } = useTranslation();
  const lastSurahId = useReadingHistory((s) => s.lastSurahId);
  const lastSurahName = useReadingHistory((s) => s.lastSurahName);
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  const chapter = lastSurahId ? chapters.find((c) => c.id === lastSurahId) : null;

  return (
    <section className="mb-6">
      {/* Last read resume card */}
      {chapter && (
        <Link
          to="/$surahId"
          params={{ surahId: String(chapter.id) }}
          className="mb-4 flex items-center gap-3 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elevated)] active:scale-[0.98]"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[var(--theme-text-tertiary)]">
              {t.home.lastRead}
            </p>
            <p className="truncate text-[14px] font-semibold text-[var(--theme-text)]">
              {getSurahName(chapter.id, lastSurahName || chapter.translated_name.name, locale)}
            </p>
            <p className="arabic-text text-[13px] text-[var(--theme-text-secondary)]">
              {chapter.name_arabic}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-primary-600 px-3 py-1 text-[12px] font-medium text-white">
            {t.home.resume}
          </span>
        </Link>
      )}

      {/* Reading list cards */}
      <ContinueReadingSection />
    </section>
  );
}
