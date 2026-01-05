"use client";

import { useState, useEffect } from "react";
import { Header } from "./Header";
import { Toolbar } from "./Toolbar/Toolbar";
import { Canvas } from "./Canvas/Canvas";
import { StatusBar } from "./StatusBar";
import { ImageUpload } from "./ImageUpload";
import { ExportModal } from "./ExportModal";
import { useEditor } from "@/hooks/useEditor";
import { useCanvas } from "@/hooks/useCanvas";
import { useHistory } from "@/hooks/useHistory";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { generateClipPathCssPixels } from "@/utils/pathGenerator";
import { Tool } from "@/types";

export function Editor() {
  const [projectName, setProjectName] = useState("Untitled Project");
  const [projectId, setProjectId] = useState<string | null>(null);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const {
    state,
    setTool,
    setImage,
    addPoint,
    selectPoint,
    movePoint,
    moveHandle,
    deletePoint,
    setPoints,
    clearImage,
  } = useEditor();

  const { transform, setTransform, zoomIn, zoomOut, zoomReset, fitToView } = useCanvas();
  const { undo, redo, canUndo, canRedo } = useHistory(state.points, setPoints);
  const { projects, saveProject, loadProject, deleteProject } = useLocalStorage();

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
      } else if (e.key === "d" || e.key === "D") {
        setTool("delete");
      }

      // Zoom shortcuts
      else if (e.key === "=" || e.key === "+") {
        zoomIn();
      } else if (e.key === "-") {
        zoomOut();
      } else if (e.key === "0") {
        fitToView(state.imageWidth, state.imageHeight, window.innerWidth - 60, window.innerHeight - 72);
      }

      // Undo/Redo
      else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }

      // Save shortcut
      else if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (state.imageDataUrl) {
          handleSave();
        }
      }

      // Delete selected point
      else if ((e.key === "Delete" || e.key === "Backspace") && state.selectedPointId) {
        deletePoint(state.selectedPointId);
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
    deletePoint,
    selectPoint,
    state.selectedPointId,
    state.imageWidth,
    state.imageHeight,
    state.imageDataUrl,
  ]);

  const handleImageLoad = (dataUrl: string, width: number, height: number) => {
    setImage(dataUrl, width, height);
    setProjectId(null); // New image means new unsaved project
    // Fit image to view after loading
    setTimeout(() => {
      fitToView(width, height, window.innerWidth - 60, window.innerHeight - 72);
    }, 0);
  };

  const handleSave = () => {
    if (!state.imageDataUrl) return;

    const newId = saveProject(
      projectName,
      state.imageDataUrl,
      state.imageWidth,
      state.imageHeight,
      state.points,
      projectId || undefined
    );
    setProjectId(newId);
  };

  const handleLoadProject = (id: string) => {
    const project = loadProject(id);
    if (project) {
      setProjectName(project.name);
      setProjectId(project.id);
      setImage(project.imageDataUrl, project.imageWidth, project.imageHeight);
      setPoints(project.points);
      setTimeout(() => {
        fitToView(project.imageWidth, project.imageHeight, window.innerWidth - 60, window.innerHeight - 72);
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

  // Generate clip-path for preview
  const clipPath = generateClipPathCssPixels(state.points, state.imageWidth, state.imageHeight);

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header
        projectName={projectName}
        onProjectNameChange={setProjectName}
        onSave={handleSave}
        onExport={handleExport}
        onNewProject={handleNewProject}
        onLoadProject={handleLoadProject}
        onDeleteProject={handleDeleteProject}
        hasImage={!!state.imageDataUrl}
        projects={projects}
        currentProjectId={projectId}
      />

      <div className="flex flex-1 overflow-hidden">
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
            fitToView(state.imageWidth, state.imageHeight, window.innerWidth - 60, window.innerHeight - 72)
          }
        />

        {state.imageDataUrl ? (
          <Canvas
            transform={transform}
            onTransformChange={setTransform}
            imageDataUrl={state.imageDataUrl}
            imageWidth={state.imageWidth}
            imageHeight={state.imageHeight}
            points={state.points}
            selectedPointId={state.selectedPointId}
            selectedHandleType={state.selectedHandleType}
            tool={state.tool}
            onAddPoint={addPoint}
            onSelectPoint={selectPoint}
            onMovePoint={movePoint}
            onMoveHandle={moveHandle}
            onDeletePoint={deletePoint}
            onCursorPositionChange={setCursorPosition}
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
