import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { Suspense } from "react";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { juzListQueryOptions } from "~/hooks/useJuz";
import { Loading } from "~/components/ui/Loading";
import { SegmentedControl } from "~/components/ui/SegmentedControl";
import { SurahListPanel } from "~/components/browse/SurahListPanel";
import { JuzListPanel } from "~/components/browse/JuzListPanel";
import { PageListPanel } from "~/components/browse/PageListPanel";
import { FihristPanel } from "~/components/browse/FihristPanel";

const VALID_TABS = ["surahs", "juzs", "pages", "index"] as const;
type TabType = (typeof VALID_TABS)[number];

const TAB_OPTIONS = [
  { value: "surahs" as TabType, label: "Sureler" },
  { value: "juzs" as TabType, label: "Cüzler" },
  { value: "pages" as TabType, label: "Sayfalar" },
  { value: "index" as TabType, label: "Fihrist" },
];

const TAB_TITLES: Record<TabType, string> = {
  surahs: "Sureler",
  juzs: "Cüzler",
  pages: "Sayfalar",
  index: "Fihrist",
};

export const Route = createFileRoute("/_app/browse/$tab")({
  validateSearch: (search: Record<string, unknown>) => ({
    topic: typeof search.topic === "number" ? search.topic : undefined,
  }),
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
  pendingComponent: () => <Loading text="Yükleniyor..." />,
  head: ({ params }) => ({
    meta: [{ title: `${TAB_TITLES[params.tab as TabType] ?? "Sureler"} | Mahfuz` }],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const { tab } = Route.useParams();
  const { topic } = Route.useSearch();
  const navigate = useNavigate();

  const currentTab = tab as TabType;

  const setTab = (value: TabType) => {
    navigate({
      to: "/browse/$tab",
      params: { tab: value },
      replace: true,
    });
  };

  return (
    <div className="mx-auto max-w-[680px] px-5 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 text-[28px] font-semibold tracking-[-0.02em] text-[var(--theme-text)]">
        {TAB_TITLES[currentTab]}
      </h1>

      {/* Tabs */}
      <div className="mb-6">
        <SegmentedControl
          options={TAB_OPTIONS}
          value={currentTab}
          onChange={setTab}
          stretch
        />
      </div>

      {/* Tab content */}
      <Suspense fallback={<Loading text="Yükleniyor..." />}>
        {currentTab === "surahs" && <SurahListPanel />}
        {currentTab === "juzs" && <JuzListPanel />}
        {currentTab === "pages" && <PageListPanel />}
        {currentTab === "index" && <FihristPanel initialTopic={topic} />}
      </Suspense>
    </div>
  );
}
