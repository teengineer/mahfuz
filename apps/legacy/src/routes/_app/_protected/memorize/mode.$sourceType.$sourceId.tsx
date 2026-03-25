import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { versesByChapterQueryOptions, versesByLayoutPageQueryOptions } from "~/hooks/useVerses";
import { memorizeWbwByChapterQueryOptions } from "~/hooks/useWbwData";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { mergeWbwIntoVerses } from "~/lib/quran-data";
import { getActiveLayout } from "~/lib/page-layout";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";
import type { ChapterAudioData } from "@mahfuz/audio-engine";
import { useAudioStore } from "~/stores/useAudioStore";
import { useMemorizationStore } from "~/stores/useMemorizationStore";
import type { MemorizeMode, MemorizeSource, MemorizeSourceType, ModeResult } from "~/stores/useMemorizationStore";
import { useGradeFromMode } from "~/hooks/useMemorization";
import { ModeLayout } from "~/components/memorization/ModeLayout";
import { LearnMode } from "~/components/memorization/LearnMode";
import { ListenMode } from "~/components/memorization/ListenMode";
import { TestMode } from "~/components/memorization/TestMode";
import { TypeMode } from "~/components/memorization/TypeMode";
import { SessionResults } from "~/components/memorization/SessionResults";
import { VerseRangeSelector } from "~/components/memorization/VerseRangeSelector";
import { Loading } from "~/components/ui/Loading";
import type { Verse } from "@mahfuz/shared/types";

interface ModeSearch {
  mode: MemorizeMode;
  practice?: boolean;
}

export const Route = createFileRoute("/_app/_protected/memorize/mode/$sourceType/$sourceId")({
  validateSearch: (search: Record<string, unknown>): ModeSearch => ({
    mode: (search.mode as MemorizeMode) || "learn",
    practice: search.practice === true || search.practice === "true",
  }),
  loader: async ({ context, params }) => {
    const id = Number(params.sourceId);
    if (params.sourceType === "surah") {
      await Promise.all([
        context.queryClient.ensureQueryData(versesByChapterQueryOptions(id)),
        context.queryClient.ensureQueryData(chaptersQueryOptions()),
        context.queryClient.ensureQueryData(memorizeWbwByChapterQueryOptions(id)),
      ]);
    } else {
      const layout = getActiveLayout();
      await Promise.all([
        context.queryClient.ensureQueryData(versesByLayoutPageQueryOptions(id, layout)),
        context.queryClient.ensureQueryData(chaptersQueryOptions()),
      ]);
    }
  },
  pendingComponent: () => <Loading text="Yükleniyor..." />,
  component: () => (
    <Suspense fallback={<Loading text="Yükleniyor..." />}>
      <ModeRoute />
    </Suspense>
  ),
});

function ModeRoute() {
  const { sourceType, sourceId } = Route.useParams();
  const { mode, practice } = Route.useSearch();
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const navigate = useNavigate();
  const source: MemorizeSource = { type: sourceType as MemorizeSourceType, id: Number(sourceId) };
  const reciterId = useAudioStore((s) => s.reciterId);

  const { locale } = useTranslation();
  const { data: chaptersData } = useSuspenseQuery(chaptersQueryOptions());

  // Load verses based on source type
  let verses: Verse[] = [];
  let sourceLabel = "";
  let audioSurahId: number | null = null;

  if (source.type === "surah") {
    const chapter = chaptersData.find((c) => c.id === source.id);
    sourceLabel = chapter ? getSurahName(chapter.id, chapter.translated_name.name, locale) : `Sûre ${source.id}`;
    audioSurahId = source.id;
    const { data: versesData } = useSuspenseQuery(versesByChapterQueryOptions(source.id));
    const { data: wbwData } = useQuery(memorizeWbwByChapterQueryOptions(source.id));
    verses = mergeWbwIntoVerses(versesData.verses, wbwData);
  } else {
    sourceLabel = source.type === "page" ? `Sayfa ${source.id}` : `Cüz ${source.id}`;
    const layout = getActiveLayout();
    const { data: versesData } = useSuspenseQuery(versesByLayoutPageQueryOptions(source.id, layout));
    verses = versesData.verses;
    // For audio, use first surah on page
    if (verses.length > 0) {
      audioSurahId = Number(verses[0].verse_key.split(":")[0]);
    }
  }

  // Audio data
  const { data: rawAudioData } = useQuery({
    ...chapterAudioQueryOptions(reciterId, audioSurahId ?? 1),
    enabled: !!audioSurahId,
  });
  const audioData: ChapterAudioData | null = rawAudioData
    ? {
        audioUrl: rawAudioData.audio_url,
        verseTimings: rawAudioData.verse_timings.map((t) => ({
          verseKey: t.verse_key,
          from: t.timestamp_from,
          to: t.timestamp_to,
          segments: t.segments,
        })),
      }
    : null;

  // Verse range selection
  const [selectedRange, setSelectedRange] = useState<{ from: number; to: number } | null>(() => {
    if (verses?.length && verses.length <= 10) return { from: 1, to: verses.length };
    return null;
  });

  const phase = useMemorizationStore((s) => s.phase);
  const currentVerseIndex = useMemorizationStore((s) => s.currentVerseIndex);
  const lastModeResult = useMemorizationStore((s) => s.lastModeResult);
  const startMode = useMemorizationStore((s) => s.startMode);
  const setCurrentVerse = useMemorizationStore((s) => s.setCurrentVerse);
  const finishMode = useMemorizationStore((s) => s.finishMode);
  const resetSession = useMemorizationStore((s) => s.resetSession);

  const { gradeMode } = useGradeFromMode(userId);

  const selectedVerses = selectedRange && verses?.length
    ? verses.slice(selectedRange.from - 1, selectedRange.to)
    : verses ?? [];
  const selectedAudioData = selectedRange && audioData?.verseTimings
    ? { ...audioData, verseTimings: audioData.verseTimings.slice(selectedRange.from - 1, selectedRange.to) }
    : audioData ?? null;

  const startedRef = useRef(false);
  useEffect(() => {
    if (!startedRef.current && selectedRange && selectedVerses.length > 0) {
      startedRef.current = true;
      startMode(mode, source, selectedVerses.length);
    }
  }, [selectedRange, selectedVerses.length, startMode, mode, source]);

  const handleVerseChange = useCallback((idx: number) => { setCurrentVerse(idx); }, [setCurrentVerse]);

  const handleComplete = useCallback(async (result: ModeResult) => {
    finishMode(result);
    if (!practice) {
      await gradeMode(result);
    }
  }, [finishMode, gradeMode, practice]);

  const navBack = useCallback(() => {
    resetSession();
    if (practice) {
      navigate({ to: "/library/$tab", params: { tab: "practice" } });
    } else {
      navigate({ to: "/memorize/session/$sourceType/$sourceId", params: { sourceType: source.type, sourceId: String(source.id) } });
    }
  }, [resetSession, navigate, source, practice]);

  if (!selectedRange && phase === "idle") {
    return (
      <VerseRangeSelector
        versesCount={verses.length}
        surahName={sourceLabel}
        mode={mode}
        onSelect={setSelectedRange}
        onBack={navBack}
      />
    );
  }

  if (phase === "results" && lastModeResult) {
    return (
      <div className="mx-auto max-w-lg p-4">
        <SessionResults result={lastModeResult} onContinue={navBack} />
      </div>
    );
  }

  return (
    <ModeLayout mode={mode} surahName={sourceLabel} currentVerseIndex={currentVerseIndex} totalVerses={selectedVerses.length} onClose={navBack}>
      {mode === "learn" && <LearnMode source={source} verses={selectedVerses} onVerseChange={handleVerseChange} onComplete={handleComplete} />}
      {mode === "listen" && selectedAudioData && <ListenMode source={source} surahName={sourceLabel} verses={selectedVerses} audioData={selectedAudioData} onVerseChange={handleVerseChange} onComplete={handleComplete} />}
      {mode === "listen" && !selectedAudioData && (
        <div className="flex h-64 items-center justify-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" /></div>
      )}
      {mode === "test" && <TestMode source={source} verses={selectedVerses} onVerseChange={handleVerseChange} onComplete={handleComplete} />}
      {mode === "type" && <TypeMode source={source} verses={selectedVerses} onVerseChange={handleVerseChange} onComplete={handleComplete} />}
    </ModeLayout>
  );
}
