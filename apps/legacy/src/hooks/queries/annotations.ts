import { queryOptions } from "@tanstack/react-query";
import { annotationRepository } from "@mahfuz/db";
import { QUERY_KEYS } from "~/lib/query-keys";

const USER_ID = "anonymous";

/** Query options for page annotation strokes */
export function annotationPageQueryOptions(pageNumber: number) {
  return queryOptions({
    queryKey: QUERY_KEYS.annotations.page(USER_ID, pageNumber),
    queryFn: () => annotationRepository.getPage(USER_ID, pageNumber),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/** Query options for text notes on a page */
export function textNotesQueryOptions(pageNumber: number) {
  return queryOptions({
    queryKey: QUERY_KEYS.annotations.textNotes(USER_ID, pageNumber),
    queryFn: () => annotationRepository.getTextNotes(USER_ID, pageNumber),
    staleTime: 1000 * 60 * 5,
  });
}
