import { useI18nStore } from "../stores/useI18nStore";
import { getLocaleConfig } from "../locales/registry";
import type { Direction } from "../locales/types";

/** Returns the text direction for the current locale. */
export function useDirection(): Direction {
  const locale = useI18nStore((s) => s.locale);
  return getLocaleConfig(locale).dir;
}

/** Returns true when the current locale is RTL. */
export function useIsRTL(): boolean {
  return useDirection() === "rtl";
}
