import { useState, useRef } from 'react';
import { storageService } from '@/services/storageService';

interface PdfUploaderProps {
  onUploadSuccess?: (id: string) => void;
  onUploadError?: (error: Error) => void;
}

export function PdfUploader({ onUploadSuccess, onUploadError }: PdfUploaderProps) {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== 'application/pdf') {
      alert('PDF 파일만 업로드 가능합니다.');
      return;
    }

    setFile(selectedFile);

    // 파일명에서 .pdf 제거하여 교과명 자동 설정
    const fileName = selectedFile.name.replace('.pdf', '');
    if (!name) {
      setName(fileName);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!name.trim()) {
      alert('교과명을 입력해주세요.');
      return;
    }

    if (!file) {
      alert('PDF 파일을 선택해주세요.');
      return;
    }

    setIsUploading(true);

    try {
      const id = await storageService.savePdf(name, file);

      // 상태 초기화
      setName('');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadSuccess?.(id);
    } catch (error) {
      console.error('PDF 업로드 실패:', error);
      onUploadError?.(error as Error);
      alert('PDF 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="card p-6 space-y-4 animate-slide-up">
      <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
        PDF 파일 등록
      </h2>

      {/* 교과명 입력 */}
      <div>
        <label htmlFor="subject-name" className="block text-sm font-medium text-gray-700 mb-1">
          교과명
        </label>
        <input
          id="subject-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 수학 1-1"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
          disabled={isUploading}
        />
      </div>

      {/* 파일 드래그&드롭 영역 */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
          ${isDragging
            ? 'border-primary-500 bg-primary-50 scale-105 shadow-glow'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50 hover:scale-[1.02]'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />

        <div className="space-y-3">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {file ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-700">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600">
                클릭하거나 PDF 파일을 드래그하세요
              </p>
              <p className="text-xs text-gray-400">
                PDF 파일만 업로드 가능합니다
              </p>
            </>
          )}
        </div>
      </div>

      {/* 업로드 버튼 */}
      <button
        onClick={handleUpload}
        disabled={!name.trim() || !file || isUploading}
        className={`
          w-full py-3 px-6 rounded-lg font-semibold text-white
          bg-gradient-to-r from-primary-500 to-secondary-500
          hover:from-primary-600 hover:to-secondary-600
          hover:shadow-glow hover:scale-[1.02]
          active:scale-95
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        `}
      >
        {isUploading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            업로드 중...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            전자책으로 등록
          </span>
        )}
      </button>
    </div>
  );
}
