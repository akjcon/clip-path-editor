"use client";

import { useRef, useCallback, useEffect, useState, memo } from "react";
import { Point, Tool, CanvasTransform } from "@/types";
import { PointsOverlay } from "./PointsOverlay";

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

// Memoized image component to prevent re-renders
const ImageLayer = memo(function ImageLayer({
  imageDataUrl,
  imageWidth,
  imageHeight,
  clipPath,
}: {
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  clipPath: string;
}) {
  return (
    <>
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
    </>
  );
});

type DragMode = "none" | "pan" | "point" | "handle";

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
  const [dragMode, setDragMode] = useState<DragMode>("none");
  const [dragPointId, setDragPointId] = useState<string | null>(null);
  const [dragHandleType, setDragHandleType] = useState<"in" | "out" | null>(null);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
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

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle click or space + click = pan (always works)
      if (e.button === 1 || spacePressed) {
        setDragMode("pan");
        setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        return;
      }

      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      const pointId = target.dataset?.pointId;
      const handleType = target.dataset?.handleType as "in" | "out" | undefined;

      // Clicked on a handle - start dragging handle (works in ANY mode)
      if (pointId && handleType) {
        onSelectPoint(pointId, handleType);
        setDragMode("handle");
        setDragPointId(pointId);
        setDragHandleType(handleType);
        return;
      }

      // Clicked on a point
      if (pointId) {
        // Delete mode: delete the point
        if (tool === "delete") {
          onDeletePoint(pointId);
          return;
        }

        // Any other mode: select and start dragging
        onSelectPoint(pointId, null);
        setDragMode("point");
        setDragPointId(pointId);
        return;
      }

      // Clicked on empty space (not on a point or handle)
      const pos = screenToImage(e.clientX, e.clientY);
      const isInsideImage = pos && pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100;

      if (tool === "add" && isInsideImage && pos) {
        // Add mode: create new point
        onAddPoint(pos.x, pos.y);
      } else {
        // Select mode or outside image: deselect
        onSelectPoint(null);
      }
    },
    [tool, spacePressed, transform, screenToImage, onSelectPoint, onAddPoint, onDeletePoint]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Update cursor position for status bar
      const pos = screenToImage(e.clientX, e.clientY);
      if (pos && pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100) {
        onCursorPositionChange(pos);
      } else {
        onCursorPositionChange(null);
      }

      // Handle panning
      if (dragMode === "pan") {
        onTransformChange({
          ...transform,
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        });
        return;
      }

      // Handle dragging a point
      if (dragMode === "point" && dragPointId && pos) {
        onMovePoint(dragPointId, pos.x, pos.y);
        return;
      }

      // Handle dragging a bezier handle
      if (dragMode === "handle" && dragPointId && dragHandleType && pos) {
        const point = points.find((p) => p.id === dragPointId);
        if (point) {
          const relX = pos.x - point.x;
          const relY = pos.y - point.y;
          const breakMirror = e.altKey;
          onMoveHandle(dragPointId, dragHandleType, relX, relY, breakMirror);
        }
        return;
      }
    },
    [
      dragMode,
      dragPointId,
      dragHandleType,
      panStart,
      transform,
      screenToImage,
      points,
      onTransformChange,
      onMovePoint,
      onMoveHandle,
      onCursorPositionChange,
    ]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragMode("none");
    setDragPointId(null);
    setDragHandleType(null);
  }, []);

  // Space key for panning
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
    if (dragMode === "pan" || spacePressed) return "grabbing";
    if (tool === "add") return "crosshair";
    if (tool === "delete") return "pointer";
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
            <ImageLayer
              imageDataUrl={imageDataUrl}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              clipPath={clipPath}
            />
            <PointsOverlay
              points={points}
              selectedPointId={selectedPointId}
              selectedHandleType={selectedHandleType}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              scale={transform.scale}
            />
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
