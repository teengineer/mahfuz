import { memo } from "react";
import type { ConceptCategory } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { EmojiIcon } from "~/components/icons/EmojiIcon";

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
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onCategoryChange(null)}
        className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
          activeCategory === null
            ? "bg-primary-600 text-white shadow-sm"
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
            className={`shrink-0 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
              active
                ? "bg-primary-600 text-white shadow-sm"
                : "bg-[var(--theme-pill-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
            }`}
          >
            <EmojiIcon emoji={cat.icon} className="h-3.5 w-3.5 inline-block" /> {label}
          </button>
        );
      })}
    </div>
  );
});
