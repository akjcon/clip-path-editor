"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tool } from "@/types";
import {
  MousePointer2,
  Plus,
  Hand,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Link,
  Unlink,
} from "lucide-react";

interface ToolbarProps {
  tool: Tool;
  onToolChange: (tool: Tool) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onFitToView: () => void;
  onDeleteSelected: () => void;
  onToggleHandleMirror: () => void;
  handlesMirrored: boolean | null; // null = mixed or no selection, true = all mirrored, false = all not mirrored
  hasSelection: boolean;
}

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

function ToolButton({
  icon,
  label,
  shortcut,
  active,
  disabled,
  onClick,
}: ToolButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? "secondary" : "ghost"}
          size="icon"
          className="h-9 w-9"
          disabled={disabled}
          onClick={onClick}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p>
          {label}
          {shortcut && (
            <span className="ml-2 text-muted-foreground">{shortcut}</span>
          )}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

export function Toolbar({
  tool,
  onToolChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToView,
  onDeleteSelected,
  onToggleHandleMirror,
  handlesMirrored,
  hasSelection,
}: ToolbarProps) {
  return (
    <aside className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex w-12 flex-col items-center gap-1 rounded-xl border border-border bg-card/95 backdrop-blur-sm py-2 shadow-lg">
      <ToolButton
        icon={<MousePointer2 className="h-4 w-4" />}
        label="Select"
        shortcut="V"
        active={tool === "select"}
        onClick={() => onToolChange("select")}
      />
      <ToolButton
        icon={<Plus className="h-4 w-4" />}
        label="Add Point"
        shortcut="P"
        active={tool === "add"}
        onClick={() => onToolChange("add")}
      />
      <ToolButton
        icon={<Hand className="h-4 w-4" />}
        label="Pan"
        shortcut="H"
        active={tool === "pan"}
        onClick={() => onToolChange("pan")}
      />

      <Separator className="my-2 w-8" />

      <ToolButton
        icon={<Trash2 className="h-4 w-4" />}
        label="Delete Selected"
        shortcut="Del"
        disabled={!hasSelection}
        onClick={onDeleteSelected}
      />
      <ToolButton
        icon={handlesMirrored ? <Link className="h-4 w-4" /> : <Unlink className="h-4 w-4" />}
        label={handlesMirrored ? "Unlock Handles" : "Lock Handles"}
        shortcut="R"
        disabled={!hasSelection}
        onClick={onToggleHandleMirror}
      />

      <Separator className="my-2 w-8" />

      <ToolButton
        icon={<Undo2 className="h-4 w-4" />}
        label="Undo"
        shortcut="Ctrl+Z"
        disabled={!canUndo}
        onClick={onUndo}
      />
      <ToolButton
        icon={<Redo2 className="h-4 w-4" />}
        label="Redo"
        shortcut="Ctrl+Shift+Z"
        disabled={!canRedo}
        onClick={onRedo}
      />

      <Separator className="my-2 w-8" />

      <ToolButton
        icon={<ZoomIn className="h-4 w-4" />}
        label="Zoom In"
        shortcut="+"
        onClick={onZoomIn}
      />
      <ToolButton
        icon={<ZoomOut className="h-4 w-4" />}
        label="Zoom Out"
        shortcut="-"
        onClick={onZoomOut}
      />
      <ToolButton
        icon={<Maximize className="h-4 w-4" />}
        label="Fit to View"
        shortcut="0"
        onClick={onFitToView}
      />
    </aside>
  );
}
