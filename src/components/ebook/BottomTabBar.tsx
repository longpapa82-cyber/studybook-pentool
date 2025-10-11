import { useState } from 'react';
import { useEbookStore } from '@/stores/ebookStore';
import { usePentoolStore } from '@/stores/pentoolStore';
import { PageNavigator } from './PageNavigator';
import { DisplayModeToggle } from './DisplayModeToggle';
import { ZoomControls } from './ZoomControls';
import { ToolPalette } from '@/components/pentool/ToolPalette';
import { ShapeTools } from '@/components/pentool/ShapeTools';
import { UndoRedoControls } from '@/components/pentool/UndoRedoControls';
import { LassoTool } from '@/components/common/LassoTool';
import { PenToolLayer } from './PenToolLayer';

interface BottomTabBarProps {
  onClose: () => void;
}

export function BottomTabBar({ onClose }: BottomTabBarProps) {
  const [showPenOptions, setShowPenOptions] = useState(false);
  const { activeTool, setActiveTool } = usePentoolStore();

  // 펜툴이 활성화되면 옵션 레이어 표시
  const isPenActive = ['pen', 'highlighter'].includes(activeTool);

  // 그리기&쓰기 버튼 클릭 핸들러
  const handlePenToolClick = () => {
    if (showPenOptions) {
      // 닫을 때: 펜툴 비활성화
      setShowPenOptions(false);
      setActiveTool('select');
    } else {
      // 열 때: 펜툴 활성화
      setShowPenOptions(true);
      setActiveTool('pen');
    }
  };

  return (
    <>
      {/* 펜툴 옵션 레이어 */}
      {showPenOptions && (
        <PenToolLayer onClose={() => {
          setShowPenOptions(false);
          setActiveTool('select');
        }} />
      )}

      {/* 하단 고정 탭바 */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-screen-2xl mx-auto px-4 py-2">
          <div className="flex items-stretch justify-between gap-2">
            {/* 왼쪽: 목록 버튼 */}
            <button
              onClick={onClose}
              className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md transition-all min-w-[80px]"
              title="목록"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs text-gray-600 font-medium">목록</span>
            </button>

            {/* 양면 보기 */}
            <button
              className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md transition-all min-w-[80px]"
              title="양면 보기"
            >
              <div className="flex items-center justify-center">
                <DisplayModeToggle />
              </div>
              <span className="text-xs text-gray-600 font-medium">보기</span>
            </button>

            {/* 줌 - 그룹 컨테이너 */}
            <div className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border border-gray-200 bg-white min-w-[200px]">
              <div className="flex items-center justify-center">
                <ZoomControls />
              </div>
              <span className="text-xs text-gray-600 font-medium">설정</span>
            </div>

            {/* 페이지 네비게이션 - 그룹 컨테이너 */}
            <div className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border border-gray-200 bg-white min-w-[200px]">
              <div className="flex items-center justify-center">
                <PageNavigator />
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-px bg-gray-300 self-stretch my-1" />

            {/* 그리기&쓰기 (펜툴) */}
            <button
              onClick={handlePenToolClick}
              className={`flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border transition-all min-w-[80px] ${
                showPenOptions
                  ? 'bg-primary-50 border-primary-400 shadow-md'
                  : 'border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md'
              }`}
              title="그리기&쓰기"
            >
              <svg className={`h-5 w-5 ${showPenOptions ? 'text-primary-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className={`text-xs font-medium ${showPenOptions ? 'text-primary-600' : 'text-gray-600'}`}>
                그리기&쓰기
              </span>
            </button>

            {/* 텍스트 선택 */}
            <button
              className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md transition-all min-w-[80px]"
              title="텍스트 선택"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs text-gray-600 font-medium">본문 검색</span>
            </button>

            {/* 캡처 */}
            <div className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border border-gray-200 bg-white min-w-[80px]">
              <div className="flex items-center justify-center">
                <LassoTool onCapture={(img) => console.log('캡처:', img)} />
              </div>
              <span className="text-xs text-gray-600 font-medium">캡처</span>
            </div>

            {/* Undo/Redo */}
            <div className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border border-gray-200 bg-white min-w-[80px]">
              <div className="flex items-center justify-center">
                <UndoRedoControls />
              </div>
            </div>

            {/* 구분선 */}
            <div className="w-px bg-gray-300 self-stretch my-1" />

            {/* 프린트 */}
            <button
              className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md transition-all min-w-[80px]"
              title="프린트"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="text-xs text-gray-600 font-medium">프린트</span>
            </button>

            {/* 설정 */}
            <button
              className="flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md transition-all min-w-[80px]"
              title="설정"
            >
              <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.5 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-xs text-gray-600 font-medium">설정</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
