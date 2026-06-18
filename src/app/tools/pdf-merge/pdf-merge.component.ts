import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PDFMergeService } from '../../services/pdf-merge.service';
import { ToolDefinition } from '../tool.interface';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';
import { SessionStorageService } from '../../services/storage/session-storage.service';

@Component({
  selector: 'app-pdf-merge',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, DragDropZoneComponent],
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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.restoreSessionFiles();
  }

  /**
   * Restore persisted session files from IndexedDB.
   */
  private async restoreSessionFiles(): Promise<void> {
    try {
      const restored = await this.sessionStorage.loadSession(this.toolDefinition.id);
      if (restored && restored.length > 0) {
        this.uploadedPdfs = restored;
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
      }
      
      if (result.errors.length > 0) {
        this.validationErrors = result.errors;
      }

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