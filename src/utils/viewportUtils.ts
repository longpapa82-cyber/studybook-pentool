/**
 * Viewport Utilities for Performance Optimization
 * Phase 2: 가상화된 주석 렌더링
 */

import type { Annotation } from '@/types/pentool.types';

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Calculate bounding box for an annotation
 */
export function getAnnotationBounds(annotation: Annotation): BoundingBox {
  if (annotation.type !== 'drawing') {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const points = annotation.data.points;
  if (points.length < 2) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  // Extract x, y coordinates from flat array
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  // Add stroke width padding
  const padding = annotation.data.strokeWidth + 10;

  return {
    x: minX - padding,
    y: minY - padding,
    width: maxX - minX + padding * 2,
    height: maxY - minY + padding * 2,
  };
}

/**
 * Check if bounding box intersects with viewport
 */
export function isInViewport(bounds: BoundingBox, viewport: Viewport): boolean {
  return !(
    bounds.x + bounds.width < viewport.x ||
    bounds.x > viewport.x + viewport.width ||
    bounds.y + bounds.height < viewport.y ||
    bounds.y > viewport.y + viewport.height
  );
}

/**
 * Filter annotations to only visible ones in viewport
 * Returns indices for efficient updates
 */
export function getVisibleAnnotations(
  annotations: Annotation[],
  viewport: Viewport
): Annotation[] {
  return annotations.filter((annotation) => {
    const bounds = getAnnotationBounds(annotation);
    return isInViewport(bounds, viewport);
  });
}

/**
 * Calculate viewport from canvas dimensions and scroll position
 */
export function calculateViewport(
  canvasWidth: number,
  canvasHeight: number,
  scale: number = 1,
  offsetX: number = 0,
  offsetY: number = 0
): Viewport {
  return {
    x: offsetX,
    y: offsetY,
    width: canvasWidth / scale,
    height: canvasHeight / scale,
    scale,
  };
}

/**
 * Expand viewport for pre-loading nearby annotations
 * Reduces pop-in during scrolling
 */
export function expandViewport(viewport: Viewport, factor: number = 1.5): Viewport {
  const expandX = (viewport.width * (factor - 1)) / 2;
  const expandY = (viewport.height * (factor - 1)) / 2;

  return {
    x: viewport.x - expandX,
    y: viewport.y - expandY,
    width: viewport.width * factor,
    height: viewport.height * factor,
    scale: viewport.scale,
  };
}
