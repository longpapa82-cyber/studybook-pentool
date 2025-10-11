// 펜툴 관련 타입 정의

export type PenTool = 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rectangle' | 'circle' | 'text' | 'none';
export type InputMode = 'touch' | 'pen';

export interface PenConfig {
  type: PenTool;
  color: string;
  strokeWidth: number;
  opacity: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface DrawingLine {
  tool: PenTool;
  points: number[];
  color: string;
  strokeWidth: number;
}

export interface ShapeData {
  tool: PenTool;
  startPoint: Point;
  endPoint: Point;
  color: string;
  strokeWidth: number;
  fill?: string;
}

export interface TextData {
  text: string;
  position: Point;
  color: string;
  fontSize: number;
  fontFamily: string;
  fontStyle: 'normal' | 'italic';
  fontWeight: 'normal' | 'bold';
  align: 'left' | 'center' | 'right';
  width?: number;
  backgroundColor?: string;
  padding?: number;
}

export interface Annotation {
  id: string;
  pageNumber: number;
  type: 'drawing' | 'shape' | 'text';
  data: DrawingLine | ShapeData | TextData;
  createdAt: string;
}

export interface DrawingState {
  isDrawing: boolean;
  currentStroke: number[];
  annotations: Annotation[];
}

export interface ToolPaletteState {
  selectedTool: PenTool;
  color: string;
  strokeWidth: number;
  inputMode: InputMode;
}
