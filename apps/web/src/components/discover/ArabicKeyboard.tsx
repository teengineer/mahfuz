import { memo } from "react";

const ARABIC_LETTERS = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ",
  "د", "ذ", "ر", "ز", "س", "ش", "ص",
  "ض", "ط", "ظ", "ع", "غ", "ف", "ق",
  "ك", "ل", "م", "ن", "ه", "و", "ي",
];

interface ArabicKeyboardProps {
  onChar: (char: string) => void;
  onBackspace: () => void;
  onClear: () => void;
}

export const ArabicKeyboard = memo(function ArabicKeyboard({
  onChar,
  onBackspace,
  onClear,
}: ArabicKeyboardProps) {
  return (
    <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-2">
      <div className="flex flex-wrap gap-1" dir="rtl">
        {ARABIC_LETTERS.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => onChar(letter)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[16px] font-medium text-[var(--theme-text)] transition-colors hover:bg-[var(--theme-hover-bg)] active:bg-primary-600/10 active:text-primary-600"
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <button
          type="button"
          onClick={onBackspace}
          className="flex-1 rounded-lg bg-[var(--theme-hover-bg)] py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
        >
          ⌫
        </button>
        <button
          type="button"
          onClick={onClear}
          className="flex-1 rounded-lg bg-[var(--theme-hover-bg)] py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)]"
        >
          ✕
        </button>
      </div>
    </div>
  );
});
