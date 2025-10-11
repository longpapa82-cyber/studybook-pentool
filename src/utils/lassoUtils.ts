/**
 * Lasso Selection Utilities
 * Phase 3-2: Free-form selection tool
 */

import type { Point, Annotation } from '@/types/pentool.types';
import { getAnnotationBounds } from './viewportUtils';

/**
 * Ray casting algorithm for point-in-polygon test
 * Returns true if point is inside the polygon
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  if (polygon.length < 3) return false;

  let inside = false;
  const x = point.x;
  const y = point.y;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    // Check if ray from point crosses this edge
    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

/**
 * Check if any part of annotation intersects with lasso path
 * Uses bounding box test + sample points from annotation
 */
export function isAnnotationInLasso(
  annotation: Annotation,
  lassoPath: Point[]
): boolean {
  if (lassoPath.length < 3) return false;

  // Get annotation bounds
  const bounds = getAnnotationBounds(annotation);

  // Test if any corner of bounding box is inside lasso
  const corners: Point[] = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x, y: bounds.y + bounds.height },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height },
  ];

  for (const corner of corners) {
    if (isPointInPolygon(corner, lassoPath)) {
      return true;
    }
  }

  // For drawing annotations, test sample points along the path
  if (annotation.type === 'drawing') {
    const points = annotation.data.points;
    const sampleCount = Math.min(20, Math.floor(points.length / 2)); // Sample up to 20 points
    const step = Math.max(1, Math.floor(points.length / 2 / sampleCount));

    for (let i = 0; i < points.length; i += step * 2) {
      const point = { x: points[i], y: points[i + 1] };
      if (isPointInPolygon(point, lassoPath)) {
        return true;
      }
    }
  }

  // For text annotations, test center point
  if (annotation.type === 'text') {
    const textData = annotation.data;
    const center = {
      x: textData.position.x + (textData.width || 100) / 2,
      y: textData.position.y + textData.fontSize / 2,
    };
    return isPointInPolygon(center, lassoPath);
  }

  return false;
}

/**
 * Convert flat points array to Point array
 */
export function flatPointsToPointArray(flatPoints: number[]): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < flatPoints.length; i += 2) {
    points.push({ x: flatPoints[i], y: flatPoints[i + 1] });
  }
  return points;
}

/**
 * Simplify lasso path using Douglas-Peucker algorithm
 * Reduces number of points while maintaining shape
 */
export function simplifyLassoPath(points: Point[], tolerance: number = 5): Point[] {
  if (points.length < 3) return points;

  function perpendicularDistance(
    point: Point,
    lineStart: Point,
    lineEnd: Point
  ): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;

    if (dx === 0 && dy === 0) {
      return Math.hypot(point.x - lineStart.x, point.y - lineStart.y);
    }

    const t =
      ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) /
      (dx * dx + dy * dy);

    const closestPoint = {
      x: lineStart.x + t * dx,
      y: lineStart.y + t * dy,
    };

    return Math.hypot(point.x - closestPoint.x, point.y - closestPoint.y);
  }

  function douglasPeucker(points: Point[], tolerance: number): Point[] {
    if (points.length <= 2) return points;

    let maxDistance = 0;
    let maxIndex = 0;
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];

    for (let i = 1; i < points.length - 1; i++) {
      const distance = perpendicularDistance(points[i], firstPoint, lastPoint);
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    if (maxDistance > tolerance) {
      const leftSegment = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
      const rightSegment = douglasPeucker(points.slice(maxIndex), tolerance);
      return [...leftSegment.slice(0, -1), ...rightSegment];
    }

    return [firstPoint, lastPoint];
  }

  return douglasPeucker(points, tolerance);
}

/**
 * Calculate centroid of lasso path
 * Useful for visual feedback
 */
export function getLassoCentroid(points: Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };

  const sum = points.reduce(
    (acc, point) => ({
      x: acc.x + point.x,
      y: acc.y + point.y,
    }),
    { x: 0, y: 0 }
  );

  return {
    x: sum.x / points.length,
    y: sum.y / points.length,
  };
}

/**
 * Get annotations selected by lasso
 */
export function getAnnotationsInLasso(
  annotations: Annotation[],
  lassoPath: Point[]
): Annotation[] {
  if (lassoPath.length < 3) return [];

  return annotations.filter((annotation) =>
    isAnnotationInLasso(annotation, lassoPath)
  );
}
