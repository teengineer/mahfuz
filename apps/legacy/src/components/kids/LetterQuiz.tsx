import { useState, useMemo, useCallback } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { ARABIC_LETTERS, type ArabicLetter } from "~/lib/kids-constants";
import { useKidsSound } from "~/lib/kids-sounds";

interface LetterQuizProps {
  letter: ArabicLetter;
  onComplete: (correctCount: number, totalQuestions: number) => void;
}

interface Question {
  type: "name-to-letter" | "letter-to-name" | "order";
  prompt: string;
  promptSub?: string;
  options: string[];
  correctIndex: number;
}

export function LetterQuiz({ letter, onComplete }: LetterQuizProps) {
  const { t } = useTranslation();
  const sound = useKidsSound();
  const [questionIdx, setQuestionIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  const questions = useMemo<Question[]>(() => {
    const others = ARABIC_LETTERS.filter((l) => l.id !== letter.id);
    const pick3 = () => [...others].sort(() => Math.random() - 0.5).slice(0, 3);

    // Q1: Name → Letter
    const q1Distractors = pick3();
    const q1Options = [...q1Distractors.map((l) => l.arabic), letter.arabic].sort(() => Math.random() - 0.5);
    const q1: Question = {
      type: "name-to-letter",
      prompt: `${letter.name} ${t.kids.letters.whichLetter}`,
      options: q1Options,
      correctIndex: q1Options.indexOf(letter.arabic),
    };

    // Q2: Letter → Name
    const q2Distractors = pick3();
    const q2Options = [...q2Distractors.map((l) => l.name), letter.name].sort(() => Math.random() - 0.5);
    const q2: Question = {
      type: "letter-to-name",
      prompt: letter.arabic,
      promptSub: t.kids.letters.whatIsTheName,
      options: q2Options,
      correctIndex: q2Options.indexOf(letter.name),
    };

    // Q3: Order
    const correctOrder = String(letter.order);
    const orderOptions = new Set<string>([correctOrder]);
    while (orderOptions.size < 4) {
      const rand = Math.max(1, Math.min(28, letter.order + Math.floor(Math.random() * 9) - 4));
      orderOptions.add(String(rand));
    }
    const q3Options = [...orderOptions].sort(() => Math.random() - 0.5);
    const q3: Question = {
      type: "order",
      prompt: letter.arabic,
      promptSub: t.kids.letters.whichOrder,
      options: q3Options,
      correctIndex: q3Options.indexOf(correctOrder),
    };

    return [q1, q2, q3];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letter.id]);

  const TOTAL = questions.length;
  const current = questions[questionIdx];

  const handleAnswer = useCallback(
    (idx: number) => {
      if (result) return;
      setSelected(idx);

      const isCorrect = idx === current.correctIndex;
      if (isCorrect) {
        setResult("correct");
        setCorrectCount((c) => c + 1);
        sound.correct();
      } else {
        setResult("wrong");
        sound.incorrect();
      }

      setTimeout(() => {
        const nextQ = questionIdx + 1;
        if (nextQ >= TOTAL) {
          onComplete(correctCount + (isCorrect ? 1 : 0), TOTAL);
        } else {
          setQuestionIdx(nextQ);
          setSelected(null);
          setResult(null);
        }
      }, 1000);
    },
    [current, questionIdx, result, correctCount, onComplete, sound, TOTAL],
  );

  return (
    <div className="flex flex-col items-center gap-5 py-6">
      <h2 className="text-xl font-bold text-amber-700">{t.kids.letters.quiz}</h2>

      <p className="font-semibold text-amber-500" style={{ fontSize: "15px" }}>
        {t.kids.quizzes.questionOf} {questionIdx + 1}/{TOTAL}
      </p>

      <div className="rounded-2xl bg-amber-50 px-6 py-5 text-center shadow-sm">
        <p className={`font-bold text-gray-800 ${current.type !== "name-to-letter" ? "font-arabic" : ""}`}
          style={{ fontSize: current.type !== "name-to-letter" ? "48px" : "24px" }}
          dir={current.type !== "name-to-letter" ? "rtl" : undefined}
        >
          {current.prompt}
        </p>
        {current.promptSub && (
          <p className="mt-2 text-gray-500" style={{ fontSize: "16px" }}>{current.promptSub}</p>
        )}
      </div>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {current.options.map((opt, idx) => {
          const isSelected = selected === idx;
          const isCorrect = idx === current.correctIndex;
          let bg = "bg-white";
          let border = "border-gray-200";
          let textColor = "text-gray-800";

          if (result && isCorrect) {
            bg = "bg-emerald-100";
            border = "border-emerald-400";
            textColor = "text-emerald-700";
          } else if (isSelected && result === "wrong") {
            bg = "bg-orange-50";
            border = "border-orange-300";
            textColor = "text-orange-600";
          }

          const isArabic = current.type === "name-to-letter";

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={result !== null}
              className={`rounded-xl border-2 ${border} ${bg} px-5 py-4 text-center transition-transform active:scale-95`}
            >
              <span
                className={`font-semibold ${textColor} ${isArabic ? "font-arabic" : ""}`}
                style={{ fontSize: isArabic ? "36px" : "20px" }}
                dir={isArabic ? "rtl" : undefined}
              >
                {opt}
              </span>
            </button>
          );
        })}
      </div>

      {result === "correct" && (
        <p className="animate-bounce text-lg font-bold text-emerald-500">{t.kids.quizzes.correct}</p>
      )}
      {result === "wrong" && (
        <p className="text-sm font-semibold text-orange-400">{t.kids.quizzes.tryAgain}</p>
      )}

      <div className="flex items-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full ${
              i < questionIdx
                ? "bg-amber-400"
                : i === questionIdx
                  ? "bg-amber-200"
                  : "bg-gray-200"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
