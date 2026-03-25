import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueries } from "@tanstack/react-query";
import { useMemo, useState, useCallback } from "react";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import { useVerseBookmarks } from "~/stores/useVerseBookmarks";
import { useReadingList } from "~/stores/useReadingList";
import type { ReadingListItem } from "~/stores/useReadingList";
import { useTranslation } from "~/hooks/useTranslation";
import { interpolate } from "~/lib/i18n-utils";
import { getSurahName } from "~/lib/surah-name";
import { formatRelativeTime } from "~/lib/format-relative-time";
import { Skeleton } from "~/components/ui/Skeleton";
import type { Chapter, Verse } from "@mahfuz/shared/types";

export const Route = createFileRoute("/_app/bookmarks/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(chaptersQueryOptions()),
  pendingComponent: () => (
    <div className="mx-auto max-w-[960px] px-5 py-5 sm:px-6 sm:py-10 lg:max-w-[1200px]">
      <Skeleton className="mb-6 h-8 w-40" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-20" />
        ))}
      </div>
    </div>
  ),
  component: BookmarksPage,
});

function BookmarksPage() {
  const { t, locale } = useTranslation();
  const bookmarks = useVerseBookmarks((s) => s.bookmarks);
  const removeBookmark = useVerseBookmarks((s) => s.removeBookmark);
  const readingListItems = useReadingList((s) => s.items);
  const removeReadingItem = useReadingList((s) => s.removeItem);
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  const isEmpty = bookmarks.length === 0 && readingListItems.length === 0;

  // --- Reading list items by type ---
  const surahItems = useMemo(
    () => readingListItems.filter((i) => i.type === "surah"),
    [readingListItems],
  );
  const juzItems = useMemo(
    () => readingListItems.filter((i) => i.type === "juz"),
    [readingListItems],
  );
  const pageItems = useMemo(
    () => readingListItems.filter((i) => i.type === "page"),
    [readingListItems],
  );

  // --- Verse bookmarks grouped by surah ---
  const grouped = useMemo(() => {
    const sorted = [...bookmarks].sort((a, b) => b.addedAt - a.addedAt);
    const groups = new Map<number, { chapter: Chapter; verseKeys: string[] }>();
    for (const bm of sorted) {
      const surahId = Number(bm.verseKey.split(":")[0]);
      if (!groups.has(surahId)) {
        const chapter = chapters.find((c) => c.id === surahId);
        if (!chapter) continue;
        groups.set(surahId, { chapter, verseKeys: [] });
      }
      groups.get(surahId)!.verseKeys.push(bm.verseKey);
    }
    return Array.from(groups.values());
  }, [bookmarks, chapters]);

  // Load verses for each unique surah that has bookmarks
  const uniqueSurahIds = useMemo(
    () => grouped.map((g) => g.chapter.id),
    [grouped],
  );
  const verseQueries = useQueries({
    queries: uniqueSurahIds.map((id) => versesByChapterQueryOptions(id)),
  });

  const verseLookup = useMemo(() => {
    const map = new Map<string, Verse>();
    for (const q of verseQueries) {
      if (q.data) {
        for (const v of q.data.verses) {
          map.set(v.verse_key, v);
        }
      }
    }
    return map;
  }, [verseQueries]);

  const allLoaded = verseQueries.every((q) => q.isSuccess);

  return (
    <div className="mx-auto max-w-[960px] px-5 py-5 sm:px-6 sm:py-10 lg:max-w-[1200px]">
      {/* Header */}
      <h1 className="mb-6 text-xl font-bold text-[var(--theme-text)] sm:text-2xl">
        {t.bookmarksPage.title}
      </h1>

      {/* Empty state */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg
            className="mb-4 h-12 w-12 text-[var(--theme-text-quaternary)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
            />
          </svg>
          <p className="text-[15px] font-medium text-[var(--theme-text-secondary)]">
            {t.bookmarksPage.empty}
          </p>
          <p className="mt-1 text-[13px] text-[var(--theme-text-tertiary)]">
            {t.bookmarksPage.emptyHint}
          </p>
        </div>
      )}

      {/* ===== READING LIST: Surahlar / Cüzler / Sayfalar ===== */}
      {readingListItems.length > 0 && (
        <div className="mb-8 space-y-5">
          {/* Surah bookmarks */}
          {surahItems.length > 0 && (
            <ReadingListSection
              title={t.continueReading.surahLabel}
              items={surahItems}
              chapters={chapters}
              locale={locale}
              t={t}
              removeItem={removeReadingItem}
            />
          )}

          {/* Juz bookmarks */}
          {juzItems.length > 0 && (
            <ReadingListSection
              title={t.continueReading.juzLabel}
              items={juzItems}
              chapters={chapters}
              locale={locale}
              t={t}
              removeItem={removeReadingItem}
            />
          )}

          {/* Page bookmarks */}
          {pageItems.length > 0 && (
            <ReadingListSection
              title={t.continueReading.pageLabel}
              items={pageItems}
              chapters={chapters}
              locale={locale}
              t={t}
              removeItem={removeReadingItem}
            />
          )}
        </div>
      )}

      {/* ===== VERSE BOOKMARKS ===== */}
      {bookmarks.length > 0 && (
        <>
          {/* Section header */}
          {readingListItems.length > 0 && (
            <div className="mb-4 flex items-center gap-2">
              <div className="h-px flex-1 bg-[var(--theme-border)]" />
              <span className="text-[12px] font-medium text-[var(--theme-text-tertiary)]">
                {t.bookmarksPage.verse}
              </span>
              <div className="h-px flex-1 bg-[var(--theme-border)]" />
            </div>
          )}

          <div className="space-y-6">
            {grouped.map(({ chapter, verseKeys }) => (
              <VerseGroup
                key={chapter.id}
                chapter={chapter}
                verseKeys={verseKeys}
                verseLookup={verseLookup}
                allLoaded={allLoaded}
                locale={locale}
                t={t}
                removeBookmark={removeBookmark}
              />
            ))}
          </div>

          <p className="mt-8 text-center text-[12px] text-[var(--theme-text-quaternary)]">
            {interpolate(t.bookmarksPage.verses, { n: bookmarks.length })}
          </p>
        </>
      )}
    </div>
  );
}

/* ─── Reading List Section (Surah / Juz / Page) ─── */

function ReadingListSection({
  title,
  items,
  chapters,
  locale,
  t,
  removeItem,
}: {
  title: string;
  items: ReadingListItem[];
  chapters: Chapter[];
  locale: string;
  t: any;
  removeItem: (type: ReadingListItem["type"], id: number) => void;
}) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-[var(--theme-text-secondary)]">
          {title}
        </h2>
        <span className="text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">
          {items.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <ReadingListRow
            key={`${item.type}-${item.id}`}
            item={item}
            chapters={chapters}
            locale={locale}
            t={t}
            removeItem={removeItem}
          />
        ))}
      </div>
    </section>
  );
}

function ReadingListRow({
  item,
  chapters,
  locale,
  t,
  removeItem,
}: {
  item: ReadingListItem;
  chapters: Chapter[];
  locale: string;
  t: any;
  removeItem: (type: ReadingListItem["type"], id: number) => void;
}) {
  const chapter =
    item.type === "surah"
      ? chapters.find((c) => c.id === item.id)
      : undefined;

  const surahName = chapter
    ? getSurahName(chapter.id, chapter.translated_name.name, locale as any)
    : undefined;

  const label =
    item.type === "surah"
      ? surahName ?? `${t.continueReading.surahLabel} ${item.id}`
      : item.type === "juz"
        ? `${t.continueReading.juzLabel} ${item.id}`
        : `${t.continueReading.pageLabel} ${item.id}`;

  const arabicName = item.type === "surah" ? chapter?.name_arabic : undefined;

  const timeText = item.lastReadAt
    ? formatRelativeTime(item.lastReadAt, t.continueReading)
    : formatRelativeTime(item.addedAt, t.continueReading);

  const to =
    item.type === "surah"
      ? "/$surahId"
      : item.type === "juz"
        ? "/juz/$juzId"
        : "/page/$pageNumber";

  const params =
    item.type === "surah"
      ? { surahId: String(item.id) }
      : item.type === "juz"
        ? { juzId: String(item.id) }
        : { pageNumber: String(item.id) };

  return (
    <div className="group/item flex items-center gap-3 rounded-xl bg-[var(--theme-bg-primary)] px-3.5 py-3 shadow-[var(--shadow-card)] transition-all">
      {/* Number badge */}
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600/10 text-[12px] font-bold tabular-nums text-primary-600">
        {item.id}
      </span>

      {/* Content */}
      <Link
        to={to as "/$surahId"}
        params={params}
        className="min-w-0 flex-1"
      >
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-[var(--theme-text)]">
            {label}
          </span>
          {arabicName && (
            <span
              className="arabic-text text-[15px] leading-none text-[var(--theme-text-tertiary)]"
              dir="rtl"
            >
              {arabicName}
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-[var(--theme-text-tertiary)]">
          {timeText}
        </p>
      </Link>

      {/* Remove */}
      <button
        type="button"
        onClick={() => removeItem(item.type, item.id)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--theme-text-tertiary)] transition-colors hover:bg-red-500/10 hover:text-red-500 sm:opacity-0 sm:group-hover/item:opacity-100"
        aria-label={t.continueReading.remove}
      >
        <svg
          className="h-3 w-3"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M2 2l8 8M10 2l-8 8" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Verse Bookmark Group ─── */

function VerseGroup({
  chapter,
  verseKeys,
  verseLookup,
  allLoaded,
  locale,
  t,
  removeBookmark,
}: {
  chapter: Chapter;
  verseKeys: string[];
  verseLookup: Map<string, Verse>;
  allLoaded: boolean;
  locale: string;
  t: any;
  removeBookmark: (key: string) => void;
}) {
  const surahName = getSurahName(
    chapter.id,
    chapter.translated_name.name,
    locale as any,
  );

  return (
    <section>
      {/* Surah header */}
      <Link
        to="/$surahId"
        params={{ surahId: String(chapter.id) }}
        className="group mb-3 flex items-center gap-2.5"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600/10 text-[11px] font-bold tabular-nums text-primary-600">
          {chapter.id}
        </span>
        <span className="text-[14px] font-semibold text-[var(--theme-text)] transition-colors group-hover:text-primary-600">
          {surahName}
        </span>
        <span
          className="arabic-text text-[15px] leading-none text-[var(--theme-text-tertiary)]"
          dir="rtl"
        >
          {chapter.name_arabic}
        </span>
        <span className="ml-auto text-[11px] tabular-nums text-[var(--theme-text-quaternary)]">
          {verseKeys.length}
        </span>
      </Link>

      {/* Verses */}
      <div className="space-y-1.5">
        {verseKeys.map((verseKey) => {
          const verse = verseLookup.get(verseKey);
          const verseNum = verseKey.split(":")[1];
          const text = verse?.text_uthmani ?? verse?.text_imlaei;

          return (
            <div
              key={verseKey}
              className="group/item flex items-start gap-3 rounded-xl bg-[var(--theme-bg-primary)] px-3.5 py-3 shadow-[var(--shadow-card)] transition-all"
            >
              {/* Verse number */}
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--theme-hover-bg)] text-[10px] font-semibold tabular-nums text-[var(--theme-text-tertiary)]">
                {verseNum}
              </span>

              {/* Content */}
              <div className="min-w-0 flex-1">
                {allLoaded && text ? (
                  <p
                    className="arabic-text text-[1.15rem] leading-[2.2] text-[var(--theme-text)]"
                    dir="rtl"
                  >
                    {text}
                  </p>
                ) : (
                  <Skeleton className="h-8 w-full" />
                )}
              </div>

              {/* Actions */}
              <div className="mt-1 flex shrink-0 items-center gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover/item:opacity-100">
                <Link
                  to="/$surahId"
                  params={{ surahId: String(chapter.id) }}
                  search={{ verse: Number(verseNum) }}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                  title={t.bookmarksPage.goToVerse}
                >
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                    />
                  </svg>
                </Link>
                <button
                  type="button"
                  onClick={() => removeBookmark(verseKey)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--theme-text-tertiary)] transition-colors hover:bg-red-500/10 hover:text-red-500"
                  aria-label={t.quranReader.bookmarkVerseRemove}
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
