import { useState, useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { MemorizationStats, ConfidenceLevel, Juz } from "@mahfuz/shared/types";
import type { MemorizationCardEntry } from "@mahfuz/db";
import { TOTAL_VERSES } from "@mahfuz/shared/constants";
import { useTranslation } from "~/hooks/useTranslation";
import { juzListQueryOptions } from "~/hooks/useJuz";

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  struggling: "bg-red-500",
  learning: "bg-orange-400",
  familiar: "bg-yellow-400",
  confident: "bg-blue-500",
  mastered: "bg-emerald-500",
};

const CONFIDENCE_STROKE: Record<ConfidenceLevel, string> = {
  struggling: "#ef4444",
  learning: "#fb923c",
  familiar: "#facc15",
  confident: "#3b82f6",
  mastered: "#10b981",
};

interface StatsOverviewProps {
  stats: MemorizationStats;
  cards?: MemorizationCardEntry[];
}

function getJuzVerseKeys(juz: Juz): Set<string> {
  const keys = new Set<string>();
  for (const [surahId, range] of Object.entries(juz.verse_mapping)) {
    const [start, end] = range.split("-").map(Number);
    for (let v = start; v <= (end || start); v++) {
      keys.add(`${surahId}:${v}`);
    }
  }
  return keys;
}

export function StatsOverview({ stats, cards }: StatsOverviewProps) {
  const { t } = useTranslation();
  const { data: juzs } = useSuspenseQuery(juzListQueryOptions());
  const [overviewMode, setOverviewMode] = useState<"quran" | "juz">("quran");
  const [selectedJuz, setSelectedJuz] = useState(30);
  const accuracy = Math.round(stats.averageAccuracy * 100);
  const total = stats.totalCards || 1;
  const quranPct =
    stats.totalCards > 0
      ? Math.max(Math.round((stats.totalCards / TOTAL_VERSES) * 100), 1)
      : 0;

  const allLevels = Object.keys(CONFIDENCE_COLORS) as ConfidenceLevel[];
  const nonZeroLevels = allLevels.filter(
    (level) => (stats.byConfidence[level] || 0) > 0,
  );

  const juzStats = useMemo(() => {
    if (overviewMode !== "juz" || !cards) return null;
    const juz = juzs.find((j) => j.juz_number === selectedJuz);
    if (!juz) return null;
    const keys = getJuzVerseKeys(juz);
    const byConf: Partial<Record<ConfidenceLevel, number>> = {};
    let matched = 0;
    for (const card of cards) {
      if (keys.has(card.verseKey)) {
        byConf[card.confidence] = (byConf[card.confidence] || 0) + 1;
        matched++;
      }
    }
    return { byConfidence: byConf, total: matched, versesCount: juz.verses_count };
  }, [overviewMode, selectedJuz, cards, juzs]);

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-5 shadow-[var(--shadow-card)] sm:p-6">
      {/* Top row: key numbers */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatBox
          label={t.memorize.stats.dueToday}
          value={stats.dueToday}
          accent
        />
        <StatBox
          label={t.memorize.stats.reviewedToday}
          value={stats.reviewedToday}
        />
        <StatBox
          label={t.memorize.stats.streak}
          value={stats.currentStreak}
          suffix={` ${t.memorize.stats.streakSuffix}`}
        />
        <StatBox
          label={t.memorize.stats.accuracy}
          value={accuracy}
          suffix="%"
        />
      </div>

      {/* Quran progress section */}
      <div className="mb-5 flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
        {/* Donut ring: Quran progress */}
        <DonutRing memorized={stats.totalCards} pct={quranPct} />

        {/* Stacked bar + label */}
        <div className="flex w-full flex-1 flex-col gap-2">
          <p className="text-[13px] font-medium text-[var(--theme-text-secondary)]">
            {t.memorize.stats.confidenceDist}
          </p>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
            {nonZeroLevels.map((level) => {
              const count = stats.byConfidence[level] || 0;
              const pct = (count / total) * 100;
              return (
                <div
                  key={level}
                  className={`${CONFIDENCE_COLORS[level]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${t.memorize.confidence[level]}: ${count}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            {nonZeroLevels.map((level) => {
              const count = stats.byConfidence[level] || 0;
              return (
                <div key={level} className="flex items-center gap-1.5">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${CONFIDENCE_COLORS[level]}`}
                  />
                  <span className="text-[11px] text-[var(--theme-text-tertiary)]">
                    {t.memorize.confidence[level]} ({count})
                  </span>
                </div>
              );
            })}
          </div>

          {/* Overview bar with Kur'an / Cüz toggle */}
          <div className="mt-3 flex items-center gap-2">
            <p className="text-[13px] font-medium text-[var(--theme-text-secondary)]">
              {overviewMode === "quran" ? t.memorize.stats.quranOverview : `${t.common.juz} ${selectedJuz}`}
            </p>
            <div className="ml-auto flex items-center gap-1.5">
              <div className="flex rounded-lg bg-[var(--theme-hover-bg)] p-0.5">
                <button
                  type="button"
                  onClick={() => setOverviewMode("quran")}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${overviewMode === "quran" ? "bg-[var(--theme-bg-primary)] text-[var(--theme-text)] shadow-sm" : "text-[var(--theme-text-tertiary)]"}`}
                >
                  {t.memorize.stats.quranLabel}
                </button>
                <button
                  type="button"
                  onClick={() => setOverviewMode("juz")}
                  className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition-colors cursor-pointer ${overviewMode === "juz" ? "bg-[var(--theme-bg-primary)] text-[var(--theme-text)] shadow-sm" : "text-[var(--theme-text-tertiary)]"}`}
                >
                  {t.common.juz}
                </button>
              </div>
              {overviewMode === "juz" && (
                <select
                  value={selectedJuz}
                  onChange={(e) => setSelectedJuz(Number(e.target.value))}
                  className="rounded-lg bg-[var(--theme-hover-bg)] px-2 py-0.5 text-[11px] font-semibold text-[var(--theme-text)] outline-none cursor-pointer"
                >
                  {Array.from({ length: 30 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{t.common.juz} {n}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          {(() => {
            const isJuz = overviewMode === "juz" && juzStats;
            const barByConf = isJuz ? juzStats.byConfidence : stats.byConfidence;
            const barTotal = isJuz ? juzStats.versesCount : TOTAL_VERSES;
            const barMatched = isJuz ? juzStats.total : stats.totalCards;
            const barLevels = allLevels.filter((l) => (barByConf[l] || 0) > 0);
            return (
              <>
                <div className="flex h-2.5 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
                  {barLevels.map((level) => {
                    const count = barByConf[level] || 0;
                    const pct = (count / barTotal) * 100;
                    return (
                      <div
                        key={level}
                        className={`${CONFIDENCE_COLORS[level]} transition-all`}
                        style={{ width: `${pct}%` }}
                        title={`${t.memorize.confidence[level]}: ${count} / ${barTotal}`}
                      />
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {barLevels.map((level) => {
                    const count = barByConf[level] || 0;
                    return (
                      <div key={level} className="flex items-center gap-1.5">
                        <span className={`inline-block h-2 w-2 rounded-full ${CONFIDENCE_COLORS[level]}`} />
                        <span className="text-[11px] text-[var(--theme-text-tertiary)]">
                          {t.memorize.confidence[level]} ({count})
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block h-2 w-2 rounded-full bg-[var(--theme-hover-bg)]" />
                    <span className="text-[11px] text-[var(--theme-text-tertiary)]">
                      {t.memorize.stats.remaining} ({barTotal - barMatched})
                    </span>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Confidence breakdown cards, always show all 5 levels */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {allLevels.map((level) => {
          const count = stats.byConfidence[level] || 0;
          const pct = stats.totalCards > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <ConfidenceCard
              key={level}
              level={level}
              label={t.memorize.confidence[level]}
              count={count}
              pct={pct}
              verseLabel={t.common.verse}
            />
          );
        })}
      </div>
    </div>
  );
}

/* Donut Ring */
function DonutRing({
  memorized,
  pct,
}: {
  memorized: number;
  pct: number;
}) {
  const size = 152;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(pct, 100) / 100) * circumference;

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--theme-hover-bg)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#10b981"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      {/* Center text, absolutely positioned for reliable centering */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold leading-none text-[var(--theme-text)]">
          {pct}%
        </span>
        <span className="mt-1 text-[11px] leading-none text-[var(--theme-text-tertiary)]">
          {memorized} / {TOTAL_VERSES}
        </span>
      </div>
    </div>
  );
}

/* Confidence Card */
function ConfidenceCard({
  level,
  label,
  count,
  pct,
  verseLabel,
}: {
  level: ConfidenceLevel;
  label: string;
  count: number;
  pct: number;
  verseLabel: string;
}) {
  const miniSize = 40;
  const miniStroke = 4;
  const miniR = (miniSize - miniStroke) / 2;
  const miniCirc = 2 * Math.PI * miniR;
  const miniOffset = miniCirc - (pct / 100) * miniCirc;
  const color = CONFIDENCE_STROKE[level];

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-[var(--theme-hover-bg)] px-3 py-3">
      {/* Level name */}
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block h-2 w-2 rounded-full ${CONFIDENCE_COLORS[level]}`}
        />
        <span className="text-[11px] font-medium text-[var(--theme-text-secondary)]">
          {label}
        </span>
      </div>

      {/* Mini ring with percentage */}
      <div className="relative flex items-center justify-center">
        <svg width={miniSize} height={miniSize} className="-rotate-90">
          <circle
            cx={miniSize / 2}
            cy={miniSize / 2}
            r={miniR}
            fill="none"
            stroke="var(--theme-bg-primary)"
            strokeWidth={miniStroke}
          />
          <circle
            cx={miniSize / 2}
            cy={miniSize / 2}
            r={miniR}
            fill="none"
            stroke={color}
            strokeWidth={miniStroke}
            strokeLinecap="round"
            strokeDasharray={miniCirc}
            strokeDashoffset={miniOffset}
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute text-[10px] font-bold text-[var(--theme-text)]">
          {pct}%
        </span>
      </div>

      {/* Count */}
      <span className="text-[13px] font-semibold text-[var(--theme-text)]">
        {count}{" "}
        <span className="font-normal text-[var(--theme-text-tertiary)]">
          {verseLabel}
        </span>
      </span>
    </div>
  );
}

/* Stat Box */
function StatBox({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="text-center">
      <p
        className={`text-2xl font-bold ${accent ? "text-primary-600" : "text-[var(--theme-text)]"}`}
      >
        {value}
        {suffix && (
          <span className="text-sm font-normal text-[var(--theme-text-tertiary)]">
            {suffix}
          </span>
        )}
      </p>
      <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">
        {label}
      </p>
    </div>
  );
}
