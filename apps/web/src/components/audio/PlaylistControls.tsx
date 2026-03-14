import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePlaylistStore } from "~/stores/usePlaylistStore";
import { useTranslation } from "~/hooks/useTranslation";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";

export function PlaylistControls() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const items = usePlaylistStore((s) => s.items);
  const isActive = usePlaylistStore((s) => s.isActive);
  const currentItemIndex = usePlaylistStore((s) => s.currentItemIndex);
  const remainingRepeats = usePlaylistStore((s) => s.remainingRepeats);
  const isLoadingNext = usePlaylistStore((s) => s.isLoadingNext);
  const startPlaylist = usePlaylistStore((s) => s.startPlaylist);
  const stopPlaylist = usePlaylistStore((s) => s.stopPlaylist);
  const skipToNext = usePlaylistStore((s) => s.skipToNext);
  const clearPlaylist = usePlaylistStore((s) => s.clearPlaylist);

  const fetchAudio = useCallback(
    (reciterId: number, surahId: number) =>
      queryClient.fetchQuery(chapterAudioQueryOptions(reciterId, surahId)),
    [queryClient],
  );

  const currentItem = isActive && currentItemIndex < items.length
    ? items[currentItemIndex]
    : null;

  return (
    <div className="mt-4 space-y-3">
      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {isActive ? (
          <>
            <button
              onClick={stopPlaylist}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-2.5 text-[14px] font-semibold text-red-600 transition-colors hover:bg-red-500/20"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              {t.playlist.stopPlaylist}
            </button>
            <button
              onClick={() => skipToNext(fetchAudio)}
              disabled={currentItemIndex >= items.length - 1}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-bg-secondary)] px-4 py-2.5 text-[14px] font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-hover-bg)] disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.406 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" />
              </svg>
              {t.playlist.skipNext}
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => startPlaylist(fetchAudio)}
              disabled={items.length === 0}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-[14px] font-semibold text-white shadow-sm transition-colors hover:bg-primary-700 disabled:opacity-40"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
              </svg>
              {t.playlist.playAll}
            </button>
            {items.length > 0 && (
              <button
                onClick={clearPlaylist}
                className="flex items-center gap-1.5 rounded-xl bg-[var(--theme-bg-secondary)] px-4 py-2.5 text-[14px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
              >
                {t.playlist.clearAll}
              </button>
            )}
          </>
        )}
      </div>

      {/* Now playing indicator */}
      {isActive && currentItem && (
        <div className="flex items-center gap-2 rounded-xl bg-primary-50/50 px-4 py-2.5 dark:bg-primary-900/20">
          {isLoadingNext ? (
            <svg className="h-4 w-4 animate-spin text-primary-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary-500" />
          )}
          <span className="text-[13px] font-medium text-primary-700 dark:text-primary-300">
            {t.playlist.nowPlaying}: {currentItemIndex + 1}/{items.length} {currentItem.surahNameTr}
            {" "}({currentItem.fromVerse}-{currentItem.toVerse})
          </span>
          {currentItem.repeatCount > 1 && (
            <span className="ml-auto text-[12px] text-primary-500">
              {t.playlist.repeatProgress
                .replace("{current}", String(currentItem.repeatCount - remainingRepeats + 1))
                .replace("{total}", String(currentItem.repeatCount))}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
