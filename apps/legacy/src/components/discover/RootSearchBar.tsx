import { memo, useState, useCallback, useRef, useEffect } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChar = useCallback(
    (char: string) => onChange(value + char),
    [value, onChange],
  );
  const handleBackspace = useCallback(
    () => onChange(value.slice(0, -1)),
    [value, onChange],
  );
  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        {/* Search input */}
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[var(--theme-text-quaternary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t.discover.searchRoots}
            className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input-bg)] py-3 pl-11 pr-10 text-[14px] text-[var(--theme-text)] placeholder:text-[var(--theme-text-quaternary)] outline-none transition-all duration-200 focus:border-primary-400/60 focus:shadow-[0_0_0_3px_rgba(var(--color-primary-500-rgb,99,102,241),0.08)]"
            dir="rtl"
          />
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--theme-text-quaternary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Keyboard toggle */}
        <button
          type="button"
          onClick={() => setShowKeyboard((v) => !v)}
          className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl border transition-all duration-200 ${
            showKeyboard
              ? "border-primary-400/60 bg-primary-600/10 text-primary-600 shadow-[0_0_0_3px_rgba(var(--color-primary-500-rgb,99,102,241),0.08)]"
              : "border-[var(--theme-border)] bg-[var(--theme-bg-primary)] text-[var(--theme-text-tertiary)] hover:border-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-secondary)]"
          }`}
          title={t.discover.keyboard}
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h17.25c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125H3.375A1.125 1.125 0 012.25 16.875v-9.75zM6.75 10.5h.008v.008H6.75V10.5zm3.75 0h.008v.008h-.008V10.5zm3.75 0h.008v.008h-.008V10.5zm-7.5 3h.008v.008H6.75V13.5zm3.75 0h.008v.008h-.008V13.5zm3.75 0h.008v.008h-.008V13.5z" />
          </svg>
        </button>
      </div>

      {/* Arabic keyboard — animated collapse */}
      <div
        className="overflow-hidden transition-all duration-200 ease-out"
        style={{
          maxHeight: showKeyboard ? "180px" : "0px",
          opacity: showKeyboard ? 1 : 0,
        }}
      >
        <ArabicKeyboard
          onChar={handleChar}
          onBackspace={handleBackspace}
          onClear={handleClear}
        />
      </div>
    </div>
  );
});
