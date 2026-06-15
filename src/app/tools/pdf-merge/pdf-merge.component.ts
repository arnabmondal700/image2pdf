import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PDFMergeService } from '../../services/pdf-merge.service';
import { ToolDefinition } from '../tool.interface';

@Component({
  selector: 'app-pdf-merge',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
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
    icon: '🔗',
    path: 'pdf-merge',
    category: 'merge',
    enabled: true,
    priority: 200
  };

  constructor(
    private fileService: FileService,
    private pdfMergeService: PDFMergeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Initialize
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

      this.cdr.detectChanges();
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Error processing files';
      this.cdr.detectChanges();
    }
  }

  /**
   * Remove PDF from list
   */
  onPdfRemoved(index: number): void {
    this.uploadedPdfs = this.uploadedPdfs.filter((_, i) => i !== index);
    this.cdr.detectChanges();
  }

  /**
   * Handle file reordering via drag-drop
   */
  onPdfReordered(event: CdkDragDrop<FileObject[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      const reordered = [...this.uploadedPdfs];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      this.uploadedPdfs = reordered;
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
  clearAll(): void {
    this.uploadedPdfs = [];
    this.validationErrors = [];
    this.generalError = null;
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
