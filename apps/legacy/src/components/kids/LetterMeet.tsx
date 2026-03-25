import { useMemo } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { getLetterForms } from "~/lib/kids-constants";
import type { ArabicLetter } from "~/lib/kids-constants";

interface LetterMeetProps {
  letter: ArabicLetter;
  onComplete: () => void;
}

const FORM_KEYS = ["isolated", "initial", "medial", "final"] as const;

export function LetterMeet({ letter, onComplete }: LetterMeetProps) {
  const { t } = useTranslation();
  const forms = useMemo(() => getLetterForms(letter.arabic), [letter.arabic]);

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      {/* Big letter with animation */}
      <div className="animate-[scaleIn_0.6s_ease-out_forwards] flex h-72 w-72 items-center justify-center rounded-3xl bg-white shadow-xl">
        <span className="font-arabic leading-none text-emerald-600" style={{ fontSize: "180px" }} dir="rtl">
          {letter.arabic}
        </span>
      </div>

      {/* Letter info */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-800">{letter.name}</h2>
        <p className="mt-1 font-arabic text-gray-500" style={{ fontSize: "28px" }} dir="rtl">{letter.nameAr}</p>
        <p className="mt-1 text-gray-400" style={{ fontSize: "16px" }}>#{letter.order} / 28</p>
      </div>

      {/* Forms: isolated, initial, medial, final */}
      <div className="grid grid-cols-4 gap-3" dir="rtl">
        {FORM_KEYS.map((form) => (
          <div key={form} className="flex flex-col items-center gap-2 rounded-xl bg-white p-4 shadow-sm">
            <span className="font-arabic text-gray-700" style={{ fontSize: "40px" }} dir="rtl">{forms[form]}</span>
            <span className="font-medium text-gray-400" style={{ fontSize: "13px" }}>
              {t.kids.letters.forms[form]}
            </span>
          </div>
        ))}
      </div>

      {/* Continue button */}
      <button
        onClick={onComplete}
        className="mt-4 rounded-2xl bg-emerald-500 px-10 py-4 text-lg font-bold text-white shadow-lg transition-transform active:scale-95"
      >
        {t.kids.common.next} →
      </button>

      <style>{`
        @keyframes scaleIn {
          0% { opacity: 0; transform: scale(0.5) rotate(-10deg); }
          60% { transform: scale(1.05) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
