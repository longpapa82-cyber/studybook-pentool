import { useState, useEffect } from 'react';

export function QuickTips() {
  const [currentTip, setCurrentTip] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const tips = [
    {
      icon: '⌨️',
      text: 'P 키를 눌러 펜 도구로 빠르게 전환하세요',
    },
    {
      icon: '🖱️',
      text: '주석을 우클릭하여 빠른 편집 메뉴를 사용하세요',
    },
    {
      icon: '🎨',
      text: '색상과 굵기를 자유롭게 변경할 수 있습니다',
    },
    {
      icon: '💾',
      text: '모든 주석은 자동으로 저장됩니다',
    },
    {
      icon: '🔍',
      text: 'Ctrl + 마우스 휠로 빠르게 확대/축소하세요',
    },
    {
      icon: '⚡',
      text: 'Ctrl+Z로 실행 취소, Ctrl+Shift+Z로 다시 실행',
    },
  ];

  useEffect(() => {
    // 5초마다 팁 변경
    const timer = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length);
    }, 5000);

    // 처음 3초 후에 표시
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(showTimer);
    };
  }, [tips.length]);

  // 15초 후 자동 숨김
  useEffect(() => {
    if (isVisible) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 15000);

      return () => clearTimeout(hideTimer);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const tip = tips[currentTip];

  return (
    <div className="fixed top-6 right-6 z-30 animate-slide-in">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-w-xs">
        <div className="flex items-start gap-3">
          <div className="text-2xl">{tip.icon}</div>
          <div className="flex-1">
            <p className="text-sm text-gray-700">{tip.text}</p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

        {/* 진행 표시 */}
        <div className="flex gap-1 mt-3">
          {tips.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-all ${
                index === currentTip ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
