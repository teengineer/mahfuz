import { useTranslation } from "~/hooks/useTranslation";
import { SettingsLabel } from "./SettingsShared";
import { getAllLocaleConfigs } from "~/locales/registry";
import type { Locale } from "~/locales/registry";

interface LanguageSectionProps {
  locale: string;
  onLocaleChange: (locale: Locale) => void;
}

export function LanguageSection({
  locale,
  onLocaleChange,
}: LanguageSectionProps) {
  const { t } = useTranslation();

  return (
    <div>
      <SettingsLabel label={t.settings.language} description={t.settings.languageDesc} />
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {getAllLocaleConfigs().map(({ code, config }) => (
          <button
            key={code}
            onClick={() => onLocaleChange(code)}
            className={`rounded-lg px-3 py-2 text-[12px] font-medium transition-all ${locale === code ? "bg-primary-600 text-white shadow-sm" : "bg-[var(--theme-input-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"}`}
          >
            {config.displayName}
          </button>
        ))}
      </div>
    </div>
  );
}
