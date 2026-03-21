import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { allCardsQueryOptions } from "~/hooks/queries/memorization";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { usePlaylistStore, type PlaylistItem } from "~/stores/usePlaylistStore";
import { useI18nStore } from "~/stores/useI18nStore";
import { getSurahName } from "~/lib/surah-name";
import { useTranslation } from "~/hooks/useTranslation";

interface MemorizeSurahInfo {
  surahId: number;
  nameAr: string;
  nameTr: string;
  versesCount: number;
  cardCount: number;
}

export function MemorizationQuickAdd() {
  const { t } = useTranslation();
  const locale = useI18nStore((s) => s.locale);
  const { data: allCards } = useQuery(allCardsQueryOptions());
  const { data: chapters } = useQuery(chaptersQueryOptions());
  const items = usePlaylistStore((s) => s.items);
  const addItem = usePlaylistStore((s) => s.addItem);
  const removeItem = usePlaylistStore((s) => s.removeItem);

  // Find surahs with memorization cards
  const memorizeSurahs = useMemo<MemorizeSurahInfo[]>(() => {
    if (!allCards?.length || !chapters?.length) return [];

    // Count cards per surah
    const surahCardCounts = new Map<number, number>();
    for (const card of allCards) {
      const surahId = parseInt(card.verseKey.split(":")[0], 10);
      surahCardCounts.set(surahId, (surahCardCounts.get(surahId) || 0) + 1);
    }

    // Build info for each surah
    return Array.from(surahCardCounts.entries())
      .map(([surahId, cardCount]) => {
        const ch = chapters.find((c) => c.id === surahId);
        if (!ch) return null;
        return {
          surahId,
          nameAr: ch.name_arabic,
          nameTr: getSurahName(ch.id, ch.translated_name.name, locale),
          versesCount: ch.verses_count,
          cardCount,
        };
      })
      .filter((x): x is MemorizeSurahInfo => x !== null)
      .sort((a, b) => a.surahId - b.surahId);
  }, [allCards, chapters, locale]);

  if (memorizeSurahs.length === 0) return null;

  // Check which surahs are already in playlist
  const playlistSurahIds = new Set(items.map((i) => i.surahId));

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        <span className="text-[13px] font-semibold text-[var(--theme-text-secondary)]">
          {t.playlist.memorizeSurahs}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {memorizeSurahs.map((s) => {
          const inPlaylist = playlistSurahIds.has(s.surahId);
          const playlistItem = inPlaylist
            ? items.find((i) => i.surahId === s.surahId)
            : null;

          return (
            <button
              key={s.surahId}
              onClick={() => {
                if (inPlaylist && playlistItem) {
                  removeItem(playlistItem.id);
                } else {
                  addItem(s.surahId, s.nameAr, s.nameTr, s.versesCount);
                }
              }}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                inPlaylist
                  ? "border-primary-500/40 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                  : "border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] text-[var(--theme-text)] hover:border-primary-500/30 hover:bg-primary-50/50 dark:hover:bg-primary-900/10"
              }`}
            >
              {inPlaylist ? (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              )}
              <span>{s.nameTr}</span>
              <span className="text-[11px] text-[var(--theme-text-quaternary)]">
                {s.cardCount}/{s.versesCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
