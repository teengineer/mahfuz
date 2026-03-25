import { useState, useCallback, useRef, useEffect } from "react";
import type { Verse, Word } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import type { MemorizeSource, ModeResult, VerseResult } from "~/stores/useMemorizationStore";

interface TypeModeProps {
  source: MemorizeSource;
  verses: Verse[];
  onVerseChange: (index: number) => void;
  onComplete: (result: ModeResult) => void;
}

function normalizeTranslit(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[-''ʿʾ`.,;:!?()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getVerseWords(verse: Verse): Word[] {
  return verse.words?.filter((w) => w.char_type_name === "word") || [];
}

export function TypeMode({ source, verses, onVerseChange, onComplete }: TypeModeProps) {
  const { t } = useTranslation();
  const [verseIdx, setVerseIdx] = useState(0);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [charFeedback, setCharFeedback] = useState<Array<"correct" | "wrong">>([]);
  const [hintCount, setHintCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const verseStartTime = useRef(Date.now());
  const verseResults = useRef<VerseResult[]>([]);

  const verse = verses[verseIdx];
  const words = getVerseWords(verse);

  // Full verse transliteration
  const expectedTranslit = words
    .map((w) => w.transliteration?.text || "")
    .filter(Boolean)
    .join(" ");
  const normalizedExpected = normalizeTranslit(expectedTranslit);

  // Focus input on verse change
  useEffect(() => {
    inputRef.current?.focus();
  }, [verseIdx]);

  // Validate characters as user types
  const handleInput = useCallback(
    (value: string) => {
      setInput(value);
      const normalizedInput = normalizeTranslit(value);
      const feedback: Array<"correct" | "wrong"> = [];

      for (let i = 0; i < normalizedInput.length; i++) {
        if (i < normalizedExpected.length) {
          feedback.push(normalizedInput[i] === normalizedExpected[i] ? "correct" : "wrong");
        } else {
          feedback.push("wrong");
        }
      }
      setCharFeedback(feedback);
    },
    [normalizedExpected],
  );

  const advanceVerse = useCallback(
    (wasCorrect: boolean) => {
      let wordsCorrect: number;
      if (wasCorrect) {
        wordsCorrect = words.length;
      } else {
        // Partial grading: compare word by word
        const inputWords = normalizeTranslit(input).split(" ").filter(Boolean);
        const expectedWords = words.map((w) => normalizeTranslit(w.transliteration?.text || ""));
        wordsCorrect = 0;
        for (let i = 0; i < expectedWords.length; i++) {
          if (i < inputWords.length && inputWords[i] === expectedWords[i]) {
            wordsCorrect++;
          }
        }
      }

      verseResults.current.push({
        verseKey: verse.verse_key,
        mode: "type",
        wordsCorrect,
        wordsTotal: words.length,
        timeMs: Date.now() - verseStartTime.current,
      });

      const nextVerseIdx = verseIdx + 1;
      if (nextVerseIdx < verses.length) {
        setVerseIdx(nextVerseIdx);
        setInput("");
        setAttempts(0);
        setShowAnswer(false);
        setCharFeedback([]);
        setHintCount(0);
        verseStartTime.current = Date.now();
        onVerseChange(nextVerseIdx);
      } else {
        // All done
        const totalCorrect = verseResults.current.reduce((s, v) => s + v.wordsCorrect, 0);
        const totalWords = verseResults.current.reduce((s, v) => s + v.wordsTotal, 0);
        onComplete({
          mode: "type",
          source,
          verseResults: verseResults.current,
          totalCorrect,
          totalWords,
          completedAt: Date.now(),
        });
      }
    },
    [verse, words, input, verseIdx, verses.length, source, onComplete, onVerseChange],
  );

  const handleSubmit = useCallback(() => {
    if (showAnswer) {
      advanceVerse(false);
      return;
    }

    const normalizedInput = normalizeTranslit(input);
    if (normalizedInput === normalizedExpected) {
      advanceVerse(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setShowAnswer(true);
      }
    }
  }, [input, normalizedExpected, attempts, showAnswer, advanceVerse]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleHint = useCallback(() => {
    const nextHint = hintCount + 1;
    setHintCount(nextHint);
    setInput(expectedTranslit.slice(0, nextHint));
    handleInput(expectedTranslit.slice(0, nextHint));
  }, [hintCount, expectedTranslit, handleInput]);

  if (words.length === 0) return null;

  const normalizedInputDisplay = normalizeTranslit(input);

  return (
    <div className="flex flex-col p-4">
      {/* Verse info */}
      <div className="mb-4 flex items-center justify-between text-[12px] text-[var(--theme-text-tertiary)]">
        <span>{t.memorize.verse} {verse.verse_number}</span>
        <span className="tabular-nums">{verseIdx + 1} / {verses.length}</span>
      </div>

      {/* Full verse display */}
      <div className="mb-6 rounded-2xl bg-[var(--theme-bg-primary)] p-6 text-center shadow-[var(--shadow-card)]">
        {/* Arabic — full verse */}
        <p className="arabic-text mb-3 text-[28px] font-semibold leading-[2] text-[var(--theme-text)]" dir="rtl">
          {words.map((w) => w.text_imlaei || w.text).join(" ")}
        </p>

        {/* Faint transliteration hint */}
        {expectedTranslit && (
          <p className="mb-3 text-[13px] italic text-[var(--theme-text-tertiary)] opacity-40 leading-relaxed" style={{ fontFamily: "var(--font-sans)" }}>
            {expectedTranslit}
          </p>
        )}

        {/* Answer reveal */}
        {showAnswer && (
          <div className="mb-4 rounded-lg bg-amber-500/10 px-3 py-2">
            <p className="font-sans text-[14px] font-medium text-amber-600 leading-relaxed">{expectedTranslit}</p>
          </div>
        )}

        {/* Char-by-char feedback */}
        {normalizedInputDisplay.length > 0 && !showAnswer && (
          <div className="mb-4 flex flex-wrap justify-center gap-px">
            {Array.from(normalizedInputDisplay).map((char, i) => (
              <span
                key={i}
                className={`inline-block font-mono text-[16px] ${
                  char === " " ? "w-2" : ""
                } ${
                  i < charFeedback.length
                    ? charFeedback[i] === "correct"
                      ? "text-emerald-600"
                      : "text-red-500"
                    : "text-[var(--theme-text-tertiary)]"
                }`}
              >
                {char === " " ? "\u00A0" : char}
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.memorize.typeHere}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className="w-full rounded-xl border-2 border-[var(--theme-divider)] bg-[var(--theme-bg)] px-4 py-3 text-center text-[16px] text-[var(--theme-text)] placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500 focus:outline-none"
        />

        {/* Attempt indicator */}
        {attempts > 0 && !showAnswer && (
          <p className="mt-2 text-[12px] text-red-500">
            {t.memorize.wrongAttempt} ({attempts}/3)
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleHint}
          disabled={showAnswer || hintCount >= normalizedExpected.length}
          className="flex-1 rounded-xl border border-[var(--theme-divider)] bg-[var(--theme-bg-primary)] py-3 text-[14px] font-medium text-[var(--theme-text-secondary)] disabled:opacity-30"
        >
          {t.memorize.hint} {hintCount > 0 && `(${hintCount})`}
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 rounded-xl bg-primary-600 py-3 text-[14px] font-medium text-white"
        >
          {showAnswer ? t.memorize.nextVerse : t.memorize.checkWord}
        </button>
      </div>
    </div>
  );
}
