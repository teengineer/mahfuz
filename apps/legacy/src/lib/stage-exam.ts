import type { Stage, Exercise } from "@mahfuz/shared/types";

/**
 * Fisher-Yates shuffle (in-place)
 */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Collect exercises from all lessons in a stage, shuffle, and pick `count`.
 * Each exercise gets a new `exam-` prefixed ID to avoid collision with lesson progress tracking.
 */
export function generateStageExam(stage: Stage, count = 5): Exercise[] {
  const allExercises: Exercise[] = [];
  for (const lesson of stage.lessons) {
    for (const exercise of lesson.exercises) {
      allExercises.push(exercise);
    }
  }

  shuffle(allExercises);

  const selected = allExercises.slice(0, Math.min(count, allExercises.length));

  return selected.map((ex, i) => ({
    ...ex,
    id: `exam-${stage.id}-${i}`,
  }));
}

/** Minimum accuracy (0-100) to pass the stage exam */
export const EXAM_PASS_THRESHOLD = 80;

/** Default number of exam questions */
export const EXAM_QUESTION_COUNT = 5;
