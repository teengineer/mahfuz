import { Link, useMatches } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { useKidsStore } from "~/stores/useKidsStore";

interface KidsTab {
  to: string;
  labelKey: keyof typeof import("~/locales/tr/kids").kidsMessages.kids.nav;
  icon: (active: boolean) => React.ReactNode;
  matchPatterns: string[];
}

const KIDS_TABS: KidsTab[] = [
  {
    to: "/kids/map",
    labelKey: "map",
    icon: (active) => <MapIcon active={active} />,
    matchPatterns: ["/kids/map"],
  },
  {
    to: "/kids/surahs",
    labelKey: "surahs",
    icon: (active) => <SurahsIcon active={active} />,
    matchPatterns: ["/kids/surahs"],
  },
  {
    to: "/kids/quests",
    labelKey: "quests",
    icon: (active) => <QuestsIcon active={active} />,
    matchPatterns: ["/kids/quests"],
  },
  {
    to: "/kids/rewards",
    labelKey: "rewards",
    icon: (active) => <RewardsIcon active={active} />,
    matchPatterns: ["/kids/rewards"],
  },
  {
    to: "/kids/profile",
    labelKey: "profile",
    icon: (active) => <ProfileIcon active={active} />,
    matchPatterns: ["/kids/profile", "/kids/avatar"],
  },
];

export function KidsTabBar() {
  const { t } = useTranslation();
  const matches = useMatches();
  const stars = useKidsStore((s) => s.stars);
  const gems = useKidsStore((s) => s.gems);

  const currentPath = matches[matches.length - 1]?.fullPath ?? "";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 border-t-2 border-emerald-200 bg-white/90 backdrop-blur-xl lg:hidden"
      role="navigation"
      aria-label="Kids navigation"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {/* Star/gem counter strip */}
      <div className="flex items-center justify-center gap-4 border-b border-emerald-100 py-1 text-[12px] font-bold">
        <span className="flex items-center gap-1 text-amber-500">
          <StarMiniIcon /> {stars}
        </span>
        <span className="flex items-center gap-1 text-indigo-400">
          <GemMiniIcon /> {gems}
        </span>
      </div>

      {/* Tab buttons */}
      <div className="flex h-[64px] items-center justify-around px-1">
        {KIDS_TABS.map((tab) => {
          const active = tab.matchPatterns.some(
            (p) => currentPath === p || currentPath.startsWith(p),
          );
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-label={t.kids.nav[tab.labelKey]}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 transition-transform active:scale-90"
            >
              <div className="relative">
                {tab.icon(active)}
                {active && (
                  <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-emerald-500" />
                )}
              </div>
              <span
                className={`text-[11px] font-semibold leading-tight ${
                  active ? "text-emerald-600" : "text-gray-400"
                }`}
              >
                {t.kids.nav[tab.labelKey]}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ── Icons (28px for kids — larger touch targets) ────────────────

function MapIcon({ active }: { active: boolean }) {
  const cls = active ? "h-7 w-7 text-emerald-500" : "h-7 w-7 text-gray-400";
  return (
    <svg className={cls} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  );
}

function SurahsIcon({ active }: { active: boolean }) {
  const cls = active ? "h-7 w-7 text-emerald-500" : "h-7 w-7 text-gray-400";
  return (
    <svg className={cls} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function QuestsIcon({ active }: { active: boolean }) {
  const cls = active ? "h-7 w-7 text-emerald-500" : "h-7 w-7 text-gray-400";
  return (
    <svg className={cls} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  );
}

function RewardsIcon({ active }: { active: boolean }) {
  const cls = active ? "h-7 w-7 text-emerald-500" : "h-7 w-7 text-gray-400";
  return (
    <svg className={cls} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-5.54 0" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const cls = active ? "h-7 w-7 text-emerald-500" : "h-7 w-7 text-gray-400";
  return (
    <svg className={cls} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke={active ? "none" : "currentColor"} strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  );
}

// ── Mini reward icons ───────────────────────────────────────────

function StarMiniIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
    </svg>
  );
}

function GemMiniIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 1l3 5H7l3-5zM3 8l7 11L3 8zm14 0l-7 11 7-11zM3 8h14L10 19 3 8zm1-2l2-4h8l2 4H4z" />
    </svg>
  );
}
