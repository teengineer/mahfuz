import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import type { SideQuest } from "@mahfuz/shared/types";
import type { QuestProgressEntry } from "@mahfuz/db";

interface QuestCardProps {
  quest: SideQuest;
  progress?: QuestProgressEntry;
}

export function QuestCard({ quest, progress }: QuestCardProps) {
  const { t } = useTranslation();
  const totalWords = quest.wordBank.length;
  const learnedWords = progress?.wordsCorrect.length || 0;
  const progressPct = totalWords > 0 ? Math.round((learnedWords / totalWords) * 100) : 0;

  const letterChars: Record<number, string> = { 2: "ب", 3: "ت", 4: "ث" };
  const familyDisplay = quest.letterIds.map((id) => letterChars[id] || "").join("");

  return (
    <Link to="/learn/quest/$questId" params={{ questId: quest.id }}>
      <div className="rounded-2xl border-2 border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-elevated)] sm:p-5">
        <div className="flex items-start gap-3">
          {/* Letter family badge */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-500/20">
            <span
              className="arabic-text text-[20px] font-bold text-amber-400"
              dir="rtl"
              style={{ letterSpacing: "0.15em" }}
            >
              {familyDisplay}
            </span>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-[var(--theme-text)]">
              {t.learn.quests.ba.title}
            </h3>
            <p className="mt-0.5 text-[12px] text-[var(--theme-text-tertiary)]">
              {t.learn.quests.ba.desc}
            </p>

            {/* Stats row */}
            {progress && progress.sessionsCompleted > 0 && (
              <div className="mt-1.5 flex items-center gap-3 text-[11px] text-[var(--theme-text-quaternary)]">
                <span>
                  {progress.sessionsCompleted} {t.learn.quests.sessions}
                </span>
                {progress.bestSessionScore > 0 && (
                  <span>
                    {t.learn.quests.bestScore}: %{progress.bestSessionScore}
                  </span>
                )}
              </div>
            )}

            {/* Progress bar */}
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-[var(--theme-text-quaternary)]">
                  {learnedWords}/{totalWords} {t.learn.quests.wordsLearned}
                </span>
                {progressPct > 0 && (
                  <span className="font-medium text-[var(--theme-text-tertiary)]">
                    %{progressPct}
                  </span>
                )}
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--theme-bg)]">
                <div
                  className={`h-full rounded-full transition-all ${
                    progressPct >= 100 ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
