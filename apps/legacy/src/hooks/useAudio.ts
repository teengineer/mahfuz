import { queryOptions } from "@tanstack/react-query";
import { quranApi } from "~/lib/api";
import { QUERY_KEYS } from "~/lib/query-keys";

export const verseAudioQueryOptions = (reciterId: number, chapterId: number) =>
  queryOptions({
    queryKey: QUERY_KEYS.verseAudio(reciterId, chapterId),
    queryFn: () => quranApi.audio.getVerseAudio(reciterId, chapterId),
    staleTime: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

export const chapterAudioQueryOptions = (
  reciterId: number,
  chapterId: number,
) =>
  queryOptions({
    queryKey: QUERY_KEYS.chapterAudio(reciterId, chapterId),
    queryFn: () => quranApi.audio.getChapterAudioQDC(reciterId, chapterId),
    staleTime: 30 * 24 * 60 * 60 * 1000,
  });
