import { useState, useEffect } from 'react';

export function FirstTimeTutorial() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // 첫 방문 체크
    const hasVisited = localStorage.getItem('studybook_tutorial_completed');
    if (!hasVisited) {
      setIsVisible(true);
    }
  }, []);

  const steps = [
    {
      title: '환영합니다! 📚',
      description: 'StudyBook은 PDF에 직접 필기할 수 있는 전자책 뷰어입니다.',
      image: '📖',
      tip: 'PDF 파일을 업로드하여 시작하세요',
    },
    {
      title: '펜 도구로 필기하기 ✏️',
      description: '다양한 펜 도구로 PDF에 자유롭게 필기할 수 있습니다.',
      image: '🖊️',
      tip: 'P 키를 눌러 펜 도구를 선택하세요',
    },
    {
      title: '키보드 단축키 ⌨️',
      description: '키보드 단축키로 빠르게 작업할 수 있습니다.',
      image: '⚡',
      tip: 'P, H, E 키로 도구를 빠르게 전환하세요',
    },
    {
      title: '자동 저장 💾',
      description: '모든 주석은 자동으로 저장됩니다. 걱정하지 마세요!',
      image: '✅',
      tip: '다음에 같은 PDF를 열면 주석이 그대로 유지됩니다',
    },
  ];

  const handleSkip = () => {
    localStorage.setItem('studybook_tutorial_completed', 'true');
    setIsVisible(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSkip();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!isVisible) return null;

  const step = steps[currentStep];

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" />

      {/* 튜토리얼 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* 진행 상황 표시 */}
          <div className="bg-primary-500 p-4">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    index <= currentStep ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 내용 */}
          <div className="p-8 text-center">
            {/* 이미지/아이콘 */}
            <div className="text-8xl mb-6 animate-bounce">{step.image}</div>

            {/* 제목 */}
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h2>

            {/* 설명 */}
            <p className="text-gray-600 mb-4">{step.description}</p>

            {/* 팁 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> {step.tip}
              </p>
            </div>

            {/* 단계 표시 */}
            <p className="text-sm text-gray-500 mb-6">
              {currentStep + 1} / {steps.length}
            </p>
          </div>

          {/* 버튼 */}
          <div className="border-t border-gray-200 p-4 flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              건너뛰기
            </button>

            <div className="flex gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  이전
                </button>
              )}
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
              >
                {currentStep < steps.length - 1 ? '다음' : '시작하기'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
