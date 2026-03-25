import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { EXPANDED_TOPIC_INDEX } from "~/data/topic-index-expanded";
import { EmojiIcon } from "~/components/icons/EmojiIcon";
import type { TopicEntry, TopicCategory } from "~/data/topic-index-expanded";
import { useTranslation } from "~/hooks/useTranslation";
import { interpolate } from "~/lib/i18n-utils";
import type { Chapter } from "@mahfuz/shared/types";

function getCategoryLabel(cat: TopicCategory, locale: string) {
  if (locale === "en") return cat.labelEn;
  if (locale === "es") return cat.labelEs;
  if (locale === "fr") return cat.labelFr;
  if (locale === "ar") return cat.labelAr;
  return cat.label;
}

function getTopicName(entry: TopicEntry, locale: string) {
  if (locale === "en") return entry.topicEn;
  if (locale === "es") return entry.topicEs;
  if (locale === "fr") return entry.topicFr;
  if (locale === "ar") return entry.topicAr;
  return entry.topic;
}

export function FihristPanel({ initialTopic }: { initialTopic?: string }) {
  const { t, locale } = useTranslation();
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  const [search, setSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string | null>(() => {
    if (!initialTopic) return null;
    return initialTopic.split(":")[0] || null;
  });
  const [openTopic, setOpenTopic] = useState<string | null>(initialTopic ?? null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return EXPANDED_TOPIC_INDEX;
    return EXPANDED_TOPIC_INDEX.map((cat) => ({
      ...cat,
      topics: cat.topics.filter(
        (entry) =>
          entry.topic.toLowerCase().includes(q) ||
          entry.topicEn.toLowerCase().includes(q) ||
          entry.topicFr.toLowerCase().includes(q) ||
          entry.topicAr.includes(q),
      ),
    })).filter((cat) => cat.topics.length > 0);
  }, [search]);

  const totalTopics = useMemo(
    () => EXPANDED_TOPIC_INDEX.reduce((sum, cat) => sum + cat.topics.length, 0),
    [],
  );

  const isSearching = search.trim().length > 0;

  const toggleCategory = useCallback(
    (id: string) => {
      if (isSearching) return;
      setOpenCategory((prev) => (prev === id ? null : id));
      setOpenTopic(null);
    },
    [isSearching],
  );

  return (
    <div>
      {/* Search */}
      <div className="relative mb-3">
        <svg
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-tertiary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpenTopic(null);
          }}
          placeholder={t.browse.searchTopics}
          className="w-full rounded-xl bg-[var(--theme-input-bg)] py-2.5 pl-10 pr-4 text-[15px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none transition-colors focus:bg-[var(--theme-bg-primary)] focus:shadow-[var(--shadow-elevated)]"
        />
      </div>

      {/* Stats */}
      <p className="mb-4 text-[12px] text-[var(--theme-text-tertiary)]">
        {isSearching
          ? interpolate(t.browse.resultCount, { count: filtered.reduce((s, c) => s + c.topics.length, 0) })
          : interpolate(t.browse.categoryStats, { categories: EXPANDED_TOPIC_INDEX.length, topics: totalTopics })}
      </p>

      {/* Accordion */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[15px] text-[var(--theme-text-secondary)]">
            {t.common.noResults}
          </p>
          <p className="mt-1 text-[13px] text-[var(--theme-text-tertiary)]">
            {t.browse.noResultsHint}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)]">
          {filtered.map((category, idx) => {
            const isOpen = isSearching || openCategory === category.id;
            const isLast = idx === filtered.length - 1;
            return (
              <AccordionItem
                key={category.id}
                category={category}
                isOpen={isOpen}
                isLast={isLast}
                onToggle={() => toggleCategory(category.id)}
                openTopic={openTopic}
                onSelectTopic={setOpenTopic}
                chapters={chapters}
                isSearching={isSearching}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Accordion Item ── */

function AccordionItem({
  category,
  isOpen,
  isLast,
  onToggle,
  openTopic,
  onSelectTopic,
  chapters,
  isSearching,
}: {
  category: TopicCategory;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
  openTopic: string | null;
  onSelectTopic: (key: string | null) => void;
  chapters: Chapter[];
  isSearching: boolean;
}) {
  const { t, locale } = useTranslation();

  return (
    <div className={isLast ? "" : "border-b border-[var(--theme-border)]"}>
      {/* Trigger */}
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${
          isSearching
            ? "cursor-default"
            : "hover:bg-[var(--theme-hover-bg)]"
        }`}
      >
        <EmojiIcon emoji={category.icon} className="h-[18px] w-[18px]" />
        <span className="flex-1 text-[14px] font-medium text-[var(--theme-text)]">
          {getCategoryLabel(category, locale)}
        </span>
        <span className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]">
          {category.topics.length}
        </span>
        {!isSearching && (
          <svg
            className={`h-4 w-4 shrink-0 text-[var(--theme-text-tertiary)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>

      {/* Content — animated with grid-template-rows */}
      <div
        className="accordion-grid"
        data-open={isOpen}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4">
            <TopicGrid
              categoryId={category.id}
              topics={category.topics}
              openTopic={openTopic}
              onSelectTopic={onSelectTopic}
              chapters={chapters}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Topic Grid with inline detail ── */

function TopicGrid({
  categoryId,
  topics,
  openTopic,
  onSelectTopic,
  chapters,
}: {
  categoryId: string;
  topics: TopicEntry[];
  openTopic: string | null;
  onSelectTopic: (key: string | null) => void;
  chapters: Chapter[];
}) {
  const { t, locale } = useTranslation();
  const gridRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(3);

  const detectCols = useCallback(() => {
    const el = gridRef.current;
    if (!el) return;
    const style = getComputedStyle(el);
    const c = style.gridTemplateColumns.split(" ").length;
    if (c !== cols) setCols(c);
  }, [cols]);

  useEffect(() => {
    detectCols();
    const el = gridRef.current;
    if (!el) return;
    const ro = new ResizeObserver(detectCols);
    ro.observe(el);
    return () => ro.disconnect();
  }, [detectCols]);

  useEffect(() => {
    if (openTopic?.startsWith(`${categoryId}:`) && detailRef.current) {
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }, [openTopic, categoryId]);

  const openIdx = openTopic?.startsWith(`${categoryId}:`)
    ? Number(openTopic.split(":")[1])
    : -1;

  const activeRow = openIdx >= 0 ? Math.floor(openIdx / cols) : -1;
  const insertAfterIndex =
    activeRow >= 0 ? Math.min((activeRow + 1) * cols - 1, topics.length - 1) : -1;

  const elements: React.ReactNode[] = [];
  topics.forEach((entry, i) => {
    const key = `${categoryId}:${i}`;
    const isOpen = openIdx === i;

    elements.push(
      <button
        key={`card-${key}`}
        type="button"
        onClick={() => onSelectTopic(isOpen ? null : key)}
        className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl transition-all ${
          isOpen
            ? "bg-primary-600/10 ring-1 ring-primary-600/20"
            : "bg-[var(--theme-hover-bg)] hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
        }`}
      >
        <EmojiIcon emoji={entry.icon} className="h-5 w-5" />
        <span
          className={`max-w-full px-1 text-center text-[10px] font-medium leading-tight ${
            isOpen ? "text-primary-700" : "text-[var(--theme-text-secondary)]"
          }`}
        >
          {getTopicName(entry, locale)}
        </span>
      </button>,
    );

    if (i === insertAfterIndex && openIdx >= 0) {
      const topic = topics[openIdx];
      elements.push(
        <div
          key={`detail-${categoryId}`}
          ref={detailRef}
          className="relative col-span-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-secondary)] p-3"
          style={{ gridColumn: "1 / -1" }}
        >
          {/* Arrow */}
          <div
            className="absolute -top-[7px] h-0 w-0 border-x-[7px] border-b-[7px] border-x-transparent border-b-[var(--theme-border)]"
            style={{
              left: `calc(${((openIdx % cols) / cols) * 100}% + ${100 / cols / 2}%)`,
              transform: "translateX(-50%)",
            }}
          />
          <div
            className="absolute -top-[5px] h-0 w-0 border-x-[6px] border-b-[6px] border-x-transparent border-b-[var(--theme-bg-secondary)]"
            style={{
              left: `calc(${((openIdx % cols) / cols) * 100}% + ${100 / cols / 2}%)`,
              transform: "translateX(-50%)",
            }}
          />
          {/* Header */}
          <div className="mb-2.5 flex items-center gap-2">
            <EmojiIcon emoji={topic.icon} className="h-[18px] w-[18px]" />
            <div className="flex-1">
              <h3 className="text-[13px] font-semibold text-[var(--theme-text)]">
                {getTopicName(topic, locale)}
              </h3>
              <span className="text-[11px] text-[var(--theme-text-quaternary)]">
                {topic.refs.length} {t.browse.reference}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectTopic(null)}
              className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.common.close}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Refs */}
          <div className="flex flex-wrap gap-1.5">
            {topic.refs.map((ref) => {
              const [surah, verseRange] = ref.split(":");
              const firstVerse = verseRange?.split("-")[0];
              const ch = chapters.find((c) => c.id === Number(surah));
              return (
                <Link
                  key={ref}
                  to="/$surahId"
                  params={{ surahId: surah }}
                  search={{
                    topic: `${categoryId}:${openIdx}`,
                    verse: firstVerse ? Number(firstVerse) : undefined,
                  }}
                  className="group flex items-center gap-1.5 rounded-lg bg-[var(--theme-bg-primary)] px-2.5 py-1.5 text-[11px] transition-colors hover:bg-primary-600/10"
                >
                  <span className="font-semibold tabular-nums text-primary-700">
                    {ref}
                  </span>
                  {ch && (
                    <span className="text-[var(--theme-text-tertiary)] group-hover:text-primary-600">
                      {ch.name_simple}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>,
      );
    }
  });

  return (
    <div ref={gridRef} className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
      {elements}
    </div>
  );
}
