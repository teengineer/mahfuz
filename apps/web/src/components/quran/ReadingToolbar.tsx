import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import { usePreferencesStore, getTranslationFontSizeForMode, getArabicFontSizeForMode, getActiveColors, COLOR_PALETTES, ARABIC_FONTS, FONT_GROUPS, getArabicFont } from "~/stores/usePreferencesStore";
import type { ViewMode, ColorPaletteId, FontGroup } from "~/stores/usePreferencesStore";
import type { Verse } from "@mahfuz/shared/types";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { verseByKeyQueryOptions } from "~/hooks/useVerses";
import { useTranslatedVerses } from "~/hooks/useTranslatedVerses";
import { useAudioStore } from "~/stores/useAudioStore";
import { TranslationPicker } from "./TranslationPicker";
import { useTranslation } from "~/hooks/useTranslation";

/* ─ Shared helpers ─ */

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className={`relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors ${checked ? "bg-primary-600" : "bg-[var(--theme-divider)]"}`}>
      <span className={`absolute top-[2px] left-[2px] h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0"}`} />
    </button>
  );
}

function CompactSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-[var(--theme-text-tertiary)]">A</span>
      <input type="range" min="0.6" max="5.0" step="0.05" value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600" />
      <span className="text-[18px] leading-none text-[var(--theme-text-tertiary)]">A</span>
      <span className="w-8 text-right text-[10px] tabular-nums text-[var(--theme-text-quaternary)]">%{Math.round(value * 100)}</span>
    </div>
  );
}

/* ─ Accordion Category Section ─ */

function CategorySection({ title, icon, children, defaultOpen = false }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--theme-border)] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 px-1 py-2.5 text-left transition-colors hover:bg-[var(--theme-hover-bg)] rounded-lg"
      >
        <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[var(--theme-text-tertiary)]">{icon}</span>
        <span className="flex-1 text-[13px] font-medium text-[var(--theme-text)]">{title}</span>
        <svg className={`h-3.5 w-3.5 shrink-0 text-[var(--theme-text-quaternary)] transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div className="accordion-grid" data-open={open}>
        <div className="overflow-hidden">
          <div className="px-1 pb-3 pt-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─ iOS-style setting card ─ */

function SettingCard({ icon, iconBg, label, subtitle, checked, onChange, children }: {
  icon: React.ReactNode; iconBg: string; label: string; subtitle: string;
  checked: boolean; onChange: (v: boolean) => void; children?: React.ReactNode;
}) {
  return (
    <div className="mb-2 rounded-xl bg-[var(--theme-pill-bg)] px-3 py-2.5">
      <div className="flex items-center gap-2.5">
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white ${iconBg}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium leading-snug text-[var(--theme-text)]">{label}</span>
          <span className="block text-[11px] leading-snug text-[var(--theme-text-quaternary)]">{subtitle}</span>
        </div>
        <ToggleSwitch checked={checked} onChange={onChange} />
      </div>
      {checked && children && (
        <div className="mt-2 border-t border-[var(--theme-divider)] pt-2 pl-[38px]">{children}</div>
      )}
    </div>
  );
}

/* ─ Live Preview ─ */

function PreviewCard({ verse }: { verse: Verse }) {
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const normalShowTranslation = usePreferencesStore((s) => s.normalShowTranslation);
  const wbwShowTranslation = usePreferencesStore((s) => s.wbwShowTranslation);
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const colors = getActiveColors({ colorPaletteId });
  const wbwShowWordTranslation = usePreferencesStore((s) => s.wbwShowWordTranslation);
  const wbwShowWordTransliteration = usePreferencesStore((s) => s.wbwShowWordTransliteration);
  const wbwTransliterationFirst = usePreferencesStore((s) => s.wbwTransliterationFirst);
  const wordTranslationSize = usePreferencesStore((s) => s.wordTranslationSize);
  const wordTransliterationSize = usePreferencesStore((s) => s.wordTransliterationSize);
  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const wbwArabicFontSize = usePreferencesStore((s) => s.wbwArabicFontSize);
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const normalTranslationFontSize = usePreferencesStore((s) => s.normalTranslationFontSize);
  const mushafTranslationFontSize = usePreferencesStore((s) => s.mushafTranslationFontSize);

  const arabicScale = getArabicFontSizeForMode({ viewMode, normalArabicFontSize, wbwArabicFontSize, mushafArabicFontSize });
  const translationScale = getTranslationFontSizeForMode({ viewMode, normalTranslationFontSize, mushafTranslationFontSize });

  const wordItems = verse.words?.filter((w) => w.char_type_name === "word") || [];
  const colorOf = (i: number) => (colorizeWords && colors.length > 0 ? colors[i % colors.length] : undefined);

  // Use the same CSS variables as the real reading view
  // .arabic-text already applies: font-size: calc(1em * var(--arabic-font-scale, 1))
  // .translation-text applies: font-size: calc(1em * var(--translation-font-scale, 1))

  if (viewMode === "wordByWord") {
    return (
      <div className="mb-4 h-[240px] overflow-y-auto overscroll-contain rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-5">
        <div dir="rtl" className="flex flex-wrap justify-end gap-x-4 gap-y-3">
          {wordItems.map((word, i) => {
            const trEl = wbwShowWordTranslation && (
              <span key="tr" className="translation-text font-sans text-[var(--theme-text-tertiary)]" style={{ color: colorOf(i) }}>
                {word.translation?.text}
              </span>
            );
            const tlEl = wbwShowWordTransliteration && (
              <span key="tl" className="font-sans text-[0.85em] text-[var(--theme-text-quaternary)]" style={{ color: colorOf(i), opacity: colorizeWords ? 0.75 : undefined }}>
                {word.transliteration?.text}
              </span>
            );
            return (
              <div key={word.id} className="flex flex-col items-center gap-1 rounded-lg px-2 py-1.5">
                <span className="arabic-text" style={{ color: colorOf(i) }}>
                  {word.text_uthmani}
                </span>
                {wbwTransliterationFirst ? <>{tlEl}{trEl}</> : <>{trEl}{tlEl}</>}
              </div>
            );
          })}
        </div>
        {wbwShowTranslation && verse.translations?.[0] && (
          <p className="translation-text mt-4 border-l-2 border-[var(--theme-translation-accent)] pl-3 leading-[1.7] text-[var(--theme-text-secondary)]" dangerouslySetInnerHTML={{ __html: verse.translations[0].text }} />
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 h-[240px] overflow-y-auto overscroll-contain rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-5">
      <p dir="rtl" className="arabic-text leading-[2.2] text-[var(--theme-text)]">
        {wordItems.map((w, i) => (
          <span key={w.id} style={{ color: colorOf(i) }}>{w.text_uthmani}{" "}</span>
        ))}
      </p>
      {viewMode === "normal" && normalShowTranslation && verse.translations?.[0] && (
        <p className="translation-text mt-4 border-l-2 border-[var(--theme-translation-accent)] pl-3 leading-[1.7] text-[var(--theme-text-secondary)]" dangerouslySetInnerHTML={{ __html: verse.translations[0].text }} />
      )}
    </div>
  );
}

/* ─ Mode selector options ─ */

function getModeOptions(t: ReturnType<typeof useTranslation>["t"]): { value: ViewMode; label: string; icon: React.ReactNode }[] {
  return [
    {
      value: "normal", label: t.settings.viewModes.normal,
      icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4h10M3 8h7M3 12h10" /></svg>,
    },
    {
      value: "wordByWord", label: t.settings.viewModes.wordByWord,
      icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1.5" y="3" width="4" height="4.5" rx="1" /><rect x="7.5" y="3" width="4" height="4.5" rx="1" /><rect x="1.5" y="9.5" width="4" height="4.5" rx="1" /><rect x="7.5" y="9.5" width="4" height="4.5" rx="1" /></svg>,
    },
    {
      value: "mushaf", label: t.settings.viewModes.mushaf,
      icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 2.5h4.5a1.5 1.5 0 0 1 1.5 1.5v10S6.5 13 4.25 13 2 14 2 14V2.5z" /><path d="M14 2.5H9.5A1.5 1.5 0 0 0 8 4v10s1.5-1 3.75-1S14 14 14 14V2.5z" /></svg>,
    },
  ];
}

/* ─ Compact Font Picker (for drawer) ─ */

function CompactFontPicker({ arabicFontId, onFontChange }: { arabicFontId: string; onFontChange: (id: string) => void }) {
  const { t } = useTranslation();
  const currentFont = getArabicFont(arabicFontId);
  const [activeTab, setActiveTab] = useState<FontGroup>(currentFont.group);
  const tabFonts = ARABIC_FONTS.filter((f) => f.group === activeTab);

  useEffect(() => {
    tabFonts.forEach((f) => {
      if (f.source === "google" && f.googleUrl) {
        const id = `font-link-${f.id}`;
        if (!document.getElementById(id)) {
          const link = document.createElement("link");
          link.id = id;
          link.rel = "stylesheet";
          link.href = f.googleUrl;
          document.head.appendChild(link);
        }
      }
    });
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      {/* Current font name */}
      <div className="mb-2 flex items-center gap-2">
        <span className="text-[12px] font-medium text-[var(--theme-text-secondary)]">{currentFont.name}</span>
        {currentFont.source === "local" && (
          <span className="rounded-md bg-primary-600/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">{t.common.local}</span>
        )}
      </div>
      {/* Style tabs */}
      <div className="scrollbar-none mb-2 flex gap-1.5 overflow-x-auto">
        {FONT_GROUPS.map((g) => (
          <button key={g.id} type="button" onClick={() => setActiveTab(g.id)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${activeTab === g.id ? "bg-primary-600 text-white" : "bg-[var(--theme-bg-primary)] text-[var(--theme-text-tertiary)] hover:bg-[var(--theme-hover-bg)]"}`}>
            {(t.fonts.groups as Record<string, string>)[g.labelKey]}
          </button>
        ))}
      </div>
      {/* Font card grid */}
      <div className="grid grid-cols-3 gap-1.5">
        {tabFonts.map((font) => {
          const isSelected = font.id === arabicFontId;
          return (
            <button key={font.id} type="button" onClick={() => onFontChange(font.id)}
              className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 transition-all ${isSelected ? "border-primary-500 bg-primary-600/10" : "border-[var(--theme-border)] bg-[var(--theme-bg-primary)] hover:border-[var(--theme-divider)]"}`}>
              <span className="arabic-text block text-[1.1rem] leading-[1.8] text-[var(--theme-text)]" dir="rtl"
                style={{ fontFamily: `${font.family}, "Traditional Arabic", serif` }}>بِسْمِ ٱللَّهِ</span>
              <span className={`text-[10px] font-medium leading-tight ${isSelected ? "text-primary-700" : "text-[var(--theme-text-quaternary)]"}`}>{font.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─ Main Component ─ */

export function ReadingToolbar({ segmentStyle }: { segmentStyle?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  const audioVisible = useAudioStore((s) => s.isVisible);

  // Close with exit animation (desktop only)
  const close = useCallback(() => {
    const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
    if (isDesktop) {
      setClosing(true);
      setTimeout(() => { setClosing(false); setOpen(false); }, 250);
    } else {
      setOpen(false);
    }
  }, []);

  // Click-outside handler
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      close();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, close]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  // Preview verse (Besmele, Fatiha 1)
  const { data: rawPreviewVerse } = useQuery(verseByKeyQueryOptions("1:1"));
  const translatedPreview = useTranslatedVerses(rawPreviewVerse ? [rawPreviewVerse] : []);
  const previewVerse = translatedPreview[0] ?? rawPreviewVerse;

  // All preferences
  const viewMode = usePreferencesStore((s) => s.viewMode);
  const setViewMode = usePreferencesStore((s) => s.setViewMode);
  const arabicFontId = usePreferencesStore((s) => s.arabicFontId);
  const setArabicFont = usePreferencesStore((s) => s.setArabicFont);
  const colorizeWords = usePreferencesStore((s) => s.colorizeWords);
  const setColorizeWords = usePreferencesStore((s) => s.setColorizeWords);
  const colorPaletteId = usePreferencesStore((s) => s.colorPaletteId);
  const setColorPalette = usePreferencesStore((s) => s.setColorPalette);

  const normalArabicFontSize = usePreferencesStore((s) => s.normalArabicFontSize);
  const wbwArabicFontSize = usePreferencesStore((s) => s.wbwArabicFontSize);
  const mushafArabicFontSize = usePreferencesStore((s) => s.mushafArabicFontSize);
  const setNormalArabicFontSize = usePreferencesStore((s) => s.setNormalArabicFontSize);
  const setWbwArabicFontSize = usePreferencesStore((s) => s.setWbwArabicFontSize);
  const setMushafArabicFontSize = usePreferencesStore((s) => s.setMushafArabicFontSize);

  const normalTranslationFontSize = usePreferencesStore((s) => s.normalTranslationFontSize);
  const setNormalTranslationFontSize = usePreferencesStore((s) => s.setNormalTranslationFontSize);
  const mushafTranslationFontSize = usePreferencesStore((s) => s.mushafTranslationFontSize);
  const setMushafTranslationFontSize = usePreferencesStore((s) => s.setMushafTranslationFontSize);
  const mushafTooltipTextSize = usePreferencesStore((s) => s.mushafTooltipTextSize);
  const setMushafTooltipTextSize = usePreferencesStore((s) => s.setMushafTooltipTextSize);
  const normalShowTranslation = usePreferencesStore((s) => s.normalShowTranslation);
  const setNormalShowTranslation = usePreferencesStore((s) => s.setNormalShowTranslation);
  const normalShowWordHover = usePreferencesStore((s) => s.normalShowWordHover);
  const setNormalShowWordHover = usePreferencesStore((s) => s.setNormalShowWordHover);
  const normalHoverShowTranslation = usePreferencesStore((s) => s.normalHoverShowTranslation);
  const setNormalHoverShowTranslation = usePreferencesStore((s) => s.setNormalHoverShowTranslation);
  const normalHoverShowTransliteration = usePreferencesStore((s) => s.normalHoverShowTransliteration);
  const setNormalHoverShowTransliteration = usePreferencesStore((s) => s.setNormalHoverShowTransliteration);
  const normalHoverTextSize = usePreferencesStore((s) => s.normalHoverTextSize);
  const setNormalHoverTextSize = usePreferencesStore((s) => s.setNormalHoverTextSize);
  const wbwShowTranslation = usePreferencesStore((s) => s.wbwShowTranslation);
  const setWbwShowTranslation = usePreferencesStore((s) => s.setWbwShowTranslation);
  const wbwShowWordTranslation = usePreferencesStore((s) => s.wbwShowWordTranslation);
  const setWbwShowWordTranslation = usePreferencesStore((s) => s.setWbwShowWordTranslation);
  const wordTranslationSize = usePreferencesStore((s) => s.wordTranslationSize);
  const setWordTranslationSize = usePreferencesStore((s) => s.setWordTranslationSize);
  const wbwShowWordTransliteration = usePreferencesStore((s) => s.wbwShowWordTransliteration);
  const setWbwShowWordTransliteration = usePreferencesStore((s) => s.setWbwShowWordTransliteration);
  const wordTransliterationSize = usePreferencesStore((s) => s.wordTransliterationSize);
  const setWordTransliterationSize = usePreferencesStore((s) => s.setWordTransliterationSize);
  const wbwTransliterationFirst = usePreferencesStore((s) => s.wbwTransliterationFirst);
  const setWbwTransliterationFirst = usePreferencesStore((s) => s.setWbwTransliterationFirst);

  const mushafShowTranslation = usePreferencesStore((s) => s.mushafShowTranslation);
  const setMushafShowTranslation = usePreferencesStore((s) => s.setMushafShowTranslation);

  const globalFontScale = usePreferencesStore((s) => s.globalFontScale);
  const adjustGlobalFontScale = usePreferencesStore((s) => s.adjustGlobalFontScale);
  const setGlobalFontScale = usePreferencesStore((s) => s.setGlobalFontScale);

  const arabicSize = viewMode === "wordByWord" ? wbwArabicFontSize : viewMode === "mushafFlow" ? mushafArabicFontSize : normalArabicFontSize;
  const setArabicSize = viewMode === "wordByWord" ? setWbwArabicFontSize : viewMode === "mushafFlow" ? setMushafArabicFontSize : setNormalArabicFontSize;

  const modeOptions = getModeOptions(t);

  // Quick font size adjust (per-mode)
  const bump = (delta: number) => {
    const next = Math.max(0.6, Math.min(5.0, arabicSize + delta));
    setArabicSize(next);
  };

  const panelContent = (
    <div
      ref={panelRef}
      className={[
        // Mobile: bottom sheet
        "fixed z-40 bg-[var(--theme-bg-elevated)] shadow-[var(--shadow-float)]",
        "inset-x-0 bottom-0 max-h-[92vh] rounded-t-2xl border-t border-[var(--theme-border)] animate-slide-up",
        // Desktop: right-side flyout drawer
        "lg:inset-y-0 lg:left-auto lg:right-0 lg:w-[460px] lg:max-h-none lg:rounded-none lg:rounded-l-2xl lg:border-t-0 lg:border-l",
        // Flex column layout for sticky preview
        "flex flex-col",
        closing ? "lg:animate-slide-out-right" : "lg:animate-slide-in-right",
      ].join(" ")}
      style={{ backdropFilter: "saturate(180%) blur(20px)" }}
    >
      {/* Sticky top: header + preview */}
      <div className="shrink-0 px-5 pt-5">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[14px] font-semibold text-[var(--theme-text)]">{t.reading.settingsTitle}</span>
          <button onClick={close} className="flex h-7 items-center gap-1 rounded-full bg-primary-600 px-2.5 text-[12px] font-medium text-white transition-colors hover:bg-primary-700 lg:hidden" aria-label={t.common.close}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            {t.common.ok}
          </button>
          <button onClick={close} className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)]" aria-label={t.common.close}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Live preview */}
        {previewVerse && <PreviewCard verse={previewVerse} />}
      </div>

      {/* Scrollable settings area */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-20 lg:pb-5">
      {/* Global font scale strip */}
      <div className="mb-3 flex items-center justify-between rounded-xl bg-[var(--theme-pill-bg)] px-3 py-2">
        <span className="text-[12px] font-medium text-[var(--theme-text-secondary)]">{t.toolbar.fontScale}</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => adjustGlobalFontScale(-0.1)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]" aria-label={t.toolbar.fontScaleDecrease}>
            <span className="text-[14px] font-bold">−</span>
          </button>
          <button
            onClick={() => setGlobalFontScale(1)}
            className="rounded-lg px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
          >
            {Math.round(globalFontScale * 100)}%
          </button>
          <button onClick={() => adjustGlobalFontScale(0.1)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]" aria-label={t.toolbar.fontScaleIncrease}>
            <span className="text-[14px] font-bold">+</span>
          </button>
        </div>
      </div>

      {/* Quick access row */}
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-[var(--theme-pill-bg)] px-3 py-2">
        {/* Font size −/+ (per-mode) */}
        <button onClick={() => bump(-0.1)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]" aria-label={t.toolbar.decreaseSize}>
          <span className="text-[13px] font-bold">A-</span>
        </button>
        <button onClick={() => bump(0.1)} className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]" aria-label={t.toolbar.increaseSize}>
          <span className="text-[16px] font-bold">A+</span>
        </button>

        <span className="mx-1 h-4 w-px bg-[var(--theme-divider)]" />

        {/* View mode segmented */}
        <div className="flex-1">
          <SegmentedControl options={modeOptions} value={viewMode} onChange={setViewMode} stretch />
        </div>
      </div>

      {/* Category accordions */}
      <div className="rounded-xl bg-[var(--theme-pill-bg)] px-3">
        {/* Size Category */}
        <CategorySection
          title={t.toolbar.sizeCategory}
          icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M4 7V4h16v3M9 20h6M12 4v16" /></svg>}
        >
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[12px] font-medium text-[var(--theme-text-tertiary)]">{t.settings.arabicSize}</span>
              <span className="text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">%{Math.round(arabicSize * 100)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="-translate-y-[4px] text-[15px] leading-none text-[var(--theme-text-tertiary)]" style={{ fontFamily: 'var(--font-arabic)' }}>ع</span>
              <input type="range" min="0.6" max="5.0" step="0.05" value={arabicSize} onChange={(e) => setArabicSize(Number(e.target.value))} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600" />
              <span className="-translate-y-[5px] text-[24px] leading-none text-[var(--theme-text-tertiary)]" style={{ fontFamily: 'var(--font-arabic)' }}>ع</span>
            </div>
          </div>
          {viewMode === "mushafFlow" ? (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px] font-medium text-[var(--theme-text-tertiary)]">{t.settings.translationSize}</span>
                <span className="text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">%{Math.round(mushafTranslationFontSize * 100)}</span>
              </div>
              <CompactSlider value={mushafTranslationFontSize} onChange={setMushafTranslationFontSize} />
            </div>
          ) : (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[12px] font-medium text-[var(--theme-text-tertiary)]">{t.settings.translationSize}</span>
                <span className="text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">%{Math.round(normalTranslationFontSize * 100)}</span>
              </div>
              <CompactSlider value={normalTranslationFontSize} onChange={setNormalTranslationFontSize} />
            </div>
          )}
        </CategorySection>

        {/* Text/Translation Category */}
        <CategorySection
          title={t.toolbar.textCategory}
          icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M3 5h12M3 10h8M3 15h10M3 20h6" /></svg>}
        >
          {viewMode === "normal" && (
            <>
              <SettingCard
                icon={<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4h10M3 8h6M3 12h8" /></svg>}
                iconBg="bg-blue-500" label={t.reading.translation} subtitle={t.reading.translationSubtitle}
                checked={normalShowTranslation} onChange={setNormalShowTranslation}
              >
                <TranslationPicker compact />
              </SettingCard>
              <SettingCard
                icon={<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 12L4 3.5h1L7.5 12" /><path d="M2.8 9.5h3.4" /><path d="M14 12V8.5a2 2 0 1 0-4 0V12" /></svg>}
                iconBg="bg-teal-500" label={t.reading.wordInfo} subtitle={t.reading.wordInfoSubtitle}
                checked={normalShowWordHover} onChange={setNormalShowWordHover}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--theme-text-secondary)]">{t.reading.hoverTranslation}</span>
                    <ToggleSwitch checked={normalHoverShowTranslation} onChange={setNormalHoverShowTranslation} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[var(--theme-text-secondary)]">{t.reading.hoverTransliteration}</span>
                    <ToggleSwitch checked={normalHoverShowTransliteration} onChange={setNormalHoverShowTransliteration} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-[12px] text-[var(--theme-text-tertiary)]">{t.reading.hoverTextSize}</span>
                      <span className="text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">%{Math.round(normalHoverTextSize * 100)}</span>
                    </div>
                    <CompactSlider value={normalHoverTextSize} onChange={setNormalHoverTextSize} />
                  </div>
                </div>
              </SettingCard>
            </>
          )}
          {viewMode === "wordByWord" && (
            <>
              {(wbwTransliterationFirst
                ? [
                    { key: "tl", label: t.reading.transliterationLabel, subtitle: t.reading.transliterationSubtitle, checked: wbwShowWordTransliteration, onChange: setWbwShowWordTransliteration, size: wordTransliterationSize, onSize: setWordTransliterationSize, iconBg: "bg-purple-500", icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 12L4 3.5h1L7.5 12" /><path d="M2.8 9.5h3.4" /><path d="M14 12V8.5a2 2 0 1 0-4 0V12" /></svg> },
                    { key: "tr", label: t.reading.wordTranslationLabel, subtitle: t.reading.wordTranslationSubtitle, checked: wbwShowWordTranslation, onChange: setWbwShowWordTranslation, size: wordTranslationSize, onSize: setWordTranslationSize, iconBg: "bg-emerald-500", icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="2" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="2" width="5.5" height="5.5" rx="1.5" /><rect x="1.5" y="9.5" width="5.5" height="5" rx="1.5" /><rect x="9" y="9.5" width="5.5" height="5" rx="1.5" /></svg> },
                  ]
                : [
                    { key: "tr", label: t.reading.wordTranslationLabel, subtitle: t.reading.wordTranslationSubtitle, checked: wbwShowWordTranslation, onChange: setWbwShowWordTranslation, size: wordTranslationSize, onSize: setWordTranslationSize, iconBg: "bg-emerald-500", icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"><rect x="1.5" y="2" width="5.5" height="5.5" rx="1.5" /><rect x="9" y="2" width="5.5" height="5.5" rx="1.5" /><rect x="1.5" y="9.5" width="5.5" height="5" rx="1.5" /><rect x="9" y="9.5" width="5.5" height="5" rx="1.5" /></svg> },
                    { key: "tl", label: t.reading.transliterationLabel, subtitle: t.reading.transliterationSubtitle, checked: wbwShowWordTransliteration, onChange: setWbwShowWordTransliteration, size: wordTransliterationSize, onSize: setWordTransliterationSize, iconBg: "bg-purple-500", icon: <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 12L4 3.5h1L7.5 12" /><path d="M2.8 9.5h3.4" /><path d="M14 12V8.5a2 2 0 1 0-4 0V12" /></svg> },
                  ]
              ).map((item) => (
                <SettingCard key={item.key} icon={item.icon} iconBg={item.iconBg} label={item.label} subtitle={item.subtitle} checked={item.checked} onChange={item.onChange}>
                  <CompactSlider value={item.size} onChange={item.onSize} />
                </SettingCard>
              ))}
              <SettingCard
                icon={<svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 4h10M3 8h6M3 12h8" /></svg>}
                iconBg="bg-blue-500" label={t.reading.translation} subtitle={t.reading.translationSubtitle}
                checked={wbwShowTranslation} onChange={setWbwShowTranslation}
              >
                <TranslationPicker compact />
              </SettingCard>
              <button type="button" onClick={() => setWbwTransliterationFirst(!wbwTransliterationFirst)}
                className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--theme-bg-primary)] px-3 py-2 text-[12px] font-medium text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)]">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M7 4v16M7 4l-4 4M7 4l4 4M17 20V4M17 20l-4-4M17 20l4-4" /></svg>
                {t.reading.swapOrder}
              </button>
            </>
          )}
          {viewMode === "mushafFlow" && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-[var(--theme-text-secondary)]">
                  {mushafShowTranslation ? t.toolbar.mushafHideMeal : t.toolbar.mushafShowMeal}
                </span>
                <ToggleSwitch checked={mushafShowTranslation} onChange={setMushafShowTranslation} />
              </div>
              <p className="text-[12px] text-[var(--theme-text-quaternary)]">{t.toolbar.mushafNote}</p>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-[12px] text-[var(--theme-text-tertiary)]">{t.toolbar.mushafTooltipSize}</span>
                  <span className="text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">%{Math.round(mushafTooltipTextSize * 100)}</span>
                </div>
                <CompactSlider value={mushafTooltipTextSize} onChange={setMushafTooltipTextSize} />
              </div>
            </>
          )}
        </CategorySection>

        {/* Font Category */}
        <CategorySection
          title={t.toolbar.fontCategory}
          icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M4 7V4h16v3M9 20h6M12 4v16" /></svg>}
        >
          <CompactFontPicker arabicFontId={arabicFontId} onFontChange={setArabicFont} />
        </CategorySection>

        {/* Color Category */}
        <CategorySection
          title={t.toolbar.colorCategory}
          icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" /><path d="M2 12h20" /></svg>}
        >
          {/* Colorize words */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-[var(--theme-text-secondary)]">{t.theme.colorizeWords}</span>
            <ToggleSwitch checked={colorizeWords} onChange={setColorizeWords} />
          </div>
          {colorizeWords && (
            <div className="mt-2 flex items-center gap-2">
              {COLOR_PALETTES.map((p) => (
                <button key={p.id} onClick={() => setColorPalette(p.id as ColorPaletteId)} className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all ${colorPaletteId === p.id ? "border-primary-600 ring-2 ring-primary-600/30" : "border-[var(--theme-divider)]"}`} aria-label={p.name} title={p.name}>
                  <svg width="16" height="16" viewBox="0 0 18 18"><rect x="1" y="1" width="7" height="7" rx="1.5" fill={p.colors[0]} /><rect x="10" y="1" width="7" height="7" rx="1.5" fill={p.colors[1]} /><rect x="1" y="10" width="7" height="7" rx="1.5" fill={p.colors[2]} /><rect x="10" y="10" width="7" height="7" rx="1.5" fill={p.colors[3]} /></svg>
                </button>
              ))}
            </div>
          )}
        </CategorySection>
      </div>
      </div>{/* end scrollable */}
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1 font-medium transition-colors ${
          segmentStyle
            ? `relative z-[1] justify-center rounded-lg px-2.5 py-1.5 text-[12px] sm:px-3.5 ${open ? "text-[var(--theme-text)]" : "text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"}`
            : `items-center justify-center rounded-lg p-1.5 ${open ? "text-primary-700 bg-primary-600/10" : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"}`
        }`}
        aria-label={t.reading.settings}
      >
        <span className="text-[14px] font-semibold">A</span>
        <span className="arabic-text -translate-y-px font-semibold leading-none" style={{ fontSize: '14px' }}>ع</span>
      </button>

      {(open || closing) && typeof document !== "undefined" && createPortal(panelContent, document.body)}
    </>
  );
}
