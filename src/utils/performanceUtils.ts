// Performance optimization utilities

/**
 * Throttle function calls to improve performance
 * @param func Function to throttle
 * @param delay Delay in milliseconds (default: 16ms for 60fps)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number = 16
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    } else {
      // Schedule the call for when the delay period is over
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func.apply(this, args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Debounce function calls
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Request animation frame wrapper for smooth canvas rendering
 */
export function requestAnimationFrameThrottle<T extends (...args: any[]) => any>(
  func: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function (this: any, ...args: Parameters<T>) {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          func.apply(this, lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  };
}

/**
 * Memory-efficient canvas cleanup
 */
export function cleanupCanvas(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // Release memory
  canvas.width = 0;
  canvas.height = 0;
}

/**
 * Calculate optimal canvas scale for device pixel ratio
 */
export function getOptimalCanvasScale(): number {
  const dpr = window.devicePixelRatio || 1;
  // Cap at 2x for performance on high-DPI displays
  return Math.min(dpr, 2);
}
