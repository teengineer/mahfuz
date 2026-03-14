import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { chapterQueryOptions } from "~/hooks/useChapters";
import {
  useMemorizationDashboard,
  useSurahProgress,
} from "~/hooks/useMemorization";
import { SurahVerifyQuiz } from "~/components/memorization/SurahVerifyQuiz";
import { VerificationResults } from "~/components/memorization/VerificationResults";
import { memorizationRepository } from "@mahfuz/db";
import { useTranslation } from "~/hooks/useTranslation";
import type { SessionResult } from "~/stores/useMemorizationStore";

export const Route = createFileRoute(
  "/_app/_protected/memorize/verify/$surahId",
)({
  component: VerifyPage,
});

function VerifyPage() {
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const { surahId: surahIdStr } = Route.useParams();
  const surahId = Number(surahIdStr);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: chapter } = useSuspenseQuery(chapterQueryOptions(surahId));
  const { refreshStats } = useMemorizationDashboard(userId);
  const { progressMap } = useSurahProgress(userId, surahId);

  const allMastered =
    chapter &&
    progressMap.size === chapter.verses_count &&
    [...progressMap.values()].every((v) => v.confidence === "mastered");

  const [phase, setPhase] = useState<"quiz" | "results">("quiz");
  const [dismissedSkip, setDismissedSkip] = useState(false);
  const [passed, setPassed] = useState(false);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);

  const handleComplete = useCallback(
    (results: {
      total: number;
      correct: number;
      results: Array<{
        verseKey: string;
        wordPosition: number;
        correctWord: string;
        selectedWord: string;
        isCorrect: boolean;
      }>;
    }) => {
      const accuracy = results.total > 0 ? results.correct / results.total : 0;
      const didPass = accuracy >= 0.6;
      setPassed(didPass);

      // Map blank results to SessionResult format for VerificationResults
      // Group by verseKey. A verse passes if majority of its blanks are correct
      const byVerse = new Map<
        string,
        { correct: number; total: number }
      >();
      for (const r of results.results) {
        const entry = byVerse.get(r.verseKey) || { correct: 0, total: 0 };
        entry.total++;
        if (r.isCorrect) entry.correct++;
        byVerse.set(r.verseKey, entry);
      }

      const mapped: SessionResult[] = [...byVerse.entries()].map(
        ([verseKey, counts]) => {
          const ratio = counts.correct / counts.total;
          const wasCorrect = ratio >= 0.5;
          const grade = ratio >= 0.8 ? 5 : ratio >= 0.5 ? 3 : 1;
          return {
            cardId: verseKey,
            verseKey,
            grade: grade as 0 | 1 | 2 | 3 | 4 | 5,
            wasCorrect,
          };
        },
      );
      setSessionResults(mapped);

      if (didPass && chapter) {
        memorizationRepository.bulkMasterSurah(
          userId,
          surahId,
          chapter.verses_count,
        );
      }

      setPhase("results");
    },
    [userId, surahId, chapter],
  );

  const handleContinue = useCallback(() => {
    refreshStats();
    navigate({ to: "/memorize" });
  }, [refreshStats, navigate]);

  const handleSkipExam = useCallback(async () => {
    if (!chapter) return;
    await memorizationRepository.bulkMasterSurah(
      userId,
      surahId,
      chapter.verses_count,
    );
    refreshStats();
    navigate({ to: "/memorize" });
  }, [userId, surahId, chapter, refreshStats, navigate]);

  if (phase === "results") {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
        <VerificationResults
          results={sessionResults}
          passed={passed}
          surahName={chapter?.name_simple || ""}
          onContinue={handleContinue}
        />
      </div>
    );
  }

  // Skip exam prompt for fully mastered surahs
  if (allMastered && phase === "quiz" && !dismissedSkip) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
            <svg
              className="h-8 w-8 text-emerald-600 dark:text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {t.memorize.skipExam.title}
          </h2>
          <p className="text-[var(--text-secondary)] mb-2">
            {chapter?.name_simple}
          </p>
          <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
            {t.memorize.skipExam.description}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleSkipExam}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              {t.memorize.skipExam.skip}
            </button>
            <button
              onClick={() => setDismissedSkip(true)}
              className="rounded-xl border border-[var(--border)] px-6 py-3 font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            >
              {t.memorize.skipExam.takeAnyway}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 animate-fade-in">
      <SurahVerifyQuiz
        surahId={surahId}
        onComplete={handleComplete}
        onCancel={handleContinue}
      />
    </div>
  );
}
