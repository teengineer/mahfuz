import { useRef, useEffect, useCallback, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Verse } from "@mahfuz/shared/types";
import { AyahText } from "./AyahText";
import { Bismillah } from "./Bismillah";
import { MushafView } from "./MushafView";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { useAudioStore } from "~/stores/useAudioStore";

/** Surahs that do NOT get a Bismillah prefix (Al-Fatiha has it as verse 1, At-Tawbah has none) */
const NO_BISMILLAH_SURAHS = new Set([1, 9]);

interface VerseListProps {
  verses: Verse[];
  showBismillah?: boolean;
  onPlayFromVerse?: (verseKey: string) => void;
  onTogglePlayPause?: () => void;
  scrollToVerse?: number;
}

export function VerseList({
  verses,
  showBismillah = true,
  onPlayFromVerse,
  onTogglePlayPause,
  scrollToVerse,
}: VerseListProps) {
  const viewMode = usePreferencesStore((s) => s.viewMode);

  if (viewMode === "mushafFlow") {
    return <MushafView verses={verses} showBismillah={showBismillah} />;
  }

  return (
    <VirtualizedVerseList
      verses={verses}
      showBismillah={showBismillah}
      onPlayFromVerse={onPlayFromVerse}
      onTogglePlayPause={onTogglePlayPause}
      scrollToVerse={scrollToVerse}
    />
  );
}

function VirtualizedVerseList({
  verses,
  showBismillah,
  onPlayFromVerse,
  onTogglePlayPause,
  scrollToVerse,
}: Omit<VerseListProps, "viewMode"> & { showBismillah: boolean }) {
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollElement, setScrollElement] = useState<HTMLElement | null>(null);

  // Find the nearest scrollable ancestor (the <main> with overflow-y: auto)
  useEffect(() => {
    let el = listRef.current?.parentElement ?? null;
    while (el) {
      const style = getComputedStyle(el);
      if (style.overflowY === "auto" || style.overflowY === "scroll") {
        setScrollElement(el);
        return;
      }
      el = el.parentElement;
    }
    // Fallback: use documentElement (window scroll)
    setScrollElement(document.documentElement);
  }, []);

  const virtualizer = useVirtualizer({
    count: verses.length,
    estimateSize: () => 240,
    overscan: 5,
    getItemKey: (index) => verses[index].id,
    getScrollElement: () => scrollElement,
  });

  // Scroll to a specific verse when scrollToVerse changes
  useEffect(() => {
    if (scrollToVerse === undefined) return;
    const index = verses.findIndex((v) => v.verse_number === scrollToVerse);
    if (index >= 0) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(index, { align: "center" });
      });
    }
  }, [scrollToVerse, verses, virtualizer]);

  // Auto-scroll to the currently playing verse (audio tracking)
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const playbackState = useAudioStore((s) => s.playbackState);

  useEffect(() => {
    if (!currentVerseKey || playbackState !== "playing") return;
    const index = verses.findIndex((v) => v.verse_key === currentVerseKey);
    if (index >= 0) {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(index, { align: "center", behavior: "smooth" });
      });
    }
  }, [currentVerseKey, playbackState, verses, virtualizer]);

  const measureRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        virtualizer.measureElement(node);
      }
    },
    [virtualizer],
  );

  const items = virtualizer.getVirtualItems();

  return (
    <div ref={listRef}>
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {items.map((virtualRow) => {
          const verse = verses[virtualRow.index];
          const surahId = Number(verse.verse_key.split(":")[0]);
          const needsBismillah =
            showBismillah &&
            verse.verse_number === 1 &&
            !NO_BISMILLAH_SURAHS.has(surahId);

          return (
            <div
              key={virtualRow.key}
              ref={measureRef}
              data-index={virtualRow.index}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div>
                {needsBismillah && <Bismillah />}
                <AyahText
                  verse={verse}
                  onPlayFromVerse={onPlayFromVerse}
                  onTogglePlayPause={onTogglePlayPause}
                />
                <div className="flex items-center justify-center py-1">
                  <span className="h-px flex-1 bg-[var(--theme-divider)]/30" />
                  <span className="mx-3 text-[8px] text-[var(--theme-text-quaternary)]/40">✦</span>
                  <span className="h-px flex-1 bg-[var(--theme-divider)]/30" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
