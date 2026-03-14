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
}

export function PlaylistItemRow({
  item,
  index,
  isPlaying,
  isFirst,
  isLast,
  onUpdate,
  onRemove,
  onMove,
}: PlaylistItemRowProps) {
  const { t } = useTranslation();

  const isAllVerses = item.fromVerse === 1 && item.toVerse === item.versesCount;

  return (
    <div
      className={`rounded-xl border p-3 transition-colors ${
        isPlaying
          ? "border-primary-500/40 bg-primary-50/50 dark:bg-primary-900/20"
          : "border-[var(--theme-border)] bg-[var(--theme-bg-secondary)]"
      }`}
    >
      {/* Top row: index, name, remove */}
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--theme-bg-tertiary)] text-[11px] font-semibold text-[var(--theme-text-secondary)]">
          {index + 1}
        </span>
        {isPlaying && (
          <span className="flex h-4 w-4 items-center justify-center">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-500" />
          </span>
        )}
        <span className="flex-1 min-w-0">
          <span className="block truncate text-[14px] font-medium text-[var(--theme-text)]">
            {item.surahNameTr}
          </span>
          <span className="block text-[12px] text-[var(--theme-text-tertiary)]">
            {item.surahNameAr}
          </span>
        </span>
        <div className="flex items-center gap-1">
          {!isFirst && (
            <button
              onClick={() => onMove(index, index - 1)}
              className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.playlist.moveUp}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
            </button>
          )}
          {!isLast && (
            <button
              onClick={() => onMove(index, index + 1)}
              className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.playlist.moveDown}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
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

      {/* Bottom row: verse range + repeat */}
      <div className="flex items-center gap-3 text-[13px]">
        {/* Verse range */}
        <div className="flex items-center gap-1.5">
          <span className="text-[var(--theme-text-tertiary)]">{t.playlist.verseRange}:</span>
          <input
            type="number"
            min={1}
            max={item.toVerse}
            value={item.fromVerse}
            onChange={(e) => {
              const v = Math.max(1, Math.min(item.toVerse, Number(e.target.value) || 1));
              onUpdate(item.id, { fromVerse: v });
            }}
            className="w-14 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-2 py-1 text-center text-[13px] text-[var(--theme-text)] outline-none focus:border-primary-500/40"
          />
          <span className="text-[var(--theme-text-quaternary)]">–</span>
          <input
            type="number"
            min={item.fromVerse}
            max={item.versesCount}
            value={item.toVerse}
            onChange={(e) => {
              const v = Math.max(item.fromVerse, Math.min(item.versesCount, Number(e.target.value) || item.fromVerse));
              onUpdate(item.id, { toVerse: v });
            }}
            className="w-14 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-2 py-1 text-center text-[13px] text-[var(--theme-text)] outline-none focus:border-primary-500/40"
          />
          {isAllVerses && (
            <span className="text-[11px] text-[var(--theme-text-quaternary)]">({t.playlist.allVerses})</span>
          )}
        </div>

        {/* Repeat */}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[var(--theme-text-tertiary)]">{t.playlist.repeat}:</span>
          <select
            value={item.repeatCount}
            onChange={(e) => onUpdate(item.id, { repeatCount: Number(e.target.value) })}
            className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-2 py-1 text-[13px] text-[var(--theme-text)] outline-none focus:border-primary-500/40"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}x
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
