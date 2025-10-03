// PDF.js 유틸리티 함수

import * as pdfjsLib from 'pdfjs-dist';

// PDF.js Worker 설정 - Vercel 배포 환경에서도 작동하도록 CDN 사용
const WORKER_SRC = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs`;

// Worker 초기화
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
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
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas context를 가져올 수 없습니다.');
  }

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
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
 * 썸네일 생성
 */
export async function generateThumbnail(
  page: pdfjsLib.PDFPageProxy,
  maxWidth: number = 200
): Promise<string> {
  const viewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / viewport.width;
  const scaledViewport = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = scaledViewport.width;
  canvas.height = scaledViewport.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas context를 가져올 수 없습니다.');
  }

  await page.render({
    canvasContext: context,
    viewport: scaledViewport,
  }).promise;

  return canvas.toDataURL('image/jpeg', 0.7);
}
