import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import { memorizeWbwByChapterQueryOptions } from "~/hooks/useWbwData";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { mergeWbwIntoVerses } from "~/lib/quran-data";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";
import { useMemorizationStore } from "~/stores/useMemorizationStore";
import type { MemorizeSource, MemorizeSourceType, ModeResult } from "~/stores/useMemorizationStore";
import { useGradeFromMode } from "~/hooks/useMemorization";
import { ImmersiveLayout } from "~/components/memorization/ImmersiveLayout";
import { ImmersiveContent } from "~/components/memorization/ImmersiveContent";
import { Loading } from "~/components/ui/Loading";
import { getSession } from "~/lib/auth-session";

export const Route = createFileRoute("/memorize-immersive/$sourceType/$sourceId")({
  beforeLoad: async ({ location }) => {
    const session = await getSession();
    if (!session) {
      throw new Response("", {
        status: 302,
        headers: { Location: `/auth/login?redirect=${location.pathname}` },
      });
    }
    return { session };
  },
  loader: async ({ context, params }) => {
    const sid = Number(params.sourceId);
    await Promise.all([
      context.queryClient.ensureQueryData(versesByChapterQueryOptions(sid)),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
    ]);
    context.queryClient.prefetchQuery(memorizeWbwByChapterQueryOptions(sid));
  },
  pendingComponent: () => <Loading text="Yükleniyor..." />,
  component: ImmersiveRoute,
});

function ImmersiveRoute() {
  const { sourceType, sourceId } = Route.useParams();
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const navigate = useNavigate();
  const source: MemorizeSource = { type: sourceType as MemorizeSourceType, id: Number(sourceId) };
  const { locale } = useTranslation();

  const { data: chaptersData } = useSuspenseQuery(chaptersQueryOptions());
  const chapter = chaptersData.find((c) => c.id === source.id);

  const { data: versesData } = useSuspenseQuery(versesByChapterQueryOptions(source.id));
  const { data: wbwData } = useQuery(memorizeWbwByChapterQueryOptions(source.id));
  const verses = mergeWbwIntoVerses(versesData.verses, wbwData);

  const currentVerseIndex = useMemorizationStore((s) => s.currentVerseIndex);
  const startMode = useMemorizationStore((s) => s.startMode);
  const setCurrentVerse = useMemorizationStore((s) => s.setCurrentVerse);
  const finishMode = useMemorizationStore((s) => s.finishMode);
  const resetSession = useMemorizationStore((s) => s.resetSession);

  const { gradeMode } = useGradeFromMode(userId);

  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current && verses.length > 0) {
      startedRef.current = true;
      startMode("immersive", source, verses.length);
    }
  }, [source, verses.length, startMode]);

  const handleClose = useCallback(() => {
    resetSession();
    navigate({ to: "/memorize/session/$sourceType/$sourceId", params: { sourceType: source.type, sourceId: String(source.id) } });
  }, [resetSession, navigate, source]);

  const handleVerseChange = useCallback((idx: number) => { setCurrentVerse(idx); }, [setCurrentVerse]);

  const handleComplete = useCallback(async (result: ModeResult) => {
    finishMode(result);
    await gradeMode(result);
    resetSession();
    navigate({ to: "/memorize/session/$sourceType/$sourceId", params: { sourceType: source.type, sourceId: String(source.id) } });
  }, [finishMode, gradeMode, resetSession, navigate, source]);

  return (
    <ImmersiveLayout
      onClose={handleClose}
      verseCounter={`${currentVerseIndex + 1} / ${verses.length} · ${chapter ? getSurahName(chapter.id, chapter.translated_name.name, locale) : ""}`}
    >
      <ImmersiveContent source={source} verses={verses} onVerseChange={handleVerseChange} onComplete={handleComplete} />
    </ImmersiveLayout>
  );
}
