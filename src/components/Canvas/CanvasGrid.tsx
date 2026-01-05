"use client";

import { memo } from "react";
import { CanvasTransform } from "@/types";

interface CanvasGridProps {
  transform: CanvasTransform;
}

export const CanvasGrid = memo(function CanvasGrid({ transform }: CanvasGridProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: `
          linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
        backgroundPosition: `${transform.x}px ${transform.y}px`,
      }}
    />
  );
});
