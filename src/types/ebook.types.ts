// E-Book 관련 타입 정의

export interface PdfDocument {
  id: string;
  name: string;
  file: ArrayBuffer;
  totalPages: number;
  createdAt: Date;
  updatedAt: Date;
}

export type DisplayMode = 'single' | 'double';

export interface ViewerState {
  currentPage: number;
  displayMode: DisplayMode;
  zoom: number;
  rotation: number;
}

export interface Viewport {
  width: number;
  height: number;
  scale: number;
  rotation: number;
}

export interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
}
