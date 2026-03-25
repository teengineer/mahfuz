import { useMutation, useQueryClient } from "@tanstack/react-query";
import { questRepository } from "@mahfuz/db/quest-repository";
import { QUERY_KEYS } from "~/lib/query-keys";

const USER_ID = "anonymous";

export function useRecordQuestSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      questId,
      correctWordIds,
      score,
    }: {
      questId: string;
      correctWordIds: string[];
      score: number;
    }) => questRepository.recordSessionResult(USER_ID, questId, correctWordIds, score),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.quest.all(USER_ID) });
    },
  });
}
