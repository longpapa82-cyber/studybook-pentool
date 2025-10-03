import { useEffect, useRef } from 'react';
import { useEbookStore } from '@/stores/ebookStore';
import type { PDFPageProxy } from 'pdfjs-dist';
import * as pdfjsLib from 'pdfjs-dist';

interface TextLayerProps {
  page: PDFPageProxy;
  scale: number;
}

export function TextLayer({ page, scale }: TextLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderTextLayer = async () => {
      const viewport = page.getViewport({ scale });
      const textContent = await page.getTextContent();

      // 기존 텍스트 레이어 제거
      containerRef.current!.innerHTML = '';

      // TextLayer 렌더링
      const textLayer = pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: containerRef.current!,
        viewport: viewport,
        textDivs: [],
      });

      await textLayer.promise;
    };

    renderTextLayer();
  }, [page, scale]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 text-layer"
      style={{
        pointerEvents: 'auto',
      }}
    />
  );
}
