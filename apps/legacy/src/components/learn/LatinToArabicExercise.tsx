import { useMemo } from "react";
import type { Exercise, ExerciseAttempt } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { ExerciseLayout } from "./ExerciseLayout";

interface LatinToArabicExerciseProps {
  exercise: Exercise;
  onAnswer: (attempt: ExerciseAttempt) => void;
  exerciseNumber: number;
  totalExercises: number;
}

/**
 * Show Latin letter name → user picks the correct Arabic letter.
 * arabicDisplay holds the Latin name (e.g. "Be"), options have Arabic letters.
 */
export function LatinToArabicExercise({
  exercise,
  onAnswer,
  exerciseNumber,
  totalExercises,
}: LatinToArabicExerciseProps) {
  const { t } = useTranslation();

  const shuffledOptions = useMemo(() => {
    const arr = [...exercise.options];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [exercise.id]);

  const promptText =
    (t.learn.exercises as Record<string, string>)[
      exercise.promptKey.replace("exercises.", "")
    ] || exercise.promptKey;

  const options = shuffledOptions.map((opt, i) => ({
    key: String(i),
    label: (
      <span className="arabic-text text-[24px]" dir="rtl">
        {opt.text}
      </span>
    ),
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
            {/* Display the Latin name prominently */}
            {exercise.arabicDisplay && (
              <div className="flex items-center justify-center rounded-xl bg-[var(--theme-bg)] py-6">
                <span className="text-[36px] font-bold leading-none text-primary-700 dark:text-primary-400">
                  {exercise.arabicDisplay}
                </span>
              </div>
            )}
          </>
        }
        options={options}
        correctAnswerDisplay={
          correctOpt ? (
            <span className="arabic-text text-[20px]" dir="rtl">
              {correctOpt.text}
            </span>
          ) : undefined
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
