import { memo, useEffect } from "react";
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

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const hasEnrichment = enrichment && (
    (enrichment.rhetoric && (enrichment.rhetoric.tr || enrichment.rhetoric.en)) ||
    (enrichment.etymology && (enrichment.etymology.tr || enrichment.etymology.en)) ||
    (enrichment.semanticField && (enrichment.semanticField.tr || enrichment.semanticField.en))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[6px]"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative z-10 flex w-full max-w-lg flex-col rounded-t-[20px] bg-[var(--theme-bg)] shadow-[0_-4px_40px_-8px_rgba(0,0,0,0.2)] sm:rounded-2xl sm:shadow-[0_24px_64px_-16px_rgba(0,0,0,0.25)]"
        style={{ maxHeight: "88vh" }}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-8 rounded-full bg-[var(--theme-text-quaternary)]/30" />
        </div>

        {/* Header (sticky) */}
        <div className="flex items-start justify-between px-6 pt-4 pb-0 sm:px-8 sm:pt-6">
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--theme-bg-secondary)] text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain px-6 pb-8 sm:px-8" style={{ scrollbarWidth: "none" }}>
          {/* Root letters hero */}
          <div className="mb-5 text-center">
            <div className="mb-2 inline-flex items-center justify-center rounded-2xl bg-primary-600/8 px-6 py-3">
              <span
                className="arabic-text text-[46px] font-bold leading-none text-primary-600 sm:text-[52px]"
                dir="rtl"
              >
                {entry.letters}
              </span>
            </div>
            {meaning && (
              <p className="mt-2 text-[15px] font-medium leading-relaxed text-[var(--theme-text-secondary)]">
                {meaning}
              </p>
            )}
          </div>

          {/* Stats row */}
          <div className="mb-6 flex items-stretch justify-center gap-0 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] overflow-hidden">
            <div className="flex-1 py-3 text-center">
              <span
                className="block text-[20px] font-bold tabular-nums text-primary-600"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {entry.count.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-[var(--theme-text-tertiary)]">
                {t.discover.occurrences}
              </span>
            </div>
            <div className="w-px bg-[var(--theme-border)]" />
            <div className="flex-1 py-3 text-center">
              <span
                className="block text-[20px] font-bold tabular-nums text-[var(--theme-text)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {entry.formCount}
              </span>
              <span className="text-[11px] font-medium text-[var(--theme-text-tertiary)]">
                {t.discover.forms}
              </span>
            </div>
            <div className="w-px bg-[var(--theme-border)]" />
            <div className="flex-1 py-3 text-center">
              <span
                className="block text-[20px] font-bold tabular-nums text-[var(--theme-text)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {entry.locations.length.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-[var(--theme-text-tertiary)]">
                {t.discover.verseReferences}
              </span>
            </div>
          </div>

          {/* Related roots */}
          {enrichment?.relatedRoots && enrichment.relatedRoots.length > 0 && (
            <Section title={t.discover.relatedRoots}>
              <div className="flex flex-wrap gap-2">
                {enrichment.relatedRoots.map((rk) => (
                  <button
                    key={rk}
                    type="button"
                    onClick={() => onRootClick?.(rk)}
                    className="arabic-text rounded-lg border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-3 py-1.5 text-[15px] text-[var(--theme-text-secondary)] transition-all duration-150 hover:border-primary-400/60 hover:bg-primary-600/5 hover:text-primary-600"
                    dir="rtl"
                  >
                    {rk}
                  </button>
                ))}
              </div>
            </Section>
          )}

          {/* Enrichment sections */}
          {hasEnrichment && (
            <div className="space-y-4">
              {enrichment!.rhetoric && (enrichment!.rhetoric.tr || enrichment!.rhetoric.en) && (
                <Section title={t.discover.rhetoric}>
                  <p className="text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
                    {locale === "en" ? enrichment!.rhetoric.en : enrichment!.rhetoric.tr}
                  </p>
                </Section>
              )}
              {enrichment!.etymology && (enrichment!.etymology.tr || enrichment!.etymology.en) && (
                <Section title={t.discover.etymology}>
                  <p className="text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
                    {locale === "en" ? enrichment!.etymology.en : enrichment!.etymology.tr}
                  </p>
                </Section>
              )}
              {enrichment!.semanticField && (enrichment!.semanticField.tr || enrichment!.semanticField.en) && (
                <Section title={t.discover.semanticField}>
                  <p className="text-[13px] leading-relaxed text-[var(--theme-text-secondary)]">
                    {locale === "en" ? enrichment!.semanticField.en : enrichment!.semanticField.tr}
                  </p>
                </Section>
              )}
            </div>
          )}

          {/* Verse references */}
          <Section title={t.discover.verseReferences}>
            <div className="flex flex-wrap gap-1.5">
              {entry.locations.slice(0, 30).map((loc) => {
                const [surah] = loc.split(":");
                return (
                  <Link
                    key={loc}
                    to="/$surahId"
                    params={{ surahId: surah }}
                    className="rounded-lg bg-[var(--theme-bg-secondary)] px-2.5 py-1.5 text-[11px] font-semibold tabular-nums text-[var(--theme-text-secondary)] transition-all duration-150 hover:bg-primary-600/10 hover:text-primary-600"
                  >
                    {loc}
                  </Link>
                );
              })}
              {entry.locations.length > 30 && (
                <span className="rounded-lg bg-[var(--theme-bg-secondary)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--theme-text-quaternary)]">
                  +{entry.locations.length - 30}
                </span>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--theme-text-quaternary)]">
        {title}
      </h3>
      {children}
    </div>
  );
}
