import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { ModePicker } from "~/components/memorization/ModePicker";
import { Loading } from "~/components/ui/Loading";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";
import type { MemorizeSourceType, MemorizeSource } from "~/stores/useMemorizationStore";

interface SessionSearch {
  practice?: boolean;
}

export const Route = createFileRoute("/_app/_protected/memorize/session/$sourceType/$sourceId")({
  validateSearch: (search: Record<string, unknown>): SessionSearch => ({
    practice: search.practice === true || search.practice === "true",
  }),
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(chaptersQueryOptions());
  },
  pendingComponent: () => <Loading text="Yükleniyor..." />,
  head: ({ params }) => ({
    meta: [{ title: `Ezberleme · ${params.sourceType === "surah" ? "Sûre" : params.sourceType === "page" ? "Sayfa" : "Cüz"} ${params.sourceId} | Mahfuz` }],
  }),
  component: SessionRoute,
});

function SessionRoute() {
  const { sourceType, sourceId } = Route.useParams();
  const { practice } = Route.useSearch();
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const source: MemorizeSource = { type: sourceType as MemorizeSourceType, id: Number(sourceId) };
  const { locale } = useTranslation();

  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  if (source.type === "surah") {
    const chapter = chapters.find((c) => c.id === source.id);
    if (!chapter) {
      return (
        <div className="flex h-64 items-center justify-center">
          <p className="text-[var(--theme-text-tertiary)]">Sûre bulunamadı</p>
        </div>
      );
    }
    return (
      <ModePicker
        source={source}
        surahName={getSurahName(chapter.id, chapter.translated_name.name, locale)}
        versesCount={chapter.verses_count}
        userId={userId}
        practice={practice}
      />
    );
  }

  // Page/Juz: use source label, versesCount from data
  const label = source.type === "page" ? `Sayfa ${source.id}` : `Cüz ${source.id}`;
  return (
    <ModePicker
      source={source}
      surahName={label}
      versesCount={0}
      userId={userId}
      practice={practice}
    />
  );
}
