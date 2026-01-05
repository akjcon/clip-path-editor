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
    selectedPointId: null,
    selectedHandleType: null,
    imageDataUrl: null,
    imageWidth: 0,
    imageHeight: 0,
  });

  const setTool = useCallback((tool: Tool) => {
    setState((s) => ({ ...s, tool, selectedPointId: null, selectedHandleType: null }));
  }, []);

  const setImage = useCallback((dataUrl: string, width: number, height: number) => {
    setState((s) => ({
      ...s,
      imageDataUrl: dataUrl,
      imageWidth: width,
      imageHeight: height,
      points: [],
      selectedPointId: null,
      selectedHandleType: null,
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
      selectedPointId: newPoint.id,
      selectedHandleType: null,
    }));
  }, []);

  const selectPoint = useCallback((id: string | null, handleType: "in" | "out" | null = null) => {
    setState((s) => ({
      ...s,
      selectedPointId: id,
      selectedHandleType: handleType,
    }));
  }, []);

  const movePoint = useCallback((id: string, x: number, y: number) => {
    setState((s) => ({
      ...s,
      points: s.points.map((p) =>
        p.id === id ? { ...p, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : p
      ),
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
    setState((s) => ({
      ...s,
      points: s.points.filter((p) => p.id !== id),
      selectedPointId: s.selectedPointId === id ? null : s.selectedPointId,
      selectedHandleType: s.selectedPointId === id ? null : s.selectedHandleType,
    }));
  }, []);

  const setPoints = useCallback((points: Point[]) => {
    setState((s) => ({ ...s, points }));
  }, []);

  const clearImage = useCallback(() => {
    setState((s) => ({
      ...s,
      imageDataUrl: null,
      imageWidth: 0,
      imageHeight: 0,
      points: [],
      selectedPointId: null,
      selectedHandleType: null,
    }));
  }, []);

  return {
    state,
    setTool,
    setImage,
    addPoint,
    selectPoint,
    movePoint,
    moveHandle,
    deletePoint,
    setPoints,
    clearImage,
  };
}
