import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { conceptsQueryOptions, rootsIndexQueryOptions } from "~/hooks/useDiscover";
import { EmojiIcon } from "~/components/icons/EmojiIcon";
import { useTranslation } from "~/hooks/useTranslation";
import type { Concept, ConceptCategory, RootEntry } from "@mahfuz/shared/types";

function getConceptName(c: Concept, locale: string) {
  if (locale === "tr") return c.name.tr;
  return c.name.en;
}

function getConceptDesc(c: Concept, locale: string) {
  if (locale === "tr") return c.description.tr;
  return c.description.en;
}

function getCatLabel(cat: ConceptCategory, locale: string) {
  if (locale === "tr") return cat.label.tr;
  return cat.label.en;
}

function getRootMeaning(r: RootEntry, locale: string) {
  if (locale === "tr") return r.meaning.tr;
  return r.meaning.en;
}

export function SemanticMapTab() {
  const { t, locale } = useTranslation();
  const { data: conceptIndex } = useQuery(conceptsQueryOptions());
  const { data: rootsIndex } = useQuery(rootsIndexQueryOptions());

  const [activeCatId, setActiveCatId] = useState<string | null>(null);
  const [activeConceptId, setActiveConceptId] = useState<string | null>(null);

  const categories = conceptIndex?.categories ?? [];
  const concepts = conceptIndex?.concepts ?? [];

  const activeConcepts = useMemo(() => {
    if (!activeCatId) return concepts;
    return concepts.filter((c) => c.categoryId === activeCatId);
  }, [activeCatId, concepts]);

  const activeConcept = useMemo(
    () => concepts.find((c) => c.id === activeConceptId) ?? null,
    [activeConceptId, concepts],
  );

  const relatedRoots = useMemo(() => {
    if (!activeConcept?.relatedRoots || !rootsIndex) return [];
    return activeConcept.relatedRoots
      .map((key) => rootsIndex.roots[key])
      .filter(Boolean) as RootEntry[];
  }, [activeConcept, rootsIndex]);

  if (!conceptIndex) return null;

  return (
    <div>
      {/* Category filter chips */}
      <div className="mb-4 flex snap-x snap-mandatory gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => { setActiveCatId(null); setActiveConceptId(null); }}
          className={`shrink-0 snap-start rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
            activeCatId === null
              ? "bg-primary-600 text-white"
              : "border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
          }`}
        >
          {t.discover.allCategories}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => {
              setActiveCatId((prev) => prev === cat.id ? null : cat.id);
              setActiveConceptId(null);
            }}
            className={`flex shrink-0 snap-start items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
              activeCatId === cat.id
                ? "bg-primary-600 text-white"
                : "border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
            }`}
          >
            <EmojiIcon emoji={cat.icon} className="h-3 w-3" />
            {getCatLabel(cat, locale)}
          </button>
        ))}
      </div>

      {/* Stats */}
      <p className="mb-4 text-[12px] text-[var(--theme-text-tertiary)]">
        {activeConcepts.length} {t.discover.conceptsFound}
      </p>

      {/* Concept cards */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {activeConcepts.map((concept) => {
          const isActive = activeConceptId === concept.id;
          return (
            <button
              key={concept.id}
              type="button"
              onClick={() => setActiveConceptId(isActive ? null : concept.id)}
              className={`flex flex-col items-start gap-1 rounded-xl p-3 text-start transition-all ${
                isActive
                  ? "bg-primary-600/10 ring-1 ring-primary-600/20"
                  : "bg-[var(--theme-bg-primary)] border border-[var(--theme-border)] hover:bg-[var(--theme-hover-bg)] active:scale-[0.98]"
              }`}
            >
              <div className="flex items-center gap-1.5">
                {concept.icon && <EmojiIcon emoji={concept.icon} className="h-4 w-4" />}
                <span className={`text-[13px] font-semibold leading-tight ${
                  isActive ? "text-primary-700" : "text-[var(--theme-text)]"
                }`}>
                  {getConceptName(concept, locale)}
                </span>
              </div>
              <span className="text-[11px] leading-snug text-[var(--theme-text-tertiary)] line-clamp-2">
                {getConceptDesc(concept, locale)}
              </span>
              <div className="mt-auto flex items-center gap-2 pt-1">
                <span className="text-[10px] tabular-nums text-[var(--theme-text-quaternary)]">
                  {concept.refs.length} {t.discover.verseCount}
                </span>
                {concept.relatedRoots && concept.relatedRoots.length > 0 && (
                  <span className="text-[10px] tabular-nums text-[var(--theme-text-quaternary)]">
                    · {concept.relatedRoots.length} {t.discover.root}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Expanded detail — related roots and verse map */}
      {activeConcept && (
        <div className="mt-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-4">
          {/* Concept header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {activeConcept.icon && <EmojiIcon emoji={activeConcept.icon} className="h-5 w-5" />}
              <div>
                <h3 className="text-[14px] font-semibold text-[var(--theme-text)]">
                  {getConceptName(activeConcept, locale)}
                </h3>
                <p className="text-[11px] text-[var(--theme-text-tertiary)]">
                  {getConceptDesc(activeConcept, locale)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setActiveConceptId(null)}
              className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.common.close}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Related Arabic roots */}
          {relatedRoots.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-quaternary)]">
                {t.discover.relatedRoots}
              </h4>
              <div className="flex flex-wrap gap-2">
                {relatedRoots.map((root) => (
                  <div
                    key={root.root}
                    className="flex items-center gap-2 rounded-lg bg-[var(--theme-bg-secondary)] px-3 py-2"
                  >
                    <span className="font-amiri text-[18px] font-bold leading-none text-primary-700" dir="rtl">
                      {root.root}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium text-[var(--theme-text)]">
                        {getRootMeaning(root, locale)}
                      </span>
                      <span className="text-[10px] text-[var(--theme-text-quaternary)]">
                        {root.count}× · {root.letters}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related concepts */}
          {activeConcept.relatedConcepts && activeConcept.relatedConcepts.length > 0 && (
            <div className="mb-3">
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-quaternary)]">
                {t.discover.relatedConcepts}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {activeConcept.relatedConcepts.map((relId) => {
                  const rel = concepts.find((c) => c.id === relId);
                  if (!rel) return null;
                  return (
                    <button
                      key={relId}
                      type="button"
                      onClick={() => setActiveConceptId(relId)}
                      className="flex items-center gap-1 rounded-full border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] px-2.5 py-1 text-[11px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
                    >
                      {rel.icon && <EmojiIcon emoji={rel.icon} className="h-3 w-3" />}
                      {getConceptName(rel, locale)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verse references */}
          <div>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--theme-text-quaternary)]">
              {t.discover.verseReferences} ({activeConcept.refs.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {activeConcept.refs.map((ref) => {
                const [surah, verseRange] = ref.split(":");
                const firstVerse = verseRange?.split("-")[0];
                return (
                  <Link
                    key={ref}
                    to="/$surahId"
                    params={{ surahId: surah }}
                    search={{ verse: firstVerse ? Number(firstVerse) : undefined }}
                    className="rounded-lg bg-[var(--theme-bg-secondary)] px-2.5 py-1.5 text-[11px] font-semibold tabular-nums text-primary-700 transition-colors hover:bg-primary-600/10"
                  >
                    {ref}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
