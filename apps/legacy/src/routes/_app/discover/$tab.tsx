import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { Loading } from "~/components/ui/Loading";
import { Skeleton } from "~/components/ui/Skeleton";
import { useTranslation } from "~/hooks/useTranslation";

const VALID_TABS = ["dictionary", "concepts", "irab", "map"] as const;
type TabType = (typeof VALID_TABS)[number];

const DictionaryTab = lazy(() => import("~/components/discover/DictionaryTab").then((m) => ({ default: m.DictionaryTab })));
const ConceptsTab = lazy(() => import("~/components/discover/ConceptsTab").then((m) => ({ default: m.ConceptsTab })));
const IrabTab = lazy(() => import("~/components/discover/IrabTab").then((m) => ({ default: m.IrabTab })));
const SemanticMapTab = lazy(() => import("~/components/discover/SemanticMapTab").then((m) => ({ default: m.SemanticMapTab })));

export const Route = createFileRoute("/_app/discover/$tab")({
  beforeLoad: ({ params }) => {
    if (!VALID_TABS.includes(params.tab as TabType)) {
      throw redirect({ to: "/discover/dictionary" });
    }
  },
  pendingComponent: () => (
    <div className="mx-auto max-w-[960px] px-5 py-5 sm:px-6 sm:py-10 lg:max-w-[1200px]">
      <Skeleton className="mb-5 h-8 w-48" />
      <Skeleton variant="card" className="mb-5 h-10" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} variant="card" className="h-28" />
        ))}
      </div>
    </div>
  ),
  component: DiscoverPage,
});

function DiscoverPage() {
  const { tab } = Route.useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const currentTab = tab as TabType;

  const TAB_OPTIONS: Array<{ value: TabType; label: string }> = [
    { value: "dictionary", label: t.discover.dictionary },
    { value: "concepts", label: t.discover.concepts },
    { value: "irab", label: t.discover.irab },
    { value: "map", label: t.discover.semanticMap },
  ];

  const setTab = (value: TabType) => {
    navigate({
      to: "/discover/$tab",
      params: { tab: value },
      replace: true,
    });
  };

  return (
    <div className="mx-auto max-w-[960px] px-5 py-5 sm:px-6 sm:py-10 lg:max-w-[1200px]">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-[24px] font-bold tracking-tight text-[var(--theme-text)] sm:text-[28px]">
          {t.discover.title}
        </h1>
        <p className="mt-1.5 text-[14px] text-[var(--theme-text-tertiary)]">
          {t.discover.subtitle}
        </p>
      </div>

      {/* Tabs — sticky underline style */}
      <div className="sticky top-0 z-10 mb-6 border-b border-[var(--theme-border)] bg-[var(--theme-bg)] sm:mb-8">
        <nav className="flex gap-0" role="tablist">
          {TAB_OPTIONS.map((opt) => {
            const active = currentTab === opt.value;
            return (
              <button
                key={opt.value}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(opt.value)}
                className={`relative px-5 py-3.5 text-[14px] font-medium transition-colors ${
                  active
                    ? "text-[var(--theme-text)]"
                    : "text-[var(--theme-text-tertiary)] hover:text-[var(--theme-text-secondary)]"
                }`}
              >
                {opt.label}
                {active && (
                  <span className="absolute inset-x-2 bottom-0 h-[2.5px] rounded-full bg-primary-600" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab content */}
      <Suspense fallback={<Loading text={t.common.loading} />}>
        {currentTab === "dictionary" && <DictionaryTab />}
        {currentTab === "concepts" && <ConceptsTab />}
        {currentTab === "irab" && <IrabTab />}
        {currentTab === "map" && <SemanticMapTab />}
      </Suspense>
    </div>
  );
}
