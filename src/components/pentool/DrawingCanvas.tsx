import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { usePentoolStore } from '@/stores/pentoolStore';
import { useEbookStore } from '@/stores/ebookStore';
import { requestAnimationFrameThrottle } from '@/utils/performanceUtils';
import { ContextMenu } from './ContextMenu';

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

  const {
    activeTool,
    penColor,
    strokeWidth,
    isDrawing,
    currentLine,
    annotations,
    selectedAnnotationId,
    startDrawing,
    continueDrawing,
    finishDrawing,
    selectAnnotation,
    moveAnnotation,
    clearSelection,
  } = usePentoolStore();

  const { currentPage, zoom } = useEbookStore();

  const pageAnnotations = annotations.get(currentPage) || [];

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

    // 선택 모드가 아닐 때는 드로잉
    if (activeTool !== 'none') {
      const pos = e.target.getStage().getPointerPosition();
      startDrawing({ x: pos.x, y: pos.y });
    }
  };

  // Throttle drawing events for 60fps performance
  const handleMouseMove = useCallback(
    requestAnimationFrameThrottle((e: any) => {
      if (!isDrawing) return;

      const pos = e.target.getStage().getPointerPosition();
      continueDrawing({ x: pos.x, y: pos.y });
    }),
    [isDrawing, continueDrawing]
  );

  const handleMouseUp = () => {
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
          {/* 저장된 주석 렌더링 */}
          {pageAnnotations.map((annotation) => {
            if (annotation.type === 'drawing') {
              const line = annotation.data;
              const isSelected = selectedAnnotationId === annotation.id;

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
    </div>
  );
}
