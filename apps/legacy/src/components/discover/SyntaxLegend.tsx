import { memo } from "react";
import { useTranslation } from "~/hooks/useTranslation";

/** Color map for syntactic roles */
export const ROLE_COLORS: Record<string, string> = {
  fail: "#22c55e",         // green
  mubtada: "#22c55e",      // green (subject)
  khabar: "#f59e0b",       // amber (predicate)
  mafool: "#3b82f6",       // blue
  "jar-majrur": "#f97316", // orange
  fiil: "#a855f7",         // purple
  harf: "#6b7280",         // gray
  naat: "#14b8a6",         // teal
  atf: "#ec4899",          // pink
  "mudaf-ilayh": "#06b6d4", // cyan
  nida: "#ef4444",         // red
  hal: "#84cc16",          // lime
  tamyiz: "#eab308",       // yellow
  badal: "#8b5cf6",        // violet
};

export const SyntaxLegend = memo(function SyntaxLegend() {
  const { t } = useTranslation();

  const roles = t.discover.roles as Record<string, string>;
  const entries = Object.entries(ROLE_COLORS)
    .filter(([key]) => roles[key])
    .map(([key, color]) => ({
      key,
      label: roles[key],
      color,
    }));

  return (
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)]">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
        {t.discover.syntaxLegend}
      </h3>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {entries.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-[11px] text-[var(--theme-text-secondary)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
});
