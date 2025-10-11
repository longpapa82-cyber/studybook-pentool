// E-Book 뷰어 상태 관리 (Zustand)

import { create } from 'zustand';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { DisplayMode } from '@/types';

interface EbookState {
  // PDF 문서
  pdfDocument: PDFDocumentProxy | null;
  pdfId: string | null;
  pdfName: string | null;

  // 뷰어 상태
  currentPage: number;
  totalPages: number;
  displayMode: DisplayMode;
  zoom: number;
  rotation: number;

  // UI 상태
  isLoading: boolean;
  error: string | null;
  isThumbnailPanelOpen: boolean;

  // Actions
  setPdfDocument: (pdf: PDFDocumentProxy, id: string, name: string) => void;
  setCurrentPage: (page: number) => void;
  setDisplayMode: (mode: DisplayMode) => void;
  setZoom: (zoom: number) => void;
  setRotation: (rotation: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  toggleThumbnailPanel: () => void;
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  rotate: (degrees: number) => void;
  reset: () => void;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;
const ZOOM_STEP = 0.25;

export const useEbookStore = create<EbookState>((set, get) => ({
  // Initial state
  pdfDocument: null,
  pdfId: null,
  pdfName: null,
  currentPage: 1,
  totalPages: 0,
  displayMode: 'single',
  zoom: 1.0,
  rotation: 0,
  isLoading: false,
  error: null,
  isThumbnailPanelOpen: true, // 기본값을 true로 변경

  // Actions
  setPdfDocument: (pdf, id, name) => {
    set({
      pdfDocument: pdf,
      pdfId: id,
      pdfName: name,
      totalPages: pdf.numPages,
      currentPage: 1,
      error: null,
    });
  },

  setCurrentPage: (page) => {
    const { totalPages } = get();
    if (page >= 1 && page <= totalPages) {
      set({ currentPage: page });
    }
  },

  setDisplayMode: (mode) => {
    set({ displayMode: mode });
  },

  setZoom: (zoom) => {
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    set({ zoom: clampedZoom });
  },

  setRotation: (rotation) => {
    set({ rotation: rotation % 360 });
  },

  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ error });
  },

  toggleThumbnailPanel: () => {
    set((state) => ({ isThumbnailPanelOpen: !state.isThumbnailPanelOpen }));
  },

  goToPage: (page) => {
    get().setCurrentPage(page);
  },

  nextPage: () => {
    const { currentPage, totalPages, displayMode } = get();
    const step = displayMode === 'double' ? 2 : 1;
    if (currentPage + step <= totalPages) {
      set({ currentPage: currentPage + step });
    } else if (currentPage < totalPages) {
      // 마지막 페이지로 이동
      set({ currentPage: totalPages });
    }
  },

  previousPage: () => {
    const { currentPage, displayMode } = get();
    const step = displayMode === 'double' ? 2 : 1;
    if (currentPage - step >= 1) {
      set({ currentPage: currentPage - step });
    } else if (currentPage > 1) {
      // 첫 페이지로 이동
      set({ currentPage: 1 });
    }
  },

  zoomIn: () => {
    const { zoom } = get();
    get().setZoom(zoom + ZOOM_STEP);
  },

  zoomOut: () => {
    const { zoom } = get();
    get().setZoom(zoom - ZOOM_STEP);
  },

  resetZoom: () => {
    set({ zoom: 1.0 });
  },

  rotate: (degrees) => {
    const { rotation } = get();
    set({ rotation: (rotation + degrees) % 360 });
  },

  reset: () => {
    set({
      pdfDocument: null,
      pdfId: null,
      pdfName: null,
      currentPage: 1,
      totalPages: 0,
      displayMode: 'single',
      zoom: 1.0,
      rotation: 0,
      isLoading: false,
      error: null,
      isThumbnailPanelOpen: false,
    });
  },
}));
