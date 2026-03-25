import { queryOptions } from "@tanstack/react-query";
import { loadQuranMeta, staticChapterToChapter } from "~/lib/quran-data";
import { QUERY_KEYS } from "~/lib/query-keys";

export const chaptersQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.chapters(),
    queryFn: async () => {
      const meta = await loadQuranMeta();
      return meta.chapters.map(staticChapterToChapter);
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

export const chapterQueryOptions = (chapterId: number) =>
  queryOptions({
    queryKey: QUERY_KEYS.chapter(chapterId),
    queryFn: async () => {
      const meta = await loadQuranMeta();
      const sc = meta.chapters.find((c) => c.id === chapterId);
      if (!sc) throw new Error(`Chapter not found: ${chapterId}`);
      return staticChapterToChapter(sc);
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });
