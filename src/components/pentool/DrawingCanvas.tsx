import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Line, Text as KonvaText, Rect, Ellipse } from 'react-konva';
import { usePentoolStore } from '@/stores/pentoolStore';
import { useEbookStore } from '@/stores/ebookStore';
import { requestAnimationFrameThrottle } from '@/utils/performanceUtils';
import { ContextMenu } from './ContextMenu';
import { TextEditor } from './TextEditor';
import { calculateViewport, expandViewport, getVisibleAnnotations } from '@/utils/viewportUtils';
import { getPerformanceMonitor } from '@/utils/performanceMonitor';
import { flatPointsToPointArray, getAnnotationsInLasso, simplifyLassoPath } from '@/utils/lassoUtils';
import { shapeToKonvaProps } from '@/utils/shapeUtils';
import type { TextData, Point, ShapeData } from '@/types/pentool.types';

interface DrawingCanvasProps {
  pdfCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

export function DrawingCanvas({ pdfCanvasRef }: DrawingCanvasProps) {
  const stageRef = useRef<any>(null);
  const lineRefs = useRef<Map<string, any>>(new Map());
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    annotationId: string;
  } | null>(null);
  const [textEditorPosition, setTextEditorPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [lassoPath, setLassoPath] = useState<Point[]>([]);  // Phase 3-2: Lasso selection
  const [isLassoDrawing, setIsLassoDrawing] = useState(false);

  const {
    activeTool,
    penColor,
    strokeWidth,
    isDrawing,
    currentLine,
    isDrawingShape,
    currentShape,
    annotations,
    selectedAnnotationId,
    selectedAnnotations,
    startDrawing,
    continueDrawing,
    finishDrawing,
    startShape,
    updateShape,
    finishShape,
    selectAnnotation,
    moveAnnotation,
    clearSelection,
    addTextAnnotation,
    updateTextAnnotation,
    selectMultipleAnnotations,
    moveMultipleAnnotations,
  } = usePentoolStore();

  const { currentPage, zoom } = useEbookStore();

  const pageAnnotations = annotations.get(currentPage) || [];
  const performanceMonitor = getPerformanceMonitor();

  // Phase 2: Viewport-based rendering for performance
  const visibleAnnotations = useMemo(() => {
    const startTime = performance.now();

    if (canvasSize.width === 0 || canvasSize.height === 0) {
      return pageAnnotations;
    }

    // Calculate current viewport with expansion for smooth scrolling
    const viewport = calculateViewport(canvasSize.width, canvasSize.height, zoom);
    const expandedViewport = expandViewport(viewport, 1.2); // 20% expansion

    // Filter to visible annotations only
    const visible = getVisibleAnnotations(pageAnnotations, expandedViewport);

    // Record performance metrics
    const renderTime = performance.now() - startTime;
    performanceMonitor.record({
      renderTime,
      annotationCount: pageAnnotations.length,
      visibleAnnotationCount: visible.length,
      memoryUsage: performanceMonitor.getMemoryUsage(),
    });

    return visible;
  }, [pageAnnotations, canvasSize, zoom, performanceMonitor]);

  // PDF 캔버스 크기와 동기화
  useEffect(() => {
    const updateSize = () => {
      if (pdfCanvasRef.current) {
        const rect = pdfCanvasRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    if (pdfCanvasRef.current) {
      observer.observe(pdfCanvasRef.current);
    }

    return () => observer.disconnect();
  }, [pdfCanvasRef, zoom]);

  const handleMouseDown = (e: any) => {
    const clickedOnEmpty = e.target === e.target.getStage();

    // 빈 공간 클릭 시 선택 해제
    if (clickedOnEmpty && activeTool === 'none') {
      clearSelection();
      return;
    }

    // Phase 3-1: Text tool handling
    if (activeTool === 'text') {
      const pos = e.target.getStage().getPointerPosition();
      setTextEditorPosition({ x: pos.x, y: pos.y });
      setEditingTextId(null);
      return;
    }

    // Phase 3-2: Lasso tool handling
    if (activeTool === 'lasso') {
      const pos = e.target.getStage().getPointerPosition();
      setIsLassoDrawing(true);
      setLassoPath([{ x: pos.x, y: pos.y }]);
      return;
    }

    // Phase 3-3: Shape tool handling
    if (['line', 'arrow', 'rectangle', 'circle'].includes(activeTool)) {
      const pos = e.target.getStage().getPointerPosition();
      startShape({ x: pos.x, y: pos.y });
      return;
    }

    // 선택 모드가 아닐 때는 드로잉
    if (activeTool !== 'none') {
      const pos = e.target.getStage().getPointerPosition();
      startDrawing({ x: pos.x, y: pos.y });
    }
  };

  // Throttle drawing events for 60fps performance
  const handleMouseMove = useCallback(
    requestAnimationFrameThrottle((e: any) => {
      // Phase 3-2: Lasso drawing
      if (isLassoDrawing) {
        const pos = e.target.getStage().getPointerPosition();
        setLassoPath((prev) => [...prev, { x: pos.x, y: pos.y }]);
        return;
      }

      // Phase 3-3: Shape drawing
      if (isDrawingShape) {
        const pos = e.target.getStage().getPointerPosition();
        const shiftKey = e.evt?.shiftKey || false;
        updateShape({ x: pos.x, y: pos.y }, shiftKey);
        return;
      }

      if (!isDrawing) return;

      const pos = e.target.getStage().getPointerPosition();
      continueDrawing({ x: pos.x, y: pos.y });
    }),
    [isDrawing, isLassoDrawing, isDrawingShape, continueDrawing, updateShape]
  );

  const handleMouseUp = () => {
    // Phase 3-2: Lasso selection completion
    if (isLassoDrawing) {
      // Simplify and close the lasso path
      const simplifiedPath = simplifyLassoPath(lassoPath, 5);
      const closedPath = [...simplifiedPath, simplifiedPath[0]];

      // Get annotations in lasso
      const selectedIds = getAnnotationsInLasso(pageAnnotations, closedPath).map((a) => a.id);

      // Select them
      selectMultipleAnnotations(selectedIds);

      // Reset lasso
      setIsLassoDrawing(false);
      setLassoPath([]);
      return;
    }

    // Phase 3-3: Shape drawing completion
    if (isDrawingShape) {
      finishShape(currentPage);
      return;
    }

    if (!isDrawing) return;
    finishDrawing(currentPage);
  };

  // 주석 클릭 처리
  const handleAnnotationClick = (annotationId: string) => {
    if (activeTool === 'none') {
      selectAnnotation(annotationId);
    }
  };

  // 주석 우클릭 처리 (컨텍스트 메뉴)
  const handleAnnotationContextMenu = (annotationId: string, e: any) => {
    e.evt.preventDefault();
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();

    setContextMenu({
      x: pointerPosition.x,
      y: pointerPosition.y,
      annotationId,
    });
    selectAnnotation(annotationId);
  };

  // 주석 드래그 시작
  const handleAnnotationDragStart = (annotationId: string, e: any) => {
    if (activeTool !== 'none') return;

    const pos = e.target.getStage().getPointerPosition();
    setDragStart({ x: pos.x, y: pos.y });
  };

  // 주석 드래그 종료
  const handleAnnotationDragEnd = (annotationId: string, e: any) => {
    if (!dragStart || activeTool !== 'none') return;

    const pos = e.target.getStage().getPointerPosition();
    const deltaX = pos.x - dragStart.x;
    const deltaY = pos.y - dragStart.y;

    if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
      moveAnnotation(currentPage, annotationId, deltaX, deltaY);
    }

    setDragStart(null);
  };

  // Phase 3-1: Text editor handlers
  const handleTextEditorComplete = (
    text: string,
    fontSize: number,
    fontFamily: string,
    fontStyle: 'normal' | 'italic',
    fontWeight: 'normal' | 'bold',
    align: 'left' | 'center' | 'right'
  ) => {
    if (!textEditorPosition) return;

    const textData: TextData = {
      text,
      position: textEditorPosition,
      color: penColor,
      fontSize,
      fontFamily,
      fontStyle,
      fontWeight,
      align,
    };

    if (editingTextId) {
      // Update existing text
      updateTextAnnotation(currentPage, editingTextId, textData);
    } else {
      // Create new text annotation
      addTextAnnotation(currentPage, textData);
    }

    setTextEditorPosition(null);
    setEditingTextId(null);
  };

  const handleTextEditorCancel = () => {
    setTextEditorPosition(null);
    setEditingTextId(null);
  };

  // Double click on text to edit
  const handleTextDoubleClick = (annotationId: string, textData: TextData) => {
    setTextEditorPosition(textData.position);
    setEditingTextId(annotationId);
  };

  // 도구별 스타일 설정 (Memoized for performance)
  const getLineStyle = useMemo(
    () => (tool: string) => {
      switch (tool) {
        case 'pen':
          return {
            stroke: penColor,
            strokeWidth: strokeWidth,
            globalCompositeOperation: 'source-over' as const,
            lineCap: 'round' as const,
            lineJoin: 'round' as const,
            tension: 0.5, // Smooth curves
            perfectDrawEnabled: false, // Performance optimization
          };
        case 'highlighter':
          return {
            stroke: penColor,
            strokeWidth: strokeWidth * 3,
            globalCompositeOperation: 'source-over' as const,
            opacity: 0.4,
            lineCap: 'round' as const,
            lineJoin: 'round' as const,
            tension: 0.5,
            perfectDrawEnabled: false,
          };
        case 'eraser':
          return {
            stroke: '#FFFFFF',
            strokeWidth: strokeWidth * 2,
            globalCompositeOperation: 'destination-out' as const,
            lineCap: 'round' as const,
            lineJoin: 'round' as const,
            perfectDrawEnabled: false,
          };
        default:
          return {};
      }
    },
    [penColor, strokeWidth]
  );

  return (
    <div
      className="absolute inset-0 pointer-events-auto"
      style={{
        cursor:
          activeTool === 'none'
            ? 'default'
            : activeTool === 'eraser'
            ? 'crosshair'
            : 'crosshair',
      }}
    >
      <Stage
        ref={stageRef}
        width={canvasSize.width}
        height={canvasSize.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <Layer>
          {/* 저장된 주석 렌더링 - Phase 2: Only visible annotations */}
          {visibleAnnotations.map((annotation) => {
            if (annotation.type === 'drawing') {
              const line = annotation.data;
              const isSelected =
                selectedAnnotationId === annotation.id || selectedAnnotations.has(annotation.id);

              return (
                <Line
                  key={annotation.id}
                  ref={(node) => {
                    if (node) {
                      lineRefs.current.set(annotation.id, node);
                    } else {
                      lineRefs.current.delete(annotation.id);
                    }
                  }}
                  points={line.points}
                  {...getLineStyle(line.tool)}
                  stroke={isSelected ? '#3B82F6' : line.color}
                  strokeWidth={isSelected ? line.strokeWidth + 2 : line.strokeWidth}
                  draggable={activeTool === 'none'}
                  onClick={() => handleAnnotationClick(annotation.id)}
                  onTap={() => handleAnnotationClick(annotation.id)}
                  onContextMenu={(e) => handleAnnotationContextMenu(annotation.id, e)}
                  onDragStart={(e) => handleAnnotationDragStart(annotation.id, e)}
                  onDragEnd={(e) => handleAnnotationDragEnd(annotation.id, e)}
                  hitStrokeWidth={Math.max(line.strokeWidth, 10)}
                  listening={activeTool === 'none'}
                />
              );
            } else if (annotation.type === 'text') {
              // Phase 3-1: Text annotation rendering
              const textData = annotation.data as TextData;
              const isSelected =
                selectedAnnotationId === annotation.id || selectedAnnotations.has(annotation.id);

              return (
                <KonvaText
                  key={annotation.id}
                  x={textData.position.x}
                  y={textData.position.y}
                  text={textData.text}
                  fontSize={textData.fontSize}
                  fontFamily={textData.fontFamily}
                  fontStyle={textData.fontStyle}
                  fill={isSelected ? '#3B82F6' : textData.color}
                  align={textData.align}
                  width={textData.width}
                  padding={textData.padding || 0}
                  draggable={activeTool === 'none'}
                  onClick={() => handleAnnotationClick(annotation.id)}
                  onDblClick={() => handleTextDoubleClick(annotation.id, textData)}
                  onContextMenu={(e) => handleAnnotationContextMenu(annotation.id, e)}
                  onDragStart={(e) => handleAnnotationDragStart(annotation.id, e)}
                  onDragEnd={(e) => handleAnnotationDragEnd(annotation.id, e)}
                  listening={activeTool === 'none'}
                />
              );
            } else if (annotation.type === 'shape') {
              // Phase 3-3: Shape annotation rendering
              const shapeData = annotation.data as ShapeData;
              const isSelected =
                selectedAnnotationId === annotation.id || selectedAnnotations.has(annotation.id);
              const konvaProps = shapeToKonvaProps(shapeData);

              const commonProps = {
                key: annotation.id,
                stroke: isSelected ? '#3B82F6' : shapeData.color,
                strokeWidth: isSelected ? shapeData.strokeWidth + 2 : shapeData.strokeWidth,
                draggable: activeTool === 'none',
                onClick: () => handleAnnotationClick(annotation.id),
                onTap: () => handleAnnotationClick(annotation.id),
                onContextMenu: (e: any) => handleAnnotationContextMenu(annotation.id, e),
                onDragStart: (e: any) => handleAnnotationDragStart(annotation.id, e),
                onDragEnd: (e: any) => handleAnnotationDragEnd(annotation.id, e),
                listening: activeTool === 'none',
              };

              if (shapeData.tool === 'line') {
                return <Line {...commonProps} points={konvaProps.points} />;
              } else if (shapeData.tool === 'arrow') {
                return (
                  <>
                    <Line
                      key={`${annotation.id}-line`}
                      {...commonProps}
                      points={konvaProps.line.points}
                    />
                    <Line
                      key={`${annotation.id}-head`}
                      points={konvaProps.arrowHead.points}
                      fill={isSelected ? '#3B82F6' : shapeData.color}
                      stroke={isSelected ? '#3B82F6' : shapeData.color}
                      strokeWidth={isSelected ? shapeData.strokeWidth + 2 : shapeData.strokeWidth}
                      closed={true}
                      listening={false}
                    />
                  </>
                );
              } else if (shapeData.tool === 'rectangle') {
                return (
                  <Rect
                    {...commonProps}
                    x={konvaProps.x}
                    y={konvaProps.y}
                    width={konvaProps.width}
                    height={konvaProps.height}
                    fill="transparent"
                  />
                );
              } else if (shapeData.tool === 'circle') {
                return (
                  <Ellipse
                    {...commonProps}
                    x={konvaProps.x}
                    y={konvaProps.y}
                    radiusX={konvaProps.radiusX}
                    radiusY={konvaProps.radiusY}
                    fill="transparent"
                  />
                );
              }
            }
            return null;
          })}

          {/* 현재 그리는 선 */}
          {currentLine && (
            <Line
              points={currentLine.points}
              {...getLineStyle(currentLine.tool)}
              stroke={currentLine.color}
              strokeWidth={currentLine.strokeWidth}
              listening={false}
            />
          )}

          {/* Phase 3-2: Lasso path visualization */}
          {isLassoDrawing && lassoPath.length > 1 && (
            <Line
              points={lassoPath.flatMap((p) => [p.x, p.y])}
              stroke="#3B82F6"
              strokeWidth={2}
              dash={[5, 5]}
              lineCap="round"
              lineJoin="round"
              closed={false}
              listening={false}
            />
          )}

          {/* Phase 3-3: Current shape preview */}
          {currentShape && (() => {
            const konvaProps = shapeToKonvaProps(currentShape);
            const previewProps = {
              stroke: currentShape.color,
              strokeWidth: currentShape.strokeWidth,
              dash: [5, 5],
              listening: false,
            };

            if (currentShape.tool === 'line') {
              return <Line {...previewProps} points={konvaProps.points} />;
            } else if (currentShape.tool === 'arrow') {
              return (
                <>
                  <Line {...previewProps} points={konvaProps.line.points} />
                  <Line
                    points={konvaProps.arrowHead.points}
                    fill={currentShape.color}
                    stroke={currentShape.color}
                    strokeWidth={currentShape.strokeWidth}
                    closed={true}
                    listening={false}
                    opacity={0.7}
                  />
                </>
              );
            } else if (currentShape.tool === 'rectangle') {
              return (
                <Rect
                  {...previewProps}
                  x={konvaProps.x}
                  y={konvaProps.y}
                  width={konvaProps.width}
                  height={konvaProps.height}
                  fill="transparent"
                />
              );
            } else if (currentShape.tool === 'circle') {
              return (
                <Ellipse
                  {...previewProps}
                  x={konvaProps.x}
                  y={konvaProps.y}
                  radiusX={konvaProps.radiusX}
                  radiusY={konvaProps.radiusY}
                  fill="transparent"
                />
              );
            }
            return null;
          })()}
        </Layer>
      </Stage>

      {/* 컨텍스트 메뉴 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          annotationId={contextMenu.annotationId}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Phase 3-1: Text Editor */}
      {textEditorPosition && (
        <TextEditor
          position={textEditorPosition}
          initialText={
            editingTextId
              ? (pageAnnotations.find((a) => a.id === editingTextId)?.data as TextData)?.text
              : ''
          }
          initialFontSize={
            editingTextId
              ? (pageAnnotations.find((a) => a.id === editingTextId)?.data as TextData)?.fontSize
              : 16
          }
          initialColor={penColor}
          onComplete={handleTextEditorComplete}
          onCancel={handleTextEditorCancel}
        />
      )}
    </div>
  );
}
