import type { ReactNode } from "react";

interface SettingsLabelProps {
  children?: ReactNode;
  label?: string;
  description?: string;
}

export function SettingsLabel({ children, label, description }: SettingsLabelProps) {
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
