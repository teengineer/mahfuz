import { useState, useEffect, useCallback, useRef } from "react";
import type { Verse } from "@mahfuz/shared/types";
import type { ChapterAudioData } from "@mahfuz/audio-engine";
import { useAudioStore } from "~/stores/useAudioStore";
import { MemorizeWordCard } from "./MemorizeWordCard";
import { useTranslation } from "~/hooks/useTranslation";
import type { MemorizeSource, ModeResult, VerseResult } from "~/stores/useMemorizationStore";

interface ListenModeProps {
  source: MemorizeSource;
  surahName: string;
  verses: Verse[];
  audioData: ChapterAudioData;
  onVerseChange: (index: number) => void;
  onComplete: (result: ModeResult) => void;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5] as const;

export function ListenMode({
  source,
  surahName,
  verses,
  audioData,
  onVerseChange,
  onComplete,
}: ListenModeProps) {
  const { t } = useTranslation();
  const [speedIdx, setSpeedIdx] = useState(2); // 1x default
  const [verseStartTime, setVerseStartTime] = useState(Date.now());
  const verseResults = useRef<VerseResult[]>([]);
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const playbackState = useAudioStore((s) => s.playbackState);
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const currentWordPosition = useAudioStore((s) => s.currentWordPosition);
  const currentTime = useAudioStore((s) => s.currentTime);
  const playSurah = useAudioStore((s) => s.playSurah);
  const play = useAudioStore((s) => s.play);
  const pause = useAudioStore((s) => s.pause);
  const setSpeed = useAudioStore((s) => s.setSpeed);
  const nextVerse = useAudioStore((s) => s.nextVerse);
  const prevVerse = useAudioStore((s) => s.prevVerse);
  const stop = useAudioStore((s) => s.stop);

  // Find current verse index from audio
  const currentVerseIdx = verses.findIndex((v) => v.verse_key === currentVerseKey);

  // Start playing on mount
  useEffect(() => {
    playSurah(source.id, surahName, audioData);
    return () => { stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track verse changes from audio
  useEffect(() => {
    if (currentVerseIdx >= 0) {
      onVerseChange(currentVerseIdx);
      // Record previous verse result
      if (verseResults.current.length < currentVerseIdx) {
        const prevVerse = verses[currentVerseIdx - 1];
        if (prevVerse) {
          const prevWords = prevVerse.words?.filter((w) => w.char_type_name === "word") || [];
          verseResults.current.push({
            verseKey: prevVerse.verse_key,
            mode: "listen",
            wordsCorrect: prevWords.length,
            wordsTotal: prevWords.length,
            timeMs: Date.now() - verseStartTime,
          });
          setVerseStartTime(Date.now());
        }
      }
      // Auto-scroll
      const el = verseRefs.current.get(currentVerseIdx);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentVerseIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle playback end
  useEffect(() => {
    if (playbackState === "ended") {
      // Record last verse
      const lastVerse = verses[verses.length - 1];
      if (lastVerse) {
        const lastWords = lastVerse.words?.filter((w) => w.char_type_name === "word") || [];
        if (verseResults.current.length < verses.length) {
          verseResults.current.push({
            verseKey: lastVerse.verse_key,
            mode: "listen",
            wordsCorrect: lastWords.length,
            wordsTotal: lastWords.length,
            timeMs: Date.now() - verseStartTime,
          });
        }
      }
      const totalWords = verseResults.current.reduce((s, v) => s + v.wordsTotal, 0);
      onComplete({
        mode: "listen",
        source,
        verseResults: verseResults.current,
        totalCorrect: totalWords,
        totalWords,
        completedAt: Date.now(),
      });
    }
  }, [playbackState]); // eslint-disable-line react-hooks/exhaustive-deps

  const cycleSpeed = useCallback(() => {
    const next = (speedIdx + 1) % SPEED_OPTIONS.length;
    setSpeedIdx(next);
    setSpeed(SPEED_OPTIONS[next] as any);
  }, [speedIdx, setSpeed]);

  const handleFinish = useCallback(() => {
    stop();
    // Record any remaining verses
    for (let i = verseResults.current.length; i < verses.length; i++) {
      const v = verses[i];
      const vWords = v.words?.filter((w) => w.char_type_name === "word") || [];
      verseResults.current.push({
        verseKey: v.verse_key,
        mode: "listen",
        wordsCorrect: vWords.length,
        wordsTotal: vWords.length,
        timeMs: 0,
      });
    }
    const totalWords = verseResults.current.reduce((s, v) => s + v.wordsTotal, 0);
    onComplete({
      mode: "listen",
      source,
      verseResults: verseResults.current,
      totalCorrect: totalWords,
      totalWords,
      completedAt: Date.now(),
    });
  }, [stop, verses, source, onComplete]);

  // End-of-range detection: stop audio when sliced verseTimings range ends
  const lastTimingEndMs = audioData.verseTimings[audioData.verseTimings.length - 1]?.to ?? Infinity;
  const rangeEndedRef = useRef(false);

  useEffect(() => {
    if (rangeEndedRef.current) return;
    // Both currentTime and verseTimings.to are in ms
    if (currentTime >= lastTimingEndMs && playbackState === "playing") {
      rangeEndedRef.current = true;
      handleFinish();
    }
  }, [currentTime, lastTimingEndMs, playbackState, handleFinish]);

  return (
    <div className="flex flex-col">
      {/* Verse list */}
      <div className="flex-1 overflow-y-auto p-4">
        {verses.map((v, idx) => {
          const vWords = v.words?.filter((w) => w.char_type_name === "word") || [];
          const isActive = idx === currentVerseIdx;

          return (
            <div
              key={v.verse_key}
              ref={(el) => { if (el) verseRefs.current.set(idx, el); }}
              className={`mb-4 rounded-2xl p-4 transition-all ${
                isActive
                  ? "bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)]"
                  : "opacity-40"
              }`}
            >
              <div className="mb-2">
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[12px] font-medium text-purple-600">
                  {t.memorize.verse} {v.verse_number}
                </span>
              </div>

              <div className="flex flex-wrap justify-end gap-2" dir="rtl">
                {vWords.map((w) => (
                  <MemorizeWordCard
                    key={w.id}
                    word={w}
                    isActive={isActive && currentWordPosition === w.position}
                    size={isActive ? "lg" : "sm"}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Audio controls */}
      <div className="sticky bottom-0 border-t border-[var(--theme-divider)] bg-[var(--theme-bg-primary)] px-4 pb-6 pt-4">
        <div className="flex items-center justify-center gap-6">
          {/* Prev verse */}
          <button onClick={() => prevVerse()} className="rounded-full p-2 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => playbackState === "playing" ? pause() : play()}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg"
          >
            {playbackState === "playing" ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next verse */}
          <button onClick={() => nextVerse()} className="rounded-full p-2 text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>

          {/* Speed */}
          <button
            onClick={cycleSpeed}
            className="rounded-full px-2.5 py-1 text-[13px] font-medium text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
          >
            {SPEED_OPTIONS[speedIdx]}x
          </button>
        </div>

        {/* Finish button */}
        <button
          onClick={handleFinish}
          className="mt-3 w-full rounded-xl border border-[var(--theme-divider)] py-2.5 text-[13px] font-medium text-[var(--theme-text-secondary)]"
        >
          {t.memorize.complete}
        </button>
      </div>
    </div>
  );
}
