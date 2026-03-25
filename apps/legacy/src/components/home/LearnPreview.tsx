import { Link } from "@tanstack/react-router";
import { CURRICULUM } from "@mahfuz/shared/data/learn/curriculum";
import { useLearnDashboard } from "~/hooks/useLearn";
import { useTranslation } from "~/hooks/useTranslation";
import { resolveNestedKey, interpolate } from "~/lib/i18n-utils";

const PREVIEW_STAGES = CURRICULUM.slice(0, 3);

export function LearnPreview() {
  const { t } = useTranslation();
  const { stageProgress, isLoading } = useLearnDashboard("anonymous");

  if (isLoading) return null;

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-semibold text-[var(--theme-text)]">
          {t.home.libraryPreview}
        </h2>
        <Link
          to="/library"
          className="text-[12px] font-medium text-primary-600 hover:text-primary-700"
        >
          {t.home.viewAll}
        </Link>
      </div>
      <div className="space-y-2">
        {PREVIEW_STAGES.map((stage) => {
          const sp = stageProgress.get(stage.id);
          const completed = sp?.completed || 0;
          const total = stage.lessons.length;
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
          const title = resolveNestedKey(t.learn as Record<string, any>, stage.titleKey) || stage.titleKey;

          return (
            <Link
              key={stage.id}
              to="/learn/stage/$stageId"
              params={{ stageId: String(stage.id) }}
              className="flex items-center gap-3 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg-primary)] p-3 transition-all hover:shadow-[var(--shadow-card)] active:scale-[0.98]"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-[13px] font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                {stage.id}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-[var(--theme-text)]">{title}</p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--theme-bg)]">
                    <div
                      className="h-full rounded-full bg-primary-600 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[10px] tabular-nums text-[var(--theme-text-quaternary)]">
                    {interpolate(t.home.stageCount, { completed, total })}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
