import { useTranslation } from "~/hooks/useTranslation";

const TOTAL_QURAN_VERSES = 6236;

interface QuranProgressProps {
  masteredVerses: number;
}

export function QuranProgress({ masteredVerses }: QuranProgressProps) {
  const { t } = useTranslation();
  const pct = Math.min((masteredVerses / TOTAL_QURAN_VERSES) * 100, 100);
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      <div className="relative h-32 w-32">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="var(--theme-hover-bg)"
            strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="#059669"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[var(--theme-text)]">
            {pct.toFixed(1)}%
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[13px] font-medium text-[var(--theme-text-secondary)]">
          {t.memorize.advancedStats.quranProgress}
        </p>
        <p className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">
          {masteredVerses} / {TOTAL_QURAN_VERSES} {t.common.verse}
        </p>
      </div>
    </div>
  );
}
