"use client";

import { memo, useState, useCallback } from "react";
import { Point, EditorMode } from "@/types";

interface PathOverlayProps {
  points: Point[];
  imageWidth: number;
  imageHeight: number;
  scale: number;
  mode: EditorMode;
  selectedPointId: string | null;
  isolatedPointId: string | null;
  hoveredPointId: string | null;
  onPointHover: (id: string | null) => void;
  onPointClick: (id: string, e: React.MouseEvent) => void;
  onPointDoubleClick: (id: string) => void;
  onHandleMouseDown: (pointId: string, handleType: "in" | "out", e: React.MouseEvent) => void;
  onPathClick: (x: number, y: number, segmentIndex: number) => void;
  onShapeMouseDown: (e: React.MouseEvent) => void;
}

export const PathOverlay = memo(function PathOverlay({
  points,
  imageWidth,
  imageHeight,
  scale,
  mode,
  selectedPointId,
  isolatedPointId,
  hoveredPointId,
  onPointHover,
  onPointClick,
  onPointDoubleClick,
  onHandleMouseDown,
  onPathClick,
  onShapeMouseDown,
}: PathOverlayProps) {
  // Generate SVG path d attribute
  const pathD = generatePathD(points, imageWidth, imageHeight);

  // Determine if we should show handles for a point
  const shouldShowHandles = (pointId: string) => {
    if (mode === "building") return false;
    if (mode === "isolation") return pointId === isolatedPointId;
    // Normal mode: show for selected or hovered
    return pointId === selectedPointId || pointId === hoveredPointId;
  };

  // Get handle opacity
  const getHandleOpacity = (pointId: string) => {
    if (mode === "isolation" && pointId === isolatedPointId) return 1;
    if (pointId === selectedPointId) return 1;
    if (pointId === hoveredPointId) return 0.5;
    return 0;
  };

  return (
    <svg
      className="absolute inset-0"
      width={imageWidth}
      height={imageHeight}
      style={{ overflow: "visible" }}
    >
      {/* Clickable path for adding points (wider stroke for easier clicking) */}
      {points.length >= 2 && mode === "normal" && (
        <path
          d={pathD}
          fill="none"
          stroke="transparent"
          strokeWidth={20 / scale}
          className="cursor-crosshair"
          onClick={(e) => {
            const svg = e.currentTarget.ownerSVGElement;
            if (!svg) return;
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
            // Find which segment was clicked (simplified - just use position)
            const percentX = (svgP.x / imageWidth) * 100;
            const percentY = (svgP.y / imageHeight) * 100;
            onPathClick(percentX, percentY, 0);
          }}
        />
      )}

      {/* Visible path outline */}
      {points.length >= 2 && (
        <path
          d={pathD}
          fill="none"
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth={2 / scale}
          className="pointer-events-none"
        />
      )}

      {/* Shape drag area (filled path) */}
      {points.length >= 3 && mode === "normal" && (
        <path
          d={pathD}
          fill="rgba(59, 130, 246, 0.1)"
          stroke="none"
          className="cursor-move"
          onMouseDown={onShapeMouseDown}
        />
      )}

      {/* Points and handles */}
      {points.map((point, index) => {
        const x = (point.x / 100) * imageWidth;
        const y = (point.y / 100) * imageHeight;
        const isSelected = selectedPointId === point.id;
        const isIsolated = isolatedPointId === point.id;
        const showHandles = shouldShowHandles(point.id);
        const handleOpacity = getHandleOpacity(point.id);

        const handleInX = x + (point.handleIn.x / 100) * imageWidth;
        const handleInY = y + (point.handleIn.y / 100) * imageHeight;
        const handleOutX = x + (point.handleOut.x / 100) * imageWidth;
        const handleOutY = y + (point.handleOut.y / 100) * imageHeight;

        return (
          <g key={point.id}>
            {/* Handle lines */}
            {showHandles && (
              <g style={{ opacity: handleOpacity }}>
                <line
                  x1={handleInX}
                  y1={handleInY}
                  x2={x}
                  y2={y}
                  stroke="rgba(147, 51, 234, 0.8)"
                  strokeWidth={1.5 / scale}
                  className="pointer-events-none"
                />
                <line
                  x1={x}
                  y1={y}
                  x2={handleOutX}
                  y2={handleOutY}
                  stroke="rgba(147, 51, 234, 0.8)"
                  strokeWidth={1.5 / scale}
                  className="pointer-events-none"
                />
              </g>
            )}

            {/* Handle In */}
            {showHandles && (
              <circle
                cx={handleInX}
                cy={handleInY}
                r={5 / scale}
                fill="#fff"
                stroke="#a855f7"
                strokeWidth={2 / scale}
                style={{ opacity: handleOpacity }}
                className="cursor-move"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onHandleMouseDown(point.id, "in", e);
                }}
              />
            )}

            {/* Handle Out */}
            {showHandles && (
              <circle
                cx={handleOutX}
                cy={handleOutY}
                r={5 / scale}
                fill="#fff"
                stroke="#a855f7"
                strokeWidth={2 / scale}
                style={{ opacity: handleOpacity }}
                className="cursor-move"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onHandleMouseDown(point.id, "out", e);
                }}
              />
            )}

            {/* Point */}
            <circle
              cx={x}
              cy={y}
              r={7 / scale}
              fill={isSelected || isIsolated ? "#3b82f6" : "#fff"}
              stroke="#3b82f6"
              strokeWidth={2 / scale}
              className={mode === "isolation" && isIsolated ? "cursor-move" : "cursor-pointer"}
              onMouseEnter={() => onPointHover(point.id)}
              onMouseLeave={() => onPointHover(null)}
              onClick={(e) => {
                e.stopPropagation();
                onPointClick(point.id, e);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                onPointDoubleClick(point.id);
              }}
            />

            {/* Point number */}
            <text
              x={x}
              y={y - 14 / scale}
              textAnchor="middle"
              fill="#fff"
              fontSize={11 / scale}
              fontWeight="500"
              className="pointer-events-none select-none"
            >
              {index + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
});

// Generate SVG path d attribute from points
function generatePathD(points: Point[], width: number, height: number): string {
  if (points.length < 2) return "";

  const toAbs = (p: Point) => ({
    x: (p.x / 100) * width,
    y: (p.y / 100) * height,
    handleInX: ((p.x + p.handleIn.x) / 100) * width,
    handleInY: ((p.y + p.handleIn.y) / 100) * height,
    handleOutX: ((p.x + p.handleOut.x) / 100) * width,
    handleOutY: ((p.y + p.handleOut.y) / 100) * height,
  });

  const first = toAbs(points[0]);
  let d = `M ${first.x} ${first.y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = toAbs(points[i - 1]);
    const curr = toAbs(points[i]);
    d += ` C ${prev.handleOutX} ${prev.handleOutY}, ${curr.handleInX} ${curr.handleInY}, ${curr.x} ${curr.y}`;
  }

  // Close the path
  const last = toAbs(points[points.length - 1]);
  d += ` C ${last.handleOutX} ${last.handleOutY}, ${first.handleInX} ${first.handleInY}, ${first.x} ${first.y}`;
  d += " Z";

  return d;
}
