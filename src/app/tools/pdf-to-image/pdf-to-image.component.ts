import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PdfToImageService, PdfToImageOptions, PdfToImageResult, ImageFormat, ExportProgress } from '../../services/pdf-to-image.service';
import { ToolDefinition } from '../tool.interface';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';

@Component({
  selector: 'app-pdf-to-image',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropZoneComponent],
  templateUrl: './pdf-to-image.component.html',
  styleUrls: ['./pdf-to-image.component.scss']
})
export class PdfToImageComponent implements OnInit, OnDestroy {
  uploadedPdf: FileObject | null = null;
  pageCount: number = 0;
  validationErrors: FileValidationError[] = [];
  generalError: string | null = null;
  isExporting = false;
  isDragging = false;

  // Export options
  options: PdfToImageOptions;

  // Filename prefix
  outputPrefix: string = 'document';

  // Progress tracking
  exportProgress: ExportProgress | null = null;
  private progressSubscription: Subscription | null = null;

  // Results
  exportedImages: PdfToImageResult[] = [];

    toolDefinition: ToolDefinition = {
      id: 'pdf-to-image',
      name: 'PDF to Image',
      description: 'Convert PDF pages to PNG or JPEG images',
      icon: 'fa-solid fa-image',
      path: 'pdf-to-image',
      category: 'extract',
      enabled: true,
      priority: 58
    };

  // Scale options with DPI labels
  scaleOptions = [
    { value: 1, label: '1× (72 DPI)', description: 'Small file size, low quality' },
    { value: 2, label: '2× (150 DPI)', description: 'Good for screens' },
    { value: 3, label: '3× (200 DPI)', description: 'High quality' },
    { value: 4, label: '4× (300 DPI)', description: 'Print quality' }
  ];

  constructor(
    private fileService: FileService,
    private pdfToImageService: PdfToImageService,
    private cdr: ChangeDetectorRef
  ) {
    this.options = this.pdfToImageService.getDefaultOptions();
  }

  ngOnInit(): void {
    // Initialize
  }

  ngOnDestroy(): void {
    this.unsubscribeProgress();
    this.cleanupImages();
  }

  /**
   * Subscribe to export progress updates
   */
  private subscribeProgress(): void {
    this.unsubscribeProgress();
    this.progressSubscription = this.pdfToImageService.getProgress().subscribe(progress => {
      this.exportProgress = progress;
      this.cdr.detectChanges();
    });
  }

  /**
   * Unsubscribe from export progress updates
   */
  private unsubscribeProgress(): void {
    if (this.progressSubscription) {
      this.progressSubscription.unsubscribe();
      this.progressSubscription = null;
    }
  }

  /**
   * Clean up image object URLs to prevent memory leaks
   */
  private cleanupImages(): void {
    if (this.exportedImages.length > 0) {
      this.pdfToImageService.revokeObjectUrls(this.exportedImages);
    }
  }

  /**
   * Handle file selection from drag-drop or file picker
   */
  async onFilesSelected(files: FileList | File[]): Promise<void> {
    try {
      this.generalError = null;
      this.exportedImages = [];
      this.cleanupImages();
      const result = await this.fileService.processFiles(files);

      // Filter to only PDF files
      const pdfs = result.successful.filter(f => f.fileType === 'pdf');

      if (pdfs.length > 0) {
        // Use only the first PDF
        this.uploadedPdf = pdfs[0];
        this.outputPrefix = this.pdfToImageService.sanitizeFileName(pdfs[0].name.replace(/\.[^/.]+$/, '')) || 'document';

        // Get page count
        this.pageCount = await this.pdfToImageService.getPageCount(this.uploadedPdf);

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
    this.exportedImages = [];
    this.exportProgress = null;
    this.cleanupImages();
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
   * Get the current format as string for template display
   */
  get currentFormat(): ImageFormat {
    return this.options.format;
  }

  /**
   * Set image format with validation
   */
  setFormat(format: ImageFormat): void {
    this.options.format = format;
    if (format === 'png') {
      this.options.jpegQuality = 0.92;
    }
  }

  /**
   * Export PDF pages to images
   */
  async onExportImages(): Promise<void> {
    if (!this.uploadedPdf) {
      this.generalError = 'Please upload a PDF to export';
      return;
    }

    this.isExporting = true;
    this.generalError = null;
    this.exportedImages = [];
    this.cleanupImages();
    this.exportProgress = null;

    // Subscribe to progress updates
    this.subscribeProgress();

    try {
      this.exportedImages = await this.pdfToImageService.convertToImages(this.uploadedPdf, this.options);

      // Auto-download based on output mode
      if (this.options.outputMode === 'zip') {
        const zipBlob = await this.pdfToImageService.createZip(this.exportedImages, this.outputPrefix);
        this.pdfToImageService.downloadZip(zipBlob, `${this.outputPrefix}_images.zip`);
      } else {
        this.pdfToImageService.downloadAllImages(this.exportedImages);
      }
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Failed to export images';
      console.error('Export failed:', error);
    } finally {
      this.isExporting = false;
      this.exportProgress = null;
      this.unsubscribeProgress();
      this.cdr.detectChanges();
    }
  }

  /**
   * Cancel ongoing export
   */
  onCancelExport(): void {
    this.pdfToImageService.cancelExport();
  }

  /**
   * Download a single exported image again
   */
  onDownloadImage(image: PdfToImageResult): void {
    this.pdfToImageService.downloadImage(image.blob, image.name);
  }

  /**
   * Download all images again
   */
  onDownloadAllImages(): void {
    if (this.options.outputMode === 'zip') {
      this.createAndDownloadZip();
    } else {
      this.pdfToImageService.downloadAllImages(this.exportedImages);
    }
  }

  /**
   * Create and download ZIP of all images
   */
  async createAndDownloadZip(): Promise<void> {
    try {
      const zipBlob = await this.pdfToImageService.createZip(this.exportedImages, this.outputPrefix);
      this.pdfToImageService.downloadZip(zipBlob, `${this.outputPrefix}_images.zip`);
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Failed to create ZIP';
      this.cdr.detectChanges();
    }
  }

  /**
   * Clear everything
   */
  clearAll(): void {
    if (this.isExporting) {
      this.pdfToImageService.cancelExport();
    }

    this.uploadedPdf = null;
    this.pageCount = 0;
    this.validationErrors = [];
    this.generalError = null;
    this.exportedImages = [];
    this.exportProgress = null;
    this.isExporting = false;
    this.isDragging = false;
    this.outputPrefix = 'document';
    this.options = this.pdfToImageService.getDefaultOptions();
    this.cleanupImages();
    this.unsubscribeProgress();
    this.cdr.detectChanges();
  }

  /**
   * Check if export button should be disabled
   */
  isExportDisabled(): boolean {
    return !this.uploadedPdf || this.isExporting;
  }

  /**
   * Get export button label
   */
  getExportButtonLabel(): string {
    if (this.isExporting) {
      return 'Exporting...';
    }
    if (!this.uploadedPdf) {
      return 'Upload PDF to start';
    }
    const mode = this.options.outputMode === 'zip' ? 'ZIP' : 'Images';
    return `Export to ${mode}`;
  }

  /**
   * Get info text based on state
   */
  getInfoText(): string {
    if (!this.uploadedPdf) {
      return 'Upload a PDF to convert its pages to images';
    }
    return `PDF has ${this.pageCount} ${this.pageCount === 1 ? 'page' : 'pages'} • ${this.pdfToImageService.formatFileSize(this.uploadedPdf.size)}`;
  }

  /**
   * Format file size for display
   */
  formatSize(bytes: number): string {
    return this.pdfToImageService.formatFileSize(bytes);
  }

  /**
   * Get progress percentage for the progress bar
   */
  getProgressPercent(): number {
    if (!this.exportProgress || this.exportProgress.total === 0) return 0;
    return Math.round((this.exportProgress.current / this.exportProgress.total) * 100);
  }

  /**
   * Get the JPEG quality display value (1-100 scale for slider)
   */
  get jpegQualityPercent(): number {
    return Math.round(this.options.jpegQuality * 100);
  }

  set jpegQualityPercent(value: number) {
    this.options.jpegQuality = Math.round(value) / 100;
  }
}