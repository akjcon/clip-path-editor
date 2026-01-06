"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { Point, Tool, EditorState, CanvasTransform, Project } from "@/types";

// ============================================================================
// Types
// ============================================================================

interface EditorContextValue {
  // Editor State
  state: EditorState;
  transform: CanvasTransform;
  isAnimatingTransform: boolean;

  // Tool actions
  setTool: (tool: Tool) => void;

  // Image actions
  setImage: (dataUrl: string, width: number, height: number) => void;
  clearImage: () => void;

  // Point actions
  addPoint: (x: number, y: number) => void;
  insertPoint: (
    index: number,
    x: number,
    y: number,
    handleIn: { x: number; y: number },
    handleOut: { x: number; y: number },
    prevPointHandleOut: { x: number; y: number },
    nextPointHandleIn: { x: number; y: number }
  ) => void;
  selectPoint: (id: string | null, handleType?: "in" | "out" | null, addToSelection?: boolean) => void;
  setSelectedPointIds: (ids: string[]) => void;
  movePoint: (id: string, x: number, y: number) => void;
  moveSelectedPoints: (deltaX: number, deltaY: number) => void;
  moveAllPoints: (deltaX: number, deltaY: number) => void;
  moveHandle: (id: string, handleType: "in" | "out", x: number, y: number, breakMirror: boolean) => void;
  deleteSelectedPoints: () => void;
  toggleHandleMirror: () => void;
  getSelectedPointsMirrored: () => boolean | null; // null if mixed, true if all mirrored, false if all not mirrored

  // Shape actions
  closeShape: () => void;
  openShape: () => void;
  setPoints: (points: Point[]) => void;
  setIsClosed: (isClosed: boolean) => void;

  // Transform actions
  setTransform: (transform: CanvasTransform) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomReset: () => void;
  fitToView: (imageWidth: number, imageHeight: number, containerWidth: number, containerHeight: number) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  startDrag: () => void;
  endDrag: () => void;

  // Project management
  projects: Project[];
  saveProject: (
    name: string,
    imageDataUrl: string,
    imageWidth: number,
    imageHeight: number,
    points: Point[],
    isClosed: boolean,
    existingId?: string
  ) => string;
  loadProject: (id: string) => Project | null;
  deleteProject: (id: string) => void;
}

// ============================================================================
// Context
// ============================================================================

const EditorContext = createContext<EditorContextValue | null>(null);

// ============================================================================
// Helper
// ============================================================================

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

const DEFAULT_TRANSFORM: CanvasTransform = {
  x: 0,
  y: 0,
  scale: 1,
};

const STORAGE_KEY = "clip-path-editor-projects";

// ============================================================================
// Provider
// ============================================================================

export function EditorProvider({ children }: { children: ReactNode }) {
  // -------------------------------------------------------------------------
  // Editor State
  // -------------------------------------------------------------------------
  const [state, setState] = useState<EditorState>({
    tool: "select",
    points: [],
    selectedPointIds: [],
    selectedHandleType: null,
    imageDataUrl: null,
    imageWidth: 0,
    imageHeight: 0,
    isClosed: false,
  });

  // -------------------------------------------------------------------------
  // Canvas Transform
  // -------------------------------------------------------------------------
  const [transform, setTransformState] = useState<CanvasTransform>(DEFAULT_TRANSFORM);
  const [isAnimatingTransform, setIsAnimatingTransform] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to trigger animated transform changes
  const setTransformAnimated = useCallback((newTransform: CanvasTransform) => {
    // Clear any pending animation timeout
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    // Enable animation
    setIsAnimatingTransform(true);
    // Update transform
    setTransformState(newTransform);
    // Disable animation after transition completes
    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimatingTransform(false);
    }, 250); // Slightly longer than the CSS transition
  }, []);

  // Non-animated transform (for wheel/drag operations)
  const setTransform = useCallback((newTransform: CanvasTransform) => {
    setTransformState(newTransform);
  }, []);

  const zoomIn = useCallback(() => {
    setTransformState((t) => {
      const newTransform = { ...t, scale: Math.min(t.scale * 1.2, 10) };
      // Trigger animation
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      setIsAnimatingTransform(true);
      animationTimeoutRef.current = setTimeout(() => setIsAnimatingTransform(false), 250);
      return newTransform;
    });
  }, []);

  const zoomOut = useCallback(() => {
    setTransformState((t) => {
      const newTransform = { ...t, scale: Math.max(t.scale / 1.2, 0.1) };
      // Trigger animation
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      setIsAnimatingTransform(true);
      animationTimeoutRef.current = setTimeout(() => setIsAnimatingTransform(false), 250);
      return newTransform;
    });
  }, []);

  const zoomReset = useCallback(() => {
    // Trigger animation
    if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
    setIsAnimatingTransform(true);
    setTransformState(DEFAULT_TRANSFORM);
    animationTimeoutRef.current = setTimeout(() => setIsAnimatingTransform(false), 250);
  }, []);

  const fitToView = useCallback(
    (imageWidth: number, imageHeight: number, containerWidth: number, containerHeight: number) => {
      if (!imageWidth || !imageHeight || !containerWidth || !containerHeight) {
        setTransformState(DEFAULT_TRANSFORM);
        return;
      }

      const padding = 100;
      const availableWidth = containerWidth - padding;
      const availableHeight = containerHeight - padding;

      const scaleX = availableWidth / imageWidth;
      const scaleY = availableHeight / imageHeight;
      const scale = Math.min(scaleX, scaleY, 2);

      // Trigger animation
      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      setIsAnimatingTransform(true);
      setTransformState({ x: 0, y: 0, scale });
      animationTimeoutRef.current = setTimeout(() => setIsAnimatingTransform(false), 250);
    },
    []
  );

  // -------------------------------------------------------------------------
  // History
  // -------------------------------------------------------------------------
  interface HistoryEntry {
    points: Point[];
    isClosed: boolean;
  }

  interface HistoryState {
    past: HistoryEntry[];
    present: HistoryEntry;
    future: HistoryEntry[];
  }

  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: { points: state.points, isClosed: state.isClosed },
    future: [],
  });

  const isUndoRedo = useRef(false);
  const isDragging = useRef(false);
  const dragStartState = useRef<HistoryEntry | null>(null);

  // Start a drag operation - saves current state for later commit
  const startDrag = useCallback(() => {
    isDragging.current = true;
    dragStartState.current = { points: state.points, isClosed: state.isClosed };
  }, [state.points, state.isClosed]);

  // End a drag operation - commits to history if state changed
  const endDrag = useCallback(() => {
    if (isDragging.current && dragStartState.current) {
      const startJson = JSON.stringify(dragStartState.current);
      const currentJson = JSON.stringify({ points: state.points, isClosed: state.isClosed });

      // Only add to history if state actually changed during drag
      if (startJson !== currentJson) {
        setHistory((h) => ({
          past: [...h.past, dragStartState.current!].slice(-50),
          present: { points: state.points, isClosed: state.isClosed },
          future: [],
        }));
      }
    }
    isDragging.current = false;
    dragStartState.current = null;
  }, [state.points, state.isClosed]);

  useEffect(() => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }

    // Skip history updates during drag operations
    if (isDragging.current) {
      return;
    }

    const currentEntry = { points: state.points, isClosed: state.isClosed };
    if (JSON.stringify(currentEntry) === JSON.stringify(history.present)) {
      return;
    }

    setHistory((h) => ({
      past: [...h.past, h.present].slice(-50),
      present: currentEntry,
      future: [],
    }));
  }, [state.points, state.isClosed]);

  const setPoints = useCallback((points: Point[]) => {
    setState((s) => ({ ...s, points }));
  }, []);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;

      const previous = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, -1);

      isUndoRedo.current = true;
      setState((s) => ({ ...s, points: previous.points, isClosed: previous.isClosed }));

      return {
        past: newPast,
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;

      const next = h.future[0];
      const newFuture = h.future.slice(1);

      isUndoRedo.current = true;
      setState((s) => ({ ...s, points: next.points, isClosed: next.isClosed }));

      return {
        past: [...h.past, h.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  // -------------------------------------------------------------------------
  // Local Storage (Projects)
  // -------------------------------------------------------------------------
  const [projects, setProjects] = useState<Project[]>([]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProjects(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage:", error);
    }
    setIsStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!isStorageLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error("Failed to save projects to localStorage:", error);
    }
  }, [projects, isStorageLoaded]);

  const saveProject = useCallback(
    (
      name: string,
      imageDataUrl: string,
      imageWidth: number,
      imageHeight: number,
      points: Point[],
      isClosed: boolean,
      existingId?: string
    ) => {
      const now = Date.now();

      if (existingId) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === existingId
              ? { ...p, name, imageDataUrl, imageWidth, imageHeight, points, isClosed, updatedAt: now }
              : p
          )
        );
        return existingId;
      }

      const newProject: Project = {
        id: generateId(),
        name,
        imageDataUrl,
        imageWidth,
        imageHeight,
        points,
        isClosed,
        createdAt: now,
        updatedAt: now,
      };

      setProjects((prev) => [newProject, ...prev]);
      return newProject.id;
    },
    []
  );

  const loadProject = useCallback(
    (id: string): Project | null => {
      return projects.find((p) => p.id === id) || null;
    },
    [projects]
  );

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // -------------------------------------------------------------------------
  // Tool Actions
  // -------------------------------------------------------------------------
  const setTool = useCallback((tool: Tool) => {
    setState((s) => ({ ...s, tool, selectedPointIds: [], selectedHandleType: null }));
  }, []);

  // -------------------------------------------------------------------------
  // Image Actions
  // -------------------------------------------------------------------------
  const setImage = useCallback((dataUrl: string, width: number, height: number) => {
    setState((s) => ({
      ...s,
      imageDataUrl: dataUrl,
      imageWidth: width,
      imageHeight: height,
      points: [],
      selectedPointIds: [],
      selectedHandleType: null,
      isClosed: false,
    }));
  }, []);

  const clearImage = useCallback(() => {
    setState((s) => ({
      ...s,
      imageDataUrl: null,
      imageWidth: 0,
      imageHeight: 0,
      points: [],
      selectedPointIds: [],
      selectedHandleType: null,
      isClosed: false,
    }));
  }, []);

  // -------------------------------------------------------------------------
  // Point Actions
  // -------------------------------------------------------------------------
  const addPoint = useCallback((x: number, y: number) => {
    setState((s) => {
      const prevPoint = s.points.length > 0 ? s.points[s.points.length - 1] : null;

      let handleIn = { x: -5, y: 0 };
      let handleOut = { x: 5, y: 0 };
      let updatedPoints = [...s.points];

      if (prevPoint) {
        // Calculate direction from previous point to new point
        const dx = x - prevPoint.x;
        const dy = y - prevPoint.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length > 1) {
          // Avoid tiny handles for close points
          const handleLength = 5;
          const nx = (dx / length) * handleLength;
          const ny = (dy / length) * handleLength;

          // New point's handles aligned to direction
          handleIn = { x: -nx, y: -ny };
          handleOut = { x: nx, y: ny };

          // Update previous point's handleOut to point toward new point
          const prevIndex = s.points.length - 1;
          updatedPoints[prevIndex] = {
            ...updatedPoints[prevIndex],
            handleOut: { x: nx, y: ny },
          };
        }
      }

      const newPoint: Point = {
        id: generateId(),
        x,
        y,
        handleIn,
        handleOut,
        isMirrored: true,
      };

      return {
        ...s,
        points: [...updatedPoints, newPoint],
        selectedPointIds: [newPoint.id],
        selectedHandleType: null,
      };
    });
  }, []);

  const insertPoint = useCallback(
    (
      index: number,
      x: number,
      y: number,
      handleIn: { x: number; y: number },
      handleOut: { x: number; y: number },
      prevPointHandleOut: { x: number; y: number },
      nextPointHandleIn: { x: number; y: number }
    ) => {
      const newPoint: Point = {
        id: generateId(),
        x,
        y,
        handleIn,
        handleOut,
        isMirrored: false,
      };

      setState((s) => {
        const newPoints = [...s.points];
        const prevIndex = index;
        const nextIndex = (index + 1) % s.points.length;

        newPoints[prevIndex] = {
          ...newPoints[prevIndex],
          handleOut: prevPointHandleOut,
          isMirrored: false,
        };

        newPoints[nextIndex] = {
          ...newPoints[nextIndex],
          handleIn: nextPointHandleIn,
          isMirrored: false,
        };

        newPoints.splice(index + 1, 0, newPoint);

        return {
          ...s,
          points: newPoints,
          selectedPointIds: [newPoint.id],
          selectedHandleType: null,
        };
      });
    },
    []
  );

  const selectPoint = useCallback(
    (id: string | null, handleType: "in" | "out" | null = null, addToSelection: boolean = false) => {
      setState((s) => {
        if (id === null) {
          return { ...s, selectedPointIds: [], selectedHandleType: null };
        }

        if (addToSelection) {
          const newSelection = s.selectedPointIds.includes(id)
            ? s.selectedPointIds.filter((pid) => pid !== id)
            : [...s.selectedPointIds, id];
          return { ...s, selectedPointIds: newSelection, selectedHandleType: handleType };
        }

        return { ...s, selectedPointIds: [id], selectedHandleType: handleType };
      });
    },
    []
  );

  const setSelectedPointIds = useCallback((ids: string[]) => {
    setState((s) => ({ ...s, selectedPointIds: ids, selectedHandleType: null }));
  }, []);

  const movePoint = useCallback((id: string, x: number, y: number) => {
    setState((s) => ({
      ...s,
      points: s.points.map((p) =>
        p.id === id ? { ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : p
      ),
    }));
  }, []);

  const moveSelectedPoints = useCallback((deltaX: number, deltaY: number) => {
    setState((s) => ({
      ...s,
      points: s.points.map((p) =>
        s.selectedPointIds.includes(p.id)
          ? {
              ...p,
              x: Math.max(0, Math.min(100, p.x + deltaX)),
              y: Math.max(0, Math.min(100, p.y + deltaY)),
            }
          : p
      ),
    }));
  }, []);

  const moveAllPoints = useCallback((deltaX: number, deltaY: number) => {
    setState((s) => ({
      ...s,
      points: s.points.map((p) => ({
        ...p,
        x: Math.max(0, Math.min(100, p.x + deltaX)),
        y: Math.max(0, Math.min(100, p.y + deltaY)),
      })),
    }));
  }, []);

  const moveHandle = useCallback(
    (id: string, handleType: "in" | "out", x: number, y: number, breakMirror: boolean) => {
      setState((s) => ({
        ...s,
        points: s.points.map((p) => {
          if (p.id !== id) return p;

          const newHandle = { x, y };
          const oppositeType = handleType === "in" ? "handleOut" : "handleIn";

          if (p.isMirrored && !breakMirror) {
            const mirroredHandle = { x: -x, y: -y };
            return {
              ...p,
              [handleType === "in" ? "handleIn" : "handleOut"]: newHandle,
              [oppositeType]: mirroredHandle,
            };
          }

          return {
            ...p,
            [handleType === "in" ? "handleIn" : "handleOut"]: newHandle,
            isMirrored: breakMirror ? false : p.isMirrored,
          };
        }),
      }));
    },
    []
  );

  const deleteSelectedPoints = useCallback(() => {
    setState((s) => {
      if (s.selectedPointIds.length === 0) return s;
      const newPoints = s.points.filter((p) => !s.selectedPointIds.includes(p.id));
      return {
        ...s,
        points: newPoints,
        selectedPointIds: [],
        selectedHandleType: null,
        isClosed: newPoints.length < 3 ? false : s.isClosed,
      };
    });
  }, []);

  // Check if all selected points are mirrored, all not mirrored, or mixed
  const getSelectedPointsMirrored = useCallback((): boolean | null => {
    const selectedPoints = state.points.filter((p) => state.selectedPointIds.includes(p.id));
    if (selectedPoints.length === 0) return null;

    const allMirrored = selectedPoints.every((p) => p.isMirrored);
    const noneMirrored = selectedPoints.every((p) => !p.isMirrored);

    if (allMirrored) return true;
    if (noneMirrored) return false;
    return null; // mixed
  }, [state.points, state.selectedPointIds]);

  const toggleHandleMirror = useCallback(() => {
    setState((s) => {
      const selectedPoints = s.points.filter((p) => s.selectedPointIds.includes(p.id));
      if (selectedPoints.length === 0) return s;

      // Determine target state: if ANY are mirrored, unlock all; otherwise lock all
      const anyMirrored = selectedPoints.some((p) => p.isMirrored);
      const shouldMirror = !anyMirrored;

      return {
        ...s,
        points: s.points.map((p) => {
          if (!s.selectedPointIds.includes(p.id)) return p;

          if (shouldMirror) {
            // Locking: make handles symmetric using average length
            const inLength = Math.sqrt(p.handleIn.x * p.handleIn.x + p.handleIn.y * p.handleIn.y);
            const outLength = Math.sqrt(p.handleOut.x * p.handleOut.x + p.handleOut.y * p.handleOut.y);
            const avgLength = (inLength + outLength) / 2;

            // Use handleOut direction (or default if zero length)
            let dirX = p.handleOut.x;
            let dirY = p.handleOut.y;
            const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);

            if (dirLength > 0.001) {
              dirX = (dirX / dirLength) * avgLength;
              dirY = (dirY / dirLength) * avgLength;
            } else {
              dirX = avgLength > 0 ? avgLength : 5;
              dirY = 0;
            }

            return {
              ...p,
              handleIn: { x: -dirX, y: -dirY },
              handleOut: { x: dirX, y: dirY },
              isMirrored: true,
            };
          } else {
            // Unlocking: just set flag, keep handles as-is
            return {
              ...p,
              isMirrored: false,
            };
          }
        }),
      };
    });
  }, []);

  // -------------------------------------------------------------------------
  // Shape Actions
  // -------------------------------------------------------------------------
  const closeShape = useCallback(() => {
    setState((s) => ({
      ...s,
      isClosed: true,
      tool: "select",
      selectedPointIds: [],
      selectedHandleType: null,
    }));
  }, []);

  const openShape = useCallback(() => {
    setState((s) => ({
      ...s,
      isClosed: false,
    }));
  }, []);

  const setIsClosed = useCallback((isClosed: boolean) => {
    setState((s) => ({ ...s, isClosed }));
  }, []);

  // -------------------------------------------------------------------------
  // Context Value
  // -------------------------------------------------------------------------
  const value: EditorContextValue = {
    // State
    state,
    transform,
    isAnimatingTransform,

    // Tool actions
    setTool,

    // Image actions
    setImage,
    clearImage,

    // Point actions
    addPoint,
    insertPoint,
    selectPoint,
    setSelectedPointIds,
    movePoint,
    moveSelectedPoints,
    moveAllPoints,
    moveHandle,
    deleteSelectedPoints,
    toggleHandleMirror,
    getSelectedPointsMirrored,

    // Shape actions
    closeShape,
    openShape,
    setPoints,
    setIsClosed,

    // Transform actions
    setTransform,
    zoomIn,
    zoomOut,
    zoomReset,
    fitToView,

    // History
    undo,
    redo,
    canUndo,
    canRedo,
    startDrag,
    endDrag,

    // Projects
    projects,
    saveProject,
    loadProject,
    deleteProject,
  };

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

// ============================================================================
// Hook
// ============================================================================

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used within an EditorProvider");
  }
  return context;
}
