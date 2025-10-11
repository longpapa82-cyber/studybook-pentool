import { useEffect, useCallback } from 'react';
import { usePentoolStore } from '@/stores/pentoolStore';
import { useEbookStore } from '@/stores/ebookStore';
import type { PenTool } from '@/types/pentool.types';

// 키보드 단축키 매핑
const TOOL_SHORTCUTS: Record<string, PenTool> = {
  p: 'pen',
  h: 'highlighter',
  e: 'eraser',
  v: 'none', // selection mode
  l: 'line',
  a: 'arrow',
  r: 'rectangle',
  c: 'circle',
};

export function useKeyboardShortcuts() {
  const {
    undo,
    redo,
    selectedAnnotationId,
    removeAnnotation,
    copyAnnotation,
    pasteAnnotation,
    clearSelection,
    setActiveTool,
  } = usePentoolStore();

  const { currentPage, zoomIn, zoomOut, resetZoom } = useEbookStore();

  // 도구 변경 알림 표시
  const showToolNotification = useCallback((toolName: string) => {
    const toolNames: Record<string, string> = {
      pen: '펜',
      highlighter: '형광펜',
      eraser: '지우개',
      none: '선택',
      line: '직선',
      arrow: '화살표',
      rectangle: '사각형',
      circle: '원',
    };

    const notification = document.createElement('div');
    notification.textContent = `${toolNames[toolName] || toolName}`;
    notification.className =
      'fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm font-medium pointer-events-none';
    notification.style.animation = 'fade-in-out 1s ease-in-out';

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 1000);
  }, []);

  useEffect(() => {
    // 입력 필드에서는 단축키 비활성화
    const isInputElement = (target: EventTarget | null): boolean => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tagName = target.tagName.toLowerCase();
      return (
        tagName === 'input' ||
        tagName === 'textarea' ||
        target.contentEditable === 'true'
      );
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 단축키 무시
      if (isInputElement(e.target)) return;

      const key = e.key.toLowerCase();
      const hasModifier = e.ctrlKey || e.metaKey;

      // Ctrl/Cmd + Z: Undo
      if (hasModifier && key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z 또는 Ctrl/Cmd + Y: Redo
      if ((hasModifier && key === 'z' && e.shiftKey) || (hasModifier && key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd + C: Copy
      if (hasModifier && key === 'c' && selectedAnnotationId) {
        e.preventDefault();
        copyAnnotation(selectedAnnotationId, currentPage);
        return;
      }

      // Ctrl/Cmd + V: Paste
      if (hasModifier && key === 'v') {
        e.preventDefault();
        pasteAnnotation(currentPage);
        return;
      }

      // Delete/Backspace: 선택된 주석 삭제
      if ((key === 'delete' || key === 'backspace') && selectedAnnotationId) {
        e.preventDefault();
        removeAnnotation(currentPage, selectedAnnotationId);
        clearSelection();
        return;
      }

      // Escape: 선택 해제
      if (key === 'escape') {
        e.preventDefault();
        clearSelection();
        return;
      }

      // Ctrl/Cmd + '+' or '=': Zoom in
      if (hasModifier && (key === '+' || key === '=')) {
        e.preventDefault();
        zoomIn();
        return;
      }

      // Ctrl/Cmd + '-': Zoom out
      if (hasModifier && key === '-') {
        e.preventDefault();
        zoomOut();
        return;
      }

      // Ctrl/Cmd + '0': Reset zoom
      if (hasModifier && key === '0') {
        e.preventDefault();
        resetZoom();
        return;
      }

      // 도구 전환 단축키 (수정자 키 없이)
      if (!hasModifier && !e.altKey && !e.shiftKey) {
        const tool = TOOL_SHORTCUTS[key];
        if (tool) {
          e.preventDefault();
          setActiveTool(tool);
          showToolNotification(tool);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    undo,
    redo,
    selectedAnnotationId,
    removeAnnotation,
    copyAnnotation,
    pasteAnnotation,
    clearSelection,
    currentPage,
    setActiveTool,
    zoomIn,
    zoomOut,
    resetZoom,
    showToolNotification,
  ]);
}

// CSS 애니메이션 추가 (한 번만 실행)
if (typeof document !== 'undefined' && !document.getElementById('keyboard-shortcuts-style')) {
  const style = document.createElement('style');
  style.id = 'keyboard-shortcuts-style';
  style.textContent = `
    @keyframes fade-in-out {
      0% { opacity: 0; transform: translate(-50%, 10px); }
      20% { opacity: 1; transform: translate(-50%, 0); }
      80% { opacity: 1; transform: translate(-50%, 0); }
      100% { opacity: 0; transform: translate(-50%, -10px); }
    }
  `;
  document.head.appendChild(style);
}
