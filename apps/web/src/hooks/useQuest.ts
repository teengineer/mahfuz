import { useState, useEffect, useCallback, useMemo } from "react";
import { SIDE_QUESTS, getQuestById } from "@mahfuz/shared/data/learn/quests";
import { questRepository } from "@mahfuz/db";
import type { QuestProgressEntry } from "@mahfuz/db";
import { generateQuestSession, type QuestExercise } from "~/lib/quest-exercises";
import { useLearnStore } from "~/stores/useLearnStore";

export function useQuestDashboard(userId: string) {
  const [progressMap, setProgressMap] = useState<Map<string, QuestProgressEntry>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    questRepository.getAllQuestProgress(userId).then((entries) => {
      if (cancelled) return;
      const map = new Map<string, QuestProgressEntry>();
      for (const e of entries) {
        map.set(e.questId, e);
      }
      setProgressMap(map);
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId]);

  return { quests: SIDE_QUESTS, progressMap, isLoading };
}

export function useQuestSession(questId: string, userId: string) {
  const quest = useMemo(() => getQuestById(questId), [questId]);
  const store = useLearnStore();

  const [progress, setProgress] = useState<QuestProgressEntry | null>(null);
  const [exercises, setExercises] = useState<QuestExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [correctWordIds, setCorrectWordIds] = useState<string[]>([]);

  // Load progress on mount
  useEffect(() => {
    let cancelled = false;
    questRepository.getQuestProgress(userId, questId).then((p) => {
      if (cancelled) return;
      setProgress(p || null);
      setIsLoading(false);
    });
    return () => { cancelled = true; };
  }, [userId, questId]);

  const startSession = useCallback(() => {
    if (!quest) return;
    const exs = generateQuestSession(quest, progress?.wordsCorrect || []);
    setExercises(exs);
    setCorrectWordIds([]);
    store.startQuest(questId, exs.length);
  }, [quest, progress, questId, store]);

  const recordAnswer = useCallback(
    (exerciseIndex: number, selectedWordId: string, isCorrect: boolean) => {
      if (!quest) return;
      const exercise = exercises[exerciseIndex];
      if (!exercise) return;

      store.recordAttempt({
        exerciseId: exercise.word.id,
        selectedOptionIndex: 0,
        isCorrect,
        timestamp: Date.now(),
      });

      if (isCorrect) {
        setCorrectWordIds((prev) => [...prev, exercise.word.id]);
      }
    },
    [quest, exercises, store],
  );

  const nextExercise = useCallback(() => {
    store.nextExercise();
  }, [store]);

  const finishSession = useCallback(async () => {
    if (!quest) return;
    const score = Math.round(
      (correctWordIds.length / exercises.length) * 100,
    );
    const updated = await questRepository.recordSessionResult(
      userId,
      questId,
      correctWordIds,
      score,
    );
    setProgress(updated);
    store.finishQuest();
    return { score, correctCount: correctWordIds.length, total: exercises.length };
  }, [quest, userId, questId, correctWordIds, exercises, store]);

  return {
    quest,
    progress,
    exercises,
    isLoading,
    correctWordIds,
    startSession,
    recordAnswer,
    nextExercise,
    finishSession,
  };
}
