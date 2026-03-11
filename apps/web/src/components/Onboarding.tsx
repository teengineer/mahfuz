import { useState } from "react";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import type { Theme } from "~/stores/usePreferencesStore";
import { useTranslation } from "~/hooks/useTranslation";
import { useI18nStore } from "~/stores/useI18nStore";

const THEMES: { value: Theme; color: string; border: string }[] = [
  { value: "light", color: "#ffffff", border: "#d2d2d7" },
  { value: "sepia", color: "#f5ead6", border: "#d4b882" },
  { value: "dark", color: "#1a1a1a", border: "#444" },
  { value: "dimmed", color: "#22272e", border: "#444c56" },
];

export function Onboarding() {
  const [step, setStep] = useState(0);
  const setHasSeenOnboarding = usePreferencesStore((s) => s.setHasSeenOnboarding);
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);
  const { t, locale } = useTranslation();
  const setLocale = useI18nStore((s) => s.setLocale);

  const finish = () => setHasSeenOnboarding(true);

  const features = [
    { icon: "📖", label: t.onboarding.feature_read },
    { icon: "🎧", label: t.onboarding.feature_listen },
    { icon: "🎓", label: t.onboarding.feature_learn },
    { icon: "🧠", label: t.onboarding.feature_memorize },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl bg-[var(--theme-bg-elevated)] shadow-[var(--shadow-modal)]">
        {/* Skip */}
        {step < 2 && (
          <button onClick={finish} className="absolute right-4 top-4 z-10 text-[12px] font-medium text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]">
            {t.onboarding.skip}
          </button>
        )}

        <div className="overflow-hidden">
          <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${step * 100}%)` }}>
            {/* Step 1: Welcome */}
            <div className="w-full shrink-0 p-8 text-center">
              <img src="/images/mahfuz-logo.svg" alt="Mahfuz" className="logo-invert mx-auto mb-4 h-14" />
              <h2 className="mb-2 text-[20px] font-semibold text-[var(--theme-text)]">{t.onboarding.welcomeTitle}</h2>
              <p className="mb-6 text-[14px] text-[var(--theme-text-secondary)]">{t.onboarding.welcomeSubtitle}</p>
              <div className="grid grid-cols-2 gap-3">
                {features.map((f) => (
                  <div key={f.label} className="rounded-xl bg-[var(--theme-pill-bg)] px-3 py-3 text-center">
                    <span className="mb-1 block text-[22px]">{f.icon}</span>
                    <span className="text-[12px] font-medium text-[var(--theme-text-secondary)]">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 2: Preferences */}
            <div className="w-full shrink-0 p-8 text-center">
              <h2 className="mb-2 text-[20px] font-semibold text-[var(--theme-text)]">{t.onboarding.prefsTitle}</h2>
              <p className="mb-6 text-[14px] text-[var(--theme-text-secondary)]">{t.onboarding.prefsSubtitle}</p>
              <div className="mb-5 flex items-center justify-center gap-4">
                {THEMES.map((th) => (
                  <button key={th.value} onClick={() => setTheme(th.value)} className="flex flex-col items-center gap-1.5">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all ${theme === th.value ? "border-primary-600 ring-2 ring-primary-600/30" : "border-[var(--theme-divider)]"}`} style={{ backgroundColor: th.color }}>
                      {theme === th.value && <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke={th.value === "dark" || th.value === "dimmed" ? "#e5e5e5" : "#059669"} strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </span>
                    <span className="text-[10px] text-[var(--theme-text-tertiary)]">{t.theme[th.value as "light" | "sepia" | "dark" | "dimmed"]}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 rounded-xl bg-[var(--theme-pill-bg)] p-1">
                <button onClick={() => setLocale("tr")} className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${locale === "tr" ? "bg-primary-600 text-white" : "text-[var(--theme-text-secondary)]"}`}>Türkçe</button>
                <button onClick={() => setLocale("en")} className={`flex-1 rounded-lg py-2 text-[13px] font-medium transition-all ${locale === "en" ? "bg-primary-600 text-white" : "text-[var(--theme-text-secondary)]"}`}>English</button>
              </div>
            </div>

            {/* Step 3: Ready */}
            <div className="w-full shrink-0 p-8 text-center">
              <p dir="rtl" className="arabic-text mb-4 text-[28px] leading-[2] text-[var(--theme-text)]">بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</p>
              <h2 className="mb-2 text-[20px] font-semibold text-[var(--theme-text)]">{t.onboarding.readyTitle}</h2>
              <p className="mb-6 text-[14px] text-[var(--theme-text-secondary)]">{t.onboarding.readySubtitle}</p>
              <button onClick={finish} className="w-full rounded-xl bg-primary-600 py-3 text-[15px] font-semibold text-white transition-all hover:bg-primary-700 active:scale-[0.98]">
                {t.onboarding.start}
              </button>
            </div>
          </div>
        </div>

        {/* Dots + Next */}
        <div className="flex items-center justify-between border-t border-[var(--theme-border)] px-6 py-4">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${step === i ? "w-4 bg-primary-600" : "w-1.5 bg-[var(--theme-divider)]"}`} />
            ))}
          </div>
          {step < 2 && (
            <button onClick={() => setStep((s) => s + 1)} className="rounded-lg bg-primary-600 px-4 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-primary-700">
              {t.onboarding.next}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
