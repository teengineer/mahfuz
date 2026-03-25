import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import type { Verse } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import type { MemorizeSource, ModeResult, VerseResult, WordResult } from "~/stores/useMemorizationStore";

// Fallback Arabic words for distractor generation
const FALLBACK_WORDS = [
  "\u0671\u0644\u0644\u0651\u064E\u0647\u0650",
  "\u0671\u0644\u0631\u0651\u064E\u062D\u0652\u0645\u064E\u0640\u0670\u0646\u0650",
  "\u0671\u0644\u0631\u0651\u064E\u062D\u0650\u064A\u0645\u0650",
  "\u0671\u0644\u0652\u062D\u064E\u0645\u0652\u062F\u064F",
  "\u0631\u064E\u0628\u0651\u0650",
  "\u0671\u0644\u0652\u0639\u064E\u0640\u0670\u0644\u064E\u0645\u0650\u064A\u0646\u064E",
  "\u0645\u064E\u0640\u0670\u0644\u0650\u0643\u0650",
  "\u064A\u064E\u0648\u0652\u0645\u0650",
  "\u0671\u0644\u062F\u0651\u0650\u064A\u0646\u0650",
  "\u0625\u0650\u064A\u0651\u064E\u0627\u0643\u064E",
  "\u0646\u064E\u0639\u0652\u0628\u064F\u062F\u064F",
  "\u0646\u064E\u0633\u0652\u062A\u064E\u0639\u0650\u064A\u0646\u064F",
  "\u0671\u0647\u0652\u062F\u0650\u0646\u064E\u0627",
  "\u0671\u0644\u0635\u0651\u0650\u0631\u064E\u200C\u0670\u0637\u064E",
  "\u0671\u0644\u0652\u0645\u064F\u0633\u0652\u062A\u064E\u0642\u0650\u064A\u0645\u064E",
  "\u0639\u064E\u0644\u064E\u064A\u0652\u0647\u0650\u0645\u0652",
  "\u0623\u064E\u0646\u0639\u064E\u0645\u0652\u062A\u064E",
  "\u0648\u064E\u0644\u064E\u0627",
  "\u0671\u0644\u0636\u0651\u064E\u0627\u0644\u0651\u0650\u064A\u0646\u064E",
  "\u0623\u064E\u0639\u064F\u0648\u0630\u064F",
];

// Seeded PRNG (mulberry32) — deterministic blanks from surahId
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface BlankSlot {
  flatIdx: number;
  verseIdx: number;
  wordIdx: number;
  verseKey: string;
  wordPosition: number;
  correctWord: string;
  options: string[];
}

interface WordMeta {
  verseIdx: number;
  wordIdx: number;
  verseKey: string;
  wordPosition: number;
  text: string;
}

type Phase = "main" | "retryIntro" | "retry";

interface TestModeProps {
  source: MemorizeSource;
  verses: Verse[];
  onVerseChange: (index: number) => void;
  onComplete: (result: ModeResult) => void;
}

export function TestMode({ source, verses, onVerseChange, onComplete }: TestModeProps) {
  const { t } = useTranslation();

  // Stable verse keys
  const verseKeysStr = useMemo(
    () => verses.map((v) => v.verse_key).join(","),
    [verses],
  );

  // Extract all words
  const allWords: WordMeta[] = useMemo(() => {
    const result: WordMeta[] = [];
    verses.forEach((verse, vIdx) => {
      const words = verse.words?.filter((w) => w.char_type_name === "word") || [];
      words.forEach((w, wIdx) => {
        result.push({
          verseIdx: vIdx,
          wordIdx: wIdx,
          verseKey: verse.verse_key,
          wordPosition: w.position,
          text: w.text_imlaei || w.text,
        });
      });
    });
    return result;
  }, [verses]);

  // Build blank slots
  const blanks: BlankSlot[] = useMemo(() => {
    if (allWords.length === 0) return [];

    const rand = mulberry32(source.id * 31337 + allWords.length);
    const totalWords = allWords.length;
    const blankRatio = totalWords <= 20 ? 0.4 : 0.25;
    let blankCount = Math.max(1, Math.round(totalWords * blankRatio));
    blankCount = Math.min(blankCount, 40);

    const verseWordCounts = new Map<number, number>();
    allWords.forEach((w) => {
      verseWordCounts.set(w.verseIdx, (verseWordCounts.get(w.verseIdx) || 0) + 1);
    });

    const mandatoryIndices = new Set<number>();
    for (const [vIdx, count] of verseWordCounts) {
      if (count >= 3) {
        const candidates = allWords
          .map((_, i) => i)
          .filter((i) => allWords[i].verseIdx === vIdx);
        const pick = candidates[Math.floor(rand() * candidates.length)];
        mandatoryIndices.add(pick);
      }
    }

    const selectedIndices = new Set(mandatoryIndices);
    const available = seededShuffle(
      allWords.map((_, i) => i).filter((i) => !selectedIndices.has(i)),
      rand,
    );
    let idx = 0;
    while (selectedIndices.size < blankCount && idx < available.length) {
      selectedIndices.add(available[idx]);
      idx++;
    }

    const sortedIndices = [...selectedIndices].sort((a, b) => a - b);

    return sortedIndices.map((flatIdx) => {
      const word = allWords[flatIdx];
      const correct = word.text;

      const sameVerse = allWords.filter(
        (w, i) => w.verseIdx === word.verseIdx && i !== flatIdx,
      );
      const neighborVerses = allWords.filter(
        (w, i) =>
          Math.abs(w.verseIdx - word.verseIdx) <= 2 &&
          w.verseIdx !== word.verseIdx &&
          i !== flatIdx,
      );

      const pool = [...sameVerse, ...neighborVerses].map((w) => w.text);
      const unique = [...new Set(pool)].filter((w) => w !== correct);

      while (unique.length < 4) {
        const fb = FALLBACK_WORDS[Math.floor(rand() * FALLBACK_WORDS.length)];
        if (fb !== correct && !unique.includes(fb)) unique.push(fb);
      }

      const distractors = seededShuffle(unique, rand).slice(0, 3);
      const options = seededShuffle([correct, ...distractors], rand);

      return {
        flatIdx,
        verseIdx: word.verseIdx,
        wordIdx: word.wordIdx,
        verseKey: word.verseKey,
        wordPosition: word.wordPosition,
        correctWord: correct,
        options,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verseKeysStr, source.id]);

  const [phase, setPhase] = useState<Phase>("main");
  const [currentBlankIdx, setCurrentBlankIdx] = useState(0);
  const [answers, setAnswers] = useState<Map<number, { selected: string; correct: boolean }>>(new Map());
  const [feedback, setFeedback] = useState<{ correct: boolean; correctWord: string } | null>(null);
  const [retryBlanks, setRetryBlanks] = useState<BlankSlot[]>([]);
  const wordResultsRef = useRef<WordResult[]>([]);
  const wordStartTime = useRef(Date.now());

  // Active blanks depend on phase
  const activeBlanks = phase === "retry" ? retryBlanks : blanks;
  const currentBlank = activeBlanks[currentBlankIdx];

  // Track verse changes
  useEffect(() => {
    if (currentBlank) {
      onVerseChange(currentBlank.verseIdx);
    }
  }, [currentBlank?.verseIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const finalize = useCallback((finalAnswers: Map<number, { selected: string; correct: boolean }>) => {
    const verseMap = new Map<string, { correct: number; total: number }>();
    for (const b of blanks) {
      if (!verseMap.has(b.verseKey))
        verseMap.set(b.verseKey, { correct: 0, total: 0 });
      const v = verseMap.get(b.verseKey)!;
      v.total++;
      const ans = finalAnswers.get(b.flatIdx);
      if (ans?.correct) v.correct++;
    }

    const verseResults: VerseResult[] = [...verseMap.entries()].map(
      ([vk, stats]) => ({
        verseKey: vk,
        mode: "test" as const,
        wordsCorrect: stats.correct,
        wordsTotal: stats.total,
        timeMs: 0,
      }),
    );

    const totalCorrect = verseResults.reduce((s, v) => s + v.wordsCorrect, 0);
    const totalWords = verseResults.reduce((s, v) => s + v.wordsTotal, 0);

    onComplete({
      mode: "test",
      source,
      verseResults,
      totalCorrect,
      totalWords,
      completedAt: Date.now(),
    });
  }, [blanks, source, onComplete]);

  const advanceToNext = useCallback(() => {
    setFeedback(null);
    wordStartTime.current = Date.now();
    const nextIdx = currentBlankIdx + 1;
    if (nextIdx < activeBlanks.length) {
      setCurrentBlankIdx(nextIdx);
    } else if (phase === "main") {
      // End of main round — check for wrong answers
      setAnswers((current) => {
        const wrongBlanks = blanks.filter((b) => {
          const ans = current.get(b.flatIdx);
          return ans && !ans.correct;
        });
        if (wrongBlanks.length > 0) {
          // Re-shuffle options for retry
          const reshuffled = wrongBlanks.map((b) => ({
            ...b,
            options: shuffle(b.options),
          }));
          setRetryBlanks(reshuffled);
          setPhase("retryIntro");
        } else {
          finalize(current);
        }
        return current;
      });
    } else {
      // End of retry round — finalize with updated answers
      setAnswers((current) => {
        finalize(current);
        return current;
      });
    }
  }, [activeBlanks, currentBlankIdx, phase, blanks, finalize]);

  const handlePickOption = useCallback(
    (word: string) => {
      const blank = activeBlanks[currentBlankIdx];
      if (!blank || feedback) return;

      const isCorrect = word === blank.correctWord;
      setAnswers((prev) => {
        const next = new Map(prev);
        next.set(blank.flatIdx, { selected: word, correct: isCorrect });
        return next;
      });

      wordResultsRef.current.push({
        wordPosition: blank.wordPosition,
        verseKey: blank.verseKey,
        correct: isCorrect,
        mode: "test",
        timeMs: Date.now() - wordStartTime.current,
      });

      setFeedback({ correct: isCorrect, correctWord: blank.correctWord });

      // Auto-advance only on correct answers
      if (isCorrect) {
        setTimeout(() => {
          advanceToNext();
        }, 600);
      }
    },
    [activeBlanks, currentBlankIdx, advanceToNext, feedback],
  );

  const startRetry = useCallback(() => {
    setPhase("retry");
    setCurrentBlankIdx(0);
    setFeedback(null);
    wordStartTime.current = Date.now();
  }, []);

  if (blanks.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  // Retry intro screen
  if (phase === "retryIntro") {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 py-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/15">
            <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h2 className="text-[22px] font-bold text-[var(--theme-text)]">
            {t.memorize.verification.retryTitle}
          </h2>
          <p className="text-[15px] text-[var(--theme-text-secondary)]">
            {t.memorize.verification.retryDesc.replace("{count}", String(retryBlanks.length))}
          </p>
          <button
            onClick={startRetry}
            className="mt-4 w-full max-w-xs rounded-xl bg-primary-600 px-6 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-700 active:scale-[0.97]"
          >
            {t.memorize.verification.retryStart}
          </button>
        </div>
      </div>
    );
  }

  const answeredCount = phase === "retry"
    ? (feedback ? currentBlankIdx + 1 : currentBlankIdx)
    : answers.size;
  const totalBlanks = activeBlanks.length;

  // Build the current verse with the blank highlighted
  const currentVerse = currentBlank ? verses[currentBlank.verseIdx] : null;
  const currentVerseWords = currentVerse?.words?.filter((w) => w.char_type_name === "word") || [];

  return (
    <div className="flex h-full flex-col items-center justify-between px-4 py-4">
      {/* Progress dots */}
      <div className="flex w-full items-center gap-1.5">
        {phase === "retry" && (
          <span className="mr-1.5 shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
            {t.memorize.verification.retryTitle}
          </span>
        )}
        <div className="flex flex-1 gap-0.5">
          {activeBlanks.map((b, i) => {
            const ans = answers.get(b.flatIdx);
            let dotColor = "bg-[var(--theme-hover-bg)]";
            if (phase === "retry") {
              // In retry: show result only for already-answered retry blanks
              if (i < currentBlankIdx) {
                dotColor = ans?.correct ? "bg-emerald-500" : "bg-red-400";
              } else if (i === currentBlankIdx && feedback) {
                dotColor = ans?.correct ? "bg-emerald-500" : "bg-red-400";
              } else if (i === currentBlankIdx) {
                dotColor = "bg-primary-500";
              }
            } else {
              if (ans) dotColor = ans.correct ? "bg-emerald-500" : "bg-red-400";
              else if (i === currentBlankIdx) dotColor = "bg-primary-500";
            }
            return (
              <div
                key={`${phase}-${b.flatIdx}`}
                className={`h-1 flex-1 rounded-full transition-colors ${dotColor}`}
              />
            );
          })}
        </div>
        <span className="ml-2 shrink-0 text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">
          {answeredCount}/{totalBlanks}
        </span>
      </div>

      {/* Center — verse context with blank */}
      <div className="flex w-full max-w-lg flex-1 flex-col items-center justify-center">
        {currentVerse && (
          <div className="w-full text-center" dir="rtl">
            {/* Verse number */}
            <p className="mb-3 text-[12px] text-[var(--theme-text-quaternary)]" dir="ltr">
              {currentVerse.verse_key.replace(":", "/")}
            </p>

            {/* Verse text with blank */}
            <p className="arabic-text leading-[2.8] text-[var(--theme-text)]" style={{ fontSize: "1.5rem" }}>
              {currentVerseWords.map((w, wIdx) => {
                const isBlank = wIdx === currentBlank?.wordIdx;

                if (!isBlank) {
                  return (
                    <span key={w.id} className="inline-block opacity-50">
                      {w.text_imlaei || w.text}{" "}
                    </span>
                  );
                }

                // The blank slot
                if (feedback) {
                  return (
                    <span
                      key={w.id}
                      className={`inline-block rounded-lg px-2 py-1 text-[1.6rem] font-bold ${
                        feedback.correct
                          ? "bg-emerald-500/15 text-emerald-600"
                          : "bg-red-500/15 text-red-500"
                      }`}
                    >
                      {feedback.correct ? (
                        w.text_imlaei || w.text
                      ) : (
                        <span>
                          <span className="text-red-400 line-through">{answers.get(currentBlank!.flatIdx)?.selected}</span>
                          {" "}
                          <span className="text-emerald-600">{w.text_imlaei || w.text}</span>
                        </span>
                      )}{" "}
                    </span>
                  );
                }

                return (
                  <span
                    key={w.id}
                    className="inline-block rounded-lg border-2 border-dashed border-primary-500/60 bg-primary-500/10 px-4 py-1 text-[1.6rem] text-primary-500"
                  >
                    ؟{" "}
                  </span>
                );
              })}
              <span className="inline-block text-[0.6em] text-[var(--theme-text-quaternary)]">
                {" "}﴿{currentVerse.verse_number}﴾
              </span>
            </p>
          </div>
        )}

        {/* Feedback text */}
        {feedback && (
          <p className={`mt-4 text-[15px] font-semibold ${feedback.correct ? "text-emerald-600" : "text-red-500"}`}>
            {feedback.correct ? t.memorize.verification.correct : t.memorize.verification.wrong}
          </p>
        )}
      </div>

      {/* Bottom — MCQ options */}
      {currentBlank && !feedback && (
        <div className="w-full max-w-lg pb-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          <p className="mb-3 text-center text-[12px] text-[var(--theme-text-quaternary)]">
            {t.memorize.verification.pickWord}
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            {currentBlank.options.map((word, idx) => (
              <button
                key={`${currentBlank.flatIdx}-${idx}`}
                onClick={() => handlePickOption(word)}
                className="arabic-text rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-3 py-3.5 text-center text-[20px] leading-snug text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-hover-bg)] active:scale-[0.97]"
              >
                {word}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Wrong answer: show "Devam" button; correct: spacer for layout stability */}
      {feedback && (
        <div className="w-full max-w-lg pb-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
          {!feedback.correct ? (
            <button
              onClick={advanceToNext}
              className="w-full rounded-xl bg-primary-600 px-4 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-700 active:scale-[0.97]"
            >
              {t.memorize.nextVerse}
            </button>
          ) : (
            <div className="h-[140px]" />
          )}
        </div>
      )}
    </div>
  );
}
