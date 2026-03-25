import { queryOptions } from "@tanstack/react-query";
import { memorizationRepository } from "@mahfuz/db/memorization-repository";
import { QUERY_KEYS } from "~/lib/query-keys";

const DEFAULT_USER_ID = "anonymous";

export function dueCardsQueryOptions(userId = DEFAULT_USER_ID) {
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.dueCards(userId),
    queryFn: () => memorizationRepository.getDueCards(userId, Date.now(), 100),
    staleTime: 1000 * 60,
  });
}

export function allCardsQueryOptions(userId = DEFAULT_USER_ID) {
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.cards(userId),
    queryFn: () => memorizationRepository.getAllCards(userId),
    staleTime: 1000 * 60,
  });
}

export function surahCardsQueryOptions(surahId: number, userId = DEFAULT_USER_ID) {
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.surahCards(userId, surahId),
    queryFn: () => memorizationRepository.getCardsBySurah(userId, surahId),
    staleTime: 1000 * 60,
  });
}

export function goalsQueryOptions(userId = DEFAULT_USER_ID) {
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.goals(userId),
    queryFn: () => memorizationRepository.getGoals(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function reviewsTodayQueryOptions(userId = DEFAULT_USER_ID) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.reviewsToday(userId),
    queryFn: () => memorizationRepository.getReviewsToday(userId, todayStart.getTime()),
    staleTime: 1000 * 30,
  });
}

export function reviewDatesQueryOptions(userId = DEFAULT_USER_ID) {
  return queryOptions({
    queryKey: QUERY_KEYS.memorization.reviewDates(userId),
    queryFn: () => memorizationRepository.getReviewDates(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function badgesQueryOptions(userId = DEFAULT_USER_ID) {
  return queryOptions({
    queryKey: QUERY_KEYS.badges.all(userId),
    queryFn: () => memorizationRepository.getUnlockedBadges(userId),
    staleTime: 1000 * 60 * 5,
  });
}
