import { useTranslation } from "~/hooks/useTranslation";

const APPS = [
  { key: "appLearn" as const, descKey: "appLearnDesc" as const, icon: GraduationIcon, color: "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400" },
  { key: "appMemorize" as const, descKey: "appMemorizeDesc" as const, icon: BrainIcon, color: "text-violet-600 bg-violet-100 dark:bg-violet-900/30 dark:text-violet-400" },
  { key: "appTarteel" as const, descKey: "appTarteelDesc" as const, icon: MicIcon, color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400" },
  { key: "appTafsir" as const, descKey: "appTafsirDesc" as const, icon: BookOpenIcon, color: "text-sky-600 bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400" },
] as const;

export function AppsPreview() {
  const { t } = useTranslation();

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[15px] font-semibold text-[var(--theme-text)]">
          {t.home.appsTitle}
        </h2>
        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
          {t.home.comingSoon}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {APPS.map((app) => (
          <div
            key={app.key}
            className="relative overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-3 opacity-75 transition-all sm:p-4"
          >
            <div className={`mb-2 flex h-9 w-9 items-center justify-center rounded-lg ${app.color}`}>
              <app.icon />
            </div>
            <p className="text-[13px] font-semibold text-[var(--theme-text)]">
              {t.home[app.key]}
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-[var(--theme-text-tertiary)]">
              {t.home[app.descKey]}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function GraduationIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M12 13.489V21m0 0a7.5 7.5 0 003.75-6.488M12 21a7.5 7.5 0 01-3.75-6.488" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm5 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3zM12 2C7.58 2 4 5.58 4 10c0 1.5.33 2.92.93 4.2L3.2 15.93a1.5 1.5 0 001.06 2.57h1.82C7.5 20.02 9.6 21 12 21s4.5-.98 5.92-2.5h1.82a1.5 1.5 0 001.06-2.57l-1.73-1.73c.6-1.28.93-2.7.93-4.2 0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}
