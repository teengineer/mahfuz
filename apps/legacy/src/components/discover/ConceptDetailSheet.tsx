import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { Concept } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { EmojiIcon } from "~/components/icons/EmojiIcon";

interface ConceptDetailSheetProps {
  concept: Concept;
  allConceptIds: Set<string>;
  onClose: () => void;
  onConceptClick?: (conceptId: string) => void;
}

export const ConceptDetailSheet = memo(function ConceptDetailSheet({
  concept,
  allConceptIds,
  onClose,
  onConceptClick,
}: ConceptDetailSheetProps) {
  const { t, locale } = useTranslation();
  const name = locale === "en" ? concept.name.en : concept.name.tr;
  const desc = locale === "en" ? concept.description.en : concept.description.tr;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-[var(--theme-bg)] p-6 shadow-[var(--shadow-modal)] sm:rounded-2xl sm:p-8" style={{ maxHeight: "85vh", overflow: "auto" }}>
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2">
            {concept.icon && <EmojiIcon emoji={concept.icon} className="h-6 w-6" />}
            <h2 className="text-[22px] font-bold text-[var(--theme-text)]">{name}</h2>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--theme-text-secondary)]">
            {desc}
          </p>
        </div>

        {/* Related concepts — only show those that actually exist */}
        {concept.relatedConcepts && concept.relatedConcepts.filter((cid) => allConceptIds.has(cid)).length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
              {t.discover.relatedConcepts}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {concept.relatedConcepts.filter((cid) => allConceptIds.has(cid)).map((cid) => (
                <button
                  key={cid}
                  type="button"
                  onClick={() => onConceptClick?.(cid)}
                  className="rounded-full bg-[var(--theme-pill-bg)] px-3 py-1 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-primary-600/10 hover:text-primary-600"
                >
                  {cid}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Related roots */}
        {concept.relatedRoots && concept.relatedRoots.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
              {t.discover.relatedRoots}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {concept.relatedRoots.map((rk) => (
                <Link
                  key={rk}
                  to="/discover/$tab"
                  params={{ tab: "dictionary" }}
                  search={{ root: rk }}
                  className="arabic-text rounded-full bg-[var(--theme-pill-bg)] px-3 py-1 text-[14px] text-[var(--theme-text-secondary)] transition-colors hover:bg-primary-600/10 hover:text-primary-600"
                  dir="rtl"
                >
                  {rk}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Verse references */}
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-[var(--theme-text)]">
            {t.discover.verseReferences} ({concept.refs.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {concept.refs.map((ref) => {
              const [surah] = ref.split(":");
              return (
                <Link
                  key={ref}
                  to="/$surahId"
                  params={{ surahId: surah }}
                  className="rounded-full bg-[var(--theme-pill-bg)] px-2.5 py-1 text-[11px] font-medium tabular-nums text-[var(--theme-text-secondary)] transition-colors hover:bg-primary-600/10 hover:text-primary-600"
                >
                  {ref}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
