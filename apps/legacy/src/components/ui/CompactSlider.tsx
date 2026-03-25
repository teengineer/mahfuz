import type { ReactNode } from "react";

interface CompactSliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Small/large indicator on either side of the track (two-row layout) */
  startDecorator?: ReactNode;
  endDecorator?: ReactNode;
  /** When true, renders as a single inline row (label + slider + percentage) */
  inline?: boolean;
}

export function CompactSlider({
  label,
  value,
  onChange,
  min = 0.6,
  max = 2.0,
  step = 0.05,
  startDecorator,
  endDecorator,
  inline,
}: CompactSliderProps) {
  const pct = `%${Math.round(value * 100)}`;

  if (inline) {
    return (
      <div className="flex items-center gap-3">
        <span className="shrink-0 text-[12px] text-[var(--theme-text-tertiary)]">{label}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
        />
        <span className="shrink-0 text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">
          {pct}
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-medium text-[var(--theme-text)]">{label}</span>
        <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">{pct}</span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        {startDecorator}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
        />
        {endDecorator}
      </div>
    </div>
  );
}
