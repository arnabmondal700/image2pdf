import { Injectable } from '@angular/core';
import { PDFDocument, PDFPage } from 'pdf-lib';
import { FileObject } from './file.service';

export interface MergeOptions {
  pageSize?: 'maintain' | 'letter' | 'a4'; // 'maintain' = keep original page sizes
  pageOrder?: number[]; // Custom page order indices
}

@Injectable({
  providedIn: 'root'
})
export class PDFMergeService {
  /**
   * Merge multiple PDF files into a single PDF document
   */
  async mergePDFs(
    pdfFiles: FileObject[],
    fileName: string = 'merged.pdf',
    options: MergeOptions = { pageSize: 'maintain' }
  ): Promise<Blob> {
    if (pdfFiles.length === 0) {
      throw new Error('No PDF files provided');
    }

    // Create a new PDF document for the merged result
    const mergedPdf = await PDFDocument.create();

    // Determine the order of PDFs to merge
    const order = options.pageOrder || pdfFiles.map((_, i) => i);

    // Track total pages for validation
    let totalPages = 0;

    // Load and extract pages from each PDF in order
    for (const index of order) {
      if (index < 0 || index >= pdfFiles.length) {
        console.warn(`Skipping invalid index: ${index}`);
        continue;
      }

      const pdfFile = pdfFiles[index];

      try {
        // Fetch and load the PDF document
        const pdfBytes = await this.fetchPDFAsBytes(pdfFile.url);
        const sourcePdf = await PDFDocument.load(pdfBytes);

        // Get all pages from the source PDF
        const pages = sourcePdf.getPages();

        // Copy each page to the merged PDF
        for (const page of pages) {
          const copiedPage = await mergedPdf.embedPage(page);
          const { width, height } = page.getSize();

          // Add page with maintained dimensions
          mergedPdf.addPage([width, height]).drawPage(copiedPage, {
            x: 0,
            y: 0,
            width,
            height
          });

          totalPages++;
        }
      } catch (error) {
        console.error(`Failed to merge PDF: ${pdfFile.name}`, error);
        throw new Error(`Failed to process ${pdfFile.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (totalPages === 0) {
      throw new Error('No pages found in provided PDFs');
    }

    // Save the merged PDF as a blob
    const mergedPdfBytes = await mergedPdf.save();
    return new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
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
   * Fetch PDF file from URL and convert to Uint8Array (bytes)
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
   * Get page count for a PDF file
   */
  async getPageCount(pdfFile: FileObject): Promise<number> {
    try {
      const pdfBytes = await this.fetchPDFAsBytes(pdfFile.url);
      const pdf = await PDFDocument.load(pdfBytes);
      return pdf.getPageCount();
    } catch (error) {
      console.error(`Failed to get page count for ${pdfFile.name}`, error);
      return 0;
    }
  }

  /**
   * Sanitize file name for downloads
   */
  sanitizeFileName(fileName: string): string {
    // Remove file extension if present
    let name = fileName.replace(/\.[^/.]+$/, '');
    // Replace special characters
    name = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    // Remove leading/trailing underscores
    name = name.replace(/^_+|_+$/g, '');
    // Ensure not empty
    return name || 'merged';
  }
}
