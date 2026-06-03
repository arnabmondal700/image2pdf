import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { FileObject } from './file.service';

/**
 * Options for PDF rearrangement operations
 */
export interface RearrangeOptions {
  /**
   * Custom page size after rearrangement (not yet supported)
   */
  pageSize?: string;
}

/**
 * Represents a page in a rearrangeable PDF
 */
export interface PdfPage {
  index: number;
  originalIndex: number;
  isDuplicate?: boolean;
}

/**
 * Service for PDF page-level manipulation: rearrange, delete, and duplicate pages
 *
 * This service provides document-level PDF operations including:
 * - Page reordering within a PDF document
 * - Page deletion with smart index management
 * - Page duplication to create copies within the document
 * - Multiple page operations in a single update cycle
 * - Download functionality for modified PDFs
 */
@Injectable({
  providedIn: 'root'
})
export class PdfRearrangeService {
  constructor() {}

  /**
   * Get the total number of pages in a PDF
   *
   * @param pdfFile - FileObject containing the PDF data
   * @returns Promise resolving to the page count
   * @throws Error if PDF cannot be loaded or is invalid
   */
  async getPageCount(pdfFile: FileObject): Promise<number> {
    try {
      const pdfBytes = await this.fileToBytes(pdfFile);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      return pdfDoc.getPageCount();
    } catch (error) {
      throw new Error(`Failed to get page count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rearrange PDF pages according to provided order
   *
   * Creates a new PDF with pages in the specified order. Pages can be
   * duplicated by listing their indices multiple times.
   *
   * Example: [0, 2, 1, 0] creates a 4-page PDF from a 3-page source,
   * with page order: first, third, second, first (duplicated)
   *
   * @param pdfFile - FileObject containing the source PDF
   * @param pageIndices - Array of 0-based page indices specifying desired order
   * @param options - Optional rearrangement configuration
   * @returns Promise resolving to a Blob of the rearranged PDF
   * @throws Error if indices are invalid or PDF operations fail
   */
  async rearrangePages(
    pdfFile: FileObject | Blob,
    pageIndices: number[],
    options?: RearrangeOptions
  ): Promise<Blob> {
    try {
      const pdfBytes = await this.fileToBytes(pdfFile);
      const sourcePdf = await PDFDocument.load(pdfBytes);
      const pageCount = sourcePdf.getPageCount();

      // Validate indices
      if (pageIndices.length === 0) {
        throw new Error('At least one page must be selected');
      }

      for (const index of pageIndices) {
        if (index < 0 || index >= pageCount) {
          throw new Error(`Invalid page index: ${index} (PDF has ${pageCount} pages)`);
        }
      }

      // Create new PDF with rearranged pages. copyPages returns fresh page
      // instances, which matters when the order includes duplicates.
      const newPdf = await PDFDocument.create();
      const sourcePages = await sourcePdf.copyPages(sourcePdf, pageIndices);

      for (const copiedPage of sourcePages) {
        newPdf.addPage(copiedPage);
      }

      const pdfBytes2 = await newPdf.save();
      return new Blob([new Uint8Array(pdfBytes2)], { type: 'application/pdf' });
    } catch (error) {
      throw new Error(`Failed to rearrange pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete specific pages from a PDF
   *
   * Removes pages at specified indices and returns a new PDF.
   * Pages can be safely deleted in any order; indices are automatically
   * recalculated internally.
   *
   * @param pdfFile - FileObject containing the PDF
   * @param pageIndicesToDelete - Array of 0-based page indices to remove
   * @param options - Optional deletion configuration
   * @returns Promise resolving to a Blob of the modified PDF
   * @throws Error if all pages would be deleted or indices are invalid
   */
  async deletePages(
    pdfFile: FileObject | Blob,
    pageIndicesToDelete: number[],
    options?: RearrangeOptions
  ): Promise<Blob> {
    try {
      const pdfBytes = await this.fileToBytes(pdfFile);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const pageCount = pdfDoc.getPageCount();

      // Validate deletions
      if (pageIndicesToDelete.length >= pageCount) {
        throw new Error('Cannot delete all pages from PDF');
      }

      const deleteSet = new Set(pageIndicesToDelete);

      // Validate indices
      for (const index of deleteSet) {
        if (index < 0 || index >= pageCount) {
          throw new Error(`Invalid page index: ${index} (PDF has ${pageCount} pages)`);
        }
      }

      // Determine pages to keep (sorted for deletion from end to start)
      const pagesToKeep = Array.from({ length: pageCount }, (_, i) => i).filter(i => !deleteSet.has(i));

      if (pagesToKeep.length === 0) {
        throw new Error('At least one page must remain in PDF');
      }

      // Create new PDF with remaining pages
      const newPdf = await PDFDocument.create();
      const sourcePages = await pdfDoc.copyPages(pdfDoc, pagesToKeep);

      for (const copiedPage of sourcePages) {
        newPdf.addPage(copiedPage);
      }

      const newPdfBytes = await newPdf.save();
      return new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' });
    } catch (error) {
      throw new Error(`Failed to delete pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Duplicate specific pages within a PDF
   *
   * Inserts copies of specified pages right after their originals.
   * For example, duplicating pages [1, 3] in a 4-page PDF results in:
   * [0, 1, 1*, 2, 3, 3*] where * indicates the duplicated page
   *
   * @param pdfFile - FileObject containing the PDF
   * @param pageIndicesToDuplicate - Array of 0-based page indices to duplicate
   * @param options - Optional duplication configuration
   * @returns Promise resolving to a Blob of the modified PDF
   * @throws Error if indices are invalid or duplication fails
   */
  async duplicatePages(
    pdfFile: FileObject | Blob,
    pageIndicesToDuplicate: number[],
    options?: RearrangeOptions
  ): Promise<Blob> {
    try {
      const pdfBytes = await this.fileToBytes(pdfFile);
      const sourcePdf = await PDFDocument.load(pdfBytes);
      const pageCount = sourcePdf.getPageCount();

      if (pageIndicesToDuplicate.length === 0) {
        throw new Error('At least one page must be selected for duplication');
      }

      // Validate indices
      for (const index of pageIndicesToDuplicate) {
        if (index < 0 || index >= pageCount) {
          throw new Error(`Invalid page index: ${index} (PDF has ${pageCount} pages)`);
        }
      }

      // Build new page order with duplicates
      const duplicateSet = new Set(pageIndicesToDuplicate);
      const newOrder: number[] = [];

      for (let i = 0; i < pageCount; i++) {
        newOrder.push(i);
        if (duplicateSet.has(i)) {
          newOrder.push(i); // Insert duplicate right after original
        }
      }

      // Create new PDF with duplicated pages. Copy by final order so duplicate
      // entries are distinct page objects.
      const newPdf = await PDFDocument.create();
      const sourcePages = await sourcePdf.copyPages(sourcePdf, newOrder);

      for (const copiedPage of sourcePages) {
        newPdf.addPage(copiedPage);
      }

      const newPdfBytes = await newPdf.save();
      return new Blob([new Uint8Array(newPdfBytes)], { type: 'application/pdf' });
    } catch (error) {
      throw new Error(`Failed to duplicate pages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch PDF file from URL and convert to Uint8Array (bytes)
   *
   * @private
   * @param url - The URL to fetch (can be data URL or blob URL)
   * @returns Promise resolving to Uint8Array
   */
  private async fetchPDFAsBytes(url: string): Promise<Uint8Array> {
    // Check if it's a data URL (base64 encoded)
    if (url.startsWith('data:')) {
      return this.dataURLToBytes(url);
    }

    // Otherwise fetch from URL
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
   *
   * @private
   * @param dataUrl - The data URL to convert
   * @returns Uint8Array of the decoded data
   */
  private dataURLToBytes(dataUrl: string): Uint8Array {
    // Extract the base64 part
    const base64 = dataUrl.split(',')[1];
    if (!base64) {
      throw new Error('Invalid data URL format');
    }

    // Decode base64 to binary string
    const binaryString = atob(base64);

    // Convert binary string to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  }

  /**
   * Apply multiple page operations in sequence
   *
   * Combines multiple operations (rearrange, delete, duplicate) into a single workflow.
   * Operations are applied in order: delete first, then duplicate, then rearrange.
   *
   * @param pdfFile - FileObject containing the PDF
   * @param operations - Object with optional delete, duplicate, and rearrange arrays
   * @param fileName - Base name for the output file
   * @returns Promise resolving to a Blob of the modified PDF
   */
  async applyOperations(
    pdfFile: FileObject,
    operations: {
      delete?: number[];
      duplicate?: number[];
      rearrange?: number[];
    },
    fileName: string
  ): Promise<Blob> {
    try {
      let result: Blob | FileObject = pdfFile;

      // Step 1: Delete pages if specified
      if (operations.delete && operations.delete.length > 0) {
        result = new File([await this.deletePages(pdfFile, operations.delete)], fileName, {
          type: 'application/pdf'
        });
      }

      // Step 2: Duplicate pages if specified
      if (operations.duplicate && operations.duplicate.length > 0) {
        result = new File([await this.duplicatePages(result, operations.duplicate)], fileName, {
          type: 'application/pdf'
        });
      }

      // Step 3: Rearrange pages if specified
      if (operations.rearrange && operations.rearrange.length > 0) {
        result = await this.rearrangePages(result, operations.rearrange);
      }

      return result instanceof Blob ? result : await this.fileToBlob(result);
    } catch (error) {
      throw new Error(`Failed to apply operations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Download a PDF blob with specified filename
   *
   * @param pdfBlob - The PDF Blob to download
   * @param fileName - Name for the downloaded file (will append .pdf if needed)
   */
  downloadPDF(pdfBlob: Blob, fileName: string): void {
    const sanitized = this.sanitizeFileName(fileName) || 'rearranged-document';
    const finalName = sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Sanitize filename for safe download
   *
   * Removes path separators, special characters, and multiple extensions
   *
   * @param fileName - The filename to sanitize
   * @returns Sanitized filename
   */
  sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return '';
    }

    // Remove path separators
    let sanitized = fileName.replace(/[/\\]/g, '');

    // Remove file extension if present (will be added back as .pdf)
    sanitized = sanitized.replace(/\.[^.]*$/, '');

    // Remove special characters, keep only alphanumeric, hyphens, underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, '');

    // Remove leading/trailing underscores
    sanitized = sanitized.replace(/^_+|_+$/g, '');

    return sanitized;
  }

  /**
   * Convert FileObject to Uint8Array for PDF processing
   *
   * @private
   * @param file - FileObject to convert
   * @returns Promise resolving to Uint8Array
   */
  private async fileToBytes(file: FileObject | Blob): Promise<Uint8Array> {
    if (file instanceof Blob && typeof file.arrayBuffer === 'function') {
      return new Uint8Array(await file.arrayBuffer());
    }

    const fileObject = file as FileObject;
    if (typeof fileObject.url === 'string' && fileObject.url.length > 0) {
      return this.fetchPDFAsBytes(fileObject.url);
    }

    const arrayBufferReader = (file as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer;
    if (typeof arrayBufferReader === 'function') {
      return new Uint8Array(await arrayBufferReader.call(file));
    }

    throw new Error('PDF file data is unavailable');
  }

  /**
   * Convert FileObject to Blob
   *
   * @private
   * @param file - FileObject to convert
   * @returns Promise resolving to Blob
   */
  private async fileToBlob(file: FileObject | Blob): Promise<Blob> {
    if (file instanceof Blob) {
      return file;
    }

    const pdfBytes = await this.fileToBytes(file);
    return new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
  }
}
