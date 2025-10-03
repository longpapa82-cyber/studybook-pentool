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
        // 현재 페이지 우선 생성
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

    if (thumbnails.size === 0) {
      generateThumbnails();
    }
  }, [pdfDocument, isThumbnailPanelOpen, currentPage, totalPages, thumbnails.size]);

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
    <div className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 shadow-lg z-20 overflow-y-auto">
      {/* 헤더 */}
      <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">페이지 목록</h3>
        <button
          onClick={toggleThumbnailPanel}
          className="icon-btn"
          title="썸네일 패널 닫기"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 썸네일 리스트 */}
      <div className="p-3 space-y-3">
        {isGenerating && thumbnails.size === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin h-6 w-6 border-3 border-primary-500 border-t-transparent rounded-full"></div>
            <p className="mt-2 text-sm text-gray-500">썸네일 생성 중...</p>
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
                  w-full p-2 rounded-lg transition-all
                  ${isActive
                    ? 'bg-primary-50 ring-2 ring-primary-500'
                    : 'hover:bg-gray-100'
                  }
                `}
              >
                {/* 썸네일 이미지 */}
                <div className="relative bg-gray-100 rounded overflow-hidden mb-2">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={`페이지 ${pageNum}`}
                      className="w-full h-auto"
                    />
                  ) : (
                    <div className="aspect-[3/4] flex items-center justify-center">
                      <div className="animate-spin h-6 w-6 border-3 border-gray-300 border-t-primary-500 rounded-full"></div>
                    </div>
                  )}

                  {/* 현재 페이지 표시 */}
                  {isActive && (
                    <div className="absolute top-1 right-1 px-2 py-0.5 bg-primary-500 text-white text-xs rounded-full">
                      현재
                    </div>
                  )}
                </div>

                {/* 페이지 번호 */}
                <p className={`text-sm ${isActive ? 'text-primary-700 font-semibold' : 'text-gray-600'}`}>
                  {pageNum} / {totalPages}
                </p>
              </button>
            );
          })
        )}
      </div>

      {/* 많은 페이지 경고 */}
      {totalPages > 50 && (
        <div className="sticky bottom-0 bg-yellow-50 border-t border-yellow-200 p-3">
          <p className="text-xs text-yellow-800">
            ⚠️ 50페이지 이상은 성능상 일부만 표시됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
