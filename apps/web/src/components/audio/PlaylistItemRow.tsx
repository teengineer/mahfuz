import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import type { PlaylistItem } from "~/stores/usePlaylistStore";

interface PlaylistItemRowProps {
  item: PlaylistItem;
  index: number;
  isPlaying: boolean;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (id: string, patch: Partial<Pick<PlaylistItem, "fromVerse" | "toVerse" | "repeatCount">>) => void;
  onRemove: (id: string) => void;
  onMove: (fromIndex: number, toIndex: number) => void;
  onSplit: (id: string, chunkSize: number) => void;
}

/* ── Dual-thumb range slider ── */

function VerseRangeSlider({
  min,
  max,
  from,
  to,
  onChange,
}: {
  min: number;
  max: number;
  from: number;
  to: number;
  onChange: (from: number, to: number) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"from" | "to" | null>(null);

  const pct = (v: number) => ((v - min) / (max - min)) * 100;
  const leftPct = pct(from);
  const rightPct = pct(to);

  const valueFromX = useCallback(
    (clientX: number) => {
      const rect = trackRef.current!.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(min + ratio * (max - min));
    },
    [min, max],
  );

  const handlePointerDown = useCallback(
    (thumb: "from" | "to") => (e: React.PointerEvent) => {
      e.preventDefault();
      dragging.current = thumb;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current) return;
      const val = valueFromX(e.clientX);
      if (dragging.current === "from") {
        onChange(Math.min(val, to), to);
      } else {
        onChange(from, Math.max(val, from));
      }
    },
    [from, to, onChange, valueFromX],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = null;
  }, []);

  // Tap on track → move nearest thumb
  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).dataset.thumb) return;
      const val = valueFromX(e.clientX);
      const distFrom = Math.abs(val - from);
      const distTo = Math.abs(val - to);
      if (distFrom <= distTo) {
        onChange(Math.min(val, to), to);
      } else {
        onChange(from, Math.max(val, from));
      }
    },
    [from, to, onChange, valueFromX],
  );

  if (max <= 1) return null;

  return (
    <div
      ref={trackRef}
      className="relative h-10 w-full touch-none select-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleTrackClick}
    >
      {/* Track bg */}
      <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-[var(--theme-bg-tertiary)]" />
      {/* Active range */}
      <div
        className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-primary-500/70"
        style={{ left: `${leftPct}%`, width: `${rightPct - leftPct}%` }}
      />
      {/* From thumb */}
      <div
        data-thumb="from"
        className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-primary-500 bg-white shadow-sm active:cursor-grabbing active:scale-110 dark:bg-[var(--theme-bg-secondary)]"
        style={{ left: `${leftPct}%` }}
        onPointerDown={handlePointerDown("from")}
      />
      {/* To thumb */}
      <div
        data-thumb="to"
        className="absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full border-2 border-primary-500 bg-white shadow-sm active:cursor-grabbing active:scale-110 dark:bg-[var(--theme-bg-secondary)]"
        style={{ left: `${rightPct}%` }}
        onPointerDown={handlePointerDown("to")}
      />
    </div>
  );
}

/* ── Editable verse number (text input, allows clearing) ── */

function VerseInput({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const [draft, setDraft] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    // Only sync if not focused (user isn't typing)
    if (document.activeElement !== inputRef.current) {
      setDraft(String(value));
    }
  }, [value]);

  const commit = () => {
    const n = parseInt(draft, 10);
    if (!isNaN(n) && n >= min && n <= max) {
      onChange(n);
      setDraft(String(n));
    } else {
      // Reset to current value
      setDraft(String(value));
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft}
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") { commit(); inputRef.current?.blur(); } }}
      className="w-12 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-1.5 py-1 text-center text-[13px] font-medium text-[var(--theme-text)] outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/30"
    />
  );
}

/* ── Quick range presets ── */

function QuickRangePresets({
  versesCount,
  fromVerse,
  toVerse,
  onChange,
}: {
  versesCount: number;
  fromVerse: number;
  toVerse: number;
  onChange: (from: number, to: number) => void;
}) {
  const { t } = useTranslation();
  const isAll = fromVerse === 1 && toVerse === versesCount;

  // Generate smart presets based on surah length
  const presets: { label: string; from: number; to: number }[] = [];

  // "Tümü" always
  presets.push({ label: t.playlist.allVerses, from: 1, to: versesCount });

  if (versesCount > 5) {
    // İlk 5, İlk 10, Son 5, İlk yarı, Son yarı
    presets.push({ label: `1-5`, from: 1, to: 5 });
    if (versesCount > 15) {
      presets.push({ label: `1-10`, from: 1, to: 10 });
    }
    const half = Math.ceil(versesCount / 2);
    presets.push({ label: `1-${half}`, from: 1, to: half });
    presets.push({ label: `${half + 1}-${versesCount}`, from: half + 1, to: versesCount });
    presets.push({
      label: `${versesCount - 4}-${versesCount}`,
      from: versesCount - 4,
      to: versesCount,
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((p) => {
        const active = fromVerse === p.from && toVerse === p.to;
        return (
          <button
            key={`${p.from}-${p.to}`}
            onClick={() => onChange(p.from, p.to)}
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
              active
                ? "bg-primary-600 text-white"
                : "bg-[var(--theme-bg-tertiary)] text-[var(--theme-text-secondary)] hover:bg-primary-100 hover:text-primary-700 dark:hover:bg-primary-900/30"
            }`}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Main Component ── */

export function PlaylistItemRow({
  item,
  index,
  isPlaying,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMove,
  onSplit,
}: PlaylistItemRowProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const isAllVerses = item.fromVerse === 1 && item.toVerse === item.versesCount;
  const verseCount = item.toVerse - item.fromVerse + 1;
  const isInfinite = item.repeatCount === 0;

  const handleRangeChange = useCallback(
    (from: number, to: number) => {
      onUpdate(item.id, { fromVerse: from, toVerse: to });
    },
    [item.id, onUpdate],
  );

  return (
    <div
      className={`rounded-xl border transition-colors ${
        isPlaying
          ? "border-primary-500/40 bg-primary-50/50 dark:bg-primary-900/20"
          : "border-[var(--theme-border)] bg-[var(--theme-bg-secondary)]"
      }`}
    >
      {/* ── Header row: name + summary + actions ── */}
      <div className="flex items-center gap-2 p-3 pb-0">
        {/* Index badge */}
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--theme-bg-tertiary)] text-[12px] font-bold text-[var(--theme-text-secondary)]">
          {index + 1}
        </span>

        {isPlaying && (
          <span className="flex h-4 w-4 flex-shrink-0 items-center justify-center">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-500" />
          </span>
        )}

        {/* Surah info */}
        <button
          className="flex flex-1 min-w-0 flex-col items-start"
          onClick={() => setExpanded(!expanded)}
        >
          <span className="block truncate text-[15px] font-semibold text-[var(--theme-text)]">
            {item.surahNameTr}
          </span>
          <span className="block text-[12px] text-[var(--theme-text-tertiary)]">
            {item.surahNameAr}
            {" · "}
            {isAllVerses
              ? t.playlist.allVerses
              : `${item.fromVerse}-${item.toVerse}`}
            {!isInfinite && item.repeatCount > 1 && ` · ${item.repeatCount}x`}
            {isInfinite && " · ∞"}
          </span>
        </button>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {/* Expand/collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`rounded-lg p-1.5 transition-colors ${expanded ? "bg-primary-100 text-primary-600 dark:bg-primary-900/30" : "text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"}`}
            aria-label={expanded ? t.audio.collapse : t.audio.expand}
          >
            <svg className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Remove */}
          <button
            onClick={() => onRemove(item.id)}
            className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
            aria-label={t.playlist.remove}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Collapsed: compact verse range + repeat ── */}
      {!expanded && (
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="flex items-center gap-1.5 text-[13px]">
            <span className="text-[var(--theme-text-tertiary)]">{t.playlist.verseRange}:</span>
            <VerseInput
              value={item.fromVerse}
              min={1}
              max={item.toVerse}
              onChange={(v) => onUpdate(item.id, { fromVerse: v })}
            />
            <span className="text-[var(--theme-text-quaternary)]">–</span>
            <VerseInput
              value={item.toVerse}
              min={item.fromVerse}
              max={item.versesCount}
              onChange={(v) => onUpdate(item.id, { toVerse: v })}
            />
          </div>

          {/* Repeat compact */}
          <div className="ml-auto flex items-center gap-1">
            <RepeatStepper
              repeatCount={item.repeatCount}
              isInfinite={isInfinite}
              onChange={(rc) => onUpdate(item.id, { repeatCount: rc })}
            />
          </div>
        </div>
      )}

      {/* ── Expanded: slider + presets + reorder + split ── */}
      {expanded && (
        <div className="px-3 pb-3 pt-1 space-y-3">
          {/* Range slider */}
          {item.versesCount > 1 && (
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[12px] font-medium text-[var(--theme-text-secondary)]">
                  {t.playlist.verseRange}
                </span>
                <span className="text-[12px] text-[var(--theme-text-tertiary)]">
                  {item.fromVerse} – {item.toVerse}
                  <span className="ml-1 text-[var(--theme-text-quaternary)]">
                    ({verseCount} {t.common.verse.toLowerCase()})
                  </span>
                </span>
              </div>

              <VerseRangeSlider
                min={1}
                max={item.versesCount}
                from={item.fromVerse}
                to={item.toVerse}
                onChange={handleRangeChange}
              />

              {/* Editable inputs under slider */}
              <div className="flex items-center justify-between mt-0.5">
                <VerseInput
                  value={item.fromVerse}
                  min={1}
                  max={item.toVerse}
                  onChange={(v) => onUpdate(item.id, { fromVerse: v })}
                />
                <VerseInput
                  value={item.toVerse}
                  min={item.fromVerse}
                  max={item.versesCount}
                  onChange={(v) => onUpdate(item.id, { toVerse: v })}
                />
              </div>

              {/* Quick presets */}
              <div className="mt-2">
                <QuickRangePresets
                  versesCount={item.versesCount}
                  fromVerse={item.fromVerse}
                  toVerse={item.toVerse}
                  onChange={handleRangeChange}
                />
              </div>
            </div>
          )}

          {/* Repeat */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--theme-text-secondary)]">
              {t.playlist.repeat}
            </span>
            <RepeatStepper
              repeatCount={item.repeatCount}
              isInfinite={isInfinite}
              onChange={(rc) => onUpdate(item.id, { repeatCount: rc })}
            />
          </div>

          {/* Actions row: move + split */}
          <div className="flex items-center gap-2 border-t border-[var(--theme-border)] pt-2">
            {/* Move */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onMove(index, index - 1)}
                disabled={isFirst}
                className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] disabled:opacity-30"
                aria-label={t.playlist.moveUp}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={() => onMove(index, index + 1)}
                disabled={isLast}
                className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] disabled:opacity-30"
                aria-label={t.playlist.moveDown}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Split */}
            {verseCount > 1 && (
              <div className="ml-auto flex items-center gap-1.5">
                <span className="text-[12px] text-[var(--theme-text-tertiary)]">{t.playlist.splitInto}:</span>
                {[1, 2, 3, 5, 10].filter((n) => n < verseCount).map((n) => (
                  <button
                    key={n}
                    onClick={() => onSplit(item.id, n)}
                    className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-2 py-0.5 text-[11px] font-medium text-[var(--theme-text)] transition-colors hover:border-primary-500/40 hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
                  >
                    {n === 1
                      ? t.playlist.perVerse
                      : t.playlist.nVerses.replace("{n}", String(n))}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Repeat stepper ── */

function RepeatStepper({
  repeatCount,
  isInfinite,
  onChange,
}: {
  repeatCount: number;
  isInfinite: boolean;
  onChange: (rc: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      {/* Decrement */}
      <button
        onClick={() => {
          if (isInfinite) onChange(10);
          else if (repeatCount > 1) onChange(repeatCount - 1);
        }}
        disabled={!isInfinite && repeatCount <= 1}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input-bg)] text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)] disabled:opacity-30"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        </svg>
      </button>
      {/* Value */}
      <span className="flex h-7 min-w-[28px] items-center justify-center text-[13px] font-semibold text-[var(--theme-text)]">
        {isInfinite ? "∞" : `${repeatCount}x`}
      </span>
      {/* Increment */}
      <button
        onClick={() => {
          if (!isInfinite) onChange(repeatCount + 1);
        }}
        disabled={isInfinite}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input-bg)] text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)] disabled:opacity-30"
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
      {/* Infinity toggle */}
      <button
        onClick={() => onChange(isInfinite ? 1 : 0)}
        className={`ml-0.5 flex h-7 w-7 items-center justify-center rounded-lg border text-[14px] font-bold transition-colors ${
          isInfinite
            ? "border-primary-500/40 bg-primary-100 text-primary-600 dark:bg-primary-900/30"
            : "border-[var(--theme-border)] bg-[var(--theme-input-bg)] text-[var(--theme-text-quaternary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text-secondary)]"
        }`}
        aria-label="∞"
      >
        ∞
      </button>
    </div>
  );
}
