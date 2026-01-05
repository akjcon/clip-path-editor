"use client";

import { useState, useEffect, useCallback } from "react";
import { Project, Point } from "@/types";

const STORAGE_KEY = "clip-path-editor-projects";

export function useLocalStorage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load projects from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProjects(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load projects from localStorage:", error);
    }
    setIsLoaded(true);
  }, []);

  // Save projects to localStorage whenever they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error("Failed to save projects to localStorage:", error);
    }
  }, [projects, isLoaded]);

  const saveProject = useCallback(
    (
      name: string,
      imageDataUrl: string,
      imageWidth: number,
      imageHeight: number,
      points: Point[],
      existingId?: string
    ) => {
      const now = Date.now();

      if (existingId) {
        // Update existing project
        setProjects((prev) =>
          prev.map((p) =>
            p.id === existingId
              ? {
                  ...p,
                  name,
                  imageDataUrl,
                  imageWidth,
                  imageHeight,
                  points,
                  updatedAt: now,
                }
              : p
          )
        );
        return existingId;
      }

      // Create new project
      const newProject: Project = {
        id: Math.random().toString(36).substring(2, 9),
        name,
        imageDataUrl,
        imageWidth,
        imageHeight,
        points,
        createdAt: now,
        updatedAt: now,
      };

      setProjects((prev) => [newProject, ...prev]);
      return newProject.id;
    },
    []
  );

  const loadProject = useCallback(
    (id: string): Project | null => {
      return projects.find((p) => p.id === id) || null;
    },
    [projects]
  );

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name, updatedAt: Date.now() } : p))
    );
  }, []);

  return {
    projects,
    isLoaded,
    saveProject,
    loadProject,
    deleteProject,
    renameProject,
  };
}
