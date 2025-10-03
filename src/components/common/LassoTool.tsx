import { useRef, useState } from 'react';

interface LassoToolProps {
  onCapture?: (imageData: string) => void;
}

export function LassoTool({ onCapture }: LassoToolProps) {
  const [isActive, setIsActive] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startDrawing = (e: React.MouseEvent) => {
    if (!isActive) return;

    setIsDrawing(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setPoints([{ x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    }
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !isActive) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const newPoint = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      setPoints((prev) => [...prev, newPoint]);

      // Canvas에 그리기
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && points.length > 0) {
        ctx.clearRect(0, 0, canvas!.width, canvas!.height);
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach((point) => ctx.lineTo(point.x, point.y));
        ctx.lineTo(newPoint.x, newPoint.y);
        ctx.stroke();
      }
    }
  };

  const endDrawing = async () => {
    if (!isDrawing || !isActive) return;

    setIsDrawing(false);

    if (points.length < 3) {
      setPoints([]);
      return;
    }

    // 영역 캡처
    await captureArea();
    setPoints([]);
    setIsActive(false);
  };

  const captureArea = async () => {
    // 최소/최대 좌표 찾기
    const minX = Math.min(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxX = Math.max(...points.map((p) => p.x));
    const maxY = Math.max(...points.map((p) => p.y));

    const width = maxX - minX;
    const height = maxY - minY;

    // 화면 캡처 (실제로는 PDF 페이지 영역을 캡처해야 함)
    // 여기서는 간단한 구현만 제공
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = width;
    captureCanvas.height = height;
    const ctx = captureCanvas.getContext('2d');

    if (ctx) {
      // TODO: PDF 페이지의 해당 영역을 캡처
      // 현재는 placeholder
      ctx.fillStyle = '#f0f0f0';
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#a855f7';
      ctx.strokeRect(0, 0, width, height);

      const imageData = captureCanvas.toDataURL('image/png');
      onCapture?.(imageData);

      // 클립보드에 복사
      try {
        const blob = await new Promise<Blob>((resolve) =>
          captureCanvas.toBlob((b) => resolve(b!), 'image/png')
        );
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        alert('선택 영역이 클립보드에 복사되었습니다.');
      } catch (error) {
        console.error('클립보드 복사 실패:', error);
      }
    }
  };

  return (
    <div className="relative">
      {/* 올가미 버튼 */}
      <button
        onClick={() => setIsActive(!isActive)}
        className={`icon-btn ${isActive ? 'bg-primary-100 text-primary-700' : ''}`}
        title="올가미 도구"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
      </button>

      {/* 올가미 오버레이 */}
      {isActive && (
        <div
          ref={containerRef}
          className="fixed inset-0 z-30 cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
        >
          <canvas
            ref={canvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            className="absolute inset-0"
          />

          {/* 안내 메시지 */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg">
            드래그하여 영역을 선택하세요 (ESC: 취소)
          </div>
        </div>
      )}
    </div>
  );
}
