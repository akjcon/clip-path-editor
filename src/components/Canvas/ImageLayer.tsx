"use client";

import { memo } from "react";

interface ImageLayerProps {
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  clipPath: string;
}

export const ImageLayer = memo(function ImageLayer({
  imageDataUrl,
  imageWidth,
  imageHeight,
  clipPath,
}: ImageLayerProps) {
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
