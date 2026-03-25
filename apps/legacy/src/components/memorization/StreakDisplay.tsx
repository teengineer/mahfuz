import { useTranslation } from "~/hooks/useTranslation";
import { EmojiIcon } from "~/components/icons/EmojiIcon";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  last7Days: boolean[]; // true = reviewed that day, index 0 = 6 days ago, index 6 = today
}

const DAY_LABELS_TR = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const DAY_LABELS_EN = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export function StreakDisplay({ currentStreak, longestStreak, last7Days }: StreakDisplayProps) {
  const { t, locale } = useTranslation();
  const dayLabels = locale === "tr" ? DAY_LABELS_TR : DAY_LABELS_EN;

  // Build labels for last 7 days starting from today going back
  const today = new Date();
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return dayLabels[d.getDay() === 0 ? 6 : d.getDay() - 1];
  });

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      <div className="mb-4 flex items-center gap-3">
        <EmojiIcon emoji="🔥" className="h-8 w-8" />
        <div>
          <p className="text-2xl font-bold text-[var(--theme-text)]">
            {currentStreak} <span className="text-sm font-normal text-[var(--theme-text-tertiary)]">{t.memorize.stats.streakSuffix}</span>
          </p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">
            {t.memorize.advancedStats.longestStreak}: {longestStreak} {t.memorize.stats.streakSuffix}
          </p>
        </div>
      </div>
      <div className="flex justify-between gap-1">
        {labels.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              className={`h-8 w-8 rounded-lg transition-colors ${
                last7Days[i]
                  ? "bg-emerald-500"
                  : "bg-[var(--theme-hover-bg)]"
              }`}
            />
            <span className="text-[10px] text-[var(--theme-text-quaternary)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
