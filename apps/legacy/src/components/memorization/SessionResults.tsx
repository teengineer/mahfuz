import type { ModeResult, MemorizeMode } from "~/stores/useMemorizationStore";
import { useTranslation } from "~/hooks/useTranslation";
import { Button } from "~/components/ui/Button";

interface SessionResultsProps {
  result: ModeResult;
  onContinue: () => void;
}

const modeBadgeColors: Record<MemorizeMode, string> = {
  learn: "bg-blue-500/10 text-blue-600",
  listen: "bg-purple-500/10 text-purple-600",
  test: "bg-emerald-500/10 text-emerald-600",
  type: "bg-amber-500/10 text-amber-600",
  immersive: "bg-slate-500/10 text-slate-600",
};

export function SessionResults({ result, onContinue }: SessionResultsProps) {
  const { t } = useTranslation();

  const accuracy =
    result.totalWords > 0 ? Math.round((result.totalCorrect / result.totalWords) * 100) : 0;

  const modeLabels: Record<MemorizeMode, string> = {
    learn: t.memorize.modes.learn,
    listen: t.memorize.modes.listen,
    test: t.memorize.modes.test,
    type: t.memorize.modes.type,
    immersive: t.memorize.modes.immersive,
  };

  return (
    <div className="animate-scale-in rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      {/* Mode badge */}
      <div className="mb-4 flex justify-center">
        <span className={`rounded-full px-3 py-1 text-[13px] font-medium ${modeBadgeColors[result.mode]}`}>
          {modeLabels[result.mode]}
        </span>
      </div>

      <h2 className="mb-6 text-center text-xl font-bold text-[var(--theme-text)]">
        {t.memorize.results.title}
      </h2>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-[var(--theme-text)]">{result.totalWords}</p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">{t.memorize.results.total}</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-emerald-600">{result.totalCorrect}</p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">{t.memorize.results.correct}</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-primary-600">{accuracy}%</p>
          <p className="text-[12px] text-[var(--theme-text-tertiary)]">{t.memorize.results.accuracy}</p>
        </div>
      </div>

      {/* Per-verse breakdown */}
      <div className="mb-6 divide-y divide-[var(--theme-divider)] rounded-xl bg-[var(--theme-bg)] p-1">
        {result.verseResults.map((vr, i) => {
          const verseAccuracy = vr.wordsTotal > 0 ? Math.round((vr.wordsCorrect / vr.wordsTotal) * 100) : 0;
          return (
            <div key={i} className="flex items-center justify-between px-3 py-2">
              <span className="text-[13px] tabular-nums text-[var(--theme-text-secondary)]">
                {vr.verseKey}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">
                  {vr.wordsCorrect}/{vr.wordsTotal}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[12px] font-medium ${
                    verseAccuracy >= 80
                      ? "bg-emerald-500/10 text-emerald-500"
                      : verseAccuracy >= 50
                        ? "bg-amber-500/10 text-amber-500"
                        : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {verseAccuracy}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Button size="lg" fullWidth onClick={onContinue}>
        {t.memorize.results.continue}
      </Button>
    </div>
  );
}
