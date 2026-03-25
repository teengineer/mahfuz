import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { allCardsQueryOptions } from "~/hooks/queries/memorization";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { usePlaylistStore } from "~/stores/usePlaylistStore";
import { useI18nStore } from "~/stores/useI18nStore";
import { getSurahName } from "~/lib/surah-name";
import { useTranslation } from "~/hooks/useTranslation";

interface MemorizeSurahInfo {
  surahId: number;
  nameAr: string;
  nameTr: string;
  versesCount: number;
  cardCount: number;
  memorizedVerses: Set<number>;
}

// Popular short surahs for memorization suggestions
const SUGGESTED_SURAH_IDS = [1, 112, 113, 114, 110, 108, 107, 105, 103, 102, 101, 100, 99, 97, 96, 36, 67, 78, 55, 56];

/** Find the first contiguous range of unmemorized verses */
function getUnmemorizedRange(memorized: Set<number>, total: number): { from: number; to: number } {
  // Find first unmemorized verse
  let from = 1;
  for (let v = 1; v <= total; v++) {
    if (!memorized.has(v)) {
      from = v;
      break;
    }
  }
  // Find last unmemorized verse (contiguous from `from`)
  let to = from;
  for (let v = from + 1; v <= total; v++) {
    if (!memorized.has(v)) {
      to = v;
    } else {
      break;
    }
  }
  return { from, to };
}

export function MemorizationQuickAdd() {
  const { t } = useTranslation();
  const locale = useI18nStore((s) => s.locale);
  const routerState = useRouterState({
    select: (s) => s.matches[0]?.context as { session?: { user?: { id: string } } | null } | undefined,
  });
  const userId = routerState?.session?.user?.id ?? "anonymous";

  const { data: allCards } = useQuery(allCardsQueryOptions(userId));
  const { data: chapters } = useQuery(chaptersQueryOptions());
  const items = usePlaylistStore((s) => s.items);
  const addItem = usePlaylistStore((s) => s.addItem);
  const removeItem = usePlaylistStore((s) => s.removeItem);

  // Find surahs with memorization cards
  const memorizeSurahs = useMemo<MemorizeSurahInfo[]>(() => {
    if (!allCards?.length || !chapters?.length) return [];

    // Count cards per surah and track which verses are memorized
    const surahCardCounts = new Map<number, number>();
    const surahMemorizedVerses = new Map<number, Set<number>>();
    for (const card of allCards) {
      const [surahStr, verseStr] = card.verseKey.split(":");
      const surahId = parseInt(surahStr, 10);
      const verseNum = parseInt(verseStr, 10);
      surahCardCounts.set(surahId, (surahCardCounts.get(surahId) || 0) + 1);
      if (!surahMemorizedVerses.has(surahId)) {
        surahMemorizedVerses.set(surahId, new Set());
      }
      surahMemorizedVerses.get(surahId)!.add(verseNum);
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
          memorizedVerses: surahMemorizedVerses.get(surahId) || new Set(),
        };
      })
      .filter((x): x is MemorizeSurahInfo => x !== null)
      // Hide fully memorized surahs — only show in-progress
      .filter((x) => x.cardCount < x.versesCount)
      .sort((a, b) => a.surahId - b.surahId);
  }, [allCards, chapters, locale]);

  // Suggested surahs (when no memorization cards exist)
  const suggestedSurahs = useMemo(() => {
    if (memorizeSurahs.length > 0 || !chapters?.length) return [];

    return SUGGESTED_SURAH_IDS
      .map((id) => {
        const ch = chapters.find((c) => c.id === id);
        if (!ch) return null;
        return {
          surahId: id,
          nameAr: ch.name_arabic,
          nameTr: getSurahName(ch.id, ch.translated_name.name, locale),
          versesCount: ch.verses_count,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [memorizeSurahs.length, chapters, locale]);

  // Check which surahs are already in playlist
  const playlistSurahIds = new Set(items.map((i) => i.surahId));

  const hasInProgress = memorizeSurahs.length > 0;
  const showSuggested = !hasInProgress && suggestedSurahs.length > 0;

  if (!hasInProgress && !showSuggested) return null;

  return (
    <div className="mb-4 space-y-3">
      {/* In-progress memorization surahs */}
      {hasInProgress && (
        <div>
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

              // Find first unmemorized verse range for smarter defaults
              const unmemorizedRange = getUnmemorizedRange(s.memorizedVerses, s.versesCount);

              return (
                <SurahChip
                  key={s.surahId}
                  name={s.nameTr}
                  badge={`${s.cardCount}/${s.versesCount}`}
                  subtitle={`${unmemorizedRange.from}-${unmemorizedRange.to}`}
                  inPlaylist={inPlaylist}
                  onClick={() => {
                    if (inPlaylist && playlistItem) {
                      removeItem(playlistItem.id);
                    } else {
                      // Auto-set range to unmemorized verses
                      addItem(s.surahId, s.nameAr, s.nameTr, s.versesCount, unmemorizedRange.from, unmemorizedRange.to);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Suggested surahs */}
      {showSuggested && (
        <div>
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-4 w-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            <span className="text-[13px] font-semibold text-[var(--theme-text-secondary)]">
              {t.playlist.suggestedSurahs}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {suggestedSurahs.map((s) => {
              const inPlaylist = playlistSurahIds.has(s.surahId);
              const playlistItem = inPlaylist
                ? items.find((i) => i.surahId === s.surahId)
                : null;

              return (
                <SurahChip
                  key={s.surahId}
                  name={s.nameTr}
                  badge={`${s.versesCount}`}
                  inPlaylist={inPlaylist}
                  onClick={() => {
                    if (inPlaylist && playlistItem) {
                      removeItem(playlistItem.id);
                    } else {
                      addItem(s.surahId, s.nameAr, s.nameTr, s.versesCount);
                    }
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SurahChip({
  name,
  badge,
  subtitle,
  inPlaylist,
  onClick,
}: {
  name: string;
  badge: string;
  subtitle?: string;
  inPlaylist: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
        inPlaylist
          ? "border-primary-600 bg-primary-600 text-white shadow-sm dark:bg-primary-600 dark:text-white"
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
      <span>{name}</span>
      <span className={`text-[11px] ${inPlaylist ? "text-white/70" : "text-[var(--theme-text-quaternary)]"}`}>
        {badge}
      </span>
      {subtitle && (
        <span className={`text-[10px] ${inPlaylist ? "text-white/60" : "text-[var(--theme-text-quaternary)]"}`}>
          ({subtitle})
        </span>
      )}
    </button>
  );
}
