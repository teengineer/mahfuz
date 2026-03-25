import type { Verse, Chapter } from "@mahfuz/shared/types";
import { useFocusStore } from "~/stores/useFocusStore";
import { Bismillah } from "~/components/quran";

interface VerseGroup {
  chapterId: number;
  chapter: Chapter | undefined;
  verses: Verse[];
}

interface FocusFlowingViewProps {
  pageNumber: number;
  verseGroups: VerseGroup[];
}

function toArabicNumeral(n: number): string {
  return String(n).replace(/\d/g, (d) => String.fromCharCode(0x0660 + Number(d)));
}

/**
 * Flowing view: verse-by-verse Arabic text, adjustable font, no translation.
 * Optimized for distraction-free reading.
 */
export function FocusFlowingView({
  pageNumber: _pageNumber,
  verseGroups,
}: FocusFlowingViewProps) {
  const fontSize = useFocusStore((s) => s.focusFontSize);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      {verseGroups.map((group, groupIndex) => {
        const isNewSurah = group.verses[0]?.verse_number === 1;
        return (
          <div key={group.chapterId} className={groupIndex > 0 ? "mt-10" : ""}>
            {/* Surah header */}
            {(groupIndex > 0 || isNewSurah) && group.chapter && (
              <div className="mb-6 text-center">
                <span className="arabic-text text-2xl text-[var(--theme-text)]">
                  {group.chapter.name_arabic}
                </span>
              </div>
            )}

            {/* Bismillah */}
            {isNewSurah &&
              group.chapter?.bismillah_pre && (
                <div className="mb-6">
                  <Bismillah />
                </div>
              )}

            {/* Verses */}
            <div dir="rtl" className="space-y-4">
              {group.verses.map((verse) => (
                <p
                  key={verse.id}
                  className="arabic-text text-[var(--theme-text)] leading-[2.6]"
                  style={{ fontSize: `calc(1.5rem * ${fontSize})` }}
                >
                  {verse.text_uthmani}{" "}
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--theme-border)] text-[11px] font-semibold text-[var(--theme-text-tertiary)]" style={{ fontFamily: "var(--font-sans)" }}>
                    {toArabicNumeral(verse.verse_number)}
                  </span>
                </p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
