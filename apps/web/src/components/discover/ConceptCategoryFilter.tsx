import { memo } from "react";
import type { ConceptCategory } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

interface ConceptCategoryFilterProps {
  categories: ConceptCategory[];
  activeCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

export const ConceptCategoryFilter = memo(function ConceptCategoryFilter({
  categories,
  activeCategory,
  onCategoryChange,
}: ConceptCategoryFilterProps) {
  const { t, locale } = useTranslation();

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onCategoryChange(null)}
        className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
          activeCategory === null
            ? "bg-primary-600 text-white"
            : "bg-[var(--theme-pill-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
        }`}
      >
        {t.discover.allCategories}
      </button>
      {categories.map((cat) => {
        const active = activeCategory === cat.id;
        const label = locale === "en" ? cat.label.en : cat.label.tr;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onCategoryChange(active ? null : cat.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-colors ${
              active
                ? "bg-primary-600 text-white"
                : "bg-[var(--theme-pill-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
            }`}
          >
            {cat.icon} {label}
          </button>
        );
      })}
    </div>
  );
});
