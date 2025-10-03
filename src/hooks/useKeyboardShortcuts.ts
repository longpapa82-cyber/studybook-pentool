import { useEffect } from 'react';
import { usePentoolStore } from '@/stores/pentoolStore';
import { useEbookStore } from '@/stores/ebookStore';

export function useKeyboardShortcuts() {
  const {
    undo,
    redo,
    selectedAnnotationId,
    removeAnnotation,
    copyAnnotation,
    pasteAnnotation,
    clearSelection,
  } = usePentoolStore();

  const { currentPage } = useEbookStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl/Cmd + Shift + Z 또는 Ctrl/Cmd + Y: Redo
      if (
        ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')
      ) {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl/Cmd + C: Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedAnnotationId) {
        e.preventDefault();
        copyAnnotation(selectedAnnotationId, currentPage);
        return;
      }

      // Ctrl/Cmd + V: Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        pasteAnnotation(currentPage);
        return;
      }

      // Delete/Backspace: 선택된 주석 삭제
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        e.preventDefault();
        removeAnnotation(currentPage, selectedAnnotationId);
        clearSelection();
        return;
      }

      // Escape: 선택 해제
      if (e.key === 'Escape') {
        e.preventDefault();
        clearSelection();
        return;
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
  ]);
}
