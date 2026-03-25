import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useSurahProgress } from "~/hooks/useMemorization";
import type { MemorizeMode, MemorizeSource } from "~/stores/useMemorizationStore";

interface ModePickerProps {
  source: MemorizeSource;
  surahName: string;
  versesCount: number;
  userId: string;
  practice?: boolean;
}

interface ModeCard {
  mode: MemorizeMode;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
}

export function ModePicker({ source, surahName, versesCount, userId, practice }: ModePickerProps) {
  const { t } = useTranslation();
  const { progressMap } = useSurahProgress(userId, source.id);

  const totalCards = progressMap.size;
  const masteredCards = [...progressMap.values()].filter((p) => p.confidence === "mastered").length;
  const overallProgress = versesCount > 0 ? Math.round((masteredCards / versesCount) * 100) : 0;

  const modes: ModeCard[] = [
    {
      mode: "learn",
      colorClass: "text-[var(--theme-text-secondary)]",
      bgClass: "bg-[var(--theme-hover-bg)]",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--theme-text-secondary)]">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      mode: "listen",
      colorClass: "text-[var(--theme-text-secondary)]",
      bgClass: "bg-[var(--theme-hover-bg)]",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--theme-text-secondary)]">
          <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
        </svg>
      ),
    },
    {
      mode: "test",
      colorClass: "text-[var(--theme-text-secondary)]",
      bgClass: "bg-[var(--theme-hover-bg)]",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--theme-text-secondary)]">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          <path d="M9 14l2 2 4-4" />
        </svg>
      ),
    },
    {
      mode: "type",
      colorClass: "text-[var(--theme-text-secondary)]",
      bgClass: "bg-[var(--theme-hover-bg)]",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--theme-text-secondary)]">
          <rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
        </svg>
      ),
    },
    {
      mode: "immersive",
      colorClass: "text-[var(--theme-text-secondary)]",
      bgClass: "bg-[var(--theme-hover-bg)]",
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--theme-text-secondary)]">
          <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
        </svg>
      ),
    },
  ];

  const modeLabels: Record<MemorizeMode, string> = {
    learn: t.memorize.modes.learn,
    listen: t.memorize.modes.listen,
    test: t.memorize.modes.test,
    type: t.memorize.modes.type,
    immersive: t.memorize.modes.immersive,
  };

  const modeDescs: Record<MemorizeMode, string> = {
    learn: t.memorize.modes.learnDesc,
    listen: t.memorize.modes.listenDesc,
    test: t.memorize.modes.testDesc,
    type: t.memorize.modes.typeDesc,
    immersive: t.memorize.modes.immersiveDesc,
  };

  return (
    <div className="mx-auto max-w-lg p-4">
      {/* Surah header */}
      <div className="mb-6 text-center">
        <h1 className="arabic-text mb-1 text-[22px] font-bold text-[var(--theme-text)]">{surahName}</h1>
        {practice ? (
          <p className="text-[13px] text-[var(--theme-text-tertiary)]">
            {versesCount} {t.memorize.verse} · {t.library.practiceLabel}
          </p>
        ) : (
          <>
            <p className="text-[13px] text-[var(--theme-text-tertiary)]">
              {versesCount} {t.memorize.verse} · {overallProgress}% {t.memorize.modes.mastered}
            </p>
            {totalCards > 0 && (
              <div className="mx-auto mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-[var(--theme-hover-bg)]">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${overallProgress}%` }} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Mode cards */}
      <div className="flex flex-col gap-3">
        {modes.map(({ mode, icon, bgClass }) => {
          if (mode === "immersive") {
            return (
              <Link
                key={mode}
                to="/memorize-immersive/$sourceType/$sourceId"
                params={{ sourceType: source.type, sourceId: String(source.id) }}
                search={practice ? { practice: true } : {}}
                className="flex items-center gap-4 rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)] transition-all hover:shadow-md active:scale-[0.98]"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgClass}`}>
                  {icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-[15px] font-semibold text-[var(--theme-text)]">
                    {modeLabels[mode]}
                  </h3>
                  <p className="text-[12px] text-[var(--theme-text-tertiary)]">
                    {modeDescs[mode]}
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--theme-text-quaternary)]">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </Link>
            );
          }

          return (
            <Link
              key={mode}
              to="/memorize/mode/$sourceType/$sourceId"
              params={{ sourceType: source.type, sourceId: String(source.id) }}
              search={practice ? { mode, practice: true } : { mode }}
              className="flex items-center gap-4 rounded-2xl bg-[var(--theme-bg-primary)] p-4 shadow-[var(--shadow-card)] transition-all hover:shadow-md active:scale-[0.98]"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bgClass}`}>
                {icon}
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-[var(--theme-text)]">
                  {modeLabels[mode]}
                </h3>
                <p className="text-[12px] text-[var(--theme-text-tertiary)]">
                  {modeDescs[mode]}
                </p>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--theme-text-quaternary)]">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
