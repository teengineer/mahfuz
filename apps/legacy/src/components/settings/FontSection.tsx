import { useState, useEffect } from "react";
import {
  ARABIC_FONTS,
  FONT_GROUPS,
  getArabicFont,
} from "~/stores/usePreferencesStore";
import type { FontGroup } from "~/stores/usePreferencesStore";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { useTranslation } from "~/hooks/useTranslation";

const PREVIEW_SURAH = {
  name: "el-Kevser",
  number: 108,
  uthmani: [
    "إِنَّآ أَعْطَيْنَٰكَ ٱلْكَوْثَرَ",
    "فَصَلِّ لِرَبِّكَ وَٱنْحَرْ",
    "إِنَّ شَانِئَكَ هُوَ ٱلْأَبْتَرُ",
  ],
  simple: [
    "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ",
    "فَصَلِّ لِرَبِّكَ وَانْحَرْ",
    "إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ",
  ],
};

interface FontSectionProps {
  arabicFontId: string;
  onFontChange: (id: string) => void;
  colorizeWords: boolean;
  colors: string[];
  textType: string;
  onTextTypeChange: (v: "uthmani" | "simple") => void;
}

export function FontSection({
  arabicFontId,
  onFontChange,
  colorizeWords,
  colors,
  textType,
  onTextTypeChange,
}: FontSectionProps) {
  const { t } = useTranslation();

  return (
    <>
      <h3 className="mb-3 text-[13px] font-semibold text-[var(--theme-text)]">{t.settings.textType}</h3>
      <SegmentedControl
        options={[
          { value: "uthmani" as const, label: t.settings.textTypeUthmani },
          { value: "simple" as const, label: t.settings.textTypeSimple },
        ]}
        value={textType}
        onChange={onTextTypeChange}
        stretch
      />
      <div className="mt-5">
        <FontPickerSection
          arabicFontId={arabicFontId}
          onFontChange={onFontChange}
          colorizeWords={colorizeWords}
          colors={colors}
          textType={textType}
        />
      </div>
    </>
  );
}

function FontPickerSection({
  arabicFontId,
  onFontChange,
  colorizeWords,
  colors,
  textType,
}: {
  arabicFontId: string;
  onFontChange: (id: string) => void;
  colorizeWords: boolean;
  colors: string[];
  textType: string;
}) {
  const { t } = useTranslation();
  const currentFont = getArabicFont(arabicFontId);
  const fontFamily = `${currentFont.family}, "Traditional Arabic", serif`;
  const previewVerses = textType === "uthmani" ? PREVIEW_SURAH.uthmani : PREVIEW_SURAH.simple;
  const [activeTab, setActiveTab] = useState<FontGroup>(currentFont.group);
  let colorIdx = 0;

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
    <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] p-5">
      {/* Live surah preview */}
      <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-[var(--theme-text)]">{currentFont.name}</span>
            {currentFont.source === "local" && (
              <span className="rounded-md bg-primary-600/10 px-1.5 py-0.5 text-[10px] font-medium text-primary-700">
                {t.common.local}
              </span>
            )}
          </div>
          <span className="text-[11px] text-[var(--theme-text-quaternary)]">
            {PREVIEW_SURAH.name} ({PREVIEW_SURAH.number})
          </span>
        </div>

        <div className="space-y-3" dir="rtl">
          {previewVerses.map((verse, vi) => {
            const words = verse.split(" ");
            return (
              <p
                key={vi}
                className="text-[1.5rem] leading-[2.4] text-[var(--theme-text)]"
                style={{ fontFamily }}
              >
                {colorizeWords && colors.length > 0
                  ? words.map((w, wi) => {
                      const idx = colorIdx++;
                      return (
                        <span key={wi} style={{ color: colors[idx % colors.length] }}>
                          {w}{wi < words.length - 1 ? " " : ""}
                        </span>
                      );
                    })
                  : verse}
                <span className="mr-1.5 inline-block text-[0.7em] text-[var(--theme-text-tertiary)]">
                  {String.fromCodePoint(0x06F0 + vi + 1)}
                </span>
              </p>
            );
          })}
        </div>

        <p className="mt-3 border-t border-[var(--theme-border)] pt-3 text-[11px] leading-relaxed text-[var(--theme-text-tertiary)]">
          {(t.fonts.descriptions as Record<string, string>)[currentFont.id] ?? currentFont.desc}
        </p>
      </div>

      {/* Style tabs */}
      <div className="scrollbar-none mt-4 flex gap-1.5 overflow-x-auto">
        {FONT_GROUPS.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setActiveTab(g.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-medium transition-all ${activeTab === g.id ? "bg-primary-600 text-white" : "bg-[var(--theme-pill-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"}`}
          >
            {(t.fonts.groups as Record<string, string>)[g.labelKey]}
          </button>
        ))}
      </div>

      {/* Font card grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {tabFonts.map((font) => {
          const isSelected = font.id === arabicFontId;
          return (
            <button
              key={font.id}
              type="button"
              onClick={() => onFontChange(font.id)}
              className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 transition-all ${
                isSelected
                  ? "border-primary-500 bg-primary-600/10 shadow-sm"
                  : "border-[var(--theme-border)] bg-[var(--theme-bg-primary)] hover:border-[var(--theme-divider)] hover:shadow-sm"
              }`}
            >
              <span
                className="arabic-text block text-[1.25rem] leading-[1.8] text-[var(--theme-text)]"
                dir="rtl"
                style={{ fontFamily: `${font.family}, "Traditional Arabic", serif` }}
              >
                بِسْمِ ٱللَّهِ
              </span>
              <span className={`text-[11px] font-medium leading-tight ${isSelected ? "text-primary-700" : "text-[var(--theme-text-tertiary)]"}`}>
                {font.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
