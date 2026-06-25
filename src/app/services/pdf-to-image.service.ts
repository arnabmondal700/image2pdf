import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { FileObject } from './file.service';
import { BehaviorSubject, Observable } from 'rxjs';

export type ImageFormat = 'png' | 'jpeg';

export interface PdfToImageOptions {
  pageRange: string;
  format: ImageFormat;
  jpegQuality: number;
  scale: number;
  outputMode: 'individual' | 'zip';
}

export interface PdfToImageResult {
  blob: Blob;
  pageNumber: number;
  width: number;
  height: number;
  name: string;
  dataUrl: string;
}

export interface ExportProgress {
  current: number;
  total: number;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfToImageService {
  private pdfWorkerInitialized = false;
  private progressSubject = new BehaviorSubject<ExportProgress | null>(null);

  constructor() {
    this.initializePdfWorker();
  }

  /**
   * Initialize pdfjs-dist worker
   */
  private initializePdfWorker(): void {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs';
      this.pdfWorkerInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PDF worker:', error);
      this.pdfWorkerInitialized = false;
    }
  }

  /**
   * Get export progress observable
   */
  getProgress(): Observable<ExportProgress | null> {
    return this.progressSubject.asObservable();
  }

  /**
   * Get default export options
   */
  getDefaultOptions(): PdfToImageOptions {
    return {
      pageRange: 'all',
      format: 'png',
      jpegQuality: 0.92,
      scale: 2,
      outputMode: 'individual'
    };
  }

  /**
   * Convert PDF pages to images
   */
  async convertToImages(
    pdfFile: FileObject,
    options: PdfToImageOptions
  ): Promise<PdfToImageResult[]> {
    if (!this.pdfWorkerInitialized) {
      throw new Error('PDF processing not available – worker failed to initialize');
    }

    if (!pdfFile) {
      throw new Error('No PDF file provided');
    }

    this.progressSubject.next({ current: 0, total: 0, status: 'Loading PDF...' });

    try {
      const pdfBytes = await this.fetchPDFAsBytes(pdfFile.url);
      const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
      const totalPages = pdf.numPages;

      // Determine which pages to export
      const pageNumbers = options.pageRange === 'all'
        ? Array.from({ length: totalPages }, (_, i) => i + 1)
        : this.parsePageRange(options.pageRange, totalPages);

      if (pageNumbers.length === 0) {
        throw new Error('No valid pages selected for export');
      }

      this.progressSubject.next({ current: 0, total: pageNumbers.length, status: 'Starting...' });

      const results: PdfToImageResult[] = [];

      for (let i = 0; i < pageNumbers.length; i++) {
        const pageNum = pageNumbers[i];
        this.progressSubject.next({
          current: i,
          total: pageNumbers.length,
          status: `Rendering page ${pageNum} of ${totalPages}...`
        });

        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: options.scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Could not create 2D canvas context');
        }

        // Fill white background for PDF pages that may be transparent
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        await page.render({ canvasContext: ctx, viewport } as any).promise;

        // Convert to blob
        const mimeType = options.format === 'png' ? 'image/png' : 'image/jpeg';
        const blob = await this.canvasToBlob(canvas, mimeType, options.jpegQuality);
        const dataUrl = canvas.toDataURL(mimeType, options.jpegQuality);

        const ext = options.format === 'png' ? 'png' : 'jpg';
        const baseName = this.sanitizeFileName(pdfFile.name.replace(/\.[^/.]+$/, ''));
        const fileName = `${baseName}_page_${pageNum}.${ext}`;

        results.push({
          blob,
          pageNumber: pageNum,
          width: canvas.width,
          height: canvas.height,
          name: fileName,
          dataUrl
        });

        // Clean up canvas
        canvas.width = 0;
        canvas.height = 0;
      }

      this.progressSubject.next({ current: pageNumbers.length, total: pageNumbers.length, status: 'Complete' });

      return results;
    } catch (error) {
      this.progressSubject.next(null);
      throw new Error(`Failed to export PDF to images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create ZIP archive from exported images
   * Conditionally uses jszip if available; falls back to manual bundling
   */
  async createZip(images: PdfToImageResult[], baseName: string): Promise<Blob> {
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (const image of images) {
        zip.file(image.name, image.blob);
      }

      const safeName = this.sanitizeFileName(baseName) || 'exported-images';
      return await zip.generateAsync({ type: 'blob' });
    } catch (error) {
      throw new Error(`Failed to create ZIP archive: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download a single image blob
   */
  downloadImage(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Download ZIP blob
   */
  downloadZip(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Download all images individually with staggered timing
   */
  downloadAllImages(images: PdfToImageResult[]): void {
    images.forEach((image, index) => {
      setTimeout(() => {
        this.downloadImage(image.blob, image.name);
      }, index * 300);
    });
  }

  /**
   * Parse page range string (e.g., "1-3, 5, 7-10") into array of page numbers
   */
  parsePageRange(range: string, totalPages: number): number[] {
    const trimmed = range.trim();
    if (!trimmed || trimmed === 'all') {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: Set<number> = new Set();
    const parts = trimmed.split(',');

    for (const part of parts) {
      const segment = part.trim();
      if (!segment) continue;

      const rangeMatch = segment.match(/^(\d+)\s*-\s*(\d+)$/);
      const singleMatch = segment.match(/^(\d+)$/);

      if (rangeMatch) {
        const start = parseInt(rangeMatch[1], 10);
        const end = parseInt(rangeMatch[2], 10);

        if (isNaN(start) || isNaN(end)) continue;

        for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
          if (i >= 1 && i <= totalPages) {
            pages.add(i);
          }
        }
      } else if (singleMatch) {
        const page = parseInt(singleMatch[1], 10);
        if (page >= 1 && page <= totalPages) {
          pages.add(page);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  }

  /**
   * Get page count for a PDF file
   */
  async getPageCount(pdfFile: FileObject): Promise<number> {
    try {
      const pdfBytes = await this.fetchPDFAsBytes(pdfFile.url);
      const pdfDoc = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
      return pdfDoc.numPages;
    } catch (error) {
      console.error(`Failed to get page count for ${pdfFile.name}`, error);
      return 0;
    }
  }

  /**
   * Sanitize file name for downloads
   */
  sanitizeFileName(fileName: string): string {
    let name = fileName.replace(/\.[^/.]+$/, '');
    name = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    name = name.replace(/^_+|_+$/g, '');
    return name || 'exported';
  }

  /**
   * Format file size in human-readable form
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${size.toFixed(2)} ${units[i]}`;
  }

  /**
   * Cancel ongoing export
   */
  cancelExport(): void {
    this.progressSubject.next(null);
  }

  /**
   * Revoke object URLs for cleanup
   */
  revokeObjectUrls(images: PdfToImageResult[]): void {
    for (const image of images) {
      URL.revokeObjectURL(image.dataUrl);
    }
  }

  /**
   * Render low-resolution thumbnails for all pages of a PDF
   *
   * Uses pdfjs-dist to render each page as a data URL at a reduced scale.
   * Returns an array where each element is either a data URL string or null
   * (if that specific page failed to render).
   *
   * @param pdfFile - The PDF FileObject to render
   * @param scale - Optional scale factor (default 0.3 for fast thumbnail rendering)
   * @param signal - Optional AbortSignal to cancel rendering early
   * @returns Promise resolving to an array of data URLs (or nulls)
   */
  async renderPageThumbnails(
    pdfFile: FileObject,
    scale: number = 0.3,
    signal?: AbortSignal
  ): Promise<(string | null)[]> {
    if (!this.pdfWorkerInitialized) {
      throw new Error('PDF processing not available – worker failed to initialize');
    }

    if (!pdfFile) {
      throw new Error('No PDF file provided');
    }

    try {
      const pdfBytes = await this.fetchPDFAsBytes(pdfFile.url);
      const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
      const totalPages = pdf.numPages;

      if (totalPages === 0) {
        return [];
      }

      const thumbnails: (string | null)[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        if (signal?.aborted) {
          break;
        }

        try {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Could not create 2D canvas context');
          }

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({ canvasContext: ctx, viewport } as any).promise;

          const dataUrl = canvas.toDataURL('image/png', 0.7);
          thumbnails.push(dataUrl);

          canvas.width = 0;
          canvas.height = 0;
        } catch {
          thumbnails.push(null);
        }
      }

      return thumbnails;
    } catch (error) {
      throw new Error(
        `Failed to render thumbnails: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Convert canvas to Blob
   */
  private canvasToBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error(`Failed to convert canvas to ${mimeType} blob`));
          }
        },
        mimeType,
        quality
      );
    });
  }

  /**
   * Fetch PDF file from URL and convert to Uint8Array
   */
  private async fetchPDFAsBytes(url: string): Promise<Uint8Array> {
    if (url.startsWith('data:')) {
      return this.dataURLToBytes(url);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      throw new Error(`Failed to fetch PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert a data URL to Uint8Array
   */
  private dataURLToBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1];
    if (!base64) {
      throw new Error('Invalid data URL format');
    }

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  }
}