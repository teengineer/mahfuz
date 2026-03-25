import { useState } from "react";
import { useAudioStore } from "~/stores/useAudioStore";
import { ReciterModal } from "~/components/audio/ReciterModal";
import { CURATED_RECITERS } from "@mahfuz/shared/constants";
import { useTranslation } from "~/hooks/useTranslation";
import { SettingsLabel } from "./SettingsShared";

export function ReciterSection() {
  const { t } = useTranslation();
  const reciterId = useAudioStore((s) => s.reciterId);
  const [reciterModalOpen, setReciterModalOpen] = useState(false);
  const currentReciter = CURATED_RECITERS.find((r) => r.id === reciterId);

  return (
    <>
      <SettingsLabel label={t.settings.reciter} description={t.settings.reciterDesc} />
      <button
        type="button"
        onClick={() => setReciterModalOpen(true)}
        className="mt-3 flex w-full items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-3 text-left transition-colors hover:border-[var(--theme-divider)]"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600/10 text-[14px] font-semibold text-primary-700">
          {currentReciter?.name.charAt(0) ?? "?"}
        </div>
        <div className="flex-1 min-w-0">
          <span className="block truncate text-[14px] font-medium text-[var(--theme-text)]">
            {currentReciter?.name ?? "—"}
          </span>
          {currentReciter && (
            <span className="block text-[12px] text-[var(--theme-text-tertiary)]">
              {currentReciter.country} · {currentReciter.style}
            </span>
          )}
        </div>
        <span className="shrink-0 text-[12px] font-medium text-primary-600">
          {t.settings.changeReciter}
        </span>
      </button>
      <ReciterModal open={reciterModalOpen} onClose={() => setReciterModalOpen(false)} />
    </>
  );
}
