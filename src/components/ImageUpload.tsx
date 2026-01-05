"use client";

import { useCallback, useState } from "react";
import { Upload, ImageIcon } from "lucide-react";

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
      <label
        className={`flex h-80 w-full max-w-lg cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-500/10"
            : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800"
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
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-700">
            {isDragging ? (
              <ImageIcon className="h-8 w-8 text-blue-400" />
            ) : (
              <Upload className="h-8 w-8 text-zinc-400" />
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-zinc-300">
              {isDragging ? "Drop image here" : "Upload an image"}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Drag and drop or click to browse
            </p>
          </div>
        </div>
      </label>
    </div>
  );
}
