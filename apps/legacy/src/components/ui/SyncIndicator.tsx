import { useState, useRef, useEffect } from "react";
import { useSyncStore } from "~/stores/useSyncStore";
import { useTranslation } from "~/hooks/useTranslation";

export function SyncIndicator() {
  const status = useSyncStore((s) => s.status);
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (status === "idle") {
    return (
      <span
        className="text-[var(--theme-text-quaternary)]"
        title={t.sync.synced}
      >
        <CloudCheckIcon />
      </span>
    );
  }

  if (status === "syncing") {
    return (
      <span
        className="animate-pulse text-primary-500"
        title={t.sync.syncing}
      >
        <CloudSyncIcon />
      </span>
    );
  }

  if (status === "error") {
    return (
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="text-amber-500 transition-colors hover:text-amber-600"
          aria-label={t.sync.error}
        >
          <CloudErrorIcon />
        </button>

        {open && (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-bg)] p-3 shadow-lg">
            <div className="flex items-start gap-2">
              <span className="mt-0.5 text-amber-500">
                <CloudErrorIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[var(--theme-text)]">
                  {t.sync.error}
                </p>
                <p className="mt-0.5 text-xs text-[var(--theme-text-tertiary)]">
                  {t.sync.errorDesc}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === "offline") {
    return (
      <span
        className="text-[var(--theme-text-quaternary)]"
        title={t.sync.offline ?? "Çevrimdışı"}
      >
        <CloudOfflineIcon />
      </span>
    );
  }

  return null;
}

function CloudOfflineIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
    </svg>
  );
}

function CloudCheckIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2 2 4-4" />
    </svg>
  );
}

function CloudSyncIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v4m0-4l-1.5 1.5M12 10l1.5 1.5" />
    </svg>
  );
}

function CloudErrorIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 3h.008" />
    </svg>
  );
}
