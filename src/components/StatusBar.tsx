"use client";

import { Tool } from "@/types";

interface StatusBarProps {
  zoom: number;
  cursorPosition: { x: number; y: number } | null;
  tool: Tool;
  pointCount: number;
  isClosed: boolean;
}

const toolHints: Record<Tool, string> = {
  select: "Click to select, drag to move points",
  add: "Click on image to add points",
  pan: "Click and drag to pan the canvas",
};

export function StatusBar({
  zoom,
  cursorPosition,
  tool,
  pointCount,
  isClosed,
}: StatusBarProps) {
  // Show special hint when shape can be closed
  const hint =
    tool === "add" && pointCount >= 2 && !isClosed
      ? "Click on first point to close shape"
      : toolHints[tool];

  return (
    <footer className="relative flex h-6 items-center justify-between border-t border-border bg-card px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>{hint}</span>
      </div>

      <div className="absolute left-1/2 -translate-x-1/2">
        <span>
          created by{" "}
          <a
            href="https://code.jconmedia.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Jack Consenstein
          </a>
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span>
          {pointCount} points
          {isClosed ? " (closed)" : pointCount >= 2 ? " (open)" : ""}
        </span>
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
