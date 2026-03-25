import { useState, useMemo, useCallback } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { Concept } from "@mahfuz/shared/types";
import { conceptsQueryOptions } from "~/hooks/useDiscover";
import { useTranslation } from "~/hooks/useTranslation";
import { ConceptCategoryFilter } from "./ConceptCategoryFilter";
import { ConceptCard } from "./ConceptCard";
import { ConceptDetailSheet } from "./ConceptDetailSheet";

export function ConceptsTab() {
  const { t, locale } = useTranslation();
  const { data: conceptIndex } = useSuspenseQuery(conceptsQueryOptions());

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  const allConceptIds = useMemo(
    () => new Set(conceptIndex.concepts.map((c) => c.id)),
    [conceptIndex],
  );

  const filteredConcepts = useMemo(() => {
    let concepts = conceptIndex.concepts;

    if (activeCategory) {
      concepts = concepts.filter((c) => c.categoryId === activeCategory);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      concepts = concepts.filter((c) => {
        const name = locale === "en" ? c.name.en : c.name.tr;
        const desc = locale === "en" ? c.description.en : c.description.tr;
        return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      });
    }

    return concepts;
  }, [conceptIndex, search, activeCategory, locale]);

  const handleConceptClick = useCallback(
    (conceptId: string) => {
      const concept = conceptIndex.concepts.find((c) => c.id === conceptId);
      if (concept) setSelectedConcept(concept);
    },
    [conceptIndex],
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
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
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.discover.searchConcepts}
          className="w-full rounded-xl bg-[var(--theme-input-bg)] py-3 pl-10 pr-4 text-[14px] text-[var(--theme-text)] placeholder:text-[var(--theme-text-quaternary)] outline-none transition-colors focus:ring-2 focus:ring-primary-500/30"
        />
      </div>

      {/* Category filter */}
      <ConceptCategoryFilter
        categories={conceptIndex.categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Count */}
      <p className="text-[12px] text-[var(--theme-text-tertiary)]" style={{ fontFamily: "var(--font-sans)" }}>
        <span className="font-semibold text-[var(--theme-text-secondary)]">{filteredConcepts.length}</span>{" "}
        {t.discover.conceptsFound}
      </p>

      {/* Grid */}
      {filteredConcepts.length > 0 ? (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredConcepts.map((concept) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              onClick={() => setSelectedConcept(concept)}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[14px] text-[var(--theme-text-tertiary)]">{t.common.noResults}</p>
        </div>
      )}

      {/* Detail sheet */}
      {selectedConcept && (
        <ConceptDetailSheet
          concept={selectedConcept}
          allConceptIds={allConceptIds}
          onClose={() => setSelectedConcept(null)}
          onConceptClick={handleConceptClick}
        />
      )}
    </div>
  );
}
