import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PDFSplitService } from '../../services/pdf-split.service';
import { ToolDefinition } from '../tool.interface';

@Component({
  selector: 'app-pdf-split',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pdf-split.component.html',
  styleUrls: ['./pdf-split.component.scss']
})
export class PdfSplitComponent implements OnInit {
  uploadedPdf: FileObject | null = null;
  pageCount: number = 0;
  validationErrors: FileValidationError[] = [];
  generalError: string | null = null;
  isSplitting = false;
  pageRange: string = '';
  outputMode: 'single' | 'separate' = 'single';
  splitFileName: string = 'split-document';
  isDragging = false;

  toolDefinition: ToolDefinition = {
    id: 'pdf-split',
    name: 'Split PDF',
    description: 'Extract specific pages from a PDF',
    icon: '✂️',
    path: 'pdf-split',
    category: 'extract',
    enabled: true,
    priority: 75
  };

  constructor(
    private fileService: FileService,
    private pdfSplitService: PDFSplitService,
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
      const result = await this.fileService.processFiles(files);

      // Filter to only PDF files
      const pdfs = result.successful.filter(f => f.fileType === 'pdf');

      if (pdfs.length > 0) {
        // Use only the first PDF
        this.uploadedPdf = pdfs[0];
        
        // Get page count
        this.pageCount = await this.pdfSplitService.getPageCount(this.uploadedPdf);
        
        // Clear previous errors and page range
        this.validationErrors = [];
        this.pageRange = '';
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
    this.pageRange = '';
    this.validationErrors = [];
    this.generalError = null;
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
   * Split PDF based on page range
   */
  async onSplitPDF(): Promise<void> {
    if (!this.uploadedPdf) {
      this.generalError = 'Please upload a PDF to split';
      return;
    }

    if (!this.pageRange.trim()) {
      this.generalError = 'Please specify a page range (e.g., 1-3, 5, 7-10)';
      return;
    }

    this.isSplitting = true;
    try {
      const fileName = this.pdfSplitService.sanitizeFileName(this.splitFileName) || 'split-document';
      const blobs = await this.pdfSplitService.splitPDF(
        this.uploadedPdf,
        this.pageRange,
        fileName,
        { outputMode: this.outputMode }
      );

      this.pdfSplitService.downloadPDFs(blobs, fileName);
      this.generalError = null;
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Failed to split PDF';
      console.error('Split failed:', error);
    } finally {
      this.isSplitting = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Clear uploaded PDF
   */
  clearAll(): void {
    this.uploadedPdf = null;
    this.pageCount = 0;
    this.pageRange = '';
    this.validationErrors = [];
    this.generalError = null;
    this.outputMode = 'single';
    this.splitFileName = 'split-document';
    this.cdr.detectChanges();
  }

  /**
   * Check if split button should be disabled
   */
  isSplitDisabled(): boolean {
    return !this.uploadedPdf || !this.pageRange.trim() || this.isSplitting;
  }

  /**
   * Get split button label
   */
  getSplitButtonLabel(): string {
    if (this.isSplitting) {
      return 'Splitting...';
    }
    if (!this.uploadedPdf) {
      return 'Upload PDF to start';
    }
    if (!this.pageRange.trim()) {
      return 'Specify page range';
    }
    return this.outputMode === 'single' ? 'Extract Pages' : 'Extract as Separate PDFs';
  }

  /**
   * Get info text based on state
   */
  getInfoText(): string {
    if (!this.uploadedPdf) {
      return 'Upload a PDF to extract specific pages';
    }
    return `PDF has ${this.pageCount} pages. Enter page range (e.g., 1-3, 5, 7-10)`;
  }
}
