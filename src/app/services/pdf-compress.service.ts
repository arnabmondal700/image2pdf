import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { FileObject } from './file.service';

export type CompressionLevel = 'low' | 'medium' | 'high';

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class PDFCompressService {
  private pdfWorkerInitialized = false;

  constructor() {
    this.initializePdfWorker();
  }

  /**
   * Initialize pdfjs-dist worker for canvas rendering (MEDIUM/HIGH compression)
   */
  private initializePdfWorker(): void {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      this.pdfWorkerInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PDF worker:', error);
      this.pdfWorkerInitialized = false;
    }
  }

  /**
   * Compress a PDF file using the specified compression level.
   *
   * LOW    – re-save with pdf-lib (strips metadata, normalizes structure)
   * MEDIUM – re-render each page to canvas at 0.65 JPEG quality
   * HIGH   – re-render each page to canvas at 0.40 JPEG quality
   */
  async compress(
    pdfFile: FileObject,
    level: CompressionLevel,
    _fileName: string = 'compressed-document'
  ): Promise<CompressionResult> {
    if (!pdfFile) {
      throw new Error('No PDF file provided');
    }

    const originalSize = pdfFile.size;

    switch (level) {
      case 'low':
        return this.compressLow(pdfFile, originalSize);
      case 'medium':
        return this.compressMedium(pdfFile, originalSize, 0.65);
      case 'high':
        return this.compressHigh(pdfFile, originalSize, 0.40);
      default:
        throw new Error(`Unknown compression level: ${level}`);
    }
  }

  /**
   * LOW compression: re-save with pdf-lib
   * Strips metadata, cleans up objects, and normalizes the PDF structure.
   */
  private async compressLow(
    pdfFile: FileObject,
    originalSize: number
  ): Promise<CompressionResult> {
    const pdfBytes = await this.fetchPDFAsBytes(pdfFile.url);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    // Remove metadata to reduce size
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');

    const compressedBytes = await pdfDoc.save();
    const blob = new Blob([new Uint8Array(compressedBytes)], { type: 'application/pdf' });

    return {
      blob,
      originalSize,
      compressedSize: blob.size
    };
  }

  /**
   * MEDIUM compression: re-render pages to canvas at given JPEG quality
   */
  private async compressMedium(
    pdfFile: FileObject,
    originalSize: number,
    jpegQuality: number
  ): Promise<CompressionResult> {
    return this.compressByRendering(pdfFile, originalSize, jpegQuality);
  }

  /**
   * HIGH compression: re-render pages to canvas at given JPEG quality
   */
  private async compressHigh(
    pdfFile: FileObject,
    originalSize: number,
    jpegQuality: number
  ): Promise<CompressionResult> {
    return this.compressByRendering(pdfFile, originalSize, jpegQuality);
  }

  /**
   * Core rendering-based compression: uses pdfjs-dist to render each page
   * to a canvas, converts to JPEG, then builds a new PDF with pdf-lib.
   */
  private async compressByRendering(
    pdfFile: FileObject,
    originalSize: number,
    jpegQuality: number
  ): Promise<CompressionResult> {
    if (!this.pdfWorkerInitialized) {
      throw new Error('PDF processing not available – worker failed to initialize');
    }

    const pdfBytes = await this.fetchPDFAsBytes(pdfFile.url);
    const pdf = await pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const newPdf = await PDFDocument.create();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 });

      // Render page to offscreen canvas
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not create 2D canvas context');
      }

      await page.render({ canvasContext: ctx, viewport } as any).promise;

      // Convert canvas to JPEG blob
      const jpegBlob = await this.canvasToJpegBlob(canvas, jpegQuality);

      // Convert blob to Uint8Array
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());

      // Embed JPEG image into new PDF
      const embeddedImage = await newPdf.embedJpg(jpegBytes);

      // Add page with same dimensions as the rendered viewport
      const pdfPage = newPdf.addPage([viewport.width, viewport.height]);
      pdfPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height
      });

      // Clean up canvas
      canvas.width = 0;
      canvas.height = 0;
    }

    const compressedBytes = await newPdf.save();
    const blob = new Blob([new Uint8Array(compressedBytes)], { type: 'application/pdf' });

    return {
      blob,
      originalSize,
      compressedSize: blob.size
    };
  }

  /**
   * Convert canvas to JPEG Blob with specified quality
   */
  private canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to convert canvas to JPEG blob'));
          }
        },
        'image/jpeg',
        quality
      );
    });
  }

  /**
   * Get page count for a PDF file
   */
  async getPageCount(pdfFile: FileObject): Promise<number> {
    try {
      const pdfBytes = await this.fetchPDFAsBytes(pdfFile.url);
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      return pdfDoc.getPageCount();
    } catch (error) {
      console.error(`Failed to get page count for ${pdfFile.name}`, error);
      return 0;
    }
  }

  /**
   * Download a PDF blob as a file
   */
  downloadPDF(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Sanitize file name for downloads
   */
  sanitizeFileName(fileName: string): string {
    let name = fileName.replace(/\.[^/.]+$/, '');
    name = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    name = name.replace(/^_+|_+$/g, '');
    return name || 'compressed';
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
   * Calculate compression percentage
   */
  getCompressionPercent(originalSize: number, compressedSize: number): number {
    if (originalSize === 0) return 0;
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  }

  /**
   * Fetch PDF file from URL and convert to Uint8Array (bytes)
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