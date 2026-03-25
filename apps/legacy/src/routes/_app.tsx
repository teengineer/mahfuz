import { createFileRoute, Outlet, Link, useRouter, useMatches, useLocation } from "@tanstack/react-router";
import { lazy, Suspense, useState, useEffect, useRef, useCallback, useMemo, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AudioBar } from "~/components/audio/AudioBar";
import { AudioProvider } from "~/components/audio/AudioProvider";
import { BottomTabBar } from "~/components/BottomTabBar";
import { DesktopSidebar } from "~/components/DesktopSidebar";
import { useAudioStore } from "~/stores/useAudioStore";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { THEME_OPTIONS } from "~/lib/constants";
import { useSyncStore } from "~/stores/useSyncStore";
import { HeaderSurahPicker } from "~/components/HeaderSurahPicker";
import { Dialog } from "~/components/ui/Dialog";
import { Popover, PopoverTrigger, PopoverContent } from "~/components/ui/Popover";
import { TooltipProvider } from "~/components/ui/Tooltip";
import { useTranslation } from "~/hooks/useTranslation";
import { signOut } from "~/lib/auth-client";
import { SyncIndicator } from "~/components/ui/SyncIndicator";
import type { Chapter } from "@mahfuz/shared/types";
import { usePageLayout, getTotalPages } from "~/lib/page-layout";
import { QUERY_KEYS } from "~/lib/query-keys";
import { getSurahName } from "~/lib/surah-name";
import { useVerseBookmarks } from "~/stores/useVerseBookmarks";
import { ReadingToolbar } from "~/components/quran/ReadingToolbar";
import { MahfuzLogo } from "~/components/icons";
import { useFontLoader } from "~/hooks/useFontLoader";
import { useI18nStore } from "~/stores/useI18nStore";
import { getAllLocaleConfigs, getLocaleConfig } from "~/locales/registry";
import type { Locale } from "~/locales/registry";

// Lazy-loaded heavy components
const CommandPalette = lazy(() => import("~/components/CommandPalette").then(m => ({ default: m.CommandPalette })));
const Onboarding = lazy(() => import("~/components/Onboarding").then(m => ({ default: m.Onboarding })));
const InstallPrompt = lazy(() => import("~/components/ui/InstallPrompt").then(m => ({ default: m.InstallPrompt })));

export const Route = createFileRoute("/_app")({
  component: AppLayout,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-lg font-semibold text-[var(--theme-text)]">404</p>
      <p className="mt-1 text-[14px] text-[var(--theme-text-secondary)]">
        Sayfa bulunamadı
      </p>
      <Link
        to="/browse"
        className="mt-4 rounded-xl bg-primary-600 px-6 py-2.5 text-[14px] font-medium text-white hover:bg-primary-700"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  ),
});

const NAV_ITEMS = [
  { to: "/browse", labelKey: "mahfuz" as const, icon: BookIcon },
  { to: "/library", labelKey: "library" as const, icon: LibraryIcon },
  { to: "/discover", labelKey: "discover" as const, icon: DiscoverIcon },
  { to: "/audio", labelKey: "audio" as const, icon: HeadphonesIcon },
] as const;

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  const [failed, setFailed] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-[13px] font-semibold text-primary-700">
      {image && !failed ? (
        <img
          src={image}
          alt={name || ""}
          width={32}
          height={32}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        initial
      )}
    </div>
  );
}

function AppLayout() {
  useFontLoader();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [bookmarksOpen, setBookmarksOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const i18nLocale = useI18nStore((s) => s.locale);
  const verseBookmarks = useVerseBookmarks((s) => s.bookmarks);
  const recentBookmarks = useMemo(
    () => [...verseBookmarks].sort((a, b) => b.addedAt - a.addedAt).slice(0, 5),
    [verseBookmarks],
  );
  const router = useRouter();
  const { session } = Route.useRouteContext();
  const audioVisible = useAudioStore((s) => s.isVisible);
  const matches = useMatches();
  const queryClient = useQueryClient();
  const { t, locale } = useTranslation();
  const location = useLocation();
  const layout = usePageLayout();
  const totalPages = getTotalPages(layout);
  const sidebarCollapsedRaw = usePreferencesStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = usePreferencesStore((s) => s.setSidebarCollapsed);
  const hasSeenOnboarding = usePreferencesStore((s) => s.hasSeenOnboarding);
  const theme = usePreferencesStore((s) => s.theme);
  const setTheme = usePreferencesStore((s) => s.setTheme);

  // Prevent SSR/client hydration mismatch: sidebar collapsed until client mounts
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const sidebarCollapsed = !hasMounted || sidebarCollapsedRaw;

  // Sync engine: start on auth, stop on logout/unmount
  const syncSetStatus = useSyncStore((s) => s.setStatus);
  const syncLastSyncAt = useSyncStore((s) => s.lastSyncAt);
  const syncSetLastSyncAt = useSyncStore((s) => s.setLastSyncAt);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    let destroyed = false;
    let engineRef: { stop(): void } | null = null;

    import("~/lib/sync-engine").then(({ SyncEngine }) => {
      if (destroyed) return;
      const engine = new SyncEngine(userId, syncLastSyncAt ?? 0, (status: string, error?: string) => {
        syncSetStatus(status, error);
        if (status === "idle") {
          syncSetLastSyncAt(engine.getLastSyncAt());
        }
      });
      engineRef = engine;
      engine.start();
    });

    return () => {
      destroyed = true;
      engineRef?.stop();
    };
    // Only re-run when userId changes, not on every syncLastSyncAt update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id]);

  // Track online/offline status for sync indicator
  useEffect(() => {
    const handleOnline = () => syncSetStatus("idle");
    const handleOffline = () => syncSetStatus("offline");
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (!navigator.onLine) syncSetStatus("offline");
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncSetStatus]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    await router.invalidate();
  }, [router]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Custom event: open palette from child components (e.g. homepage search bar)
  useEffect(() => {
    const handleOpenPalette = () => setPaletteOpen(true);
    document.addEventListener("mahfuz:open-palette", handleOpenPalette);
    return () => document.removeEventListener("mahfuz:open-palette", handleOpenPalette);
  }, []);

  // Detect surah page and get chapter info from cache
  const surahMatch = matches.find((m) => m.routeId === "/_app/$surahId/" || m.routeId === "/_app/$surahId/$verseNum");
  const surahId = (surahMatch?.params as { surahId?: string })?.surahId
    ? Number((surahMatch!.params as { surahId: string }).surahId)
    : null;
  const chapter = surahId
    ? queryClient.getQueryData<Chapter>(QUERY_KEYS.chapter(surahId))
    : null;
  const allChapters = queryClient.getQueryData<Chapter[]>(QUERY_KEYS.chapters());

  // Detect page route
  const pageMatch = matches.find((m) => m.routeId === "/_app/page/$pageNumber");
  const currentPage = (pageMatch?.params as { pageNumber?: string })?.pageNumber
    ? Number((pageMatch!.params as { pageNumber: string }).pageNumber)
    : null;

  // Detect juz detail route
  const juzMatch = matches.find((m) => m.routeId === "/_app/juz/$juzId");

  // Show inline search bar on detail pages
  const isDetailPage = !!(surahMatch || pageMatch || juzMatch);

  // Scroll-to-top + auto-hide header on scroll down (reading pages)
  const mainRef = useRef<HTMLElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const lastScrollTop = useRef(0);
  const scrollAccumulator = useRef(0);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onScroll = () => {
      const st = el.scrollTop;
      setShowScrollTop(st > 400);
      // Auto-hide header on detail pages with hysteresis to prevent flicker
      if (isDetailPage && st > 120) {
        const delta = st - lastScrollTop.current;
        // Accumulate scroll direction; reset on direction change
        if ((delta > 0 && scrollAccumulator.current < 0) || (delta < 0 && scrollAccumulator.current > 0)) {
          scrollAccumulator.current = 0;
        }
        scrollAccumulator.current += delta;
        // Require 40px accumulated scroll to toggle (was 5px)
        if (scrollAccumulator.current > 40) {
          setHeaderHidden(true);
        } else if (scrollAccumulator.current < -30) {
          setHeaderHidden(false);
        }
      } else {
        setHeaderHidden(false);
        scrollAccumulator.current = 0;
      }
      lastScrollTop.current = st;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [isDetailPage]);

  const scrollToTop = useCallback(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
    <div className="flex h-screen flex-col bg-[var(--theme-bg)]">
      {/* Dev banner — only in development */}
      {import.meta.env.DEV && (
        <div className="flex items-center justify-center bg-emerald-600 px-4 py-1.5 text-center text-[12px] font-medium text-white sm:text-[13px]">
          {t.nav.devBanner}
        </div>
      )}
      {/* Header — auto-hides on scroll down in reading pages */}
      <header className={`glass sticky top-0 z-30 h-[56px] border-b border-[var(--theme-border)] px-3 transition-transform duration-300 sm:px-6 lg:h-[64px] ${headerHidden ? "-translate-y-full" : "translate-y-0"}`}>
        <div className="relative flex h-full items-center justify-between">
          {/* Left: Logo + Chapter/page context */}
          <div className="flex min-w-0 items-center gap-1">
            {/* Logo */}
            <Link to="/" className="me-1.5 flex shrink-0 items-center gap-2 sm:me-3">
              <MahfuzLogo className="h-10 w-auto lg:h-11" />
              <span className="hidden text-[17px] font-semibold tracking-tight text-[var(--theme-text)] sm:inline">
                Mahfuz
              </span>
            </Link>

            {/* Chapter/page prev/next (surah detail) */}
            {chapter && (
              <div className="relative flex items-center border-s border-[var(--theme-border)] ps-2 ms-2">
                <Link
                  to="/$surahId"
                  params={{ surahId: String(Math.max(1, chapter.id - 1)) }}
                  className={`shrink-0 rounded-md p-1 transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] ${chapter.id > 1 ? "text-[var(--theme-text-tertiary)]" : "pointer-events-none invisible"}`}
                  aria-label={t.nav.prevSurah}
                >
                  <ChevronLeftIcon />
                </Link>
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg px-1 py-0.5 transition-colors hover:bg-[var(--theme-hover-bg)]"
                    >
                      <span className="text-[12px] font-medium text-[var(--theme-text-tertiary)]">
                        {chapter.id}
                      </span>
                      <span className="inline-grid text-base leading-none">
                        {allChapters?.map((c) => (
                          <span
                            key={c.id}
                            className={`arabic-text col-start-1 row-start-1 ${c.id === chapter.id ? "text-[var(--theme-text)]" : "invisible"}`}
                          >
                            {c.name_arabic}
                          </span>
                        ))}
                      </span>
                      <span className="hidden truncate text-[13px] font-medium text-[var(--theme-text-secondary)] sm:inline">
                        {getSurahName(chapter.id, chapter.translated_name.name, locale)}
                      </span>
                      <svg
                        className={`h-3 w-3 shrink-0 text-[var(--theme-text-tertiary)] transition-transform ${pickerOpen ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </PopoverTrigger>
                  {allChapters && (
                    <PopoverContent align="start" className="w-80 overflow-hidden p-0">
                      <HeaderSurahPicker
                        currentChapterId={chapter.id}
                        chapters={allChapters}
                        onSelect={(id) => {
                          setPickerOpen(false);
                          router.navigate({
                            to: "/$surahId",
                            params: { surahId: String(id) },
                          });
                        }}
                        onClose={() => setPickerOpen(false)}
                      />
                    </PopoverContent>
                  )}
                </Popover>
                <Link
                  to="/$surahId"
                  params={{ surahId: String(Math.min(114, chapter.id + 1)) }}
                  className={`shrink-0 rounded-md p-1 transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] ${chapter.id < 114 ? "text-[var(--theme-text-tertiary)]" : "pointer-events-none invisible"}`}
                  aria-label={t.nav.nextSurah}
                >
                  <ChevronRightIcon />
                </Link>
              </div>
            )}

            {/* Page prev/next (page detail) */}
            {currentPage && !chapter && (
              <div className="flex items-center gap-1 border-s border-[var(--theme-border)] ps-2 ms-2">
                {currentPage > 1 && (
                  <Link
                    to="/page/$pageNumber"
                    params={{ pageNumber: String(currentPage - 1) }}
                    className="rounded-md p-1 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                    aria-label={t.nav.prevPage}
                  >
                    <ChevronLeftIcon />
                  </Link>
                )}
                <span className="text-[13px] font-medium text-[var(--theme-text-secondary)]">
                  {t.common.page} {currentPage}
                </span>
                {currentPage < totalPages && (
                  <Link
                    to="/page/$pageNumber"
                    params={{ pageNumber: String(currentPage + 1) }}
                    className="rounded-md p-1 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                    aria-label={t.nav.nextPage}
                  >
                    <ChevronRightIcon />
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Center: Desktop nav */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                activeProps={{
                  className:
                    "flex items-center gap-1.5 rounded-lg px-2 py-1.5 bg-primary-600/10 text-primary-700 transition-colors",
                }}
                title={t.nav[item.labelKey]}
              >
                <item.icon />
                <span className="text-[12px] font-medium">
                  {t.nav[item.labelKey]}
                </span>
              </Link>
            ))}
          </nav>

          {/* Right: Search + Settings */}
          <div className="flex items-center gap-1">
            {/* Bookmarks popover */}
            <Popover open={bookmarksOpen} onOpenChange={setBookmarksOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`relative hidden items-center justify-center rounded-lg p-1.5 transition-colors lg:flex ${
                    bookmarksOpen
                      ? "bg-primary-600/10 text-primary-700"
                      : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                  }`}
                  title={t.nav.bookmarks}
                >
                  <BookmarkIcon />
                  {verseBookmarks.length > 0 && (
                    <span className="absolute -end-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary-600 text-[8px] font-bold text-white">
                      {verseBookmarks.length > 9 ? "9+" : verseBookmarks.length}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 overflow-hidden rounded-xl p-0">
                {recentBookmarks.length === 0 ? (
                  <div className="px-4 py-5 text-center">
                    <p className="text-[12px] text-[var(--theme-text-tertiary)]">{t.bookmarksPage.empty}</p>
                  </div>
                ) : (
                  <>
                    <div className="max-h-[240px] overflow-y-auto py-1">
                      {recentBookmarks.map((bm) => {
                        const [surah, verse] = bm.verseKey.split(":");
                        const ch = allChapters?.find((c) => c.id === Number(surah));
                        const name = ch ? getSurahName(ch.id, ch.translated_name.name, locale) : surah;
                        return (
                          <Link
                            key={bm.verseKey}
                            to="/$surahId"
                            params={{ surahId: surah }}
                            search={{ verse: Number(verse) }}
                            onClick={() => setBookmarksOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-start transition-colors hover:bg-[var(--theme-hover-bg)]"
                          >
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-600/10 text-[10px] font-semibold tabular-nums text-primary-600">
                              {verse}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--theme-text)]">
                              {name}
                            </span>
                            <span className="text-[10px] tabular-nums text-[var(--theme-text-quaternary)]">
                              {surah}:{verse}
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                    <Link
                      to="/bookmarks"
                      onClick={() => setBookmarksOpen(false)}
                      className="flex items-center justify-center border-t border-[var(--theme-border)] px-3 py-2 text-[11px] font-medium text-primary-600 transition-colors hover:bg-[var(--theme-hover-bg)]"
                    >
                      {t.home.viewAll}
                    </Link>
                  </>
                )}
              </PopoverContent>
            </Popover>
            {/* Desktop reading toolbar */}
            <div className="hidden lg:flex">
              <ReadingToolbar />
            </div>

            {/* Theme switcher popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="hidden items-center justify-center rounded-lg p-1.5 text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] lg:flex"
                  title={t.theme.settings}
                >
                  <ThemeIcon />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-2">
                <div className="flex gap-1.5">
                  {THEME_OPTIONS.map((opt) => {
                    const active = theme === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTheme(opt.value)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all ${
                          active ? "border-primary-600 scale-110" : "border-transparent hover:scale-105"
                        }`}
                        style={{ backgroundColor: opt.color, boxShadow: `inset 0 0 0 1px ${opt.border}` }}
                        title={(t.theme as Record<string, string>)[opt.value]}
                      >
                        {active && (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke={["dark", "dimmed", "teal", "black"].includes(opt.value) ? "#e5e5e5" : opt.value === "crystal" ? "#007AFF" : "#059669"} strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Language switcher popover */}
            <Popover open={langOpen} onOpenChange={setLangOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={`hidden items-center justify-center rounded-lg p-1.5 transition-colors lg:flex ${
                    langOpen
                      ? "bg-primary-600/10 text-primary-700"
                      : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                  }`}
                  title={t.settings.language}
                >
                  <GlobeIcon />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 overflow-hidden rounded-xl p-0">
                <div className="max-h-[320px] overflow-y-auto py-1">
                  {getAllLocaleConfigs().filter(({ config }) => config.complete).map(({ code, config }) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        useI18nStore.getState().setLocale(code);
                        setLangOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-start text-[13px] transition-colors hover:bg-[var(--theme-hover-bg)] ${
                        i18nLocale === code
                          ? "font-semibold text-primary-600"
                          : "text-[var(--theme-text-secondary)]"
                      }`}
                    >
                      <span>{config.displayName}</span>
                      {i18nLocale === code && (
                        <svg className="h-4 w-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Kids Mode */}
            <a
              href="/kids/map"
              className="flex items-center justify-center rounded-lg p-1.5 text-[var(--theme-text-secondary)] transition-colors hover:bg-emerald-50 hover:text-emerald-600"
              title={t.kids.nav.kidsMode}
            >
              <KidsModeIcon />
            </a>

            {/* Desktop settings gear */}
            <Link
              to="/settings"
              className="hidden items-center justify-center rounded-lg p-1.5 text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] lg:flex"
              activeProps={{
                className:
                  "hidden items-center justify-center rounded-lg p-1.5 text-primary-700 bg-primary-600/10 transition-colors lg:flex",
              }}
              title={t.nav.settings}
            >
              <SettingsIcon />
            </Link>

            {/* Auth: avatar or login */}
            {session ? (
              <div className="hidden items-center gap-1.5 lg:flex">
                <SyncIndicator />
                <Avatar name={session.user.name} image={session.user.image} />
                <button
                  onClick={handleSignOut}
                  className="rounded-lg p-1.5 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
                  title={t.nav.signOut}
                >
                  <LogOutIcon />
                </button>
              </div>
            ) : (
              <Link
                to="/auth/login"
                className="hidden items-center rounded-full bg-primary-600 px-3.5 py-1.5 text-[13px] font-medium text-white transition-all hover:bg-primary-700 active:scale-[0.97] lg:flex"
              >
                {t.nav.login}
              </Link>
            )}

            {/* Mobile search button */}
            <button
              onClick={() => setPaletteOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)] lg:hidden"
              aria-label={t.nav.search}
            >
              <SearchIcon />
            </button>
          </div>
        </div>
      </header>

      {/* Inline search bar on detail pages — use transform instead of conditional render to avoid layout shift */}
      {isDetailPage && !paletteOpen && (
        <div className={`border-b border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-2 transition-all duration-300 sm:px-6 ${headerHidden ? "pointer-events-none -mt-12 max-h-0 overflow-hidden border-b-0 py-0 opacity-0" : "max-h-20 opacity-100"}`}>
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="mx-auto flex w-full max-w-[720px] items-center gap-2.5 rounded-xl bg-[var(--theme-input-bg)] px-3.5 py-2 text-start transition-colors hover:bg-[var(--theme-bg-primary)] hover:shadow-[var(--shadow-elevated)] lg:max-w-[960px]"
          >
            <svg
              className="h-4 w-4 shrink-0 text-[var(--theme-text-tertiary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <span className="flex-1 text-[14px] text-[var(--theme-text-tertiary)]">
              {t.commandPalette.placeholder}
            </span>
            <kbd className="hidden rounded-md bg-[var(--theme-hover-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--theme-text-quaternary)] sm:inline-block">
              ⌘K
            </kbd>
          </button>
        </div>
      )}
      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <Suspense fallback={null}>
          {paletteOpen && (
            <CommandPalette onClose={() => setPaletteOpen(false)} />
          )}
        </Suspense>
      </Dialog>

      {/* Desktop sidebar + Page content */}
      <div className="flex flex-1 overflow-hidden">
      <DesktopSidebar />
      {sidebarCollapsed && (
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="hidden lg:flex items-center justify-center w-6 border-r border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/50 text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)] transition-colors"
          aria-label={t.nav.openSidebar}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7" /></svg>
        </button>
      )}
      <main ref={mainRef} className={`relative flex-1 overflow-y-auto ${audioVisible ? "pb-[124px]" : "pb-[76px]"} lg:pb-0`}>
        <Outlet />

        {/* Footer */}
        <footer className="border-t border-[var(--theme-border)] px-6 py-6">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <span className="text-[12px] text-[var(--theme-text-quaternary)]">
              {t.footer.brand}
            </span>
            <div className="flex items-center gap-4">
              <Link to="/credits" className="text-[12px] text-[var(--theme-text-quaternary)] transition-colors hover:text-[var(--theme-text-secondary)]">
                {t.nav.credits}
              </Link>
              <a href="https://github.com/theilgaz/mahfuz" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[var(--theme-text-quaternary)] transition-colors hover:text-[var(--theme-text-secondary)]">
                GitHub
              </a>
            </div>
          </div>
        </footer>

        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-[128px] end-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-[var(--theme-bg-primary)] shadow-[var(--shadow-elevated)] transition-all hover:shadow-[var(--shadow-modal)] active:scale-95 lg:bottom-6 lg:end-6"
            aria-label={t.nav.scrollToTop}
          >
            <svg className="h-5 w-5 text-[var(--theme-text-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
      </main>
      </div>

      {/* Audio engine + player bar */}
      <AudioProvider />
      <AudioBar />
      <BottomTabBar />
      <Suspense fallback={null}>{!hasSeenOnboarding && <Onboarding />}</Suspense>
      <Suspense fallback={null}><InstallPrompt /></Suspense>
    </div>
    </TooltipProvider>
  );
}

// -- Icons (simple inline SVG) --

function ChevronLeftIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6M4.5 10.5v8.25A.75.75 0 005.25 19.5h13.5a.75.75 0 00.75-.75V10.5" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
  );
}

function DiscoverIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

function HeadphonesIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}


function GlobeIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A8.966 8.966 0 013 12c0-1.777.515-3.435 1.404-4.832" />
    </svg>
  );
}

function LogOutIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}

function KidsModeIcon() {
  return (
    <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  );
}
