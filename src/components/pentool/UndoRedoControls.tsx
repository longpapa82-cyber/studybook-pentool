import { usePentoolStore } from '@/stores/pentoolStore';

export function UndoRedoControls() {
  const { history, historyIndex, undo, redo } = usePentoolStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`px-3 py-2 rounded transition-all ${
          canUndo
            ? 'text-gray-700 hover:bg-white hover:shadow-sm'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title="실행 취소 (Ctrl+Z)"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className={`px-3 py-2 rounded transition-all ${
          canRedo
            ? 'text-gray-700 hover:bg-white hover:shadow-sm'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title="다시 실행 (Ctrl+Y)"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
          />
        </svg>
      </button>
    </div>
  );
}
