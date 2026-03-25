import { useState, useRef, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { EXPANDED_TOPIC_INDEX } from "~/data/topic-index-expanded";
import type { TopicEntry, TopicCategory } from "~/data/topic-index-expanded";
import { EmojiIcon } from "~/components/icons/EmojiIcon";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { useTranslation } from "~/hooks/useTranslation";
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

export function TopicBand() {
  const { t, locale } = useTranslation();
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [openTopicKey, setOpenTopicKey] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const openCategory = EXPANDED_TOPIC_INDEX.find((c) => c.id === openCategoryId) ?? null;

  const toggle = useCallback((id: string) => {
    setOpenCategoryId((prev) => {
      if (prev === id) return null;
      setOpenTopicKey(null);
      return id;
    });
  }, []);

  // Scroll expanded content into view
  useEffect(() => {
    if (openCategoryId && contentRef.current) {
      requestAnimationFrame(() => {
        contentRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }, [openCategoryId]);

  return (
    <div className="mb-5">
      <h2 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--theme-text-tertiary)]">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
        {t.browse.topics}
      </h2>

      {/* Horizontal scrollable category chips */}
      <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1 scrollbar-none">
        {EXPANDED_TOPIC_INDEX.map((cat) => {
          const isActive = openCategoryId === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => toggle(cat.id)}
              className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium transition-all active:scale-[0.97] ${
                isActive
                  ? "bg-primary-600 text-white shadow-sm"
                  : "border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] text-[var(--theme-text)] hover:bg-[var(--theme-hover-bg)]"
              }`}
            >
              <EmojiIcon emoji={cat.icon} className="h-3.5 w-3.5" />
              {getCategoryLabel(cat, locale)}
            </button>
          );
        })}
      </div>

      {/* Expanded category content — inline below chips */}
      {openCategory && (
        <div
          ref={contentRef}
          className="mt-3 overflow-hidden rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-3"
        >
          {/* Category header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <EmojiIcon emoji={openCategory.icon} className="h-[18px] w-[18px]" />
              <h3 className="text-[14px] font-semibold text-[var(--theme-text)]">
                {getCategoryLabel(openCategory, locale)}
              </h3>
              <span className="text-[11px] text-[var(--theme-text-quaternary)]">
                {openCategory.topics.length} {t.browse.topicCount}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpenCategoryId(null)}
              className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.common.close}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Topic grid */}
          <TopicGrid
            category={openCategory}
            openTopicKey={openTopicKey}
            onSelectTopic={setOpenTopicKey}
            chapters={chapters}
          />
        </div>
      )}
    </div>
  );
}

/* ── Topic Grid with inline verse refs ── */

function TopicGrid({
  category,
  openTopicKey,
  onSelectTopic,
  chapters,
}: {
  category: TopicCategory;
  openTopicKey: string | null;
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
    if (openTopicKey && detailRef.current) {
      requestAnimationFrame(() => {
        detailRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    }
  }, [openTopicKey]);

  const openIdx = openTopicKey !== null ? Number(openTopicKey) : -1;
  const activeRow = openIdx >= 0 ? Math.floor(openIdx / cols) : -1;
  const insertAfterIndex =
    activeRow >= 0 ? Math.min((activeRow + 1) * cols - 1, category.topics.length - 1) : -1;

  const elements: React.ReactNode[] = [];
  category.topics.forEach((entry, i) => {
    const isOpen = openIdx === i;

    elements.push(
      <button
        key={`topic-${i}`}
        type="button"
        onClick={() => onSelectTopic(isOpen ? null : String(i))}
        className={`flex flex-col items-center justify-center gap-1 rounded-xl px-1 py-2.5 transition-all ${
          isOpen
            ? "bg-primary-600/10 ring-1 ring-primary-600/20"
            : "bg-[var(--theme-hover-bg)] hover:bg-[var(--theme-pill-bg)] active:scale-[0.97]"
        }`}
      >
        <EmojiIcon emoji={entry.icon} className="h-[18px] w-[18px]" />
        <span
          className={`max-w-full px-0.5 text-center text-[10px] font-medium leading-tight ${
            isOpen ? "text-primary-700" : "text-[var(--theme-text-secondary)]"
          }`}
        >
          {getTopicName(entry, locale)}
        </span>
      </button>,
    );

    if (i === insertAfterIndex && openIdx >= 0) {
      const topic = category.topics[openIdx];
      elements.push(
        <div
          key="detail"
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
    <div ref={gridRef} className="grid grid-cols-4 gap-1.5 sm:grid-cols-5 md:grid-cols-6">
      {elements}
    </div>
  );
}
