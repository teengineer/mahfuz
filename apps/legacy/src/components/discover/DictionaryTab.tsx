import { useState, useMemo, useCallback } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { RootEntry } from "@mahfuz/shared/types";
import { rootsIndexQueryOptions, frequencySetsQueryOptions } from "~/hooks/useDiscover";
import { useTranslation } from "~/hooks/useTranslation";
import { RootSearchBar } from "./RootSearchBar";
import { FrequencySetPicker } from "./FrequencySetPicker";
import { RootCard } from "./RootCard";
import { RootDetailSheet } from "./RootDetailSheet";

export function DictionaryTab() {
  const { t, locale } = useTranslation();
  const { data: rootsIndex } = useSuspenseQuery(rootsIndexQueryOptions());
  const { data: freqData } = useSuspenseQuery(frequencySetsQueryOptions());

  const [search, setSearch] = useState("");
  const [activeSet, setActiveSet] = useState("top-50");
  const [selectedRoot, setSelectedRoot] = useState<RootEntry | null>(null);

  // Get all roots as array
  const allRoots = useMemo(
    () => Object.values(rootsIndex.roots) as RootEntry[],
    [rootsIndex],
  );

  // Get roots for the active frequency set
  const frequencyRootKeys = useMemo(() => {
    const set = freqData.sets.find((s) => s.id === activeSet);
    return new Set(set?.words.map((w) => w.root) ?? []);
  }, [freqData, activeSet]);

  // Filter roots by search + frequency set
  const filteredRoots = useMemo(() => {
    let roots = allRoots;

    // Apply frequency filter (unless searching)
    if (!search && activeSet !== "all") {
      roots = roots.filter((r) => frequencyRootKeys.has(r.root));
    }

    // Apply search
    if (search) {
      const q = search.trim();
      roots = roots.filter((r) => {
        if (r.root.includes(q)) return true;
        if (r.letters.includes(q)) return true;
        const meaning = locale === "en" ? r.meaning.en : r.meaning.tr;
        if (meaning.toLowerCase().includes(q.toLowerCase())) return true;
        return false;
      });
    }

    // Sort by frequency (most common first)
    return roots.sort((a, b) => b.count - a.count);
  }, [allRoots, search, activeSet, frequencyRootKeys, locale]);

  const handleRootClick = useCallback(
    (rootKey: string) => {
      const entry = rootsIndex.roots[rootKey];
      if (entry) setSelectedRoot(entry as RootEntry);
    },
    [rootsIndex],
  );

  const displayCount = Math.min(filteredRoots.length, 100);

  return (
    <div className="space-y-5">
      {/* Search */}
      <RootSearchBar value={search} onChange={setSearch} />

      {/* Frequency set pills */}
      {!search && (
        <FrequencySetPicker activeSet={activeSet} onSetChange={setActiveSet} />
      )}

      {/* Result count + filter context */}
      <div className="flex items-center justify-between">
        <p
          className="text-[12px] tabular-nums text-[var(--theme-text-tertiary)]"
          style={{ fontFamily: "var(--font-sans)" }}
        >
          <span className="font-bold text-[var(--theme-text-secondary)]">
            {filteredRoots.length}
          </span>{" "}
          {t.discover.rootsFound}
        </p>
        {filteredRoots.length > 100 && (
          <span
            className="text-[11px] tabular-nums text-[var(--theme-text-quaternary)]"
            style={{ fontFamily: "var(--font-sans)" }}
          >
            {displayCount} / {filteredRoots.length}
          </span>
        )}
      </div>

      {/* Root cards grid */}
      {filteredRoots.length > 0 ? (
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2 sm:gap-2">
          {filteredRoots.slice(0, 100).map((entry) => (
            <RootCard
              key={entry.root}
              entry={entry}
              maxCount={filteredRoots[0]?.count || 1}
              onClick={() => setSelectedRoot(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--theme-bg-secondary)]">
            <svg
              className="h-6 w-6 text-[var(--theme-text-quaternary)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
          <p className="text-[14px] font-medium text-[var(--theme-text-tertiary)]">
            {t.common.noResults}
          </p>
        </div>
      )}

      {/* Root detail sheet */}
      {selectedRoot && (
        <RootDetailSheet
          entry={selectedRoot}
          onClose={() => setSelectedRoot(null)}
          onRootClick={handleRootClick}
        />
      )}
    </div>
  );
}
