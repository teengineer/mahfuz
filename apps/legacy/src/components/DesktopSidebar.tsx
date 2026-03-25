import { useState, useSyncExternalStore } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { chaptersQueryOptions } from "~/hooks/useChapters";
import { usePreferencesStore } from "~/stores/usePreferencesStore";
import { useTranslation } from "~/hooks/useTranslation";
import { getSurahName } from "~/lib/surah-name";

export function DesktopSidebar() {
  const collapsedRaw = usePreferencesStore((s) => s.sidebarCollapsed);
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const collapsed = !hasMounted || collapsedRaw;
  const setCollapsed = usePreferencesStore((s) => s.setSidebarCollapsed);
  const { t, locale } = useTranslation();
  const [search, setSearch] = useState("");
  const params = useParams({ strict: false }) as { surahId?: string };
  const activeSurahId = params.surahId ? Number(params.surahId) : null;

  const { data: chapters } = useQuery(chaptersQueryOptions());

  const filtered = chapters?.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.name_simple.toLowerCase().includes(q) ||
      c.name_arabic.includes(q) ||
      String(c.id).includes(q) ||
      getSurahName(c.id, c.translated_name.name, locale).toLowerCase().includes(q)
    );
  });

  return (
    <aside
      className={`hidden lg:flex flex-col border-e border-[var(--theme-border)] bg-[var(--theme-bg-primary)]/80 backdrop-blur-xl transition-all duration-300 ${
        collapsed ? "w-0 overflow-hidden" : "w-[280px]"
      }`}
    >
      {!collapsed && (
        <>
          <div className="flex items-center gap-2 border-b border-[var(--theme-border)] px-3 py-2">
            <svg className="h-4 w-4 shrink-0 text-[var(--theme-text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.browse.searchSurah}
              className="flex-1 bg-transparent text-[13px] text-[var(--theme-text)] placeholder:text-[var(--theme-text-quaternary)] outline-none"
            />
            <button
              onClick={() => setCollapsed(true)}
              className="flex h-6 w-6 items-center justify-center rounded text-[var(--theme-text-quaternary)] hover:text-[var(--theme-text-secondary)]"
              aria-label={t.common.close}
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-none">
            {filtered?.map((c) => (
              <Link
                key={c.id}
                to="/$surahId"
                params={{ surahId: String(c.id) }}
                className={`flex items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-[var(--theme-hover-bg)] ${
                  activeSurahId === c.id
                    ? "bg-primary-600/10 text-primary-700"
                    : "text-[var(--theme-text)]"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--theme-pill-bg)] text-[11px] font-semibold tabular-nums text-[var(--theme-text-secondary)]">
                  {c.id}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium leading-tight">
                    {getSurahName(c.id, c.translated_name.name, locale)}
                  </span>
                  <span className="block text-[11px] text-[var(--theme-text-quaternary)]">
                    {c.verses_count} {t.browse.versesCount}
                  </span>
                </div>
                <span className="arabic-text text-[var(--theme-text-tertiary)]" style={{ fontSize: '14px' }}>{c.name_arabic}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </aside>
  );
}
