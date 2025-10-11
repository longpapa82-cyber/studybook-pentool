// Phase 4-1: Export/Import UI controls for annotation management

import { useState, useRef } from 'react';
import { usePentoolStore } from '@/stores/pentoolStore';
import { uploadAnnotationsJSON } from '@/utils/storageUtils';

interface StorageControlsProps {
  className?: string;
}

export function StorageControls({ className = '' }: StorageControlsProps) {
  const {
    exportAnnotations,
    importAnnotations,
    saveToStorage,
    loadFromStorage,
    currentPdfFileName,
    annotations,
  } = usePentoolStore();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalAnnotations = Array.from(annotations.values()).reduce(
    (sum, pageAnnotations) => sum + pageAnnotations.length,
    0
  );

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExport = () => {
    try {
      exportAnnotations();
      showMessage('success', '주석을 JSON 파일로 내보냈습니다');
    } catch (error) {
      console.error('Export error:', error);
      showMessage('error', '내보내기 실패');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const annotationsMap = await uploadAnnotationsJSON(file);
      importAnnotations(annotationsMap);
      showMessage('success', '주석을 불러왔습니다');
    } catch (error) {
      console.error('Import error:', error);
      showMessage('error', '불러오기 실패: 올바른 파일 형식이 아닙니다');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = () => {
    const success = saveToStorage();
    if (success) {
      showMessage('success', '브라우저에 저장했습니다');
    } else {
      showMessage('error', '저장 실패');
    }
  };

  const handleLoad = () => {
    const success = loadFromStorage();
    if (success) {
      showMessage('success', '저장된 주석을 불러왔습니다');
    } else {
      showMessage('error', '저장된 데이터가 없습니다');
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">데이터 관리</h3>
          <p className="text-xs text-gray-500 mt-1">
            총 {totalAnnotations}개의 주석 • {currentPdfFileName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Export */}
        <button
          onClick={handleExport}
          disabled={totalAnnotations === 0}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
            />
          </svg>
          내보내기
        </button>

        {/* Import */}
        <button
          onClick={handleImportClick}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          불러오기
        </button>

        {/* Save to localStorage */}
        <button
          onClick={handleSave}
          disabled={totalAnnotations === 0}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          저장
        </button>

        {/* Load from localStorage */}
        <button
          onClick={handleLoad}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
            />
          </svg>
          복원
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Message display */}
      {message && (
        <div
          className={`mt-3 p-2 rounded text-xs font-medium text-center ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
