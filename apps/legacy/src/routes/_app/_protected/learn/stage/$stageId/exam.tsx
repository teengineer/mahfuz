import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { getStageById } from "@mahfuz/shared/data/learn/curriculum";
import { useLearnStore } from "~/stores/useLearnStore";
import { useTranslation } from "~/hooks/useTranslation";
import { EmojiIcon } from "~/components/icons/EmojiIcon";
import {
  ExerciseCard,
  SoundMatchExercise,
  WordBuildExercise,
  TajweedIdentifyExercise,
  LessonProgress,
} from "~/components/learn";
import type { Exercise, ExerciseAttempt } from "@mahfuz/shared/types";
import { learnRepository } from "@mahfuz/db";
import { generateStageExam, EXAM_PASS_THRESHOLD, EXAM_QUESTION_COUNT } from "~/lib/stage-exam";
import { resolveNestedKey } from "~/lib/i18n-utils";

export const Route = createFileRoute(
  "/_app/_protected/learn/stage/$stageId/exam",
)({
  component: StageExamPage,
});

function ExerciseDispatch(props: {
  exercise: Exercise;
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
    default:
      return <ExerciseCard {...props} />;
  }
}

function StageExamPage() {
  const { stageId } = Route.useParams();
  const { t } = useTranslation();
  const router = useRouter();
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const stageIdNum = Number(stageId);
  const stage = getStageById(stageIdNum);
  const store = useLearnStore();

  const [examExercises] = useState<Exercise[]>(() => {
    if (!stage) return [];
    return generateStageExam(stage, EXAM_QUESTION_COUNT);
  });

  const [phase, setPhase] = useState<"exercise" | "results">("exercise");
  const [saving, setSaving] = useState(false);

  // Initialize store for exam session
  useState(() => {
    store.startLesson(`exam-${stageId}`);
  });

  const handleAnswer = useCallback(
    (attempt: ExerciseAttempt) => {
      store.recordAttempt(attempt);

      const nextIndex = store.currentExerciseIndex + 1;
      if (nextIndex >= examExercises.length) {
        setPhase("results");
      } else {
        store.nextExercise();
      }
    },
    [store, examExercises.length],
  );

  const handlePassExam = useCallback(async () => {
    if (!stage || saving) return;
    setSaving(true);

    // Mark all lessons as completed
    const now = Date.now();
    for (const lesson of stage.lessons) {
      await learnRepository.upsertLessonProgress({
        id: `${userId}-${lesson.id}`,
        userId,
        stageId: stageIdNum,
        lessonId: lesson.id,
        status: "completed",
        score: 100,
        sevapPointEarned: 0,
        completedAt: now,
        updatedAt: now,
      });
    }

    setSaving(false);
    router.navigate({ to: "/learn/stage/$stageId", params: { stageId } });
  }, [stage, userId, stageIdNum, stageId, router, saving]);

  const handleRetry = useCallback(() => {
    if (!stage) return;
    const newExercises = generateStageExam(stage, EXAM_QUESTION_COUNT);
    // We need to remount — simplest is navigate to same page
    store.startLesson(`exam-${stageId}`);
    setPhase("exercise");
    // Force re-render with new exercises
    window.location.reload();
  }, [stage, store, stageId]);

  if (!stage || examExercises.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-[var(--theme-text-secondary)]">{t.error.notFound}</p>
      </div>
    );
  }

  const title = resolveNestedKey(t.learn as Record<string, any>, stage.titleKey) || stage.titleKey;

  // Results phase
  if (phase === "results") {
    const freshState = useLearnStore.getState();
    const correctCount = freshState.attempts.filter((a) => a.isCorrect).length;
    const accuracy = Math.round((correctCount / examExercises.length) * 100);
    const passed = accuracy >= EXAM_PASS_THRESHOLD;

    return (
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
        <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mb-3 flex justify-center"><EmojiIcon emoji={passed ? "🎉" : "📝"} className="h-12 w-12" /></div>
            <h2 className="text-xl font-bold text-[var(--theme-text)]">
              {passed ? t.learn.examPassed : t.learn.examFailed}
            </h2>
            <p className="mt-2 text-[13px] text-[var(--theme-text-secondary)]">
              {passed ? t.learn.examPassedDesc : t.learn.examFailedDesc}
            </p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[var(--theme-bg)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--theme-text)]">{examExercises.length}</p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.memorize.results.total}</p>
            </div>
            <div className="rounded-xl bg-[var(--theme-bg)] p-3 text-center">
              <p className={`text-2xl font-bold ${passed ? "text-emerald-600" : "text-red-500"}`}>{correctCount}</p>
              <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.memorize.results.correct}</p>
            </div>
          </div>

          {/* Accuracy bar */}
          <div className="mb-6">
            <div className="mb-1 flex items-center justify-between text-[12px]">
              <span className="text-[var(--theme-text-secondary)]">{t.memorize.results.accuracy}</span>
              <span className="font-semibold text-[var(--theme-text)]">%{accuracy}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--theme-bg)]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  passed ? "bg-emerald-500" : "bg-red-500"
                }`}
                style={{ width: `${accuracy}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {passed ? (
              <button
                onClick={handlePassExam}
                disabled={saving}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-[14px] font-medium text-white transition-all hover:bg-emerald-700 active:scale-[0.97] disabled:opacity-50"
              >
                {t.memorize.results.continue}
              </button>
            ) : (
              <>
                <Link
                  to="/learn/stage/$stageId"
                  params={{ stageId }}
                  className="flex-1 rounded-xl border-2 border-[var(--theme-border)] px-4 py-3 text-center text-[14px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-hover-bg)] active:scale-[0.97]"
                >
                  {t.common.back}
                </Link>
                <button
                  onClick={handleRetry}
                  className="flex-1 rounded-xl bg-primary-600 px-4 py-3 text-[14px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97]"
                >
                  {t.learn.retryExam}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Exercise phase
  const currentExercise = examExercises[store.currentExerciseIndex];
  if (!currentExercise) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 sm:py-8">
      {/* Header */}
      <div className="mb-4">
        <Link
          to="/learn/stage/$stageId"
          params={{ stageId }}
          className="mb-3 inline-flex items-center gap-1 text-[13px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t.common.back}
        </Link>

        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
            {t.learn.takeExam}
          </span>
          <span className="text-[13px] text-[var(--theme-text-secondary)]">{title}</span>
        </div>

        <LessonProgress
          current={store.currentExerciseIndex}
          total={examExercises.length}
          sevapPoint={store.sessionSevapPoint}
        />
      </div>

      <ExerciseDispatch
        exercise={currentExercise}
        onAnswer={handleAnswer}
        exerciseNumber={store.currentExerciseIndex + 1}
        totalExercises={examExercises.length}
      />
    </div>
  );
}
