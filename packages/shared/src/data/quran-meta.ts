/**
 * Static Quran metadata — juz-page boundaries
 * Verified against quran.com API v4
 */

/** Juz start pages (1-indexed). JUZ_START_PAGES[0] = juz 1 start page */
const JUZ_START_PAGES: readonly number[] = [
  1,   22,  42,  62,  82,   // 1-5
  102, 121, 142, 162, 182,  // 6-10
  201, 222, 242, 262, 282,  // 11-15
  302, 322, 342, 362, 382,  // 16-20
  402, 422, 442, 462, 482,  // 21-25
  502, 522, 542, 562, 582,  // 26-30
];

/** Total pages in the Uthmani mushaf */
const LAST_PAGE = 604;

/** Get juz number (1-30) for a given page number (1-604) */
export function getJuzForPage(pageNumber: number): number {
  for (let i = JUZ_START_PAGES.length - 1; i >= 0; i--) {
    if (pageNumber >= JUZ_START_PAGES[i]) {
      return i + 1;
    }
  }
  return 1;
}

/** Get page range [start, end] for a given juz number (1-30) */
export function getPagesForJuz(juzNumber: number): [number, number] {
  const start = JUZ_START_PAGES[juzNumber - 1];
  const end = juzNumber < 30 ? JUZ_START_PAGES[juzNumber] - 1 : LAST_PAGE;
  return [start, end];
}

/** Get all 30 juz ranges as array of { juz, start, end } */
export function getAllJuzRanges(): { juz: number; start: number; end: number }[] {
  return Array.from({ length: 30 }, (_, i) => {
    const [start, end] = getPagesForJuz(i + 1);
    return { juz: i + 1, start, end };
  });
}
