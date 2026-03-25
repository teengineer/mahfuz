import { create } from "zustand";
import { persist } from "zustand/middleware";

type SyncStatus = "idle" | "syncing" | "error" | "offline";

interface SyncStoreState {
  status: SyncStatus;
  lastSyncAt: number | null;
  lastError: string | null;
  setStatus: (status: SyncStatus, error?: string) => void;
  setLastSyncAt: (ts: number) => void;
}

export const useSyncStore = create<SyncStoreState>()(
  persist(
    (set) => ({
      status: "idle",
      lastSyncAt: null,
      lastError: null,
      setStatus: (status, error) => set({ status, lastError: error || null }),
      setLastSyncAt: (ts) => set({ lastSyncAt: ts }),
    }),
    {
      name: "mahfuz-sync",
      partialize: (state) => ({ lastSyncAt: state.lastSyncAt }),
    },
  ),
);
