import { useState, useRef, useEffect, useCallback } from "react";
import type { Verse } from "@mahfuz/shared/types";
import { MemorizeWordCard } from "./MemorizeWordCard";
import { useTranslation } from "~/hooks/useTranslation";
import type { MemorizeSource, ModeResult, VerseResult } from "~/stores/useMemorizationStore";

interface LearnModeProps {
  source: MemorizeSource;
  verses: Verse[];
  onVerseChange: (index: number) => void;
  onComplete: (result: ModeResult) => void;
}

export function LearnMode({ source, verses, onVerseChange, onComplete }: LearnModeProps) {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [startTime] = useState(Date.now());
  const [verseStartTime, setVerseStartTime] = useState(Date.now());
  const verseResults = useRef<VerseResult[]>([]);
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const verse = verses[currentIdx];
  const words = verse?.words?.filter((w) => w.char_type_name === "word") || [];

  const scrollToVerse = useCallback((idx: number) => {
    const el = verseRefs.current.get(idx);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const completeCurrentVerse = useCallback(() => {
    if (!verse) return;
    verseResults.current.push({
      verseKey: verse.verse_key,
      mode: "learn",
      wordsCorrect: words.length, // passive = all correct
      wordsTotal: words.length,
      timeMs: Date.now() - verseStartTime,
    });
  }, [verse, words.length, verseStartTime]);

  const goNext = useCallback(() => {
    completeCurrentVerse();
    if (currentIdx + 1 < verses.length) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setVerseStartTime(Date.now());
      onVerseChange(nextIdx);
      scrollToVerse(nextIdx);
    } else {
      // Session complete
      const totalWords = verseResults.current.reduce((s, v) => s + v.wordsTotal, 0);
      onComplete({
        mode: "learn",
        source,
        verseResults: verseResults.current,
        totalCorrect: totalWords,
        totalWords,
        completedAt: Date.now(),
      });
    }
  }, [currentIdx, verses.length, source, onComplete, onVerseChange, completeCurrentVerse, scrollToVerse]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) {
      const prevIdx = currentIdx - 1;
      setCurrentIdx(prevIdx);
      onVerseChange(prevIdx);
      scrollToVerse(prevIdx);
    }
  }, [currentIdx, onVerseChange, scrollToVerse]);

  // Scroll to active verse on mount
  useEffect(() => {
    scrollToVerse(currentIdx);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const playWordAudio = useCallback((audioUrl: string | null) => {
    if (!audioUrl) return;
    const audio = new Audio(`https://audio.qurancdn.com/${audioUrl}`);
    audio.play().catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Verse list */}
      {verses.map((v, idx) => {
        const vWords = v.words?.filter((w) => w.char_type_name === "word") || [];
        const isActive = idx === currentIdx;

        return (
          <div
            key={v.verse_key}
            ref={(el) => { if (el) verseRefs.current.set(idx, el); }}
            className={`rounded-2xl p-4 transition-all ${
              isActive
                ? "bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)]"
                : "opacity-40"
            }`}
          >
            {/* Verse number */}
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-primary-500/10 px-2 py-0.5 text-[12px] font-medium text-primary-600">
                {t.memorize.verse} {v.verse_number}
              </span>
            </div>

            {/* Words grid — RTL */}
            <div className="flex flex-wrap justify-end gap-2" dir="rtl">
              {vWords.map((w) => (
                <MemorizeWordCard
                  key={w.id}
                  word={w}
                  isActive={false}
                  size={isActive ? "lg" : "sm"}
                  onTap={isActive ? () => playWordAudio(w.audio_url) : undefined}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Bottom navigation */}
      <div className="sticky bottom-0 flex gap-3 bg-[var(--theme-bg)] px-4 pb-6 pt-3">
        <button
          onClick={goPrev}
          disabled={currentIdx === 0}
          className="flex-1 rounded-xl border border-[var(--theme-divider)] bg-[var(--theme-bg-primary)] py-3 text-[14px] font-medium text-[var(--theme-text-secondary)] disabled:opacity-30"
        >
          {t.memorize.prevVerse}
        </button>
        <button
          onClick={goNext}
          className="flex-1 rounded-xl bg-primary-600 py-3 text-[14px] font-medium text-white"
        >
          {currentIdx + 1 < verses.length ? t.memorize.nextVerse : t.memorize.complete}
        </button>
      </div>
    </div>
  );
}
