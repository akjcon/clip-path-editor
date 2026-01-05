export interface Point {
  id: string;
  x: number; // 0-100 (percentage of image)
  y: number; // 0-100 (percentage of image)
  handleIn: { x: number; y: number }; // Relative to point
  handleOut: { x: number; y: number }; // Relative to point
  isMirrored: boolean; // Whether handles are mirrored
}

export interface Project {
  id: string;
  name: string;
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  points: Point[];
  createdAt: number;
  updatedAt: number;
}

export type Tool = 'select' | 'add' | 'delete';

export interface CanvasTransform {
  x: number; // Pan X
  y: number; // Pan Y
  scale: number; // Zoom level
}

export interface EditorState {
  tool: Tool;
  points: Point[];
  selectedPointId: string | null;
  selectedHandleType: 'in' | 'out' | null;
  imageDataUrl: string | null;
  imageWidth: number;
  imageHeight: number;
}

export interface HistoryState {
  past: Point[][];
  present: Point[];
  future: Point[][];
}
