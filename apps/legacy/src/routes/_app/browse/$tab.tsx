import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { juzListQueryOptions } from "~/hooks/useJuz";
import { Loading } from "~/components/ui/Loading";
import { Skeleton } from "~/components/ui/Skeleton";

import { SurahListPanel } from "~/components/browse/SurahListPanel";
import { JuzListPanel } from "~/components/browse/JuzListPanel";
import { useTranslation } from "~/hooks/useTranslation";
import { ContinueReadingSection } from "~/components/browse/ContinueReadingSection";
import { DailyVerseCard } from "~/components/browse/DailyVerseCard";
import { QuickAccessSection } from "~/components/browse/QuickAccessSection";
import { TopicBand } from "~/components/browse/TopicBand";
import { HeroSection } from "~/components/home/HeroSection";
import { ReadingStatsCard } from "~/components/browse/ReadingStatsCard";


const VALID_TABS = ["surahs", "juzs", "nuzul"] as const;
type TabType = (typeof VALID_TABS)[number];

export const Route = createFileRoute("/_app/browse/$tab")({
  beforeLoad: ({ params }) => {
    if (!VALID_TABS.includes(params.tab as TabType)) {
      throw redirect({ to: "/browse/surahs" });
    }
  },
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(chaptersQueryOptions()),
      context.queryClient.ensureQueryData(juzListQueryOptions()),
    ]);
  },
  pendingComponent: () => (
    <div className="mx-auto max-w-[960px] px-5 py-5 sm:px-6 sm:py-10 lg:max-w-[1200px]">
      <Skeleton className="mb-5 h-8 w-40" />
      <Skeleton variant="card" className="mb-5 h-10" />
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl p-3">
            <Skeleton variant="circle" className="h-9 w-9" />
            <div className="flex-1">
              <Skeleton className="mb-1.5 h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
  component: BrowsePage,
});

function BrowsePage() {
  const { tab } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentTab = tab as TabType;

  const TAB_OPTIONS = [
    { value: "surahs" as TabType, label: t.browse.surahs },
    { value: "juzs" as TabType, label: t.browse.juzs },
    { value: "nuzul" as TabType, label: t.browse.nuzul },
  ];

  const setTab = (value: TabType) => {
    navigate({
      to: "/browse/$tab",
      params: { tab: value },
      replace: true,
    });
  };

  const { session } = Route.useRouteContext();

  return (
    <div className="mx-auto max-w-[960px] px-5 py-5 sm:px-6 sm:py-10 lg:max-w-[1200px]">
      {/* Hero — search + nav pills */}
      <HeroSection userName={session?.user?.name?.split(" ")[0]} />

      {/* Daily Verse */}
      <DailyVerseCard />

      {/* Continue Reading */}
      <ContinueReadingSection />

      {/* Reading Stats */}
      <ReadingStatsCard />

      {/* Quick Access */}
      <QuickAccessSection />

      {/* Topic Band — Fihrist categories */}
      <Suspense>
        <TopicBand />
      </Suspense>

      {/* Tabs — sticky underline style */}
      <div className="sticky top-0 z-10 mb-5 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] sm:mb-6">
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
      <Suspense fallback={<Loading text={t.common.loading} />}>
        {currentTab === "surahs" && <SurahListPanel />}
        {currentTab === "juzs" && <JuzListPanel />}
        {currentTab === "nuzul" && <SurahListPanel sort="revelation" />}
      </Suspense>
    </div>
  );
}
