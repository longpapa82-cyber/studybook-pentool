# 펜툴 기능 개선 설계 문서

## 📋 문서 개요
- **작성일**: 2025-10-11
- **버전**: 1.0
- **목적**: StudyBook 펜툴 기능의 체계적 개선을 위한 상세 설계
- **범위**: UX 개선, 성능 최적화, 새로운 기능 추가

---

## 🔍 현재 시스템 분석

### 1. 기존 아키텍처
```
┌─────────────────────────────────────┐
│       EbookViewer (Main)            │
│  ┌───────────────────────────────┐  │
│  │   PDF Rendering Layer         │  │
│  │   (Canvas - pdfjs-dist)       │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   Drawing Layer               │  │
│  │   (Konva.js - react-konva)    │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │   PenToolLayer (UI Controls)  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
         ↕
┌─────────────────────────────────────┐
│   State Management (Zustand)        │
│  - pentoolStore (Drawing State)     │
│  - ebookStore (PDF State)           │
└─────────────────────────────────────┘
         ↕
┌─────────────────────────────────────┐
│   Storage (IndexedDB)               │
│  - storageService                   │
└─────────────────────────────────────┘
```

### 2. 현재 구현된 기능

#### ✅ 기본 펜 도구
- **펜(Pen)**: 자유 곡선 그리기
- **형광펜(Highlighter)**: 반투명 강조 표시
- **지우개(Eraser)**: 주석 삭제
- **선택(None)**: 주석 선택 및 이동

#### ✅ 도형 도구
- **직선(Line)**: 직선 그리기
- **화살표(Arrow)**: 화살표 그리기
- **사각형(Rectangle)**: 사각형 그리기
- **원(Circle)**: 원 그리기

#### ✅ 스타일 설정
- **색상**: 12가지 프리셋 색상
- **굵기**: 4단계 (1, 2, 4, 6px)

#### ✅ 편집 기능
- **Undo/Redo**: 히스토리 관리
- **선택 및 이동**: 주석 드래그
- **복사/붙여넣기**: 주석 복제
- **다중 선택**: 여러 주석 동시 선택

#### ✅ 저장 기능
- **자동 저장**: IndexedDB 활용
- **페이지별 관리**: 페이지당 주석 분리 저장

---

## 🎯 개선 목표

### 주요 목표
1. **UX 개선**: 직관적이고 효율적인 도구 사용 경험
2. **성능 최적화**: 대용량 주석 처리 성능 향상
3. **기능 확장**: 실용적인 새 기능 추가
4. **접근성 향상**: 키보드 단축키 및 모바일 지원

### 성능 목표
- 드로잉 지연 시간: < 16ms (60fps 유지)
- 주석 로드 시간: < 100ms (100개 주석 기준)
- 메모리 사용: < 50MB 추가 메모리
- 스토리지 효율: 주석당 < 1KB

---

## 📐 상세 설계

## Phase 1: UX 개선 (우선순위: 높음)

### 1.1 도구 팔레트 재설계

#### 문제점
- 현재: 한 줄 형태로 모든 도구가 나열되어 공간 차지
- 너무 많은 버튼으로 인한 인지 부하

#### 해결 방안
```tsx
// 컴포넌트 구조
interface ToolPaletteDesign {
  layout: 'floating' | 'sidebar' | 'bottom-bar';
  collapsible: boolean;
  quickAccess: PenTool[];
  categories: {
    drawing: PenTool[];
    shapes: PenTool[];
    text: PenTool[];
    editing: PenTool[];
  };
}

// 구현 예시
<ToolPalette>
  {/* 주요 도구 - 항상 표시 */}
  <QuickTools>
    <Tool type="pen" />
    <Tool type="highlighter" />
    <Tool type="eraser" />
    <Tool type="none" />
  </QuickTools>

  {/* 확장 도구 - 접을 수 있음 */}
  <ExpandableTools collapsed={isCollapsed}>
    <ToolGroup label="도형">
      <Tool type="line" />
      <Tool type="arrow" />
      <Tool type="rectangle" />
      <Tool type="circle" />
    </ToolGroup>
    <ToolGroup label="텍스트">
      <Tool type="text" />
    </ToolGroup>
  </ExpandableTools>
</ToolPalette>
```

#### 기대 효과
- 화면 공간 절약 (40% 감소)
- 도구 찾기 용이성 증가
- 사용 빈도에 따른 최적 배치

### 1.2 컨텍스트 메뉴 추가

#### 구현 내용
```tsx
interface ContextMenuActions {
  // 주석 관련
  copy: (annotationId: string) => void;
  paste: (position: Point) => void;
  delete: (annotationId: string) => void;
  duplicate: (annotationId: string) => void;

  // 스타일 관련
  changeColor: (annotationId: string, color: string) => void;
  changeStrokeWidth: (annotationId: string, width: number) => void;

  // 레이어 관련
  bringToFront: (annotationId: string) => void;
  sendToBack: (annotationId: string) => void;

  // 그룹 관련
  group: (annotationIds: string[]) => void;
  ungroup: (groupId: string) => void;
}
```

#### 트리거
- 주석 우클릭
- 주석 길게 누르기 (모바일)
- 선택된 주석에서 메뉴 버튼

### 1.3 키보드 단축키 시스템

#### 단축키 맵핑
```typescript
const KEYBOARD_SHORTCUTS = {
  // 도구 전환
  'p': 'pen',
  'h': 'highlighter',
  'e': 'eraser',
  'v': 'none', // selection
  'l': 'line',
  'r': 'rectangle',
  'c': 'circle',
  't': 'text',

  // 편집
  'ctrl+z': 'undo',
  'ctrl+shift+z': 'redo',
  'ctrl+c': 'copy',
  'ctrl+v': 'paste',
  'delete': 'delete',
  'backspace': 'delete',

  // 선택
  'ctrl+a': 'selectAll',
  'escape': 'clearSelection',

  // 레이어
  'ctrl+]': 'bringForward',
  'ctrl+[': 'sendBackward',
  'ctrl+shift+]': 'bringToFront',
  'ctrl+shift+[': 'sendToBack',

  // 그룹
  'ctrl+g': 'group',
  'ctrl+shift+g': 'ungroup',

  // 줌
  'ctrl++': 'zoomIn',
  'ctrl+-': 'zoomOut',
  'ctrl+0': 'resetZoom',
};
```

#### 구현
```tsx
// hooks/useKeyboardShortcuts.ts
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = getShortcutKey(e);
      const action = KEYBOARD_SHORTCUTS[key];

      if (action) {
        e.preventDefault();
        executeAction(action);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
```

---

## Phase 2: 성능 최적화 (우선순위: 높음)

### 2.1 가상화된 주석 렌더링

#### 문제점
- 모든 주석을 항상 렌더링하여 성능 저하
- 페이지당 100개 이상 주석 시 렉 발생

#### 해결 방안
```tsx
// Virtual Rendering with Viewport Culling
interface VirtualAnnotationLayer {
  // 뷰포트 내 주석만 렌더링
  visibleAnnotations: Annotation[];

  // 뷰포트 계산
  viewport: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  // 최적화된 렌더링
  renderStrategy: 'viewport' | 'lazy' | 'progressive';
}

// 구현
function useVisibleAnnotations(
  annotations: Annotation[],
  viewport: Viewport
): Annotation[] {
  return useMemo(() => {
    return annotations.filter(annotation => {
      return isAnnotationInViewport(annotation, viewport);
    });
  }, [annotations, viewport]);
}
```

#### 기대 효과
- 렌더링 성능 3-5배 향상
- 메모리 사용량 50% 감소
- 부드러운 줌/팬 동작

### 2.2 드로잉 최적화

#### Canvas 최적화
```typescript
interface DrawingOptimization {
  // 포인트 단순화 (Douglas-Peucker)
  simplifyPoints: (points: number[], tolerance: number) => number[];

  // 버퍼링된 렌더링
  useOffscreenCanvas: boolean;

  // RAF 기반 드로잉
  useRequestAnimationFrame: boolean;

  // 배치 렌더링
  batchSize: number;
}

// 포인트 단순화
function simplifyDrawingPoints(points: number[]): number[] {
  // 1% 이내 오차로 포인트 수 50% 감소
  return douglasPeucker(points, 1.0);
}
```

#### WebWorker 활용
```typescript
// workers/annotationProcessor.worker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, data } = e.data;

  switch (type) {
    case 'simplify':
      const simplified = simplifyPoints(data.points, data.tolerance);
      self.postMessage({ type: 'simplified', data: simplified });
      break;

    case 'serialize':
      const serialized = serializeAnnotations(data.annotations);
      self.postMessage({ type: 'serialized', data: serialized });
      break;
  }
};
```

### 2.3 메모리 관리

#### 주석 페이징
```typescript
interface AnnotationPaging {
  // 페이지별 lazy loading
  loadedPages: Set<number>;

  // LRU 캐시
  maxCachedPages: number;

  // 메모리 임계값
  memoryThreshold: number;

  // 자동 언로드
  unloadPageAnnotations: (pageNumber: number) => void;
}

// 구현
class AnnotationCache {
  private cache = new Map<number, Annotation[]>();
  private accessOrder: number[] = [];

  get(pageNumber: number): Annotation[] | undefined {
    this.updateAccessOrder(pageNumber);
    return this.cache.get(pageNumber);
  }

  set(pageNumber: number, annotations: Annotation[]): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    this.cache.set(pageNumber, annotations);
    this.updateAccessOrder(pageNumber);
  }

  private evictLRU(): void {
    const lruPage = this.accessOrder.shift();
    if (lruPage !== undefined) {
      this.cache.delete(lruPage);
    }
  }
}
```

---

## Phase 3: 새로운 기능 추가 (우선순위: 중간)

### 3.1 텍스트 주석 도구

#### 기능 명세
```typescript
interface TextAnnotation extends Annotation {
  type: 'text';
  data: {
    text: string;
    position: Point;
    fontSize: number;
    fontFamily: string;
    color: string;
    alignment: 'left' | 'center' | 'right';
    backgroundColor?: string;
    padding?: number;
  };
}

// 컴포넌트
interface TextToolProps {
  onTextComplete: (text: string, position: Point) => void;
  defaultFontSize: number;
  availableFonts: string[];
}
```

#### UI 플로우
1. 텍스트 도구 선택
2. 캔버스 클릭 → 텍스트 입력 필드 표시
3. 텍스트 입력 및 스타일 설정
4. Enter 또는 외부 클릭으로 완료
5. 더블클릭으로 편집 모드

### 3.2 스티커/스탬프 기능

#### 기능 명세
```typescript
interface StickerAnnotation extends Annotation {
  type: 'sticker';
  data: {
    stickerId: string;
    position: Point;
    size: number;
    rotation: number;
  };
}

interface StickerLibrary {
  categories: {
    emoji: Sticker[];
    shapes: Sticker[];
    symbols: Sticker[];
    custom: Sticker[];
  };

  addCustomSticker: (image: File) => Promise<Sticker>;
  getSticker: (id: string) => Sticker | undefined;
}
```

#### 프리셋 스티커
- 체크마크, 별표, 느낌표 등
- 이모지 (중요, 질문, 참고 등)
- 커스텀 이미지 업로드 지원

### 3.3 레이어 관리 시스템

#### 레이어 구조
```typescript
interface AnnotationLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  annotations: Annotation[];
  zIndex: number;
}

interface LayerManager {
  layers: AnnotationLayer[];
  activeLayerId: string;

  // CRUD
  createLayer: (name: string) => AnnotationLayer;
  deleteLayer: (layerId: string) => void;
  duplicateLayer: (layerId: string) => AnnotationLayer;

  // 레이어 조작
  moveLayer: (layerId: string, direction: 'up' | 'down') => void;
  mergeLayersDown: (layerId: string) => void;

  // 레이어 속성
  setLayerVisibility: (layerId: string, visible: boolean) => void;
  setLayerLock: (layerId: string, locked: boolean) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
}
```

#### UI 컴포넌트
```tsx
<LayersPanel>
  <LayersList>
    {layers.map(layer => (
      <LayerItem
        key={layer.id}
        layer={layer}
        isActive={layer.id === activeLayerId}
        onToggleVisibility={() => toggleVisibility(layer.id)}
        onToggleLock={() => toggleLock(layer.id)}
        onRename={(name) => renameLayer(layer.id, name)}
      />
    ))}
  </LayersList>
  <LayerControls>
    <Button onClick={createNewLayer}>새 레이어</Button>
    <Button onClick={deleteActiveLayer}>삭제</Button>
    <Button onClick={mergeDown}>병합</Button>
  </LayerControls>
</LayersPanel>
```

### 3.4 주석 그룹화

#### 기능 명세
```typescript
interface AnnotationGroup {
  id: string;
  name?: string;
  annotationIds: string[];
  locked: boolean;

  // 그룹 변형
  transform: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  };
}

interface GroupManager {
  groups: Map<string, AnnotationGroup>;

  // 그룹 생성/해제
  createGroup: (annotationIds: string[]) => AnnotationGroup;
  ungroup: (groupId: string) => void;

  // 그룹 조작
  moveGroup: (groupId: string, deltaX: number, deltaY: number) => void;
  rotateGroup: (groupId: string, angle: number) => void;
  scaleGroup: (groupId: string, scale: number) => void;
}
```

### 3.5 올가미 선택 도구

#### 기능 명세
```typescript
interface LassoSelection {
  // 자유 곡선 선택
  lassoPath: Point[];

  // 선택된 주석
  selectedAnnotations: Annotation[];

  // 선택 알고리즘
  checkIntersection: (annotation: Annotation, path: Point[]) => boolean;
}

// Ray casting algorithm for point-in-polygon
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > point.y) !== (yj > point.y))
      && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }
  return inside;
}
```

---

## Phase 4: 고급 기능 (우선순위: 낮음)

### 4.1 펜 압력 감지

#### Apple Pencil / Surface Pen 지원
```typescript
interface PressureSensitiveDrawing {
  // 압력 데이터
  pressurePoints: Array<{
    x: number;
    y: number;
    pressure: number; // 0-1
  }>;

  // 동적 선 굵기
  calculateStrokeWidth: (pressure: number, baseWidth: number) => number;

  // 동적 투명도 (선택사항)
  calculateOpacity: (pressure: number) => number;
}

// Pointer Events API 활용
function handlePointerMove(e: PointerEvent) {
  const pressure = e.pressure || 0.5;
  const strokeWidth = baseStrokeWidth * (0.5 + pressure * 0.5);

  continueDrawing({
    x: e.clientX,
    y: e.clientY,
    pressure: pressure,
    width: strokeWidth,
  });
}
```

### 4.2 자동 도형 인식

#### 손그림 → 정확한 도형 변환
```typescript
interface ShapeRecognition {
  // 인식 가능한 도형
  recognizableShapes: ('line' | 'circle' | 'rectangle' | 'triangle')[];

  // 인식 알고리즘
  recognize: (points: Point[]) => {
    shape: string;
    confidence: number;
    parameters: any;
  } | null;

  // 자동 교정
  autoCorrect: boolean;
  confidenceThreshold: number;
}

// 원 인식 예시
function recognizeCircle(points: Point[]): CircleParams | null {
  const center = calculateCentroid(points);
  const radius = calculateAverageRadius(points, center);
  const deviation = calculateRadiusDeviation(points, center, radius);

  if (deviation < 0.2) {
    return { center, radius, confidence: 1 - deviation };
  }
  return null;
}
```

### 4.3 스마트 스냅

#### 가이드라인 및 정렬
```typescript
interface SmartSnapping {
  // 스냅 옵션
  snapToGrid: boolean;
  snapToGuides: boolean;
  snapToObjects: boolean;

  // 스냅 거리
  snapDistance: number; // px

  // 가이드라인
  guides: {
    horizontal: number[];
    vertical: number[];
  };

  // 정렬 보조선
  showAlignmentGuides: boolean;
}

// 스냅 계산
function calculateSnapPosition(
  position: Point,
  snapTargets: Point[],
  threshold: number
): Point {
  for (const target of snapTargets) {
    if (Math.abs(position.x - target.x) < threshold) {
      position.x = target.x;
    }
    if (Math.abs(position.y - target.y) < threshold) {
      position.y = target.y;
    }
  }
  return position;
}
```

### 4.4 주석 검색 및 필터

#### 기능 명세
```typescript
interface AnnotationSearch {
  // 검색 조건
  searchQuery: string;
  filters: {
    type?: Annotation['type'][];
    color?: string[];
    dateRange?: [Date, Date];
    author?: string[];
  };

  // 검색 결과
  results: Array<{
    annotation: Annotation;
    pageNumber: number;
    matchScore: number;
  }>;

  // 검색 실행
  search: (query: string, filters: SearchFilters) => Promise<SearchResult[]>;

  // 하이라이트
  highlightResult: (annotationId: string) => void;
  navigateToResult: (annotationId: string, pageNumber: number) => void;
}
```

---

## Phase 5: 내보내기 및 공유 (우선순위: 중간)

### 5.1 주석 포함 PDF 내보내기

#### 기능 명세
```typescript
interface PDFExporter {
  // 내보내기 옵션
  exportOptions: {
    includeAnnotations: boolean;
    flattenAnnotations: boolean; // 주석을 PDF에 병합
    exportAsImages: boolean;
    quality: 'low' | 'medium' | 'high';
  };

  // 내보내기 실행
  exportToPDF: (
    pdfDocument: PDFDocument,
    annotations: Map<number, Annotation[]>,
    options: ExportOptions
  ) => Promise<Blob>;
}

// pdf-lib 활용
async function exportAnnotatedPDF(
  originalPdf: ArrayBuffer,
  annotations: Map<number, Annotation[]>
): Promise<Blob> {
  const pdfDoc = await PDFDocument.load(originalPdf);

  for (const [pageNum, pageAnnotations] of annotations) {
    const page = pdfDoc.getPage(pageNum - 1);

    for (const annotation of pageAnnotations) {
      await drawAnnotationOnPage(page, annotation);
    }
  }

  const pdfBytes = await pdfDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}
```

### 5.2 주석 데이터 공유

#### JSON 형식 내보내기/가져오기
```typescript
interface AnnotationExport {
  version: string;
  pdfId: string;
  exportDate: string;
  annotations: Annotation[];
  metadata: {
    appVersion: string;
    author?: string;
  };
}

// 내보내기
async function exportAnnotations(
  pdfId: string,
  annotations: Map<number, Annotation[]>
): Promise<Blob> {
  const exportData: AnnotationExport = {
    version: '1.0',
    pdfId,
    exportDate: new Date().toISOString(),
    annotations: Array.from(annotations.values()).flat(),
    metadata: {
      appVersion: '1.0.0',
    },
  };

  const json = JSON.stringify(exportData, null, 2);
  return new Blob([json], { type: 'application/json' });
}

// 가져오기
async function importAnnotations(
  file: File
): Promise<Map<number, Annotation[]>> {
  const text = await file.text();
  const data: AnnotationExport = JSON.parse(text);

  // 버전 체크
  if (data.version !== '1.0') {
    throw new Error('Unsupported annotation format');
  }

  // Map으로 변환
  const annotationsMap = new Map<number, Annotation[]>();
  for (const annotation of data.annotations) {
    const pageAnnotations = annotationsMap.get(annotation.pageNumber) || [];
    annotationsMap.set(annotation.pageNumber, [...pageAnnotations, annotation]);
  }

  return annotationsMap;
}
```

---

## 🗂️ 데이터 구조 개선

### 개선된 Annotation 타입
```typescript
// 확장된 Annotation 인터페이스
interface EnhancedAnnotation {
  // 기본 정보
  id: string;
  pageNumber: number;
  type: 'drawing' | 'shape' | 'text' | 'sticker' | 'group';

  // 데이터 (타입별)
  data: DrawingData | ShapeData | TextData | StickerData | GroupData;

  // 메타데이터
  metadata: {
    createdAt: string;
    updatedAt: string;
    author?: string;
    version: number;
  };

  // 레이어 정보
  layerId?: string;
  zIndex: number;

  // 스타일
  style: {
    color: string;
    strokeWidth?: number;
    opacity: number;
    fill?: string;
    lineDash?: number[];
  };

  // 상태
  state: {
    visible: boolean;
    locked: boolean;
    selected: boolean;
  };

  // 변형
  transform?: {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
    rotation: number;
  };
}
```

### Store 구조 개선
```typescript
interface EnhancedPentoolState {
  // 현재 도구 및 설정
  activeTool: PenTool;
  toolSettings: Map<PenTool, ToolSettings>;

  // 주석 데이터
  annotations: Map<number, Annotation[]>;
  annotationIndex: Map<string, Annotation>; // 빠른 조회

  // 레이어 관리
  layers: AnnotationLayer[];
  activeLayerId: string;

  // 그룹 관리
  groups: Map<string, AnnotationGroup>;

  // 선택 상태
  selection: {
    annotationIds: Set<string>;
    groupIds: Set<string>;
    bounds?: BoundingBox;
  };

  // 히스토리 (개선)
  history: {
    past: HistoryEntry[];
    future: HistoryEntry[];
    maxSize: number;
  };

  // 클립보드
  clipboard: {
    annotations: Annotation[];
    copiedFrom: number; // 페이지 번호
  };

  // UI 상태
  ui: {
    toolPaletteCollapsed: boolean;
    layersPanelOpen: boolean;
    contextMenuPosition: Point | null;
  };

  // 성능 설정
  performance: {
    enableVirtualization: boolean;
    enableWebWorker: boolean;
    simplifyPaths: boolean;
    simplificationTolerance: number;
  };
}

// 히스토리 엔트리 개선
interface HistoryEntry {
  timestamp: number;
  action: {
    type: 'add' | 'remove' | 'update' | 'move' | 'batch';
    data: any;
  };
  // Diff 기반 저장으로 메모리 절약
  diff: {
    before: Partial<Annotation>[];
    after: Partial<Annotation>[];
  };
}
```

---

## 🎨 UI/UX 개선 상세

### 반응형 레이아웃
```tsx
// 브레이크포인트별 레이아웃
const LAYOUTS = {
  mobile: {
    toolPalette: 'bottom-bar',
    layersPanel: 'modal',
    contextMenu: 'bottom-sheet',
  },
  tablet: {
    toolPalette: 'sidebar-left',
    layersPanel: 'sidebar-right',
    contextMenu: 'popover',
  },
  desktop: {
    toolPalette: 'sidebar-left',
    layersPanel: 'sidebar-right',
    contextMenu: 'dropdown',
  },
};
```

### 다크 모드 지원
```typescript
interface ThemeColors {
  light: {
    background: '#FFFFFF';
    surface: '#F3F4F6';
    primary: '#3B82F6';
    text: '#111827';
    border: '#E5E7EB';
  };
  dark: {
    background: '#111827';
    surface: '#1F2937';
    primary: '#60A5FA';
    text: '#F9FAFB';
    border: '#374151';
  };
}
```

---

## 🧪 테스트 전략

### 유닛 테스트
```typescript
// 주요 테스트 케이스
describe('PentoolStore', () => {
  test('주석 추가 및 저장', () => {});
  test('Undo/Redo 동작', () => {});
  test('주석 선택 및 이동', () => {});
  test('레이어 관리', () => {});
  test('그룹 생성 및 해제', () => {});
});

describe('DrawingCanvas', () => {
  test('드로잉 성능 (60fps)', () => {});
  test('포인트 단순화', () => {});
  test('가상화된 렌더링', () => {});
});
```

### E2E 테스트
```typescript
// Playwright 시나리오
test('펜툴 전체 워크플로우', async ({ page }) => {
  // 1. PDF 로드
  await page.goto('/');
  await uploadPDF(page, 'test.pdf');

  // 2. 펜 도구로 그리기
  await selectTool(page, 'pen');
  await drawLine(page, [100, 100, 200, 200]);

  // 3. 주석 저장 확인
  await page.reload();
  await expect(page.locator('.annotation')).toBeVisible();

  // 4. 주석 편집
  await selectAnnotation(page, 0);
  await changeColor(page, '#FF0000');

  // 5. 내보내기
  await exportPDF(page);
});
```

---

## 📊 성능 벤치마크

### 목표 지표
| 항목 | 현재 | 목표 | 개선율 |
|------|------|------|--------|
| 드로잉 지연 | ~30ms | < 16ms | 50% ↓ |
| 주석 로드 (100개) | ~200ms | < 100ms | 50% ↓ |
| 메모리 사용 | ~80MB | < 50MB | 37% ↓ |
| 번들 크기 증가 | - | < +100KB | - |

### 측정 방법
```typescript
// Performance Monitoring
class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  measure(name: string, fn: () => void) {
    const start = performance.now();
    fn();
    const duration = performance.now() - start;

    const measurements = this.metrics.get(name) || [];
    measurements.push(duration);
    this.metrics.set(name, measurements);
  }

  getStats(name: string) {
    const measurements = this.metrics.get(name) || [];
    return {
      avg: average(measurements),
      p50: percentile(measurements, 50),
      p95: percentile(measurements, 95),
      p99: percentile(measurements, 99),
    };
  }
}
```

---

## 📅 구현 로드맵

### Sprint 1: UX 개선 (2주)
- [ ] 도구 팔레트 재설계
- [ ] 컨텍스트 메뉴 추가
- [ ] 키보드 단축키 시스템
- [ ] 테스트 작성

### Sprint 2: 성능 최적화 (2주)
- [ ] 가상화된 렌더링
- [ ] 드로잉 최적화
- [ ] 메모리 관리 개선
- [ ] 성능 벤치마크

### Sprint 3: 새 기능 - Part 1 (2주)
- [ ] 텍스트 주석 도구
- [ ] 레이어 관리 시스템
- [ ] 주석 그룹화
- [ ] 테스트 작성

### Sprint 4: 새 기능 - Part 2 (2주)
- [ ] 스티커/스탬프 기능
- [ ] 올가미 선택 도구
- [ ] 주석 검색 및 필터
- [ ] E2E 테스트

### Sprint 5: 고급 기능 (2주)
- [ ] 펜 압력 감지
- [ ] 자동 도형 인식
- [ ] 스마트 스냅
- [ ] 통합 테스트

### Sprint 6: 내보내기 및 마무리 (1주)
- [ ] PDF 내보내기
- [ ] 주석 데이터 공유
- [ ] 문서화
- [ ] 최종 테스트 및 배포

---

## 🔒 보안 고려사항

### 데이터 검증
```typescript
// 주석 데이터 검증
function validateAnnotation(annotation: unknown): annotation is Annotation {
  if (typeof annotation !== 'object' || annotation === null) {
    return false;
  }

  const a = annotation as any;

  // 필수 필드 체크
  if (!a.id || !a.pageNumber || !a.type || !a.data) {
    return false;
  }

  // 타입별 검증
  switch (a.type) {
    case 'drawing':
      return validateDrawingData(a.data);
    case 'text':
      return validateTextData(a.data);
    // ...
  }

  return false;
}
```

### XSS 방지
```typescript
// 텍스트 주석에서 HTML 태그 제거
function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

---

## 📚 참고 자료

### 기술 스택
- **PDF.js**: https://mozilla.github.io/pdf.js/
- **Konva.js**: https://konvajs.org/
- **Zustand**: https://github.com/pmndrs/zustand
- **pdf-lib**: https://pdf-lib.js.org/

### 유사 제품 분석
- **Adobe Acrobat**: 표준 PDF 주석 기능
- **GoodNotes**: 필기 최적화 및 UX
- **Notability**: 오디오 녹음 + 필기 연동
- **Xodo**: 경량 웹 PDF 편집기

### 알고리즘
- **Douglas-Peucker**: 선 단순화
- **Ray Casting**: 점-다각형 충돌 감지
- **Shape Recognition**: 도형 인식 알고리즘

---

## ✅ 검증 체크리스트

### 기능 검증
- [ ] 모든 도구가 정상 작동
- [ ] Undo/Redo 동작 확인
- [ ] 주석 저장/로드 정상
- [ ] 다중 페이지 처리 확인
- [ ] 반응형 레이아웃 테스트

### 성능 검증
- [ ] 60fps 유지 확인
- [ ] 메모리 누수 없음
- [ ] 번들 크기 목표 달성
- [ ] 로딩 시간 < 2초

### UX 검증
- [ ] 직관적인 도구 선택
- [ ] 피드백 명확
- [ ] 키보드 단축키 동작
- [ ] 모바일 터치 동작

### 접근성 검증
- [ ] ARIA 레이블 적용
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 지원
- [ ] 색상 대비 충족

---

## 📝 마무리

이 설계 문서는 StudyBook 펜툴의 체계적인 개선을 위한 청사진입니다.
단계별로 구현하여 안정적이고 사용자 친화적인 주석 시스템을 완성할 수 있습니다.

**예상 개발 기간**: 10-12주
**예상 리소스**: 개발자 1-2명
**우선순위**: Phase 1-2 (UX + 성능) → Phase 3 (새 기능) → Phase 4-5 (고급)

---

**문서 버전**: 1.0
**작성자**: Claude Code
**최종 수정**: 2025-10-11
