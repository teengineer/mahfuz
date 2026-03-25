/**
 * Layout-aware page helpers.
 * Provides functions that respect the active page layout (Medine / Berkenar).
 */
import {
  TOTAL_PAGES,
  BERKENAR_TOTAL_PAGES,
  BERKENAR_PAGES_PER_JUZ,
  type PageLayout,
} from "@mahfuz/shared/constants";
import {
  getJuzForPage as medineGetJuzForPage,
  getPagesForJuz as medineGetPagesForJuz,
  getAllJuzRanges as medineGetAllJuzRanges,
} from "@mahfuz/shared";
import { useReadingPrefs } from "~/stores/useReadingPrefs";

/** Total pages for the given layout */
export function getTotalPages(layout: PageLayout): number {
  return layout === "berkenar" ? BERKENAR_TOTAL_PAGES : TOTAL_PAGES;
}

/** Juz number for a page, given the layout */
export function getJuzForPageByLayout(page: number, layout: PageLayout): number {
  if (layout === "berkenar") {
    return Math.min(30, Math.ceil(page / BERKENAR_PAGES_PER_JUZ));
  }
  return medineGetJuzForPage(page);
}

/** Page range [start, end] for a juz, given the layout */
export function getPagesForJuzByLayout(
  juz: number,
  layout: PageLayout,
): [number, number] {
  if (layout === "berkenar") {
    const start = (juz - 1) * BERKENAR_PAGES_PER_JUZ + 1;
    const end = juz * BERKENAR_PAGES_PER_JUZ;
    return [start, end];
  }
  return medineGetPagesForJuz(juz);
}

/** All 30 juz ranges for the given layout */
export function getAllJuzRangesByLayout(
  layout: PageLayout,
): { juz: number; start: number; end: number }[] {
  if (layout === "berkenar") {
    return Array.from({ length: 30 }, (_, i) => {
      const juz = i + 1;
      const start = (juz - 1) * BERKENAR_PAGES_PER_JUZ + 1;
      const end = juz * BERKENAR_PAGES_PER_JUZ;
      return { juz, start, end };
    });
  }
  return medineGetAllJuzRanges();
}

/** React hook — returns the active layout from the store */
export function usePageLayout(): PageLayout {
  return useReadingPrefs((s) => s.pageLayout);
}

/** Non-reactive getter for loaders / queryFn (reads Zustand state directly) */
export function getActiveLayout(): PageLayout {
  return useReadingPrefs.getState().pageLayout;
}
