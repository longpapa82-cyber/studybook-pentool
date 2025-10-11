// Phase 4-1: Annotation storage and persistence utilities

import type { Annotation } from '@/types/pentool.types';

export interface AnnotationExportData {
  version: string;
  pdfFileName: string;
  exportedAt: string;
  annotations: Record<number, Annotation[]>; // pageNumber -> annotations
  metadata?: {
    totalPages?: number;
    totalAnnotations: number;
    lastModified: string;
  };
}

const STORAGE_KEY_PREFIX = 'pentool_annotations_';
const STORAGE_VERSION = '1.0.0';
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

/**
 * Generate storage key for a PDF file
 */
export function getStorageKey(pdfFileName: string): string {
  return `${STORAGE_KEY_PREFIX}${pdfFileName}`;
}

/**
 * Export annotations to JSON format
 */
export function exportAnnotations(
  annotationsMap: Map<number, Annotation[]>,
  pdfFileName: string = 'document'
): AnnotationExportData {
  const annotationsObject: Record<number, Annotation[]> = {};
  let totalAnnotations = 0;

  annotationsMap.forEach((annotations, pageNumber) => {
    annotationsObject[pageNumber] = annotations;
    totalAnnotations += annotations.length;
  });

  return {
    version: STORAGE_VERSION,
    pdfFileName,
    exportedAt: new Date().toISOString(),
    annotations: annotationsObject,
    metadata: {
      totalAnnotations,
      lastModified: new Date().toISOString(),
    },
  };
}

/**
 * Import annotations from JSON format
 */
export function importAnnotations(data: AnnotationExportData): Map<number, Annotation[]> {
  const annotationsMap = new Map<number, Annotation[]>();

  Object.entries(data.annotations).forEach(([pageNum, annotations]) => {
    const pageNumber = parseInt(pageNum, 10);
    annotationsMap.set(pageNumber, annotations);
  });

  return annotationsMap;
}

/**
 * Save annotations to localStorage
 */
export function saveToLocalStorage(
  annotationsMap: Map<number, Annotation[]>,
  pdfFileName: string = 'document'
): boolean {
  try {
    const exportData = exportAnnotations(annotationsMap, pdfFileName);
    const storageKey = getStorageKey(pdfFileName);
    localStorage.setItem(storageKey, JSON.stringify(exportData));
    return true;
  } catch (error) {
    console.error('Failed to save annotations to localStorage:', error);
    return false;
  }
}

/**
 * Load annotations from localStorage
 */
export function loadFromLocalStorage(pdfFileName: string = 'document'): Map<number, Annotation[]> | null {
  try {
    const storageKey = getStorageKey(pdfFileName);
    const data = localStorage.getItem(storageKey);

    if (!data) return null;

    const exportData: AnnotationExportData = JSON.parse(data);
    return importAnnotations(exportData);
  } catch (error) {
    console.error('Failed to load annotations from localStorage:', error);
    return null;
  }
}

/**
 * Download annotations as JSON file
 */
export function downloadAnnotationsJSON(
  annotationsMap: Map<number, Annotation[]>,
  pdfFileName: string = 'document'
): void {
  const exportData = exportAnnotations(annotationsMap, pdfFileName);
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${pdfFileName}_annotations_${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Upload and parse annotations JSON file
 */
export function uploadAnnotationsJSON(file: File): Promise<Map<number, Annotation[]>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const exportData: AnnotationExportData = JSON.parse(content);

        // Validate version compatibility
        if (!exportData.version || !exportData.annotations) {
          throw new Error('Invalid annotation file format');
        }

        const annotationsMap = importAnnotations(exportData);
        resolve(annotationsMap);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * List all saved PDF files in localStorage
 */
export function listSavedFiles(): string[] {
  const files: string[] = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_KEY_PREFIX)) {
      const fileName = key.replace(STORAGE_KEY_PREFIX, '');
      files.push(fileName);
    }
  }

  return files;
}

/**
 * Delete annotations for a specific PDF file
 */
export function deleteAnnotations(pdfFileName: string): boolean {
  try {
    const storageKey = getStorageKey(pdfFileName);
    localStorage.removeItem(storageKey);
    return true;
  } catch (error) {
    console.error('Failed to delete annotations:', error);
    return false;
  }
}

/**
 * Get annotation statistics for a PDF file
 */
export function getAnnotationStats(pdfFileName: string): {
  totalAnnotations: number;
  lastModified: string | null;
} | null {
  try {
    const storageKey = getStorageKey(pdfFileName);
    const data = localStorage.getItem(storageKey);

    if (!data) return null;

    const exportData: AnnotationExportData = JSON.parse(data);
    return {
      totalAnnotations: exportData.metadata?.totalAnnotations || 0,
      lastModified: exportData.metadata?.lastModified || null,
    };
  } catch (error) {
    console.error('Failed to get annotation stats:', error);
    return null;
  }
}

/**
 * Create auto-save hook for automatic persistence
 */
export class AutoSaveManager {
  private intervalId: number | null = null;
  private pdfFileName: string;
  private saveCallback: () => Map<number, Annotation[]>;

  constructor(pdfFileName: string, saveCallback: () => Map<number, Annotation[]>) {
    this.pdfFileName = pdfFileName;
    this.saveCallback = saveCallback;
  }

  start(interval: number = AUTO_SAVE_INTERVAL): void {
    this.stop(); // Clear any existing interval

    this.intervalId = window.setInterval(() => {
      const annotationsMap = this.saveCallback();
      saveToLocalStorage(annotationsMap, this.pdfFileName);
      console.log(`[AutoSave] Saved annotations for ${this.pdfFileName}`);
    }, interval);

    console.log(`[AutoSave] Started for ${this.pdfFileName} (interval: ${interval}ms)`);
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[AutoSave] Stopped for ${this.pdfFileName}`);
    }
  }

  saveNow(): boolean {
    const annotationsMap = this.saveCallback();
    const success = saveToLocalStorage(annotationsMap, this.pdfFileName);
    if (success) {
      console.log(`[AutoSave] Manual save completed for ${this.pdfFileName}`);
    }
    return success;
  }
}
