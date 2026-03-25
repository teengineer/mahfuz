import type { PageLayout } from "@mahfuz/shared/constants";
import { useReadingPrefs } from "~/stores/useReadingPrefs";
import { useTranslation } from "~/hooks/useTranslation";

export function PageLayoutSection() {
  const { t } = useTranslation();
  const pageLayout = useReadingPrefs((s) => s.pageLayout);
  const setPageLayout = useReadingPrefs((s) => s.setPageLayout);

  const options: { value: PageLayout; label: string; desc: string }[] = [
    {
      value: "medine",
      label: t.settings.pageLayoutMedine,
      desc: t.settings.pageLayoutMedineDesc,
    },
    {
      value: "berkenar",
      label: t.settings.pageLayoutBerkenar,
      desc: t.settings.pageLayoutBerkenarDesc,
    },
  ];

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const active = pageLayout === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setPageLayout(opt.value)}
            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
              active
                ? "bg-primary-600/10 ring-2 ring-primary-600"
                : "bg-[var(--theme-hover-bg)]/60 hover:bg-[var(--theme-hover-bg)]"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                active
                  ? "border-primary-600 bg-primary-600"
                  : "border-[var(--theme-border)]"
              }`}
            >
              {active && (
                <svg className="h-3 w-3 text-white" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3.5 8.5L6.5 11.5L12.5 5.5" />
                </svg>
              )}
            </span>
            <div className="min-w-0">
              <p className={`text-[14px] font-medium ${active ? "text-primary-600" : "text-[var(--theme-text)]"}`}>
                {opt.label}
              </p>
              <p className="text-[12px] text-[var(--theme-text-tertiary)]">
                {opt.desc}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
