import { useRef, useCallback, useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useDisplayPrefs } from "~/stores/useDisplayPrefs";
import { useFocusStore } from "~/stores/useFocusStore";
import { useWakeLock } from "~/hooks/useWakeLock";
import { useFocusGestures } from "~/hooks/useFocusGestures";
import { usePageLayout, getTotalPages } from "~/lib/page-layout";

interface FocusLayoutProps {
  pageNumber: number;
  children: ReactNode;
  /** Overlay layer (canvas, toolbar, dialogs) */
  overlay?: ReactNode;
  /** Called when user exits Focus mode */
  onExit?: () => void;
}

/**
 * Full-viewport container for Focus Mode.
 * - Sets data-theme for theming
 * - Keeps screen awake
 * - Handles swipe/tap navigation
 * - Attempts fullscreen on supported browsers
 */
export function FocusLayout({
  pageNumber,
  children,
  overlay,
  onExit,
}: FocusLayoutProps) {
  const theme = useDisplayPrefs((s) => s.theme);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const setLastFocusPage = useFocusStore((s) => s.setLastFocusPage);
  const layout = usePageLayout();
  const totalPages = getTotalPages(layout);

  // Keep screen awake
  useWakeLock(true);

  // Save last read page
  useEffect(() => {
    setLastFocusPage(pageNumber);
  }, [pageNumber, setLastFocusPage]);

  // Try fullscreen on mount (Chrome/Android only — iPad Safari doesn't support it)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !document.fullscreenEnabled) return;

    el.requestFullscreen?.().catch(() => {});

    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, []);

  // Navigation callbacks
  const goNext = useCallback(() => {
    if (pageNumber < totalPages) {
      navigate({
        to: "/focus/$pageNumber",
        params: { pageNumber: String(pageNumber + 1) },
      });
    }
  }, [pageNumber, totalPages, navigate]);

  const goPrev = useCallback(() => {
    if (pageNumber > 1) {
      navigate({
        to: "/focus/$pageNumber",
        params: { pageNumber: String(pageNumber - 1) },
      });
    }
  }, [pageNumber, navigate]);

  // Gesture handling
  useFocusGestures(containerRef, {
    onNextPage: goNext,
    onPrevPage: goPrev,
  });

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key) {
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "Escape":
          if (onExit) onExit();
          else navigate({ to: "/page/$pageNumber", params: { pageNumber: String(pageNumber) } });
          break;
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, navigate, pageNumber, onExit]);

  return (
    <div
      ref={containerRef}
      data-theme={theme}
      className="fixed inset-0 overflow-hidden bg-[var(--theme-bg)]"
      style={{ touchAction: "none" }}
    >
      {/* Page content layer */}
      <div className="absolute inset-0 overflow-y-auto">{children}</div>

      {/* Overlay layer (canvas + toolbar + dialogs) */}
      {overlay}
    </div>
  );
}
