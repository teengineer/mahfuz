import type { Exercise, ExerciseAttempt } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { ExerciseLayout } from "./ExerciseLayout";

interface TajweedIdentifyExerciseProps {
  exercise: Exercise;
  onAnswer: (attempt: ExerciseAttempt) => void;
  exerciseNumber: number;
  totalExercises: number;
}

function renderHighlightedArabic(arabicDisplay: string) {
  const markerRegex = /<<(.+?)>>/;
  const match = arabicDisplay.match(markerRegex);

  if (match) {
    const before = arabicDisplay.slice(0, match.index);
    const highlighted = match[1];
    const after = arabicDisplay.slice((match.index ?? 0) + match[0].length);

    return (
      <>
        {before && <span>{before}</span>}
        <span className="rounded-md bg-amber-200/70 px-1 py-0.5 dark:bg-amber-700/40">
          {highlighted}
        </span>
        {after && <span>{after}</span>}
      </>
    );
  }

  return <span>{arabicDisplay}</span>;
}

export function TajweedIdentifyExercise({
  exercise,
  onAnswer,
  exerciseNumber,
  totalExercises,
}: TajweedIdentifyExerciseProps) {
  const { t } = useTranslation();

  const promptText =
    (t.learn.exercises as Record<string, string>)[
      exercise.promptKey.replace("exercises.", "")
    ] || exercise.promptKey;

  const options = exercise.options.map((opt, i) => ({
    key: String(i),
    label: opt.text,
    isCorrect: opt.isCorrect,
  }));

  const correctOpt = exercise.options.find((o) => o.isCorrect);

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
                  {renderHighlightedArabic(exercise.arabicDisplay)}
                </span>
              </div>
            )}
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
