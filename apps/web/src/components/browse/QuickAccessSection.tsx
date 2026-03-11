import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

const POPULAR_SURAHS = [36, 67, 55, 1, 18, 56];

export function QuickAccessSection() {
  const { t, locale } = useTranslation();
  const { data: chapters } = useQuery(chaptersQueryOptions());
  if (!chapters) return null;

  const popular = POPULAR_SURAHS.map((id) => chapters.find((c) => c.id === id)).filter(Boolean);

  return (
    <div className="mb-5">
      <h2 className="mb-2.5 text-[13px] font-semibold text-[var(--theme-text-tertiary)]">{t.browse.quickAccess}</h2>
      <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {popular.map((c) => (
          <Link
            key={c!.id}
            to="/surah/$surahId"
            params={{ surahId: String(c!.id) }}
            className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-3 py-2 transition-all hover:shadow-[var(--shadow-card)] active:scale-[0.97]"
          >
            <span className="arabic-text text-[14px] text-[var(--theme-text-tertiary)]">{c!.name_arabic}</span>
            <div>
              <span className="block text-[12px] font-medium text-[var(--theme-text)]">{getSurahName(c!.id, c!.translated_name.name, locale)}</span>
              <span className="block text-[10px] text-[var(--theme-text-quaternary)]">{c!.verses_count} {t.browse.versesCount}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
