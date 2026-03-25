import { useMemo } from "react";
import type { Verse, Chapter } from "@mahfuz/shared/types";
import { useFocusStore } from "~/stores/useFocusStore";
import { MushafView } from "~/components/quran";
import { FocusFlowingView } from "./FocusFlowingView";

interface FocusPageContentProps {
  pageNumber: number;
  verses: Verse[];
  chapters: Chapter[];
}

/**
 * Switches between mushaf and flowing rendering modes.
 * Annotations are stored per page, so switching modes keeps drawings intact.
 */
export function FocusPageContent({
  pageNumber,
  verses,
  chapters,
}: FocusPageContentProps) {
  const viewMode = useFocusStore((s) => s.focusViewMode);

  // Group verses by chapter for flowing view
  const verseGroups = useMemo(() => {
    const groups: { chapterId: number; chapter: Chapter | undefined; verses: Verse[] }[] = [];
    let currentChapterId = -1;

    for (const verse of verses) {
      const chId = Number(verse.verse_key.split(":")[0]);
      if (chId !== currentChapterId) {
        currentChapterId = chId;
        groups.push({
          chapterId: chId,
          chapter: chapters.find((ch) => ch.id === chId),
          verses: [],
        });
      }
      groups[groups.length - 1].verses.push(verse);
    }
    return groups;
  }, [verses, chapters]);

  if (viewMode === "mushaf") {
    return (
      <div className="flex min-h-full items-center justify-center p-4">
        <MushafView verses={verses} />
      </div>
    );
  }

  return (
    <FocusFlowingView
      pageNumber={pageNumber}
      verseGroups={verseGroups}
    />
  );
}
