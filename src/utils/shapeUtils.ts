// Phase 3-3: Shape drawing utilities

import type { Point, ShapeData } from '@/types/pentool.types';

/**
 * Calculate constrained end point for perfect shapes (with Shift key)
 */
export function constrainShapePoint(startPoint: Point, endPoint: Point, shapeType: string): Point {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;

  switch (shapeType) {
    case 'line':
      // Constrain to 45-degree angles
      const angle = Math.atan2(dy, dx);
      const snapAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      const distance = Math.sqrt(dx * dx + dy * dy);
      return {
        x: startPoint.x + distance * Math.cos(snapAngle),
        y: startPoint.y + distance * Math.sin(snapAngle),
      };

    case 'rectangle':
    case 'circle':
      // Constrain to square/circle (equal width and height)
      const size = Math.max(Math.abs(dx), Math.abs(dy));
      return {
        x: startPoint.x + size * Math.sign(dx),
        y: startPoint.y + size * Math.sign(dy),
      };

    case 'arrow':
      // Same as line for arrows
      const arrowAngle = Math.atan2(dy, dx);
      const snapArrowAngle = Math.round(arrowAngle / (Math.PI / 4)) * (Math.PI / 4);
      const arrowDistance = Math.sqrt(dx * dx + dy * dy);
      return {
        x: startPoint.x + arrowDistance * Math.cos(snapArrowAngle),
        y: startPoint.y + arrowDistance * Math.sin(snapArrowAngle),
      };

    default:
      return endPoint;
  }
}

/**
 * Calculate arrow head points
 */
export function calculateArrowHead(
  startPoint: Point,
  endPoint: Point,
  arrowSize: number = 15
): Point[] {
  const angle = Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x);
  const arrowAngle = Math.PI / 6; // 30 degrees

  const arrowPoint1 = {
    x: endPoint.x - arrowSize * Math.cos(angle - arrowAngle),
    y: endPoint.y - arrowSize * Math.sin(angle - arrowAngle),
  };

  const arrowPoint2 = {
    x: endPoint.x - arrowSize * Math.cos(angle + arrowAngle),
    y: endPoint.y - arrowSize * Math.sin(angle + arrowAngle),
  };

  return [arrowPoint1, endPoint, arrowPoint2];
}

/**
 * Convert shape data to Konva-compatible format
 */
export function shapeToKonvaProps(shape: ShapeData) {
  const { startPoint, endPoint, color, strokeWidth, fill } = shape;

  const baseProps = {
    stroke: color,
    strokeWidth,
    fill: fill || 'transparent',
  };

  switch (shape.tool) {
    case 'line':
      return {
        ...baseProps,
        points: [startPoint.x, startPoint.y, endPoint.x, endPoint.y],
      };

    case 'arrow':
      const arrowHead = calculateArrowHead(startPoint, endPoint, strokeWidth * 5);
      return {
        line: {
          ...baseProps,
          points: [startPoint.x, startPoint.y, endPoint.x, endPoint.y],
        },
        arrowHead: {
          ...baseProps,
          fill: color,
          points: arrowHead.flatMap((p) => [p.x, p.y]),
          closed: true,
        },
      };

    case 'rectangle':
      return {
        ...baseProps,
        x: Math.min(startPoint.x, endPoint.x),
        y: Math.min(startPoint.y, endPoint.y),
        width: Math.abs(endPoint.x - startPoint.x),
        height: Math.abs(endPoint.y - startPoint.y),
      };

    case 'circle':
      const centerX = (startPoint.x + endPoint.x) / 2;
      const centerY = (startPoint.y + endPoint.y) / 2;
      const radiusX = Math.abs(endPoint.x - startPoint.x) / 2;
      const radiusY = Math.abs(endPoint.y - startPoint.y) / 2;

      return {
        ...baseProps,
        x: centerX,
        y: centerY,
        radiusX,
        radiusY,
      };

    default:
      return baseProps;
  }
}

/**
 * Check if a point is inside a shape
 */
export function isPointInShape(point: Point, shape: ShapeData, tolerance: number = 10): boolean {
  const { startPoint, endPoint } = shape;

  switch (shape.tool) {
    case 'line':
    case 'arrow':
      // Distance from point to line segment
      const lineLength = Math.sqrt(
        Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
      );
      const t = Math.max(
        0,
        Math.min(
          1,
          ((point.x - startPoint.x) * (endPoint.x - startPoint.x) +
            (point.y - startPoint.y) * (endPoint.y - startPoint.y)) /
            (lineLength * lineLength)
        )
      );
      const projection = {
        x: startPoint.x + t * (endPoint.x - startPoint.x),
        y: startPoint.y + t * (endPoint.y - startPoint.y),
      };
      const distance = Math.sqrt(
        Math.pow(point.x - projection.x, 2) + Math.pow(point.y - projection.y, 2)
      );
      return distance <= tolerance;

    case 'rectangle':
      const rectMinX = Math.min(startPoint.x, endPoint.x) - tolerance;
      const rectMaxX = Math.max(startPoint.x, endPoint.x) + tolerance;
      const rectMinY = Math.min(startPoint.y, endPoint.y) - tolerance;
      const rectMaxY = Math.max(startPoint.y, endPoint.y) + tolerance;
      return (
        point.x >= rectMinX && point.x <= rectMaxX && point.y >= rectMinY && point.y <= rectMaxY
      );

    case 'circle':
      const centerX = (startPoint.x + endPoint.x) / 2;
      const centerY = (startPoint.y + endPoint.y) / 2;
      const radiusX = Math.abs(endPoint.x - startPoint.x) / 2 + tolerance;
      const radiusY = Math.abs(endPoint.y - startPoint.y) / 2 + tolerance;
      const normalizedX = (point.x - centerX) / radiusX;
      const normalizedY = (point.y - centerY) / radiusY;
      return normalizedX * normalizedX + normalizedY * normalizedY <= 1;

    default:
      return false;
  }
}

/**
 * Get bounding box for a shape
 */
export function getShapeBounds(shape: ShapeData): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  const { startPoint, endPoint } = shape;

  return {
    minX: Math.min(startPoint.x, endPoint.x),
    minY: Math.min(startPoint.y, endPoint.y),
    maxX: Math.max(startPoint.x, endPoint.x),
    maxY: Math.max(startPoint.y, endPoint.y),
  };
}
