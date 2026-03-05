import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { juzListQueryOptions } from "~/hooks/useJuz";
import { Loading } from "~/components/ui/Loading";

export const Route = createFileRoute("/_app/juz/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(juzListQueryOptions()),
  pendingComponent: () => <Loading text="Cüzler yükleniyor..." />,
  component: JuzList,
});

function JuzList() {
  const { data: juzs } = useSuspenseQuery(juzListQueryOptions());

  // Deduplicate by juz_number (API may return duplicates)
  const uniqueJuzs = Array.from(
    new Map(juzs.map((j) => [j.juz_number, j])).values()
  ).sort((a, b) => a.juz_number - b.juz_number);

  return (
    <div className="mx-auto max-w-[680px] px-5 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 text-[28px] font-semibold tracking-[-0.02em] text-[var(--theme-text)]">
        Cüzler
      </h1>

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
                {juz.verses_count} ayet
              </span>
              <span className="mt-0.5 text-[10px] text-[var(--theme-text-quaternary)]">
                Sure {surahIds[0]}
                {surahIds.length > 1 && `–${surahIds[surahIds.length - 1]}`}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
