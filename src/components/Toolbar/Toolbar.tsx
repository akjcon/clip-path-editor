"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Tool } from "@/types";
import {
  MousePointer2,
  Plus,
  Trash2,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize,
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
}: ToolbarProps) {
  return (
    <aside className="flex w-12 flex-col items-center gap-1 border-r border-border bg-card py-2">
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
        icon={<Trash2 className="h-4 w-4" />}
        label="Delete"
        shortcut="D"
        active={tool === "delete"}
        onClick={() => onToolChange("delete")}
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
