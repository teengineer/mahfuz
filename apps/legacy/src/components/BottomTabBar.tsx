import { Link, useMatches } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";

interface TabItem {
  to: string;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  matchPatterns: string[];
  extraActive?: boolean;
  visible: boolean;
}

export function BottomTabBar() {
  const { t } = useTranslation();
  const matches = useMatches();

  const currentPath = matches[matches.length - 1]?.fullPath ?? "";
  const isSurahRoute = matches.some((m) => m.routeId === "/_app/$surahId/" || m.routeId === "/_app/$surahId/$verseNum");

  const tabs: TabItem[] = [
    {
      to: "/browse",
      label: t.nav.browse,
      icon: (active) => <BookIcon active={active} />,
      matchPatterns: ["/browse", "/page/", "/juz/"],
      extraActive: isSurahRoute,
      visible: true,
    },
    {
      to: "/library",
      label: t.nav.library,
      icon: (active) => <LibraryIcon active={active} />,
      matchPatterns: ["/library", "/learn", "/memorize"],
      visible: true,
    },
    {
      to: "/discover",
      label: t.nav.discover,
      icon: (active) => <DiscoverTabIcon active={active} />,
      matchPatterns: ["/discover"],
      visible: true,
    },
    {
      to: "/audio",
      label: t.nav.audio,
      icon: (active) => <HeadphonesTabIcon active={active} />,
      matchPatterns: ["/audio"],
      visible: true,
    },
    {
      to: "/settings",
      label: t.nav.settings,
      icon: (active) => <SettingsIcon active={active} />,
      matchPatterns: ["/settings"],
      visible: true,
    },
  ];

  const visibleTabs = tabs.filter((tab) => tab.visible);

  const isActive = (tab: TabItem) =>
    tab.extraActive || tab.matchPatterns.some((p) => currentPath === p || currentPath.startsWith(p));

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 border-t border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/80 backdrop-blur-xl backdrop-saturate-150 lg:hidden" role="navigation" aria-label="Main navigation" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex h-[60px] items-center justify-around px-2">
        {visibleTabs.map((tab) => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={tab.label}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-transform active:scale-90"
            >
              <div className="relative">
                {tab.icon(active)}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-primary-600" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium leading-tight ${
                  active
                    ? "text-primary-600"
                    : "text-[var(--theme-text-tertiary)]"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// --- Tab Bar Icons (24px, filled when active) ---

function BookIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.25 4.533A9.707 9.707 0 006 3a9.735 9.735 0 00-3.25.555.75.75 0 00-.5.707v14.25a.75.75 0 001 .707A8.237 8.237 0 016 18.75c1.995 0 3.823.707 5.25 1.886V4.533zM12.75 20.636A8.214 8.214 0 0118 18.75c.966 0 1.89.166 2.75.47a.75.75 0 001-.708V4.262a.75.75 0 00-.5-.707A9.735 9.735 0 0018 3a9.707 9.707 0 00-5.25 1.533v16.103z" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function LibraryIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.378 1.602a.75.75 0 00-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03zM21.75 7.93l-9 5.25v9l8.628-5.032a.75.75 0 00.372-.648V7.93zM11.25 22.18v-9l-9-5.25v8.57a.75.75 0 00.372.648l8.628 5.033z" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6M4.5 10.5v8.25A.75.75 0 005.25 19.5h13.5a.75.75 0 00.75-.75V10.5" />
    </svg>
  );
}

function DiscoverTabIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 5.47a.75.75 0 01.449.962l-2.12 6.36a.75.75 0 01-.468.468l-6.36 2.12a.75.75 0 01-.962-.962l2.12-6.36a.75.75 0 01.468-.468l6.36-2.12a.75.75 0 01.513 0z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

function HeadphonesTabIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  if (active) {
    return (
      <svg className="h-6 w-6 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
      </svg>
    );
  }
  return (
    <svg className="h-6 w-6 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
