import { Injectable } from '@angular/core';
import { PDFDocument } from 'pdf-lib';
import { FileObject } from './file.service';

export interface SplitOptions {
  outputMode?: 'single' | 'separate'; // 'single' = all pages in one PDF, 'separate' = one PDF per page
}

export interface PageRange {
  start: number;
  end: number;
}

@Injectable({
  providedIn: 'root'
})
export class PDFSplitService {
  /**
   * Split a PDF and extract specific pages
   * @param pdfFile The PDF file to split
   * @param pageRangeString Page range string (e.g., "1-3, 5, 7-10")
   * @param fileName Base name for output file(s)
   * @param options Split options (output mode)
   * @returns Array of Blob objects (1 if single mode, multiple if separate mode)
   */
  async splitPDF(
    pdfFile: FileObject,
    pageRangeString: string,
    fileName: string = 'split-document',
    options: SplitOptions = { outputMode: 'single' }
  ): Promise<Blob[]> {
    if (!pdfFile) {
      throw new Error('No PDF file provided');
    }

    if (!pageRangeString || pageRangeString.trim() === '') {
      throw new Error('No page range specified');
    }

    try {
      // Parse page range string
      const pageIndices = this.parsePageRange(pageRangeString);

      if (pageIndices.length === 0) {
        throw new Error('No valid pages specified');
      }

      // Load the PDF
      const pdfBytes = await this.fetchPDFAsBytes(pdfFile.url);
      const sourcePdf = await PDFDocument.load(pdfBytes);
      const totalPages = sourcePdf.getPageCount();

      // Validate page indices
      const validPageIndices = pageIndices.filter(idx => idx > 0 && idx <= totalPages);

      if (validPageIndices.length === 0) {
        throw new Error(`No valid pages found. PDF has ${totalPages} pages.`);
      }

      if (validPageIndices.length < pageIndices.length) {
        const invalidCount = pageIndices.length - validPageIndices.length;
        console.warn(`${invalidCount} page(s) were out of range and skipped`);
      }

      // Extract pages based on output mode
      if (options.outputMode === 'separate') {
        return await this.extractSeparatePDFs(pdfFile, validPageIndices, fileName);
      } else {
        return [await this.extractSinglePDF(pdfFile, validPageIndices, fileName)];
      }
    } catch (error) {
      throw new Error(`Failed to split PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract pages into a single PDF document
   */
  private async extractSinglePDF(
    pdfFile: FileObject,
    pageIndices: number[],
    fileName: string
  ): Promise<Blob> {
    const pdfBytes = await this.fetchPDFAsBytes(pdfFile.url);
    const sourcePdf = await PDFDocument.load(pdfBytes);
    const newPdf = await PDFDocument.create();

    // Copy each page
    for (const pageIndex of pageIndices) {
      const page = sourcePdf.getPage(pageIndex - 1); // Convert to 0-based index
      const copiedPage = await newPdf.embedPage(page);
      const { width, height } = page.getSize();

      newPdf.addPage([width, height]).drawPage(copiedPage, {
        x: 0,
        y: 0,
        width,
        height
      });
    }

    const pdfData = await newPdf.save();
    return new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' });
  }

  /**
   * Extract pages into separate PDF documents (one per page)
   */
  private async extractSeparatePDFs(
    pdfFile: FileObject,
    pageIndices: number[],
    fileName: string
  ): Promise<Blob[]> {
    const pdfBytes = await this.fetchPDFAsBytes(pdfFile.url);
    const sourcePdf = await PDFDocument.load(pdfBytes);
    const blobs: Blob[] = [];

    for (const pageIndex of pageIndices) {
      const newPdf = await PDFDocument.create();
      const page = sourcePdf.getPage(pageIndex - 1); // Convert to 0-based index
      const copiedPage = await newPdf.embedPage(page);
      const { width, height } = page.getSize();

      newPdf.addPage([width, height]).drawPage(copiedPage, {
        x: 0,
        y: 0,
        width,
        height
      });

      const pdfData = await newPdf.save();
      blobs.push(new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' }));
    }

    return blobs;
  }

  /**
   * Parse page range string (e.g., "1-3, 5, 7-10") into array of page numbers
   * @returns Array of page numbers (1-based indexing)
   */
  parsePageRange(rangeString: string): number[] {
    const pageSet = new Set<number>();

    // Split by comma and process each part
    const parts = rangeString.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part === '') continue;

      if (part.includes('-')) {
        // Handle range (e.g., "1-3")
        const [startStr, endStr] = part.split('-').map(s => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (isNaN(start) || isNaN(end)) {
          console.warn(`Invalid range: ${part}`);
          continue;
        }

        if (start > end) {
          console.warn(`Invalid range: start (${start}) > end (${end})`);
          continue;
        }

        // Add all pages in range
        for (let i = start; i <= end; i++) {
          if (i > 0) {
            pageSet.add(i);
          }
        }
      } else {
        // Handle single page (e.g., "5")
        const page = parseInt(part, 10);
        if (isNaN(page)) {
          console.warn(`Invalid page number: ${part}`);
          continue;
        }

        if (page > 0) {
          pageSet.add(page);
        }
      }
    }

    // Return sorted array
    return Array.from(pageSet).sort((a, b) => a - b);
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
   * Download multiple PDF blobs
   */
  downloadPDFs(blobs: Blob[], baseFileName: string): void {
    if (blobs.length === 1) {
      this.downloadPDF(blobs[0], `${this.sanitizeFileName(baseFileName)}.pdf`);
    } else {
      // Download each PDF with index suffix
      blobs.forEach((blob, index) => {
        const fileName = `${this.sanitizeFileName(baseFileName)}_page_${index + 1}.pdf`;
        this.downloadPDF(blob, fileName);
      });
    }
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
    return name || 'split';
  }
}
