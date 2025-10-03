import { usePentoolStore } from '@/stores/pentoolStore';
import type { PenTool } from '@/types/pentool.types';

export function ToolPalette() {
  const { activeTool, setActiveTool } = usePentoolStore();

  const tools: { type: PenTool; icon: JSX.Element; label: string }[] = [
    {
      type: 'pen',
      label: '펜',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      ),
    },
    {
      type: 'highlighter',
      label: '형광펜',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10M5 11l7-7 7 7M5 11l2 2m5-5v12m5-9l2-2"
          />
        </svg>
      ),
    },
    {
      type: 'eraser',
      label: '지우개',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {tools.map((tool) => (
        <button
          key={tool.type}
          onClick={() => setActiveTool(tool.type)}
          className={`px-3 py-2 rounded transition-all ${
            activeTool === tool.type
              ? 'bg-white text-primary-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}

      {/* 구분선 */}
      <div className="h-6 w-px bg-gray-300 mx-1" />

      {/* 선택 도구 (펜 비활성화) */}
      <button
        onClick={() => setActiveTool('none')}
        className={`px-3 py-2 rounded transition-all ${
          activeTool === 'none'
            ? 'bg-white text-primary-700 shadow-sm'
            : 'text-gray-600 hover:text-gray-800'
        }`}
        title="선택 모드"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      </button>
    </div>
  );
}
