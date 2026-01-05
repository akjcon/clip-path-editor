"use client";

import { useState, useCallback } from "react";
import { CanvasTransform } from "@/types";

const DEFAULT_TRANSFORM: CanvasTransform = {
  x: 0,
  y: 0,
  scale: 1,
};

export function useCanvas() {
  const [transform, setTransform] = useState<CanvasTransform>(DEFAULT_TRANSFORM);

  const zoomIn = useCallback(() => {
    setTransform((t) => ({
      ...t,
      scale: Math.min(t.scale * 1.2, 10),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setTransform((t) => ({
      ...t,
      scale: Math.max(t.scale / 1.2, 0.1),
    }));
  }, []);

  const zoomReset = useCallback(() => {
    setTransform(DEFAULT_TRANSFORM);
  }, []);

  const fitToView = useCallback(
    (imageWidth: number, imageHeight: number, containerWidth: number, containerHeight: number) => {
      if (!imageWidth || !imageHeight || !containerWidth || !containerHeight) {
        setTransform(DEFAULT_TRANSFORM);
        return;
      }

      // Add some padding
      const padding = 100;
      const availableWidth = containerWidth - padding;
      const availableHeight = containerHeight - padding;

      const scaleX = availableWidth / imageWidth;
      const scaleY = availableHeight / imageHeight;
      const scale = Math.min(scaleX, scaleY, 2); // Max scale of 2 for fit

      setTransform({
        x: 0,
        y: 0,
        scale,
      });
    },
    []
  );

  return {
    transform,
    setTransform,
    zoomIn,
    zoomOut,
    zoomReset,
    fitToView,
  };
}
