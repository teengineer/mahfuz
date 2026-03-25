import { Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { juzListQueryOptions } from "~/hooks/useJuz";
import { useTranslation } from "~/hooks/useTranslation";

export function JuzListPanel() {
  const { t } = useTranslation();
  const { data: juzs } = useSuspenseQuery(juzListQueryOptions());

  // Deduplicate by juz_number (API may return duplicates)
  const uniqueJuzs = Array.from(
    new Map(juzs.map((j) => [j.juz_number, j])).values()
  ).sort((a, b) => a.juz_number - b.juz_number);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {uniqueJuzs.map((juz) => {
        const surahIds = Object.keys(juz.verse_mapping);
        return (
          <Link
            key={juz.juz_number}
            to="/juz/$juzId"
            params={{ juzId: String(juz.juz_number) }}
            className="flex flex-col items-center rounded-2xl bg-[var(--theme-bg-primary)] p-4 transition-all hover:shadow-[var(--shadow-elevated)] active:scale-[0.97]"
          >
            <span className="mb-1 text-[22px] font-semibold tabular-nums text-[var(--theme-text)]">
              {juz.juz_number}
            </span>
            <span className="text-[11px] text-[var(--theme-text-tertiary)]">
              {juz.verses_count} {t.browse.versesCount}
            </span>
            <span className="mt-0.5 text-[10px] text-[var(--theme-text-quaternary)]">
              {t.common.surah} {surahIds[0]}
              {surahIds.length > 1 && `–${surahIds[surahIds.length - 1]}`}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
