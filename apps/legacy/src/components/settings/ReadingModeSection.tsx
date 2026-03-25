import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { TranslationPicker } from "~/components/quran/TranslationPicker";
import { useTranslation } from "~/hooks/useTranslation";
import { SettingsLabel, ToggleSwitch } from "./SettingsShared";

type ReadingModeTab = "metin" | "mushaf";

function getSampleData(textType: string) {
  const isUthmani = textType === "uthmani";
  return {
    sampleWords: isUthmani
      ? ["بِسْمِ", "ٱللَّهِ", "ٱلرَّحْمَٰنِ", "ٱلرَّحِيمِ"]
      : ["بِسْمِ", "اللَّهِ", "الرَّحْمَٰنِ", "الرَّحِيمِ"],
  };
}

const SAMPLE_WORD_TRANSLATIONS = [
  "Allah\u2019\u0131n ad\u0131yla",
  "Allah",
  "Rahm\u00e2n",
  "Rah\u00eem",
];

const SAMPLE_WORD_TRANSLITERATIONS = [
  "bismi",
  "all\u00e2hi",
  "ar-rahm\u00e2ni",
  "ar-rah\u00eemi",
];

interface ReadingModeSectionProps {
  readingModeTab: ReadingModeTab;
  onReadingModeTabChange: (tab: ReadingModeTab) => void;
  fontFamily: string;
  colorizeWords: boolean;
  colors: string[];
  textType: string;
  // Normal mode
  normalArabicFontSize: number;
  normalTranslationFontSize: number;
  onNormalArabicSizeChange: (v: number) => void;
  onNormalTranslationSizeChange: (v: number) => void;
  // WBW mode
  wbwArabicFontSize: number;
  onWbwArabicSizeChange: (v: number) => void;
  wbwShowWordTranslation: boolean;
  wbwShowWordTransliteration: boolean;
  wordTranslationSize: number;
  wordTransliterationSize: number;
  onWbwShowWordTranslationChange: (v: boolean) => void;
  onWbwShowWordTransliterationChange: (v: boolean) => void;
  onWordTranslationSizeChange: (v: number) => void;
  onWordTransliterationSizeChange: (v: number) => void;
  // Mushaf mode
  mushafArabicFontSize: number;
  onMushafArabicSizeChange: (v: number) => void;
  mushafTranslationFontSize: number;
  onMushafTranslationSizeChange: (v: number) => void;
  mushafTooltipTextSize: number;
  onMushafTooltipTextSizeChange: (v: number) => void;
}

export function ReadingModeSection({
  readingModeTab,
  onReadingModeTabChange,
  fontFamily,
  colorizeWords,
  colors,
  textType,
  normalArabicFontSize,
  normalTranslationFontSize,
  onNormalArabicSizeChange,
  onNormalTranslationSizeChange,
  wbwArabicFontSize,
  onWbwArabicSizeChange,
  wbwShowWordTranslation,
  wbwShowWordTransliteration,
  wordTranslationSize,
  wordTransliterationSize,
  onWbwShowWordTranslationChange,
  onWbwShowWordTransliterationChange,
  onWordTranslationSizeChange,
  onWordTransliterationSizeChange,
  mushafArabicFontSize,
  onMushafArabicSizeChange,
  mushafTranslationFontSize,
  onMushafTranslationSizeChange,
  mushafTooltipTextSize,
  onMushafTooltipTextSizeChange,
}: ReadingModeSectionProps) {
  const { t } = useTranslation();

  const READING_MODE_OPTIONS: { value: ReadingModeTab; label: string }[] = [
    { value: "metin", label: t.settings.viewModes.metin },
    { value: "mushaf", label: t.settings.viewModes.mushaf },
  ];

  return (
    <>
      <SegmentedControl options={READING_MODE_OPTIONS} value={readingModeTab} onChange={onReadingModeTabChange} stretch />
      <div className="mt-5">
        {readingModeTab === "metin" && (
          <MetinTabContent
            fontFamily={fontFamily}
            normalArabicFontSize={normalArabicFontSize}
            translationFontSize={normalTranslationFontSize}
            onNormalArabicSizeChange={onNormalArabicSizeChange}
            onTranslationSizeChange={onNormalTranslationSizeChange}
            wbwArabicFontSize={wbwArabicFontSize}
            onWbwArabicSizeChange={onWbwArabicSizeChange}
            colorizeWords={colorizeWords}
            colors={colors}
            showWordTranslation={wbwShowWordTranslation}
            showWordTransliteration={wbwShowWordTransliteration}
            wordTranslationSize={wordTranslationSize}
            wordTransliterationSize={wordTransliterationSize}
            onShowWordTranslationChange={onWbwShowWordTranslationChange}
            onShowWordTransliterationChange={onWbwShowWordTransliterationChange}
            onWordTranslationSizeChange={onWordTranslationSizeChange}
            onWordTransliterationSizeChange={onWordTransliterationSizeChange}
            textType={textType}
          />
        )}
        {readingModeTab === "mushaf" && (
          <MushafTabContent
            fontFamily={fontFamily}
            arabicFontSize={mushafArabicFontSize}
            onArabicSizeChange={onMushafArabicSizeChange}
            translationFontSize={mushafTranslationFontSize}
            onTranslationSizeChange={onMushafTranslationSizeChange}
            tooltipTextSize={mushafTooltipTextSize}
            onTooltipTextSizeChange={onMushafTooltipTextSizeChange}
            colorizeWords={colorizeWords}
            colors={colors}
            textType={textType}
          />
        )}
      </div>
    </>
  );
}

// ─── Metin tab (Normal + WBW combined) ──────────────────────────────
function MetinTabContent({
  fontFamily,
  normalArabicFontSize,
  translationFontSize,
  onNormalArabicSizeChange,
  onTranslationSizeChange,
  wbwArabicFontSize,
  onWbwArabicSizeChange,
  colorizeWords,
  colors,
  showWordTranslation,
  showWordTransliteration,
  wordTranslationSize,
  wordTransliterationSize,
  onShowWordTranslationChange,
  onShowWordTransliterationChange,
  onWordTranslationSizeChange,
  onWordTransliterationSizeChange,
  textType,
}: {
  fontFamily: string;
  normalArabicFontSize: number;
  translationFontSize: number;
  onNormalArabicSizeChange: (v: number) => void;
  onTranslationSizeChange: (v: number) => void;
  wbwArabicFontSize: number;
  onWbwArabicSizeChange: (v: number) => void;
  colorizeWords: boolean;
  colors: string[];
  showWordTranslation: boolean;
  showWordTransliteration: boolean;
  wordTranslationSize: number;
  wordTransliterationSize: number;
  onShowWordTranslationChange: (v: boolean) => void;
  onShowWordTransliterationChange: (v: boolean) => void;
  onWordTranslationSizeChange: (v: number) => void;
  onWordTransliterationSizeChange: (v: number) => void;
  textType: string;
}) {
  const { t } = useTranslation();
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
  const showWordByWord = usePreferencesStore((s) => s.showWordByWord);
  const setShowWordByWord = usePreferencesStore((s) => s.setShowWordByWord);
  const wbwShowTranslation = usePreferencesStore((s) => s.wbwShowTranslation);
  const setWbwShowTranslation = usePreferencesStore((s) => s.setWbwShowTranslation);
  const { sampleWords } = getSampleData(textType);

  const arabicFontSize = showWordByWord ? wbwArabicFontSize : normalArabicFontSize;
  const onArabicSizeChange = showWordByWord ? onWbwArabicSizeChange : onNormalArabicSizeChange;

  const fontStyle = {
    fontFamily: `${fontFamily}, "Traditional Arabic", serif`,
    fontSize: `calc(1.65rem * ${arabicFontSize})`,
    lineHeight: 2.6,
  };

  const renderWord = (text: string, i: number) => (
    <span
      key={i}
      style={colorizeWords ? { color: colors[i % colors.length] } : undefined}
    >
      {text}
      {i < sampleWords.length - 1 ? " " : ""}
    </span>
  );

  return (
    <>
      {/* Preview */}
      {showWordByWord ? (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-4">
          <div className="flex flex-wrap justify-end gap-x-5 gap-y-3" dir="rtl">
            {sampleWords.map((word, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-xl" dir="rtl" style={{ fontFamily: `${fontFamily}, "Traditional Arabic", serif`, fontSize: `calc(1.5rem * ${wbwArabicFontSize})`, color: colorizeWords ? colors[i % colors.length] : "var(--theme-text)" }}>{word}</span>
                {showWordTranslation && <span className="font-sans text-[var(--theme-text-tertiary)]" style={{ fontSize: `calc(11px * ${wordTranslationSize})` }}>{SAMPLE_WORD_TRANSLATIONS[i]}</span>}
                {showWordTransliteration && <span className="font-sans text-[var(--theme-text-quaternary)]" style={{ fontSize: `calc(10px * ${wordTransliterationSize})` }}>{SAMPLE_WORD_TRANSLITERATIONS[i]}</span>}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg)] px-5 py-4">
          <p className="text-[var(--theme-text)]" dir="rtl" style={fontStyle}>{sampleWords.map(renderWord)}</p>
          <p className="mt-2 font-sans text-[var(--theme-text-secondary)]" style={{ fontSize: `calc(15px * ${translationFontSize})`, lineHeight: 1.8 }}>{t.settings.sampleTranslation}</p>
        </div>
      )}

      {/* Arabic size slider */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--theme-text)]">{t.settings.arabicSize}</span>
          <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(arabicFontSize * 100)}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="arabic-text text-sm text-[var(--theme-text-tertiary)]">ع</span>
          <input type="range" min="0.6" max="5.0" step="0.05" value={arabicFontSize} onChange={(e) => onArabicSizeChange(Number(e.target.value))} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600" />
          <span className="arabic-text text-xl text-[var(--theme-text-tertiary)]">ع</span>
        </div>
      </div>

      {/* Translation size slider */}
      {!showWordByWord && (
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-[var(--theme-text)]">{t.settings.translationSize}</span>
            <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(translationFontSize * 100)}</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-[var(--theme-text-tertiary)]">A</span>
            <input type="range" min="0.6" max="5.0" step="0.05" value={translationFontSize} onChange={(e) => onTranslationSizeChange(Number(e.target.value))} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600" />
            <span className="text-lg text-[var(--theme-text-tertiary)]">A</span>
          </div>
        </div>
      )}

      {/* Translation toggle */}
      <div className="mt-5 border-t border-[var(--theme-border)] pt-5">
        <div className="flex items-center justify-between">
          <div>
            <SettingsLabel>{t.settings.showTranslation}</SettingsLabel>
            <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">{t.settings.showTranslationDesc}</p>
          </div>
          <ToggleSwitch checked={showWordByWord ? wbwShowTranslation : normalShowTranslation} onChange={showWordByWord ? setWbwShowTranslation : setNormalShowTranslation} />
        </div>
        {(showWordByWord ? wbwShowTranslation : normalShowTranslation) && (
          <div className="mt-4">
            <SettingsLabel>{t.settings.translationSelection}</SettingsLabel>
            <p className="mt-0.5 mb-2 text-[12px] text-[var(--theme-text-tertiary)]">{t.settings.translationSelectionDesc}</p>
            <TranslationPicker />
          </div>
        )}
      </div>

      {/* Word-by-word toggle */}
      <div className="mt-5 border-t border-[var(--theme-border)] pt-5">
        <div className="flex items-center justify-between">
          <div>
            <SettingsLabel>{t.reading.wordByWordLabel ?? "Kelime Kelime"}</SettingsLabel>
            <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">{t.reading.wordByWordSubtitle ?? "Her kelimenin çevirisi ve okunuşunu göster"}</p>
          </div>
          <ToggleSwitch checked={showWordByWord} onChange={setShowWordByWord} />
        </div>

        {showWordByWord && (
          <div className="mt-4 space-y-4">
            {/* Word Translation toggle + size */}
            <div>
              <div className="flex items-center justify-between">
                <SettingsLabel>{t.settings.wordTranslation}</SettingsLabel>
                <ToggleSwitch checked={showWordTranslation} onChange={onShowWordTranslationChange} />
              </div>
              {showWordTranslation && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="shrink-0 text-[12px] text-[var(--theme-text-tertiary)]">{t.settings.translationSize}</span>
                  <input type="range" min="0.6" max="5.0" step="0.05" value={wordTranslationSize} onChange={(e) => onWordTranslationSizeChange(Number(e.target.value))} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600" />
                  <span className="shrink-0 text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(wordTranslationSize * 100)}</span>
                </div>
              )}
            </div>
            {/* Word Transliteration toggle + size */}
            <div className="border-t border-[var(--theme-border)] pt-4">
              <div className="flex items-center justify-between">
                <SettingsLabel>{t.settings.transliteration}</SettingsLabel>
                <ToggleSwitch checked={showWordTransliteration} onChange={onShowWordTransliterationChange} />
              </div>
              {showWordTransliteration && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="shrink-0 text-[12px] text-[var(--theme-text-tertiary)]">{t.settings.transliterationSize}</span>
                  <input type="range" min="0.6" max="5.0" step="0.05" value={wordTransliterationSize} onChange={(e) => onWordTransliterationSizeChange(Number(e.target.value))} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600" />
                  <span className="shrink-0 text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(wordTransliterationSize * 100)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hover word info (only when not in WBW) */}
      {!showWordByWord && (
        <div className="mt-5 border-t border-[var(--theme-border)] pt-5">
          <div className="flex items-center justify-between">
            <div>
              <SettingsLabel>{t.reading.wordInfo}</SettingsLabel>
              <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">{t.reading.wordInfoSubtitle}</p>
            </div>
            <ToggleSwitch checked={normalShowWordHover} onChange={setNormalShowWordHover} />
          </div>
          {normalShowWordHover && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <SettingsLabel>{t.reading.hoverTranslation}</SettingsLabel>
                <ToggleSwitch checked={normalHoverShowTranslation} onChange={setNormalHoverShowTranslation} />
              </div>
              <div className="flex items-center justify-between">
                <SettingsLabel>{t.reading.hoverTransliteration}</SettingsLabel>
                <ToggleSwitch checked={normalHoverShowTransliteration} onChange={setNormalHoverShowTransliteration} />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-[var(--theme-text)]">{t.reading.hoverTextSize}</span>
                  <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(normalHoverTextSize * 100)}</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <span className="text-xs text-[var(--theme-text-tertiary)]">A</span>
                  <input type="range" min="0.6" max="5.0" step="0.05" value={normalHoverTextSize} onChange={(e) => setNormalHoverTextSize(Number(e.target.value))} className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600" />
                  <span className="text-lg text-[var(--theme-text-tertiary)]">A</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Mushaf tab ─────────────────────────────────────────────────────
function MushafTabContent({
  fontFamily,
  arabicFontSize,
  onArabicSizeChange,
  translationFontSize,
  onTranslationSizeChange,
  tooltipTextSize,
  onTooltipTextSizeChange,
  colorizeWords,
  colors,
  textType,
}: {
  fontFamily: string;
  arabicFontSize: number;
  onArabicSizeChange: (v: number) => void;
  translationFontSize: number;
  onTranslationSizeChange: (v: number) => void;
  tooltipTextSize: number;
  onTooltipTextSizeChange: (v: number) => void;
  colorizeWords: boolean;
  colors: string[];
  textType: string;
}) {
  const { t } = useTranslation();
  const { sampleWords } = getSampleData(textType);

  const fontStyle = {
    fontFamily: `${fontFamily}, "Traditional Arabic", serif`,
    fontSize: `calc(1.2rem * ${arabicFontSize})`,
    lineHeight: 2.4,
  };

  const renderWord = (text: string, i: number) => (
    <span
      key={i}
      style={colorizeWords ? { color: colors[i % colors.length] } : undefined}
    >
      {text}
      {i < sampleWords.length - 1 ? " " : ""}
    </span>
  );

  return (
    <>
      {/* Two-panel preview */}
      <div className="flex overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--mushaf-paper)]">
        {/* Meal (left) */}
        <div className="flex-1 p-3">
          <p
            className="font-sans leading-[1.7] text-[var(--theme-text-secondary)]"
            style={{ fontSize: `calc(11px * ${translationFontSize})` }}
          >
            {t.settings.sampleTranslation}
          </p>
        </div>
        {/* Spine */}
        <div className="w-px bg-[var(--mushaf-gold-light)]" />
        {/* Arabic (right) */}
        <div className="flex-1 p-3">
          <p className="text-center text-[var(--mushaf-ink)]" dir="rtl" style={fontStyle}>
            {sampleWords.map(renderWord)}
          </p>
        </div>
      </div>

      {/* Arabic size slider */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--theme-text)]">{t.settings.arabicSize}</span>
          <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(arabicFontSize * 100)}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="arabic-text text-sm text-[var(--theme-text-tertiary)]">ع</span>
          <input
            type="range" min="0.6" max="5.0" step="0.05"
            value={arabicFontSize}
            onChange={(e) => onArabicSizeChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
          />
          <span className="arabic-text text-xl text-[var(--theme-text-tertiary)]">ع</span>
        </div>
      </div>

      {/* Translation size slider */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--theme-text)]">{t.settings.translationSize}</span>
          <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(translationFontSize * 100)}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-[var(--theme-text-tertiary)]">A</span>
          <input
            type="range" min="0.6" max="5.0" step="0.05"
            value={translationFontSize}
            onChange={(e) => onTranslationSizeChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
          />
          <span className="text-lg text-[var(--theme-text-tertiary)]">A</span>
        </div>
      </div>

      {/* Tooltip text size slider */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium text-[var(--theme-text)]">{t.toolbar.mushafTooltipSize}</span>
          <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">%{Math.round(tooltipTextSize * 100)}</span>
        </div>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-xs text-[var(--theme-text-tertiary)]">A</span>
          <input
            type="range" min="0.6" max="5.0" step="0.05"
            value={tooltipTextSize}
            onChange={(e) => onTooltipTextSizeChange(Number(e.target.value))}
            className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
          />
          <span className="text-lg text-[var(--theme-text-tertiary)]">A</span>
        </div>
      </div>

      {/* Mushaf meal panel toggle */}
      <MushafMealToggle />
    </>
  );
}

function MushafMealToggle() {
  const { t } = useTranslation();
  const mushafShowTranslation = usePreferencesStore((s) => s.mushafShowTranslation);
  const setMushafShowTranslation = usePreferencesStore((s) => s.setMushafShowTranslation);
  return (
    <div className="mt-5 border-t border-[var(--theme-border)] pt-5">
      <div className="flex items-center justify-between">
        <div>
          <SettingsLabel>{t.settings.showTranslation}</SettingsLabel>
          <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">
            {t.settings.showTranslationDesc}
          </p>
        </div>
        <ToggleSwitch checked={mushafShowTranslation} onChange={setMushafShowTranslation} />
      </div>
    </div>
  );
}
