import { memo } from "react";
import { Link } from "@tanstack/react-router";
import type { Chapter } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

interface ChapterCardProps {
  chapter: Chapter;
  isFavorite?: boolean;
  isLastRead?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

export const ChapterCard = memo(function ChapterCard({ chapter, isFavorite, isLastRead, onToggleFavorite }: ChapterCardProps) {
  const { t, locale } = useTranslation();
  const isMakkah = chapter.revelation_place === "makkah";
  const surahName = getSurahName(chapter.id, chapter.translated_name.name, locale);

  return (
    <Link
      to="/$surahId"
      params={{ surahId: String(chapter.id) }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] p-4 transition-all hover:shadow-[var(--shadow-elevated)] active:scale-[0.98]"
    >
      {/* Background illustration, pinned to bottom-right as subtle watermark */}
      <img
        src={isMakkah ? "/images/kaaba.png" : "/images/nabawi.png"}
        alt=""
        aria-hidden="true"
        draggable={false}
        width={90}
        height={90}
        className="chapter-watermark pointer-events-none absolute -bottom-3 -right-3 h-[90px] w-[90px] object-contain transition-opacity duration-300"
      />

      {/* Top: number + arabic */}
      <div className="relative mb-4 flex items-start justify-between gap-2">
        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--theme-pill-bg)] text-[12px] font-semibold tabular-nums text-[var(--theme-text)]">
          {chapter.id}
        </span>
        <span className="relative flex-shrink-0">
          <span
            className="pointer-events-none absolute inset-0 scale-[2.5] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            style={{ background: `radial-gradient(circle, var(--theme-surah-header-glow) 0%, transparent 70%)` }}
            aria-hidden="true"
          />
          <span
            className="arabic-text relative text-[22px] leading-none text-[var(--theme-text-secondary)]"
            dir="rtl"
          >
            {chapter.name_arabic}
          </span>
        </span>
      </div>

      {/* Favorite star */}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(e); }}
            className="absolute top-3 right-3 z-10 flex h-6 w-6 items-center justify-center rounded-full transition-all hover:bg-[var(--theme-hover-bg)]"
            aria-label={isFavorite ? "Remove favorite" : "Add favorite"}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill={isFavorite ? "var(--color-primary-600)" : "none"} stroke={isFavorite ? "var(--color-primary-600)" : "var(--theme-text-quaternary)"} strokeWidth={2}>
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </button>
        )}

        {/* Last read badge */}
        {isLastRead && (
          <span className="absolute top-3 left-3 z-10 h-2 w-2 rounded-full bg-green-500" title="Son okunan" />
        )}

        {/* Bottom: names + meta */}
      <div className="relative">
        <h3 className="truncate text-[14px] font-semibold leading-snug text-[var(--theme-text)]">
          {surahName}
        </h3>
        <p className="mt-0.5 truncate text-[11px] leading-normal text-[var(--theme-text-tertiary)]">
          {chapter.name_simple}
        </p>
      </div>
    </Link>
  );
});
