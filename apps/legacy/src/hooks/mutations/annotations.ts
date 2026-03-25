import { useMutation, useQueryClient } from "@tanstack/react-query";
import { annotationRepository } from "@mahfuz/db";
import type { AnnotationPageEntry, TextNoteEntry } from "@mahfuz/db";
import { QUERY_KEYS } from "~/lib/query-keys";

const USER_ID = "anonymous";

/** Save/update annotation strokes for a page */
export function useSaveAnnotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entry: AnnotationPageEntry) =>
      annotationRepository.savePage(entry),
    onSuccess: (_, entry) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.annotations.page(USER_ID, entry.pageNumber),
      });
    },
  });
}

/** Create or update a text note */
export function useUpsertTextNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (note: TextNoteEntry) =>
      annotationRepository.upsertTextNote(note),
    onSuccess: (_, note) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.annotations.textNotes(USER_ID, note.pageNumber),
      });
    },
  });
}

/** Delete a text note */
export function useDeleteTextNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      pageNumber,
    }: {
      id: string;
      pageNumber: number;
    }) => annotationRepository.deleteTextNote(id),
    onSuccess: (_, { pageNumber }) => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.annotations.textNotes(USER_ID, pageNumber),
      });
    },
  });
}
