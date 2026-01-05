"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Point } from "@/types";

interface HistoryState {
  past: Point[][];
  present: Point[];
  future: Point[][];
}

export function useHistory(points: Point[], setPoints: (points: Point[]) => void) {
  const [history, setHistory] = useState<HistoryState>({
    past: [],
    present: points,
    future: [],
  });

  // Track if change is from undo/redo to avoid adding to history
  const isUndoRedo = useRef(false);

  // Update history when points change (not from undo/redo)
  useEffect(() => {
    if (isUndoRedo.current) {
      isUndoRedo.current = false;
      return;
    }

    // Don't add to history if points are the same
    if (JSON.stringify(points) === JSON.stringify(history.present)) {
      return;
    }

    setHistory((h) => ({
      past: [...h.past, h.present].slice(-50), // Keep last 50 states
      present: points,
      future: [],
    }));
  }, [points]);

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.past.length === 0) return h;

      const previous = h.past[h.past.length - 1];
      const newPast = h.past.slice(0, -1);

      isUndoRedo.current = true;
      setPoints(previous);

      return {
        past: newPast,
        present: previous,
        future: [h.present, ...h.future],
      };
    });
  }, [setPoints]);

  const redo = useCallback(() => {
    setHistory((h) => {
      if (h.future.length === 0) return h;

      const next = h.future[0];
      const newFuture = h.future.slice(1);

      isUndoRedo.current = true;
      setPoints(next);

      return {
        past: [...h.past, h.present],
        present: next,
        future: newFuture,
      };
    });
  }, [setPoints]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  return { undo, redo, canUndo, canRedo };
}
