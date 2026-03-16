import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { RootEntry, RootEnrichment } from "@mahfuz/shared/types";
import { rootEnrichmentQueryOptions } from "~/hooks/useDiscover";
import { useTranslation } from "~/hooks/useTranslation";

interface RootDetailSheetProps {
  entry: RootEntry;
  onClose: () => void;
  onRootClick?: (rootKey: string) => void;
}

export const RootDetailSheet = memo(function RootDetailSheet({
  entry,
  onClose,
  onRootClick,
}: RootDetailSheetProps) {
  const { t, locale } = useTranslation();
  const { data: enrichmentMap } = useQuery(rootEnrichmentQueryOptions());
  const enrichment: RootEnrichment | undefined = enrichmentMap?.[entry.root];
  const meaning = locale === "en" ? entry.meaning.en : entry.meaning.tr;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Sheet */}
      <div className="relative z-10 w-full max-w-lg rounded-t-2xl bg-[var(--theme-bg)] p-5 shadow-[var(--shadow-modal)] sm:rounded-2xl sm:p-6" style={{ maxHeight: "85vh", overflow: "auto" }}>
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Root letters */}
        <div className="mb-4 text-center">
          <span className="arabic-text text-[36px] font-bold text-[var(--theme-text)]" dir="rtl">
            {entry.letters}
          </span>
          <p className="mt-1 text-[15px] font-medium text-[var(--theme-text-secondary)]">
            {meaning || t.discover.noMeaning}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-4 flex items-center justify-center gap-4">
          <div className="text-center">
            <span className="text-[18px] font-bold tabular-nums text-primary-600">{entry.count}</span>
            <span className="block text-[11px] text-[var(--theme-text-tertiary)]">{t.discover.occurrences}</span>
          </div>
          <div className="h-8 w-px bg-[var(--theme-border)]" />
          <div className="text-center">
            <span className="text-[18px] font-bold tabular-nums text-[var(--theme-text)]">{entry.formCount}</span>
            <span className="block text-[11px] text-[var(--theme-text-tertiary)]">{t.discover.forms}</span>
          </div>
        </div>

        {/* Related roots */}
        {enrichment?.relatedRoots && enrichment.relatedRoots.length > 0 && (
          <div className="mb-4">
            <h3 className="mb-2 text-[13px] font-semibold text-[var(--theme-text)]">
              {t.discover.relatedRoots}
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {enrichment.relatedRoots.map((rk) => (
                <button
                  key={rk}
                  type="button"
                  onClick={() => onRootClick?.(rk)}
                  className="arabic-text rounded-full bg-[var(--theme-pill-bg)] px-3 py-1 text-[14px] text-[var(--theme-text-secondary)] transition-colors hover:bg-primary-600/10 hover:text-primary-600"
                  dir="rtl"
                >
                  {rk}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Enrichment sections */}
        {enrichment && (
          <div className="mb-4 space-y-3">
            {enrichment.rhetoric && (enrichment.rhetoric.tr || enrichment.rhetoric.en) && (
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--theme-text)]">{t.discover.rhetoric}</h3>
                <p className="text-[13px] text-[var(--theme-text-secondary)]">
                  {locale === "en" ? enrichment.rhetoric.en : enrichment.rhetoric.tr}
                </p>
              </div>
            )}
            {enrichment.etymology && (enrichment.etymology.tr || enrichment.etymology.en) && (
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--theme-text)]">{t.discover.etymology}</h3>
                <p className="text-[13px] text-[var(--theme-text-secondary)]">
                  {locale === "en" ? enrichment.etymology.en : enrichment.etymology.tr}
                </p>
              </div>
            )}
            {enrichment.semanticField && (enrichment.semanticField.tr || enrichment.semanticField.en) && (
              <div>
                <h3 className="text-[13px] font-semibold text-[var(--theme-text)]">{t.discover.semanticField}</h3>
                <p className="text-[13px] text-[var(--theme-text-secondary)]">
                  {locale === "en" ? enrichment.semanticField.en : enrichment.semanticField.tr}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Verse references */}
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-[var(--theme-text)]">
            {t.discover.verseReferences}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {entry.locations.slice(0, 20).map((loc) => {
              const [surah] = loc.split(":");
              return (
                <Link
                  key={loc}
                  to="/$surahId"
                  params={{ surahId: surah }}
                  className="rounded-full bg-[var(--theme-pill-bg)] px-2.5 py-1 text-[11px] font-medium tabular-nums text-[var(--theme-text-secondary)] transition-colors hover:bg-primary-600/10 hover:text-primary-600"
                >
                  {loc}
                </Link>
              );
            })}
            {entry.locations.length > 20 && (
              <span className="rounded-full bg-[var(--theme-pill-bg)] px-2.5 py-1 text-[11px] text-[var(--theme-text-quaternary)]">
                +{entry.locations.length - 20}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
