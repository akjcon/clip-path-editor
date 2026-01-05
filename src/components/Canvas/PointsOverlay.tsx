"use client";

import { memo } from "react";
import { Point } from "@/types";

interface PointsOverlayProps {
  points: Point[];
  selectedPointId: string | null;
  selectedHandleType: "in" | "out" | null;
  imageWidth: number;
  imageHeight: number;
  scale: number;
}

// Memoized component - only re-renders when points/selection actually change
export const PointsOverlay = memo(function PointsOverlay({
  points,
  selectedPointId,
  selectedHandleType,
  imageWidth,
  imageHeight,
  scale,
}: PointsOverlayProps) {
  if (points.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={imageWidth}
      height={imageHeight}
      style={{ overflow: "visible" }}
    >
      {/* Path outline */}
      {points.length >= 2 && (
        <path
          d={generatePathD(points, imageWidth, imageHeight)}
          fill="none"
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth={2 / scale}
        />
      )}

      {/* Points and handles */}
      {points.map((point, index) => (
        <PointWithHandles
          key={point.id}
          point={point}
          index={index}
          isSelected={selectedPointId === point.id}
          selectedHandleType={selectedPointId === point.id ? selectedHandleType : null}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          scale={scale}
        />
      ))}
    </svg>
  );
});

interface PointWithHandlesProps {
  point: Point;
  index: number;
  isSelected: boolean;
  selectedHandleType: "in" | "out" | null;
  imageWidth: number;
  imageHeight: number;
  scale: number;
}

// Memoized individual point - prevents re-render of all points when one changes
const PointWithHandles = memo(function PointWithHandles({
  point,
  index,
  isSelected,
  selectedHandleType,
  imageWidth,
  imageHeight,
  scale,
}: PointWithHandlesProps) {
  const x = (point.x / 100) * imageWidth;
  const y = (point.y / 100) * imageHeight;
  const handleInX = x + (point.handleIn.x / 100) * imageWidth;
  const handleInY = y + (point.handleIn.y / 100) * imageHeight;
  const handleOutX = x + (point.handleOut.x / 100) * imageWidth;
  const handleOutY = y + (point.handleOut.y / 100) * imageHeight;

  return (
    <g style={{ pointerEvents: "auto" }}>
      {/* Handle lines - only show when selected */}
      {isSelected && (
        <>
          <line
            x1={handleInX}
            y1={handleInY}
            x2={x}
            y2={y}
            stroke="rgba(147, 51, 234, 0.6)"
            strokeWidth={1 / scale}
            style={{ pointerEvents: "none" }}
          />
          <line
            x1={x}
            y1={y}
            x2={handleOutX}
            y2={handleOutY}
            stroke="rgba(147, 51, 234, 0.6)"
            strokeWidth={1 / scale}
            style={{ pointerEvents: "none" }}
          />
        </>
      )}

      {/* Handle In - only show when selected */}
      {isSelected && (
        <circle
          cx={handleInX}
          cy={handleInY}
          r={5 / scale}
          fill={selectedHandleType === "in" ? "#a855f7" : "#fff"}
          stroke="#a855f7"
          strokeWidth={1.5 / scale}
          data-point-id={point.id}
          data-handle-type="in"
          className="cursor-move"
        />
      )}

      {/* Handle Out - only show when selected */}
      {isSelected && (
        <circle
          cx={handleOutX}
          cy={handleOutY}
          r={5 / scale}
          fill={selectedHandleType === "out" ? "#a855f7" : "#fff"}
          stroke="#a855f7"
          strokeWidth={1.5 / scale}
          data-point-id={point.id}
          data-handle-type="out"
          className="cursor-move"
        />
      )}

      {/* Main point - always visible, larger hit area */}
      <circle
        cx={x}
        cy={y}
        r={7 / scale}
        fill={isSelected ? "#3b82f6" : "#fff"}
        stroke="#3b82f6"
        strokeWidth={2 / scale}
        data-point-id={point.id}
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
