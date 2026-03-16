import { memo } from "react";
import type { RootEntry } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

interface RootCardProps {
  entry: RootEntry;
  onClick: () => void;
}

export const RootCard = memo(function RootCard({ entry, onClick }: RootCardProps) {
  const { t, locale } = useTranslation();
  const meaning = locale === "en" ? entry.meaning.en : entry.meaning.tr;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-3 text-left transition-all hover:border-primary-300 hover:shadow-[var(--shadow-elevated)] active:scale-[0.98]"
    >
      {/* Root letters */}
      <span className="arabic-text text-[22px] font-bold leading-tight text-[var(--theme-text)]" dir="rtl">
        {entry.letters}
      </span>

      {/* Meaning */}
      <span className="line-clamp-2 text-[12px] leading-snug text-[var(--theme-text-secondary)]">
        {meaning || t.discover.noMeaning}
      </span>

      {/* Stats */}
      <div className="flex w-full items-center gap-2">
        <span className="rounded-full bg-primary-600/10 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-primary-600">
          {entry.count} {t.discover.occurrences}
        </span>
        <span className="text-[10px] tabular-nums text-[var(--theme-text-quaternary)]">
          {entry.formCount} {t.discover.forms}
        </span>
      </div>
    </button>
  );
});
