import { useMemo } from "react";
import type { Exercise, ExerciseAttempt } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { useLearnAudio } from "~/hooks/useLearnAudio";
import { ExerciseLayout } from "./ExerciseLayout";

interface SoundMatchExerciseProps {
  exercise: Exercise;
  onAnswer: (attempt: ExerciseAttempt) => void;
  exerciseNumber: number;
  totalExercises: number;
}

export function SoundMatchExercise({
  exercise,
  onAnswer,
  exerciseNumber,
  totalExercises,
}: SoundMatchExerciseProps) {
  const { t } = useTranslation();
  const { playAudioRef, isPlaying } = useLearnAudio();

  const shuffledOptions = useMemo(() => {
    const arr = [...exercise.options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [exercise.id]);

  const handlePlay = () => {
    if (exercise.audioRef) {
      playAudioRef(exercise.audioRef);
    }
  };

  const promptText =
    (t.learn.exercises as Record<string, string>)[
      exercise.promptKey.replace("exercises.", "")
    ] || exercise.promptKey;

  const options = shuffledOptions.map((opt, i) => ({
    key: String(i),
    label: opt.text,
    isCorrect: opt.isCorrect,
  }));

  const correctOpt = shuffledOptions.find((o) => o.isCorrect);

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      <ExerciseLayout
        prompt={
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-[12px] text-[var(--theme-text-tertiary)]">
                {exerciseNumber}/{totalExercises}
              </span>
              <span className="text-[12px] font-medium text-primary-600">
                +{exercise.sevapPointReward} {t.learn.pointLabel}
              </span>
            </div>
            <p className="mb-2 text-[14px] font-medium text-[var(--theme-text)]">
              {promptText}
            </p>
            <div className="mb-2 flex items-center justify-center">
              <button
                onClick={handlePlay}
                disabled={isPlaying}
                className={`flex h-20 w-20 items-center justify-center rounded-full border-2 transition-all ${
                  isPlaying
                    ? "border-primary-400 bg-primary-50 dark:bg-primary-950/30"
                    : "border-[var(--theme-border)] bg-[var(--theme-bg)] hover:border-primary-400 hover:bg-primary-50 active:scale-[0.95] dark:hover:bg-primary-950/30"
                }`}
                aria-label="Play audio"
              >
                {isPlaying ? (
                  <svg
                    className="h-8 w-8 animate-pulse text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707A1 1 0 0112 5.586v12.828a1 1 0 01-1.707.707L5.586 15z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-8 w-8 text-[var(--theme-text-secondary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.536 8.464a5 5 0 010 7.072M12 6.253v11.494m0 0A5.978 5.978 0 017.5 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h3.5A5.978 5.978 0 0112 6.253z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </>
        }
        options={options}
        correctAnswerDisplay={
          correctOpt ? <span>{correctOpt.text}</span> : undefined
        }
        onNext={(selectedIndex, isCorrect) => {
          onAnswer({
            exerciseId: exercise.id,
            selectedOptionIndex: selectedIndex,
            isCorrect,
            timestamp: Date.now(),
          });
        }}
      />
    </div>
  );
}
