import { create } from 'zustand';
import type { PenTool, DrawingLine, Annotation, TextData } from '@/types/pentool.types';
import { simplifyPoints } from '@/utils/geometryUtils';

interface PentoolState {
  // 현재 활성화된 도구
  activeTool: PenTool;

  // 도구 설정
  penColor: string;
  strokeWidth: number;

  // 그리기 상태
  isDrawing: boolean;
  currentLine: DrawingLine | null;

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

  // 편집 관련
  updateAnnotation: (pageNumber: number, annotationId: string, updates: Partial<Annotation>) => void;
  moveAnnotation: (pageNumber: number, annotationId: string, deltaX: number, deltaY: number) => void;

  // 복사/붙여넣기
  copyAnnotation: (annotationId: string, pageNumber: number) => void;
  pasteAnnotation: (pageNumber: number) => void;

  undo: () => void;
  redo: () => void;

  loadAnnotations: (pageNumber: number, annotations: Annotation[]) => void;
  reset: () => void;
}

export const usePentoolStore = create<PentoolState>((set, get) => ({
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

    if (!annotation || annotation.type !== 'drawing') return;

    const movedPoints = annotation.data.points.map((point, index) =>
      index % 2 === 0 ? point + deltaX : point + deltaY
    );

    const { updateAnnotation } = get();
    updateAnnotation(pageNumber, annotationId, {
      data: { ...annotation.data, points: movedPoints },
    });
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
}));
