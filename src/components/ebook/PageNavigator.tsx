import { useState } from 'react';
import { useEbookStore } from '@/stores/ebookStore';

export function PageNavigator() {
  const {
    currentPage,
    totalPages,
    previousPage,
    nextPage,
    goToPage,
  } = useEbookStore();

  const [pageInput, setPageInput] = useState('');

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      goToPage(page);
      setPageInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      previousPage();
    } else if (e.key === 'ArrowRight') {
      nextPage();
    }
  };

  if (totalPages === 0) return null;

  return (
    <div className="flex items-center gap-3" onKeyDown={handleKeyDown}>
      {/* 이전 페이지 버튼 */}
      <button
        onClick={previousPage}
        disabled={currentPage === 1}
        className="icon-btn disabled:opacity-30 disabled:cursor-not-allowed"
        title="이전 페이지 (←)"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 페이지 정보 */}
      <div className="flex items-center gap-2">
        <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            placeholder={currentPage.toString()}
            className="w-12 px-2 py-1 text-center text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
          <span className="text-sm text-gray-500">/ {totalPages}</span>
        </form>
      </div>

      {/* 다음 페이지 버튼 */}
      <button
        onClick={nextPage}
        disabled={currentPage === totalPages}
        className="icon-btn disabled:opacity-30 disabled:cursor-not-allowed"
        title="다음 페이지 (→)"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 진행률 표시 */}
      <div className="hidden sm:flex items-center gap-2 ml-2">
        <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all duration-300"
            style={{
              width: `${(currentPage / totalPages) * 100}%`,
            }}
          />
        </div>
        <span className="text-xs text-gray-500">
          {Math.round((currentPage / totalPages) * 100)}%
        </span>
      </div>
    </div>
  );
}
