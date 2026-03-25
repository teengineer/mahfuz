import { memo } from "react";
import type { RootEntry } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

const ARABIC_TO_LATIN: Record<string, string> = {
  "ا": "ā", "أ": "ā", "إ": "ā", "آ": "ā",
  "ب": "b", "ت": "t", "ث": "th", "ج": "j",
  "ح": "ḥ", "خ": "kh", "د": "d", "ذ": "dh",
  "ر": "r", "ز": "z", "س": "s", "ش": "sh",
  "ص": "ṣ", "ض": "ḍ", "ط": "ṭ", "ظ": "ẓ",
  "ع": "ʿ", "غ": "gh", "ف": "f", "ق": "q",
  "ك": "k", "ل": "l", "م": "m", "ن": "n",
  "ه": "h", "و": "w", "ي": "y", "ء": "ʾ",
};

function transliterateRoot(root: string): string {
  return root
    .split("")
    .map((ch) => ARABIC_TO_LATIN[ch] ?? "")
    .filter(Boolean)
    .join("-");
}

interface RootCardProps {
  entry: RootEntry;
  maxCount: number;
  onClick: () => void;
}

export const RootCard = memo(function RootCard({ entry, maxCount, onClick }: RootCardProps) {
  const { t, locale } = useTranslation();
  const meaning = locale === "en" ? entry.meaning.en : entry.meaning.tr;
  const hasMeaning = Boolean(meaning);
  const normalizedFreq = maxCount > 0 ? Math.max(3, (entry.count / maxCount) * 100) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl bg-[var(--theme-bg-primary)] px-3 py-2.5 text-left transition-colors hover:bg-[var(--theme-hover-bg)] active:scale-[0.98] sm:gap-4 sm:px-4 sm:py-3"
    >
      {/* Arabic root */}
      <span
        className="arabic-text w-16 shrink-0 text-center text-[20px] font-bold leading-none text-[var(--theme-text)] sm:w-20 sm:text-[22px]"
        dir="rtl"
      >
        {entry.letters}
      </span>

      {/* Meaning + transliteration */}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[13px] leading-snug ${
            hasMeaning
              ? "text-[var(--theme-text-secondary)]"
              : "italic text-[var(--theme-text-quaternary)]"
          }`}
        >
          {meaning || t.discover.noMeaning}
        </p>
        <span className="text-[10px] uppercase tracking-wider text-[var(--theme-text-quaternary)]">
          {transliterateRoot(entry.root)}
        </span>
      </div>

      {/* Frequency */}
      <div className="flex shrink-0 flex-col items-end gap-1">
        <span className="text-[12px] font-semibold tabular-nums text-primary-600">
          {entry.count}
        </span>
        <div className="h-1 w-10 overflow-hidden rounded-full bg-[var(--theme-bg)]">
          <div
            className="h-full rounded-full bg-primary-600"
            style={{ width: `${normalizedFreq}%` }}
          />
        </div>
      </div>
    </button>
  );
});
