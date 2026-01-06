"use client";

import { useRef, useCallback, useEffect, useState, memo } from "react";
import { Point, Tool, CanvasTransform } from "@/types";
import { PointsOverlay } from "./PointsOverlay";
import { isPointInPath, findClickedSegment, splitBezier } from "@/utils/bezier";

interface CanvasProps {
  transform: CanvasTransform;
  isAnimatingTransform: boolean;
  onTransformChange: (transform: CanvasTransform) => void;
  imageDataUrl: string | null;
  imageWidth: number;
  imageHeight: number;
  points: Point[];
  selectedPointIds: string[];
  selectedHandleType: "in" | "out" | null;
  tool: Tool;
  isClosed: boolean;
  onAddPoint: (x: number, y: number) => void;
  onInsertPoint: (
    index: number,
    x: number,
    y: number,
    handleIn: { x: number; y: number },
    handleOut: { x: number; y: number },
    prevPointHandleOut: { x: number; y: number },
    nextPointHandleIn: { x: number; y: number }
  ) => void;
  onSelectPoint: (id: string | null, handleType?: "in" | "out" | null, addToSelection?: boolean) => void;
  onSetSelectedPointIds: (ids: string[]) => void;
  onMovePoint: (id: string, x: number, y: number) => void;
  onMoveSelectedPoints: (deltaX: number, deltaY: number) => void;
  onMoveAllPoints: (deltaX: number, deltaY: number) => void;
  onMoveHandle: (id: string, handleType: "in" | "out", x: number, y: number, breakMirror: boolean) => void;
  onCloseShape: () => void;
  onCursorPositionChange: (pos: { x: number; y: number } | null) => void;
  onStartDrag: () => void;
  onEndDrag: () => void;
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

type DragMode = "none" | "pan" | "point" | "handle" | "marquee" | "shape";

interface MarqueeState {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function Canvas({
  transform,
  isAnimatingTransform,
  onTransformChange,
  imageDataUrl,
  imageWidth,
  imageHeight,
  points,
  selectedPointIds,
  selectedHandleType,
  tool,
  isClosed,
  onAddPoint,
  onInsertPoint,
  onSelectPoint,
  onSetSelectedPointIds,
  onMovePoint,
  onMoveSelectedPoints,
  onMoveAllPoints,
  onMoveHandle,
  onCloseShape,
  onCursorPositionChange,
  onStartDrag,
  onEndDrag,
  clipPath,
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>("none");
  const [dragPointId, setDragPointId] = useState<string | null>(null);
  const [dragHandleType, setDragHandleType] = useState<"in" | "out" | null>(null);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);
  const [marquee, setMarquee] = useState<MarqueeState | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringShape, setIsHoveringShape] = useState(false);
  const [isHoveringPath, setIsHoveringPath] = useState(false);
  const [previewSelectedIds, setPreviewSelectedIds] = useState<string[]>([]);

  // Convert percentage coordinates to image pixel coordinates
  const percentToPixels = useCallback(
    (percentX: number, percentY: number) => {
      return {
        x: (percentX / 100) * imageWidth,
        y: (percentY / 100) * imageHeight,
      };
    },
    [imageWidth, imageHeight]
  );

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

  // Handle wheel events (zoom and pan)
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      // Pinch-to-zoom on trackpad sets ctrlKey = true
      // Also handle actual ctrl+scroll for mouse users
      if (e.ctrlKey || e.metaKey) {
        // Zoom - reduced sensitivity (was 0.9/1.1, now using continuous factor)
        const zoomFactor = 1 - e.deltaY * 0.005; // Smoother, less sensitive
        const newScale = Math.min(Math.max(transform.scale * zoomFactor, 0.1), 10);

        // Zoom toward cursor position
        const mouseX = e.clientX - rect.left - rect.width / 2;
        const mouseY = e.clientY - rect.top - rect.height / 2;

        const newX = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
        const newY = mouseY - (mouseY - transform.y) * (newScale / transform.scale);

        onTransformChange({ x: newX, y: newY, scale: newScale });
      } else {
        // Two-finger pan on trackpad (no ctrlKey)
        onTransformChange({
          ...transform,
          x: transform.x - e.deltaX,
          y: transform.y - e.deltaY,
        });
      }
    },
    [transform, onTransformChange]
  );

  // Handle mouse down
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle click or space + click or pan tool = pan (always works)
      if (e.button === 1 || spacePressed || tool === "pan") {
        setDragMode("pan");
        setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
        return;
      }

      if (e.button !== 0) return;

      const target = e.target as HTMLElement;
      const pointId = target.dataset?.pointId;
      const handleType = target.dataset?.handleType as "in" | "out" | undefined;
      const isFirstPoint = target.dataset?.isFirstPoint === "true";

      // Clicked on a handle - start dragging handle (works in ANY mode)
      if (pointId && handleType) {
        onSelectPoint(pointId, handleType);
        onStartDrag();
        setDragMode("handle");
        setDragPointId(pointId);
        setDragHandleType(handleType);
        return;
      }

      // Clicked on a point
      if (pointId) {
        // In add mode, clicking on first point closes the shape
        if (tool === "add" && isFirstPoint && !isClosed && points.length >= 3) {
          onCloseShape();
          return;
        }

        // Handle shift+click for multi-select
        if (e.shiftKey) {
          onSelectPoint(pointId, null, true);
        } else {
          // If point is not already selected, select only this point
          if (!selectedPointIds.includes(pointId)) {
            onSelectPoint(pointId, null, false);
          }
        }

        // Start dragging (will move all selected points)
        onStartDrag();
        setDragMode("point");
        setDragPointId(pointId);
        const pos = screenToImage(e.clientX, e.clientY);
        if (pos) setDragStartPos(pos);
        return;
      }

      // Clicked on empty space (not on a point or handle)
      const pos = screenToImage(e.clientX, e.clientY);
      const isInsideImage = pos && pos.x >= 0 && pos.x <= 100 && pos.y >= 0 && pos.y <= 100;

      if (tool === "add" && isInsideImage && pos) {
        // Add mode: check if clicking on an edge first
        if (points.length >= 2) {
          const pixelPos = percentToPixels(pos.x, pos.y);
          const threshold = 10 / transform.scale; // 10px hit area, scaled
          const hit = findClickedSegment(
            pixelPos.x,
            pixelPos.y,
            points,
            imageWidth,
            imageHeight,
            isClosed,
            threshold
          );

          if (hit) {
            // Split the bezier curve at the clicked point
            const p1 = points[hit.segmentIndex];
            const p2 = points[(hit.segmentIndex + 1) % points.length];

            // Get control points in pixel space
            const p0Px = { x: (p1.x / 100) * imageWidth, y: (p1.y / 100) * imageHeight };
            const cp1Px = {
              x: ((p1.x + p1.handleOut.x) / 100) * imageWidth,
              y: ((p1.y + p1.handleOut.y) / 100) * imageHeight,
            };
            const cp2Px = {
              x: ((p2.x + p2.handleIn.x) / 100) * imageWidth,
              y: ((p2.y + p2.handleIn.y) / 100) * imageHeight,
            };
            const p3Px = { x: (p2.x / 100) * imageWidth, y: (p2.y / 100) * imageHeight };

            // Split the curve
            const { left, right } = splitBezier(p0Px, cp1Px, cp2Px, p3Px, hit.t);

            // Convert back to percentages
            const toPercent = (px: number, total: number) => (px / total) * 100;
            const newPointX = toPercent(left.p3.x, imageWidth);
            const newPointY = toPercent(left.p3.y, imageHeight);

            // Calculate handles relative to the new point
            const handleIn = {
              x: toPercent(left.p2.x, imageWidth) - newPointX,
              y: toPercent(left.p2.y, imageHeight) - newPointY,
            };
            const handleOut = {
              x: toPercent(right.p1.x, imageWidth) - newPointX,
              y: toPercent(right.p1.y, imageHeight) - newPointY,
            };

            // Calculate new handles for adjacent points
            const prevPointHandleOut = {
              x: toPercent(left.p1.x, imageWidth) - p1.x,
              y: toPercent(left.p1.y, imageHeight) - p1.y,
            };
            const nextPointHandleIn = {
              x: toPercent(right.p2.x, imageWidth) - p2.x,
              y: toPercent(right.p2.y, imageHeight) - p2.y,
            };

            onInsertPoint(
              hit.segmentIndex,
              newPointX,
              newPointY,
              handleIn,
              handleOut,
              prevPointHandleOut,
              nextPointHandleIn
            );
            return;
          }
        }

        // No edge hit - add point at end (only if shape is not closed)
        if (!isClosed) {
          onAddPoint(pos.x, pos.y);
        }
      } else if (tool === "select") {
        // Check if clicking inside the shape (for shape dragging)
        if (pos && isClosed && points.length >= 3) {
          const pixelPos = percentToPixels(pos.x, pos.y);
          const isInside = isPointInPath(pixelPos.x, pixelPos.y, points, imageWidth, imageHeight, isClosed);
          if (isInside) {
            // Start shape drag
            onStartDrag();
            setDragMode("shape");
            setDragStartPos(pos);
            return;
          }
        }
        // Start marquee selection
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setDragMode("marquee");
          setMarquee({
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top,
            endX: e.clientX - rect.left,
            endY: e.clientY - rect.top,
          });
        }
      } else {
        // Deselect in other modes
        onSelectPoint(null);
      }
    },
    [tool, spacePressed, transform, screenToImage, percentToPixels, onSelectPoint, onAddPoint, onInsertPoint, onCloseShape, onStartDrag, isClosed, points, imageWidth, imageHeight, selectedPointIds]
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

      // Handle shape dragging
      if (dragMode === "shape" && pos && dragStartPos) {
        const deltaX = pos.x - dragStartPos.x;
        const deltaY = pos.y - dragStartPos.y;
        onMoveAllPoints(deltaX, deltaY);
        setDragStartPos(pos);
        return;
      }

      // Handle marquee selection
      if (dragMode === "marquee" && marquee) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const newEndX = e.clientX - rect.left;
          const newEndY = e.clientY - rect.top;
          setMarquee({
            ...marquee,
            endX: newEndX,
            endY: newEndY,
          });

          // Calculate preview selection
          const minX = Math.min(marquee.startX, newEndX);
          const maxX = Math.max(marquee.startX, newEndX);
          const minY = Math.min(marquee.startY, newEndY);
          const maxY = Math.max(marquee.startY, newEndY);

          const previewIds = points.filter((p) => {
            const pointScreenX =
              ((p.x / 100) * imageWidth - imageWidth / 2) * transform.scale +
              transform.x +
              rect.width / 2;
            const pointScreenY =
              ((p.y / 100) * imageHeight - imageHeight / 2) * transform.scale +
              transform.y +
              rect.height / 2;

            return (
              pointScreenX >= minX &&
              pointScreenX <= maxX &&
              pointScreenY >= minY &&
              pointScreenY <= maxY
            );
          }).map((p) => p.id);

          setPreviewSelectedIds(previewIds);
        }
        return;
      }

      // Handle dragging points (moves all selected points)
      if (dragMode === "point" && dragPointId && pos && dragStartPos) {
        const deltaX = pos.x - dragStartPos.x;
        const deltaY = pos.y - dragStartPos.y;

        // If the dragged point is selected, move all selected points
        if (selectedPointIds.includes(dragPointId)) {
          onMoveSelectedPoints(deltaX, deltaY);
        } else {
          // Single point drag (shouldn't happen often, but handle it)
          onMovePoint(dragPointId, pos.x, pos.y);
        }
        setDragStartPos(pos);
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

      // Track hover state for shape (only in select mode, when not dragging)
      if (dragMode === "none" && tool === "select" && isClosed && points.length >= 3 && pos) {
        const pixelPos = percentToPixels(pos.x, pos.y);
        const isInside = isPointInPath(pixelPos.x, pixelPos.y, points, imageWidth, imageHeight, isClosed);
        setIsHoveringShape(isInside);
      } else if (dragMode !== "shape") {
        setIsHoveringShape(false);
      }

      // Track hover state for path line (in add mode, for inserting points)
      if (dragMode === "none" && tool === "add" && points.length >= 2 && pos) {
        const pixelPos = percentToPixels(pos.x, pos.y);
        const threshold = 10 / transform.scale;
        const hit = findClickedSegment(
          pixelPos.x,
          pixelPos.y,
          points,
          imageWidth,
          imageHeight,
          isClosed,
          threshold
        );
        setIsHoveringPath(!!hit);
      } else {
        setIsHoveringPath(false);
      }
    },
    [
      dragMode,
      dragPointId,
      dragHandleType,
      dragStartPos,
      panStart,
      transform,
      screenToImage,
      percentToPixels,
      points,
      marquee,
      selectedPointIds,
      tool,
      isClosed,
      imageWidth,
      imageHeight,
      onTransformChange,
      onMovePoint,
      onMoveSelectedPoints,
      onMoveAllPoints,
      onMoveHandle,
      onCursorPositionChange,
    ]
  );

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    // Finish marquee selection
    if (dragMode === "marquee" && marquee) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const minX = Math.min(marquee.startX, marquee.endX);
        const maxX = Math.max(marquee.startX, marquee.endX);
        const minY = Math.min(marquee.startY, marquee.endY);
        const maxY = Math.max(marquee.startY, marquee.endY);

        // Only select if marquee has some size
        if (maxX - minX > 5 || maxY - minY > 5) {
          const selectedIds = points.filter((p) => {
            // Convert point percentage to screen coordinates
            const pointScreenX =
              ((p.x / 100) * imageWidth - imageWidth / 2) * transform.scale +
              transform.x +
              rect.width / 2;
            const pointScreenY =
              ((p.y / 100) * imageHeight - imageHeight / 2) * transform.scale +
              transform.y +
              rect.height / 2;

            return (
              pointScreenX >= minX &&
              pointScreenX <= maxX &&
              pointScreenY >= minY &&
              pointScreenY <= maxY
            );
          }).map((p) => p.id);

          onSetSelectedPointIds(selectedIds);
        } else {
          // Tiny marquee = deselect
          onSelectPoint(null);
        }
      }
      setMarquee(null);
      setPreviewSelectedIds([]);
    }

    // End drag for point/handle/shape drags (commits to history)
    if (dragMode === "point" || dragMode === "handle" || dragMode === "shape") {
      onEndDrag();
    }

    setDragMode("none");
    setDragPointId(null);
    setDragHandleType(null);
    setDragStartPos(null);
  }, [dragMode, marquee, points, imageWidth, imageHeight, transform, onSetSelectedPointIds, onSelectPoint, onEndDrag]);

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
    if (dragMode === "pan") return "grabbing";
    if (dragMode === "shape") return "grabbing";
    if (dragMode === "marquee") return "crosshair";
    if (spacePressed || tool === "pan") return "grab";
    if (tool === "add" && (isHoveringPath || !isClosed)) return "crosshair";
    if (tool === "select" && isHoveringShape) return "grab";
    return "default";
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 overflow-hidden bg-zinc-900 select-none"
      style={{ cursor: getCursor(), WebkitUserSelect: "none" }}
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
          // Smooth transitions for button-triggered zooms, disabled during drag for responsiveness
          transition: isAnimatingTransform && dragMode === "none" ? "transform 200ms ease-out" : "none",
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
              selectedPointIds={selectedPointIds}
              previewSelectedIds={previewSelectedIds}
              selectedHandleType={selectedHandleType}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              scale={transform.scale}
              isClosed={isClosed}
              canClose={tool === "add" && !isClosed && points.length >= 3}
              isDragging={dragMode !== "none"}
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

      {/* Marquee selection rectangle */}
      {marquee && (
        <div
          className="absolute border border-zinc-400/60 bg-zinc-400/10 pointer-events-none"
          style={{
            left: Math.min(marquee.startX, marquee.endX),
            top: Math.min(marquee.startY, marquee.endY),
            width: Math.abs(marquee.endX - marquee.startX),
            height: Math.abs(marquee.endY - marquee.startY),
          }}
        />
      )}
    </div>
  );
}
