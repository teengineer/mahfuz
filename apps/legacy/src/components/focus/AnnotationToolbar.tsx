import { useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Chapter } from "@mahfuz/shared/types";
import { usePageLayout, getTotalPages } from "~/lib/page-layout";
import { useFocusStore } from "~/stores/useFocusStore";
import {
  ANNOTATION_COLORS,
  type FocusToolType,
  type AnnotationColor,
} from "~/lib/constants";
import {
  PenIcon,
  HighlighterIcon,
  EraserIcon,
  UndoIcon,
  MushafViewIcon,
  FlowingViewIcon,
  PageJumpIcon,
  ExitIcon,
  FontSizeIcon,
} from "./FocusIcons";
import { PageJumpDialog } from "./PageJumpDialog";

interface AnnotationToolbarProps {
  pageNumber: number;
  chapters: Chapter[];
  /** Called when user exits Focus mode */
  onExit?: () => void;
}

/**
 * Bottom toolbar for Focus Mode.
 * Auto-hides, slides in from bottom.
 * Contains: tool buttons, color dots, undo, view toggle, page jump, exit.
 */
export function AnnotationToolbar({
  pageNumber,
  chapters,
  onExit: onExitProp,
}: AnnotationToolbarProps) {
  const navigate = useNavigate();
  const isVisible = useFocusStore((s) => s.isToolbarVisible);
  const activeTool = useFocusStore((s) => s.activeTool);
  const activeColor = useFocusStore((s) => s.activeColor);
  const viewMode = useFocusStore((s) => s.focusViewMode);
  const fontSize = useFocusStore((s) => s.focusFontSize);
  const undoStack = useFocusStore((s) => s.undoStack);
  const setActiveTool = useFocusStore((s) => s.setActiveTool);
  const setActiveColor = useFocusStore((s) => s.setActiveColor);
  const setViewMode = useFocusStore((s) => s.setFocusViewMode);
  const setFontSize = useFocusStore((s) => s.setFocusFontSize);
  const popUndo = useFocusStore((s) => s.popUndo);

  const layout = usePageLayout();
  const totalPages = getTotalPages(layout);

  const [showPageJump, setShowPageJump] = useState(false);
  const [showFontSlider, setShowFontSlider] = useState(false);

  const handleToolClick = useCallback(
    (tool: FocusToolType) => {
      setActiveTool(activeTool === tool ? "none" : tool);
    },
    [activeTool, setActiveTool],
  );

  const handleUndo = useCallback(() => {
    popUndo();
    // Canvas will handle undo via store subscription
  }, [popUndo]);

  const handleExit = useCallback(() => {
    if (onExitProp) {
      onExitProp();
    } else {
      navigate({
        to: "/page/$pageNumber",
        params: { pageNumber: String(pageNumber) },
      });
    }
  }, [onExitProp, navigate, pageNumber]);

  const handlePageSelect = useCallback(
    (page: number) => {
      setShowPageJump(false);
      navigate({
        to: "/focus/$pageNumber",
        params: { pageNumber: String(page) },
      });
    },
    [navigate],
  );

  const handleToggleView = useCallback(() => {
    setViewMode(viewMode === "mushaf" ? "flowing" : "mushaf");
  }, [viewMode, setViewMode]);

  if (!isVisible) return null;

  const colorKeys = Object.keys(ANNOTATION_COLORS) as AnnotationColor[];

  return (
    <>
      {/* Toolbar */}
      <div className="focus-toolbar-in fixed bottom-0 left-0 right-0 z-30 safe-area-pb">
        <div className="mx-auto max-w-lg px-3 pb-3">
          <div className="flex items-center gap-1.5 rounded-2xl bg-[var(--theme-bg-elevated)] px-3 py-2.5 shadow-[var(--shadow-modal)]">
            {/* Drawing tools */}
            <ToolButton
              icon={<PenIcon width={18} height={18} />}
              active={activeTool === "pen"}
              onClick={() => handleToolClick("pen")}
              label="Pen"
            />
            <ToolButton
              icon={<HighlighterIcon width={18} height={18} />}
              active={activeTool === "highlighter"}
              onClick={() => handleToolClick("highlighter")}
              label="Highlighter"
            />
            <ToolButton
              icon={<EraserIcon width={18} height={18} />}
              active={activeTool === "eraser"}
              onClick={() => handleToolClick("eraser")}
              label="Eraser"
            />

            <Divider />

            {/* Color dots */}
            {colorKeys.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveColor(c)}
                className="flex h-8 w-8 items-center justify-center"
                aria-label={c}
              >
                <span
                  className="block h-5 w-5 rounded-full border-2 transition-transform"
                  style={{
                    backgroundColor: ANNOTATION_COLORS[c],
                    borderColor:
                      activeColor === c
                        ? "var(--theme-text)"
                        : "transparent",
                    transform: activeColor === c ? "scale(1.15)" : "scale(1)",
                  }}
                />
              </button>
            ))}

            <Divider />

            {/* Undo */}
            <ToolButton
              icon={<UndoIcon width={18} height={18} />}
              active={false}
              disabled={undoStack.length === 0}
              onClick={handleUndo}
              label="Undo"
            />

            {/* View toggle */}
            <ToolButton
              icon={
                viewMode === "mushaf" ? (
                  <FlowingViewIcon width={18} height={18} />
                ) : (
                  <MushafViewIcon width={18} height={18} />
                )
              }
              active={false}
              onClick={handleToggleView}
              label={viewMode === "mushaf" ? "Flowing" : "Mushaf"}
            />

            {/* Font size (flowing only) */}
            {viewMode === "flowing" && (
              <ToolButton
                icon={<FontSizeIcon width={18} height={18} />}
                active={showFontSlider}
                onClick={() => setShowFontSlider(!showFontSlider)}
                label="Font size"
              />
            )}

            <Divider />

            {/* Page info + jump */}
            <button
              type="button"
              onClick={() => setShowPageJump(true)}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold tabular-nums text-[var(--theme-text-secondary)] transition-colors hover:bg-[var(--theme-hover-bg)]"
            >
              <PageJumpIcon width={14} height={14} />
              {pageNumber}/{totalPages}
            </button>

            {/* Exit */}
            <ToolButton
              icon={<ExitIcon width={18} height={18} />}
              active={false}
              onClick={handleExit}
              label="Exit"
            />
          </div>

          {/* Font size slider */}
          {showFontSlider && viewMode === "flowing" && (
            <div className="focus-toolbar-in mt-2 flex items-center gap-3 rounded-xl bg-[var(--theme-bg-elevated)] px-4 py-2.5 shadow-[var(--shadow-elevated)]">
              <span className="text-[11px] text-[var(--theme-text-tertiary)]">
                A
              </span>
              <input
                type="range"
                min="0.8"
                max="2.0"
                step="0.1"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="h-1 flex-1 appearance-none rounded-full bg-[var(--theme-border)] accent-primary-600"
              />
              <span className="text-[15px] font-semibold text-[var(--theme-text-tertiary)]">
                A
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Page Jump Dialog */}
      {showPageJump && (
        <PageJumpDialog
          currentPage={pageNumber}
          chapters={chapters}
          onSelect={handlePageSelect}
          onClose={() => setShowPageJump(false)}
        />
      )}
    </>
  );
}

function ToolButton({
  icon,
  active,
  disabled,
  onClick,
  label,
}: {
  icon: React.ReactNode;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
        active
          ? "bg-primary-600 text-white shadow-sm"
          : disabled
            ? "text-[var(--theme-text-quaternary)]"
            : "text-[var(--theme-text-secondary)] hover:bg-[var(--theme-hover-bg)]"
      }`}
    >
      {icon}
    </button>
  );
}

function Divider() {
  return (
    <div className="mx-0.5 h-5 w-px bg-[var(--theme-border)]" />
  );
}
