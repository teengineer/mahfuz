import { createFileRoute, useNavigate, redirect, Link } from "@tanstack/react-router";
import { Suspense, useMemo, useState, useEffect } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CURRICULUM, getStagesByLevel } from "@mahfuz/shared/data/learn/curriculum";
import { LEVELS, type LevelId } from "@mahfuz/shared/types";
import { EmojiIcon } from "~/components/icons/EmojiIcon";
import { SIDE_QUESTS } from "@mahfuz/shared/data/learn/quests";
import { useLearnDashboard, useStageUnlockStatus } from "~/hooks/useLearn";
import { useQuestDashboard } from "~/hooks/useQuest";
import { useMemorizationDashboard } from "~/hooks/useMemorization";
import { StatsOverview, SurahSelector, GoalsSettings } from "~/components/memorization";
import { memorizationRepository, type MemorizationCardEntry } from "@mahfuz/db";
import { LibraryCourseCard } from "~/components/library/LibraryCourseCard";
import { LibraryTrackCard } from "~/components/library/LibraryTrackCard";
import { LevelPicker } from "~/components/learn";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { useTranslation } from "~/hooks/useTranslation";
import { useAppUI } from "~/stores/useAppUI";
import { resolveNestedKey } from "~/lib/i18n-utils";
import { getSurahName } from "~/lib/surah-name";
import { Skeleton } from "~/components/ui/Skeleton";
import { Button } from "~/components/ui/Button";

const VALID_TABS = ["courses", "tracks", "memorize", "practice"] as const;
type TabType = (typeof VALID_TABS)[number];

export const Route = createFileRoute("/_app/_protected/library/$tab")({
  beforeLoad: ({ params }) => {
    if (!VALID_TABS.includes(params.tab as TabType)) {
      throw redirect({ to: "/library/courses" });
    }
  },
  component: LibraryPage,
});

function LibraryPage() {
  const { tab } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { session } = Route.useRouteContext();
  const userId = session!.user.id;
  const currentTab = tab as TabType;

  const TAB_OPTIONS = [
    { value: "courses" as TabType, label: t.library.courses },
    { value: "tracks" as TabType, label: t.library.tracks },
    { value: "memorize" as TabType, label: t.library.memorize },
    { value: "practice" as TabType, label: t.library.practice },
  ];

  const setTab = (value: TabType) => {
    navigate({
      to: "/library/$tab",
      params: { tab: value },
      replace: true,
    });
  };

  return (
    <div className="mx-auto max-w-[960px] px-5 py-5 sm:px-6 sm:py-10 lg:max-w-[1200px]">
      {/* Header */}
      <h1 className="mb-1 text-2xl font-bold text-[var(--theme-text)]">
        {t.nav.library}
      </h1>
      <p className="mb-5 text-[14px] text-[var(--theme-text-secondary)]">
        {t.library.subtitle}
      </p>

      {/* Tabs — sticky underline style (same as browse) */}
      <div className="sticky top-0 z-10 -mx-5 mb-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-5 sm:-mx-6 sm:mb-6 sm:px-6">
        <nav className="flex gap-0" role="tablist">
          {TAB_OPTIONS.map((opt) => {
            const active = currentTab === opt.value;
            return (
              <button
                key={opt.value}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(opt.value)}
                className={`relative px-4 py-3 text-[14px] font-medium transition-colors ${
                  active
                    ? "text-[var(--theme-text)]"
                    : "text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
                }`}
              >
                {opt.label}
                {active && (
                  <span className="absolute inset-x-1 bottom-0 h-[2px] rounded-full bg-primary-600" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <Suspense
        fallback={
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" className="h-20" />
            ))}
          </div>
        }
      >
        {currentTab === "courses" && <CoursesTab userId={userId} />}
        {currentTab === "tracks" && <TracksTab userId={userId} />}
        {currentTab === "memorize" && <MemorizeTab userId={userId} />}
        {currentTab === "practice" && <PracticeTab />}
      </Suspense>
    </div>
  );
}

// ── Courses Tab ──────────────────────────────────────────────


function CoursesTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { stageProgress, totalSevapPoint, isLoading } = useLearnDashboard(userId);
  const { unlockedStages } = useStageUnlockStatus(userId);
  const { hasPickedLearnLevel, selectedLearnLevel, setHasPickedLearnLevel, setSelectedLearnLevel } = useAppUI();
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [expandedLevel, setExpandedLevel] = useState<number | null>(null);

  // ALL hooks MUST be above any early return (React rules of hooks)
  const levelProgress = useMemo(() => {
    const result: Record<number, { total: number; completed: number }> = {};
    for (const level of LEVELS) {
      const stages = getStagesByLevel(level.id);
      let total = 0;
      let completed = 0;
      for (const stage of stages) {
        total += stage.lessons.length;
        const sp = stageProgress.get(stage.id);
        completed += sp?.completed || 0;
      }
      result[level.id] = { total, completed };
    }
    return result;
  }, [stageProgress]);

  // Determine which level is "current" (first non-complete, or the selected one)
  const currentLevelId = useMemo(() => {
    // Find the first level that isn't fully complete
    for (const level of LEVELS) {
      const lp = levelProgress[level.id];
      if (!lp || lp.completed < lp.total || lp.total === 0) {
        return level.id;
      }
    }
    return selectedLearnLevel || 4; // all done? show last
  }, [levelProgress, selectedLearnLevel]);

  // Auto-expand current level
  useEffect(() => {
    if (expandedLevel === null) {
      setExpandedLevel(currentLevelId);
    }
  }, [currentLevelId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show level picker if user hasn't picked yet
  if (!hasPickedLearnLevel || showLevelPicker) {
    return (
      <div className="py-4">
        {showLevelPicker && (
          <button
            onClick={() => setShowLevelPicker(false)}
            className="mb-4 inline-flex items-center gap-1 text-[13px] text-[var(--theme-text-secondary)] hover:text-[var(--theme-text)]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {t.common.back}
          </button>
        )}
        <LevelPicker
          onSelect={(levelId) => {
            setShowLevelPicker(false);
          }}
        />
      </div>
    );
  }

  return (
    <>
      {/* Stats bar */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-primary-600">{totalSevapPoint}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.pointLabel}</p>
        </div>
        <div className="h-8 w-px bg-[var(--theme-border)]" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-[var(--theme-text)]">
            {CURRICULUM.reduce((sum, s) => {
              const sp = stageProgress.get(s.id);
              return sum + (sp?.completed || 0);
            }, 0)}
          </p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.completedLessons}</p>
        </div>
        <div className="h-8 w-px bg-[var(--theme-border)]" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-[var(--theme-text)]">{CURRICULUM.length}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.totalStages}</p>
        </div>
      </div>

      {/* Change level button */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[var(--theme-text-tertiary)]">
            {t.learn.levels.currentLevel}:
          </span>
          <span className="text-[13px] font-semibold text-[var(--theme-text)]">
            {resolveNestedKey(t.learn as Record<string, any>, LEVELS[selectedLearnLevel - 1]?.titleKey || "") || ""}
          </span>
        </div>
        <button
          onClick={() => setShowLevelPicker(true)}
          className="rounded-lg border border-[var(--theme-border)] px-3 py-1.5 text-[12px] font-medium text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
        >
          {t.learn.levels.changeLevel}
        </button>
      </div>

      {/* Roadmap */}
      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-40" />
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <Skeleton key={j} variant="card" className="h-48" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line connecting levels */}
          <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-[var(--theme-border)]" />

          <div className="space-y-0">
            {LEVELS.map((level, idx) => {
              const stages = getStagesByLevel(level.id);
              const lp = levelProgress[level.id];
              const progress = lp.total > 0 ? Math.round((lp.completed / lp.total) * 100) : 0;
              const isComplete = lp.completed >= lp.total && lp.total > 0;
              const isCurrent = level.id === currentLevelId;
              const isExpanded = expandedLevel === level.id;
              const isLocked = level.id > currentLevelId && !isComplete;
              const title = resolveNestedKey(t.learn as Record<string, any>, level.titleKey) || level.titleKey;
              const desc = resolveNestedKey(t.learn as Record<string, any>, level.descriptionKey) || level.descriptionKey;

              return (
                <div key={level.id} className="relative">
                  {/* Level node — clickable header */}
                  <button
                    onClick={() => setExpandedLevel(isExpanded ? null : level.id)}
                    className="group flex w-full items-center gap-3 py-3 text-left"
                  >
                    {/* Circle node on the timeline */}
                    <div
                      className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        isComplete
                          ? "border-primary-500 bg-primary-500 text-white"
                          : isCurrent
                            ? "border-primary-500 bg-[var(--theme-bg-primary)] text-primary-600 shadow-[0_0_0_4px_rgba(var(--color-primary-500)/0.15)]"
                            : "border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text-quaternary)]"
                      }`}
                    >
                      {isComplete ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <EmojiIcon emoji={level.icon} className="h-5 w-5" />
                      )}
                    </div>

                    {/* Level info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`text-[15px] font-bold ${isLocked ? "text-[var(--theme-text-tertiary)]" : "text-[var(--theme-text)]"}`}>
                          {title}
                        </h3>
                        {isCurrent && !isComplete && (
                          <span className="rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {t.learn.levels.roadmapCurrent}
                          </span>
                        )}
                        {isComplete && (
                          <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                            {t.learn.levels.roadmapCompleted}
                          </span>
                        )}
                      </div>
                      <p className={`text-[12px] ${isLocked ? "text-[var(--theme-text-quaternary)]" : "text-[var(--theme-text-tertiary)]"}`}>
                        {desc}
                      </p>
                    </div>

                    {/* Progress + chevron */}
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-medium tabular-nums text-[var(--theme-text-tertiary)]">
                        {lp.completed}/{lp.total}
                      </span>
                      <svg
                        className={`h-4 w-4 text-[var(--theme-text-quaternary)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Expanded content — stages + buttons */}
                  {isExpanded && (
                    <div className="ml-[46px] animate-fade-in pb-4">
                      {/* Level progress bar */}
                      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-[var(--theme-bg)]">
                        <div
                          className={`h-full rounded-full transition-all ${isComplete ? "bg-primary-500" : "bg-primary-600"}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Stage cards grid */}
                      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                        {stages.map((stage) => {
                          const sp = stageProgress.get(stage.id);
                          return (
                            <LibraryCourseCard
                              key={stage.id}
                              stageId={stage.id}
                              titleKey={stage.titleKey}
                              descriptionKey={stage.descriptionKey}
                              lessonCount={stage.lessons.length}
                              completedCount={sp?.completed || 0}
                              isUnlocked={unlockedStages.has(stage.id)}
                            />
                          );
                        })}
                      </div>

                      {/* Level exam + practice buttons */}
                      <div className="mt-4 flex gap-3">
                        <Link
                          to="/learn/level/$levelId/exam"
                          params={{ levelId: String(level.id) }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-4 py-3 text-[14px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-hover-bg)] hover:shadow-sm active:scale-[0.97]"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t.learn.levels.examWithName(title)}
                        </Link>
                        <Link
                          to="/learn/level/$levelId/practice"
                          params={{ levelId: String(level.id) }}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] px-4 py-3 text-[14px] font-medium text-[var(--theme-text-secondary)] transition-all hover:bg-[var(--theme-hover-bg)] hover:shadow-sm active:scale-[0.97]"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {t.learn.levels.practiceWithName(title)}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ── Tracks Tab ───────────────────────────────────────────────

function TracksTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { quests, progressMap: questProgressMap } = useQuestDashboard(userId);

  const questStats = useMemo(() => {
    let wordsLearned = 0;
    let totalWords = 0;
    let sessions = 0;
    for (const quest of SIDE_QUESTS) {
      totalWords += quest.wordBank.length;
      const p = questProgressMap.get(quest.id);
      if (p) {
        wordsLearned += p.wordsCorrect.length;
        sessions += p.sessionsCompleted;
      }
    }
    return { wordsLearned, totalWords, sessions };
  }, [questProgressMap]);

  return (
    <>
      {/* Stats bar */}
      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)]">
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-primary-600">{questStats.wordsLearned}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.quests.wordsLearnedLabel}</p>
        </div>
        <div className="h-8 w-px bg-[var(--theme-border)]" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-[var(--theme-text)]">{questStats.totalWords}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.quests.totalWords}</p>
        </div>
        <div className="h-8 w-px bg-[var(--theme-border)]" />
        <div className="flex-1 text-center">
          <p className="text-xl font-bold text-[var(--theme-text)]">{questStats.sessions}</p>
          <p className="text-[11px] text-[var(--theme-text-tertiary)]">{t.learn.quests.sessionsLabel}</p>
        </div>
      </div>

      {/* Description */}
      <p className="mb-4 text-[13px] text-[var(--theme-text-secondary)]">
        {t.learn.quests.sectionDesc}
      </p>

      {/* Card grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {quests.map((quest) => (
          <LibraryTrackCard
            key={quest.id}
            quest={quest}
            progress={questProgressMap.get(quest.id)}
          />
        ))}
      </div>
    </>
  );
}

// ── Memorize Tab ─────────────────────────────────────────────

function MemorizeTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { stats, isLoading } = useMemorizationDashboard(userId);
  const [allCards, setAllCards] = useState<MemorizationCardEntry[]>([]);

  useEffect(() => {
    memorizationRepository.getAllCards(userId).then(setAllCards);
  }, [userId, stats]);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <div />
        <div className="flex gap-2">
        </div>
      </div>

      <div className="space-y-6 animate-fade-in">
        {isLoading ? (
          <div className="space-y-4 rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
            <Skeleton lines={2} />
          </div>
        ) : stats && stats.totalCards === 0 ? (
          <div className="animate-fade-in rounded-2xl bg-[var(--theme-bg-primary)] p-8 text-center shadow-[var(--shadow-card)]">
            <p className="mb-2 text-lg font-semibold text-[var(--theme-text)]">
              {t.memorize.emptyTitle}
            </p>
            <p className="text-[14px] text-[var(--theme-text-tertiary)]">
              {t.memorize.emptyDesc}
            </p>
          </div>
        ) : stats ? (
          <>
            <StatsOverview stats={stats} cards={allCards} />
            <details className="group">
              <summary className="cursor-pointer list-none px-1 pb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                {t.memorize.goals}
                <span className="ml-1 inline-block transition-transform group-open:rotate-90">›</span>
              </summary>
              <GoalsSettings userId={userId} />
            </details>
          </>
        ) : null}

        {stats && stats.totalCards === 0 && <GoalsSettings userId={userId} />}

        <Suspense
          fallback={
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} variant="card" className="h-20" />
              ))}
            </div>
          }
        >
          <SurahSelector userId={userId} />
        </Suspense>
      </div>
    </>
  );
}

// ── Practice Tab ────────────────────────────────────────────

function PracticeTab() {
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const { data: chapters } = useSuspenseQuery(chaptersQueryOptions());

  const filtered = useMemo(() => {
    if (!search.trim()) return chapters;
    const q = search.toLowerCase();
    return chapters.filter(
      (c) =>
        c.name_simple.toLowerCase().includes(q) ||
        c.name_arabic.includes(q) ||
        getSurahName(c.id, c.translated_name.name, locale).toLowerCase().includes(q) ||
        String(c.id) === q,
    );
  }, [chapters, search, locale]);

  return (
    <>
      <p className="mb-4 text-[13px] text-[var(--theme-text-secondary)]">
        {t.library.practiceDesc}
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--theme-text-quaternary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.library.practiceSearch}
          className="w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] py-2.5 pl-10 pr-4 text-[14px] text-[var(--theme-text)] placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Surah grid */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((ch) => (
          <Link
            key={ch.id}
            to="/memorize/session/$sourceType/$sourceId"
            params={{ sourceType: "surah", sourceId: String(ch.id) }}
            search={{ practice: true }}
            className="flex items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-3 transition-colors hover:bg-[var(--theme-hover-bg)] active:scale-[0.98]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600/10 text-[13px] font-semibold tabular-nums text-primary-700">
              {ch.id}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[var(--theme-text)]">
                {getSurahName(ch.id, ch.translated_name.name, locale)}
              </p>
              <p className="text-[12px] text-[var(--theme-text-tertiary)]">
                {ch.name_arabic} · {ch.verses_count} {t.memorize.verse}
              </p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="shrink-0 text-[var(--theme-text-quaternary)]"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>
    </>
  );
}
