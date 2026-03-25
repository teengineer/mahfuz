import { useEffect, useCallback } from "react";
import { useWakeLock } from "~/hooks/useWakeLock";

interface ImmersiveLayoutProps {
  onClose: () => void;
  verseCounter: string;
  children: React.ReactNode;
}

export function ImmersiveLayout({ onClose, verseCounter, children }: ImmersiveLayoutProps) {
  useWakeLock(true);

  // Request fullscreen on mount
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      {/* Minimal header */}
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onClose}
          className="rounded-full p-2 text-white/50 hover:text-white/80"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <span className="text-[13px] tabular-nums text-white/40">{verseCounter}</span>
        <div className="w-8" /> {/* spacer for centering */}
      </div>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center overflow-hidden px-6">
        {children}
      </div>
    </div>
  );
}
