import { useMemorizationStore } from "~/stores/useMemorizationStore";
import { memorizationRepository } from "@mahfuz/db";
import { useTranslation } from "~/hooks/useTranslation";

interface GoalsSettingsProps {
  userId: string;
}

export function GoalsSettings({ userId }: GoalsSettingsProps) {
  const newCardsPerDay = useMemorizationStore((s) => s.newCardsPerDay);
  const reviewCardsPerDay = useMemorizationStore((s) => s.reviewCardsPerDay);
  const setGoals = useMemorizationStore((s) => s.setGoals);
  const { t } = useTranslation();

  const handleChange = async (newCards: number, reviewCards: number) => {
    setGoals(newCards, reviewCards);
    await memorizationRepository.setGoals({
      userId,
      newCardsPerDay: newCards,
      reviewCardsPerDay: reviewCards,
    });
  };

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-base font-semibold text-[var(--theme-text)]">
        {t.memorize.goalsSettings.title}
      </h3>

      <div className="space-y-4">
        <GoalRow
          label={t.memorize.goalsSettings.newPerDay}
          value={newCardsPerDay}
          onChange={(v) => handleChange(v, reviewCardsPerDay)}
          min={1}
          max={30}
        />
        <GoalRow
          label={t.memorize.goalsSettings.reviewPerDay}
          value={reviewCardsPerDay}
          onChange={(v) => handleChange(newCardsPerDay, v)}
          min={5}
          max={100}
        />
      </div>
    </div>
  );
}

function GoalRow({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] text-[var(--theme-text-secondary)]">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)] disabled:opacity-40"
        >
          -
        </button>
        <span className="w-8 text-center text-[15px] font-semibold tabular-nums text-[var(--theme-text)]">
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)] disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
