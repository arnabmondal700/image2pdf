import { Component, inject, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PDFCompressService, CompressionLevel, CompressionResult } from '../../services/pdf-compress.service';
import { ToolDefinition } from '../tool.interface';
import { CompressionProgress } from '../../services/pdf-compression-worker.service';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';
import { SessionStorageService } from '../../services/storage/session-storage.service';
import { SeoContentComponent } from '../../components/seo-content/seo-content.component';
import { SeoContentConfigService } from '../../services/seo-content-config.service';
import type { SeoContentConfig } from '../../components/seo-content/seo-content.component';

@Component({
  selector: 'app-pdf-compress',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropZoneComponent, SeoContentComponent],
  templateUrl: './pdf-compress.component.html',
  styleUrls: ['./pdf-compress.component.scss']
})
export class PdfCompressComponent implements OnInit, OnDestroy {
  uploadedPdf: FileObject | null = null;
  pageCount: number = 0;
  validationErrors: FileValidationError[] = [];
  generalError: string | null = null;
  isCompressing = false;
  compressionLevel: CompressionLevel = 'medium';
  compressFileName: string = 'compressed-document';
  isDragging = false;

  // Progress tracking
  compressionProgress: CompressionProgress | null = null;
  private progressSubscription: Subscription | null = null;

  // Results
  compressionResult: CompressionResult | null = null;
  seoContentConfig: SeoContentConfig | null = null;

  toolDefinition: ToolDefinition = {
    id: 'pdf-compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size while maintaining quality',
    icon: 'fa-solid fa-compress',
    path: 'compress',
    category: 'optimize',
    enabled: true,
    priority: 65
  };

  private readonly sessionStorage = inject(SessionStorageService);

  constructor(
    private fileService: FileService,
    private pdfCompressService: PDFCompressService,
    private cdr: ChangeDetectorRef,
    private seoContentConfigService: SeoContentConfigService
  ) {}

  ngOnInit(): void {
    this.restoreSessionFiles();
    this.seoContentConfig = this.seoContentConfigService.getConfig('pdf-compress') ?? null;
  }

  ngOnDestroy(): void {
    this.unsubscribeProgress();
  }

  /**
   * Restore persisted session file from IndexedDB.
   */
  private async restoreSessionFiles(): Promise<void> {
    try {
      const restored = await this.sessionStorage.loadSession(this.toolDefinition.id);
      if (restored && restored.length > 0) {
        this.uploadedPdf = restored[0];
        this.pageCount = await this.pdfCompressService.getPageCount(this.uploadedPdf);
        this.cdr.detectChanges();
      }
    } catch {
      // Ignore — keep empty queue
    }
  }

  /**
   * Persist the current file to IndexedDB.
   */
  private async persistSessionFiles(): Promise<void> {
    const files = this.uploadedPdf ? [this.uploadedPdf] : [];
    try {
      await this.sessionStorage.createSession(
        this.toolDefinition.id,
        this.toolDefinition.id,
        this.toolDefinition.name,
        files,
      );
    } catch {
      // Best-effort
    }
  }

  /**
   * Subscribe to compression progress updates
   */
  private subscribeProgress(): void {
    this.unsubscribeProgress();
    this.progressSubscription = this.pdfCompressService.getProgress().subscribe(progress => {
      this.compressionProgress = progress;
      this.cdr.detectChanges();
    });
  }

  /**
   * Unsubscribe from compression progress updates
   */
  private unsubscribeProgress(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
      this.progressSubscription = null;
    }
  }

  /**
   * Handle file selection from drag-drop or file picker
   */
  async onFilesSelected(files: FileList | File[]): Promise<void> {
    try {
      console.log('Files selected:', files);
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

        // Persist to IndexedDB
        await this.persistSessionFiles();
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
  async onPdfRemoved(): Promise<void> {
    this.uploadedPdf = null;
    this.pageCount = 0;
    this.validationErrors = [];
    this.generalError = null;
    this.compressionResult = null;
    this.compressionProgress = null;
    await this.persistSessionFiles();
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
   * Handle file dialog open
   */
  onFileDialogOpen(): void {
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
    this.compressionProgress = null;

    // Subscribe to progress updates
    this.subscribeProgress();

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
      if (error instanceof Error && error.name === 'CompressionCancelledError') {
        this.generalError = 'Compression was cancelled';
      } else {
        this.generalError = error instanceof Error ? error.message : 'Failed to compress PDF';
      }
      console.error('Compression failed:', error);
    } finally {
      this.isCompressing = false;
      this.compressionProgress = null;
      this.unsubscribeProgress();
      this.cdr.detectChanges();
    }
  }

  /**
   * Cancel ongoing compression
   */
  onCancelCompression(): void {
    this.pdfCompressService.cancel();
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
  async clearAll(): Promise<void> {
    // Cancel any ongoing compression
    if (this.isCompressing) {
      this.pdfCompressService.cancel();
    }

    this.uploadedPdf = null;
    this.pageCount = 0;
    this.validationErrors = [];
    this.generalError = null;
    this.compressionResult = null;
    this.compressionProgress = null;
    this.compressionLevel = 'medium';
    this.compressFileName = 'compressed-document';
    this.isCompressing = false;
    this.unsubscribeProgress();
    await this.persistSessionFiles();
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

  /**
   * Get progress percentage for the progress bar
   */
  getProgressPercent(): number {
    if (!this.compressionProgress || this.compressionProgress.total === 0) return 0;
    return Math.round((this.compressionProgress.current / this.compressionProgress.total) * 100);
  }
}