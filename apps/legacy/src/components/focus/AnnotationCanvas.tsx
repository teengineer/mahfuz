import { useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useFocusStore } from "~/stores/useFocusStore";
import { ANNOTATION_COLORS } from "~/lib/constants";
import type { AnnotationColor } from "~/lib/constants";
import { annotationPageQueryOptions } from "~/hooks/queries/annotations";
import { useSaveAnnotation } from "~/hooks/mutations/annotations";

/** Stroke point with pressure */
interface StrokePoint {
  x: number;
  y: number;
  p: number;
}

/** A completed stroke */
interface Stroke {
  id: string;
  tool: "pen" | "highlighter";
  color: string;
  width: number;
  opacity: number;
  points: StrokePoint[];
  timestamp: number;
}

interface AnnotationCanvasProps {
  pageNumber: number;
}

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const USER_ID = "anonymous";

/**
 * Canvas overlay for drawing annotations.
 * - Handles PointerEvents for stylus/touch drawing
 * - Double-buffered: committed strokes on offscreen canvas, active stroke on visible
 * - pointer-events: none when no tool is active (taps pass through)
 * - Auto-activates last pen tool when stylus detected
 * - Persists strokes to Dexie via TanStack Query mutations
 */
export function AnnotationCanvas({ pageNumber }: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const activePointsRef = useRef<StrokePoint[]>([]);
  const isDrawing = useRef(false);
  const lastToolRef = useRef<"pen" | "highlighter">("pen");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeTool = useFocusStore((s) => s.activeTool);
  const activeColor = useFocusStore((s) => s.activeColor);
  const showAnnotations = useFocusStore((s) => s.showAnnotations);
  const setActiveTool = useFocusStore((s) => s.setActiveTool);
  const pushUndo = useFocusStore((s) => s.pushUndo);
  const clearUndo = useFocusStore((s) => s.clearUndo);
  const getPenWidth = useFocusStore((s) => s.getPenWidth);
  const getPenOpacity = useFocusStore((s) => s.getPenOpacity);

  // Load saved strokes from Dexie
  const { data: savedPage } = useQuery(annotationPageQueryOptions(pageNumber));
  const saveAnnotation = useSaveAnnotation();

  // Debounced save to Dexie
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const strokes = strokesRef.current;
      saveAnnotation.mutate({
        id: `${USER_ID}:${pageNumber}`,
        userId: USER_ID,
        pageNumber,
        strokes: JSON.stringify(strokes),
        updatedAt: Date.now(),
      });
    }, 500);
  }, [pageNumber, saveAnnotation]);

  // Resize canvas to match container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas!.getBoundingClientRect();
      canvas!.width = rect.width * dpr;
      canvas!.height = rect.height * dpr;
      const ctx = canvas!.getContext("2d");
      ctx?.scale(dpr, dpr);

      // Create offscreen canvas at same size
      const offscreen = document.createElement("canvas");
      offscreen.width = canvas!.width;
      offscreen.height = canvas!.height;
      const offCtx = offscreen.getContext("2d");
      offCtx?.scale(dpr, dpr);
      offscreenRef.current = offscreen;

      // Redraw committed strokes
      redrawOffscreen();
      compositeToScreen();
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // Load strokes from Dexie when page data arrives
  useEffect(() => {
    if (savedPage?.strokes) {
      try {
        strokesRef.current = JSON.parse(savedPage.strokes) as Stroke[];
      } catch {
        strokesRef.current = [];
      }
    } else {
      strokesRef.current = [];
    }
    activePointsRef.current = [];
    isDrawing.current = false;
    clearUndo();
    redrawOffscreen();
    compositeToScreen();
  }, [savedPage, clearUndo]);

  function redrawOffscreen() {
    const offscreen = offscreenRef.current;
    if (!offscreen) return;
    const ctx = offscreen.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, offscreen.width / dpr, offscreen.height / dpr);

    for (const stroke of strokesRef.current) {
      drawStroke(ctx, stroke);
    }
  }

  function compositeToScreen() {
    const canvas = canvasRef.current;
    const offscreen = offscreenRef.current;
    if (!canvas || !offscreen) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    ctx.drawImage(offscreen, 0, 0, canvas.width / dpr, canvas.height / dpr);
  }

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
    if (stroke.points.length < 2) return;

    ctx.save();
    ctx.globalAlpha = stroke.opacity;
    ctx.strokeStyle = stroke.color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    const first = stroke.points[0];
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < stroke.points.length; i++) {
      const pt = stroke.points[i];
      ctx.lineWidth = stroke.width * (0.5 + pt.p * 0.5);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
    }

    ctx.restore();
  }

  function drawActiveStroke(points: StrokePoint[]) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    compositeToScreen();
    if (points.length < 2) return;

    const width = getPenWidth();
    const opacity = getPenOpacity();
    const color = ANNOTATION_COLORS[activeColor as AnnotationColor];

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i < points.length; i++) {
      const pt = points[i];
      ctx.lineWidth = width * (0.5 + pt.p * 0.5);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
    }

    ctx.restore();
  }

  // Eraser: remove strokes that intersect with the pointer
  const eraseAt = useCallback(
    (x: number, y: number) => {
      const ERASE_RADIUS = 15;
      const before = strokesRef.current.length;
      strokesRef.current = strokesRef.current.filter((stroke) => {
        for (const pt of stroke.points) {
          const dx = pt.x - x;
          const dy = pt.y - y;
          if (dx * dx + dy * dy < ERASE_RADIUS * ERASE_RADIUS) {
            pushUndo({
              type: "erase",
              strokeId: stroke.id,
              data: JSON.stringify(stroke),
            });
            return false;
          }
        }
        return true;
      });
      if (strokesRef.current.length !== before) {
        redrawOffscreen();
        compositeToScreen();
        scheduleSave();
      }
    },
    [pushUndo, scheduleSave],
  );

  // Pointer handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      // Auto-activate pen for stylus
      if (e.pointerType === "pen" && activeTool === "none") {
        setActiveTool(lastToolRef.current);
      }

      if (activeTool === "none") return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pressure = e.pressure || 0.5;

      canvas.setPointerCapture(e.pointerId);

      if (activeTool === "eraser") {
        eraseAt(x, y);
        isDrawing.current = true;
        return;
      }

      isDrawing.current = true;
      activePointsRef.current = [{ x, y, p: pressure }];
      if (activeTool === "pen" || activeTool === "highlighter") {
        lastToolRef.current = activeTool;
      }
    },
    [activeTool, setActiveTool, eraseAt],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pressure = e.pressure || 0.5;

      if (activeTool === "eraser") {
        eraseAt(x, y);
        return;
      }

      activePointsRef.current.push({ x, y, p: pressure });
      drawActiveStroke(activePointsRef.current);
    },
    [activeTool, eraseAt],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawing.current) return;
    isDrawing.current = false;

    if (activeTool === "eraser" || activePointsRef.current.length < 2) {
      activePointsRef.current = [];
      return;
    }

    const simplified = simplifyPoints(activePointsRef.current);
    const color = ANNOTATION_COLORS[activeColor as AnnotationColor];
    const stroke: Stroke = {
      id: generateId(),
      tool: activeTool as "pen" | "highlighter",
      color,
      width: getPenWidth(),
      opacity: getPenOpacity(),
      points: simplified,
      timestamp: Date.now(),
    };

    strokesRef.current.push(stroke);
    pushUndo({ type: "add", strokeId: stroke.id });
    activePointsRef.current = [];

    redrawOffscreen();
    compositeToScreen();
    scheduleSave();
  }, [activeTool, activeColor, pushUndo, getPenWidth, getPenOpacity, scheduleSave]);

  const isActive = activeTool !== "none";

  if (!showAnnotations) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-10"
      style={{
        pointerEvents: isActive ? "auto" : "none",
        touchAction: "none",
        cursor: isActive ? "crosshair" : "default",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
}

/**
 * Ramer-Douglas-Peucker simplification.
 * Reduces point count by ~70-80% while preserving shape.
 */
function simplifyPoints(
  points: StrokePoint[],
  epsilon: number = 1.0,
): StrokePoint[] {
  if (points.length <= 2) return points;

  let maxDist = 0;
  let maxIndex = 0;
  const first = points[0];
  const last = points[points.length - 1];

  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    const left = simplifyPoints(points.slice(0, maxIndex + 1), epsilon);
    const right = simplifyPoints(points.slice(maxIndex), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [first, last];
}

function perpendicularDistance(
  point: StrokePoint,
  lineStart: StrokePoint,
  lineEnd: StrokePoint,
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const px = point.x - lineStart.x;
    const py = point.y - lineStart.y;
    return Math.sqrt(px * px + py * py);
  }

  const num = Math.abs(
    dy * point.x -
      dx * point.y +
      lineEnd.x * lineStart.y -
      lineEnd.y * lineStart.x,
  );
  return num / Math.sqrt(lenSq);
}
