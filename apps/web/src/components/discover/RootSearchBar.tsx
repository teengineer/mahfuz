import { memo, useState, useCallback } from "react";
import { useTranslation } from "~/hooks/useTranslation";
import { ArabicKeyboard } from "./ArabicKeyboard";

interface RootSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export const RootSearchBar = memo(function RootSearchBar({
  value,
  onChange,
}: RootSearchBarProps) {
  const { t } = useTranslation();
  const [showKeyboard, setShowKeyboard] = useState(false);

  const handleChar = useCallback(
    (char: string) => onChange(value + char),
    [value, onChange],
  );
  const handleBackspace = useCallback(
    () => onChange(value.slice(0, -1)),
    [value, onChange],
  );
  const handleClear = useCallback(() => onChange(""), [onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-tertiary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t.discover.searchRoots}
            className="w-full rounded-xl bg-[var(--theme-input-bg)] py-2.5 pl-10 pr-10 text-[14px] text-[var(--theme-text)] placeholder:text-[var(--theme-text-quaternary)] outline-none transition-colors focus:ring-2 focus:ring-primary-500/30"
            dir="rtl"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text)]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowKeyboard((v) => !v)}
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors ${
            showKeyboard
              ? "border-primary-400 bg-primary-600/10 text-primary-600"
              : "border-[var(--theme-border)] bg-[var(--theme-bg-primary)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
          }`}
          title={t.discover.keyboard}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h17.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H3.375A1.125 1.125 0 012.25 16.875v-9.75zM6.75 10.5h.008v.008H6.75V10.5zm3.75 0h.008v.008h-.008V10.5zm3.75 0h.008v.008h-.008V10.5zm-7.5 3h.008v.008H6.75V13.5zm3.75 0h.008v.008h-.008V13.5zm3.75 0h.008v.008h-.008V13.5z" />
          </svg>
        </button>
      </div>
      {showKeyboard && (
        <ArabicKeyboard
          onChar={handleChar}
          onBackspace={handleBackspace}
          onClear={handleClear}
        />
      )}
    </div>
  );
});
