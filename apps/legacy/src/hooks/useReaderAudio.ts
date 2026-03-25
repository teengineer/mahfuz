import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";
import { useAudioStore } from "~/stores/useAudioStore";
import type { ChapterAudioData } from "@mahfuz/audio-engine";

/**
 * Shared audio hook for all reading routes.
 * Provides buildChapterAudio, handlePlayFromVerse, and play state helpers.
 */
export function useReaderAudio() {
  const queryClient = useQueryClient();
  const reciterId = useAudioStore((s) => s.reciterId);
  const playVerse = useAudioStore((s) => s.playVerse);
  const playSurah = useAudioStore((s) => s.playSurah);
  const playbackState = useAudioStore((s) => s.playbackState);
  const audioChapterId = useAudioStore((s) => s.chapterId);
  const togglePlayPause = useAudioStore((s) => s.togglePlayPause);
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const currentWordPosition = useAudioStore((s) => s.currentWordPosition);

  const buildChapterAudio = useCallback(
    async (chId: number): Promise<ChapterAudioData> => {
      const qdcFile = await queryClient.fetchQuery(
        chapterAudioQueryOptions(reciterId, chId),
      );
      return {
        audioUrl: qdcFile.audio_url,
        verseTimings: qdcFile.verse_timings.map((t) => ({
          verseKey: t.verse_key,
          from: t.timestamp_from,
          to: t.timestamp_to,
          segments: t.segments,
        })),
      };
    },
    [queryClient, reciterId],
  );

  const handlePlayFromVerse = useCallback(
    async (verseKey: string, surahName: string) => {
      const chapterId = Number(verseKey.split(":")[0]);
      const audioData = await buildChapterAudio(chapterId);
      playVerse(chapterId, surahName, verseKey, audioData);
    },
    [buildChapterAudio, playVerse],
  );

  return {
    buildChapterAudio,
    handlePlayFromVerse,
    playSurah,
    playVerse,
    togglePlayPause,
    playbackState,
    audioChapterId,
    currentVerseKey,
    currentWordPosition,
    reciterId,
  };
}
