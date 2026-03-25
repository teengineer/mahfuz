import { COLOR_PALETTES, getArabicFont } from "~/stores/usePreferencesStore";
import type { ColorPaletteId } from "~/stores/usePreferencesStore";
import { useTranslation } from "~/hooks/useTranslation";
import { SettingsLabel, ToggleSwitch } from "./SettingsShared";

interface WordColorSectionProps {
  colorizeWords: boolean;
  onColorizeChange: (v: boolean) => void;
  colorPaletteId: ColorPaletteId;
  onPaletteChange: (id: ColorPaletteId) => void;
  colors: string[];
  arabicFontId: string;
  textType: string;
}

export function WordColorSection({
  colorizeWords,
  onColorizeChange,
  colorPaletteId,
  onPaletteChange,
  colors,
  arabicFontId,
  textType,
}: WordColorSectionProps) {
  const { t } = useTranslation();
  const currentFont = getArabicFont(arabicFontId);

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <SettingsLabel>{t.settings.colorizeWords}</SettingsLabel>
          <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">
            {t.settings.colorizeWordsDesc}
          </p>
        </div>
        <ToggleSwitch checked={colorizeWords} onChange={onColorizeChange} />
      </div>
      {colorizeWords && (
        <div className="mt-4">
          <SettingsLabel>{t.settings.colorPalette}</SettingsLabel>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {COLOR_PALETTES.map((palette) => {
              const active = colorPaletteId === palette.id;
              return (
                <button
                  key={palette.id}
                  type="button"
                  onClick={() => onPaletteChange(palette.id)}
                  className={`flex flex-col items-center gap-2 rounded-2xl border px-3 py-3 transition-all ${
                    active
                      ? "border-primary-500 bg-primary-50 shadow-sm"
                      : "border-[var(--theme-border)] bg-[var(--theme-bg)] hover:border-[var(--theme-divider)]"
                  }`}
                >
                  <div className="flex gap-1">
                    {palette.colors.slice(0, 5).map((color, i) => (
                      <span key={i} className="h-4 w-4 rounded-full" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <span className={`text-[12px] font-medium ${active ? "text-primary-700" : "text-[var(--theme-text)]"}`}>
                    {palette.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      {/* Preview */}
      <WordColorPreview
        colorizeWords={colorizeWords}
        colors={colors}
        fontFamily={currentFont.family}
        textType={textType}
      />
    </>
  );
}

function WordColorPreview({
  colorizeWords,
  colors,
  fontFamily,
  textType,
}: {
  colorizeWords: boolean;
  colors: string[];
  fontFamily: string;
  textType: string;
}) {
  const words = textType === "uthmani"
    ? ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"]
    : ["بِسْمِ", "اللَّهِ", "الرَّحْمَٰنِ", "الرَّحِيمِ"];

  return (
    <div className="mt-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-5 py-4">
      <p
        dir="rtl"
        className="text-center text-[1.5rem] leading-[2.4] text-[var(--theme-text)]"
        style={{ fontFamily: `${fontFamily}, "Traditional Arabic", serif` }}
      >
        {words.map((w, i) => (
          <span key={i} style={colorizeWords ? { color: colors[i % colors.length] } : undefined}>
            {w}{i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    </div>
  );
}
