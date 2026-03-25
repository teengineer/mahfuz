import type { ReactNode } from "react";

// ─── Icons (18×18 stroke) ───────────────────────────────────────────
export function IconFont() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 14l4.5-10h3L15 14" />
      <path d="M5.5 9.5h7" />
    </svg>
  );
}
export function IconDroplet() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2.5C9 2.5 4 8 4 11a5 5 0 0010 0c0-3-5-8.5-5-8.5z" />
    </svg>
  );
}
export function IconMicrophone() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6.5" y="2" width="5" height="9" rx="2.5" />
      <path d="M4 9a5 5 0 0010 0" />
      <path d="M9 14v2.5" />
    </svg>
  );
}
export function IconPalette() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7" />
      <circle cx="7" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="6" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="10" r="1.5" />
    </svg>
  );
}
export function IconBook() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3.5h5.5a1.5 1.5 0 011.5 1.5v10a1 1 0 00-1-1H2V3.5z" />
      <path d="M16 3.5h-5.5a1.5 1.5 0 00-1.5 1.5v10a1 1 0 011-1H16V3.5z" />
    </svg>
  );
}
export function IconGlobe() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="9" r="7" />
      <path d="M2 9h14" />
      <path d="M9 2a11.5 11.5 0 013 7 11.5 11.5 0 01-3 7 11.5 11.5 0 01-3-7 11.5 11.5 0 013-7z" />
    </svg>
  );
}

// ─── SettingsLabel ──────────────────────────────────────────────────
export function SettingsLabel({
  children,
  label,
  description,
}: {
  children?: ReactNode;
  label?: string;
  description?: string;
}) {
  if (label !== undefined) {
    return (
      <div>
        <span className="text-[13px] font-semibold text-[var(--theme-text)]">{label}</span>
        {description && (
          <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">{description}</p>
        )}
      </div>
    );
  }
  return (
    <span className="text-[13px] font-semibold text-[var(--theme-text)]">
      {children}
    </span>
  );
}

// ─── ToggleSwitch ───────────────────────────────────────────────────
export function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-[28px] w-[48px] shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary-600" : "bg-[var(--theme-divider)]"
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-[24px] w-[24px] rounded-full bg-[var(--theme-bg-primary)] shadow-sm transition-transform ${
          checked ? "translate-x-[20px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

// ─── SaveStatusBar ──────────────────────────────────────────────────
export function SaveStatusBar({ visible, label }: { visible: boolean; label: string }) {
  if (!visible) return null;
  return (
    <div className="sticky bottom-0 z-10 mt-6 flex items-center justify-center gap-2 rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/80 px-4 py-3 backdrop-blur-xl animate-page-enter">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500">
        <path d="M3.5 8.5l3 3 6-6" />
      </svg>
      <span className="text-[13px] font-medium text-[var(--theme-text-secondary)]">{label}</span>
    </div>
  );
}
