import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FocusToolType,
  FocusViewMode,
  AnnotationColor,
} from "~/lib/constants";
import { FOCUS_PEN_DEFAULTS } from "~/lib/constants";

/** An undo action records what was added or removed */
export interface StrokeAction {
  type: "add" | "erase";
  strokeId: string;
  /** JSON snapshot of the stroke, for redo after erase */
  data?: string;
}

interface FocusPersistedState {
  focusViewMode: FocusViewMode;
  focusFontSize: number;
  lastFocusPage: number;
  showAnnotations: boolean;
}

interface FocusSessionState {
  activeTool: FocusToolType;
  activeColor: AnnotationColor;
  isToolbarVisible: boolean;
  undoStack: StrokeAction[];
}

type FocusState = FocusPersistedState &
  FocusSessionState & {
    // Persisted setters
    setFocusViewMode: (v: FocusViewMode) => void;
    setFocusFontSize: (v: number) => void;
    setLastFocusPage: (v: number) => void;
    setShowAnnotations: (v: boolean) => void;
    // Session setters
    setActiveTool: (v: FocusToolType) => void;
    setActiveColor: (v: AnnotationColor) => void;
    setToolbarVisible: (v: boolean) => void;
    toggleToolbar: () => void;
    pushUndo: (action: StrokeAction) => void;
    popUndo: () => StrokeAction | undefined;
    clearUndo: () => void;
    /** Derived: pen width based on active tool */
    getPenWidth: () => number;
    /** Derived: pen opacity based on active tool */
    getPenOpacity: () => number;
  };

export const useFocusStore = create<FocusState>()(
  persist(
    (set, get) => ({
      // Persisted defaults
      focusViewMode: "mushaf",
      focusFontSize: 1.2,
      lastFocusPage: 1,
      showAnnotations: true,

      // Session defaults
      activeTool: "none",
      activeColor: "red",
      isToolbarVisible: true,
      undoStack: [],

      // Persisted setters
      setFocusViewMode: (v) => set({ focusViewMode: v }),
      setFocusFontSize: (v) =>
        set({ focusFontSize: Math.max(0.8, Math.min(2.0, v)) }),
      setLastFocusPage: (v) => set({ lastFocusPage: v }),
      setShowAnnotations: (v) => set({ showAnnotations: v }),

      // Session setters
      setActiveTool: (v) => set({ activeTool: v }),
      setActiveColor: (v) => set({ activeColor: v }),
      setToolbarVisible: (v) => set({ isToolbarVisible: v }),
      toggleToolbar: () => set((s) => ({ isToolbarVisible: !s.isToolbarVisible })),
      pushUndo: (action) =>
        set((s) => ({ undoStack: [...s.undoStack, action] })),
      popUndo: () => {
        const stack = get().undoStack;
        if (stack.length === 0) return undefined;
        const action = stack[stack.length - 1];
        set({ undoStack: stack.slice(0, -1) });
        return action;
      },
      clearUndo: () => set({ undoStack: [] }),

      // Derived
      getPenWidth: () => {
        const tool = get().activeTool;
        if (tool === "pen") return FOCUS_PEN_DEFAULTS.pen.width;
        if (tool === "highlighter") return FOCUS_PEN_DEFAULTS.highlighter.width;
        return FOCUS_PEN_DEFAULTS.pen.width;
      },
      getPenOpacity: () => {
        const tool = get().activeTool;
        if (tool === "pen") return FOCUS_PEN_DEFAULTS.pen.opacity;
        if (tool === "highlighter")
          return FOCUS_PEN_DEFAULTS.highlighter.opacity;
        return FOCUS_PEN_DEFAULTS.pen.opacity;
      },
    }),
    {
      name: "mahfuz-focus-prefs",
      partialize: (state) => ({
        focusViewMode: state.focusViewMode,
        focusFontSize: state.focusFontSize,
        lastFocusPage: state.lastFocusPage,
        showAnnotations: state.showAnnotations,
      }),
    },
  ),
);
