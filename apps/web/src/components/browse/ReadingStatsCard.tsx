import { useReadingStats } from "~/stores/useReadingStats";
import { useTranslation } from "~/hooks/useTranslation";

export function ReadingStatsCard() {
  const { t } = useTranslation();
  const completedPages = useReadingStats((s) => s.completedPages);
  const dailyLogs = useReadingStats((s) => s.dailyLogs);
  const currentStreak = useReadingStats((s) => s.currentStreak);
  const khatamCount = useReadingStats((s) => s.khatamCount);

  const progress = completedPages.length / 604;
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayLog = dailyLogs.find((l) => l.date === todayStr);

  // Last 7 days for mini chart
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    return dailyLogs.find((l) => l.date === dateStr)?.pagesRead ?? 0;
  });
  const maxPages = Math.max(...last7, 1);

  if (completedPages.length === 0 && dailyLogs.length === 0) return null;

  const circumference = 2 * Math.PI * 28;
  const strokeDash = circumference * progress;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[15px] font-semibold text-[var(--theme-text)]">
        {t.stats.khatamProgress}
      </h2>
      <div className="flex items-start gap-4 rounded-2xl bg-[var(--theme-bg-primary)] p-4">
        {/* Progress ring */}
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--theme-border)" strokeWidth="4" />
            <circle cx="32" cy="32" r="28" fill="none" stroke="var(--color-primary-600)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`} />
          </svg>
          <span className="absolute text-[11px] font-bold tabular-nums text-[var(--theme-text)]">
            {Math.round(progress * 100)}%
          </span>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            {/* Streak */}
            <div className="flex items-center gap-1">
              <span className="text-[16px]">&#x1F525;</span>
              <span className="text-[13px] font-semibold tabular-nums text-[var(--theme-text)]">{currentStreak}</span>
              <span className="text-[11px] text-[var(--theme-text-tertiary)]">{t.stats.streak}</span>
            </div>
            {/* Khatam count */}
            {khatamCount > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[13px] font-semibold tabular-nums text-primary-600">{khatamCount}x</span>
                <span className="text-[11px] text-[var(--theme-text-tertiary)]">{t.stats.khatamCount}</span>
              </div>
            )}
          </div>

          {/* Today */}
          <div className="text-[12px] text-[var(--theme-text-secondary)]">
            {t.stats.today}: {todayLog?.pagesRead ?? 0} {t.stats.pagesRead} · {todayLog?.versesRead ?? 0} {t.common.verse}
          </div>

          {/* Mini bar chart */}
          <div className="flex h-6 items-end gap-0.5">
            {last7.map((pages, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-sm bg-primary-600/30"
                style={{ height: `${Math.max(2, (pages / maxPages) * 24)}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
