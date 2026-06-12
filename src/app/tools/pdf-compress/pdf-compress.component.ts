import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PDFCompressService, CompressionLevel, CompressionResult } from '../../services/pdf-compress.service';
import { ToolDefinition } from '../tool.interface';

@Component({
  selector: 'app-pdf-compress',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-compress.component.html',
  styleUrls: ['./pdf-compress.component.scss']
})
export class PdfCompressComponent implements OnInit {
  uploadedPdf: FileObject | null = null;
  pageCount: number = 0;
  validationErrors: FileValidationError[] = [];
  generalError: string | null = null;
  isCompressing = false;
  compressionLevel: CompressionLevel = 'medium';
  compressFileName: string = 'compressed-document';
  isDragging = false;

  // Results
  compressionResult: CompressionResult | null = null;

  toolDefinition: ToolDefinition = {
    id: 'pdf-compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality',
    icon: '🗜️',
    path: 'compress',
    category: 'optimize',
    enabled: true,
    priority: 65
  };

  constructor(
    private fileService: FileService,
    private pdfCompressService: PDFCompressService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize
  }

  /**
   * Handle file selection from drag-drop or file picker
   */
  async onFilesSelected(files: FileList | File[]): Promise<void> {
    try {
      this.generalError = null;
      this.compressionResult = null;
      const result = await this.fileService.processFiles(files);

      // Filter to only PDF files
      const pdfs = result.successful.filter(f => f.fileType === 'pdf');

      if (pdfs.length > 0) {
        // Use only the first PDF
        this.uploadedPdf = pdfs[0];

        // Get page count
        this.pageCount = await this.pdfCompressService.getPageCount(this.uploadedPdf);

        // Clear previous errors
        this.validationErrors = [];
      } else if (result.errors.length > 0) {
        this.validationErrors = result.errors;
      }

      if (result.errors.length > 0) {
        this.validationErrors = result.errors;
      }

      this.cdr.detectChanges();
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Error processing file';
      this.cdr.detectChanges();
    }
  }

  /**
   * Remove uploaded PDF
   */
  onPdfRemoved(): void {
    this.uploadedPdf = null;
    this.pageCount = 0;
    this.validationErrors = [];
    this.generalError = null;
    this.compressionResult = null;
    this.cdr.detectChanges();
  }

  /**
   * Handle drag over zone
   */
  onDragOverZone(): void {
    this.isDragging = true;
  }

  /**
   * Handle drag leave zone
   */
  onDragLeaveZone(): void {
    this.isDragging = false;
  }

  /**
   * Compress the uploaded PDF
   */
  async onCompressPDF(): Promise<void> {
    if (!this.uploadedPdf) {
      this.generalError = 'Please upload a PDF to compress';
      return;
    }

    this.isCompressing = true;
    this.generalError = null;
    this.compressionResult = null;

    try {
      const fileName = this.pdfCompressService.sanitizeFileName(this.compressFileName) || 'compressed-document';
      this.compressionResult = await this.pdfCompressService.compress(
        this.uploadedPdf,
        this.compressionLevel,
        fileName
      );

      // Auto-download the compressed PDF
      this.pdfCompressService.downloadPDF(this.compressionResult.blob, `${fileName}.pdf`);
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Failed to compress PDF';
      console.error('Compression failed:', error);
    } finally {
      this.isCompressing = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Download the compressed PDF again
   */
  onDownloadResult(): void {
    if (!this.compressionResult) return;
    const fileName = this.pdfCompressService.sanitizeFileName(this.compressFileName) || 'compressed-document';
    this.pdfCompressService.downloadPDF(this.compressionResult.blob, `${fileName}.pdf`);
  }

  /**
   * Clear everything
   */
  clearAll(): void {
    this.uploadedPdf = null;
    this.pageCount = 0;
    this.validationErrors = [];
    this.generalError = null;
    this.compressionResult = null;
    this.compressionLevel = 'medium';
    this.compressFileName = 'compressed-document';
    this.cdr.detectChanges();
  }

  /**
   * Check if compress button should be disabled
   */
  isCompressDisabled(): boolean {
    return !this.uploadedPdf || this.isCompressing;
  }

  /**
   * Get compress button label
   */
  getCompressButtonLabel(): string {
    if (this.isCompressing) {
      return 'Compressing...';
    }
    if (!this.uploadedPdf) {
      return 'Upload PDF to start';
    }
    return `Compress (${this.getCompressionLabel()})`;
  }

  /**
   * Get human-readable compression level label
   */
  getCompressionLabel(): string {
    switch (this.compressionLevel) {
      case 'low': return 'Low – Re-save Only';
      case 'medium': return 'Medium – Moderate';
      case 'high': return 'High – Maximum';
    }
  }

  /**
   * Get info text based on state
   */
  getInfoText(): string {
    if (!this.uploadedPdf) {
      return 'Upload a PDF to reduce its file size';
    }
    return `PDF has ${this.pageCount} pages • ${this.pdfCompressService.formatFileSize(this.uploadedPdf.size)}`;
  }

  /**
   * Format file size for display
   */
  formatSize(bytes: number): string {
    return this.pdfCompressService.formatFileSize(bytes);
  }

  /**
   * Get compression percentage for display
   */
  getCompressionPercent(): number {
    if (!this.compressionResult) return 0;
    return this.pdfCompressService.getCompressionPercent(
      this.compressionResult.originalSize,
      this.compressionResult.compressedSize
    );
  }

  /**
   * Check if the compressed result is actually smaller
   */
  isResultSmaller(): boolean {
    if (!this.compressionResult) return false;
    return this.compressionResult.compressedSize < this.compressionResult.originalSize;
  }
}