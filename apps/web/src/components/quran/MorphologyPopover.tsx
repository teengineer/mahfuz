import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { WordMorphology } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

interface MorphologyPopoverProps {
  morph: WordMorphology;
  onClose: () => void;
}

export const MorphologyPopover = memo(function MorphologyPopover({
  morph,
  onClose,
}: MorphologyPopoverProps) {
  const { t } = useTranslation();
  const posLabels = t.discover.posLabels as Record<string, string>;

  return (
    <div className="absolute bottom-full left-1/2 z-40 mb-2 w-56 -translate-x-1/2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-elevated)] p-3 shadow-[var(--shadow-float)]">
      {/* Root */}
      {morph.root && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-[var(--theme-text-tertiary)]">{t.discover.root}</span>
          <Link
            to="/discover/$tab"
            params={{ tab: "dictionary" }}
            className="arabic-text text-[16px] font-bold text-primary-600 hover:underline"
            dir="rtl"
            onClick={onClose}
          >
            {morph.root}
          </Link>
        </div>
      )}

      {/* POS */}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium text-[var(--theme-text-tertiary)]">{t.discover.pos}</span>
        <span className="rounded-full bg-primary-600/10 px-2 py-0.5 text-[10px] font-semibold text-primary-600">
          {posLabels[morph.pos] || morph.pos}
        </span>
      </div>

      {/* Case */}
      {morph.f.cas && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-[var(--theme-text-tertiary)]">{t.discover.caseEnding}</span>
          <span className="text-[11px] text-[var(--theme-text)]">
            {morph.f.cas === "NOM" ? t.discover.nominative : morph.f.cas === "ACC" ? t.discover.accusative : t.discover.genitive}
          </span>
        </div>
      )}

      {/* State */}
      {morph.f.state && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-[var(--theme-text-tertiary)]">
            {morph.f.state === "DEF" ? t.discover.definite : t.discover.indefinite}
          </span>
        </div>
      )}

      {/* Morphemes */}
      {morph.morphemes.length > 1 && (
        <div className="mt-2 border-t border-[var(--theme-border)] pt-2">
          <span className="text-[10px] font-medium text-[var(--theme-text-tertiary)]">{t.discover.morphemes}</span>
          <div className="mt-1 flex flex-wrap gap-1" dir="rtl">
            {morph.morphemes.map((m, i) => (
              <span
                key={i}
                className={`rounded px-1.5 py-0.5 text-[11px] ${
                  m.prefix
                    ? "bg-amber-100 text-amber-700"
                    : m.suffix
                      ? "bg-blue-100 text-blue-700"
                      : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {m.ar}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Go to root link */}
      {morph.root && (
        <Link
          to="/discover/$tab"
          params={{ tab: "dictionary" }}
          className="mt-2 block text-center text-[11px] font-medium text-primary-600 hover:underline"
          onClick={onClose}
        >
          {t.discover.goToRoot}
        </Link>
      )}

      {/* Arrow */}
      <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--theme-bg-elevated)]" />
    </div>
  );
});
