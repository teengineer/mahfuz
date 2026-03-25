import type { MemorizeMode } from "~/stores/useMemorizationStore";
import { useTranslation } from "~/hooks/useTranslation";

interface ModeLayoutProps {
  mode: MemorizeMode;
  surahName: string;
  currentVerseIndex: number;
  totalVerses: number;
  onClose: () => void;
  children: React.ReactNode;
}

const modeBadgeColors: Record<MemorizeMode, string> = {
  learn: "bg-blue-500/10 text-blue-600",
  listen: "bg-purple-500/10 text-purple-600",
  test: "bg-emerald-500/10 text-emerald-600",
  type: "bg-amber-500/10 text-amber-600",
  immersive: "bg-slate-500/10 text-slate-600",
};

export function ModeLayout({
  mode,
  surahName,
  currentVerseIndex,
  totalVerses,
  onClose,
  children,
}: ModeLayoutProps) {
  const { t } = useTranslation();
  const progress = totalVerses > 0 ? ((currentVerseIndex + 1) / totalVerses) * 100 : 0;

  const modeLabels: Record<MemorizeMode, string> = {
    learn: t.memorize.modes.learn,
    listen: t.memorize.modes.listen,
    test: t.memorize.modes.test,
    type: t.memorize.modes.type,
    immersive: t.memorize.modes.immersive,
  };

  return (
    <div className="flex h-[100dvh] flex-col bg-[var(--theme-bg)]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[var(--theme-bg-primary)] px-4 pb-3 pt-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-medium ${modeBadgeColors[mode]}`}>
            {modeLabels[mode]}
          </span>

          <span className="text-[13px] tabular-nums text-[var(--theme-text-tertiary)]">
            {currentVerseIndex + 1} / {totalVerses}
          </span>
        </div>

        {/* Surah name */}
        <p className="mb-2 text-center text-[13px] font-medium text-[var(--theme-text-secondary)]">
          {surahName}
        </p>

        {/* Progress bar */}
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
