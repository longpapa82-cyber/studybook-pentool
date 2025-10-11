import { useState } from 'react';
import { usePentoolStore } from '@/stores/pentoolStore';

interface PenToolLayerProps {
  onClose: () => void;
}

export function PenToolLayer({ onClose }: PenToolLayerProps) {
  const { activeTool, penColor, setPenColor, strokeWidth, setStrokeWidth, setActiveTool } = usePentoolStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 주요 도구만 (접을 때 표시)
  const primaryTools = ['none', 'pen', 'highlighter', 'eraser'];
  // 확장 도구 (펼칠 때 표시)
  const extendedTools = ['line', 'arrow', 'rectangle', 'circle'];

  // 색상 옵션
  const COLORS = [
    { value: '#000000' },
    { value: '#EF4444' },
    { value: '#F97316' },
    { value: '#EAB308' },
    { value: '#22C55E' },
    { value: '#14B8A6' },
    { value: '#3B82F6' },
    { value: '#6366F1' },
    { value: '#A855F7' },
    { value: '#EC4899' },
    { value: '#6B7280' },
    { value: '#FFFFFF' },
  ];

  // 굵기 옵션
  const STROKE_WIDTHS = [
    { value: 1 },
    { value: 2 },
    { value: 4 },
    { value: 6 },
  ];

  // 도구 옵션
  const tools = [
    {
      type: 'none' as const,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
    },
    {
      type: 'pen' as const,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      type: 'highlighter' as const,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M5 11l7-7 7 7M5 11l2 2m5-5v12m5-9l2-2" />
        </svg>
      ),
    },
    {
      type: 'eraser' as const,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
    {
      type: 'line' as const,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
        </svg>
      ),
    },
    {
      type: 'arrow' as const,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      ),
    },
    {
      type: 'rectangle' as const,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="4" y="4" width="16" height="16" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      type: 'circle' as const,
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" strokeWidth={2} />
        </svg>
      ),
    },
  ];

  // 표시할 도구 필터링
  const visibleTools = isCollapsed
    ? tools.filter((tool) => primaryTools.includes(tool.type))
    : tools;

  return (
    <>
      {/* 펜툴 옵션 레이어 - 접기 가능 */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
        <div className="bg-white rounded-full shadow-2xl border border-gray-200 px-3 py-2">
          <div className="flex items-center gap-2">
            {/* 도구 버튼들 */}
            {visibleTools.map((tool) => (
              <button
                key={tool.type}
                onClick={() => setActiveTool(tool.type)}
                className={`p-2 rounded-full transition-all ${
                  activeTool === tool.type
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
                title={tool.type}
              >
                {tool.icon}
              </button>
            ))}

            {/* 더보기/접기 버튼 */}
            {!isCollapsed && (
              <>
                <div className="h-6 w-px bg-gray-300" />

                {/* 색상 선택 */}
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setPenColor(color.value)}
                    className={`w-6 h-6 rounded-full transition-all ${
                      penColor === color.value
                        ? 'ring-2 ring-primary-500 ring-offset-2 scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{
                      backgroundColor: color.value,
                      border: color.value === '#FFFFFF' ? '1px solid #E5E7EB' : 'none',
                    }}
                    title="색상 변경"
                  />
                ))}

                {/* 구분선 */}
                <div className="h-6 w-px bg-gray-300" />

                {/* 굵기 선택 */}
                {STROKE_WIDTHS.map((stroke) => (
                  <button
                    key={stroke.value}
                    onClick={() => setStrokeWidth(stroke.value)}
                    className={`p-2 rounded-full transition-all flex items-center justify-center ${
                      strokeWidth === stroke.value
                        ? 'bg-gray-200'
                        : 'hover:bg-gray-100'
                    }`}
                    title={`굵기 ${stroke.value}px`}
                  >
                    <div
                      className="bg-gray-800 rounded-full"
                      style={{
                        width: `${stroke.value * 2.5}px`,
                        height: `${stroke.value * 2.5}px`,
                      }}
                    />
                  </button>
                ))}
              </>
            )}

            {/* 구분선 */}
            <div className="h-6 w-px bg-gray-300" />

            {/* 접기/펼치기 버튼 */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-all"
              title={isCollapsed ? '펼치기' : '접기'}
            >
              {isCollapsed ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-600 hover:bg-gray-100 transition-all"
              title="닫기"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
