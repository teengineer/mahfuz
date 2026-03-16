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
        // Match root letters
        if (r.root.includes(q)) return true;
        if (r.letters.includes(q)) return true;
        // Match meaning
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

  return (
    <div className="space-y-4">
      {/* Search */}
      <RootSearchBar value={search} onChange={setSearch} />

      {/* Frequency set pills */}
      {!search && (
        <FrequencySetPicker activeSet={activeSet} onSetChange={setActiveSet} />
      )}

      {/* Result count */}
      <p className="text-[12px] text-[var(--theme-text-tertiary)]">
        {filteredRoots.length} {t.discover.rootsFound}
      </p>

      {/* Root cards grid */}
      {filteredRoots.length > 0 ? (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
          {filteredRoots.slice(0, 100).map((entry) => (
            <RootCard
              key={entry.root}
              entry={entry}
              onClick={() => setSelectedRoot(entry)}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center">
          <p className="text-[14px] text-[var(--theme-text-tertiary)]">
            {t.common.noResults}
          </p>
        </div>
      )}

      {filteredRoots.length > 100 && (
        <p className="text-center text-[12px] text-[var(--theme-text-quaternary)]">
          +{filteredRoots.length - 100} {t.discover.rootsFound}
        </p>
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
