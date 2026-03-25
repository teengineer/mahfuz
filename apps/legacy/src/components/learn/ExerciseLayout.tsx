import { useState, useCallback } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "~/hooks/useTranslation";

/** Short success chime via Web Audio API — two ascending tones */
function playSuccessSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 523.25;
    gain1.gain.setValueAtTime(0.18, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc1.connect(gain1).connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 659.25;
    gain2.gain.setValueAtTime(0.18, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.3);

    setTimeout(() => ctx.close(), 500);
  } catch {
    // silent fallback
  }
}

/** Short error buzz — low tone */
function playErrorSound() {
  try {
    const ctx = new AudioContext();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);

    setTimeout(() => ctx.close(), 400);
  } catch {
    // silent fallback
  }
}

interface ExerciseOption {
  key: string;
  label: ReactNode;
  isCorrect: boolean;
}

interface ExerciseLayoutProps {
  prompt: ReactNode;
  options: ExerciseOption[];
  correctAnswerDisplay?: ReactNode;
  onNext: (selectedIndex: number, isCorrect: boolean) => void;
}

type Phase = "selecting" | "checked";

export function ExerciseLayout({
  prompt,
  options,
  correctAnswerDisplay,
  onNext,
}: ExerciseLayoutProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("selecting");
  const { t } = useTranslation();

  const handleSelect = useCallback(
    (index: number) => {
      if (phase === "checked") return;
      setSelectedIndex(index);
    },
    [phase],
  );

  const handleCheck = useCallback(() => {
    if (selectedIndex === null) return;
    setPhase("checked");
    if (options[selectedIndex].isCorrect) {
      playSuccessSound();
    } else {
      playErrorSound();
    }
  }, [selectedIndex, options]);

  const handleNext = useCallback(() => {
    if (selectedIndex === null) return;
    const isCorrect = options[selectedIndex].isCorrect;
    const idx = selectedIndex;
    setSelectedIndex(null);
    setPhase("selecting");
    onNext(idx, isCorrect);
  }, [selectedIndex, options, onNext]);

  const isCorrectAnswer =
    selectedIndex !== null ? options[selectedIndex].isCorrect : false;
  const correctIndex = options.findIndex((o) => o.isCorrect);

  return (
    <div className="flex flex-col gap-4">
      {/* Prompt area */}
      {prompt}

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {options.map((option, index) => {
          const isSelected = index === selectedIndex;
          const isCorrectOption = option.isCorrect;

          // In checked phase, hide irrelevant options
          if (phase === "checked" && !isSelected && !isCorrectOption) {
            return (
              <div
                key={option.key}
                className="w-full rounded-xl border-2 border-transparent bg-[var(--theme-bg)] px-4 py-3 text-center text-[14px] font-medium text-[var(--theme-text)] opacity-30 transition-all"
              >
                {option.label}
              </div>
            );
          }

          let className: string;

          if (phase === "checked") {
            if (isSelected && isCorrectOption) {
              // User picked the correct answer
              className =
                "w-full rounded-xl border-2 border-emerald-500 bg-emerald-500/15 px-4 py-3 text-center text-[14px] font-semibold text-emerald-700 transition-all";
            } else if (isSelected && !isCorrectOption) {
              // User picked wrong
              className =
                "w-full rounded-xl border-2 border-red-400 bg-red-500/10 px-4 py-3 text-center text-[14px] font-medium text-red-600 line-through decoration-2 transition-all";
            } else {
              // The correct option (not selected by user)
              className =
                "w-full rounded-xl border-2 border-emerald-500 bg-emerald-500/15 px-4 py-3 text-center text-[14px] font-semibold text-emerald-700 transition-all";
            }
          } else if (isSelected) {
            className =
              "w-full rounded-xl border-2 border-primary-500 bg-primary-500/10 px-4 py-3 text-center text-[14px] font-medium text-[var(--theme-text)] shadow-sm transition-all active:scale-[0.98]";
          } else {
            className =
              "w-full rounded-xl border-2 border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-3 text-center text-[14px] font-medium text-[var(--theme-text)] transition-all hover:bg-[var(--theme-hover-bg)] active:scale-[0.98]";
          }

          return (
            <button
              key={option.key}
              onClick={() => handleSelect(index)}
              disabled={phase === "checked"}
              className={className}
            >
              <span className="flex items-center justify-center gap-2">
                {/* Icon for checked state */}
                {phase === "checked" && isSelected && isCorrectOption && (
                  <svg className="h-5 w-5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {phase === "checked" && isSelected && !isCorrectOption && (
                  <svg className="h-5 w-5 shrink-0 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                {phase === "checked" && !isSelected && isCorrectOption && (
                  <svg className="h-5 w-5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback banner — only after CHECK */}
      {phase === "checked" && selectedIndex !== null && (
        <div
          className={`flex items-center gap-3 rounded-2xl px-5 py-4 ${
            isCorrectAnswer
              ? "bg-emerald-500/15 text-emerald-700"
              : "bg-red-500/10 text-red-700"
          }`}
        >
          {/* Large icon */}
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isCorrectAnswer ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {isCorrectAnswer ? (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold">
              {isCorrectAnswer ? t.learn.excellent : t.learn.incorrect}
            </p>
            {/* Show correct answer when wrong */}
            {!isCorrectAnswer && (
              <p className="mt-0.5 text-[13px] opacity-80">
                {correctAnswerDisplay ? (
                  <>
                    <span className="font-medium">{t.learn.correctAnswerLabel} </span>
                    {correctAnswerDisplay}
                  </>
                ) : correctIndex >= 0 ? (
                  <>
                    <span className="font-medium">{t.learn.correctAnswerLabel} </span>
                    {options[correctIndex].label}
                  </>
                ) : null}
              </p>
            )}
            {isCorrectAnswer && (
              <p className="mt-0.5 text-[13px] opacity-80">
                <span className="font-medium">{t.learn.correctAnswerLabel} </span>
                {correctAnswerDisplay ?? options[correctIndex]?.label}
              </p>
            )}
          </div>
        </div>
      )}

      {/* CHECK / NEXT button — sticky so it's always visible */}
      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-[var(--theme-bg)] from-60% to-transparent px-4 pt-4 pb-4 sm:-mx-6 sm:px-6">
        {phase === "selecting" ? (
          <button
            onClick={handleCheck}
            disabled={selectedIndex === null}
            className="w-full rounded-2xl px-6 py-3.5 text-[15px] font-bold tracking-wide uppercase transition-all active:scale-[0.97]"
            style={
              selectedIndex === null
                ? { background: "var(--theme-border)", color: "var(--theme-text-quaternary)" }
                : { background: "#f59e0b", color: "#fff", boxShadow: "0 8px 24px rgba(245, 158, 11, 0.3)" }
            }
          >
            {t.learn.check}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full rounded-2xl px-6 py-3.5 text-[15px] font-bold tracking-wide uppercase transition-all active:scale-[0.97]"
            style={
              isCorrectAnswer
                ? { background: "#059669", color: "#fff", boxShadow: "0 8px 24px rgba(5, 150, 105, 0.3)" }
                : { background: "#dc2626", color: "#fff", boxShadow: "0 8px 24px rgba(220, 38, 38, 0.3)" }
            }
          >
            {t.learn.nextButton}
          </button>
        )}
      </div>
    </div>
  );
}
