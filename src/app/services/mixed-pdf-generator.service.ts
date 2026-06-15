import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { DocumentItem } from '../models/document-item.model';

/**
 * Options for mixed PDF generation
 */
export interface MixedPdfGenerationOptions {
  /** Whether to embed images as JPEG (true) or PNG (false) */
  useJpegCompression?: boolean;
  /** JPEG quality (0.0 - 1.0) for image embedding */
  jpegQuality?: number;
}

/**
 * Service for generating a mixed PDF containing both images and copied PDF pages.
 *
 * CRITICAL: PDF pages are copied using pdf-lib's copyPages() method,
 * which preserves vector graphics, text layers, and embedded fonts.
 * PDF pages are NEVER rasterized through a canvas.
 *
 * Images are embedded directly using pdf-lib's embedJpg()/embedPng() methods.
 */
@Injectable({
  providedIn: 'root'
})
export class MixedPdfGeneratorService {
  /**
   * Generate a mixed PDF from a queue of DocumentItems.
   * Images are embedded as image pages; PDF pages are copied via pdf-lib copyPages().
   *
   * @param items - Ordered list of document items to include
   * @param options - Generation options (image compression settings)
   * @returns Blob of the generated PDF
   */
  async generateMixedPdf(
    items: DocumentItem[],
    options: MixedPdfGenerationOptions = {}
  ): Promise<Blob> {
    if (items.length === 0) {
      throw new Error('No items to generate PDF from');
    }

    const targetPdf = await PDFDocument.create();
    const useJpeg = options.useJpegCompression ?? true;
    const jpegQuality = options.jpegQuality ?? 0.92;

    for (const item of items) {
      if (item.type === 'image') {
        await this.embedImagePage(targetPdf, item, useJpeg, jpegQuality);
      } else if (item.type === 'pdf-page') {
        await this.copyPdfPage(targetPdf, item);
      }
    }

    const pdfBytes = await targetPdf.save();
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  }

  /**
   * Embed an image as a new page in the target PDF.
   * Uses pdf-lib's embedJpg/embedPng for direct embedding without rasterization.
   *
   * @param targetPdf - The target PDF document
   * @param item - The image document item
   * @param useJpeg - Whether to use JPEG compression
   * @param jpegQuality - JPEG quality setting
   */
  private async embedImagePage(
    targetPdf: PDFDocument,
    item: DocumentItem,
    useJpeg: boolean,
    jpegQuality: number
  ): Promise<void> {
    if (!item.url) {
      throw new Error(`Image data unavailable for: ${item.name}`);
    }

    // Fetch image bytes from URL (data URL or blob URL)
    const imageBytes = await this.fetchBytes(item.url);
    const mimeType = item.mimeType ?? 'image/png';

    // Embed the image based on MIME type
    let embeddedImage;
    if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
      embeddedImage = await targetPdf.embedJpg(imageBytes);
    } else {
      // For PNG and other types, try PNG first, then fall back to JPEG
      try {
        embeddedImage = await targetPdf.embedPng(imageBytes);
      } catch {
        // If PNG embedding fails, try JPEG as fallback
        embeddedImage = await targetPdf.embedJpg(imageBytes);
      }
    }

    const { width: imgWidth, height: imgHeight } = embeddedImage;
    const rotation = item.rotation ?? 0;

    // Determine page dimensions maintaining aspect ratio
    // Use A4 as default page size (595.28 x 841.89 points)
    const pageWidth = 595.28;
    const pageHeight = 841.89;

    // Calculate image dimensions to fit within page margins
    const margin = 40; // 40 points ≈ 14mm margins
    const maxWidth = pageWidth - 2 * margin;
    const maxHeight = pageHeight - 2 * margin;

    // Scale image to fit within page, maintaining aspect ratio
    let displayWidth: number;
    let displayHeight: number;

    if (imgWidth / imgHeight > maxWidth / maxHeight) {
      // Image is wider relative to page
      displayWidth = maxWidth;
      displayHeight = (imgHeight / imgWidth) * maxWidth;
    } else {
      // Image is taller relative to page
      displayHeight = maxHeight;
      displayWidth = (imgWidth / imgHeight) * maxHeight;
    }

    // Center the image on the page
    const x = (pageWidth - displayWidth) / 2;
    let y = (pageHeight - displayHeight) / 2;

    let finalWidth = displayWidth;
    let finalHeight = displayHeight;

    // Apply rotation if needed
    if (rotation === 90 || rotation === 270) {
      // Swap dimensions for rotated images
      finalWidth = displayHeight;
      finalHeight = displayWidth;
      // Recalculate centering
      const rotatedX = (pageWidth - finalWidth) / 2;
      const rotatedY = (pageHeight - finalHeight) / 2;

      const page = targetPdf.addPage([pageWidth, pageHeight]);
      page.drawImage(embeddedImage, {
        x: rotatedX,
        y: rotatedY,
        width: finalWidth,
        height: finalHeight,
        rotate: { type: 'degrees', angle: rotation } as any,
      });
      return;
    }

    const page = targetPdf.addPage([pageWidth, pageHeight]);
    page.drawImage(embeddedImage, {
      x,
      y,
      width: finalWidth,
      height: finalHeight,
    });
  }

  /**
   * Copy a page from a source PDF into the target PDF using pdf-lib's copyPages().
   * This preserves all vector graphics, text, fonts, and original quality.
   * NO rasterization occurs during this process.
   *
   * @param targetPdf - The target PDF document
   * @param item - The PDF page document item
   */
  private async copyPdfPage(
    targetPdf: PDFDocument,
    item: DocumentItem
  ): Promise<void> {
    if (!item.url && !item.pdfFile) {
      throw new Error(`PDF data unavailable for: ${item.name}`);
    }

    const pdfPageIndex = item.pdfPageIndex;
    if (pdfPageIndex === undefined || pdfPageIndex < 0) {
      throw new Error(`Invalid page index for: ${item.name}`);
    }

    // Get PDF bytes from url or file
    let sourcePdfBytes: Uint8Array;
    if (item.url) {
      sourcePdfBytes = await this.fetchBytes(item.url);
    } else if (item.pdfFile) {
      sourcePdfBytes = new Uint8Array(await item.pdfFile.arrayBuffer());
    } else {
      throw new Error(`No PDF source available for: ${item.name}`);
    }

    // Load the source PDF
    const sourcePdf = await PDFDocument.load(sourcePdfBytes);

    const pageCount = sourcePdf.getPageCount();
    if (pdfPageIndex >= pageCount) {
      throw new Error(
        `Page index ${pdfPageIndex} is out of range. Source PDF "${item.originalPdfName ?? item.name}" has ${pageCount} pages.`
      );
    }

    // CRITICAL: Use copyPages() to preserve all PDF content.
    // This is NOT rasterization - it copies the raw PDF page objects.
    // copyPages returns PDFPage objects that can be added directly via addPage().
    const [copiedPage] = await targetPdf.copyPages(sourcePdf, [pdfPageIndex]);

    // Add the copied page directly - preserves original dimensions, vector graphics,
    // text layers, and embedded fonts.
    targetPdf.addPage(copiedPage);
  }

  /**
   * Calculate estimated page count for progress tracking
   */
  estimatePageCount(items: DocumentItem[]): number {
    return items.length;
  }

  /**
   * Fetch bytes from a URL (data URL or blob URL or remote URL).
   * Falls back to Node.js Buffer-based decoding if atob() fails
   * (e.g. in test environments with problematic base64 strings).
   */
  private async fetchBytes(url: string): Promise<Uint8Array> {
    if (url.startsWith('data:')) {
      // Handle data URLs (base64)
      const base64 = url.split(',')[1];
      if (!base64) {
        throw new Error('Invalid data URL format');
      }

      try {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
      } catch {
        // Fallback for Node.js test environments where atob doesn't handle
        // all base64 strings correctly (use global Buffer if available)
        const nodeBuffer = (globalThis as any).Buffer?.from?.(base64, 'base64');
        if (nodeBuffer) {
          return new Uint8Array(nodeBuffer);
        }
        throw new Error('Failed to decode base64 data URL');
      }
    }

    // Handle blob URLs and other URLs
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: HTTP ${response.status}`);
    }
    return new Uint8Array(await response.arrayBuffer());
  }
}