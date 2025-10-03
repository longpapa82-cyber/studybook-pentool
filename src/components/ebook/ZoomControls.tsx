import { useEbookStore } from '@/stores/ebookStore';

export function ZoomControls() {
  const { zoom, zoomIn, zoomOut, resetZoom } = useEbookStore();

  const zoomPercentage = Math.round(zoom * 100);

  return (
    <div className="flex items-center gap-2">
      {/* 축소 버튼 */}
      <button
        onClick={zoomOut}
        disabled={zoom <= 0.5}
        className="icon-btn disabled:opacity-30 disabled:cursor-not-allowed"
        title="축소 (Ctrl + -)"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
          />
        </svg>
      </button>

      {/* 줌 레벨 표시 */}
      <button
        onClick={resetZoom}
        className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors min-w-[60px]"
        title="줌 초기화 (100%)"
      >
        {zoomPercentage}%
      </button>

      {/* 확대 버튼 */}
      <button
        onClick={zoomIn}
        disabled={zoom >= 2.0}
        className="icon-btn disabled:opacity-30 disabled:cursor-not-allowed"
        title="확대 (Ctrl + +)"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"
          />
        </svg>
      </button>

      {/* 구분선 */}
      <div className="h-6 w-px bg-gray-300 mx-1" />

      {/* 전체화면 버튼 */}
      <button
        onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        }}
        className="icon-btn"
        title="전체화면 (F11)"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
      </button>
    </div>
  );
}
