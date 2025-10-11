import { create } from 'zustand';
import type { PenTool, DrawingLine, Annotation, TextData, ShapeData, Point } from '@/types/pentool.types';
import { simplifyPoints } from '@/utils/geometryUtils';
import { saveToLocalStorage, loadFromLocalStorage } from '@/utils/storageUtils';

interface PentoolState {
  // 현재 활성화된 도구
  activeTool: PenTool;

  // 도구 설정
  penColor: string;
  strokeWidth: number;

  // 그리기 상태
  isDrawing: boolean;
  currentLine: DrawingLine | null;

  // Phase 3-3: Shape drawing state
  isDrawingShape: boolean;
  currentShape: ShapeData | null;

  // 주석 데이터
  annotations: Map<number, Annotation[]>; // pageNumber -> annotations

  // 선택 상태
  selectedAnnotationId: string | null;
  selectedAnnotations: Set<string>; // 다중 선택
  clipboardAnnotation: Annotation | null;

  // Undo/Redo 스택
  history: Annotation[][];
  historyIndex: number;

  // Actions
  setActiveTool: (tool: PenTool) => void;
  setPenColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;

  startDrawing: (point: { x: number; y: number }) => void;
  continueDrawing: (point: { x: number; y: number }) => void;
  finishDrawing: (pageNumber: number) => void;

  // Phase 3-3: Shape drawing
  startShape: (point: Point) => void;
  updateShape: (point: Point, shiftKey?: boolean) => void;
  finishShape: (pageNumber: number) => void;
  cancelShape: () => void;

  // Text annotation
  addTextAnnotation: (pageNumber: number, textData: TextData) => void;
  updateTextAnnotation: (pageNumber: number, annotationId: string, textData: Partial<TextData>) => void;

  addAnnotation: (pageNumber: number, annotation: Annotation) => void;
  removeAnnotation: (pageNumber: number, annotationId: string) => void;
  clearPageAnnotations: (pageNumber: number) => void;

  // 선택 관련
  selectAnnotation: (annotationId: string | null) => void;
  toggleAnnotationSelection: (annotationId: string) => void;
  clearSelection: () => void;
  selectMultipleAnnotations: (annotationIds: string[]) => void;  // Phase 3-2
  addToSelection: (annotationIds: string[]) => void;  // Phase 3-2

  // 편집 관련
  updateAnnotation: (pageNumber: number, annotationId: string, updates: Partial<Annotation>) => void;
  moveAnnotation: (pageNumber: number, annotationId: string, deltaX: number, deltaY: number) => void;
  moveMultipleAnnotations: (pageNumber: number, annotationIds: string[], deltaX: number, deltaY: number) => void;  // Phase 3-2
  deleteMultipleAnnotations: (pageNumber: number, annotationIds: string[]) => void;  // Phase 3-2

  // 복사/붙여넣기
  copyAnnotation: (annotationId: string, pageNumber: number) => void;
  pasteAnnotation: (pageNumber: number) => void;

  undo: () => void;
  redo: () => void;

  loadAnnotations: (pageNumber: number, annotations: Annotation[]) => void;
  reset: () => void;

  // Phase 4-1: Export/Import and persistence
  exportAnnotations: (pdfFileName?: string) => void;
  importAnnotations: (annotationsMap: Map<number, Annotation[]>) => void;
  saveToStorage: (pdfFileName?: string) => boolean;
  loadFromStorage: (pdfFileName?: string) => boolean;
  currentPdfFileName: string;
  setCurrentPdfFileName: (fileName: string) => void;
}

export const usePentoolStore = create<PentoolState>((set, get) => ({
  activeTool: 'pen',
  penColor: '#000000',
  strokeWidth: 2,
  isDrawing: false,
  currentLine: null,
  isDrawingShape: false,
  currentShape: null,
  annotations: new Map(),
  selectedAnnotationId: null,
  selectedAnnotations: new Set(),
  clipboardAnnotation: null,
  history: [],
  historyIndex: -1,
  currentPdfFileName: 'document',

  setActiveTool: (tool) => set({ activeTool: tool }),

  setPenColor: (color) => set({ penColor: color }),

  setStrokeWidth: (width) => set({ strokeWidth: width }),

  startDrawing: (point) => {
    const { activeTool, penColor, strokeWidth } = get();

    set({
      isDrawing: true,
      currentLine: {
        tool: activeTool,
        points: [point.x, point.y],
        color: penColor,
        strokeWidth,
      },
    });
  },

  continueDrawing: (point) => {
    const { currentLine } = get();

    if (!currentLine) return;

    set({
      currentLine: {
        ...currentLine,
        points: [...currentLine.points, point.x, point.y],
      },
    });
  },

  finishDrawing: (pageNumber) => {
    const { currentLine, annotations } = get();

    if (!currentLine || currentLine.points.length < 4) {
      set({ isDrawing: false, currentLine: null });
      return;
    }

    // 포인트 단순화 적용 (50% 이상 포인트 수 감소, 메모리 및 성능 향상)
    const simplifiedPoints = simplifyPoints(currentLine.points, 1.0);

    const newAnnotation: Annotation = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'drawing',
      data: {
        ...currentLine,
        points: simplifiedPoints,
      },
      pageNumber,
      createdAt: new Date().toISOString(),
    };

    const pageAnnotations = annotations.get(pageNumber) || [];
    const newAnnotations = new Map(annotations);
    newAnnotations.set(pageNumber, [...pageAnnotations, newAnnotation]);

    // History 업데이트
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(Array.from(newAnnotations.values()).flat());

    set({
      isDrawing: false,
      currentLine: null,
      annotations: newAnnotations,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  // Phase 3-1: Text annotation methods
  addTextAnnotation: (pageNumber, textData) => {
    const { annotations } = get();

    const newAnnotation: Annotation = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'text',
      data: textData,
      pageNumber,
      createdAt: new Date().toISOString(),
    };

    const pageAnnotations = annotations.get(pageNumber) || [];
    const newAnnotations = new Map(annotations);
    newAnnotations.set(pageNumber, [...pageAnnotations, newAnnotation]);

    // History 업데이트
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(Array.from(newAnnotations.values()).flat());

    set({
      annotations: newAnnotations,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  updateTextAnnotation: (pageNumber, annotationId, textData) => {
    const { annotations } = get();
    const pageAnnotations = annotations.get(pageNumber) || [];

    const updatedAnnotations = pageAnnotations.map((annotation) => {
      if (annotation.id === annotationId && annotation.type === 'text') {
        return {
          ...annotation,
          data: {
            ...annotation.data,
            ...textData,
          },
        };
      }
      return annotation;
    });

    const newAnnotations = new Map(annotations);
    newAnnotations.set(pageNumber, updatedAnnotations);

    set({ annotations: newAnnotations });
  },

  // Phase 3-3: Shape drawing methods
  startShape: (point) => {
    const { activeTool, penColor, strokeWidth } = get();

    if (!['line', 'arrow', 'rectangle', 'circle'].includes(activeTool)) {
      return;
    }

    set({
      isDrawingShape: true,
      currentShape: {
        tool: activeTool,
        startPoint: point,
        endPoint: point,
        color: penColor,
        strokeWidth,
      },
    });
  },

  updateShape: (point, shiftKey = false) => {
    const { currentShape } = get();
    if (!currentShape) return;

    let endPoint = point;

    // Apply constraints with Shift key
    if (shiftKey) {
      const { constrainShapePoint } = require('@/utils/shapeUtils');
      endPoint = constrainShapePoint(currentShape.startPoint, point, currentShape.tool);
    }

    set({
      currentShape: {
        ...currentShape,
        endPoint,
      },
    });
  },

  finishShape: (pageNumber) => {
    const { currentShape, annotations } = get();

    if (!currentShape) {
      set({ isDrawingShape: false, currentShape: null });
      return;
    }

    // Validate shape has minimum size
    const dx = Math.abs(currentShape.endPoint.x - currentShape.startPoint.x);
    const dy = Math.abs(currentShape.endPoint.y - currentShape.startPoint.y);
    if (dx < 5 && dy < 5) {
      set({ isDrawingShape: false, currentShape: null });
      return;
    }

    const newAnnotation: Annotation = {
      id: `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'shape',
      data: currentShape,
      pageNumber,
      createdAt: new Date().toISOString(),
    };

    const pageAnnotations = annotations.get(pageNumber) || [];
    const newAnnotations = new Map(annotations);
    newAnnotations.set(pageNumber, [...pageAnnotations, newAnnotation]);

    // History 업데이트
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(Array.from(newAnnotations.values()).flat());

    set({
      isDrawingShape: false,
      currentShape: null,
      annotations: newAnnotations,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  cancelShape: () => {
    set({
      isDrawingShape: false,
      currentShape: null,
    });
  },

  addAnnotation: (pageNumber, annotation) => {
    const { annotations } = get();
    const pageAnnotations = annotations.get(pageNumber) || [];
    const newAnnotations = new Map(annotations);
    newAnnotations.set(pageNumber, [...pageAnnotations, annotation]);

    set({ annotations: newAnnotations });
  },

  removeAnnotation: (pageNumber, annotationId) => {
    const { annotations } = get();
    const pageAnnotations = annotations.get(pageNumber) || [];
    const newAnnotations = new Map(annotations);
    newAnnotations.set(
      pageNumber,
      pageAnnotations.filter((a) => a.id !== annotationId)
    );

    // History 업데이트
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(Array.from(newAnnotations.values()).flat());

    set({
      annotations: newAnnotations,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  clearPageAnnotations: (pageNumber) => {
    const { annotations } = get();
    const newAnnotations = new Map(annotations);
    newAnnotations.set(pageNumber, []);

    set({ annotations: newAnnotations });
  },

  // 선택 관련
  selectAnnotation: (annotationId) => {
    set({
      selectedAnnotationId: annotationId,
      selectedAnnotations: annotationId ? new Set([annotationId]) : new Set()
    });
  },

  toggleAnnotationSelection: (annotationId) => {
    const { selectedAnnotations } = get();
    const newSelection = new Set(selectedAnnotations);

    if (newSelection.has(annotationId)) {
      newSelection.delete(annotationId);
    } else {
      newSelection.add(annotationId);
    }

    set({
      selectedAnnotations: newSelection,
      selectedAnnotationId: newSelection.size === 1 ? Array.from(newSelection)[0] : null
    });
  },

  clearSelection: () => {
    set({
      selectedAnnotationId: null,
      selectedAnnotations: new Set()
    });
  },

  // Phase 3-2: Multi-selection methods
  selectMultipleAnnotations: (annotationIds) => {
    const newSelection = new Set(annotationIds);
    set({
      selectedAnnotations: newSelection,
      selectedAnnotationId: newSelection.size === 1 ? annotationIds[0] : null
    });
  },

  addToSelection: (annotationIds) => {
    const { selectedAnnotations } = get();
    const newSelection = new Set([...selectedAnnotations, ...annotationIds]);
    set({
      selectedAnnotations: newSelection,
      selectedAnnotationId: newSelection.size === 1 ? Array.from(newSelection)[0] : null
    });
  },

  // 편집 관련
  updateAnnotation: (pageNumber, annotationId, updates) => {
    const { annotations } = get();
    const pageAnnotations = annotations.get(pageNumber) || [];
    const newAnnotations = new Map(annotations);

    const updatedPageAnnotations = pageAnnotations.map((annotation) =>
      annotation.id === annotationId
        ? { ...annotation, ...updates }
        : annotation
    );

    newAnnotations.set(pageNumber, updatedPageAnnotations);

    // History 업데이트
    const { history, historyIndex } = get();
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(Array.from(newAnnotations.values()).flat());

    set({
      annotations: newAnnotations,
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },

  moveAnnotation: (pageNumber, annotationId, deltaX, deltaY) => {
    const { annotations } = get();
    const pageAnnotations = annotations.get(pageNumber) || [];
    const annotation = pageAnnotations.find((a) => a.id === annotationId);

    if (!annotation) return;

    if (annotation.type === 'drawing') {
      const movedPoints = annotation.data.points.map((point, index) =>
        index % 2 === 0 ? point + deltaX : point + deltaY
      );

      const { updateAnnotation } = get();
      updateAnnotation(pageNumber, annotationId, {
        data: { ...annotation.data, points: movedPoints },
      });
    } else if (annotation.type === 'text') {
      const textData = annotation.data;
      const { updateAnnotation } = get();
      updateAnnotation(pageNumber, annotationId, {
        data: {
          ...textData,
          position: {
            x: textData.position.x + deltaX,
            y: textData.position.y + deltaY,
          },
        },
      });
    }
  },

  // Phase 3-2: Batch operations
  moveMultipleAnnotations: (pageNumber, annotationIds, deltaX, deltaY) => {
    const { moveAnnotation } = get();
    annotationIds.forEach((id) => {
      moveAnnotation(pageNumber, id, deltaX, deltaY);
    });
  },

  deleteMultipleAnnotations: (pageNumber, annotationIds) => {
    const { removeAnnotation, clearSelection } = get();
    annotationIds.forEach((id) => {
      removeAnnotation(pageNumber, id);
    });
    clearSelection();
  },

  // 복사/붙여넣기
  copyAnnotation: (annotationId, pageNumber) => {
    const { annotations } = get();
    const pageAnnotations = annotations.get(pageNumber) || [];
    const annotation = pageAnnotations.find((a) => a.id === annotationId);

    if (annotation) {
      set({ clipboardAnnotation: annotation });
    }
  },

  pasteAnnotation: (pageNumber) => {
    const { clipboardAnnotation, addAnnotation } = get();

    if (!clipboardAnnotation) return;

    const newAnnotation: Annotation = {
      ...clipboardAnnotation,
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      pageNumber,
      createdAt: new Date().toISOString(),
    };

    // 약간 오프셋 추가 (10px)
    if (newAnnotation.type === 'drawing') {
      const offsetPoints = newAnnotation.data.points.map((point, index) =>
        index % 2 === 0 ? point + 10 : point + 10
      );
      newAnnotation.data = { ...newAnnotation.data, points: offsetPoints };
    }

    addAnnotation(pageNumber, newAnnotation);
  },

  undo: () => {
    const { history, historyIndex } = get();

    if (historyIndex <= 0) return;

    const previousState = history[historyIndex - 1];
    const newAnnotations = new Map<number, Annotation[]>();

    previousState.forEach((annotation) => {
      const pageAnnotations = newAnnotations.get(annotation.pageNumber) || [];
      newAnnotations.set(annotation.pageNumber, [...pageAnnotations, annotation]);
    });

    set({
      annotations: newAnnotations,
      historyIndex: historyIndex - 1,
    });
  },

  redo: () => {
    const { history, historyIndex } = get();

    if (historyIndex >= history.length - 1) return;

    const nextState = history[historyIndex + 1];
    const newAnnotations = new Map<number, Annotation[]>();

    nextState.forEach((annotation) => {
      const pageAnnotations = newAnnotations.get(annotation.pageNumber) || [];
      newAnnotations.set(annotation.pageNumber, [...pageAnnotations, annotation]);
    });

    set({
      annotations: newAnnotations,
      historyIndex: historyIndex + 1,
    });
  },

  loadAnnotations: (pageNumber, annotations) => {
    const { annotations: currentAnnotations } = get();
    const newAnnotations = new Map(currentAnnotations);
    newAnnotations.set(pageNumber, annotations);

    set({ annotations: newAnnotations });
  },

  reset: () => {
    set({
      activeTool: 'pen',
      penColor: '#000000',
      strokeWidth: 2,
      isDrawing: false,
      currentLine: null,
      annotations: new Map(),
      selectedAnnotationId: null,
      selectedAnnotations: new Set(),
      clipboardAnnotation: null,
      history: [],
      historyIndex: -1,
    });
  },

  // Phase 4-1: Export/Import methods
  exportAnnotations: (pdfFileName) => {
    const { annotations, currentPdfFileName } = get();
    const fileName = pdfFileName || currentPdfFileName;

    // Use storage utils to download JSON
    const { downloadAnnotationsJSON } = require('@/utils/storageUtils');
    downloadAnnotationsJSON(annotations, fileName);
  },

  importAnnotations: (annotationsMap) => {
    set({
      annotations: annotationsMap,
      selectedAnnotationId: null,
      selectedAnnotations: new Set(),
      history: [Array.from(annotationsMap.values()).flat()],
      historyIndex: 0,
    });
  },

  saveToStorage: (pdfFileName) => {
    const { annotations, currentPdfFileName } = get();
    const fileName = pdfFileName || currentPdfFileName;
    return saveToLocalStorage(annotations, fileName);
  },

  loadFromStorage: (pdfFileName) => {
    const { currentPdfFileName } = get();
    const fileName = pdfFileName || currentPdfFileName;
    const annotationsMap = loadFromLocalStorage(fileName);

    if (annotationsMap) {
      set({
        annotations: annotationsMap,
        history: [Array.from(annotationsMap.values()).flat()],
        historyIndex: 0,
      });
      return true;
    }

    return false;
  },

  setCurrentPdfFileName: (fileName) => {
    set({ currentPdfFileName: fileName });
  },
}));
