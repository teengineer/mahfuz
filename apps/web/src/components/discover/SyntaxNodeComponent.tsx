import { memo, useState } from "react";
import type { SyntaxNode } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { ROLE_COLORS } from "./SyntaxLegend";

interface SyntaxNodeProps {
  node: SyntaxNode;
}

export const SyntaxNodeComponent = memo(function SyntaxNodeComponent({ node }: SyntaxNodeProps) {
  const { t, locale } = useTranslation();
  const [showDetail, setShowDetail] = useState(false);

  const roleColor = ROLE_COLORS[node.role] || "#6b7280";
  const roles = t.discover.roles as Record<string, string>;
  const roleLabel = roles[node.role] || node.role;

  return (
    <div className="relative flex flex-col items-center">
      {/* Word */}
      <button
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        className="flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--theme-hover-bg)]"
      >
        <span className="arabic-text text-[20px] font-semibold text-[var(--theme-text)]" dir="rtl">
          {node.ar}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
          style={{ backgroundColor: roleColor }}
        >
          {roleLabel}
        </span>
        {node.caseLabel && (
          <span className="text-[10px] text-[var(--theme-text-tertiary)]">
            {locale === "en" ? node.caseLabel.en : node.caseLabel.tr}
          </span>
        )}
      </button>

      {/* Detail popover */}
      {showDetail && node.irabDesc && (
        <div className="absolute top-full z-30 mt-1 w-48 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-elevated)] p-3 shadow-[var(--shadow-float)]">
          <p className="text-[12px] font-medium text-[var(--theme-text)]">
            {locale === "en" ? node.irabDesc.en : node.irabDesc.tr}
          </p>
          {node.caseLabel && (
            <p className="mt-1 text-[11px] text-[var(--theme-text-secondary)]">
              {node.caseLabel.ar}
            </p>
          )}
          {node.depLabel && (
            <p className="mt-1 text-[10px] text-[var(--theme-text-quaternary)]">
              dep: {node.depLabel}
            </p>
          )}
        </div>
      )}
    </div>
  );
});
