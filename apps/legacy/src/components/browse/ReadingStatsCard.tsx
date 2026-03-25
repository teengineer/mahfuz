import { useReadingStats } from "~/stores/useReadingStats";
import { useTranslation } from "~/hooks/useTranslation";

export function ReadingStatsCard() {
  const { t } = useTranslation();
  const completedPages = useReadingStats((s) => s.completedPages);
  const dailyLogs = useReadingStats((s) => s.dailyLogs);
  const currentStreak = useReadingStats((s) => s.currentStreak);

  const totalPages = 604;
  const pct = Math.round((completedPages.length / totalPages) * 100);
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayPages =
    dailyLogs.find((l) => l.date === todayStr)?.pagesRead ?? 0;

  if (completedPages.length === 0 && dailyLogs.length === 0) return null;

  return (
    <div className="mb-6 flex items-center gap-3 rounded-xl bg-[var(--theme-bg-primary)] px-3.5 py-2.5 text-[12px]">
      {/* Streak */}
      <span className="flex shrink-0 items-center gap-1">
        <span className="text-sm leading-none">&#x1F525;</span>
        <span className="font-semibold tabular-nums text-[var(--theme-text)]">
          {currentStreak} {t.stats.streak}
        </span>
      </span>

      <span className="text-[var(--theme-text-quaternary)]">·</span>

      {/* Today */}
      <span className="shrink-0 text-[var(--theme-text-secondary)]">
        {t.stats.today}: {todayPages} {t.stats.pagesRead}
      </span>

      {/* Hatim progress — fills remaining space */}
      <div className="flex flex-1 items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--theme-border)]">
          <div
            className="h-full rounded-full bg-primary-600"
            style={{ width: `${Math.max(pct, 0.5)}%` }}
          />
        </div>
        <span className="shrink-0 tabular-nums text-[var(--theme-text-tertiary)]">
          {completedPages.length}/{totalPages}
        </span>
      </div>
    </div>
  );
}
