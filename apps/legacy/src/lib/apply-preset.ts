import { READING_PRESETS, type ReadingPreset } from "./constants";
import { useDisplayPrefs } from "~/stores/useDisplayPrefs";
import { useReadingPrefs } from "~/stores/useReadingPrefs";

export function isPresetActive(preset: ReadingPreset): boolean {
  const display = useDisplayPrefs.getState();
  const reading = useReadingPrefs.getState();
  const { overrides } = preset;

  if (overrides.theme !== undefined && display.theme !== overrides.theme) return false;
  if (overrides.viewMode !== undefined && reading.viewMode !== overrides.viewMode) return false;
  if (overrides.showTranslation !== undefined && reading.normalShowTranslation !== overrides.showTranslation) return false;
  return true;
}

export function applyPreset(preset: ReadingPreset) {
  const { overrides } = preset;

  if (overrides.theme !== undefined) {
    useDisplayPrefs.getState().setAutoTheme(false);
    useDisplayPrefs.getState().setTheme(overrides.theme);
  }
  if (overrides.arabicFontSize !== undefined) {
    useReadingPrefs.getState().setNormalArabicFontSize(overrides.arabicFontSize);
  }
  if (overrides.viewMode !== undefined) {
    useReadingPrefs.getState().setViewMode(overrides.viewMode);
  }
  if (overrides.showWordByWord !== undefined) {
    useReadingPrefs.getState().setShowWordByWord(overrides.showWordByWord);
  }
  if (overrides.showTranslation !== undefined) {
    useReadingPrefs.getState().setNormalShowTranslation(overrides.showTranslation);
  }
  if (overrides.wbwShowWordTranslation !== undefined) {
    useReadingPrefs.getState().setWbwShowWordTranslation(overrides.wbwShowWordTranslation);
  }
  if (overrides.wbwShowWordTransliteration !== undefined) {
    useReadingPrefs.getState().setWbwShowWordTransliteration(overrides.wbwShowWordTransliteration);
  }
  if (overrides.wbwShowGrammar !== undefined) {
    useReadingPrefs.getState().setWbwShowGrammar(overrides.wbwShowGrammar);
  }
  if (overrides.mushafShowTranslation !== undefined) {
    useReadingPrefs.getState().setMushafShowTranslation(overrides.mushafShowTranslation);
  }
}

/** Toggle preset: if active → revert to default, if inactive → apply */
export function togglePreset(preset: ReadingPreset) {
  if (isPresetActive(preset) && preset.id !== "default") {
    const defaultPreset = READING_PRESETS.find((p) => p.id === "default")!;
    applyPreset(defaultPreset);
  } else {
    applyPreset(preset);
  }
}
