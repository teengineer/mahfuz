import type { Exercise, ExerciseAttempt } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { ExerciseLayout } from "./ExerciseLayout";

interface WordBuildExerciseProps {
  exercise: Exercise;
  onAnswer: (attempt: ExerciseAttempt) => void;
  exerciseNumber: number;
  totalExercises: number;
}

export function WordBuildExercise({
  exercise,
  onAnswer,
  exerciseNumber,
  totalExercises,
}: WordBuildExerciseProps) {
  const { t } = useTranslation();

  const promptText =
    (t.learn.exercises as Record<string, string>)[
      exercise.promptKey.replace("exercises.", "")
    ] || exercise.promptKey;

  const correctOption = exercise.options.find((o) => o.isCorrect);
  const transliterationHint = correctOption?.text ?? "";

  const options = exercise.options.map((opt, i) => ({
    key: String(i),
    label: opt.text,
    isCorrect: opt.isCorrect,
  }));

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
            {exercise.arabicDisplay && (
              <div className="flex items-center justify-center rounded-xl bg-[var(--theme-bg)] py-6">
                <span
                  className="arabic-text text-[48px] leading-none text-[var(--theme-text)]"
                  dir="rtl"
                >
                  {exercise.arabicDisplay}
                </span>
              </div>
            )}
            {transliterationHint && (
              <p className="text-center text-[13px] italic text-[var(--theme-text-secondary)]">
                {transliterationHint}
              </p>
            )}
          </>
        }
        options={options}
        correctAnswerDisplay={
          correctOption ? <span>{correctOption.text}</span> : undefined
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
