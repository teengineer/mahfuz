import { useState, useCallback, useMemo, useRef } from "react";
import type { Exercise, ExerciseAttempt, MatchingPair } from "@mahfuz/shared/types";
import { useTranslation } from "~/hooks/useTranslation";

interface MatchingExerciseProps {
  exercise: Exercise & { pairs: MatchingPair[] };
  onAnswer: (attempt: ExerciseAttempt) => void;
  exerciseNumber: number;
  totalExercises: number;
}

// 6 distinct match colors — enough for typical 4-pair exercises
const MATCH_COLORS = [
  { border: "border-blue-400", bg: "bg-blue-50", text: "text-blue-700", darkBorder: "dark:border-blue-600", darkBg: "dark:bg-blue-950/20", darkText: "dark:text-blue-300" },
  { border: "border-amber-400", bg: "bg-amber-50", text: "text-amber-700", darkBorder: "dark:border-amber-600", darkBg: "dark:bg-amber-950/20", darkText: "dark:text-amber-300" },
  { border: "border-violet-400", bg: "bg-violet-50", text: "text-violet-700", darkBorder: "dark:border-violet-600", darkBg: "dark:bg-violet-950/20", darkText: "dark:text-violet-300" },
  { border: "border-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700", darkBorder: "dark:border-emerald-600", darkBg: "dark:bg-emerald-950/20", darkText: "dark:text-emerald-300" },
  { border: "border-rose-400", bg: "bg-rose-50", text: "text-rose-700", darkBorder: "dark:border-rose-600", darkBg: "dark:bg-rose-950/20", darkText: "dark:text-rose-300" },
  { border: "border-cyan-400", bg: "bg-cyan-50", text: "text-cyan-700", darkBorder: "dark:border-cyan-600", darkBg: "dark:bg-cyan-950/20", darkText: "dark:text-cyan-300" },
];

function getMatchClasses(colorIndex: number) {
  const c = MATCH_COLORS[colorIndex % MATCH_COLORS.length];
  return `${c.border} ${c.bg} ${c.text} ${c.darkBorder} ${c.darkBg} ${c.darkText}`;
}

/** Drag-and-drop matching exercise with per-pair colors */
export function MatchingExercise({
  exercise,
  onAnswer,
  exerciseNumber,
  totalExercises,
}: MatchingExerciseProps) {
  const { t } = useTranslation();

  // Shuffle the Arabic letter rows
  const shuffledRows = useMemo(() => {
    const arr = exercise.pairs.map((p, i) => ({ left: p.left, right: p.right, pairIndex: i }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [exercise.id]);

  // Shuffle the draggable chips independently
  const shuffledChips = useMemo(() => {
    const arr = exercise.pairs.map((p, i) => ({ label: p.right, pairIndex: i }));
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [exercise.id]);

  // matched: pairIndex → colorIndex
  const [matched, setMatched] = useState<Map<number, number>>(new Map());
  const [mistakes, setMistakes] = useState(0);
  const [dragOverTarget, setDragOverTarget] = useState<number | null>(null); // pairIndex being hovered
  const [wrongDrop, setWrongDrop] = useState<number | null>(null); // pairIndex that got wrong drop
  const colorCounter = useRef(0);

  // Touch drag state
  const [touchDragging, setTouchDragging] = useState<number | null>(null); // pairIndex of chip being dragged
  const [touchPos, setTouchPos] = useState<{ x: number; y: number } | null>(null);
  const dropZoneRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const tryMatch = useCallback(
    (chipPairIndex: number, targetPairIndex: number) => {
      if (chipPairIndex === targetPairIndex) {
        // Correct match
        const newColor = colorCounter.current;
        colorCounter.current += 1;
        setMatched((prev) => {
          const next = new Map(prev);
          next.set(chipPairIndex, newColor);
          // Check if all matched
          if (next.size === exercise.pairs.length) {
            setTimeout(() => {
              onAnswer({
                exerciseId: exercise.id,
                selectedOptionIndex: 0,
                isCorrect: mistakes === 0,
                timestamp: Date.now(),
              });
            }, 300);
          }
          return next;
        });
      } else {
        // Wrong match
        setMistakes((m) => m + 1);
        setWrongDrop(targetPairIndex);
        setTimeout(() => setWrongDrop(null), 600);
      }
    },
    [exercise, mistakes, onAnswer],
  );

  // --- HTML5 Drag & Drop handlers ---
  const handleDragStart = useCallback(
    (e: React.DragEvent, pairIndex: number) => {
      e.dataTransfer.setData("text/plain", String(pairIndex));
      e.dataTransfer.effectAllowed = "move";
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, pairIndex: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverTarget(pairIndex);
    },
    [],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetPairIndex: number) => {
      e.preventDefault();
      setDragOverTarget(null);
      const chipPairIndex = parseInt(e.dataTransfer.getData("text/plain"), 10);
      if (isNaN(chipPairIndex)) return;
      tryMatch(chipPairIndex, targetPairIndex);
    },
    [tryMatch],
  );

  // --- Touch handlers for mobile ---
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, pairIndex: number) => {
      if (matched.has(pairIndex)) return;
      const touch = e.touches[0];
      setTouchDragging(pairIndex);
      setTouchPos({ x: touch.clientX, y: touch.clientY });
    },
    [matched],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (touchDragging === null) return;
      e.preventDefault();
      const touch = e.touches[0];
      setTouchPos({ x: touch.clientX, y: touch.clientY });

      // Check which drop zone we're over
      let found: number | null = null;
      for (const [pairIndex, el] of dropZoneRefs.current) {
        if (matched.has(pairIndex)) continue;
        const rect = el.getBoundingClientRect();
        if (
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          found = pairIndex;
          break;
        }
      }
      setDragOverTarget(found);
    },
    [touchDragging, matched],
  );

  const handleTouchEnd = useCallback(() => {
    if (touchDragging === null) return;
    if (dragOverTarget !== null) {
      tryMatch(touchDragging, dragOverTarget);
    }
    setTouchDragging(null);
    setTouchPos(null);
    setDragOverTarget(null);
  }, [touchDragging, dragOverTarget, tryMatch]);

  const remaining = exercise.pairs.length - matched.size;

  return (
    <div className="rounded-2xl bg-[var(--theme-bg-primary)] p-6 shadow-[var(--shadow-card)]">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[12px] text-[var(--theme-text-tertiary)]">
          {exerciseNumber}/{totalExercises}
        </span>
        <span className="text-[12px] font-medium text-primary-600">
          +{exercise.sevapPointReward} {t.learn.pointLabel}
        </span>
      </div>

      <p className="mb-1 text-[14px] font-medium text-[var(--theme-text)]">
        {t.learn.matching.instruction}
      </p>
      <p className="mb-4 text-[12px] text-[var(--theme-text-tertiary)]">
        {remaining} {t.learn.matching.pairsLeft}
      </p>

      {/* Arabic letter rows with drop zones */}
      <div className="mb-5 flex flex-col gap-2.5">
        {shuffledRows.map((row) => {
          const isMatched = matched.has(row.pairIndex);
          const matchColor = matched.get(row.pairIndex);
          const isOver = dragOverTarget === row.pairIndex && !isMatched;
          const isWrong = wrongDrop === row.pairIndex;

          return (
            <div key={row.pairIndex} className="flex items-center gap-2.5">
              {/* Arabic letter */}
              <div
                className={`flex h-14 w-16 shrink-0 items-center justify-center rounded-xl border-2 text-[20px] font-semibold transition-all ${
                  isMatched
                    ? getMatchClasses(matchColor!)
                    : "border-[var(--theme-border)] bg-[var(--theme-bg)] text-[var(--theme-text)]"
                }`}
              >
                <span className="arabic-text" dir="rtl">
                  {row.left}
                </span>
              </div>

              {/* Drop zone */}
              <div
                ref={(el) => {
                  if (el) dropZoneRefs.current.set(row.pairIndex, el);
                  else dropZoneRefs.current.delete(row.pairIndex);
                }}
                onDragOver={(e) => !isMatched && handleDragOver(e, row.pairIndex)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => !isMatched && handleDrop(e, row.pairIndex)}
                className={`flex h-14 flex-1 items-center justify-center rounded-xl border-2 text-[15px] font-medium transition-all ${
                  isMatched
                    ? `${getMatchClasses(matchColor!)} border-solid`
                    : isWrong
                      ? "border-dashed border-red-400 bg-red-50/50 dark:bg-red-950/10"
                      : isOver
                        ? "border-dashed border-primary-400 bg-primary-50/50 shadow-inner dark:bg-primary-950/10"
                        : "border-dashed border-[var(--theme-border-secondary,var(--theme-border))] bg-transparent"
                }`}
              >
                {isMatched ? (
                  <span>{row.right}</span>
                ) : (
                  <span className="text-[12px] text-[var(--theme-text-quaternary,var(--theme-text-tertiary))] opacity-40">
                    ···
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Draggable chips pool */}
      <div className="flex flex-wrap gap-2">
        {shuffledChips.map((chip) => {
          const isMatched = matched.has(chip.pairIndex);
          const isDragging = touchDragging === chip.pairIndex;

          if (isMatched) return null;

          return (
            <div
              key={chip.pairIndex}
              draggable
              onDragStart={(e) => handleDragStart(e, chip.pairIndex)}
              onTouchStart={(e) => handleTouchStart(e, chip.pairIndex)}
              onTouchMove={(e) => handleTouchMove(e)}
              onTouchEnd={handleTouchEnd}
              className={`cursor-grab select-none rounded-lg border-2 border-[var(--theme-border)] bg-[var(--theme-bg)] px-4 py-2.5 text-[14px] font-medium text-[var(--theme-text)] shadow-sm transition-all active:cursor-grabbing active:scale-95 ${
                isDragging ? "opacity-40" : "hover:shadow-md"
              }`}
            >
              {chip.label}
            </div>
          );
        })}
      </div>

      {/* Touch drag ghost */}
      {touchDragging !== null && touchPos && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border-2 border-primary-400 bg-primary-50 px-4 py-2.5 text-[14px] font-medium text-primary-700 shadow-lg dark:bg-primary-950/80 dark:text-primary-300"
          style={{
            left: touchPos.x - 40,
            top: touchPos.y - 24,
          }}
        >
          {exercise.pairs[touchDragging]?.right}
        </div>
      )}
    </div>
  );
}
