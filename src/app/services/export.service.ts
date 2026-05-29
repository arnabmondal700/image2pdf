import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { FileObject } from './file.service';
import type { PDFSettings } from './pdf.service';
import { PDFService } from './pdf.service';

export type ExportMode = 'single-pdf' | 'separate-pdfs' | 'zip';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  constructor(private pdfService: PDFService) {}

  /**
   * Export files in the specified mode
   */
  async export(
    uploadedFiles: FileObject[],
    mode: ExportMode,
    settings: PDFSettings,
    baseFileName: string = 'export'
  ): Promise<void> {
    if (uploadedFiles.length === 0) {
      return;
    }

    switch (mode) {
      case 'single-pdf':
        await this.exportSinglePDF(uploadedFiles, settings, baseFileName);
        break;
      case 'separate-pdfs':
        await this.exportSeparatePDFs(uploadedFiles, settings, baseFileName);
        break;
      case 'zip':
        await this.exportZIP(uploadedFiles, settings, baseFileName);
        break;
    }
  }

  /**
   * Export as single PDF (default behavior)
   */
  private async exportSinglePDF(
    uploadedFiles: FileObject[],
    settings: PDFSettings,
    baseFileName: string
  ): Promise<void> {
    await this.pdfService.generatePDF(uploadedFiles, `${baseFileName}.pdf`, settings);
  }

  /**
   * Export as separate PDFs (one per image/file)
   */
  private async exportSeparatePDFs(
    uploadedFiles: FileObject[],
    settings: PDFSettings,
    baseFileName: string
  ): Promise<void> {
    // If only one file, just export as single PDF
    if (uploadedFiles.length === 1) {
      const file = uploadedFiles[0];
      const fileName = this.sanitizeFileName(file.name);
      await this.pdfService.generatePDF([file], `${fileName}.pdf`, settings);
      return;
    }

    // Generate each file as a separate PDF and trigger multiple downloads
    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const fileName = this.sanitizeFileName(file.name);
      
      // Create a small delay between downloads to avoid browser blocking
      if (i > 0) {
        await this.delay(500);
      }

      try {
        await this.pdfService.generatePDF([file], `${i + 1}-${fileName}.pdf`, settings);
      } catch (error) {
        console.error(`Failed to generate PDF for file: ${file.name}`, error);
        // Continue with other files even if one fails
      }
    }
  }

  /**
   * Export as ZIP file containing individual PDFs
   */
  private async exportZIP(
    uploadedFiles: FileObject[],
    settings: PDFSettings,
    baseFileName: string
  ): Promise<void> {
    const zip = new JSZip();
    
    // If only one file, just export as single PDF
    if (uploadedFiles.length === 1) {
      const file = uploadedFiles[0];
      const pdfBlob = await this.pdfService.createPDFBlob([file], settings);
      const fileName = this.sanitizeFileName(file.name);
      zip.file(`${fileName}.pdf`, pdfBlob);
    } else {
      // Generate PDFs for each file
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const fileName = this.sanitizeFileName(file.name);
        
        try {
          const pdfBlob = await this.pdfService.createPDFBlob([file], settings);
          zip.file(`${i + 1}-${fileName}.pdf`, pdfBlob);
        } catch (error) {
          console.error(`Failed to generate PDF for file: ${file.name}`, error);
          // Continue with other files even if one fails
        }
      }
    }

    // Generate ZIP and trigger download
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    this.downloadBlob(zipBlob, `${baseFileName}.zip`);
  }

  /**
   * Download a blob as a file
   */
  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }

  /**
   * Sanitize file name for use in exports
   */
  private sanitizeFileName(fileName: string): string {
    // Remove file extension if present
    let name = fileName.replace(/\.[^/.]+$/, '');
    // Replace special characters
    name = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
    // Remove leading/trailing underscores
    name = name.replace(/^_+|_+$/g, '');
    // Ensure not empty
    return name || 'file';
  }

  /**
   * Helper to add delay between operations
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
