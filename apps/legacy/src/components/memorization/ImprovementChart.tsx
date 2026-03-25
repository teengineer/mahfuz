import { useTranslation } from "~/hooks/useTranslation";

export interface DailyHistoryEntry {
  date: string; // YYYY-MM-DD
  reviews: number;
  accuracy: number; // 0-1
}

interface ImprovementChartProps {
  data: DailyHistoryEntry[];
}

export function ImprovementChart({ data }: ImprovementChartProps) {
  const { t } = useTranslation();

  if (data.length === 0) return null;

  const maxReviews = Math.max(...data.map((d) => d.reviews), 1);
  const chartWidth = 400;
  const chartHeight = 120;
  const padding = { top: 10, right: 10, bottom: 20, left: 30 };
  const w = chartWidth - padding.left - padding.right;
  const h = chartHeight - padding.top - padding.bottom;

  // Build SVG path for reviews line
  const xStep = data.length > 1 ? w / (data.length - 1) : w;
  const reviewPoints = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + h - (d.reviews / maxReviews) * h,
  }));

  const reviewPath = reviewPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Accuracy line
  const accPoints = data.map((d, i) => ({
    x: padding.left + i * xStep,
    y: padding.top + h - d.accuracy * h,
  }));

  const accPath = accPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-3 text-[13px] font-semibold text-[var(--theme-text-secondary)]">
        {t.memorize.advancedStats.chartTitle}
      </h3>
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <line
            key={pct}
            x1={padding.left}
            y1={padding.top + h - pct * h}
            x2={chartWidth - padding.right}
            y2={padding.top + h - pct * h}
            stroke="var(--theme-divider)"
            strokeWidth="0.5"
          />
        ))}

        {/* Reviews line */}
        <path d={reviewPath} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Accuracy line */}
        <path d={accPath} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 2" />

        {/* X-axis labels (first, mid, last) */}
        {[0, Math.floor(data.length / 2), data.length - 1].map((idx) => (
          <text
            key={idx}
            x={padding.left + idx * xStep}
            y={chartHeight - 2}
            textAnchor="middle"
            className="fill-[var(--theme-text-quaternary)]"
            fontSize="8"
          >
            {data[idx]?.date.slice(5) /* MM-DD */}
          </text>
        ))}
      </svg>
      <div className="mt-2 flex justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-4 rounded-full bg-blue-500" />
          <span className="text-[11px] text-[var(--theme-text-tertiary)]">{t.memorize.advancedStats.reviews}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 border-t-2 border-dashed border-emerald-500" />
          <span className="text-[11px] text-[var(--theme-text-tertiary)]">{t.memorize.stats.accuracy}</span>
        </div>
      </div>
    </div>
  );
}
