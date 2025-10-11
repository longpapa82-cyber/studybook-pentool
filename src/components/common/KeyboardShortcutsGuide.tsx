import { useState } from 'react';

export function KeyboardShortcutsGuide() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    {
      category: '도구 전환',
      items: [
        { keys: ['P'], description: '펜 도구' },
        { keys: ['H'], description: '형광펜' },
        { keys: ['E'], description: '지우개' },
        { keys: ['V'], description: '선택 모드' },
        { keys: ['L'], description: '직선' },
        { keys: ['A'], description: '화살표' },
        { keys: ['R'], description: '사각형' },
        { keys: ['C'], description: '원' },
      ],
    },
    {
      category: '편집',
      items: [
        { keys: ['Ctrl', 'Z'], description: '실행 취소' },
        { keys: ['Ctrl', 'Shift', 'Z'], description: '다시 실행' },
        { keys: ['Ctrl', 'C'], description: '복사' },
        { keys: ['Ctrl', 'V'], description: '붙여넣기' },
        { keys: ['Delete'], description: '삭제' },
        { keys: ['Escape'], description: '선택 해제' },
      ],
    },
    {
      category: '보기',
      items: [
        { keys: ['Ctrl', '+'], description: '확대' },
        { keys: ['Ctrl', '-'], description: '축소' },
        { keys: ['Ctrl', '0'], description: '원래 크기' },
      ],
    },
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-32 right-6 p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-all z-30"
        title="키보드 단축키 보기"
      >
        <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </button>
    );
  }

  return (
    <>
      {/* 오버레이 */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setIsOpen(false)}
      />

      {/* 가이드 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">⌨️ 키보드 단축키</h2>
              <p className="text-sm text-gray-600 mt-1">빠른 작업을 위한 단축키 모음</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 단축키 목록 */}
          <div className="p-6 space-y-6">
            {shortcuts.map((category) => (
              <div key={category.category}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-700">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, keyIndex) => (
                          <span key={keyIndex} className="flex items-center gap-1">
                            <kbd className="px-3 py-1.5 bg-gray-100 border border-gray-300 rounded-lg text-sm font-mono font-semibold text-gray-800 shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < item.keys.length - 1 && (
                              <span className="text-gray-400">+</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 푸터 */}
          <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Mac에서는 <kbd className="px-1 py-0.5 bg-white rounded text-xs">Ctrl</kbd> 대신{' '}
                <kbd className="px-1 py-0.5 bg-white rounded text-xs">Cmd</kbd>를 사용하세요
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
