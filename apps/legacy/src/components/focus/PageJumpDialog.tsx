import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import type { Chapter } from "@mahfuz/shared/types";
import {
  usePageLayout,
  getAllJuzRangesByLayout,
  getJuzForPageByLayout,
} from "~/lib/page-layout";

interface PageJumpDialogProps {
  currentPage: number;
  chapters: Chapter[];
  onSelect: (page: number) => void;
  onClose: () => void;
}

/**
 * Quick page jump dialog with surah list and page grid.
 * Reuses the pattern from the page route's PagePicker.
 */
export function PageJumpDialog({
  currentPage,
  chapters,
  onSelect,
  onClose,
}: PageJumpDialogProps) {
  const [tab, setTab] = useState<"surah" | "page">("page");
  const [search, setSearch] = useState("");
  const currentJuzRef = useRef<HTMLDivElement>(null);

  const layout = usePageLayout();
  const juzRanges = useMemo(() => getAllJuzRangesByLayout(layout), [layout]);
  const currentJuz = getJuzForPageByLayout(currentPage, layout);

  // Auto-scroll to current juz
  useEffect(() => {
    requestAnimationFrame(() => {
      currentJuzRef.current?.scrollIntoView({ block: "center" });
    });
  }, [tab]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Filter surahs
  const filteredChapters = useMemo(() => {
    if (!search.trim()) return chapters;
    const q = search.toLowerCase();
    return chapters.filter(
      (ch) =>
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        String(ch.id).includes(q),
    );
  }, [chapters, search]);

  const handleSurahSelect = useCallback(
    (ch: Chapter) => {
      onSelect(ch.pages[0]);
    },
    [onSelect],
  );

  return (
    <div
      className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto mt-12 flex w-[90%] max-w-[520px] animate-scale-in flex-col overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-modal)]">
        {/* Header with tabs */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-4 py-3">
          <div className="flex gap-2">
            <TabButton
              active={tab === "page"}
              onClick={() => setTab("page")}
              label="Sayfa"
            />
            <TabButton
              active={tab === "surah"}
              onClick={() => setTab("surah")}
              label="Sure"
            />
          </div>
          <button
            onClick={onClose}
            className="text-[13px] font-medium text-primary-600"
          >
            Kapat
          </button>
        </div>

        {/* Search (surah tab only) */}
        {tab === "surah" && (
          <div className="border-b border-[var(--theme-border)] px-4 py-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sure ara..."
              className="w-full rounded-lg bg-[var(--theme-input-bg)] px-3 py-2 text-[14px] text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-quaternary)]"
              autoFocus
            />
          </div>
        )}

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto">
          {tab === "page" && (
            <div className="p-3">
              {juzRanges.map(({ juz, start, end }) => (
                <div
                  key={juz}
                  ref={juz === currentJuz ? currentJuzRef : undefined}
                  className="mb-4 last:mb-0"
                >
                  <p className="sticky top-0 z-10 mb-2 bg-[var(--theme-bg-primary)] py-1 text-[13px] font-semibold text-[var(--theme-text)]">
                    Cüz {juz}
                    <span className="ml-2 text-[12px] font-normal text-[var(--theme-text-tertiary)]">
                      Sayfa {start}–{end}
                    </span>
                  </p>
                  <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8">
                    {Array.from({ length: end - start + 1 }, (_, i) => {
                      const page = start + i;
                      const isCurrent = page === currentPage;
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => onSelect(page)}
                          className={`rounded-lg px-1 py-2 text-[13px] font-semibold tabular-nums transition-all ${
                            isCurrent
                              ? "bg-primary-600 text-white"
                              : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "surah" && (
            <div className="py-1">
              {filteredChapters.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleSurahSelect(ch)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[var(--theme-hover-bg)]"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--theme-pill-bg)] text-[12px] font-semibold tabular-nums text-[var(--theme-text-tertiary)]">
                    {ch.id}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[var(--theme-text)]">
                      {ch.name_simple}
                    </p>
                    <p className="text-[11px] text-[var(--theme-text-tertiary)]">
                      {ch.verses_count} ayet · Sayfa {ch.pages[0]}
                    </p>
                  </div>
                  <span className="arabic-text text-[16px] text-[var(--theme-text-secondary)]">
                    {ch.name_arabic}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-[13px] font-medium transition-all ${
        active
          ? "bg-primary-600 text-white"
          : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
      }`}
    >
      {label}
    </button>
  );
}
