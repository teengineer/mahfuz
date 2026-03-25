import { memo, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { SyntaxNode } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { ROLE_COLORS } from "./SyntaxLegend";

interface SyntaxNodeProps {
  node: SyntaxNode;
  isHighlighted?: boolean;
}

export const SyntaxNodeComponent = memo(function SyntaxNodeComponent({ node, isHighlighted }: SyntaxNodeProps) {
  const { t, locale } = useTranslation();
  const [showDetail, setShowDetail] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Auto-open popover when highlighted
  useEffect(() => {
    if (isHighlighted && node.irabDesc) {
      setShowDetail(true);
    }
  }, [isHighlighted, node.irabDesc]);

  const roleColor = ROLE_COLORS[node.role] || "#6b7280";
  const roles = t.discover.roles as Record<string, string>;
  const roleLabel = roles[node.role] || node.role;

  // Position popover relative to viewport via portal
  useEffect(() => {
    if (!showDetail || !buttonRef.current) {
      setPos(null);
      return;
    }
    const rect = buttonRef.current.getBoundingClientRect();
    setPos({
      top: rect.bottom + 4,
      left: rect.left + rect.width / 2,
    });
  }, [showDetail]);

  // Close on outside click
  useEffect(() => {
    if (!showDetail) return;
    function handleClick(e: MouseEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        popoverRef.current?.contains(e.target as Node)
      )
        return;
      setShowDetail(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showDetail]);

  return (
    <div className="flex flex-col items-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setShowDetail((v) => !v)}
        className={`flex flex-col items-center gap-1.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-[var(--theme-hover-bg)] ${isHighlighted ? "ring-2 ring-[var(--theme-primary)] ring-offset-2 bg-[var(--theme-primary-light,rgba(59,130,246,0.08))]" : ""}`}
      >
        <span className="arabic-text text-[28px] font-bold text-[var(--theme-text)]" dir="rtl">
          {node.ar}
        </span>
        <span
          className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
          style={{ backgroundColor: roleColor, fontFamily: "var(--font-sans)" }}
        >
          {roleLabel}
        </span>
        {node.caseLabel && (
          <span
            className="text-[11px] font-medium text-[var(--theme-text-tertiary)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {locale === "en" ? node.caseLabel.en : node.caseLabel.tr}
          </span>
        )}
      </button>

      {/* Portal popover — no layout shift, no clipping */}
      {showDetail && node.irabDesc && pos &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-50 w-52 -translate-x-1/2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-elevated)] p-3 font-sans shadow-[var(--shadow-float)]"
            style={{ top: pos.top, left: pos.left }}
          >
            <p
              className="text-[13px] font-medium text-[var(--theme-text)]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {locale === "en" ? node.irabDesc.en : node.irabDesc.tr}
            </p>
            {node.caseLabel && (
              <p className="mt-1 arabic-text text-[16px] text-[var(--theme-text-secondary)]" dir="rtl">
                {node.caseLabel.ar}
              </p>
            )}
            {node.depLabel && (
              <p
                className="mt-1 text-[11px] text-[var(--theme-text-quaternary)]"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                dep: {node.depLabel}
              </p>
            )}
          </div>,
          document.body,
        )}
    </div>
  );
});
