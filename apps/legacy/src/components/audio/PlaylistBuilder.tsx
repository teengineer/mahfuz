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
  const splitItem = usePlaylistStore((s) => s.splitItem);

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
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
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
              onSplit={splitItem}
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
