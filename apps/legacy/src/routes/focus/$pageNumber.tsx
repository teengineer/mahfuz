import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { versesByLayoutPageQueryOptions } from "~/hooks/useVerses";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { FocusLayout } from "~/components/focus/FocusLayout";
import { FocusPageContent } from "~/components/focus/FocusPageContent";
import { AnnotationCanvas } from "~/components/focus/AnnotationCanvas";
import { AnnotationToolbar } from "~/components/focus/AnnotationToolbar";
import { Loading } from "~/components/ui/Loading";
import { useTranslatedVerses } from "~/hooks/useTranslatedVerses";
import { getActiveLayout, getTotalPages } from "~/lib/page-layout";
import { useReadingStats } from "~/stores/useReadingStats";
import { useReadingHistory } from "~/stores/useReadingHistory";

export const Route = createFileRoute("/focus/$pageNumber")({
  validateSearch: (search: Record<string, unknown>) => ({
    from: (search.from as string) || undefined,
    fromId: search.fromId ? Number(search.fromId) : undefined,
  }),
  loader: ({ context, params }) => {
    const pageNum = Number(params.pageNumber);
    const layout = getActiveLayout();
    const totalPages = getTotalPages(layout);
    if (isNaN(pageNum) || pageNum < 1 || pageNum > totalPages) {
      throw new Error(`Invalid page number: ${params.pageNumber}`);
    }
    return Promise.all([
      context.queryClient.ensureQueryData(versesByLayoutPageQueryOptions(pageNum, layout)),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
    ]);
  },
  pendingComponent: () => <Loading text="Yükleniyor..." />,
  head: ({ params }) => ({
    meta: [{ title: `Focus · Sayfa ${params.pageNumber} | Mahfuz` }],
  }),
  component: FocusRoute,
});

function FocusRoute() {
  const { pageNumber } = Route.useParams();
  const { from, fromId } = Route.useSearch();
  const pageNum = Number(pageNumber);
  const layout = getActiveLayout();
  const navigate = useNavigate();

  // Build exit callback based on where user came from
  const handleExit = useCallback(() => {
    if (from === "surah" && fromId) {
      navigate({ to: "/$surahId", params: { surahId: String(fromId) } as any, search: {} as any });
    } else if (from === "juz" && fromId) {
      navigate({ to: "/juz/$juzId", params: { juzId: String(fromId) } as any });
    } else {
      navigate({ to: "/page/$pageNumber", params: { pageNumber: String(pageNum) } });
    }
  }, [from, fromId, pageNum, navigate]);

  // Track page read + reading history
  const markPageRead = useReadingStats((s) => s.markPageRead);
  const visitPage = useReadingHistory((s) => s.visitPage);
  useEffect(() => {
    markPageRead(pageNum);
    visitPage(pageNum);
  }, [pageNum, markPageRead, visitPage]);

  const { data: versesData } = useSuspenseQuery(
    versesByLayoutPageQueryOptions(pageNum, layout),
  );
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());
  const translatedVerses = useTranslatedVerses(versesData.verses);

  return (
    <FocusLayout
      pageNumber={pageNum}
      onExit={handleExit}
      overlay={
        <>
          <AnnotationCanvas pageNumber={pageNum} />
          <AnnotationToolbar pageNumber={pageNum} chapters={chapters} onExit={handleExit} />
        </>
      }
    >
      <FocusPageContent
        pageNumber={pageNum}
        verses={translatedVerses}
        chapters={chapters}
      />
    </FocusLayout>
  );
}
