import type { Exercise, LevelId, MatchingPair } from "@mahfuz/shared/types";
import { LEVELS, getLevelById } from "@mahfuz/shared/types";
import { getStagesByLevel } from "@mahfuz/shared/data/learn/curriculum";
import { ARABIC_ALPHABET } from "@mahfuz/shared/data/learn/alphabet";

/** Fisher-Yates shuffle (returns new array) */
function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Pick N random items from array */
function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

/**
 * Generate a latin_to_arabic exercise:
 * Show Latin name → pick correct Arabic letter from 4 options
 */
function generateLatinToArabicExercise(index: number): Exercise {
  const letters = shuffle(ARABIC_ALPHABET);
  const target = letters[0];
  const distractors = letters.slice(1, 4);

  return {
    id: `lvl-exam-lta-${index}`,
    type: "latin_to_arabic",
    promptKey: "exercises.latinToArabic",
    arabicDisplay: target.nameRoman, // Show Latin name in the display area
    options: shuffle([
      { text: target.forms.isolated, isCorrect: true },
      ...distractors.map((d) => ({ text: d.forms.isolated, isCorrect: false })),
    ]),
    sevapPointReward: 5,
  };
}

/**
 * Generate a letter_recognition exercise from alphabet:
 * Show Arabic letter → pick correct Latin name
 */
function generateLetterRecognitionExercise(index: number): Exercise {
  const letters = shuffle(ARABIC_ALPHABET);
  const target = letters[0];
  const distractors = letters.slice(1, 4);

  return {
    id: `lvl-exam-lr-${index}`,
    type: "letter_recognition",
    promptKey: "exercises.whichLetter",
    arabicDisplay: target.forms.isolated,
    options: shuffle([
      { text: target.nameRoman, isCorrect: true },
      ...distractors.map((d) => ({ text: d.nameRoman, isCorrect: false })),
    ]),
    sevapPointReward: 5,
  };
}

/**
 * Generate a matching exercise: 4 pairs of Arabic ↔ Latin
 * Returns as a standard Exercise with pairs encoded in the id
 */
function generateMatchingExercise(index: number): Exercise & { pairs: MatchingPair[] } {
  const letters = pickRandom(ARABIC_ALPHABET, 4);
  const pairs: MatchingPair[] = letters.map((l) => ({
    left: l.forms.isolated,
    right: l.nameRoman,
  }));

  return {
    id: `lvl-exam-match-${index}`,
    type: "matching",
    promptKey: "exercises.matchPairs",
    pairs,
    options: [], // matching uses pairs, not options
    sevapPointReward: 10,
  };
}

/**
 * Generate a level exam with mixed exercise types.
 * Pulls from all stages in the level + generates new exercise formats.
 */
export function generateLevelExam(levelId: LevelId): Exercise[] {
  const level = getLevelById(levelId);
  const stages = getStagesByLevel(levelId);
  const count = level.examQuestionCount;

  // Collect all exercises from stages in this level
  const stageExercises: Exercise[] = [];
  for (const stage of stages) {
    for (const lesson of stage.lessons) {
      for (const exercise of lesson.exercises) {
        stageExercises.push(exercise);
      }
    }
  }

  const exercises: Exercise[] = [];

  if (levelId === 1) {
    // Level 1: Heavy mix — letters, latin_to_arabic, matching, + stage exercises
    // 2 letter recognition, 2 latin_to_arabic, 1 matching, 5 from stages
    exercises.push(generateLetterRecognitionExercise(0));
    exercises.push(generateLetterRecognitionExercise(1));
    exercises.push(generateLatinToArabicExercise(2));
    exercises.push(generateLatinToArabicExercise(3));
    exercises.push(generateMatchingExercise(4));
    // Fill rest from stage exercises
    const stagePick = pickRandom(stageExercises, count - 5);
    exercises.push(...stagePick.map((ex, i) => ({ ...ex, id: `lvl-exam-s-${i}` })));
  } else if (levelId === 2) {
    // Level 2: 2 generated + 8 from stages (harakat, sukun, tanwin, shadda)
    exercises.push(generateLatinToArabicExercise(0));
    exercises.push(generateMatchingExercise(1));
    const stagePick = pickRandom(stageExercises, count - 2);
    exercises.push(...stagePick.map((ex, i) => ({ ...ex, id: `lvl-exam-s-${i}` })));
  } else {
    // Levels 3-4: All from stage exercises
    const stagePick = pickRandom(stageExercises, count);
    exercises.push(...stagePick.map((ex, i) => ({ ...ex, id: `lvl-exam-s-${i}` })));
  }

  return shuffle(exercises).slice(0, count);
}

/**
 * Generate a practice session (same as exam but no pass/fail — infinite retries)
 */
export function generateLevelPractice(levelId: LevelId, questionCount = 10): Exercise[] {
  return generateLevelExam(levelId);
}
