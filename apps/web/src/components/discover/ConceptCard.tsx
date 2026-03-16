import { memo } from "react";
import type { Concept } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

interface ConceptCardProps {
  concept: Concept;
  onClick: () => void;
}

export const ConceptCard = memo(function ConceptCard({ concept, onClick }: ConceptCardProps) {
  const { t, locale } = useTranslation();
  const name = locale === "en" ? concept.name.en : concept.name.tr;
  const desc = locale === "en" ? concept.description.en : concept.description.tr;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-start gap-1.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-3 text-left transition-all hover:border-primary-300 hover:shadow-[var(--shadow-elevated)] active:scale-[0.98]"
    >
      <div className="flex items-center gap-2">
        {concept.icon && <span className="text-[18px]">{concept.icon}</span>}
        <span className="text-[14px] font-semibold text-[var(--theme-text)]">{name}</span>
      </div>
      <p className="line-clamp-2 text-[12px] leading-snug text-[var(--theme-text-secondary)]">
        {desc}
      </p>
      <span className="text-[10px] tabular-nums text-[var(--theme-text-quaternary)]">
        {concept.refs.length} {t.discover.verseCount}
      </span>
    </button>
  );
});
