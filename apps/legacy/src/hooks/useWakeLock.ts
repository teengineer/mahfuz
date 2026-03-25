import { useEffect, useRef } from "react";

/**
 * Keeps the screen awake using the Wake Lock API.
 * Re-acquires on visibility change (tab switch, lock/unlock).
 * No-op on unsupported browsers.
 */
export function useWakeLock(enabled: boolean = true) {
  const wakeLock = useRef<WakeLockSentinel | null>(null);

  useEffect(() => {
    if (!enabled || !("wakeLock" in navigator)) return;

    let released = false;

    async function acquire() {
      try {
        wakeLock.current = await navigator.wakeLock.request("screen");
        wakeLock.current.addEventListener("release", () => {
          wakeLock.current = null;
        });
      } catch {
        // Silently fail — user may have denied or API not available
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "visible" && !released) {
        acquire();
      }
    }

    acquire();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      released = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      wakeLock.current?.release().catch(() => {});
      wakeLock.current = null;
    };
  }, [enabled]);
}
