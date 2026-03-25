import { memo } from "react";
import { EmojiIcon } from "~/components/icons/EmojiIcon";

// Rows modeled after standard Arabic keyboard layout
const ROWS = [
  ["ض", "ص", "ث", "ق", "ف", "غ", "ع", "ه", "خ", "ح", "ج", "د"],
  ["ش", "س", "ي", "ب", "ل", "ا", "ت", "ن", "م", "ك", "ط"],
  ["ئ", "ء", "ؤ", "ر", "ى", "ة", "و", "ز", "ظ", "ذ"],
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
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] p-2.5 sm:p-3">
      {ROWS.map((row, ri) => (
        <div key={ri} className="mb-1 flex justify-center gap-[3px] sm:gap-1" dir="rtl">
          {/* Backspace on last row start */}
          {ri === 2 && (
            <button
              type="button"
              onClick={onBackspace}
              className="flex h-9 w-12 items-center justify-center rounded-lg bg-[var(--theme-hover-bg)] text-[13px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)] active:bg-primary-600/10 sm:w-14"
            >
              ⌫
            </button>
          )}
          {row.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => onChar(letter)}
              className="flex h-9 w-8 items-center justify-center rounded-lg text-[15px] text-[var(--theme-text)] transition-all duration-100 hover:bg-[var(--theme-hover-bg)] active:scale-90 active:bg-primary-600/10 active:text-primary-600 sm:w-9 sm:text-[16px]"
            >
              {letter}
            </button>
          ))}
          {/* Clear on last row end */}
          {ri === 2 && (
            <button
              type="button"
              onClick={onClear}
              className="flex h-9 w-12 items-center justify-center rounded-lg bg-[var(--theme-hover-bg)] text-[13px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-pill-bg)] active:bg-primary-600/10 sm:w-14"
            >
              <EmojiIcon emoji="✕" className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
});
