// Phase 4-1: Auto-save hook for automatic annotation persistence

import { useEffect, useRef } from 'react';
import { usePentoolStore } from '@/stores/pentoolStore';

interface UseAutoSaveOptions {
  enabled?: boolean;
  interval?: number; // milliseconds
  onSave?: () => void;
  onError?: (error: Error) => void;
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const {
    enabled = true,
    interval = 30000, // 30 seconds default
    onSave,
    onError,
  } = options;

  const { saveToStorage, currentPdfFileName, annotations } = usePentoolStore();
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Auto-save function
    const performAutoSave = () => {
      try {
        const success = saveToStorage();
        if (success) {
          console.log(`[AutoSave] Saved annotations for ${currentPdfFileName}`);
          onSave?.();
        } else {
          throw new Error('Failed to save annotations');
        }
      } catch (error) {
        console.error('[AutoSave] Error:', error);
        onError?.(error as Error);
      }
    };

    // Set up interval
    intervalRef.current = window.setInterval(performAutoSave, interval);

    console.log(`[AutoSave] Started (interval: ${interval}ms)`);

    // Cleanup
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('[AutoSave] Stopped');
      }
    };
  }, [enabled, interval, currentPdfFileName, saveToStorage, onSave, onError]);

  // Save on unmount (when leaving page)
  useEffect(() => {
    return () => {
      if (enabled && annotations.size > 0) {
        saveToStorage();
        console.log('[AutoSave] Saved on unmount');
      }
    };
  }, [enabled, annotations, saveToStorage]);

  // Manual save function
  const saveNow = () => {
    try {
      const success = saveToStorage();
      if (success) {
        console.log('[AutoSave] Manual save completed');
        onSave?.();
      }
      return success;
    } catch (error) {
      console.error('[AutoSave] Manual save error:', error);
      onError?.(error as Error);
      return false;
    }
  };

  return { saveNow };
}
