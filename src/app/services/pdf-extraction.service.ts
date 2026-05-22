import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { FileObject } from './file.service';

/**
 * Service for handling PDF file extraction and processing
 * Converts PDF pages to images or processes PDF metadata
 */
@Injectable({
  providedIn: 'root'
})
export class PdfExtractionService {
  private pdfWorkerLoaded = false;

  constructor() {
    this.initializePdfWorker();
  }

  /**
   * Initialize pdfjs-dist worker
   */
  private initializePdfWorker(): void {
    try {
      // Worker URL points to the public pdf.worker.min.mjs file
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      this.pdfWorkerLoaded = true;
    } catch (error) {
      console.error('Failed to initialize PDF worker:', error);
      this.pdfWorkerLoaded = false;
    }
  }

  /**
   * Check if PDF processing is available
   */
  isPdfSupported(): boolean {
    return this.pdfWorkerLoaded;
  }

  /**
   * Extract PDF pages as images (canvas rendering)
   * Useful for mixed workflows where PDF pages are treated like images
   */
  async extractPdfAsImages(
    pdfUrl: string,
    options?: { scale?: number; maxPages?: number }
  ): Promise<HTMLCanvasElement[]> {
    if (!this.isPdfSupported()) {
      throw new Error('PDF processing not available');
    }

    const scale = options?.scale || 2;
    const maxPages = options?.maxPages || Infinity;

    try {
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
      const pages: HTMLCanvasElement[] = [];

      for (let i = 1; i <= Math.min(pdf.numPages, maxPages); i++) {
        const page = await pdf.getPage(i);

        // Get page viewport
        const viewport = page.getViewport({ scale });

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Could not create canvas context');
        }

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Render page to canvas using the context
        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext as any).promise;

        pages.push(canvas);
      }

      return pages;
    } catch (error) {
      throw new Error(`Failed to extract PDF pages: ${error}`);
    }
  }

  /**
   * Convert PDF page to image data URL
   */
  async convertPdfPageToImage(
    pdfUrl: string,
    pageNumber: number = 1,
    scale: number = 2
  ): Promise<string> {
    const pages = await this.extractPdfAsImages(pdfUrl, { scale, maxPages: pageNumber });

    if (pages.length === 0) {
      throw new Error('No pages extracted from PDF');
    }

    return pages[pageNumber - 1].toDataURL('image/png');
  }

  /**
   * Get PDF metadata (page count, dimensions, etc.)
   */
  async getPdfMetadata(
    pdfUrl: string
  ): Promise<{
    pageCount: number;
    title?: string;
    author?: string;
    subject?: string;
    pageDimensions: { width: number; height: number }[];
  }> {
    if (!this.isPdfSupported()) {
      throw new Error('PDF processing not available');
    }

    try {
      const pdf = await pdfjsLib.getDocument(pdfUrl).promise;

      // Get metadata
      const metadata = await pdf.getMetadata().catch(() => null);

      // Get page dimensions
      const pageDimensions = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1 });
        pageDimensions.push({
          width: viewport.width,
          height: viewport.height
        });
      }

      return {
        pageCount: pdf.numPages,
        title: metadata?.metadata?.get?.('Title'),
        author: metadata?.metadata?.get?.('Author'),
        subject: metadata?.metadata?.get?.('Subject'),
        pageDimensions
      };
    } catch (error) {
      throw new Error(`Failed to extract PDF metadata: ${error}`);
    }
  }

  /**
   * Create thumbnail preview for PDF first page
   */
  async createPdfThumbnail(pdfUrl: string, scale: number = 0.5): Promise<string> {
    return this.convertPdfPageToImage(pdfUrl, 1, scale);
  }

  /**
   * Convert uploaded PDF to FileObject array (one per page, as images)
   * Useful for "PDF to images" workflow in mixed file list
   */
  async convertPdfToFileObjects(
    pdfFile: FileObject,
    includeImages: boolean = true
  ): Promise<FileObject[]> {
    try {
      const metadata = await this.getPdfMetadata(pdfFile.url);
      const fileObjects: FileObject[] = [];

      // Option 1: Extract each page as separate image
      if (includeImages) {
        for (let i = 1; i <= metadata.pageCount; i++) {
          const imageUrl = await this.convertPdfPageToImage(pdfFile.url, i, 2);
          fileObjects.push({
            name: `${pdfFile.name} - Page ${i}`,
            url: imageUrl,
            size: imageUrl.length,
            type: 'image/png'
          });
        }
      }

      return fileObjects;
    } catch (error) {
      throw new Error(`Failed to convert PDF to images: ${error}`);
    }
  }
}
