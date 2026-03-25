import { queryOptions } from "@tanstack/react-query";
import { questRepository } from "@mahfuz/db/quest-repository";
import { QUERY_KEYS } from "~/lib/query-keys";

const USER_ID = "anonymous";

export function questProgressQueryOptions(questId: string) {
  return queryOptions({
    queryKey: QUERY_KEYS.quest.progress(USER_ID, questId),
    queryFn: () => questRepository.getQuestProgress(USER_ID, questId),
    staleTime: 1000 * 60,
  });
}

export function allQuestProgressQueryOptions() {
  return queryOptions({
    queryKey: QUERY_KEYS.quest.allProgress(USER_ID),
    queryFn: () => questRepository.getAllQuestProgress(USER_ID),
    staleTime: 1000 * 60,
  });
}
