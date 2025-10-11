/**
 * Hook for using Annotation Processing Worker
 * Phase 2: Offload heavy computations to background thread
 */

import { useEffect, useRef, useCallback } from 'react';
import type { WorkerMessage, WorkerResponse } from '@/workers/annotationProcessor.worker';

export function useAnnotationWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingCallbacks = useRef<Map<string, (data: any, error?: string) => void>>(new Map());

  useEffect(() => {
    // Initialize worker
    workerRef.current = new Worker(
      new URL('../workers/annotationProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Handle worker messages
    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const { type, id, data, error } = e.data;
      const callback = pendingCallbacks.current.get(id);

      if (callback) {
        if (type === 'error') {
          callback(null, error);
        } else {
          callback(data);
        }
        pendingCallbacks.current.delete(id);
      }
    };

    // Cleanup on unmount
    return () => {
      workerRef.current?.terminate();
      workerRef.current = null;
      pendingCallbacks.current.clear();
    };
  }, []);

  /**
   * Simplify points in background thread
   */
  const simplifyPoints = useCallback(
    (points: number[], tolerance: number = 1.0): Promise<number[]> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const id = `simplify-${Date.now()}-${Math.random()}`;

        pendingCallbacks.current.set(id, (data, error) => {
          if (error) {
            reject(new Error(error));
          } else {
            resolve(data);
          }
        });

        const message: WorkerMessage = {
          type: 'simplify',
          id,
          data: { points, tolerance },
        };

        workerRef.current.postMessage(message);
      });
    },
    []
  );

  /**
   * Batch simplify multiple annotations
   */
  const batchSimplify = useCallback(
    (annotations: any[], tolerance: number = 1.0): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        if (!workerRef.current) {
          reject(new Error('Worker not initialized'));
          return;
        }

        const id = `batch-${Date.now()}-${Math.random()}`;

        pendingCallbacks.current.set(id, (data, error) => {
          if (error) {
            reject(new Error(error));
          } else {
            resolve(data);
          }
        });

        const message: WorkerMessage = {
          type: 'batch-simplify',
          id,
          data: { annotations, tolerance },
        };

        workerRef.current.postMessage(message);
      });
    },
    []
  );

  /**
   * Serialize annotations in background
   */
  const serializeAnnotations = useCallback((annotations: any[]): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'));
        return;
      }

      const id = `serialize-${Date.now()}-${Math.random()}`;

      pendingCallbacks.current.set(id, (data, error) => {
        if (error) {
          reject(new Error(error));
        } else {
          resolve(data);
        }
      });

      const message: WorkerMessage = {
        type: 'serialize',
        id,
        data: { annotations },
      };

      workerRef.current.postMessage(message);
    });
  }, []);

  return {
    simplifyPoints,
    batchSimplify,
    serializeAnnotations,
  };
}
