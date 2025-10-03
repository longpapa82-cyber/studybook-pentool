// PDF 관리 관련 타입 정의

export interface PdfUploadData {
  name: string;
  file: File;
}

export interface PdfListItem {
  id: string;
  name: string;
  totalPages: number;
  thumbnail?: string;
  createdAt: Date;
  fileSize: number;
}

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}
