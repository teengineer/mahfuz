import { queryOptions } from "@tanstack/react-query";
import { learnRepository } from "@mahfuz/db/learn-repository";
import { QUERY_KEYS } from "~/lib/query-keys";

const USER_ID = "anonymous";

export function learnDashboardQueryOptions() {
  return queryOptions({
    queryKey: QUERY_KEYS.learn.dashboard(USER_ID),
    queryFn: () => learnRepository.getStageCompletionMap(USER_ID),
    staleTime: 1000 * 60,
  });
}

export function stageProgressQueryOptions(stageId: number) {
  return queryOptions({
    queryKey: QUERY_KEYS.learn.stageProgress(USER_ID, stageId),
    queryFn: () => learnRepository.getAllProgressForStage(USER_ID, stageId),
    staleTime: 1000 * 60,
  });
}

export function completedLessonsQueryOptions() {
  return queryOptions({
    queryKey: QUERY_KEYS.learn.completedLessons(USER_ID),
    queryFn: () => learnRepository.getCompletedLessons(USER_ID),
    staleTime: 1000 * 60,
  });
}

export function sevapPointsQueryOptions() {
  return queryOptions({
    queryKey: QUERY_KEYS.learn.sevapPoints(USER_ID),
    queryFn: () => learnRepository.getTotalSevapPointEarned(USER_ID),
    staleTime: 1000 * 60,
  });
}

export function conceptsDueQueryOptions() {
  return queryOptions({
    queryKey: QUERY_KEYS.learn.concepts(USER_ID),
    queryFn: () => learnRepository.getConceptsDueForReview(USER_ID),
    staleTime: 1000 * 60,
  });
}
