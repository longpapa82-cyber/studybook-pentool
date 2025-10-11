import { useEffect, useRef, useState } from 'react';
import type { PDFPageProxy } from 'pdfjs-dist';
import { useEbookStore } from '@/stores/ebookStore';
import { usePentoolStore } from '@/stores/pentoolStore';
import { renderPageToCanvas } from '@/utils/pdfUtils';
import { storageService } from '@/services/storageService';
import { DrawingCanvas } from '@/components/pentool/DrawingCanvas';
import { StorageControls } from '@/components/pentool/StorageControls';
import { useAutoSave } from '@/hooks/useAutoSave';

export function EbookViewer() {
  const leftCanvasRef = useRef<HTMLCanvasElement>(null);
  const rightCanvasRef = useRef<HTMLCanvasElement>(null);
  const [leftPageProxy, setLeftPageProxy] = useState<PDFPageProxy | null>(null);
  const [rightPageProxy, setRightPageProxy] = useState<PDFPageProxy | null>(null);
  const [pageTransition, setPageTransition] = useState<'next' | 'prev' | null>(null);
  const prevPageRef = useRef<number>(1);

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
    totalPages,
    isThumbnailPanelOpen,
    nextPage,
    previousPage,
    zoomIn,
    resetZoom,
  } = useEbookStore();

  const { loadAnnotations, annotations, setCurrentPdfFileName, loadFromStorage } = usePentoolStore();

  // Phase 4-1: Auto-save annotations every 30 seconds
  const [autoSaveMessage, setAutoSaveMessage] = useState<string | null>(null);
  useAutoSave({
    enabled: true,
    interval: 30000, // 30 seconds
    onSave: () => {
      setAutoSaveMessage('자동 저장됨');
      setTimeout(() => setAutoSaveMessage(null), 2000);
    },
    onError: (error) => {
      console.error('[AutoSave Error]:', error);
    },
  });

  // Phase 4-1: Set PDF file name and load annotations on mount
  useEffect(() => {
    if (pdfId) {
      setCurrentPdfFileName(pdfId);
      // Try to load existing annotations
      const loaded = loadFromStorage(pdfId);
      if (loaded) {
        console.log('[Phase 4-1] Loaded existing annotations for:', pdfId);
      }
    }
  }, [pdfId, setCurrentPdfFileName, loadFromStorage]);

  // 더블 클릭 핸들러 - 확대/축소 토글
  const handleDoubleClick = () => {
    if (zoom === 1.0) {
      // 기본 줌이면 확대
      zoomIn();
    } else {
      // 확대되어 있으면 원래대로
      resetZoom();
    }
  };

  // PDF 페이지 로드
  useEffect(() => {
    if (!pdfDocument) return;

    const loadPages = async () => {
      try {
        setLoading(true);

        // 페이지 전환 방향 감지
        const direction = currentPage > prevPageRef.current ? 'next' : 'prev';
        setPageTransition(direction);
        prevPageRef.current = currentPage;

        // 왼쪽 페이지 (또는 단일 페이지)
        const leftPage = await pdfDocument.getPage(currentPage);
        setLeftPageProxy(leftPage);

        // 양면 모드일 때만 오른쪽 페이지 로드
        if (displayMode === 'double' && currentPage < totalPages) {
          const rightPage = await pdfDocument.getPage(currentPage + 1);
          setRightPageProxy(rightPage);
        } else {
          setRightPageProxy(null);
        }

        setError(null);

        // 애니메이션 종료 (0.6초로 증가)
        setTimeout(() => setPageTransition(null), 600);
      } catch (error) {
        console.error('페이지 로드 실패:', error);
        setError('페이지를 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, [pdfDocument, currentPage, displayMode, totalPages, setLoading, setError]);

  // Canvas 렌더링 (requestAnimationFrame for smooth rendering)
  useEffect(() => {
    if (!leftPageProxy || !leftCanvasRef.current) return;

    let leftRafId: number;
    let rightRafId: number;

    const renderPages = async () => {
      try {
        // 왼쪽 페이지 렌더링
        leftRafId = requestAnimationFrame(async () => {
          await renderPageToCanvas(leftPageProxy, leftCanvasRef.current!, zoom);
        });

        // 오른쪽 페이지 렌더링 (양면 모드)
        if (rightPageProxy && rightCanvasRef.current) {
          rightRafId = requestAnimationFrame(async () => {
            await renderPageToCanvas(rightPageProxy, rightCanvasRef.current!, zoom);
          });
        }
      } catch (error) {
        console.error('페이지 렌더링 실패:', error);
        setError('페이지를 렌더링할 수 없습니다.');
      }
    };

    renderPages();

    return () => {
      if (leftRafId) cancelAnimationFrame(leftRafId);
      if (rightRafId) cancelAnimationFrame(rightRafId);
    };
  }, [leftPageProxy, rightPageProxy, zoom, setError]);

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

  // 썸네일 패널 열림 상태에 따른 중앙 정렬을 위한 여백 계산 (96px = w-24)
  const panelWidth = isThumbnailPanelOpen ? 96 : 0;

  return (
    <div
      className="absolute inset-0 flex items-center justify-center bg-white overflow-auto transition-all duration-300"
      style={{
        height: 'calc(100vh - 70px)',
        left: `${panelWidth}px`,
        width: `calc(100% - ${panelWidth}px)`,
        padding: '4px 12px',
      }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600">페이지 로딩 중...</p>
          </div>
        </div>
      )}

      <div
        className={`relative ${
          displayMode === 'double' ? 'flex gap-4' : ''
        } ${
          pageTransition === 'next' ? 'animate-page-turn-left' : ''
        } ${
          pageTransition === 'prev' ? 'animate-page-turn-right' : ''
        }`}
        style={{
          transform: `rotate(${rotation}deg)`,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
        onDoubleClick={handleDoubleClick}
      >
        {/* 왼쪽/단일 페이지 */}
        <div className="relative flex items-center justify-center">
          <canvas
            ref={leftCanvasRef}
            className="shadow-2xl cursor-pointer"
            style={{
              maxHeight: '100%',
              maxWidth: '100%',
              height: 'auto',
              width: 'auto',
              objectFit: 'contain',
            }}
          />
          <DrawingCanvas pdfCanvasRef={leftCanvasRef} />
        </div>

        {/* 오른쪽 페이지 (양면 모드) */}
        {displayMode === 'double' && rightPageProxy && (
          <div className="relative flex items-center justify-center">
            <canvas
              ref={rightCanvasRef}
              className="shadow-2xl cursor-pointer"
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                height: 'auto',
                width: 'auto',
                objectFit: 'contain',
              }}
            />
            <DrawingCanvas pdfCanvasRef={rightCanvasRef} />
          </div>
        )}
      </div>

      {/* 이전 페이지 버튼 - 교재 왼쪽 바깥 */}
      {currentPage > 1 && (
        <button
          onClick={previousPage}
          className="btn-prev fixed top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          style={{
            left: `${panelWidth + 16}px`,
          }}
          draggable="false"
          aria-label="이전 페이지"
        >
          <svg
            className="w-6 h-6 text-gray-700 group-hover:text-primary-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 다음 페이지 버튼 - 교재 오른쪽 바깥 */}
      {currentPage < totalPages && (
        <button
          onClick={nextPage}
          className="btn-next fixed right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
          draggable="false"
          aria-label="다음 페이지"
        >
          <svg
            className="w-6 h-6 text-gray-700 group-hover:text-primary-600 transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Phase 4-1: Storage Controls */}
      <div className="fixed bottom-24 right-4 z-40">
        <StorageControls />
      </div>

      {/* Phase 4-1: Auto-save indicator */}
      {autoSaveMessage && (
        <div className="fixed bottom-36 right-4 z-40 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-slide-up">
          {autoSaveMessage}
        </div>
      )}
    </div>
  );
}
