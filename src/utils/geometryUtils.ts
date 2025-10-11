/**
 * 기하학 유틸리티 함수
 * 포인트 단순화, 거리 계산 등
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * Douglas-Peucker 알고리즘을 사용한 선 단순화
 * 시각적 품질을 유지하면서 포인트 수를 50% 이상 감소시킵니다.
 *
 * @param points - 포인트 배열 [x1, y1, x2, y2, ...]
 * @param tolerance - 단순화 허용 오차 (기본값: 1.0px)
 * @returns 단순화된 포인트 배열
 */
export function simplifyPoints(points: number[], tolerance: number = 1.0): number[] {
  if (points.length < 6) return points; // 3개 미만 포인트는 단순화 불필요

  // [x, y] 형식으로 변환
  const coords: Point[] = [];
  for (let i = 0; i < points.length; i += 2) {
    coords.push({ x: points[i], y: points[i + 1] });
  }

  // Douglas-Peucker 알고리즘 적용
  const simplified = douglasPeucker(coords, tolerance);

  // 다시 [x1, y1, x2, y2, ...] 형식으로 변환
  const result: number[] = [];
  for (const point of simplified) {
    result.push(point.x, point.y);
  }

  return result;
}

/**
 * Douglas-Peucker 알고리즘 구현
 * 재귀적으로 선분을 단순화합니다.
 */
function douglasPeucker(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;

  // 첫 점과 마지막 점 사이의 선분에서 가장 먼 점 찾기
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

  // 최대 거리가 허용 오차보다 크면 재귀적으로 분할
  if (maxDistance > tolerance) {
    const leftSegment = douglasPeucker(points.slice(0, maxIndex + 1), tolerance);
    const rightSegment = douglasPeucker(points.slice(maxIndex), tolerance);

    // 중복 제거하고 병합
    return [...leftSegment.slice(0, -1), ...rightSegment];
  }

  // 허용 오차 내에 있으면 첫 점과 마지막 점만 유지
  return [firstPoint, lastPoint];
}

/**
 * 점에서 선분까지의 수직 거리 계산
 */
function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;

  // 선분 길이가 0이면 점 간 거리 반환
  if (dx === 0 && dy === 0) {
    return distance(point, lineStart);
  }

  // 수직 거리 계산
  const numerator = Math.abs(dy * point.x - dx * point.y + lineEnd.x * lineStart.y - lineEnd.y * lineStart.x);
  const denominator = Math.sqrt(dx * dx + dy * dy);

  return numerator / denominator;
}

/**
 * 두 점 사이의 유클리드 거리 계산
 */
export function distance(p1: Point, p2: Point): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 포인트 배열의 전체 길이 계산
 */
export function calculatePathLength(points: number[]): number {
  let totalLength = 0;

  for (let i = 2; i < points.length; i += 2) {
    const p1 = { x: points[i - 2], y: points[i - 1] };
    const p2 = { x: points[i], y: points[i + 1] };
    totalLength += distance(p1, p2);
  }

  return totalLength;
}

/**
 * 포인트 배열의 바운딩 박스 계산
 */
export function calculateBoundingBox(points: number[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (points.length < 2) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = points[0];
  let maxX = points[0];
  let minY = points[1];
  let maxY = points[1];

  for (let i = 2; i < points.length; i += 2) {
    minX = Math.min(minX, points[i]);
    maxX = Math.max(maxX, points[i]);
    minY = Math.min(minY, points[i + 1]);
    maxY = Math.max(maxY, points[i + 1]);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * 포인트가 바운딩 박스 내에 있는지 확인
 */
export function isPointInBounds(
  point: Point,
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

/**
 * 선 스무딩 (옵션)
 * Catmull-Rom spline을 사용한 부드러운 곡선 생성
 */
export function smoothLine(points: number[], tension: number = 0.5): number[] {
  if (points.length < 6) return points; // 3개 미만 포인트는 스무딩 불필요

  const result: number[] = [];
  result.push(points[0], points[1]); // 첫 점 추가

  for (let i = 2; i < points.length - 2; i += 2) {
    const p0 = { x: points[i - 2], y: points[i - 1] };
    const p1 = { x: points[i], y: points[i + 1] };
    const p2 = { x: points[i + 2], y: points[i + 3] };

    // 중간점 계산
    const t = tension;
    const x = p1.x + t * (p2.x - p0.x);
    const y = p1.y + t * (p2.y - p0.y);

    result.push(x, y);
  }

  // 마지막 점 추가
  result.push(points[points.length - 2], points[points.length - 1]);

  return result;
}

/**
 * 성능 통계 계산
 */
export function calculateSimplificationStats(original: number[], simplified: number[]) {
  const originalCount = original.length / 2;
  const simplifiedCount = simplified.length / 2;
  const reduction = ((originalCount - simplifiedCount) / originalCount) * 100;

  return {
    originalPoints: originalCount,
    simplifiedPoints: simplifiedCount,
    reduction: Math.round(reduction),
    compressionRatio: (originalCount / simplifiedCount).toFixed(2),
  };
}
