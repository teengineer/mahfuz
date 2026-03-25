import { memo } from "react";
import type { Concept } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { EmojiIcon } from "~/components/icons/EmojiIcon";

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
      className="flex flex-col items-start gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-4 text-left shadow-[var(--shadow-card)] transition-all hover:border-primary-300 hover:shadow-[var(--shadow-elevated)] active:scale-[0.98]"
    >
      <div className="flex items-center gap-2">
        {concept.icon && <EmojiIcon emoji={concept.icon} className="h-5 w-5" />}
        <span className="text-[14px] font-bold text-[var(--theme-text)]">{name}</span>
      </div>
      <p className="line-clamp-2 text-[12px] leading-relaxed text-[var(--theme-text-secondary)]">
        {desc}
      </p>
      <span className="mt-1 text-[10px] tabular-nums text-[var(--theme-text-quaternary)]">
        {concept.refs.length} {t.discover.verseCount}
      </span>
    </button>
  );
});
