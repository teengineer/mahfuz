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
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      {SET_IDS.map((id) => {
        const active = activeSet === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSetChange(id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              active
                ? "bg-primary-600 text-white"
                : "bg-[var(--theme-pill-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
            }`}
          >
            {labels[id] || id}
          </button>
        );
      })}
    </div>
  );
});
