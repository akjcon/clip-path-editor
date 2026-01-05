"use client";

import { Tool } from "@/types";

interface StatusBarProps {
  zoom: number;
  cursorPosition: { x: number; y: number } | null;
  tool: Tool;
  pointCount: number;
}

const toolHints: Record<Tool, string> = {
  select: "Click to select, drag to move points",
  add: "Click on image to add points",
  delete: "Click on points to delete them",
};

export function StatusBar({
  zoom,
  cursorPosition,
  tool,
  pointCount,
}: StatusBarProps) {
  return (
    <footer className="flex h-6 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>{toolHints[tool]}</span>
      </div>

      <div className="flex items-center gap-4">
        <span>{pointCount} points</span>
        {cursorPosition && (
          <span>
            {cursorPosition.x.toFixed(1)}%, {cursorPosition.y.toFixed(1)}%
          </span>
        )}
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </footer>
  );
}
