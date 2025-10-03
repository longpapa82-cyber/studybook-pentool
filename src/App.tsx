import { useState, useEffect, lazy, Suspense } from 'react';
import './App.css';
import { PdfUploader } from '@/components/pdf/PdfUploader';
import { PdfList } from '@/components/pdf/PdfList';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { storageService } from '@/services/storageService';
import { loadPdfFromArrayBuffer, extractPdfMetadata } from '@/utils/pdfUtils';
import { useEbookStore } from '@/stores/ebookStore';

// Lazy load viewer components for code splitting
const EbookViewer = lazy(() => import('@/components/ebook/EbookViewer').then(m => ({ default: m.EbookViewer })));
const PageNavigator = lazy(() => import('@/components/ebook/PageNavigator').then(m => ({ default: m.PageNavigator })));
const ZoomControls = lazy(() => import('@/components/ebook/ZoomControls').then(m => ({ default: m.ZoomControls })));
const ThumbnailPanel = lazy(() => import('@/components/ebook/ThumbnailPanel').then(m => ({ default: m.ThumbnailPanel })));
const DisplayModeToggle = lazy(() => import('@/components/ebook/DisplayModeToggle').then(m => ({ default: m.DisplayModeToggle })));
const LassoTool = lazy(() => import('@/components/common/LassoTool').then(m => ({ default: m.LassoTool })));
const ToolPalette = lazy(() => import('@/components/pentool/ToolPalette').then(m => ({ default: m.ToolPalette })));
const ColorPicker = lazy(() => import('@/components/pentool/ColorPicker').then(m => ({ default: m.ColorPicker })));
const StrokeSelector = lazy(() => import('@/components/pentool/StrokeSelector').then(m => ({ default: m.StrokeSelector })));
const UndoRedoControls = lazy(() => import('@/components/pentool/UndoRedoControls').then(m => ({ default: m.UndoRedoControls })));
const ShapeTools = lazy(() => import('@/components/pentool/ShapeTools').then(m => ({ default: m.ShapeTools })));

// Loading fallback component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin h-6 w-6 border-3 border-primary-500 border-t-transparent rounded-full"></div>
  </div>
);

type View = 'home' | 'upload' | 'list' | 'viewer';

function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { setPdfDocument, pdfName, reset, setLoading } = useEbookStore();

  // 키보드 단축키 활성화
  useKeyboardShortcuts();

  const handleUploadSuccess = async (id: string) => {
    console.log('PDF 업로드 성공:', id);

    // 페이지 수 업데이트
    try {
      const pdfDoc = await storageService.getPdfById(id);
      if (pdfDoc) {
        const pdf = await loadPdfFromArrayBuffer(pdfDoc.file);
        const metadata = await extractPdfMetadata(pdf);

        await storageService.updatePdfMetadata(id, {
          totalPages: metadata.totalPages,
        });
      }
    } catch (error) {
      console.error('메타데이터 업데이트 실패:', error);
    }

    setRefreshTrigger(prev => prev + 1);
    setCurrentView('list');
  };

  const handleSelectPdf = async (id: string) => {
    try {
      setLoading(true);

      const pdfDoc = await storageService.getPdfById(id);
      if (!pdfDoc) {
        alert('PDF를 찾을 수 없습니다.');
        return;
      }

      const pdf = await loadPdfFromArrayBuffer(pdfDoc.file);
      setPdfDocument(pdf, id, pdfDoc.name);

      setCurrentView('viewer');
    } catch (error) {
      console.error('PDF 로드 실패:', error);
      alert('PDF를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseViewer = () => {
    reset();
    setCurrentView('list');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* 뷰어 모드가 아닐 때만 헤더 표시 */}
      {currentView !== 'viewer' ? (
        <header className="toolbar sticky top-0 z-10 bg-white/80 backdrop-blur-sm">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                StudyBook
              </h1>
              <span className="text-sm text-gray-500">전자책 펜툴 서비스</span>
            </div>

            <nav className="flex gap-2">
              <button
                onClick={() => setCurrentView('home')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'home'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                홈
              </button>
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'upload'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                업로드
              </button>
              <button
                onClick={() => setCurrentView('list')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  currentView === 'list'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                목록
              </button>
            </nav>
          </div>
        </header>
      ) : (
        /* 뷰어 모드 전용 헤더 */
        <header className="toolbar sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 flex items-center justify-between">
            {/* 왼쪽: 닫기 버튼 & 제목 */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleCloseViewer}
                className="icon-btn"
                title="목록으로 돌아가기"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <h2 className="font-semibold text-gray-800 truncate max-w-md">
                {pdfName || 'E-Book'}
              </h2>
            </div>

            {/* 중앙: 페이지 네비게이션 */}
            <div className="flex-1 flex justify-center">
              <Suspense fallback={<LoadingSpinner />}>
                <PageNavigator />
              </Suspense>
            </div>

            {/* 오른쪽: 도구 */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <Suspense fallback={<LoadingSpinner />}>
                <ToolPalette />
                <div className="h-6 w-px bg-gray-300" />
                <ShapeTools />
                <div className="h-6 w-px bg-gray-300" />
                <ColorPicker />
                <div className="h-6 w-px bg-gray-300" />
                <StrokeSelector />
                <div className="h-6 w-px bg-gray-300" />
                <UndoRedoControls />
                <div className="h-6 w-px bg-gray-300" />
                <DisplayModeToggle />
                <div className="h-6 w-px bg-gray-300" />
                <LassoTool onCapture={(img) => console.log('캡처:', img)} />
                <div className="h-6 w-px bg-gray-300" />
                <ZoomControls />
              </Suspense>
            </div>
          </div>
        </header>
      )}

      {/* 뷰어 모드가 아닐 때만 main 태그 사용 */}
      {currentView !== 'viewer' ? (
        <main className="container mx-auto px-4 py-8">
          {/* Home View */}
          {currentView === 'home' && (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Hero Section */}
              <div className="card p-8 text-center animate-scale-in">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-500 bg-clip-text text-transparent">
                  StudyBook
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  PDF 전자책에 자유롭게 주석을 달고 학습하세요 ✨
                </p>

                <div className="flex flex-wrap gap-4 justify-center">
                  <button
                    onClick={() => setCurrentView('upload')}
                    className="px-8 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 hover:shadow-glow hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      PDF 업로드
                    </span>
                  </button>
                  <button
                    onClick={() => setCurrentView('list')}
                    className="px-8 py-3 rounded-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:border-primary-500 hover:bg-primary-50 hover:scale-105 active:scale-95 transition-all duration-200"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      전자책 목록
                    </span>
                  </button>
                </div>
              </div>

              {/* Progress Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="card p-6 animate-slide-up hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">Phase 6 완료</h3>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>주석 선택 및 드래그 이동</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>복사/붙여넣기 (Ctrl+C/V)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>키보드 단축키 (Undo/Redo/Delete)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary-500">•</span>
                      <span>도형 도구 UI (직선/화살표/사각형/원)</span>
                    </li>
                  </ul>
                </div>

                <div className="card p-6 animate-slide-up hover:shadow-lg transition-all duration-300" style={{animationDelay: '0.1s'}}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-lg text-gray-800">핵심 기능</h3>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-secondary-500">•</span>
                      <span>펜/형광펜/지우개 도구</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary-500">•</span>
                      <span>12색 컬러 팔레트</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary-500">•</span>
                      <span>자동 저장 (IndexedDB)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-secondary-500">•</span>
                      <span>페이지별 주석 관리</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Upload View */}
          {currentView === 'upload' && (
            <div className="max-w-2xl mx-auto animate-slide-up">
              <PdfUploader
                onUploadSuccess={handleUploadSuccess}
                onUploadError={(error) => console.error('업로드 오류:', error)}
              />
            </div>
          )}

          {/* List View */}
          {currentView === 'list' && (
            <div className="max-w-4xl mx-auto animate-slide-up">
              <PdfList
                onSelect={handleSelectPdf}
                onDelete={(id) => console.log('PDF 삭제됨:', id)}
                refreshTrigger={refreshTrigger}
              />
            </div>
          )}
        </main>
      ) : (
        /* Viewer - 전체 화면 사용 */
        <div className="h-[calc(100vh-64px)]">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin h-12 w-12 border-4 border-primary-500 border-t-transparent rounded-full"></div>
                  <p className="mt-4 text-gray-600">뷰어 로딩 중...</p>
                </div>
              </div>
            }
          >
            <EbookViewer />
            <ThumbnailPanel />
          </Suspense>
        </div>
      )}
    </div>
  );
}

export default App;
