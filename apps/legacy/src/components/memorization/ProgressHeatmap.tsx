import type { ConfidenceLevel } from "@mahfuz/shared/types";
import { useState } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { useI18nStore } from "~/stores/useI18nStore";

const CONFIDENCE_COLORS: Record<ConfidenceLevel | "none", string> = {
  none: "bg-[var(--theme-hover-bg)]",
  struggling: "bg-red-500",
  learning: "bg-orange-400",
  familiar: "bg-yellow-400",
  confident: "bg-blue-500",
  mastered: "bg-emerald-500",
};

const CONFIDENCE_KEYS: ConfidenceLevel[] = [
  "struggling",
  "learning",
  "familiar",
  "confident",
  "mastered",
];

interface ProgressHeatmapProps {
  surahId: number;
  versesCount: number;
  progressMap: Map<string, { confidence: ConfidenceLevel; nextReview: Date }>;
}

export function ProgressHeatmap({
  surahId,
  versesCount,
  progressMap,
}: ProgressHeatmapProps) {
  const { t } = useTranslation();
  const locale = useI18nStore((s) => s.locale);
  const [tooltip, setTooltip] = useState<{
    verseKey: string;
    confidence: ConfidenceLevel;
    nextReview: Date;
  } | null>(null);

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      <h3 className="mb-4 text-[14px] font-semibold text-[var(--theme-text)]">
        {t.memorize.verseMap}
      </h3>

      <div className="flex flex-wrap gap-1">
        {Array.from({ length: versesCount }, (_, i) => {
          const verseKey = `${surahId}:${i + 1}`;
          const data = progressMap.get(verseKey);
          const colorClass = data
            ? CONFIDENCE_COLORS[data.confidence]
            : CONFIDENCE_COLORS.none;

          return (
            <div
              key={verseKey}
              className={`h-5 w-5 cursor-pointer rounded-sm ${colorClass} transition-all hover:scale-125 hover:shadow-sm`}
              onMouseEnter={() =>
                data &&
                setTooltip({
                  verseKey,
                  confidence: data.confidence,
                  nextReview: data.nextReview,
                })
              }
              onMouseLeave={() => setTooltip(null)}
              title={
                data
                  ? `${verseKey} | ${t.memorize.confidence[data.confidence]}`
                  : `${verseKey} | ${t.memorize.notAdded}`
              }
            />
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-3 rounded-lg bg-[var(--theme-hover-bg)] px-3 py-2 text-[12px]">
          <span className="font-medium text-[var(--theme-text)]">
            {tooltip.verseKey}
          </span>
          {" | "}
          <span className="text-[var(--theme-text-secondary)]">
            {t.memorize.confidence[tooltip.confidence]}
          </span>
          {" | "}
          <span className="text-[var(--theme-text-tertiary)]">
            {t.memorize.nextReview}{" "}
            {tooltip.nextReview.toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US")}
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex flex-wrap gap-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded-sm bg-[var(--theme-hover-bg)]" />
          <span className="text-[11px] text-[var(--theme-text-quaternary)]">
            {t.memorize.notAdded}
          </span>
        </div>
        {CONFIDENCE_KEYS.map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <span
              className={`inline-block h-3 w-3 rounded-sm ${CONFIDENCE_COLORS[level]}`}
            />
            <span className="text-[11px] text-[var(--theme-text-quaternary)]">
              {t.memorize.confidence[level]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
