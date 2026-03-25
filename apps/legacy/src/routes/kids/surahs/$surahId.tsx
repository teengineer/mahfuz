import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { versesByChapterQueryOptions } from "~/hooks/useVerses";
import { memorizeWbwByChapterQueryOptions } from "~/hooks/useWbwData";
import { chapterAudioQueryOptions } from "~/hooks/useAudio";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { mergeWbwIntoVerses } from "~/lib/quran-data";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";
import { useAudioStore } from "~/stores/useAudioStore";
import { useKidsProgressStore } from "~/stores/useKidsProgressStore";
import { useKidsStore } from "~/stores/useKidsStore";
import { KIDS_SURAHS } from "~/lib/kids-constants";
import type { Verse } from "@mahfuz/shared/types";
import type { ChapterAudioData } from "@mahfuz/audio-engine";

export const Route = createFileRoute("/kids/surahs/$surahId")({
  loader: async ({ context, params }) => {
    const id = Number(params.surahId);
    await Promise.all([
      context.queryClient.ensureQueryData(versesByChapterQueryOptions(id)),
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
      context.queryClient.ensureQueryData(memorizeWbwByChapterQueryOptions(id)),
    ]);
  },
  pendingComponent: () => <KidsLoading />,
  component: () => (
    <Suspense fallback={<KidsLoading />}>
      <KidsSurahDetail />
    </Suspense>
  ),
});

function KidsLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="mb-3 text-4xl animate-bounce">🌟</div>
        <p className="text-[15px] font-bold text-purple-500">Yükleniyor...</p>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────

function KidsSurahDetail() {
  const { surahId } = Route.useParams();
  const chapterId = Number(surahId);
  const { t, locale } = useTranslation();
  const reciterId = useAudioStore((s) => s.reciterId);
  const kidsSurah = KIDS_SURAHS.find((s) => s.id === chapterId);

  // Data queries
  const { data: chaptersData } = useSuspenseQuery(chaptersQueryOptions());
  const { data: versesData } = useSuspenseQuery(versesByChapterQueryOptions(chapterId));
  const { data: wbwData } = useQuery(memorizeWbwByChapterQueryOptions(chapterId));
  const { data: rawAudioData } = useQuery(chapterAudioQueryOptions(reciterId, chapterId));

  const chapter = chaptersData.find((c) => c.id === chapterId);
  const surahName = chapter ? getSurahName(chapter.id, chapter.translated_name.name, locale) : `Sure ${chapterId}`;
  const verses = mergeWbwIntoVerses(versesData.verses, wbwData);

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

  // Progress
  const progress = useKidsProgressStore((s) => s.surahs[chapterId]);
  const markListened = useKidsProgressStore((s) => s.markSurahListened);

  const [phase, setPhase] = useState<"overview" | "listen" | "done">("overview");

  if (phase === "listen" && audioData) {
    return (
      <KidsListenMode
        chapterId={chapterId}
        surahName={surahName}
        verses={verses}
        audioData={audioData}
        onComplete={() => {
          markListened(chapterId);
          setPhase("done");
        }}
        onBack={() => setPhase("overview")}
      />
    );
  }

  if (phase === "done") {
    return <KidsListenComplete surahName={surahName} onBack={() => setPhase("overview")} />;
  }

  // ── Overview Phase ─────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* Surah header */}
      <div className="mb-6 rounded-3xl bg-gradient-to-br from-purple-100 to-indigo-50 p-6 text-center shadow-sm">
        <div className="mb-2 text-4xl">
          {kidsSurah?.difficulty === "easy" ? "🌱" : kidsSurah?.difficulty === "medium" ? "🌿" : "🌳"}
        </div>
        <h1 className="kids-heading text-2xl font-extrabold text-purple-700">{surahName}</h1>
        {chapter && (
          <p className="mt-1 text-[20px] font-bold text-purple-400 arabic-text" dir="rtl">
            {chapter.name_arabic}
          </p>
        )}
        <p className="mt-2 text-[13px] font-semibold text-purple-500">
          {versesData.verses.length} {t.common.verse}
        </p>
      </div>

      {/* Progress milestones */}
      <div className="mb-6">
        <h2 className="mb-3 text-[14px] font-extrabold text-gray-700">{t.kids.surahs.progress}</h2>
        <div className="grid grid-cols-5 gap-2">
          {[
            { key: "listened", done: progress?.listened, icon: "👂", label: t.kids.surahs.listen },
            { key: "repeated", done: progress?.repeated, icon: "🔁", label: t.kids.surahs.repeat },
            { key: "ordered", done: progress?.ordered, icon: "🔢", label: t.kids.surahs.order },
            { key: "filled", done: progress?.filled, icon: "✏️", label: t.kids.surahs.fill },
            { key: "memorized", done: progress?.memorized, icon: "⭐", label: t.kids.surahs.recite },
          ].map((step) => (
            <div
              key={step.key}
              className={`flex flex-col items-center gap-1 rounded-2xl p-2 text-center ${
                step.done ? "bg-emerald-50" : "bg-gray-50"
              }`}
            >
              <span className={`text-xl ${step.done ? "" : "grayscale opacity-40"}`}>{step.icon}</span>
              <span className={`text-[10px] font-bold ${step.done ? "text-emerald-600" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Listen button */}
      <button
        onClick={() => audioData ? setPhase("listen") : undefined}
        disabled={!audioData}
        className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 px-6 py-4 text-white shadow-lg shadow-purple-200 transition-transform active:scale-[0.97] disabled:opacity-50"
      >
        <span className="text-2xl">👂</span>
        <span className="text-[16px] font-extrabold">{t.kids.surahs.listen}</span>
      </button>

      {!audioData && (
        <p className="mt-2 text-center text-[12px] text-gray-400 animate-pulse">
          Ses yükleniyor...
        </p>
      )}
    </div>
  );
}

// ── Kids Listen Mode ─────────────────────────────────────────────

const SPEED_OPTIONS = [0.5, 0.75, 1] as const;

function KidsListenMode({
  chapterId,
  surahName,
  verses,
  audioData,
  onComplete,
  onBack,
}: {
  chapterId: number;
  surahName: string;
  verses: Verse[];
  audioData: ChapterAudioData;
  onComplete: () => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [speedIdx, setSpeedIdx] = useState(2); // 1x default
  const addStars = useKidsStore((s) => s.addStars);

  const playbackState = useAudioStore((s) => s.playbackState);
  const currentVerseKey = useAudioStore((s) => s.currentVerseKey);
  const currentWordPosition = useAudioStore((s) => s.currentWordPosition);
  const currentTime = useAudioStore((s) => s.currentTime);
  const playSurah = useAudioStore((s) => s.playSurah);
  const play = useAudioStore((s) => s.play);
  const pause = useAudioStore((s) => s.pause);
  const setSpeed = useAudioStore((s) => s.setSpeed);
  const nextVerse = useAudioStore((s) => s.nextVerse);
  const prevVerse = useAudioStore((s) => s.prevVerse);
  const stop = useAudioStore((s) => s.stop);

  const currentVerseIdx = verses.findIndex((v) => v.verse_key === currentVerseKey);
  const verseRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const completedRef = useRef(false);

  // Start playing on mount
  useEffect(() => {
    playSurah(chapterId, surahName, audioData);
    return () => { stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll on verse change
  useEffect(() => {
    if (currentVerseIdx >= 0) {
      const el = verseRefs.current.get(currentVerseIdx);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [currentVerseIdx]);

  // Handle playback end
  useEffect(() => {
    if (playbackState === "ended" && !completedRef.current) {
      completedRef.current = true;
      addStars(3);
      onComplete();
    }
  }, [playbackState]); // eslint-disable-line react-hooks/exhaustive-deps

  // End-of-range detection
  const lastTimingEndMs = audioData.verseTimings[audioData.verseTimings.length - 1]?.to ?? Infinity;
  useEffect(() => {
    if (completedRef.current) return;
    if (currentTime >= lastTimingEndMs && playbackState === "playing") {
      completedRef.current = true;
      stop();
      addStars(3);
      onComplete();
    }
  }, [currentTime, lastTimingEndMs, playbackState]); // eslint-disable-line react-hooks/exhaustive-deps

  const cycleSpeed = useCallback(() => {
    const next = (speedIdx + 1) % SPEED_OPTIONS.length;
    setSpeedIdx(next);
    setSpeed(SPEED_OPTIONS[next] as any);
  }, [speedIdx, setSpeed]);

  const handleStop = useCallback(() => {
    stop();
    onBack();
  }, [stop, onBack]);

  // Verse progress
  const totalVerses = verses.length;
  const progressPct = totalVerses > 0 ? Math.max(0, ((currentVerseIdx + 1) / totalVerses) * 100) : 0;

  return (
    <div className="flex min-h-[calc(100vh-140px)] flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-purple-50 to-transparent px-4 pb-3 pt-2">
        <div className="flex items-center justify-between">
          <button
            onClick={handleStop}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm active:scale-95"
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <span className="text-[14px] font-extrabold text-purple-700">{surahName}</span>
          <button
            onClick={cycleSpeed}
            className="rounded-full bg-white px-3 py-1.5 text-[13px] font-bold text-purple-600 shadow-sm active:scale-95"
          >
            {SPEED_OPTIONS[speedIdx]}x
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-purple-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-400 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="mt-1 text-center text-[11px] font-bold text-purple-400">
          {Math.max(0, currentVerseIdx + 1)}/{totalVerses} {t.common.verse}
        </div>
      </div>

      {/* Verse list */}
      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {verses.map((v, idx) => {
          const vWords = v.words?.filter((w) => w.char_type_name === "word") || [];
          const isActive = idx === currentVerseIdx;
          const isPast = idx < currentVerseIdx;

          return (
            <div
              key={v.verse_key}
              ref={(el) => { if (el) verseRefs.current.set(idx, el); }}
              className={`mb-4 rounded-3xl p-5 transition-all duration-300 ${
                isActive
                  ? "bg-white shadow-lg shadow-purple-100 ring-2 ring-purple-200 scale-[1.01]"
                  : isPast
                    ? "bg-emerald-50/60 opacity-60"
                    : "bg-white/40 opacity-30"
              }`}
            >
              {/* Verse badge */}
              <div className="mb-3 flex items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-[12px] font-extrabold ${
                  isActive
                    ? "bg-purple-100 text-purple-600"
                    : isPast
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-gray-100 text-gray-400"
                }`}>
                  {isPast ? "✓" : ""} {t.common.verse} {v.verse_number}
                </span>
              </div>

              {/* Words */}
              <div className="flex flex-wrap justify-end gap-2" dir="rtl">
                {vWords.map((w) => {
                  const isWordActive = isActive && currentWordPosition === w.position;
                  return (
                    <div
                      key={w.id}
                      className={`flex flex-col items-center gap-0.5 rounded-2xl px-3 py-2 transition-all duration-200 ${
                        isWordActive
                          ? "scale-110 bg-purple-500 shadow-lg shadow-purple-200"
                          : isActive
                            ? "bg-purple-50"
                            : ""
                      }`}
                    >
                      <span
                        className={`arabic-text font-semibold leading-relaxed ${
                          isActive ? "text-[26px]" : "text-[20px]"
                        } ${isWordActive ? "text-white" : "text-gray-800"}`}
                        dir="rtl"
                      >
                        {w.text_imlaei || w.text}
                      </span>
                      {isActive && w.transliteration?.text && (
                        <span className={`text-[11px] font-semibold ${isWordActive ? "text-purple-100" : "text-purple-500"}`}>
                          {w.transliteration.text}
                        </span>
                      )}
                      {isActive && w.translation?.text && (
                        <span className={`text-[10px] ${isWordActive ? "text-purple-200" : "text-gray-400"}`}>
                          {w.translation.text}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom controls */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-white via-white to-white/80 px-4 pb-6 pt-4">
        <div className="mx-auto flex max-w-lg items-center justify-center gap-8">
          {/* Prev verse */}
          <button
            onClick={() => prevVerse()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-500 shadow-sm active:scale-90"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          {/* Play/Pause */}
          <button
            onClick={() => playbackState === "playing" ? pause() : play()}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 text-white shadow-xl shadow-purple-200 active:scale-90"
          >
            {playbackState === "playing" ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Next verse */}
          <button
            onClick={() => nextVerse()}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-500 shadow-sm active:scale-90"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Completion Screen ────────────────────────────────────────────

function KidsListenComplete({ surahName, onBack }: { surahName: string; onBack: () => void }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-10 text-center">
      <div className="mb-4 text-6xl animate-bounce">🎉</div>
      <h1 className="kids-heading mb-2 text-2xl font-extrabold text-purple-700">
        {t.kids.common.great}
      </h1>
      <p className="mb-2 text-[15px] font-semibold text-purple-500">
        {surahName} - {t.kids.surahs.listen} ✓
      </p>
      <p className="mb-6 text-[14px] font-bold text-amber-500">
        +3 ⭐
      </p>
      <button
        onClick={onBack}
        className="rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-500 px-8 py-3.5 text-[15px] font-extrabold text-white shadow-lg shadow-purple-200 active:scale-95"
      >
        {t.kids.common.continue}
      </button>
    </div>
  );
}
