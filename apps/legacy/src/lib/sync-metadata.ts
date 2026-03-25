/**
 * Centralized sync timestamps for LWW (Last-Write-Wins) conflict resolution.
 * Replaces per-store _syncUpdatedAt fields from v1.
 */

const STORAGE_KEY = "mahfuz-sync-timestamps";

type SyncEntity = "preferences" | "readingHistory" | "readingList";

interface SyncTimestamps {
  preferences: number;
  readingHistory: number;
  readingList: number;
}

const DEFAULTS: SyncTimestamps = {
  preferences: 0,
  readingHistory: 0,
  readingList: 0,
};

function load(): SyncTimestamps {
  if (typeof localStorage === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(timestamps: SyncTimestamps) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timestamps));
}

export function getSyncTimestamp(entity: SyncEntity): number {
  return load()[entity];
}

export function setSyncTimestamp(entity: SyncEntity, ts: number = Date.now()) {
  const current = load();
  current[entity] = ts;
  save(current);
}

export function getAllSyncTimestamps(): SyncTimestamps {
  return load();
}
