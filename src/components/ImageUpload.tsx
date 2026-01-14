"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Upload, ImageIcon, MousePointer2, Plus, Hand } from "lucide-react";

interface ImageUploadProps {
  onImageLoad: (dataUrl: string, width: number, height: number) => void;
}

export function ImageUpload({ onImageLoad }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;

        // Get image dimensions
        const img = new Image();
        img.onload = () => {
          // Scale down large images to fit nicely in the canvas
          const maxSize = 800;
          let width = img.width;
          let height = img.height;

          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height / width) * maxSize;
              width = maxSize;
            } else {
              width = (width / height) * maxSize;
              height = maxSize;
            }
          }

          onImageLoad(dataUrl, Math.round(width), Math.round(height));
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [onImageLoad]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-900 p-8">
      <div className="flex flex-col items-center gap-8 max-w-2xl">
        {/* SEO headline */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold text-zinc-100">
            CSS Clip Path Generator
          </h1>
          <p className="text-sm text-zinc-400 max-w-md">
            Create complex clip-path shapes with bezier curves. Upload an image,
            draw your path, and export ready-to-use CSS.
          </p>
        </div>

        {/* Upload area */}
        <label
          className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-12 py-10 transition-colors ${
            isDragging
              ? "border-zinc-400 bg-zinc-800"
              : "border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/50"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700">
              {isDragging ? (
                <ImageIcon className="h-5 w-5 text-zinc-300" />
              ) : (
                <Upload className="h-5 w-5 text-zinc-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-300">
                {isDragging
                  ? "Drop image here"
                  : "Drop an image or click to browse"}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                PNG, JPG, WebP, or GIF
              </p>
            </div>
          </div>
        </label>

        {/* How it works */}
        <div className="w-full space-y-4">
          <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider text-center pb-2">
            How it works
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 mx-auto">
                <Plus className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-300">Add points</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Click to place, click first point to close
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 mx-auto">
                <MousePointer2 className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-300">Edit curves</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Drag handles to adjust bezier curves
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 border border-zinc-700 mx-auto">
                <Hand className="h-4 w-4 text-zinc-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-300">Navigate</p>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Scroll to zoom, drag to pan
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard shortcuts */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-zinc-500">
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono mr-0.5">
              V
            </kbd>{" "}
            Select
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono mr-0.5">
              P
            </kbd>{" "}
            Add point
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono mr-0.5">
              H
            </kbd>{" "}
            Pan
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono mr-0.5">
              R
            </kbd>{" "}
            Lock/Unlock
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono mr-0.5">
              ⌘Z
            </kbd>{" "}
            Undo
          </span>
        </div>

        {/* FAQ link */}
        <Link
          href="/faq"
          className="text-xs text-zinc-500 hover:text-zinc-300 underline underline-offset-2 transition-colors"
        >
          Questions?
        </Link>
      </div>
    </div>
  );
}
