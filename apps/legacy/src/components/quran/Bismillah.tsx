import { usePreferencesStore, getArabicFontSizeForMode } from "~/stores/usePreferencesStore";

export function Bismillah() {
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const wbwArabicFontSize = usePreferencesStore((s) => s.wbwArabicFontSize);
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const showWordByWord = usePreferencesStore((s) => s.showWordByWord);
  const scale = getArabicFontSizeForMode({ viewMode, showWordByWord, normalArabicFontSize, wbwArabicFontSize, mushafArabicFontSize });

  const fontSize = 32 * scale;

  return (
    <div className="my-10 flex flex-col items-center px-4" dir="rtl">
      {/* Decorative top ornament */}
      <div className="mb-3 flex items-center gap-3 opacity-30">
        <span className="h-px w-12 bg-[var(--theme-text-tertiary)]" />
        <svg className="h-3 w-3 text-[var(--theme-text-tertiary)]" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 0l1.76 3.57L12 4.18 8.82 7.07l.94 4.93L6 9.76 2.24 12l.94-4.93L0 4.18l4.24-.61z" />
        </svg>
        <span className="h-px w-12 bg-[var(--theme-text-tertiary)]" />
      </div>

      {/* Bismillah text */}
      <p
        className="arabic-text text-[var(--theme-text)]"
        style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
      >
        ﷽
      </p>

      {/* Decorative bottom separator */}
      <div className="mt-3 flex items-center gap-3 opacity-30">
        <span className="h-px w-16 bg-[var(--theme-text-tertiary)]" />
        <span className="h-1 w-1 rounded-full bg-[var(--theme-text-tertiary)]" />
        <span className="h-px w-16 bg-[var(--theme-text-tertiary)]" />
      </div>
    </div>
  );
}
