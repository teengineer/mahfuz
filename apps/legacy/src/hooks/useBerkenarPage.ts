import { useQuery } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { loadBerkenarPages, type BerkenarPagesData } from "~/lib/quran-data";
import { QUERY_KEYS } from "~/lib/query-keys";
import { usePageLayout } from "~/lib/page-layout";

const berkenarPagesQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.berkenar.pages(),
    queryFn: loadBerkenarPages,
    staleTime: Infinity,
    gcTime: Infinity,
  });

/**
 * Returns the berkenar page number for a given verse key (e.g. "2:1").
 * Falls back to the Medine page number if berkenar data isn't loaded or layout is "medine".
 */
export function useBerkenarPageForVerse(
  verseKey: string,
  medineFallback: number,
): number {
  const layout = usePageLayout();
  const { data } = useQuery({
    ...berkenarPagesQueryOptions(),
    enabled: layout === "berkenar",
  });

  if (layout === "berkenar" && data) {
    return data.verseToPage[verseKey] ?? medineFallback;
  }
  return medineFallback;
}
