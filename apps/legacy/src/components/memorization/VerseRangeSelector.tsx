import { useState } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import type { MemorizeMode } from "~/stores/useMemorizationStore";

interface VerseRangeSelectorProps {
  versesCount: number;
  surahName: string;
  mode: MemorizeMode;
  onSelect: (range: { from: number; to: number }) => void;
  onBack: () => void;
}

const modeBadgeColors: Record<MemorizeMode, string> = {
  learn: "bg-blue-500/10 text-blue-600",
  listen: "bg-purple-500/10 text-purple-600",
  test: "bg-emerald-500/10 text-emerald-600",
  type: "bg-amber-500/10 text-amber-600",
  immersive: "bg-slate-500/10 text-slate-600",
};

function generateChunks(versesCount: number): { from: number; to: number }[] {
  const chunkSize = versesCount <= 20 ? 5 : 10;
  const chunks: { from: number; to: number }[] = [];
  for (let i = 1; i <= versesCount; i += chunkSize) {
    chunks.push({ from: i, to: Math.min(i + chunkSize - 1, versesCount) });
  }
  return chunks;
}

const modeLabels: Record<MemorizeMode, (t: any) => string> = {
  learn: (t) => t.memorize.modes.learn,
  listen: (t) => t.memorize.modes.listen,
  test: (t) => t.memorize.modes.test,
  type: (t) => t.memorize.modes.type,
  immersive: (t) => t.memorize.modes.immersive,
};

export function VerseRangeSelector({
  versesCount,
  surahName,
  mode,
  onSelect,
  onBack,
}: VerseRangeSelectorProps) {
  const { t } = useTranslation();
  const [showCustom, setShowCustom] = useState(false);
  const [customFrom, setCustomFrom] = useState(1);
  const [customTo, setCustomTo] = useState(versesCount);

  const chunks = generateChunks(versesCount);
  const rs = t.memorize.modes.rangeSelect;

  const handleCustomSubmit = () => {
    const from = Math.max(1, Math.min(customFrom, versesCount));
    const to = Math.max(from, Math.min(customTo, versesCount));
    onSelect({ from, to });
  };

  return (
    <div className="mx-auto max-w-lg p-4">
      {/* Header */}
      <div className="mb-6 text-center">
        <button
          onClick={onBack}
          className="absolute left-4 top-4 rounded-lg p-1.5 text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h1 className="arabic-text mb-1 text-[22px] font-bold text-[var(--theme-text)]">
          {surahName}
        </h1>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${modeBadgeColors[mode]}`}>
            {modeLabels[mode]?.(t) ?? mode}
          </span>
          <span className="text-[13px] text-[var(--theme-text-tertiary)]">
            · {rs.title}
          </span>
        </div>
      </div>

      {/* All Verses button */}
      <button
        onClick={() => onSelect({ from: 1, to: versesCount })}
        className="mb-4 w-full rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)] transition-all hover:shadow-md active:scale-[0.98]"
      >
        <div className="text-[15px] font-semibold text-[var(--theme-text)]">
          {rs.allVerses}
        </div>
        <div className="text-[12px] text-[var(--theme-text-tertiary)]">
          {versesCount} {t.memorize.verse.toLowerCase()}
        </div>
      </button>

      {/* Chunk grid */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        {chunks.map((chunk) => {
          const count = chunk.to - chunk.from + 1;
          return (
            <button
              key={`${chunk.from}-${chunk.to}`}
              onClick={() => onSelect(chunk)}
              className="rounded-2xl bg-[var(--theme-bg-primary)] p-3 shadow-[var(--shadow-card)] transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className="text-[14px] font-medium text-[var(--theme-text)]">
                {chunk.from}-{chunk.to}. {t.memorize.verse.toLowerCase()}
              </div>
              <div className="text-[11px] text-[var(--theme-text-tertiary)]">
                {count} {t.memorize.verse.toLowerCase()}
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Range toggle */}
      {!showCustom ? (
        <button
          onClick={() => setShowCustom(true)}
          className="w-full rounded-2xl border border-dashed border-[var(--theme-divider)] p-3 text-[13px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-hover-bg)]"
        >
          {rs.custom}
        </button>
      ) : (
        <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)]">
          <div className="mb-3 text-[13px] font-medium text-[var(--theme-text-secondary)]">
            {rs.custom}
          </div>
          <div className="mb-3 flex items-center gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-[11px] text-[var(--theme-text-tertiary)]">
                {rs.startLabel}
              </label>
              <input
                type="number"
                min={1}
                max={versesCount}
                value={customFrom}
                onChange={(e) => setCustomFrom(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--theme-divider)] bg-[var(--theme-bg)] px-3 py-2 text-[14px] text-[var(--theme-text)] outline-none focus:border-primary-500"
              />
            </div>
            <span className="mt-5 text-[var(--theme-text-tertiary)]">–</span>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] text-[var(--theme-text-tertiary)]">
                {rs.endLabel}
              </label>
              <input
                type="number"
                min={1}
                max={versesCount}
                value={customTo}
                onChange={(e) => setCustomTo(Number(e.target.value))}
                className="w-full rounded-xl border border-[var(--theme-divider)] bg-[var(--theme-bg)] px-3 py-2 text-[14px] text-[var(--theme-text)] outline-none focus:border-primary-500"
              />
            </div>
          </div>
          <button
            onClick={handleCustomSubmit}
            disabled={customFrom > customTo || customFrom < 1 || customTo > versesCount}
            className="w-full rounded-xl bg-primary-600 py-2.5 text-[14px] font-medium text-white transition-all hover:bg-primary-700 disabled:opacity-40"
          >
            {rs.start}
          </button>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className="mt-4 w-full rounded-xl border border-[var(--theme-divider)] py-2.5 text-[13px] font-medium text-[var(--theme-text-secondary)]"
      >
        ← {t.memorize.backToMemorize.replace("← ", "")}
      </button>
    </div>
  );
}
