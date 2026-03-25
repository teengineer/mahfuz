import { useEffect, useRef, useCallback } from "react";
import { useFocusStore } from "~/stores/useFocusStore";

interface FocusGestureOptions {
  onNextPage: () => void;
  onPrevPage: () => void;
}

const SWIPE_THRESHOLD = 60;
const MAX_VERTICAL_RATIO = 1.5;
const SWIPE_MAX_MS = 500;
const TAP_EDGE_WIDTH = 48; // px from screen edge for tap navigation

/**
 * Handles Focus Mode navigation gestures:
 * - Swipe left/right for page navigation (RTL-aware: right = next)
 * - Tap on screen edges for page navigation
 * - Tap center to toggle toolbar visibility
 *
 * Only handles touch/mouse — pen (stylus) events are passed through
 * to the canvas layer.
 */
export function useFocusGestures(
  ref: React.RefObject<HTMLElement | null>,
  { onNextPage, onPrevPage }: FocusGestureOptions,
) {
  const pointerStart = useRef<{
    x: number;
    y: number;
    time: number;
    type: string;
  } | null>(null);
  const toggleToolbar = useFocusStore((s) => s.toggleToolbar);
  const activeTool = useFocusStore((s) => s.activeTool);

  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      // Ignore stylus when a tool is active — let canvas handle it
      if (e.pointerType === "pen" && activeTool !== "none") return;
      // Ignore if target is a button or interactive element
      if ((e.target as HTMLElement).closest("button, a, input, [role='button']"))
        return;

      pointerStart.current = {
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
        type: e.pointerType,
      };
    },
    [activeTool],
  );

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!pointerStart.current) return;
      const start = pointerStart.current;
      pointerStart.current = null;

      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      const elapsed = Date.now() - start.time;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // Check if it's a swipe
      if (
        elapsed < SWIPE_MAX_MS &&
        absDx >= SWIPE_THRESHOLD &&
        absDy < absDx * MAX_VERTICAL_RATIO
      ) {
        // RTL: swipe right = next page
        if (dx > 0) {
          onNextPage();
        } else {
          onPrevPage();
        }
        return;
      }

      // Check if it's a tap (minimal movement)
      if (absDx < 10 && absDy < 10 && elapsed < 300) {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const tapX = e.clientX - rect.left;

        // Tap on left edge → prev page
        if (tapX < TAP_EDGE_WIDTH) {
          onPrevPage();
          return;
        }
        // Tap on right edge → next page
        if (tapX > rect.width - TAP_EDGE_WIDTH) {
          onNextPage();
          return;
        }
        // Tap center → toggle toolbar
        toggleToolbar();
      }
    },
    [onNextPage, onPrevPage, toggleToolbar, ref],
  );

  const handlePointerCancel = useCallback(() => {
    pointerStart.current = null;
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointerup", handlePointerUp);
    el.addEventListener("pointercancel", handlePointerCancel);

    return () => {
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointerup", handlePointerUp);
      el.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [ref, handlePointerDown, handlePointerUp, handlePointerCancel]);
}
