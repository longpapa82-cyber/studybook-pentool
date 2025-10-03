import { usePentoolStore } from '@/stores/pentoolStore';
import type { PenTool } from '@/types/pentool.types';

export function ShapeTools() {
  const { activeTool, setActiveTool } = usePentoolStore();

  const tools: { type: PenTool; icon: JSX.Element; label: string }[] = [
    {
      type: 'line',
      label: '직선',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 12h14"
          />
        </svg>
      ),
    },
    {
      type: 'arrow',
      label: '화살표',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
      ),
    },
    {
      type: 'rectangle',
      label: '사각형',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      type: 'circle',
      label: '원',
      icon: (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle
            cx="12"
            cy="12"
            r="8"
            strokeWidth={2}
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
    </div>
  );
}
