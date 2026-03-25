import { useEffect, useRef } from "react";
import { useReadingStats } from "~/stores/useReadingStats";
import type { Verse } from "@mahfuz/shared/types";

/**
 * Tracks which Quran pages the user has actually read by observing
 * verse elements in the viewport. When a verse becomes >50% visible,
 * its page is marked as read for khatam progress.
 *
 * Works with any reading route (surah, page, juz) since every Verse
 * has a `page_number` field.
 */
export function usePageTracking(verses: Verse[], enabled = true) {
  const markPageRead = useReadingStats((s) => s.markPageRead);
  const markedPagesRef = useRef<Set<number>>(new Set());

  // Reset marked pages when verses change (new surah/page/juz loaded)
  useEffect(() => {
    markedPagesRef.current = new Set();
  }, [verses]);

  useEffect(() => {
    if (!enabled || verses.length === 0) return;

    // Build verseKey → page_number mapping
    const versePageMap = new Map<string, number>();
    for (const v of verses) {
      versePageMap.set(v.verse_key, v.page_number);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const verseKey = entry.target.getAttribute("data-verse-key");
            if (verseKey) {
              const pageNum = versePageMap.get(verseKey);
              if (pageNum && !markedPagesRef.current.has(pageNum)) {
                markedPagesRef.current.add(pageNum);
                markPageRead(pageNum);
              }
            }
          }
        }
      },
      { threshold: 0.5 },
    );

    // Observe all verse elements
    const verseEls = document.querySelectorAll("[data-verse-key]");
    verseEls.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [verses, enabled, markPageRead]);
}
