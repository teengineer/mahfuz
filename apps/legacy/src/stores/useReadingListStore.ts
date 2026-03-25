/**
 * COMPAT SHIM — re-exports useReadingList as useReadingListStore.
 * Components should migrate to import from useReadingList directly.
 */
export { useReadingList as useReadingListStore } from "./useReadingList";
export type { ReadingListItem } from "./useReadingList";
