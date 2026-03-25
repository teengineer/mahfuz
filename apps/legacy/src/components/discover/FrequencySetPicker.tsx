import { memo } from "react";
import { useTranslation } from "~/hooks/useTranslation";

const SET_IDS = ["top-10", "top-50", "top-100", "top-200", "top-500", "all"] as const;

interface FrequencySetPickerProps {
  activeSet: string;
  onSetChange: (setId: string) => void;
}

export const FrequencySetPicker = memo(function FrequencySetPicker({
  activeSet,
  onSetChange,
}: FrequencySetPickerProps) {
  const { t } = useTranslation();

  const labels: Record<string, string> = {
    "top-10": t.discover.top10,
    "top-50": t.discover.top50,
    "top-100": t.discover.top100,
    "top-200": t.discover.top200,
    "top-500": t.discover.top500,
    all: t.discover.all,
  };

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none sm:gap-2">
      {SET_IDS.map((id) => {
        const active = activeSet === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSetChange(id)}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-[12px] font-semibold tracking-wide transition-all duration-150 sm:px-4 sm:text-[13px] ${
              active
                ? "bg-primary-600 text-white shadow-[0_2px_8px_-2px_rgba(var(--color-primary-500-rgb,99,102,241),0.4)]"
                : "bg-[var(--theme-bg-secondary)] text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text-secondary)]"
            }`}
          >
            {labels[id] || id}
          </button>
        );
      })}
    </div>
  );
});
