"use client";

import { useState, useEffect } from "react";
import { Header } from "./Header";
import { Toolbar } from "./Toolbar/Toolbar";
import { Canvas } from "./Canvas/Canvas";
import { StatusBar } from "./StatusBar";
import { ImageUpload } from "./ImageUpload";
import { ExportModal } from "./ExportModal";
import { useEditorContext } from "@/context/EditorContext";
import { generateClipPathCssPixels } from "@/utils/pathGenerator";
import { Tool } from "@/types";

export function Editor() {
  const [projectName, setProjectName] = useState("Untitled Project");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const {
    state,
    transform,
    isAnimatingTransform,
    setTool,
    setImage,
    addPoint,
    insertPoint,
    selectPoint,
    setSelectedPointIds,
    movePoint,
    moveSelectedPoints,
    moveAllPoints,
    moveHandle,
    deleteSelectedPoints,
    toggleHandleMirror,
    getSelectedPointsMirrored,
    closeShape,
    setPoints,
    setIsClosed,
    clearImage,
    setTransform,
    zoomIn,
    zoomOut,
    zoomReset,
    fitToView,
    undo,
    redo,
    canUndo,
    canRedo,
    startDrag,
    endDrag,
    projects,
    saveProject,
    loadProject,
    deleteProject,
  } = useEditorContext();

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Tool shortcuts
      if (e.key === "v" || e.key === "V") {
        setTool("select");
      } else if (e.key === "p" || e.key === "P") {
        setTool("add");
      } else if (e.key === "h" || e.key === "H") {
        setTool("pan");
      }

      // Toggle handle mirror shortcut
      else if ((e.key === "r" || e.key === "R") && state.selectedPointIds.length > 0) {
        toggleHandleMirror();
      }

      // Zoom shortcuts
      else if (e.key === "=" || e.key === "+") {
        zoomIn();
      } else if (e.key === "-") {
        zoomOut();
      } else if (e.key === "0") {
        fitToView(state.imageWidth, state.imageHeight, window.innerWidth, window.innerHeight - 72);
      }

      // Undo/Redo
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }

      // Prevent browser save dialog
      else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
      }

      // Delete selected points
      else if ((e.key === "Delete" || e.key === "Backspace") && state.selectedPointIds.length > 0) {
        deleteSelectedPoints();
      }

      // Escape to deselect
      else if (e.key === "Escape") {
        selectPoint(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    setTool,
    zoomIn,
    zoomOut,
    fitToView,
    undo,
    redo,
    deleteSelectedPoints,
    toggleHandleMirror,
    selectPoint,
    state.selectedPointIds,
    state.imageWidth,
    state.imageHeight,
    state.imageDataUrl,
  ]);

  const handleImageLoad = (dataUrl: string, width: number, height: number) => {
    setImage(dataUrl, width, height);
    setProjectId(null); // New image means new unsaved project
    // Fit image to view after loading
    setTimeout(() => {
      fitToView(width, height, window.innerWidth, window.innerHeight - 72);
    }, 0);
  };

  // Autosave whenever points or isClosed changes (and we have an image)
  useEffect(() => {
    const imageDataUrl = state.imageDataUrl;
    if (!imageDataUrl) return;

    // Debounce autosave slightly to avoid excessive saves during rapid changes
    const timeoutId = setTimeout(() => {
      const newId = saveProject(
        projectName,
        imageDataUrl,
        state.imageWidth,
        state.imageHeight,
        state.points,
        state.isClosed,
        projectId || undefined
      );
      setProjectId(newId);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [state.points, state.isClosed, state.imageDataUrl, state.imageWidth, state.imageHeight, projectName, projectId, saveProject]);

  const handleLoadProject = (id: string) => {
    const project = loadProject(id);
    if (project) {
      setProjectName(project.name);
      setProjectId(project.id);
      setImage(project.imageDataUrl, project.imageWidth, project.imageHeight);
      setPoints(project.points);
      setIsClosed(project.isClosed ?? false);
      setTimeout(() => {
        fitToView(project.imageWidth, project.imageHeight, window.innerWidth, window.innerHeight - 72);
      }, 0);
    }
  };

  const handleDeleteProject = (id: string) => {
    deleteProject(id);
    if (projectId === id) {
      handleNewProject();
    }
  };

  const handleExport = () => {
    setExportModalOpen(true);
  };

  const handleNewProject = () => {
    clearImage();
    setProjectName("Untitled Project");
    setProjectId(null);
    zoomReset();
  };

  const handleToolChange = (tool: Tool) => {
    setTool(tool);
  };

  // Generate clip-path for preview (only when shape is closed)
  const clipPath = generateClipPathCssPixels(state.points, state.imageWidth, state.imageHeight, state.isClosed);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onExport={handleExport}
        onNewProject={handleNewProject}
        onLoadProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
        hasImage={!!state.imageDataUrl}
        projects={projects}
        currentProjectId={projectId}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <Toolbar
          tool={state.tool}
          onToolChange={handleToolChange}
          onUndo={undo}
          onRedo={redo}
          canUndo={canUndo}
          canRedo={canRedo}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onZoomReset={zoomReset}
          onFitToView={() =>
            fitToView(state.imageWidth, state.imageHeight, window.innerWidth, window.innerHeight - 72)
          }
          onDeleteSelected={deleteSelectedPoints}
          onToggleHandleMirror={toggleHandleMirror}
          handlesMirrored={getSelectedPointsMirrored()}
          hasSelection={state.selectedPointIds.length > 0}
        />

        {state.imageDataUrl ? (
          <Canvas
            transform={transform}
            isAnimatingTransform={isAnimatingTransform}
            onTransformChange={setTransform}
            imageDataUrl={state.imageDataUrl}
            imageWidth={state.imageWidth}
            imageHeight={state.imageHeight}
            points={state.points}
            selectedPointIds={state.selectedPointIds}
            selectedHandleType={state.selectedHandleType}
            tool={state.tool}
            isClosed={state.isClosed}
            onAddPoint={addPoint}
            onInsertPoint={insertPoint}
            onSelectPoint={selectPoint}
            onSetSelectedPointIds={setSelectedPointIds}
            onMovePoint={movePoint}
            onMoveSelectedPoints={moveSelectedPoints}
            onMoveAllPoints={moveAllPoints}
            onMoveHandle={moveHandle}
            onCloseShape={closeShape}
            onCursorPositionChange={setCursorPosition}
            onStartDrag={startDrag}
            onEndDrag={endDrag}
            clipPath={clipPath}
          />
        ) : (
          <ImageUpload onImageLoad={handleImageLoad} />
        )}
      </div>

      <StatusBar
        zoom={transform.scale}
        cursorPosition={cursorPosition}
        tool={state.tool}
        pointCount={state.points.length}
        isClosed={state.isClosed}
      />

      <ExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        points={state.points}
        imageWidth={state.imageWidth}
        imageHeight={state.imageHeight}
      />
    </div>
  );
}
