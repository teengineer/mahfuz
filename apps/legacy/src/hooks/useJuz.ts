import { queryOptions } from "@tanstack/react-query";
import { quranApi } from "~/lib/api";
import { QUERY_KEYS } from "~/lib/query-keys";

export const juzListQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.juzs(),
    queryFn: () => quranApi.juz.list(),
  });
