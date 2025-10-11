import { useState } from 'react';
import { usePentoolStore } from '@/stores/pentoolStore';
import type { PenTool } from '@/types/pentool.types';

interface ImprovedToolPaletteProps {
  onClose: () => void;
}

export function ImprovedToolPalette({ onClose }: ImprovedToolPaletteProps) {
  const {
    activeTool,
    penColor,
    setPenColor,
    strokeWidth,
    setStrokeWidth,
    setActiveTool,
    undo,
    redo,
    historyIndex,
    history,
  } = usePentoolStore();

  const [activeCategory, setActiveCategory] = useState<'drawing' | 'shapes' | 'all'>('all');

  // 도구 카테고리별 분류
  const toolCategories = {
    drawing: [
      {
        type: 'none' as const,
        label: '선택',
        icon: '🖱️',
        shortcut: 'V',
      },
      {
        type: 'pen' as const,
        label: '펜',
        icon: '✏️',
        shortcut: 'P',
      },
      {
        type: 'highlighter' as const,
        label: '형광펜',
        icon: '🖍️',
        shortcut: 'H',
      },
      {
        type: 'eraser' as const,
        label: '지우개',
        icon: '🧹',
        shortcut: 'E',
      },
    ],
    shapes: [
      {
        type: 'line' as const,
        label: '직선',
        icon: '📏',
        shortcut: 'L',
      },
      {
        type: 'arrow' as const,
        label: '화살표',
        icon: '➡️',
        shortcut: 'A',
      },
      {
        type: 'rectangle' as const,
        label: '사각형',
        icon: '▭',
        shortcut: 'R',
      },
      {
        type: 'circle' as const,
        label: '원',
        icon: '⭕',
        shortcut: 'C',
      },
    ],
  };

  const allTools = [...toolCategories.drawing, ...toolCategories.shapes];
  const visibleTools =
    activeCategory === 'all'
      ? allTools
      : activeCategory === 'drawing'
      ? toolCategories.drawing
      : toolCategories.shapes;

  // 색상 프리셋
  const colorPresets = [
    { value: '#000000', label: '검정' },
    { value: '#EF4444', label: '빨강' },
    { value: '#F97316', label: '주황' },
    { value: '#EAB308', label: '노랑' },
    { value: '#22C55E', label: '초록' },
    { value: '#14B8A6', label: '청록' },
    { value: '#3B82F6', label: '파랑' },
    { value: '#6366F1', label: '남색' },
    { value: '#A855F7', label: '보라' },
    { value: '#EC4899', label: '분홍' },
    { value: '#6B7280', label: '회색' },
    { value: '#FFFFFF', label: '흰색' },
  ];

  // 굵기 프리셋
  const strokePresets = [
    { value: 1, label: '가늘게' },
    { value: 2, label: '보통' },
    { value: 4, label: '굵게' },
    { value: 6, label: '매우 굵게' },
  ];

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
      {/* 메인 팔레트 */}
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 max-w-2xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-700">펜툴</h3>
            <div className="flex gap-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  activeCategory === 'all'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                전체
              </button>
              <button
                onClick={() => setActiveCategory('drawing')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  activeCategory === 'drawing'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                그리기
              </button>
              <button
                onClick={() => setActiveCategory('shapes')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  activeCategory === 'shapes'
                    ? 'bg-primary-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                도형
              </button>
            </div>
          </div>

          {/* Undo/Redo 버튼 */}
          <div className="flex items-center gap-2">
            <button
              onClick={undo}
              disabled={!canUndo}
              className={`p-2 rounded-lg transition-colors ${
                canUndo
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="실행 취소 (Ctrl+Z)"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className={`p-2 rounded-lg transition-colors ${
                canRedo
                  ? 'text-gray-700 hover:bg-gray-100'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              title="다시 실행 (Ctrl+Shift+Z)"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6"
                />
              </svg>
            </button>

            <div className="h-6 w-px bg-gray-300 mx-1" />

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              title="닫기"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* 도구 그리드 */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {visibleTools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => setActiveTool(tool.type as PenTool)}
              className={`
                relative p-3 rounded-xl transition-all flex flex-col items-center gap-1
                ${
                  activeTool === tool.type
                    ? 'bg-primary-500 text-white shadow-lg scale-105'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:scale-105'
                }
              `}
            >
              <span className="text-2xl">{tool.icon}</span>
              <span className="text-xs font-medium">{tool.label}</span>
              <span
                className={`absolute top-1 right-1 text-[10px] px-1 rounded ${
                  activeTool === tool.type ? 'bg-white/20' : 'bg-gray-200'
                }`}
              >
                {tool.shortcut}
              </span>
            </button>
          ))}
        </div>

        {/* 색상 선택 */}
        <div className="mb-4">
          <label className="text-xs font-medium text-gray-600 mb-2 block">색상</label>
          <div className="grid grid-cols-12 gap-2">
            {colorPresets.map((color) => (
              <button
                key={color.value}
                onClick={() => setPenColor(color.value)}
                className={`
                  w-full aspect-square rounded-lg transition-all
                  ${
                    penColor === color.value
                      ? 'ring-2 ring-primary-500 ring-offset-2 scale-110'
                      : 'hover:scale-110'
                  }
                `}
                style={{
                  backgroundColor: color.value,
                  border: color.value === '#FFFFFF' ? '1px solid #E5E7EB' : 'none',
                }}
                title={color.label}
              />
            ))}
          </div>
        </div>

        {/* 굵기 선택 */}
        <div>
          <label className="text-xs font-medium text-gray-600 mb-2 block">굵기</label>
          <div className="grid grid-cols-4 gap-2">
            {strokePresets.map((stroke) => (
              <button
                key={stroke.value}
                onClick={() => setStrokeWidth(stroke.value)}
                className={`
                  p-3 rounded-xl transition-all flex flex-col items-center gap-2
                  ${
                    strokeWidth === stroke.value
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <div
                  className={`rounded-full ${
                    strokeWidth === stroke.value ? 'bg-white' : 'bg-gray-800'
                  }`}
                  style={{
                    width: `${stroke.value * 3}px`,
                    height: `${stroke.value * 3}px`,
                  }}
                />
                <span className="text-xs font-medium">{stroke.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 키보드 단축키 힌트 */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            💡 <kbd className="px-1 py-0.5 bg-gray-100 rounded">P</kbd>,{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 rounded">H</kbd>,{' '}
            <kbd className="px-1 py-0.5 bg-gray-100 rounded">E</kbd> 키로 빠른 도구 전환
          </div>
        </div>
      </div>
    </div>
  );
}
