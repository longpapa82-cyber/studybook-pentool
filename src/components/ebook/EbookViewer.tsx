import { useEffect, useRef, useState } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { useEbookStore } from '@/stores/ebookStore';
import { usePentoolStore } from '@/stores/pentoolStore';
import { renderPageToCanvas } from '@/utils/pdfUtils';
import { storageService } from '@/services/storageService';
import { DrawingCanvas } from '@/components/pentool/DrawingCanvas';

export function EbookViewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPageProxy, setCurrentPageProxy] = useState<PDFPageProxy | null>(null);

  const {
    pdfDocument,
    currentPage,
    zoom,
    rotation,
    displayMode,
    isLoading,
    setLoading,
    setError,
    pdfId,
  } = useEbookStore();

  const { loadAnnotations, annotations } = usePentoolStore();

  // PDF 페이지 로드
  useEffect(() => {
    if (!pdfDocument) return;

    const loadPage = async () => {
      try {
        setLoading(true);
        const page = await pdfDocument.getPage(currentPage);
        setCurrentPageProxy(page);
        setError(null);
      } catch (error) {
        console.error('페이지 로드 실패:', error);
        setError('페이지를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [pdfDocument, currentPage, setLoading, setError]);

  // Canvas 렌더링 (requestAnimationFrame for smooth rendering)
  useEffect(() => {
    if (!currentPageProxy || !canvasRef.current) return;

    let rafId: number;
    const renderPage = async () => {
      try {
        rafId = requestAnimationFrame(async () => {
          await renderPageToCanvas(currentPageProxy, canvasRef.current!, zoom);
        });
      } catch (error) {
        console.error('페이지 렌더링 실패:', error);
        setError('페이지를 렌더링할 수 없습니다.');
      }
    };

    renderPage();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [currentPageProxy, zoom, setError]);

  // 페이지 변경 시 주석 로드
  useEffect(() => {
    const loadPageAnnotations = async () => {
      if (!pdfId) return;

      try {
        const savedAnnotations = await storageService.getAnnotations(
          pdfId,
          currentPage
        );

        if (savedAnnotations) {
          loadAnnotations(currentPage, savedAnnotations);
        }
      } catch (error) {
        console.error('주석 로드 실패:', error);
      }
    };

    loadPageAnnotations();
  }, [pdfId, currentPage, loadAnnotations]);

  // 주석 변경 시 자동 저장
  useEffect(() => {
    const savePageAnnotations = async () => {
      if (!pdfId) return;

      const pageAnnotations = annotations.get(currentPage);
      if (!pageAnnotations) return;

      try {
        await storageService.saveAnnotations(pdfId, currentPage, pageAnnotations);
      } catch (error) {
        console.error('주석 저장 실패:', error);
      }
    };

    // 디바운스 (300ms)
    const timer = setTimeout(savePageAnnotations, 300);
    return () => clearTimeout(timer);
  }, [pdfId, currentPage, annotations]);

  if (!pdfDocument) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-500">PDF 문서를 선택해주세요</p>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center h-full bg-gray-100 overflow-auto">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600">페이지 로딩 중...</p>
          </div>
        </div>
      )}

      <div
        className="relative transition-transform duration-200"
        style={{
          transform: `rotate(${rotation}deg)`,
        }}
      >
        {/* PDF Canvas */}
        <canvas
          ref={canvasRef}
          className="shadow-2xl"
          style={{
            maxWidth: '100%',
            height: 'auto',
          }}
        />

        {/* Drawing Canvas Overlay */}
        <DrawingCanvas pdfCanvasRef={canvasRef} />
      </div>
    </div>
  );
}
