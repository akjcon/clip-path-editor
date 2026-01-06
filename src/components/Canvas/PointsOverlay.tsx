"use client";

import { memo } from "react";
import { Point } from "@/types";

interface PointsOverlayProps {
  points: Point[];
  selectedPointIds: string[];
  previewSelectedIds: string[];
  selectedHandleType: "in" | "out" | null;
  imageWidth: number;
  imageHeight: number;
  scale: number;
  isClosed: boolean;
  canClose: boolean;
  isDragging: boolean;
}

// Memoized component - only re-renders when points/selection actually change
export const PointsOverlay = memo(function PointsOverlay({
  points,
  selectedPointIds,
  previewSelectedIds,
  selectedHandleType,
  imageWidth,
  imageHeight,
  scale,
  isClosed,
  canClose,
  isDragging,
}: PointsOverlayProps) {
  if (points.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={imageWidth}
      height={imageHeight}
      style={{ overflow: "visible", userSelect: "none" }}
    >
      {/* Path outline - no fill, no hover effects */}
      {points.length >= 2 && (
        <path
          d={generatePathD(points, imageWidth, imageHeight, isClosed)}
          fill="none"
          stroke="rgba(255, 255, 255, 0.7)"
          strokeWidth={1 / scale}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Points and handles */}
      {points.map((point, index) => (
        <PointWithHandles
          key={point.id}
          point={point}
          index={index}
          isFirst={index === 0}
          isSelected={selectedPointIds.includes(point.id)}
          isPreviewSelected={previewSelectedIds.includes(point.id)}
          selectedHandleType={selectedPointIds.includes(point.id) ? selectedHandleType : null}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          scale={scale}
          canClose={canClose}
          isDragging={isDragging}
          showHandles={points.length > 1 && selectedPointIds.length === 1}
          isMirrored={point.isMirrored}
        />
      ))}
    </svg>
  );
});

interface PointWithHandlesProps {
  point: Point;
  index: number;
  isFirst: boolean;
  isSelected: boolean;
  isPreviewSelected: boolean;
  selectedHandleType: "in" | "out" | null;
  imageWidth: number;
  imageHeight: number;
  scale: number;
  canClose: boolean;
  isDragging: boolean;
  showHandles: boolean;
  isMirrored: boolean;
}

// Memoized individual point - prevents re-render of all points when one changes
const PointWithHandles = memo(function PointWithHandles({
  point,
  index,
  isFirst,
  isSelected,
  isPreviewSelected,
  selectedHandleType,
  imageWidth,
  imageHeight,
  scale,
  canClose,
  isDragging,
  showHandles,
  isMirrored,
}: PointWithHandlesProps) {
  const x = (point.x / 100) * imageWidth;
  const y = (point.y / 100) * imageHeight;
  const handleInX = x + (point.handleIn.x / 100) * imageWidth;
  const handleInY = y + (point.handleIn.y / 100) * imageHeight;
  const handleOutX = x + (point.handleOut.x / 100) * imageWidth;
  const handleOutY = y + (point.handleOut.y / 100) * imageHeight;

  // Show special styling for first point when shape can be closed
  const showCloseIndicator = isFirst && canClose && !isDragging;

  // Determine fill color based on state - subtle grays
  const getFillColor = () => {
    if (isSelected) return "#a1a1aa"; // Zinc-400 for selected
    if (isPreviewSelected) return "#d4d4d8"; // Zinc-300 for preview
    if (showCloseIndicator) return "#d4d4d8"; // Zinc-300 for close indicator
    return "#fff"; // White for unselected
  };

  return (
    <g style={{ pointerEvents: isDragging ? "none" : "auto" }}>
      {/* Handle lines - only show when selected and more than 1 point */}
      {isSelected && showHandles && (
        <>
          <line
            x1={handleInX}
            y1={handleInY}
            x2={x}
            y2={y}
            stroke={isMirrored ? "rgba(161, 161, 170, 0.6)" : "rgba(161, 161, 170, 0.4)"}
            strokeWidth={1 / scale}
            strokeDasharray={isMirrored ? "none" : `${3 / scale} ${2 / scale}`}
            style={{ pointerEvents: "none" }}
          />
          <line
            x1={x}
            y1={y}
            x2={handleOutX}
            y2={handleOutY}
            stroke={isMirrored ? "rgba(161, 161, 170, 0.6)" : "rgba(161, 161, 170, 0.4)"}
            strokeWidth={1 / scale}
            strokeDasharray={isMirrored ? "none" : `${3 / scale} ${2 / scale}`}
            style={{ pointerEvents: "none" }}
          />
        </>
      )}

      {/* Handle In - only show when selected and more than 1 point */}
      {isSelected && showHandles && (
        <circle
          cx={handleInX}
          cy={handleInY}
          r={5 / scale}
          fill={selectedHandleType === "in" ? "#a1a1aa" : "#fff"}
          stroke="#71717a"
          strokeWidth={1 / scale}
          data-point-id={point.id}
          data-handle-type="in"
          className="cursor-move"
        />
      )}

      {/* Handle Out - only show when selected and more than 1 point */}
      {isSelected && showHandles && (
        <circle
          cx={handleOutX}
          cy={handleOutY}
          r={5 / scale}
          fill={selectedHandleType === "out" ? "#a1a1aa" : "#fff"}
          stroke="#71717a"
          strokeWidth={1 / scale}
          data-point-id={point.id}
          data-handle-type="out"
          className="cursor-move"
        />
      )}

      {/* Close indicator ring - shows when hovering over first point to close */}
      {showCloseIndicator && (
        <circle
          cx={x}
          cy={y}
          r={12 / scale}
          fill="none"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeWidth={1 / scale}
          strokeDasharray={`${4 / scale} ${2 / scale}`}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Preview selection ring - shows during marquee drag */}
      {isPreviewSelected && !isSelected && (
        <circle
          cx={x}
          cy={y}
          r={11 / scale}
          fill="none"
          stroke="rgba(161, 161, 170, 0.6)"
          strokeWidth={1 / scale}
          strokeDasharray={`${3 / scale} ${2 / scale}`}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Main point - always visible, larger hit area */}
      <circle
        cx={x}
        cy={y}
        r={7 / scale}
        fill={getFillColor()}
        stroke="#71717a"
        strokeWidth={1 / scale}
        data-point-id={point.id}
        data-is-first-point={isFirst ? "true" : "false"}
        className="cursor-move"
      />

      {/* Point number label */}
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
});

// Generate SVG path d attribute from points
function generatePathD(points: Point[], width: number, height: number, isClosed: boolean): string {
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

  // Only close the path if shape is closed
  if (isClosed) {
    const last = toAbs(points[points.length - 1]);
    d += ` C ${last.handleOutX} ${last.handleOutY}, ${first.handleInX} ${first.handleInY}, ${first.x} ${first.y}`;
    d += " Z";
  }

  return d;
}
