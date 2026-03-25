import { queryOptions } from "@tanstack/react-query";
import { quranApi } from "~/lib/api";
import { CACHE_TTL } from "@mahfuz/shared/constants";
import { QUERY_KEYS } from "~/lib/query-keys";

export const searchQueryOptions = (
  query: string,
  page: number = 1,
  size: number = 20
) =>
  queryOptions({
    queryKey: QUERY_KEYS.search(query, page, size),
    queryFn: () => quranApi.search.search(query, { page, size }),
    staleTime: CACHE_TTL.SEARCH,
    enabled: query.length > 0,
  });
