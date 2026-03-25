import { Link } from "@tanstack/react-router";
import { useTranslation } from "~/hooks/useTranslation";
import { getGreeting } from "~/lib/greeting";

interface HeroSectionProps {
  userName?: string | null;
}

export function HeroSection({ userName }: HeroSectionProps) {
  const { t } = useTranslation();
  const greeting = getGreeting(t);

  const openPalette = () => {
    document.dispatchEvent(new CustomEvent("mahfuz:open-palette"));
  };

  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl border border-[var(--theme-hero-border)] bg-[var(--theme-hero-bg)] p-5 sm:p-6">
      {/* Geometric Islamic motif — background decoration */}
      <div className="pointer-events-none absolute -right-6 -top-6 opacity-[0.18] sm:-right-4 sm:-top-4 sm:opacity-[0.22]" aria-hidden="true">
        <IslamicMotif />
      </div>

      <h1 className="relative mb-1 text-[22px] font-bold tracking-tight text-[var(--theme-text)] sm:text-[26px]">
        {greeting}{userName ? `, ${userName}` : ""}
      </h1>

      {/* Search bar */}
      <button
        type="button"
        onClick={openPalette}
        className="relative mt-3 flex w-full items-center gap-2.5 rounded-xl bg-[var(--theme-hero-search-bg)] px-3.5 py-2.5 text-left shadow-sm backdrop-blur-sm transition-all hover:bg-[var(--theme-hero-search-hover)] hover:shadow-md"
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
          {t.home.searchPlaceholder}
        </span>
        <kbd className="hidden rounded-md bg-[var(--theme-hover-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--theme-text-quaternary)] sm:inline-block">
          ⌘K
        </kbd>
      </button>

      {/* Nav pills */}
      <div className="relative mt-3 flex gap-2">
        <Link
          to="/library"
          className="flex items-center gap-1.5 rounded-full border border-[var(--theme-hero-pill-border)] bg-[var(--theme-hero-pill-bg)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--theme-text)] backdrop-blur-sm transition-all hover:bg-[var(--theme-hero-search-hover)] hover:shadow-sm active:scale-[0.97]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M12 13.489V21m0 0a7.5 7.5 0 003.75-6.488M12 21a7.5 7.5 0 01-3.75-6.488" />
          </svg>
          {t.home.library}
        </Link>
      </div>
    </section>
  );
}

/** 8-fold geometric Islamic star pattern */
function IslamicMotif({ size = 200 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer circle */}
      <circle cx="100" cy="100" r="95" stroke="var(--theme-hero-motif)" strokeWidth="2" />
      <circle cx="100" cy="100" r="80" stroke="var(--theme-hero-motif)" strokeWidth="1.5" />
      {/* 8-pointed star (two overlapping squares rotated 45°) */}
      <rect x="29" y="29" width="142" height="142" stroke="var(--theme-hero-motif)" strokeWidth="2" />
      <rect x="29" y="29" width="142" height="142" stroke="var(--theme-hero-motif)" strokeWidth="2" transform="rotate(45 100 100)" />
      {/* Inner 8-pointed star */}
      <rect x="50" y="50" width="100" height="100" stroke="var(--theme-hero-motif)" strokeWidth="1.5" />
      <rect x="50" y="50" width="100" height="100" stroke="var(--theme-hero-motif)" strokeWidth="1.5" transform="rotate(45 100 100)" />
      {/* Center circle */}
      <circle cx="100" cy="100" r="30" stroke="var(--theme-hero-motif)" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="15" stroke="var(--theme-hero-motif)" strokeWidth="1.5" />
      {/* Radial lines (8 directions) */}
      {[0, 45, 90, 135].map((angle) => (
        <line
          key={angle}
          x1="100"
          y1="5"
          x2="100"
          y2="195"
          stroke="var(--theme-hero-motif)"
          strokeWidth="0.75"
          transform={`rotate(${angle} 100 100)`}
        />
      ))}
      {/* Corner arabesques — small arcs between star points */}
      {[0, 90, 180, 270].map((angle) => (
        <path
          key={`arc-${angle}`}
          d="M100 20 Q115 35 130 20"
          stroke="var(--theme-hero-motif)"
          strokeWidth="1.5"
          fill="none"
          transform={`rotate(${angle} 100 100)`}
        />
      ))}
    </svg>
  );
}
