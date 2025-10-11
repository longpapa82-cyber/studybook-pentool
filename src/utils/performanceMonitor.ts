/**
 * Performance Monitoring Utility
 * Phase 2: Track and optimize performance metrics
 */

export interface PerformanceMetrics {
  renderTime: number;
  annotationCount: number;
  visibleAnnotationCount: number;
  memoryUsage?: number;
  fps: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics: number = 100;
  private frameCount: number = 0;
  private lastFrameTime: number = performance.now();
  private fps: number = 60;

  /**
   * Record a performance metric
   */
  record(metric: Omit<PerformanceMetrics, 'timestamp' | 'fps'>): void {
    this.updateFPS();

    const fullMetric: PerformanceMetrics = {
      ...metric,
      fps: this.fps,
      timestamp: performance.now(),
    };

    this.metrics.push(fullMetric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * Update FPS calculation
   */
  private updateFPS(): void {
    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastFrameTime;

    // Update FPS every second
    if (elapsed >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / elapsed);
      this.frameCount = 0;
      this.lastFrameTime = currentTime;
    }
  }

  /**
   * Get current FPS
   */
  getCurrentFPS(): number {
    return this.fps;
  }

  /**
   * Get average metrics over last N entries
   */
  getAverageMetrics(count: number = 10): Partial<PerformanceMetrics> | null {
    if (this.metrics.length === 0) return null;

    const recentMetrics = this.metrics.slice(-count);
    const sum = recentMetrics.reduce(
      (acc, m) => ({
        renderTime: acc.renderTime + m.renderTime,
        annotationCount: acc.annotationCount + m.annotationCount,
        visibleAnnotationCount: acc.visibleAnnotationCount + m.visibleAnnotationCount,
        fps: acc.fps + m.fps,
      }),
      { renderTime: 0, annotationCount: 0, visibleAnnotationCount: 0, fps: 0 }
    );

    return {
      renderTime: sum.renderTime / recentMetrics.length,
      annotationCount: sum.annotationCount / recentMetrics.length,
      visibleAnnotationCount: sum.visibleAnnotationCount / recentMetrics.length,
      fps: sum.fps / recentMetrics.length,
    };
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1048576; // Convert to MB
    }
    return undefined;
  }

  /**
   * Check if performance is degraded
   */
  isPerformanceDegraded(): boolean {
    const avg = this.getAverageMetrics(5);
    if (!avg) return false;

    // Performance is degraded if:
    // - FPS < 30
    // - Render time > 33ms (target is 16.67ms for 60fps)
    return (avg.fps ?? 60) < 30 || (avg.renderTime ?? 0) > 33;
  }

  /**
   * Get performance report
   */
  getReport(): string {
    const avg = this.getAverageMetrics(10);
    if (!avg) return 'No metrics available';

    const memory = this.getMemoryUsage();
    const memoryStr = memory ? ` | Memory: ${memory.toFixed(2)} MB` : '';

    return `FPS: ${avg.fps?.toFixed(1)} | Render: ${avg.renderTime?.toFixed(2)}ms | Annotations: ${avg.visibleAnnotationCount?.toFixed(0)}/${avg.annotationCount?.toFixed(0)}${memoryStr}`;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
  }

  /**
   * Export metrics as JSON
   */
  exportMetrics(): string {
    return JSON.stringify(this.metrics, null, 2);
  }
}

// Global performance monitor instance
let globalPerformanceMonitor: PerformanceMonitor | null = null;

/**
 * Get or create global performance monitor
 */
export function getPerformanceMonitor(): PerformanceMonitor {
  if (!globalPerformanceMonitor) {
    globalPerformanceMonitor = new PerformanceMonitor();
  }
  return globalPerformanceMonitor;
}

/**
 * Measure execution time of a function
 */
export async function measurePerformance<T>(
  label: string,
  fn: () => T | Promise<T>
): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const duration = performance.now() - start;

  console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);

  return result;
}

/**
 * Mark performance point for DevTools
 */
export function mark(name: string): void {
  if (performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure between two performance marks
 */
export function measure(name: string, startMark: string, endMark: string): void {
  if (performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
    } catch (e) {
      console.warn(`Failed to measure ${name}:`, e);
    }
  }
}
