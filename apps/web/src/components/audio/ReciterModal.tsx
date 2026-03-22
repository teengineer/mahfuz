import { useState, useMemo } from "react";
import { useAudioStore } from "~/stores/useAudioStore";
import { CURATED_RECITERS } from "@mahfuz/shared/constants";
import type { CuratedReciter } from "@mahfuz/shared/constants";
import { useTranslation } from "~/hooks/useTranslation";
import {
  Dialog,
  DialogSheet,
  DialogTitle,
  DialogClose,
} from "~/components/ui/Dialog";

interface ReciterModalProps {
  open: boolean;
  onClose: () => void;
  onSelect?: (reciterId: number) => void;
}

const STYLE_LABELS: Record<string, string> = {
  Murattal: "Murattal",
  Mujawwad: "Mujawwad",
  Muallim: "Muallim",
  "Çocuk Tekrarı": "Çocuk Tekrarı",
};

/** Country filter chips — ordered by reciter count (descending) */
const COUNTRY_CHIPS = [
  "Suudi Arabistan",
  "Mısır",
  "Kuveyt",
  "BAE",
  "Irak",
  "Suriye",
  "Bosna",
];

export function ReciterModal({ open, onClose, onSelect }: ReciterModalProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const reciterId = useAudioStore((s) => s.reciterId);
  const setReciter = useAudioStore((s) => s.setReciter);
  const featuredIds = useAudioStore((s) => s.featuredReciterIds);
  const toggleFeatured = useAudioStore((s) => s.toggleFeaturedReciter);

  const featuredSet = useMemo(() => new Set(featuredIds), [featuredIds]);

  const filtered = useMemo(() => {
    let list = CURATED_RECITERS;
    if (countryFilter) {
      list = list.filter((r) => r.country.includes(countryFilter));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.country.toLowerCase().includes(q) ||
          r.style.toLowerCase().includes(q),
      );
    }
    return list;
  }, [search, countryFilter]);

  const isSearching = search.trim().length > 0 || countryFilter !== null;

  const featuredReciters = useMemo(
    () => CURATED_RECITERS.filter((r) => featuredSet.has(r.id)),
    [featuredSet],
  );

  const nonFeatured = useMemo(
    () => CURATED_RECITERS.filter((r) => !featuredSet.has(r.id)),
    [featuredSet],
  );

  const handleSelect = (id: number) => {
    if (onSelect) {
      onSelect(id);
    } else {
      setReciter(id);
    }
    onClose();
  };

  const handleToggleStar = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    toggleFeatured(id);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogSheet>
        <div className="relative z-10 w-full max-w-lg animate-slide-up rounded-t-2xl bg-[var(--theme-bg-primary)] p-5 shadow-modal sm:rounded-2xl">
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="text-[17px] font-semibold text-[var(--theme-text)]">
              {t.audio.reciterSelection}
            </DialogTitle>
            <DialogClose
              className="rounded-full p-1 text-[var(--theme-text-tertiary)] transition-colors hover:bg-[var(--theme-hover-bg)] hover:text-[var(--theme-text)]"
              aria-label={t.common.close}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </DialogClose>
          </div>

          <input
            type="text"
            placeholder={t.audio.searchReciter}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-3 w-full rounded-xl border border-[var(--theme-border)] bg-[var(--theme-input-bg)] px-4 py-2.5 text-[14px] text-[var(--theme-text)] outline-none placeholder:text-[var(--theme-text-quaternary)] focus:border-primary-500/40 focus:ring-2 focus:ring-primary-500/20"
          />

          {/* Country filter chips */}
          <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setCountryFilter(null)}
              className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                countryFilter === null
                  ? "bg-primary-600 text-white"
                  : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-pill-bg)]"
              }`}
            >
              {t.audio.countryAll}
            </button>
            {COUNTRY_CHIPS.map((country) => (
              <button
                key={country}
                onClick={() => setCountryFilter(countryFilter === country ? null : country)}
                className={`shrink-0 rounded-full px-3 py-1 text-[12px] font-medium transition-colors ${
                  countryFilter === country
                    ? "bg-primary-600 text-white"
                    : "bg-[var(--theme-hover-bg)] text-[var(--theme-text-secondary)] hover:bg-[var(--theme-pill-bg)]"
                }`}
              >
                {country}
              </button>
            ))}
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {isSearching ? (
              // Search / filter results
              filtered.length > 0 ? (
                <div className="space-y-0.5">
                  {filtered.map((r) => (
                    <ReciterRow
                      key={`${r.id}-${r.style}`}
                      reciter={r}
                      isActive={r.id === reciterId}
                      isFeatured={featuredSet.has(r.id)}
                      onSelect={handleSelect}
                      onToggleStar={handleToggleStar}
                    />
                  ))}
                </div>
              ) : (
                <p className="py-8 text-center text-[13px] text-[var(--theme-text-tertiary)]">
                  {t.common.noResults}
                </p>
              )
            ) : (
              // Default view: Featured + All
              <>
                {featuredReciters.length > 0 && (
                  <div className="mb-3">
                    <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                      {t.audio.featured}
                    </p>
                    <div className="space-y-0.5">
                      {featuredReciters.map((r) => (
                        <ReciterRow
                          key={`${r.id}-${r.style}`}
                          reciter={r}
                          isActive={r.id === reciterId}
                          isFeatured
                          onSelect={handleSelect}
                          onToggleStar={handleToggleStar}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--theme-text-tertiary)]">
                    {t.audio.allReciters}
                  </p>
                  <div className="space-y-0.5">
                    {nonFeatured.map((r) => (
                      <ReciterRow
                        key={`${r.id}-${r.style}`}
                        reciter={r}
                        isActive={r.id === reciterId}
                        isFeatured={false}
                        onSelect={handleSelect}
                        onToggleStar={handleToggleStar}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogSheet>
    </Dialog>
  );
}

function ReciterRow({
  reciter,
  isActive,
  isFeatured,
  onSelect,
  onToggleStar,
}: {
  reciter: CuratedReciter;
  isActive: boolean;
  isFeatured: boolean;
  onSelect: (id: number) => void;
  onToggleStar: (e: React.MouseEvent, id: number) => void;
}) {
  return (
    <button
      onClick={() => onSelect(reciter.id)}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
        isActive
          ? "bg-primary-600/10 text-primary-700"
          : isFeatured
            ? "border border-primary-500/20 bg-primary-50/30 text-[var(--theme-text)] hover:bg-primary-50/60"
            : "text-[var(--theme-text)] hover:bg-[var(--theme-hover-bg)]"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium">
          {reciter.name}
        </span>
        <span className="block text-[12px] text-[var(--theme-text-tertiary)]">
          {reciter.country} · {STYLE_LABELS[reciter.style] ?? reciter.style}
        </span>
      </span>
      {isActive && (
        <svg
          className="h-4 w-4 flex-shrink-0 text-primary-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
      <button
        onClick={(e) => onToggleStar(e, reciter.id)}
        className="flex-shrink-0 rounded-full p-1 transition-colors hover:bg-[var(--theme-hover-bg)]"
        aria-label={isFeatured ? "Remove from featured" : "Add to featured"}
      >
        <svg
          className={`h-4 w-4 ${isFeatured ? "text-amber-400" : "text-[var(--theme-text-quaternary)]"}`}
          viewBox="0 0 24 24"
          fill={isFeatured ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={isFeatured ? 0 : 1.5}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      </button>
    </button>
  );
}
