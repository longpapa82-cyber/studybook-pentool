import { describe, it, expect, beforeEach } from 'vitest';
import { usePentoolStore } from '@/stores/pentoolStore';
import type { PenTool } from '@/types/pentool.types';

describe('pentoolStore', () => {
  beforeEach(() => {
    // Reset store before each test
    usePentoolStore.setState({
      activeTool: 'none',
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
  });

  describe('Tool Selection', () => {
    it('should set active tool', () => {
      const { setActiveTool } = usePentoolStore.getState();

      // Action
      setActiveTool('pen');

      // Assert
      expect(usePentoolStore.getState().activeTool).toBe('pen');
    });

    it('should change between different tools', () => {
      const { setActiveTool } = usePentoolStore.getState();

      const tools: PenTool[] = ['pen', 'highlighter', 'eraser', 'line', 'none'];

      tools.forEach((tool) => {
        setActiveTool(tool);
        expect(usePentoolStore.getState().activeTool).toBe(tool);
      });
    });
  });

  describe('Color and Stroke', () => {
    it('should set pen color', () => {
      const { setPenColor } = usePentoolStore.getState();

      // Action
      setPenColor('#FF0000');

      // Assert
      expect(usePentoolStore.getState().penColor).toBe('#FF0000');
    });

    it('should set stroke width', () => {
      const { setStrokeWidth } = usePentoolStore.getState();

      // Action
      setStrokeWidth(5);

      // Assert
      expect(usePentoolStore.getState().strokeWidth).toBe(5);
    });

    it('should handle different stroke widths', () => {
      const { setStrokeWidth } = usePentoolStore.getState();

      const widths = [1, 2, 4, 8];

      widths.forEach((width) => {
        setStrokeWidth(width);
        expect(usePentoolStore.getState().strokeWidth).toBe(width);
      });
    });
  });

  describe('Drawing Operations', () => {
    it('should start drawing', () => {
      const { startDrawing, setActiveTool } = usePentoolStore.getState();

      // Setup
      setActiveTool('pen');

      // Action
      startDrawing({ x: 100, y: 100 });

      // Assert
      const state = usePentoolStore.getState();
      expect(state.isDrawing).toBe(true);
      expect(state.currentLine).not.toBeNull();
      expect(state.currentLine?.points).toEqual([100, 100]);
    });

    it('should continue drawing', () => {
      const { startDrawing, continueDrawing, setActiveTool } =
        usePentoolStore.getState();

      // Setup
      setActiveTool('pen');
      startDrawing({ x: 100, y: 100 });

      // Action
      continueDrawing({ x: 150, y: 150 });

      // Assert
      const state = usePentoolStore.getState();
      expect(state.currentLine?.points).toEqual([100, 100, 150, 150]);
    });

    it('should finish drawing and add to annotations', () => {
      const { startDrawing, continueDrawing, finishDrawing, setActiveTool } =
        usePentoolStore.getState();

      // Setup
      setActiveTool('pen');
      startDrawing({ x: 100, y: 100 });
      continueDrawing({ x: 150, y: 150 });
      continueDrawing({ x: 200, y: 200 });

      // Action
      finishDrawing(1); // page 1

      // Assert
      const state = usePentoolStore.getState();
      expect(state.isDrawing).toBe(false);
      expect(state.currentLine).toBeNull();
      expect(state.annotations.get(1)).toHaveLength(1);
    });

    it('should not finish drawing if line too short', () => {
      const { startDrawing, continueDrawing, finishDrawing, setActiveTool } =
        usePentoolStore.getState();

      // Setup
      setActiveTool('pen');
      startDrawing({ x: 100, y: 100 });
      continueDrawing({ x: 101, y: 101 }); // Very short line

      // Action
      finishDrawing(1);

      // Assert
      const state = usePentoolStore.getState();
      expect(state.annotations.get(1) || []).toHaveLength(0);
    });
  });

  describe('Annotation Management', () => {
    it('should add annotation', () => {
      const { addAnnotation } = usePentoolStore.getState();

      const annotation = {
        id: 'test-1',
        pageNumber: 1,
        type: 'drawing' as const,
        data: {
          points: [100, 100, 200, 200],
          tool: 'pen' as const,
          color: '#000000',
          strokeWidth: 2,
        },
        createdAt: new Date().toISOString(),
      };

      // Action
      addAnnotation(1, annotation);

      // Assert
      const state = usePentoolStore.getState();
      expect(state.annotations.get(1)).toHaveLength(1);
      expect(state.annotations.get(1)?.[0].id).toBe('test-1');
    });

    it('should remove annotation', () => {
      const { addAnnotation, removeAnnotation } = usePentoolStore.getState();

      const annotation = {
        id: 'test-1',
        pageNumber: 1,
        type: 'drawing' as const,
        data: {
          points: [100, 100, 200, 200],
          tool: 'pen' as const,
          color: '#000000',
          strokeWidth: 2,
        },
        createdAt: new Date().toISOString(),
      };

      // Setup
      addAnnotation(1, annotation);
      expect(usePentoolStore.getState().annotations.get(1)).toHaveLength(1);

      // Action
      removeAnnotation(1, 'test-1');

      // Assert
      expect(usePentoolStore.getState().annotations.get(1)).toHaveLength(0);
    });

    it('should clear all annotations for a page', () => {
      const { addAnnotation, clearAnnotations } = usePentoolStore.getState();

      // Setup - add multiple annotations
      for (let i = 0; i < 5; i++) {
        addAnnotation(1, {
          id: `test-${i}`,
          pageNumber: 1,
          type: 'drawing' as const,
          data: {
            points: [100, 100, 200, 200],
            tool: 'pen' as const,
            color: '#000000',
            strokeWidth: 2,
          },
          createdAt: new Date().toISOString(),
        });
      }

      expect(usePentoolStore.getState().annotations.get(1)).toHaveLength(5);

      // Action
      clearAnnotations(1);

      // Assert
      expect(usePentoolStore.getState().annotations.get(1)).toHaveLength(0);
    });
  });

  describe('Selection', () => {
    it('should select annotation', () => {
      const { selectAnnotation } = usePentoolStore.getState();

      // Action
      selectAnnotation('test-1');

      // Assert
      expect(usePentoolStore.getState().selectedAnnotationId).toBe('test-1');
    });

    it('should clear selection', () => {
      const { selectAnnotation, clearSelection } = usePentoolStore.getState();

      // Setup
      selectAnnotation('test-1');
      expect(usePentoolStore.getState().selectedAnnotationId).toBe('test-1');

      // Action
      clearSelection();

      // Assert
      expect(usePentoolStore.getState().selectedAnnotationId).toBeNull();
      expect(usePentoolStore.getState().selectedAnnotations.size).toBe(0);
    });

    it('should toggle multi-selection', () => {
      const { toggleAnnotationSelection } = usePentoolStore.getState();

      // Action - select first
      toggleAnnotationSelection('test-1');
      expect(usePentoolStore.getState().selectedAnnotations.has('test-1')).toBe(
        true
      );

      // Action - select second
      toggleAnnotationSelection('test-2');
      expect(usePentoolStore.getState().selectedAnnotations.size).toBe(2);

      // Action - deselect first
      toggleAnnotationSelection('test-1');
      expect(usePentoolStore.getState().selectedAnnotations.has('test-1')).toBe(
        false
      );
      expect(usePentoolStore.getState().selectedAnnotations.size).toBe(1);
    });
  });

  describe('Undo/Redo', () => {
    it('should support undo', () => {
      const { startDrawing, continueDrawing, finishDrawing, setActiveTool, undo } =
        usePentoolStore.getState();

      // Setup - draw something
      setActiveTool('pen');
      startDrawing({ x: 100, y: 100 });
      continueDrawing({ x: 200, y: 200 });
      finishDrawing(1);

      expect(usePentoolStore.getState().annotations.get(1)).toHaveLength(1);

      // Action
      undo();

      // Assert
      expect(usePentoolStore.getState().annotations.get(1)).toHaveLength(0);
    });

    it('should support redo', () => {
      const {
        startDrawing,
        continueDrawing,
        finishDrawing,
        setActiveTool,
        undo,
        redo,
      } = usePentoolStore.getState();

      // Setup
      setActiveTool('pen');
      startDrawing({ x: 100, y: 100 });
      continueDrawing({ x: 200, y: 200 });
      finishDrawing(1);

      // Undo
      undo();
      expect(usePentoolStore.getState().annotations.get(1)).toHaveLength(0);

      // Action - Redo
      redo();

      // Assert
      expect(usePentoolStore.getState().annotations.get(1)).toHaveLength(1);
    });

    it('should not undo beyond history', () => {
      const { undo } = usePentoolStore.getState();

      // Try to undo with no history
      undo();
      undo();
      undo();

      // Should not crash
      expect(usePentoolStore.getState().historyIndex).toBe(-1);
    });

    it('should not redo beyond history', () => {
      const { redo } = usePentoolStore.getState();

      // Try to redo with no future
      redo();
      redo();
      redo();

      // Should not crash
      expect(usePentoolStore.getState().historyIndex).toBe(-1);
    });
  });

  describe('Copy/Paste', () => {
    it('should copy annotation', () => {
      const { addAnnotation, copyAnnotation } = usePentoolStore.getState();

      const annotation = {
        id: 'test-1',
        pageNumber: 1,
        type: 'drawing' as const,
        data: {
          points: [100, 100, 200, 200],
          tool: 'pen' as const,
          color: '#000000',
          strokeWidth: 2,
        },
        createdAt: new Date().toISOString(),
      };

      // Setup
      addAnnotation(1, annotation);

      // Action
      copyAnnotation('test-1', 1);

      // Assert
      const state = usePentoolStore.getState();
      expect(state.clipboardAnnotation).not.toBeNull();
      expect(state.clipboardAnnotation?.type).toBe('drawing');
    });

    it('should paste annotation with offset', () => {
      const { addAnnotation, copyAnnotation, pasteAnnotation } =
        usePentoolStore.getState();

      const annotation = {
        id: 'test-1',
        pageNumber: 1,
        type: 'drawing' as const,
        data: {
          points: [100, 100, 200, 200],
          tool: 'pen' as const,
          color: '#000000',
          strokeWidth: 2,
        },
        createdAt: new Date().toISOString(),
      };

      // Setup
      addAnnotation(1, annotation);
      copyAnnotation('test-1', 1);

      // Action
      pasteAnnotation(1);

      // Assert
      const annotations = usePentoolStore.getState().annotations.get(1);
      expect(annotations).toHaveLength(2);
      // New annotation should have different ID
      expect(annotations?.[0].id).not.toBe(annotations?.[1].id);
    });
  });
});
