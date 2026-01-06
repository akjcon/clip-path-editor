"use client";

import { useState, useCallback } from "react";
import { Point, Tool, EditorState } from "@/types";

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function useEditor() {
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

  const setTool = useCallback((tool: Tool) => {
    setState((s) => ({ ...s, tool, selectedPointIds: [], selectedHandleType: null }));
  }, []);

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

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: Point = {
      id: generateId(),
      x,
      y,
      handleIn: { x: -5, y: 0 }, // Default handle offset
      handleOut: { x: 5, y: 0 },
      isMirrored: true,
    };

    setState((s) => ({
      ...s,
      points: [...s.points, newPoint],
      selectedPointIds: [newPoint.id],
      selectedHandleType: null,
    }));
  }, []);

  // Insert a point at a specific index with given handles (for splitting curves)
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
        isMirrored: false, // Handles from split are usually not mirrored
      };

      setState((s) => {
        const newPoints = [...s.points];
        const prevIndex = index;
        const nextIndex = (index + 1) % s.points.length;

        // Update previous point's handleOut
        newPoints[prevIndex] = {
          ...newPoints[prevIndex],
          handleOut: prevPointHandleOut,
          isMirrored: false,
        };

        // Update next point's handleIn
        newPoints[nextIndex] = {
          ...newPoints[nextIndex],
          handleIn: nextPointHandleIn,
          isMirrored: false,
        };

        // Insert new point after prevIndex
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

  // Select a single point, optionally adding to selection with addToSelection flag
  const selectPoint = useCallback(
    (id: string | null, handleType: "in" | "out" | null = null, addToSelection: boolean = false) => {
      setState((s) => {
        if (id === null) {
          return { ...s, selectedPointIds: [], selectedHandleType: null };
        }

        if (addToSelection) {
          // Toggle selection
          const newSelection = s.selectedPointIds.includes(id)
            ? s.selectedPointIds.filter((pid) => pid !== id)
            : [...s.selectedPointIds, id];
          return { ...s, selectedPointIds: newSelection, selectedHandleType: handleType };
        }

        // Replace selection
        return { ...s, selectedPointIds: [id], selectedHandleType: handleType };
      });
    },
    []
  );

  // Set multiple selected point IDs at once (for marquee selection)
  const setSelectedPointIds = useCallback((ids: string[]) => {
    setState((s) => ({ ...s, selectedPointIds: ids, selectedHandleType: null }));
  }, []);

  // Move a single point (used during drag)
  const movePoint = useCallback((id: string, x: number, y: number) => {
    setState((s) => ({
      ...s,
      points: s.points.map((p) =>
        p.id === id ? { ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : p
      ),
    }));
  }, []);

  // Move all selected points by a delta
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

  // Move all points by a delta (for shape dragging)
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

          // If mirrored and not breaking, update opposite handle
          if (p.isMirrored && !breakMirror) {
            const mirroredHandle = { x: -x, y: -y };
            return {
              ...p,
              [handleType === "in" ? "handleIn" : "handleOut"]: newHandle,
              [oppositeType]: mirroredHandle,
            };
          }

          // Breaking mirror
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

  const deletePoint = useCallback((id: string) => {
    setState((s) => {
      const newPoints = s.points.filter((p) => p.id !== id);
      return {
        ...s,
        points: newPoints,
        selectedPointIds: s.selectedPointIds.filter((pid) => pid !== id),
        selectedHandleType: s.selectedPointIds.includes(id) ? null : s.selectedHandleType,
        // Re-open the shape if we drop below 3 points
        isClosed: newPoints.length < 3 ? false : s.isClosed,
      };
    });
  }, []);

  // Delete all selected points
  const deleteSelectedPoints = useCallback(() => {
    setState((s) => {
      if (s.selectedPointIds.length === 0) return s;
      const newPoints = s.points.filter((p) => !s.selectedPointIds.includes(p.id));
      return {
        ...s,
        points: newPoints,
        selectedPointIds: [],
        selectedHandleType: null,
        // Re-open the shape if we drop below 3 points
        isClosed: newPoints.length < 3 ? false : s.isClosed,
      };
    });
  }, []);

  const closeShape = useCallback(() => {
    setState((s) => ({
      ...s,
      isClosed: true,
      tool: "select", // Switch to select mode after closing
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

  const setPoints = useCallback((points: Point[]) => {
    setState((s) => ({ ...s, points }));
  }, []);

  const setIsClosed = useCallback((isClosed: boolean) => {
    setState((s) => ({ ...s, isClosed }));
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

  return {
    state,
    setTool,
    setImage,
    addPoint,
    insertPoint,
    selectPoint,
    setSelectedPointIds,
    movePoint,
    moveSelectedPoints,
    moveAllPoints,
    moveHandle,
    deletePoint,
    deleteSelectedPoints,
    closeShape,
    openShape,
    setPoints,
    setIsClosed,
    clearImage,
  };
}
