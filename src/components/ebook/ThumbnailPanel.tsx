import { useEffect, useState } from 'react';
import { useEbookStore } from '@/stores/ebookStore';
import { generateThumbnail } from '@/utils/pdfUtils';

export function ThumbnailPanel() {
  const {
    pdfDocument,
    currentPage,
    totalPages,
    goToPage,
    isThumbnailPanelOpen,
    toggleThumbnailPanel,
  } = useEbookStore();

  const [thumbnails, setThumbnails] = useState<Map<number, string>>(new Map());
  const [isGenerating, setIsGenerating] = useState(false);

  // 썸네일 생성
  useEffect(() => {
    if (!pdfDocument || !isThumbnailPanelOpen) return;

    const generateThumbnails = async () => {
      setIsGenerating(true);
      const newThumbnails = new Map<number, string>();

      try {
        // 현재 페이지 우선 생성 (작은 크기로 조정)
        const currentPageObj = await pdfDocument.getPage(currentPage);
        const currentThumb = await generateThumbnail(currentPageObj, 150);
        newThumbnails.set(currentPage, currentThumb);
        setThumbnails(new Map(newThumbnails));

        // 나머지 페이지 순차 생성 (최대 50페이지)
        const maxPages = Math.min(totalPages, 50);
        for (let i = 1; i <= maxPages; i++) {
          if (i === currentPage) continue;

          const page = await pdfDocument.getPage(i);
          const thumbnail = await generateThumbnail(page, 150);
          newThumbnails.set(i, thumbnail);
          setThumbnails(new Map(newThumbnails));
        }
      } catch (error) {
        console.error('썸네일 생성 실패:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    // 항상 새로 생성하도록 변경
    generateThumbnails();
  }, [pdfDocument, isThumbnailPanelOpen, currentPage, totalPages]);

  if (!isThumbnailPanelOpen) {
    return (
      <button
        onClick={toggleThumbnailPanel}
        className="fixed left-4 top-24 z-20 icon-btn bg-white shadow-lg"
        title="썸네일 패널 열기"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed left-0 top-0 w-24 bg-white border-r border-gray-200 shadow-lg z-20 overflow-y-auto" style={{ height: 'calc(100vh - 70px)' }}>
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-1.5 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 text-xs">목록</h3>
        <button
          onClick={toggleThumbnailPanel}
          className="icon-btn p-1"
          title="썸네일 패널 닫기"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 썸네일 리스트 */}
      <div className="p-1.5 space-y-1.5">
        {isGenerating && thumbnails.size === 0 ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            <p className="mt-1 text-xs text-gray-500">생성중</p>
          </div>
        ) : (
          Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
            const thumbnail = thumbnails.get(pageNum);
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => goToPage(pageNum)}
                className={`
                  w-full p-1 rounded transition-all
                  ${isActive
                    ? 'bg-primary-50 ring-1 ring-primary-500'
                    : 'hover:bg-gray-100'
                  }
                `}
              >
                {/* 썸네일 이미지 */}
                <div className="relative bg-gray-100 rounded overflow-hidden mb-1">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={`페이지 ${pageNum}`}
                      className="w-full h-auto"
                      style={{
                        imageRendering: 'crisp-edges',
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <div className="aspect-[3/4] flex items-center justify-center">
                      <div className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-primary-500 rounded-full"></div>
                    </div>
                  )}

                  {/* 현재 페이지 표시 */}
                  {isActive && (
                    <div className="absolute top-0.5 right-0.5 px-1 py-0.5 bg-primary-500 text-white text-[9px] rounded">
                      현재
                    </div>
                  )}
                </div>

                {/* 페이지 번호 */}
                <p className={`text-[10px] ${isActive ? 'text-primary-700 font-semibold' : 'text-gray-600'}`}>
                  {pageNum}
                </p>
              </button>
            );
          })
        )}
      </div>

      {/* 많은 페이지 경고 */}
      {totalPages > 50 && (
        <div className="sticky bottom-0 bg-yellow-50 border-t border-yellow-200 p-1.5">
          <p className="text-[9px] text-yellow-800">
            ⚠️ 50p 이상 일부만 표시
          </p>
        </div>
      )}
    </div>
  );
}
