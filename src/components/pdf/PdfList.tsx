import { useState, useEffect } from 'react';
import { storageService } from '@/services/storageService';
import type { PdfListItem } from '@/types';

interface PdfListProps {
  onSelect?: (id: string) => void;
  onDelete?: (id: string) => void;
  refreshTrigger?: number;
}

export function PdfList({ onSelect, onDelete, refreshTrigger }: PdfListProps) {
  const [pdfList, setPdfList] = useState<PdfListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadPdfList = async () => {
    setIsLoading(true);
    try {
      const list = await storageService.getPdfList();
      setPdfList(list);
    } catch (error) {
      console.error('PDF 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPdfList();
  }, [refreshTrigger]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 교재를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await storageService.deletePdf(id);
      await loadPdfList();
      onDelete?.(id);
    } catch (error) {
      console.error('PDF 삭제 실패:', error);
      alert('PDF 삭제 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;

    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const filteredList = pdfList.filter((pdf) =>
    pdf.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="card p-8 text-center">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        <p className="mt-4 text-gray-500">목록을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">전자책 목록</h2>
        <span className="text-sm text-gray-500">{pdfList.length}개</span>
      </div>

      {/* 검색 */}
      {pdfList.length > 0 && (
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="교재명 검색..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      )}

      {/* PDF 목록 */}
      {filteredList.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-16 w-16 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mt-4 text-gray-500">
            {searchQuery ? '검색 결과가 없습니다' : '등록된 전자책이 없습니다'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredList.map((pdf) => (
            <div
              key={pdf.id}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
            >
              {/* PDF 아이콘 */}
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <svg
                  className="h-7 w-7 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{pdf.name}</h3>
                <p className="text-sm text-gray-500">
                  {pdf.totalPages > 0 ? `${pdf.totalPages}페이지` : '페이지 정보 없음'} •{' '}
                  {formatFileSize(pdf.fileSize)} • {formatDate(pdf.createdAt)}
                </p>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onSelect?.(pdf.id)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                >
                  열기
                </button>
                <button
                  onClick={() => handleDelete(pdf.id, pdf.name)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="삭제"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
