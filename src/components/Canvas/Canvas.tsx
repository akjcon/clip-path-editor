"use client";

import { useRef, useCallback, useEffect, useState } from "react";
import { Point, Tool, CanvasTransform } from "@/types";

interface CanvasProps {
  transform: CanvasTransform;
  onTransformChange: (transform: CanvasTransform) => void;
  imageDataUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  points: Point[];
  selectedPointId: string | null;
  selectedHandleType: "in" | "out" | null;
  tool: Tool;
  onAddPoint: (x: number, y: number) => void;
  onSelectPoint: (id: string | null, handleType?: "in" | "out" | null) => void;
  onMovePoint: (id: string, x: number, y: number) => void;
  onMoveHandle: (id: string, handleType: "in" | "out", x: number, y: number, breakMirror: boolean) => void;
  onDeletePoint: (id: string) => void;
  onCursorPositionChange: (pos: { x: number; y: number } | null) => void;
  clipPath: string;
}

export function Canvas({
  transform,
  onTransformChange,
  imageDataUrl,
  imageWidth,
  imageHeight,
  points,
  selectedPointId,
  selectedHandleType,
  tool,
  onAddPoint,
  onSelectPoint,
  onMovePoint,
  onMoveHandle,
  onDeletePoint,
  onCursorPositionChange,
  clipPath,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Convert screen coordinates to image percentage coordinates
  const screenToImage = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current || !imageWidth || !imageHeight) return null;

      const rect = containerRef.current.getBoundingClientRect();
      const canvasX = (screenX - rect.left - rect.width / 2 - transform.x) / transform.scale;
      const canvasY = (screenY - rect.top - rect.height / 2 - transform.y) / transform.scale;

      // Image is centered at 0,0 in canvas space
      const imageX = canvasX + imageWidth / 2;
      const imageY = canvasY + imageHeight / 2;

      // Convert to percentage
      const percentX = (imageX / imageWidth) * 100;
      const percentY = (imageY / imageHeight) * 100;

      return { x: percentX, y: percentY };
    },
    [transform, imageWidth, imageHeight]
  );

  // Handle wheel zoom
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(transform.scale * delta, 0.1), 10);

      // Zoom toward cursor position
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
        const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

        onTransformChange({ x: newX, y: newY, scale: newScale });
      }
    },
    [transform, onTransformChange]
  );

  // Handle mouse events
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || spacePressed) {
        // Middle click or space + click = pan
        setIsPanning(true);
        setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        return;
      }

      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      const pointId = target.dataset.pointId;
      const handleType = target.dataset.handleType as "in" | "out" | undefined;

      if (tool === "select") {
        if (pointId) {
          onSelectPoint(pointId, handleType || null);
          setIsDragging(true);
          const pos = screenToImage(e.clientX, e.clientY);
          if (pos) setDragStart({ x: pos.x, y: pos.y });
        } else {
          onSelectPoint(null);
        }
      } else if (tool === "add" && imageDataUrl) {
        const pos = screenToImage(e.clientX, e.clientY);
        if (pos && pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100) {
          onAddPoint(pos.x, pos.y);
        }
      } else if (tool === "delete" && pointId) {
        onDeletePoint(pointId);
      }
    },
    [tool, spacePressed, transform, screenToImage, onSelectPoint, onAddPoint, onDeletePoint, imageDataUrl]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Update cursor position
      const pos = screenToImage(e.clientX, e.clientY);
      if (pos && pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100) {
        onCursorPositionChange(pos);
      } else {
        onCursorPositionChange(null);
      }

      if (isPanning) {
        onTransformChange({
          ...transform,
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
        return;
      }

      if (isDragging && selectedPointId && pos) {
        const breakMirror = e.altKey;
        if (selectedHandleType) {
          // Moving a handle
          const point = points.find((p) => p.id === selectedPointId);
          if (point) {
            const relX = pos.x - point.x;
            const relY = pos.y - point.y;
            onMoveHandle(selectedPointId, selectedHandleType, relX, relY, breakMirror);
          }
        } else {
          // Moving a point
          onMovePoint(selectedPointId, pos.x, pos.y);
        }
      }
    },
    [
      isPanning,
      isDragging,
      selectedPointId,
      selectedHandleType,
      dragStart,
      transform,
      screenToImage,
      points,
      onTransformChange,
      onMovePoint,
      onMoveHandle,
      onCursorPositionChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
  }, []);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setSpacePressed(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Attach wheel listener with passive: false
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const getCursor = () => {
    if (isPanning || spacePressed) return "grab";
    if (tool === "add") return "crosshair";
    if (tool === "delete") return "not-allowed";
    return "default";
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-zinc-900"
      style={{ cursor: getCursor() }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: `${20 * transform.scale}px ${20 * transform.scale}px`,
          backgroundPosition: `${transform.x + 50}% ${transform.y + 50}%`,
        }}
      />

      {/* Canvas content */}
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
          transformOrigin: "center",
        }}
      >
        {imageDataUrl && (
          <div className="relative" style={{ width: imageWidth, height: imageHeight }}>
            {/* Original image (faded) */}
            <img
              src={imageDataUrl}
              alt="Original"
              className="absolute inset-0 opacity-30"
              style={{ width: imageWidth, height: imageHeight }}
              draggable={false}
            />

            {/* Clipped image */}
            <img
              src={imageDataUrl}
              alt="Clipped"
              className="absolute inset-0"
              style={{
                width: imageWidth,
                height: imageHeight,
                clipPath: clipPath || "none",
              }}
              draggable={false}
            />

            {/* SVG overlay for path and points */}
            <svg
              className="absolute inset-0"
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
                  strokeWidth={2 / transform.scale}
                />
              )}

              {/* Points and handles */}
              {points.map((point, index) => {
                const x = (point.x / 100) * imageWidth;
                const y = (point.y / 100) * imageHeight;
                const isSelected = selectedPointId === point.id;
                const handleInX = x + (point.handleIn.x / 100) * imageWidth;
                const handleInY = y + (point.handleIn.y / 100) * imageHeight;
                const handleOutX = x + (point.handleOut.x / 100) * imageWidth;
                const handleOutY = y + (point.handleOut.y / 100) * imageHeight;

                return (
                  <g key={point.id}>
                    {/* Handle lines */}
                    {isSelected && (
                      <>
                        <line
                          x1={handleInX}
                          y1={handleInY}
                          x2={x}
                          y2={y}
                          stroke="rgba(147, 51, 234, 0.6)"
                          strokeWidth={1 / transform.scale}
                        />
                        <line
                          x1={x}
                          y1={y}
                          x2={handleOutX}
                          y2={handleOutY}
                          stroke="rgba(147, 51, 234, 0.6)"
                          strokeWidth={1 / transform.scale}
                        />
                      </>
                    )}

                    {/* Handle In */}
                    {isSelected && (
                      <circle
                        cx={handleInX}
                        cy={handleInY}
                        r={4 / transform.scale}
                        fill={selectedHandleType === "in" ? "#a855f7" : "#fff"}
                        stroke="#a855f7"
                        strokeWidth={1.5 / transform.scale}
                        data-point-id={point.id}
                        data-handle-type="in"
                        className="cursor-move"
                      />
                    )}

                    {/* Handle Out */}
                    {isSelected && (
                      <circle
                        cx={handleOutX}
                        cy={handleOutY}
                        r={4 / transform.scale}
                        fill={selectedHandleType === "out" ? "#a855f7" : "#fff"}
                        stroke="#a855f7"
                        strokeWidth={1.5 / transform.scale}
                        data-point-id={point.id}
                        data-handle-type="out"
                        className="cursor-move"
                      />
                    )}

                    {/* Point */}
                    <circle
                      cx={x}
                      cy={y}
                      r={6 / transform.scale}
                      fill={isSelected ? "#3b82f6" : "#fff"}
                      stroke="#3b82f6"
                      strokeWidth={2 / transform.scale}
                      data-point-id={point.id}
                      className="cursor-move"
                    />

                    {/* Point number */}
                    <text
                      x={x}
                      y={y - 12 / transform.scale}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize={10 / transform.scale}
                      className="pointer-events-none select-none"
                    >
                      {index + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        )}

        {/* Empty state */}
        {!imageDataUrl && (
          <div className="flex h-64 w-96 items-center justify-center rounded-lg border-2 border-dashed border-zinc-700 bg-zinc-800/50">
            <span className="text-zinc-500">Upload an image to start</span>
          </div>
        )}
      </div>
    </div>
  );
}

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
