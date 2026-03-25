import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

const POPULAR_SURAHS = [
  36,  // Yasin
  67,  // Mülk
  55,  // Rahman
  18,  // Kehf
  56,  // Vakıa
  48,  // Fetih
  112, // İhlas
  2,   // Bakara
  12,  // Yusuf
  32,  // Secde
  78,  // Nebe
  114, // Nas
];

export function QuickAccessSection() {
  const { t, locale } = useTranslation();
  const { data: chapters } = useQuery(chaptersQueryOptions());
  if (!chapters) return null;

  const popular = POPULAR_SURAHS.map((id) => chapters.find((c) => c.id === id)).filter(Boolean);

  return (
    <div className="mb-5">
      <h2 className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--theme-text-tertiary)]">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
        {t.browse.quickAccess}
      </h2>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 scrollbar-none">
        {popular.map((c) => {
          const isMakkah = c!.revelation_place === "makkah";
          const tip = (t.browse.surahTips as Record<number, string>)[c!.id];
          return (
            <Link
              key={c!.id}
              to="/$surahId"
              params={{ surahId: String(c!.id) }}
              className="block w-[156px] shrink-0 snap-start overflow-hidden rounded-2xl bg-[var(--theme-bg-primary)] shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elevated)] active:scale-[0.96] active:shadow-none sm:w-[176px]"
            >
              <div className="px-3.5 pb-3.5 pt-3">
                {/* Top row: number badge + revelation place */}
                <div className="flex items-center justify-between">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--theme-pill-bg)] text-[11px] font-semibold tabular-nums text-[var(--theme-text)]">
                    {c!.id}
                  </span>
                  <span className="text-[10px] font-medium text-[var(--theme-text-quaternary)]">
                    {isMakkah ? t.browse.makkah : t.browse.madinah}
                  </span>
                </div>

                {/* Arabic name */}
                <p className="arabic-text mt-2.5 text-[1.2rem] leading-tight text-[var(--theme-text)]" dir="rtl">
                  {c!.name_arabic}
                </p>

                {/* Latin name */}
                <p className="mt-1 text-[13px] font-medium leading-tight text-[var(--theme-text)]">
                  {getSurahName(c!.id, c!.translated_name.name, locale)}
                </p>

                {/* Tip — why this surah is notable */}
                {tip && (
                  <p className="mt-1.5 text-[10px] leading-tight text-primary-600">
                    {tip}
                  </p>
                )}

                {/* Verse count */}
                <p className="mt-1 text-[11px] text-[var(--theme-text-tertiary)]">
                  {c!.verses_count} {t.browse.versesCount}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
