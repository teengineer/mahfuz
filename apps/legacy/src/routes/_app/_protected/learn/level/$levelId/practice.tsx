import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { getLevelById, type LevelId, type MatchingPair } from "@mahfuz/shared/types";
import { useLearnStore } from "~/stores/useLearnStore";
import { useTranslation } from "~/hooks/useTranslation";
import { EmojiIcon } from "~/components/icons/EmojiIcon";
import { resolveNestedKey } from "~/lib/i18n-utils";
import {
  ExerciseCard,
  SoundMatchExercise,
  WordBuildExercise,
  TajweedIdentifyExercise,
  LatinToArabicExercise,
  MatchingExercise,
  LessonProgress,
} from "~/components/learn";
import type { Exercise, ExerciseAttempt } from "@mahfuz/shared/types";
import { generateLevelPractice } from "~/lib/level-exam";

export const Route = createFileRoute(
  "/_app/_protected/learn/level/$levelId/practice",
)({
  component: LevelPracticePage,
});

function ExerciseDispatch(props: {
  exercise: Exercise & { pairs?: MatchingPair[] };
  onAnswer: (a: ExerciseAttempt) => void;
  exerciseNumber: number;
  totalExercises: number;
}) {
  switch (props.exercise.type) {
    case "sound_match":
      return <SoundMatchExercise {...props} />;
    case "word_build":
      return <WordBuildExercise {...props} />;
    case "tajweed_identify":
      return <TajweedIdentifyExercise {...props} />;
    case "latin_to_arabic":
      return <LatinToArabicExercise {...props} />;
    case "matching":
      return (
        <MatchingExercise
          exercise={props.exercise as Exercise & { pairs: MatchingPair[] }}
          onAnswer={props.onAnswer}
          exerciseNumber={props.exerciseNumber}
          totalExercises={props.totalExercises}
        />
      );
    default:
      return <ExerciseCard {...props} />;
  }
}

function LevelPracticePage() {
  const { levelId: levelIdStr } = Route.useParams();
  const { t } = useTranslation();
  const levelId = Number(levelIdStr) as LevelId;
  const level = getLevelById(levelId);
  const store = useLearnStore();

  const [exercises] = useState<Exercise[]>(() => {
    if (!level) return [];
    return generateLevelPractice(levelId);
  });

  const [phase, setPhase] = useState<"exercise" | "results">("exercise");

  useState(() => {
    store.startLesson(`level-practice-${levelId}`);
  });

  const handleAnswer = useCallback(
    (attempt: ExerciseAttempt) => {
      store.recordAttempt(attempt);
      const nextIndex = store.currentExerciseIndex + 1;
      if (nextIndex >= exercises.length) {
        setPhase("results");
      } else {
        store.nextExercise();
      }
    },
    [store, exercises.length],
  );

  const handleRetry = useCallback(() => {
    store.startLesson(`level-practice-${levelId}`);
    setPhase("exercise");
    window.location.reload();
  }, [store, levelId]);

  if (!level || exercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--theme-text-secondary)]">{t.error.notFound}</p>
      </div>
    );
  }

  const title = resolveNestedKey(t.learn as Record<string, any>, level.titleKey) || level.titleKey;

  if (phase === "results") {
    const freshState = useLearnStore.getState();
    const correctCount = freshState.attempts.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((correctCount / exercises.length) * 100);

    return (
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center"><EmojiIcon emoji={level.icon} className="h-12 w-12" /></div>
            <h2 className="text-xl font-bold text-[var(--theme-text)]">
              {t.learn.levels.practice} — {title}
            </h2>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[var(--theme-bg)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--theme-text)]">{exercises.length}</p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.memorize.results.total}</p>
            </div>
            <div className="rounded-xl bg-[var(--theme-bg)] p-3 text-center">
              <p className={`text-2xl font-bold ${accuracy >= 80 ? "text-emerald-600" : "text-amber-600"}`}>
                {correctCount}
              </p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.memorize.results.correct}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="text-[var(--theme-text-secondary)]">{t.memorize.results.accuracy}</span>
              <span className="font-semibold text-[var(--theme-text)]">%{accuracy}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--theme-bg)]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${accuracy >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              to="/library/courses"
              className="flex-1 rounded-xl border-2 border-[var(--theme-border)] px-4 py-3 text-center text-[14px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-hover-bg)] active:scale-[0.97]"
            >
              {t.common.back}
            </Link>
            <button
              onClick={handleRetry}
              className="flex-1 rounded-xl bg-primary-600 px-4 py-3 text-[14px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
            >
              {t.learn.retry}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentExercise = exercises[store.currentExerciseIndex];
  if (!currentExercise) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-4">
        <Link
          to="/library/courses"
          className="mb-3 inline-flex items-center gap-1 text-[13px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.common.back}
        </Link>

        <div className="mb-2 flex items-center gap-2">
          <EmojiIcon emoji={level.icon} className="h-5 w-5" />
          <span className="rounded-md bg-primary-100 px-2 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
            {t.learn.levels.practice}
          </span>
          <span className="text-[13px] text-[var(--theme-text-secondary)]">{title}</span>
        </div>

        <LessonProgress
          current={store.currentExerciseIndex}
          total={exercises.length}
          sevapPoint={store.sessionSevapPoint}
        />
      </div>

      <ExerciseDispatch
        exercise={currentExercise as Exercise & { pairs?: MatchingPair[] }}
        onAnswer={handleAnswer}
        exerciseNumber={store.currentExerciseIndex + 1}
        totalExercises={exercises.length}
      />
    </div>
  );
}
