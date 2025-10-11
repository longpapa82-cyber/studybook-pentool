/**
 * Canvas Pool for Performance Optimization
 * Phase 2: Reuse canvas elements to reduce memory allocation
 */

export class CanvasPool {
  private pool: HTMLCanvasElement[] = [];
  private maxSize: number;
  private usedCanvases: Set<HTMLCanvasElement> = new Set();

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  /**
   * Get a canvas from pool or create new one
   */
  acquire(width: number, height: number): HTMLCanvasElement {
    let canvas: HTMLCanvasElement;

    if (this.pool.length > 0) {
      canvas = this.pool.pop()!;
    } else {
      canvas = document.createElement('canvas');
    }

    // Set dimensions
    canvas.width = width;
    canvas.height = height;

    this.usedCanvases.add(canvas);
    return canvas;
  }

  /**
   * Return canvas to pool for reuse
   */
  release(canvas: HTMLCanvasElement): void {
    if (!this.usedCanvases.has(canvas)) {
      console.warn('Attempting to release canvas not from this pool');
      return;
    }

    // Clear canvas
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    this.usedCanvases.delete(canvas);

    // Return to pool if not at max capacity
    if (this.pool.length < this.maxSize) {
      this.pool.push(canvas);
    }
  }

  /**
   * Clear all canvases and reset pool
   */
  clear(): void {
    this.pool = [];
    this.usedCanvases.clear();
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      available: this.pool.length,
      used: this.usedCanvases.size,
      total: this.pool.length + this.usedCanvases.size,
      maxSize: this.maxSize,
    };
  }
}

// Global canvas pool instance
let globalCanvasPool: CanvasPool | null = null;

/**
 * Get or create global canvas pool
 */
export function getCanvasPool(): CanvasPool {
  if (!globalCanvasPool) {
    globalCanvasPool = new CanvasPool(10);
  }
  return globalCanvasPool;
}

/**
 * Hook for using canvas pool
 */
export function useCanvasFromPool(width: number, height: number): {
  canvas: HTMLCanvasElement | null;
  release: () => void;
} {
  const pool = getCanvasPool();
  let canvas: HTMLCanvasElement | null = null;

  const acquire = () => {
    if (!canvas) {
      canvas = pool.acquire(width, height);
    }
    return canvas;
  };

  const release = () => {
    if (canvas) {
      pool.release(canvas);
      canvas = null;
    }
  };

  return {
    canvas: acquire(),
    release,
  };
}
