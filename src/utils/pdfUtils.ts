// PDF.js 유틸리티 함수

import * as pdfjsLib from 'pdfjs-dist';

// PDF.js Worker 설정
if (typeof window !== 'undefined') {
  // 개발 환경에서는 node_modules에서 직접 로드
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

// CORS 설정을 위한 기본 옵션
const DEFAULT_PDF_OPTIONS = {
  isEvalSupported: false,
  useSystemFonts: true,
};

/**
 * ArrayBuffer에서 PDF 문서 로드
 */
export async function loadPdfFromArrayBuffer(
  arrayBuffer: ArrayBuffer
): Promise<pdfjsLib.PDFDocumentProxy> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      ...DEFAULT_PDF_OPTIONS,
    });

    const pdf = await loadingTask.promise;
    return pdf;
  } catch (error) {
    console.error('PDF 로드 실패:', error);
    console.error('Error details:', error);
    throw new Error(`PDF 파일을 불러올 수 없습니다: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * PDF 페이지를 Canvas에 렌더링
 */
export async function renderPageToCanvas(
  page: pdfjsLib.PDFPageProxy,
  canvas: HTMLCanvasElement,
  scale: number = 1
): Promise<void> {
  // 고해상도 디스플레이 지원 (Retina 등)
  const pixelRatio = window.devicePixelRatio || 1;
  const outputScale = pixelRatio * scale;

  const viewport = page.getViewport({ scale: outputScale });
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas context를 가져올 수 없습니다.');
  }

  // Canvas 실제 크기 설정 (고해상도)
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  // CSS 표시 크기 설정 (논리적 크기)
  canvas.style.width = `${viewport.width / pixelRatio}px`;
  canvas.style.height = `${viewport.height / pixelRatio}px`;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  };

  await page.render(renderContext).promise;
}

/**
 * PDF 메타데이터 추출
 */
export async function extractPdfMetadata(
  pdf: pdfjsLib.PDFDocumentProxy
): Promise<{
  totalPages: number;
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}> {
  const metadata = await pdf.getMetadata();
  const info = metadata.info as any;

  return {
    totalPages: pdf.numPages,
    title: info.Title || undefined,
    author: info.Author || undefined,
    subject: info.Subject || undefined,
    keywords: info.Keywords || undefined,
    creator: info.Creator || undefined,
    producer: info.Producer || undefined,
    creationDate: info.CreationDate ? parsePdfDate(info.CreationDate) : undefined,
    modificationDate: info.ModDate ? parsePdfDate(info.ModDate) : undefined,
  };
}

/**
 * PDF 날짜 형식 파싱
 */
function parsePdfDate(dateString: string): Date | undefined {
  // PDF 날짜 형식: D:YYYYMMDDHHmmSSOHH'mm'
  const match = dateString.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);

  if (!match) return undefined;

  const [, year, month, day, hour, minute, second] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(minute),
    parseInt(second)
  );
}

/**
 * 썸네일 생성 (고해상도)
 */
export async function generateThumbnail(
  page: pdfjsLib.PDFPageProxy,
  maxWidth: number = 200
): Promise<string> {
  const viewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / viewport.width;

  // 고해상도를 위해 devicePixelRatio 적용
  const pixelRatio = window.devicePixelRatio || 2;
  const scaledViewport = page.getViewport({ scale: scale * pixelRatio });

  const canvas = document.createElement('canvas');
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  // CSS 크기는 논리적 크기로 설정
  canvas.style.width = `${scaledViewport.width / pixelRatio}px`;
  canvas.style.height = `${scaledViewport.height / pixelRatio}px`;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context를 가져올 수 없습니다.');
  }

  await page.render({
    canvasContext: context,
    viewport: scaledViewport,
    canvas: canvas,
  }).promise;

  // JPEG 품질을 0.9로 향상
  return canvas.toDataURL('image/jpeg', 0.9);
}
