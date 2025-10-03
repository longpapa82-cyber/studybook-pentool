// IndexedDB 기반 PDF 저장소 서비스

import type { PdfDocument, PdfListItem } from '@/types';

const DB_NAME = 'StudyBookDB';
const DB_VERSION = 2; // Version 2 for annotations store
const STORE_NAME = 'pdfs';
const ANNOTATIONS_STORE = 'annotations';

interface DBSchema {
  pdfs: {
    key: string;
    value: PdfDocument;
  };
}

class StorageService {
  private db: IDBDatabase | null = null;

  /**
   * IndexedDB 초기화
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error('IndexedDB 열기 실패'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // pdfs 저장소 생성
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // annotations 저장소 생성
        if (!db.objectStoreNames.contains(ANNOTATIONS_STORE)) {
          const annotationStore = db.createObjectStore(ANNOTATIONS_STORE, {
            keyPath: 'id',
          });
          annotationStore.createIndex('pdfId', 'pdfId', { unique: false });
          annotationStore.createIndex('pageNumber', 'pageNumber', { unique: false });
        }
      };
    });
  }

  /**
   * DB 연결 확인 및 초기화
   */
  private async ensureConnection(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('데이터베이스 연결 실패');
    }
    return this.db;
  }

  /**
   * PDF 저장
   */
  async savePdf(name: string, file: File): Promise<string> {
    const db = await this.ensureConnection();

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();

    const id = `pdf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const pdfDoc: PdfDocument = {
      id,
      name,
      file: arrayBuffer,
      totalPages: 0, // PDF 로드 후 업데이트 필요
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(pdfDoc);

      request.onsuccess = () => {
        resolve(id);
      };

      request.onerror = () => {
        reject(new Error('PDF 저장 실패'));
      };
    });
  }

  /**
   * PDF 목록 조회
   */
  async getPdfList(): Promise<PdfListItem[]> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const docs: PdfDocument[] = request.result;

        const listItems: PdfListItem[] = docs.map((doc) => ({
          id: doc.id,
          name: doc.name,
          totalPages: doc.totalPages,
          createdAt: doc.createdAt,
          fileSize: doc.file.byteLength,
        }));

        // 최신순 정렬
        listItems.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

        resolve(listItems);
      };

      request.onerror = () => {
        reject(new Error('PDF 목록 조회 실패'));
      };
    });
  }

  /**
   * PDF ID로 조회
   */
  async getPdfById(id: string): Promise<PdfDocument | null> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        reject(new Error('PDF 조회 실패'));
      };
    });
  }

  /**
   * PDF 삭제
   */
  async deletePdf(id: string): Promise<void> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('PDF 삭제 실패'));
      };
    });
  }

  /**
   * PDF 메타데이터 업데이트
   */
  async updatePdfMetadata(
    id: string,
    updates: Partial<Omit<PdfDocument, 'id' | 'file'>>
  ): Promise<void> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const doc = getRequest.result;
        if (!doc) {
          reject(new Error('PDF를 찾을 수 없습니다'));
          return;
        }

        const updatedDoc: PdfDocument = {
          ...doc,
          ...updates,
          updatedAt: new Date(),
        };

        const putRequest = store.put(updatedDoc);

        putRequest.onsuccess = () => {
          resolve();
        };

        putRequest.onerror = () => {
          reject(new Error('PDF 업데이트 실패'));
        };
      };

      getRequest.onerror = () => {
        reject(new Error('PDF 조회 실패'));
      };
    });
  }

  /**
   * 전체 데이터 삭제 (개발용)
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('데이터 삭제 실패'));
      };
    });
  }

  // === Annotation Storage Methods ===

  /**
   * 페이지 주석 저장
   */
  async saveAnnotations(
    pdfId: string,
    pageNumber: number,
    annotations: any[]
  ): Promise<void> {
    const db = await this.ensureConnection();
    const key = `${pdfId}_page_${pageNumber}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ANNOTATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(ANNOTATIONS_STORE);

      const annotationData = {
        id: key,
        pdfId,
        pageNumber,
        annotations,
        updatedAt: new Date().toISOString(),
      };

      const request = store.put(annotationData);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('주석 저장 실패'));
      };
    });
  }

  /**
   * 페이지 주석 조회
   */
  async getAnnotations(
    pdfId: string,
    pageNumber: number
  ): Promise<any[] | null> {
    const db = await this.ensureConnection();
    const key = `${pdfId}_page_${pageNumber}`;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ANNOTATIONS_STORE], 'readonly');
      const store = transaction.objectStore(ANNOTATIONS_STORE);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result?.annotations || null);
      };

      request.onerror = () => {
        reject(new Error('주석 조회 실패'));
      };
    });
  }

  /**
   * PDF의 모든 주석 삭제
   */
  async deleteAnnotations(pdfId: string): Promise<void> {
    const db = await this.ensureConnection();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ANNOTATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(ANNOTATIONS_STORE);
      const index = store.index('pdfId');
      const request = index.openCursor(IDBKeyRange.only(pdfId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => {
        reject(new Error('주석 삭제 실패'));
      };
    });
  }
}

// 싱글톤 인스턴스
export const storageService = new StorageService();

// 초기화
storageService.init().catch(console.error);
