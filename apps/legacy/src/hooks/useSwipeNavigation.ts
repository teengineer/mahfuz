import { useRef, useEffect } from "react";

/**
 * Swipe navigation hook for touch devices.
 * Detects horizontal swipe gestures and fires callbacks.
 */
export function useSwipeNavigation(
  ref: React.RefObject<HTMLElement | null>,
  { onSwipeLeft, onSwipeRight }: { onSwipeLeft: () => void; onSwipeRight: () => void },
) {
  const pointerStart = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const SWIPE_THRESHOLD = 50;
    const MAX_VERTICAL_RATIO = 1.5;

    function onPointerDown(e: globalThis.PointerEvent) {
      if (e.pointerType === "touch" || e.pointerType === "mouse") {
        pointerStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
      }
    }

    function onPointerUp(e: globalThis.PointerEvent) {
      if (!pointerStart.current) return;
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      const elapsed = Date.now() - pointerStart.current.time;
      pointerStart.current = null;

      if (elapsed > 500) return;
      if (Math.abs(dx) < SWIPE_THRESHOLD) return;
      if (Math.abs(dy) > Math.abs(dx) * MAX_VERTICAL_RATIO) return;

      if (dx > 0) onSwipeRight();
      else onSwipeLeft();
    }

    function onPointerCancel() {
      pointerStart.current = null;
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [ref, onSwipeLeft, onSwipeRight]);
}
