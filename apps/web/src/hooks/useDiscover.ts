/**
 * Query options for the Discover module.
 * All data is fetched from static JSON files in /discover/.
 */
import { queryOptions } from "@tanstack/react-query";
import { QUERY_KEYS } from "~/lib/query-keys";
import type {
  RootIndex,
  RootEnrichment,
  SurahMorphologyData,
  FrequencySetsData,
  SurahSyntaxData,
} from "@mahfuz/shared/types";
import type { ConceptIndex } from "@mahfuz/shared/types";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

/** Root index (~286KB, loaded once) */
export const rootsIndexQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.discover.rootsIndex(),
    queryFn: () => fetchJson<RootIndex>("/discover/roots-index.json"),
    staleTime: Infinity,
    gcTime: Infinity,
  });

/** Root enrichment data (~6KB) */
export const rootEnrichmentQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.discover.rootEnrichment(),
    queryFn: () => fetchJson<Record<string, RootEnrichment>>("/discover/roots-enrichment.json"),
    staleTime: Infinity,
    gcTime: Infinity,
  });

/** Frequency sets (~147KB, loaded once) */
export const frequencySetsQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.discover.frequencySets(),
    queryFn: () => fetchJson<FrequencySetsData>("/discover/frequency-sets.json"),
    staleTime: Infinity,
    gcTime: Infinity,
  });

/** Per-surah morphology data (20-300KB each) */
export const morphologyQueryOptions = (surahId: number) =>
  queryOptions({
    queryKey: QUERY_KEYS.discover.morphology(surahId),
    queryFn: () => fetchJson<SurahMorphologyData>(`/discover/morphology/${surahId}.json`),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: surahId >= 1 && surahId <= 114,
  });

/** Concept ontology (~11KB, loaded once) */
export const conceptsQueryOptions = () =>
  queryOptions({
    queryKey: QUERY_KEYS.discover.concepts(),
    queryFn: () => fetchJson<ConceptIndex>("/discover/concepts.json"),
    staleTime: Infinity,
    gcTime: Infinity,
  });

/** Per-surah syntax/i'rab data (30-400KB each) */
export const syntaxQueryOptions = (surahId: number) =>
  queryOptions({
    queryKey: QUERY_KEYS.discover.syntax(surahId),
    queryFn: () => fetchJson<SurahSyntaxData>(`/discover/irab/${surahId}.json`),
    staleTime: Infinity,
    gcTime: Infinity,
    enabled: surahId >= 1 && surahId <= 114,
  });
