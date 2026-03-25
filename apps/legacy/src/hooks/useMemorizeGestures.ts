import { useEffect, useRef, useCallback } from "react";

interface MemorizeGestureOptions {
  onNextVerse: () => void;
  onPrevVerse: () => void;
  onTapCenter?: () => void;
}

const SWIPE_THRESHOLD = 60;
const MAX_VERTICAL_RATIO = 1.5;
const SWIPE_MAX_MS = 500;
const TAP_EDGE_WIDTH = 48;

/**
 * Simplified gesture handler for memorization modes.
 * Swipe right = next verse (RTL), left = prev verse.
 * Tap center = optional toggle.
 */
export function useMemorizeGestures(
  ref: React.RefObject<HTMLElement | null>,
  { onNextVerse, onPrevVerse, onTapCenter }: MemorizeGestureOptions,
) {
  const pointerStart = useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if ((e.target as HTMLElement).closest("button, a, input, [role='button']")) return;
    pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  }, []);

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

      // Swipe
      if (elapsed < SWIPE_MAX_MS && absDx >= SWIPE_THRESHOLD && absDy < absDx * MAX_VERTICAL_RATIO) {
        if (dx > 0) {
          onNextVerse(); // RTL: swipe right = next
        } else {
          onPrevVerse();
        }
        return;
      }

      // Tap
      if (absDx < 10 && absDy < 10 && elapsed < 300) {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const tapX = e.clientX - rect.left;

        if (tapX < TAP_EDGE_WIDTH) { onPrevVerse(); return; }
        if (tapX > rect.width - TAP_EDGE_WIDTH) { onNextVerse(); return; }
        onTapCenter?.();
      }
    },
    [onNextVerse, onPrevVerse, onTapCenter, ref],
  );

  const handlePointerCancel = useCallback(() => { pointerStart.current = null; }, []);

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
