import type { SideQuest, QuestWord } from "@mahfuz/shared/types";

export interface QuestExercise {
  word: QuestWord;
  options: QuestWord[]; // 4 options (1 correct + 3 distractors), shuffled
}

/**
 * Generate a quest session of N exercises from the quest's word bank.
 * Prioritizes words the user hasn't answered correctly yet.
 */
export function generateQuestSession(
  quest: SideQuest,
  correctWordIds: string[] = [],
): QuestExercise[] {
  const bank = quest.wordBank;
  const count = Math.min(quest.exercisesPerSession, bank.length);
  const correctSet = new Set(correctWordIds);

  // Partition into unseen/seen
  const unseen = bank.filter((w) => !correctSet.has(w.id));
  const seen = bank.filter((w) => correctSet.has(w.id));

  // Pick from unseen first, then fill from seen
  const shuffledUnseen = shuffle([...unseen]);
  const shuffledSeen = shuffle([...seen]);
  const selected = [...shuffledUnseen, ...shuffledSeen].slice(0, count);

  return selected.map((word) => {
    // Pick 3 distractors from the rest of the bank
    const distractors = shuffle(bank.filter((w) => w.id !== word.id)).slice(
      0,
      3,
    );
    const options = shuffle([word, ...distractors]);
    return { word, options };
  });
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
