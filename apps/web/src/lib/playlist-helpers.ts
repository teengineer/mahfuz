import type { ChapterAudioData } from "@mahfuz/audio-engine";
import type { QDCAudioFile } from "@mahfuz/shared/types";

/** Convert QDC audio file response → ChapterAudioData, filtering to a verse range. */
export function buildFilteredAudio(
  qdcFile: QDCAudioFile,
  fromVerse: number,
  toVerse: number,
): ChapterAudioData {
  const filtered = qdcFile.verse_timings.filter((t) => {
    const verseNum = Number(t.verse_key.split(":")[1]);
    return verseNum >= fromVerse && verseNum <= toVerse;
  });

  return {
    audioUrl: qdcFile.audio_url,
    verseTimings: filtered.map((t) => ({
      verseKey: t.verse_key,
      from: t.timestamp_from,
      to: t.timestamp_to,
      segments: t.segments,
    })),
  };
}
