import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  throttle,
  debounce,
  requestAnimationFrameThrottle,
  getOptimalCanvasScale,
} from '@/utils/performanceUtils';

describe('performanceUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('throttle', () => {
    it('should call function immediately on first call', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should throttle subsequent calls', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      // Call multiple times rapidly
      throttled();
      throttled();
      throttled();
      throttled();

      // Only first call should execute immediately
      expect(fn).toHaveBeenCalledTimes(1);

      // Advance time
      vi.advanceTimersByTime(100);

      // Last call should execute after delay
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should respect custom delay', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 200);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);

      throttled();
      throttled();

      // After 100ms, should not have called again
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      // After 200ms total, should call
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 100);

      throttled('arg1', 'arg2');

      expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();

      // Should not call immediately
      expect(fn).not.toHaveBeenCalled();

      // After delay, should call
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced();
      vi.advanceTimersByTime(50);

      debounced(); // Reset timer
      vi.advanceTimersByTime(50);

      // Should not have called yet (timer was reset)
      expect(fn).not.toHaveBeenCalled();

      // After full delay from last call
      vi.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should only call once after rapid calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      // Rapid calls
      for (let i = 0; i < 10; i++) {
        debounced();
        vi.advanceTimersByTime(10);
      }

      // Should not have called during rapid calls
      expect(fn).not.toHaveBeenCalled();

      // After delay from last call
      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass latest arguments', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('first');
      debounced('second');
      debounced('third');

      vi.advanceTimersByTime(100);

      // Should use latest arguments
      expect(fn).toHaveBeenCalledWith('third');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('requestAnimationFrameThrottle', () => {
    it('should use requestAnimationFrame', () => {
      const fn = vi.fn();
      const rafSpy = vi.spyOn(global, 'requestAnimationFrame');
      const throttled = requestAnimationFrameThrottle(fn);

      throttled();

      expect(rafSpy).toHaveBeenCalled();
    });

    it('should batch multiple calls into one frame', () => {
      const fn = vi.fn();
      const throttled = requestAnimationFrameThrottle(fn);

      // Multiple calls before RAF executes
      throttled('call1');
      throttled('call2');
      throttled('call3');

      // Function not called yet
      expect(fn).not.toHaveBeenCalled();

      // Trigger RAF callbacks
      vi.runAllTimers();

      // Should call only once with last arguments
      expect(fn).toHaveBeenCalledTimes(1);
      expect(fn).toHaveBeenCalledWith('call3');
    });
  });

  describe('getOptimalCanvasScale', () => {
    it('should return device pixel ratio capped at 2', () => {
      // Mock high DPI display
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 3,
      });

      const scale = getOptimalCanvasScale();

      // Should cap at 2 for performance
      expect(scale).toBe(2);
    });

    it('should return 1 for low DPI displays', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 1,
      });

      const scale = getOptimalCanvasScale();

      expect(scale).toBe(1);
    });

    it('should handle undefined devicePixelRatio', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      const scale = getOptimalCanvasScale();

      // Should default to 1
      expect(scale).toBe(1);
    });

    it('should return actual ratio if below 2', () => {
      Object.defineProperty(window, 'devicePixelRatio', {
        writable: true,
        configurable: true,
        value: 1.5,
      });

      const scale = getOptimalCanvasScale();

      expect(scale).toBe(1.5);
    });
  });
});
