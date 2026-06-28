import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PDFMergeService } from '../../services/pdf-merge.service';
import { ToolDefinition } from '../tool.interface';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';
import { SessionStorageService } from '../../services/storage/session-storage.service';
import { PdfPreviewComponent } from '../../components/pdf-preview/pdf-preview.component';
import { SeoContentComponent } from '../../components/seo-content/seo-content.component';
import { SeoContentConfigService } from '../../services/seo-content-config.service';
import type { SeoContentConfig } from '../../components/seo-content/seo-content.component';

@Component({
  selector: 'app-pdf-merge',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, DragDropZoneComponent, PdfPreviewComponent, SeoContentComponent],
  templateUrl: './pdf-merge.component.html',
  styleUrls: ['./pdf-merge.component.scss']
})
export class PdfMergeComponent implements OnInit {
  uploadedPdfs: FileObject[] = [];
  validationErrors: FileValidationError[] = [];
  generalError: string | null = null;
  isMerging = false;
  mergeFileName: string = 'merged-document';
  isDragging = false;
  previewBlob: Blob | null = null;
  selectedPreviewIndex = 0;
  seoContentConfig: SeoContentConfig | null = null;

  toolDefinition: ToolDefinition = {
    id: 'pdf-merge',
    name: 'Merge PDFs',
    description: 'Combine multiple PDFs into one',
    icon: 'fa-solid fa-paperclip',
    path: 'pdf-merge',
    category: 'merge',
    enabled: true,
    priority: 200
  };

  private readonly sessionStorage = inject(SessionStorageService);

  constructor(
    private fileService: FileService,
    private pdfMergeService: PDFMergeService,
    private cdr: ChangeDetectorRef,
    private seoContentConfigService: SeoContentConfigService
  ) {}

  ngOnInit(): void {
    this.restoreSessionFiles();
    this.seoContentConfig = this.seoContentConfigService.getConfig('pdf-merge') ?? null;
  }

  /**
   * Restore persisted session files from IndexedDB.
   */
  private async restoreSessionFiles(): Promise<void> {
    try {
      const restored = await this.sessionStorage.loadSession(this.toolDefinition.id);
      if (restored && restored.length > 0) {
        this.uploadedPdfs = restored;
        this.updatePreviewBlob();
        this.cdr.detectChanges();
      }
    } catch {
      // Ignore — keep empty queue
    }
  }

  /**
   * Persist the current file list to IndexedDB.
   */
  private async persistSessionFiles(): Promise<void> {
    try {
      await this.sessionStorage.createSession(
        this.toolDefinition.id,
        this.toolDefinition.id,
        this.toolDefinition.name,
        this.uploadedPdfs,
      );
    } catch {
      // Best-effort
    }
  }

  /**
   * Convert a Data URL to a Blob directly (avoids fetch() which
   * may fail on data URLs in some browsers).
   */
  private dataUrlToBlob(dataUrl: string): Blob | null {
    try {
      const [meta, base64] = dataUrl.split(',');
      const mimeMatch = meta.match(/:(.*?);/);
      if (!mimeMatch) {
        console.warn('[MergePreview] dataUrlToBlob: mime match failed', dataUrl.slice(0, 80));
        return null;
      }
      const mimeType = mimeMatch[1];
      const byteChars = atob(base64);
      const bytes = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        bytes[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: mimeType });
      console.log('[MergePreview] dataUrlToBlob: success', { mimeType, size: blob.size });
      return blob;
    } catch (err) {
      console.warn('[MergePreview] dataUrlToBlob: error', err);
      return null;
    }
  }

  /**
   * Update the preview blob to show the first uploaded PDF.
   */
  private updatePreviewBlob(): void {
    if (this.uploadedPdfs.length === 0) {
      this.previewBlob = null;
      return;
    }
    const idx = Math.min(this.selectedPreviewIndex, this.uploadedPdfs.length - 1);
    this.previewBlob = this.dataUrlToBlob(this.uploadedPdfs[idx].url);
  }

  /**
   * Select a specific PDF in the list to preview.
   */
  selectPreviewFile(index: number): void {
    if (index < 0 || index >= this.uploadedPdfs.length) return;
    this.selectedPreviewIndex = index;
    this.previewBlob = this.dataUrlToBlob(this.uploadedPdfs[index].url);
  }

  /**
   * Handle files from drag-drop or file picker
   */
  async onFilesSelected(files: FileList | File[]): Promise<void> {
    try {
      this.generalError = null;
      const result = await this.fileService.processFiles(files);
      
      // Filter to only PDF files
      const pdfs = result.successful.filter(f => f.fileType === 'pdf');
      
      if (pdfs.length > 0) {
        this.uploadedPdfs = [...this.uploadedPdfs, ...pdfs];
        this.selectedPreviewIndex = 0;
      }
      
      if (result.errors.length > 0) {
        this.validationErrors = result.errors;
      }

      // Update preview blob
      this.updatePreviewBlob();

      // Persist to IndexedDB
      await this.persistSessionFiles();

      this.cdr.detectChanges();
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Error processing files';
      this.cdr.detectChanges();
    }
  }

  /**
   * Remove PDF from list
   */
  async onPdfRemoved(index: number): Promise<void> {
    this.uploadedPdfs = this.uploadedPdfs.filter((_, i) => i !== index);
    if (this.selectedPreviewIndex >= this.uploadedPdfs.length) {
      this.selectedPreviewIndex = Math.max(0, this.uploadedPdfs.length - 1);
    }
    this.updatePreviewBlob();
    await this.persistSessionFiles();
    this.cdr.detectChanges();
  }

  /**
   * Handle file reordering via drag-drop
   */
  async onPdfReordered(event: CdkDragDrop<FileObject[]>): Promise<void> {
    if (event.previousIndex !== event.currentIndex) {
      const reordered = [...this.uploadedPdfs];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      this.uploadedPdfs = reordered;
      await this.persistSessionFiles();
      this.cdr.detectChanges();
    }
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
   * Merge selected PDFs
   */
  async onMergePDFs(): Promise<void> {
    if (this.uploadedPdfs.length < 2) {
      this.generalError = 'Please upload at least 2 PDFs to merge';
      return;
    }

    this.isMerging = true;
    try {
      const fileName = this.pdfMergeService.sanitizeFileName(this.mergeFileName) || 'merged-document';
      const mergedBlob = await this.pdfMergeService.mergePDFs(
        this.uploadedPdfs,
        `${fileName}.pdf`
      );
      
      this.pdfMergeService.downloadPDF(mergedBlob, `${fileName}.pdf`);
      this.generalError = null;
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Failed to merge PDFs';
      console.error('Merge failed:', error);
    } finally {
      this.isMerging = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Clear all uploaded PDFs
   */
  async clearAll(): Promise<void> {
    this.uploadedPdfs = [];
    this.validationErrors = [];
    this.generalError = null;
    this.previewBlob = null;
    await this.persistSessionFiles();
    this.cdr.detectChanges();
  }

  /**
   * Check if merge button should be disabled
   */
  isMergeDisabled(): boolean {
    return this.uploadedPdfs.length < 2 || this.isMerging;
  }

  /**
   * Get merge button label
   */
  getMergeButtonLabel(): string {
    if (this.isMerging) {
      return 'Merging...';
    }
    if (this.uploadedPdfs.length < 2) {
      return `Add ${2 - this.uploadedPdfs.length} more PDF`;
    }
    return `Merge ${this.uploadedPdfs.length} PDFs`;
  }
}