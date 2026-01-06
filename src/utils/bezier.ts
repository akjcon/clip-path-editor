import { Point } from "@/types";

// Evaluate a cubic bezier curve at parameter t (0-1)
export function bezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  const t2 = t * t;
  const t3 = t2 * t;

  return {
    x: mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x,
    y: mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y,
  };
}

// Flatten a bezier curve into line segments
function flattenBezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  segments: number = 10
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push(bezierPoint(p0, p1, p2, p3, t));
  }
  return points;
}

// Convert percentage points to absolute coordinates for a segment
function getSegmentControlPoints(
  p1: Point,
  p2: Point,
  imageWidth: number,
  imageHeight: number
) {
  const p0 = {
    x: (p1.x / 100) * imageWidth,
    y: (p1.y / 100) * imageHeight,
  };
  const cp1 = {
    x: ((p1.x + p1.handleOut.x) / 100) * imageWidth,
    y: ((p1.y + p1.handleOut.y) / 100) * imageHeight,
  };
  const cp2 = {
    x: ((p2.x + p2.handleIn.x) / 100) * imageWidth,
    y: ((p2.y + p2.handleIn.y) / 100) * imageHeight,
  };
  const p3 = {
    x: (p2.x / 100) * imageWidth,
    y: (p2.y / 100) * imageHeight,
  };
  return { p0, cp1, cp2, p3 };
}

// Ray casting algorithm to check if point is inside polygon
function isPointInPolygon(
  x: number,
  y: number,
  polygon: { x: number; y: number }[]
): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

// Check if a point (in image pixels) is inside the closed bezier path
export function isPointInPath(
  px: number,
  py: number,
  points: Point[],
  imageWidth: number,
  imageHeight: number,
  isClosed: boolean
): boolean {
  if (!isClosed || points.length < 3) return false;

  // Flatten all bezier segments into a polygon
  const polygon: { x: number; y: number }[] = [];

  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const { p0, cp1, cp2, p3 } = getSegmentControlPoints(
      p1,
      p2,
      imageWidth,
      imageHeight
    );

    // Add flattened bezier points (skip first point after first segment to avoid duplicates)
    const flatPoints = flattenBezier(p0, cp1, cp2, p3, 20);
    if (i === 0) {
      polygon.push(...flatPoints);
    } else {
      polygon.push(...flatPoints.slice(1));
    }
  }

  return isPointInPolygon(px, py, polygon);
}

// Find the closest point on a bezier segment to a given point
// Returns { t, distance, point } or null if not close enough
export function closestPointOnBezier(
  px: number,
  py: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  threshold: number
): { t: number; distance: number; point: { x: number; y: number } } | null {
  let closestT = 0;
  let minDist = Infinity;
  let closestPoint = p0;

  // Sample the curve at many points to find closest
  const samples = 50;
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const pt = bezierPoint(p0, p1, p2, p3, t);
    const dist = Math.sqrt((pt.x - px) ** 2 + (pt.y - py) ** 2);
    if (dist < minDist) {
      minDist = dist;
      closestT = t;
      closestPoint = pt;
    }
  }

  if (minDist <= threshold) {
    return { t: closestT, distance: minDist, point: closestPoint };
  }
  return null;
}

// Find which segment (if any) was clicked, and where on it
export function findClickedSegment(
  px: number,
  py: number,
  points: Point[],
  imageWidth: number,
  imageHeight: number,
  isClosed: boolean,
  threshold: number
): { segmentIndex: number; t: number; point: { x: number; y: number } } | null {
  if (points.length < 2) return null;

  const segmentCount = isClosed ? points.length : points.length - 1;
  let bestResult: {
    segmentIndex: number;
    t: number;
    distance: number;
    point: { x: number; y: number };
  } | null = null;

  for (let i = 0; i < segmentCount; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    const { p0, cp1, cp2, p3 } = getSegmentControlPoints(
      p1,
      p2,
      imageWidth,
      imageHeight
    );

    const result = closestPointOnBezier(px, py, p0, cp1, cp2, p3, threshold);
    if (result && (!bestResult || result.distance < bestResult.distance)) {
      bestResult = { segmentIndex: i, ...result };
    }
  }

  if (bestResult) {
    return {
      segmentIndex: bestResult.segmentIndex,
      t: bestResult.t,
      point: bestResult.point,
    };
  }
  return null;
}

// De Casteljau's algorithm to split a bezier curve at parameter t
// Returns the control points for the two new curves
export function splitBezier(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number
): {
  left: {
    p0: { x: number; y: number };
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    p3: { x: number; y: number };
  };
  right: {
    p0: { x: number; y: number };
    p1: { x: number; y: number };
    p2: { x: number; y: number };
    p3: { x: number; y: number };
  };
} {
  // First level
  const p01 = { x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t };
  const p12 = { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t };
  const p23 = { x: p2.x + (p3.x - p2.x) * t, y: p2.y + (p3.y - p2.y) * t };

  // Second level
  const p012 = {
    x: p01.x + (p12.x - p01.x) * t,
    y: p01.y + (p12.y - p01.y) * t,
  };
  const p123 = {
    x: p12.x + (p23.x - p12.x) * t,
    y: p12.y + (p23.y - p12.y) * t,
  };

  // Third level - the split point
  const p0123 = {
    x: p012.x + (p123.x - p012.x) * t,
    y: p012.y + (p123.y - p012.y) * t,
  };

  return {
    left: { p0: p0, p1: p01, p2: p012, p3: p0123 },
    right: { p0: p0123, p1: p123, p2: p23, p3: p3 },
  };
}
