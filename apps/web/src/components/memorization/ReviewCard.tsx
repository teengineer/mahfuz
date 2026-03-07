import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MemorizationCard, QualityGrade } from "@mahfuz/shared/types";
import { verseByKeyQueryOptions } from "~/hooks/useVerses";

const GRADE_LABELS: Record<QualityGrade, { label: string; color: string }> = {
  0: { label: "Hatırlamadım", color: "bg-red-500 hover:bg-red-600" },
  1: { label: "Çok Zor", color: "bg-red-400 hover:bg-red-500" },
  2: { label: "Zor", color: "bg-orange-400 hover:bg-orange-500" },
  3: { label: "Orta", color: "bg-yellow-500 hover:bg-yellow-600" },
  4: { label: "Kolay", color: "bg-blue-500 hover:bg-blue-600" },
  5: { label: "Çok Kolay", color: "bg-emerald-500 hover:bg-emerald-600" },
};

interface ReviewCardProps {
  card: MemorizationCard;
  revealedWords: number;
  totalWords: number;
  onRevealNext: () => void;
  onRevealAll: () => void;
  onGrade: (grade: QualityGrade) => void;
  onSetRevealState: (revealed: number, total: number) => void;
}

export function ReviewCard({
  card,
  revealedWords,
  totalWords,
  onRevealNext,
  onRevealAll,
  onGrade,
  onSetRevealState,
}: ReviewCardProps) {
  const { data: verseData, isLoading } = useQuery(
    verseByKeyQueryOptions(card.verseKey),
  );

  const verse = verseData;
  const words = verse?.words?.filter((w: any) => w.char_type_name === "word") || [];
  const isFullyRevealed = revealedWords >= words.length && words.length > 0;

  // Set total word count when verse loads
  useEffect(() => {
    if (words.length > 0 && totalWords !== words.length) {
      onSetRevealState(revealedWords, words.length);
    }
  }, [words.length, totalWords, revealedWords, onSetRevealState]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (!verse) {
    return (
      <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-[var(--theme-text-tertiary)]">
          Ayet yüklenemedi: {card.verseKey}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)] sm:p-8">
      {/* Verse key label + word count */}
      <div className="mb-4 text-center">
        <span className="text-[12px] tabular-nums text-[var(--theme-text-quaternary)]">
          {card.verseKey}
        </span>
        {words.length > 0 && !isFullyRevealed && (
          <p className="mt-1 text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">
            {revealedWords} / {words.length} kelime
          </p>
        )}
      </div>

      {/* Arabic text with progressive reveal */}
      <div className="mb-6" dir="rtl">
        <p className="arabic-text text-center leading-[2.6] text-[var(--theme-text)]" style={{ fontSize: "calc(1.65rem * 1.1)" }}>
          {words.map((w, i) => {
            const isRevealed = i < revealedWords;
            return (
              <span
                key={w.id}
                className={`inline-block transition-[filter,opacity] duration-500 ease-out ${
                  isRevealed
                    ? "opacity-100"
                    : "cursor-pointer select-none opacity-40"
                }`}
                style={{
                  filter: isRevealed ? "blur(0px)" : "blur(8px)",
                }}
                onClick={!isRevealed ? onRevealNext : undefined}
              >
                {w.text_uthmani}{" "}
              </span>
            );
          })}
        </p>
      </div>

      {/* Actions */}
      {!isFullyRevealed ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex gap-3">
            <button
              onClick={onRevealNext}
              className="rounded-xl bg-primary-600 px-5 py-2.5 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-primary-700 active:scale-[0.97]"
            >
              Sonraki Kelime
            </button>
            <button
              onClick={onRevealAll}
              className="rounded-xl bg-[var(--theme-hover-bg)] px-5 py-2.5 text-[14px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-pill-bg)]"
            >
              Tamamını Göster
            </button>
          </div>
          <button
            onClick={() => onGrade(5)}
            className="text-[13px] text-[var(--theme-text-tertiary)] transition-colors hover:text-emerald-600"
          >
            Ezberledim ✓
          </button>
        </div>
      ) : (
        <>
          {/* Turkish translation (collapsible) */}
          {verse.translations && verse.translations.length > 0 && (
            <div className="mb-6 border-l-2 border-[var(--theme-divider)] py-1 pl-4">
              <p
                className="text-[14px] leading-[1.8] text-[var(--theme-text-secondary)]"
                dangerouslySetInnerHTML={{
                  __html: verse.translations[0].text,
                }}
              />
            </div>
          )}

          {/* Grade buttons */}
          <GradeButtons onGrade={onGrade} />
        </>
      )}
    </div>
  );
}

const SIMPLE_GRADES: { grade: QualityGrade; label: string; color: string }[] = [
  { grade: 1, label: "Tekrar", color: "bg-red-500 hover:bg-red-600" },
  { grade: 3, label: "Zor", color: "bg-orange-400 hover:bg-orange-500" },
  { grade: 5, label: "Kolay", color: "bg-emerald-500 hover:bg-emerald-600" },
];

function GradeButtons({ onGrade }: { onGrade: (grade: QualityGrade) => void }) {
  const [showDetailed, setShowDetailed] = useState(false);

  return (
    <div className="mt-4">
      <p className="mb-3 text-center text-[13px] text-[var(--theme-text-tertiary)]">
        Bu ayeti ne kadar hatırladın?
      </p>
      {!showDetailed ? (
        <div className="grid grid-cols-3 gap-2">
          {SIMPLE_GRADES.map(({ grade, label, color }) => (
            <button
              key={grade}
              onClick={() => onGrade(grade)}
              className={`rounded-xl px-2 py-3 text-[14px] font-medium text-white transition-all active:scale-[0.97] ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {([0, 1, 2, 3, 4, 5] as QualityGrade[]).map((grade) => (
            <button
              key={grade}
              onClick={() => onGrade(grade)}
              className={`rounded-xl px-2 py-2.5 text-[13px] font-medium text-white transition-all active:scale-[0.97] ${GRADE_LABELS[grade].color}`}
            >
              <span className="block text-[16px]">{grade}</span>
              <span className="block text-[11px] opacity-90">
                {GRADE_LABELS[grade].label}
              </span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setShowDetailed(!showDetailed)}
        className="mt-2 w-full text-center text-[12px] text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-tertiary)]"
      >
        {showDetailed ? "Basit puanlama" : "Detaylı puanlama"}
      </button>
    </div>
  );
}
