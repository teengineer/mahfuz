import { useMutation, useQueryClient } from "@tanstack/react-query";
import { learnRepository } from "@mahfuz/db/learn-repository";
import type { LessonProgressEntry } from "@mahfuz/db/types";
import { QUERY_KEYS } from "~/lib/query-keys";

const USER_ID = "anonymous";

export function useUpsertLessonProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: LessonProgressEntry) => learnRepository.upsertLessonProgress(entry),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.learn.all(USER_ID) });
    },
  });
}

export function useRecordConceptResult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conceptId, isCorrect }: { conceptId: string; isCorrect: boolean }) =>
      learnRepository.recordConceptResult(USER_ID, conceptId, isCorrect),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.learn.concepts(USER_ID) });
    },
  });
}
