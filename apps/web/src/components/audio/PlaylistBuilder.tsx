import { useState } from "react";
import { usePlaylistStore } from "~/stores/usePlaylistStore";
import { useTranslation } from "~/hooks/useTranslation";
import { PlaylistItemRow } from "./PlaylistItemRow";
import { SurahPickerModal } from "./SurahPickerModal";

export function PlaylistBuilder() {
  const { t } = useTranslation();
  const [pickerOpen, setPickerOpen] = useState(false);

  const items = usePlaylistStore((s) => s.items);
  const isActive = usePlaylistStore((s) => s.isActive);
  const currentItemIndex = usePlaylistStore((s) => s.currentItemIndex);
  const addItem = usePlaylistStore((s) => s.addItem);
  const removeItem = usePlaylistStore((s) => s.removeItem);
  const updateItem = usePlaylistStore((s) => s.updateItem);
  const moveItem = usePlaylistStore((s) => s.moveItem);

  return (
    <div>
      {/* Add Surah button */}
      <button
        onClick={() => setPickerOpen(true)}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--theme-border)] py-3 text-[14px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:border-primary-500/40 hover:bg-primary-50/30 hover:text-primary-600 dark:hover:bg-primary-900/10"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
        {t.playlist.addSurah}
      </button>

      {/* Item list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg className="mb-3 h-12 w-12 text-[var(--theme-text-quaternary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
          </svg>
          <p className="text-[14px] font-medium text-[var(--theme-text-secondary)]">
            {t.playlist.empty}
          </p>
          <p className="mt-1 text-[13px] text-[var(--theme-text-tertiary)]">
            {t.playlist.emptyHint}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <PlaylistItemRow
              key={item.id}
              item={item}
              index={i}
              isPlaying={isActive && currentItemIndex === i}
              isFirst={i === 0}
              isLast={i === items.length - 1}
              onUpdate={updateItem}
              onRemove={removeItem}
              onMove={moveItem}
            />
          ))}
        </div>
      )}

      <SurahPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={addItem}
      />
    </div>
  );
}
