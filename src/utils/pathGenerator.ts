import { Point } from "@/types";

/**
 * Generate SVG path `d` attribute from points using percentage coordinates
 */
export function generateSvgPath(points: Point[]): string {
  if (points.length < 2) return "";

  const first = points[0];
  let d = `M ${first.x} ${first.y}`;

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];

    // Control point 1: previous point's handleOut
    const cp1x = prev.x + prev.handleOut.x;
    const cp1y = prev.y + prev.handleOut.y;

    // Control point 2: current point's handleIn
    const cp2x = curr.x + curr.handleIn.x;
    const cp2y = curr.y + curr.handleIn.y;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
  }

  // Close the path back to the first point
  const last = points[points.length - 1];
  const cp1x = last.x + last.handleOut.x;
  const cp1y = last.y + last.handleOut.y;
  const cp2x = first.x + first.handleIn.x;
  const cp2y = first.y + first.handleIn.y;

  d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${first.x} ${first.y}`;
  d += " Z";

  return d;
}

/**
 * Generate CSS clip-path value using path()
 * Note: clip-path: path() uses pixel values, not percentages
 * This function returns the path in percentage format which needs to be
 * converted to pixels based on the element's actual size
 */
export function generateClipPathCss(points: Point[]): string {
  if (points.length < 2) return "none";

  const pathD = generateSvgPath(points);
  return `path('${pathD}')`;
}

/**
 * Generate CSS clip-path with pixel values for a given image size
 */
export function generateClipPathCssPixels(
  points: Point[],
  width: number,
  height: number
): string {
  if (points.length < 2) return "none";

  const toPixels = (p: Point) => ({
    x: (p.x / 100) * width,
    y: (p.y / 100) * height,
    handleInX: ((p.x + p.handleIn.x) / 100) * width,
    handleInY: ((p.y + p.handleIn.y) / 100) * height,
    handleOutX: ((p.x + p.handleOut.x) / 100) * width,
    handleOutY: ((p.y + p.handleOut.y) / 100) * height,
  });

  const first = toPixels(points[0]);
  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;

  for (let i = 1; i < points.length; i++) {
    const prev = toPixels(points[i - 1]);
    const curr = toPixels(points[i]);

    d += ` C ${prev.handleOutX.toFixed(2)} ${prev.handleOutY.toFixed(2)}, ${curr.handleInX.toFixed(2)} ${curr.handleInY.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
  }

  // Close the path
  const last = toPixels(points[points.length - 1]);
  d += ` C ${last.handleOutX.toFixed(2)} ${last.handleOutY.toFixed(2)}, ${first.handleInX.toFixed(2)} ${first.handleInY.toFixed(2)}, ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  d += " Z";

  return `path('${d}')`;
}

/**
 * Generate a polygon clip-path (fallback for browsers that don't support path())
 */
export function generatePolygonClipPath(points: Point[]): string {
  if (points.length < 3) return "none";

  const polygonPoints = points.map((p) => `${p.x}% ${p.y}%`).join(", ");
  return `polygon(${polygonPoints})`;
}

/**
 * Generate exportable CSS code
 */
export function generateExportCss(points: Point[], width: number, height: number): string {
  const clipPath = generateClipPathCssPixels(points, width, height);

  return `.clipped-element {
  /* For ${width}x${height}px elements */
  clip-path: ${clipPath};

  /* Alternative polygon (no curves, for older browsers) */
  /* clip-path: ${generatePolygonClipPath(points)}; */
}`;
}

/**
 * Generate exportable SVG path
 */
export function generateExportSvg(points: Point[], width: number, height: number): string {
  if (points.length < 2) {
    return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <!-- Add at least 2 points to generate a path -->
</svg>`;
  }

  const toPixels = (p: Point) => ({
    x: (p.x / 100) * width,
    y: (p.y / 100) * height,
    handleInX: ((p.x + p.handleIn.x) / 100) * width,
    handleInY: ((p.y + p.handleIn.y) / 100) * height,
    handleOutX: ((p.x + p.handleOut.x) / 100) * width,
    handleOutY: ((p.y + p.handleOut.y) / 100) * height,
  });

  const first = toPixels(points[0]);
  let d = `M ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;

  for (let i = 1; i < points.length; i++) {
    const prev = toPixels(points[i - 1]);
    const curr = toPixels(points[i]);

    d += ` C ${prev.handleOutX.toFixed(2)} ${prev.handleOutY.toFixed(2)}, ${curr.handleInX.toFixed(2)} ${curr.handleInY.toFixed(2)}, ${curr.x.toFixed(2)} ${curr.y.toFixed(2)}`;
  }

  // Close the path
  const last = toPixels(points[points.length - 1]);
  d += ` C ${last.handleOutX.toFixed(2)} ${last.handleOutY.toFixed(2)}, ${first.handleInX.toFixed(2)} ${first.handleInY.toFixed(2)}, ${first.x.toFixed(2)} ${first.y.toFixed(2)}`;
  d += " Z";

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <path d="${d}" fill="currentColor" />
</svg>`;
}
