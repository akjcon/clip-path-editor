"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Download, FolderOpen, Save, Trash2, Plus } from "lucide-react";
import { Project } from "@/types";

interface HeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSave: () => void;
  onExport: () => void;
  onNewProject: () => void;
  onLoadProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  hasImage: boolean;
  projects: Project[];
  currentProjectId: string | null;
}

export function Header({
  projectName,
  onProjectNameChange,
  onSave,
  onExport,
  onNewProject,
  onLoadProject,
  onDeleteProject,
  hasImage,
  projects,
  currentProjectId,
}: HeaderProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1">
              <FolderOpen className="h-4 w-4" />
              <span className="font-medium">{projectName}</span>
              {currentProjectId && <span className="text-muted-foreground">•</span>}
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuItem onClick={onNewProject}>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </DropdownMenuItem>

            {projects.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Recent Projects
                </div>
                {projects.slice(0, 10).map((project) => (
                  <DropdownMenuItem
                    key={project.id}
                    className="flex items-center justify-between"
                    onClick={() => onLoadProject(project.id)}
                  >
                    <div className="flex flex-col">
                      <span className={project.id === currentProjectId ? "font-medium" : ""}>
                        {project.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(project.updatedAt)}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-destructive hover:text-destructive-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Editable project name */}
        {hasImage && (
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="ml-2 bg-transparent text-sm font-medium outline-none focus:ring-1 focus:ring-ring rounded px-1"
            placeholder="Project name"
          />
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSave}
          disabled={!hasImage}
        >
          <Save className="mr-1 h-4 w-4" />
          Save
        </Button>
        <Button
          variant="default"
          size="sm"
          onClick={onExport}
          disabled={!hasImage}
        >
          <Download className="mr-1 h-4 w-4" />
          Export
        </Button>
      </div>
    </header>
  );
}
