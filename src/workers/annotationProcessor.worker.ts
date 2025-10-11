/**
 * Annotation Processing Web Worker
 * Phase 2: Background processing for heavy operations
 */

import { simplifyPoints } from '../utils/geometryUtils';

export interface WorkerMessage {
  type: 'simplify' | 'serialize' | 'batch-simplify';
  id: string;
  data: any;
}

export interface WorkerResponse {
  type: 'simplified' | 'serialized' | 'batch-simplified' | 'error';
  id: string;
  data: any;
  error?: string;
}

// Worker message handler
self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, id, data } = e.data;

  try {
    switch (type) {
      case 'simplify': {
        const { points, tolerance } = data;
        const simplified = simplifyPoints(points, tolerance || 1.0);

        const response: WorkerResponse = {
          type: 'simplified',
          id,
          data: simplified,
        };
        self.postMessage(response);
        break;
      }

      case 'batch-simplify': {
        const { annotations, tolerance } = data;
        const results = annotations.map((annotation: any) => {
          if (annotation.type === 'drawing') {
            return {
              ...annotation,
              data: {
                ...annotation.data,
                points: simplifyPoints(annotation.data.points, tolerance || 1.0),
              },
            };
          }
          return annotation;
        });

        const response: WorkerResponse = {
          type: 'batch-simplified',
          id,
          data: results,
        };
        self.postMessage(response);
        break;
      }

      case 'serialize': {
        const serialized = JSON.stringify(data.annotations);

        const response: WorkerResponse = {
          type: 'serialized',
          id,
          data: serialized,
        };
        self.postMessage(response);
        break;
      }

      default: {
        const response: WorkerResponse = {
          type: 'error',
          id,
          data: null,
          error: `Unknown message type: ${type}`,
        };
        self.postMessage(response);
      }
    }
  } catch (error) {
    const response: WorkerResponse = {
      type: 'error',
      id,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    self.postMessage(response);
  }
};

// Type safety for TypeScript
export {};
