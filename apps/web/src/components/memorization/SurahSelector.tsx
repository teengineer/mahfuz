import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import type { MemorizationCardEntry } from "@mahfuz/db";
import { useState, useEffect, useMemo } from "react";
import { memorizationRepository } from "@mahfuz/db";
import type { ConfidenceLevel } from "@mahfuz/shared/types";

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  struggling: "bg-red-500",
  learning: "bg-orange-400",
  familiar: "bg-yellow-400",
  confident: "bg-blue-500",
  mastered: "bg-emerald-500",
};

interface SurahSelectorProps {
  userId: string;
}

interface SurahProgress {
  total: number;
  byConfidence: Partial<Record<ConfidenceLevel, number>>;
}

export function SurahSelector({ userId }: SurahSelectorProps) {
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const [search, setSearch] = useState("");

  const [progress, setProgress] = useState<Map<number, SurahProgress>>(
    new Map(),
  );

  useEffect(() => {
    async function loadProgress() {
      const allCards = await memorizationRepository.getAllCards(userId);
      const map = new Map<number, SurahProgress>();

      for (const card of allCards) {
        const surahId = parseInt(card.verseKey.split(":")[0]);
        let p = map.get(surahId);
        if (!p) {
          p = { total: 0, byConfidence: {} };
          map.set(surahId, p);
        }
        p.total++;
        p.byConfidence[card.confidence] =
          (p.byConfidence[card.confidence] || 0) + 1;
      }

      setProgress(map);
    }
    loadProgress();
  }, [userId]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return chapters;
    return chapters.filter(
      (ch) =>
        ch.name_simple.toLowerCase().includes(q) ||
        ch.name_arabic.includes(q) ||
        String(ch.id).startsWith(q),
    );
  }, [chapters, search]);

  const addedChapters = useMemo(() => {
    return chapters.filter((ch) => {
      const p = progress.get(ch.id);
      return p && p.total > 0;
    });
  }, [chapters, progress]);

  const renderRow = (ch: (typeof chapters)[number], highlighted: boolean) => {
    const p = progress.get(ch.id);
    return (
      <div
        key={highlighted ? `added-${ch.id}` : ch.id}
        className="flex items-center gap-3 px-6 py-3 transition-colors hover:bg-[var(--theme-hover-bg)]"
      >
        <span
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums ${
            highlighted
              ? "bg-primary-50 text-primary-700"
              : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)]"
          }`}
        >
          {ch.id}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-medium text-[var(--theme-text)]">
              {ch.name_simple}
            </span>
            <span className="text-[13px] text-[var(--theme-text-tertiary)]">
              {ch.name_arabic}
            </span>
          </div>
          {p && p.total > 0 && (
            <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
              {(Object.keys(CONFIDENCE_COLORS) as ConfidenceLevel[]).map(
                (level) => {
                  const count = p.byConfidence[level] || 0;
                  const pct = (count / ch.verses_count) * 100;
                  if (pct === 0) return null;
                  return (
                    <div
                      key={level}
                      className={`${CONFIDENCE_COLORS[level]}`}
                      style={{ width: `${pct}%` }}
                    />
                  );
                },
              )}
            </div>
          )}
        </div>
        <span className="text-[12px] tabular-nums text-[var(--theme-text-quaternary)]">
          {p?.total || 0}/{ch.verses_count}
        </span>
        <div className="flex gap-1.5">
          <Link
            to="/memorize/progress/$surahId"
            params={{ surahId: String(ch.id) }}
            className="rounded-lg px-2.5 py-1 text-[12px] font-medium text-primary-600 transition-colors hover:bg-primary-50"
          >
            İlerleme
          </Link>
          <Link
            to="/memorize/add/$surahId"
            params={{ surahId: String(ch.id) }}
            className="rounded-lg px-2.5 py-1 text-[12px] font-medium text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
          >
            Ekle
          </Link>
        </div>
      </div>
    );
  };

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)]">
      <div className="border-b border-[var(--theme-divider)] px-6 py-4">
        <h2 className="mb-3 text-base font-semibold text-[var(--theme-text)]">
          Sureler
        </h2>
        {/* Search */}
        <div className="relative">
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Sûre ara..."
            className="w-full rounded-xl bg-[var(--theme-input-bg)] py-2.5 pl-10 pr-4 text-[15px] text-[var(--theme-text)] placeholder-[var(--theme-text-tertiary)] outline-none transition-colors focus:bg-[var(--theme-bg-primary)] focus:shadow-[var(--shadow-elevated)]"
          />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-[15px] text-[var(--theme-text-secondary)]">
            Sûre bulunamadı
          </p>
          <p className="mt-1 text-[13px] text-[var(--theme-text-tertiary)]">
            Farklı bir arama terimi deneyin
          </p>
        </div>
      ) : (
      <div className="divide-y divide-[var(--theme-divider)]">
        {search === "" && addedChapters.length > 0 && (
          <>
            <div className="border-b border-[var(--theme-divider)] bg-[var(--theme-hover-bg)] px-6 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                Eklenen Sureler ({addedChapters.length})
              </span>
            </div>
            {addedChapters.map((ch) => renderRow(ch, true))}
            <div className="border-b border-[var(--theme-divider)] bg-[var(--theme-hover-bg)] px-6 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                Tüm Sureler
              </span>
            </div>
          </>
        )}
        {(search === "" ? chapters : filtered).map((ch) => renderRow(ch, false))}
      </div>
      )}
    </div>
  );
}
