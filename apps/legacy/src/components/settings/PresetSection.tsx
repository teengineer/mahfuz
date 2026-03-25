import { READING_PRESETS } from "~/lib/constants";
import { isPresetActive, togglePreset } from "~/lib/apply-preset";
import { useDisplayPrefs } from "~/stores/useDisplayPrefs";
import { useReadingPrefs } from "~/stores/useReadingPrefs";
import { useTranslation } from "~/hooks/useTranslation";

function MoonIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function QuranIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9h.008M14.5 9h.008M9.5 12h5" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M20.992 4.993v4.993" />
    </svg>
  );
}

const PRESET_ICONS = [MoonIcon, BookOpenIcon, QuranIcon, ResetIcon];

export function PresetSection() {
  const { t } = useTranslation();
  const theme = useDisplayPrefs((s) => s.theme);
  const viewMode = useReadingPrefs((s) => s.viewMode);

  const presetNames = [t.presets.nightReading, t.presets.studyMode, t.presets.mushafMode, t.presets.default];

  return (
    <div>
      <h3 className="mb-2 text-[13px] font-semibold text-[var(--theme-text)]">{t.presets.title}</h3>
      <div className="flex flex-wrap gap-2">
        {READING_PRESETS.map((preset, i) => {
          const active = isPresetActive(preset);
          const Icon = PRESET_ICONS[i];
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => togglePreset(preset)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${
                active
                  ? "bg-primary-600 text-white"
                  : "bg-[var(--theme-pill-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
              }`}
            >
              <Icon />
              {presetNames[i]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
