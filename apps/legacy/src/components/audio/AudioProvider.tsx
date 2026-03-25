import { useEffect, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAudioStore } from "~/stores/useAudioStore";
import type { FetchChapterAudioFn } from "~/stores/useAudioStore";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";
import type { ChapterAudioData } from "@mahfuz/audio-engine";

/**
 * Renderless component that initializes AudioEngine on mount
 * and connects its callbacks to the Zustand store.
 * Must be rendered client-side only.
 */
export function AudioProvider() {
  const setEngine = useAudioStore((s) => s.setEngine);
  const onPlaybackStateChange = useAudioStore(
    (s) => s._onPlaybackStateChange,
  );
  const onTimeUpdate = useAudioStore((s) => s._onTimeUpdate);
  const onWordPositionChange = useAudioStore((s) => s._onWordPositionChange);
  const onVerseChange = useAudioStore((s) => s._onVerseChange);
  const onVerseEnd = useAudioStore((s) => s._onVerseEnd);
  const setFetchFn = useAudioStore((s) => s._setFetchChapterAudioFn);

  const queryClient = useQueryClient();
  const { locale } = useTranslation();

  // Wire the auto-continue fetch function so the store can fetch next chapter audio
  const fetchChapterAudio: FetchChapterAudioFn = useCallback(
    async (reciterId, chapterId) => {
      const qdcFile = await queryClient.fetchQuery(
        chapterAudioQueryOptions(reciterId, chapterId),
      );
      const audioData: ChapterAudioData = {
        audioUrl: qdcFile.audio_url,
        verseTimings: qdcFile.verse_timings.map((t) => ({
          verseKey: t.verse_key,
          from: t.timestamp_from,
          to: t.timestamp_to,
          segments: t.segments,
        })),
      };

      // Get chapter name from cached chapters data
      const chapters = await queryClient.fetchQuery(chaptersQueryOptions());
      const chapter = chapters.find((c) => c.id === chapterId);
      const chapterName = chapter
        ? getSurahName(chapter.id, chapter.translated_name.name, locale)
        : `Surah ${chapterId}`;

      return { audioData, chapterName };
    },
    [queryClient, locale],
  );

  useEffect(() => {
    setFetchFn(fetchChapterAudio);
    return () => setFetchFn(null);
  }, [fetchChapterAudio, setFetchFn]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let destroyed = false;

    import("@mahfuz/audio-engine").then(({ AudioEngine }) => {
      if (destroyed) return;
      const engine = new AudioEngine({
        onPlaybackStateChange,
        onTimeUpdate,
        onWordPositionChange,
        onVerseChange,
        onVerseEnd,
        onError: (err) => console.error("[AudioEngine]", err),
      });
      setEngine(engine);
    });

    return () => {
      destroyed = true;
      const engine = useAudioStore.getState().engine;
      if (engine) {
        engine.destroy();
        setEngine(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Global space key → toggle play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const { isVisible, togglePlayPause, prevVerse, nextVerse } =
        useAudioStore.getState();
      if (!isVisible) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        prevVerse();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        nextVerse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return null;
}
