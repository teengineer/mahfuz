import { useState } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { useAudioStore } from "~/stores/useAudioStore";
import { ReciterModal } from "./ReciterModal";
import { PlaylistBuilder } from "./PlaylistBuilder";
import { PlaylistControls } from "./PlaylistControls";
import { CURATED_RECITERS } from "@mahfuz/shared/constants";

export function AudioPage() {
  const { t } = useTranslation();
  const [reciterModalOpen, setReciterModalOpen] = useState(false);
  const reciterId = useAudioStore((s) => s.reciterId);

  const reciterName = CURATED_RECITERS.find((r) => r.id === reciterId)?.name ?? `Kârî #${reciterId}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-[var(--theme-text)]">
            {t.playlist.title}
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--theme-text-tertiary)]">
            {t.playlist.subtitle}
          </p>
        </div>

        {/* Reciter selector */}
        <button
          onClick={() => setReciterModalOpen(true)}
          className="flex items-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] px-3 py-2 text-[13px] font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-hover-bg)]"
        >
          <svg className="h-4 w-4 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
          </svg>
          <span className="max-w-[120px] truncate sm:max-w-none">{reciterName}</span>
          <svg className="h-3.5 w-3.5 text-[var(--theme-text-quaternary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </div>

      {/* Playlist builder */}
      <PlaylistBuilder />

      {/* Controls */}
      <PlaylistControls />

      {/* Reciter modal */}
      <ReciterModal
        open={reciterModalOpen}
        onClose={() => setReciterModalOpen(false)}
      />
    </div>
  );
}
