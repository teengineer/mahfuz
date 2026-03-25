import { useMutation, useQueryClient } from "@tanstack/react-query";
import { memorizationRepository } from "@mahfuz/db/memorization-repository";
import type { MemorizationCardEntry, ReviewEntryRecord, MemorizationGoalsEntry } from "@mahfuz/db/types";
import { QUERY_KEYS } from "~/lib/query-keys";

const USER_ID = "anonymous";

export function useUpsertCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (card: MemorizationCardEntry) => memorizationRepository.upsertCard(card),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.memorization.all(USER_ID) });
    },
  });
}

export function useCreateCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cards: MemorizationCardEntry[]) => memorizationRepository.createCards(cards),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.memorization.all(USER_ID) });
    },
  });
}

export function useDeleteSurahCards() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (surahId: number) => memorizationRepository.deleteCardsBySurah(USER_ID, surahId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.memorization.all(USER_ID) });
    },
  });
}

export function useAddReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: ReviewEntryRecord) => memorizationRepository.addReview(entry),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.memorization.all(USER_ID) });
    },
  });
}

export function useSetGoals() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goals: MemorizationGoalsEntry) => memorizationRepository.setGoals(goals),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.memorization.goals(USER_ID) });
    },
  });
}

export function useAddBadge() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (badgeId: string) => memorizationRepository.addBadge(USER_ID, badgeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.badges.all(USER_ID) });
    },
  });
}

export function useBulkMasterSurah() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ surahId, verseCount }: { surahId: number; verseCount: number }) =>
      memorizationRepository.bulkMasterSurah(USER_ID, surahId, verseCount),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.memorization.all(USER_ID) });
    },
  });
}
