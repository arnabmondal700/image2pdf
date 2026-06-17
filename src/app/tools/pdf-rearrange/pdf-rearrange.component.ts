import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PdfRearrangeService } from '../../services/pdf-rearrange.service';
import { ToolDefinition } from '../tool.interface';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';

/**
 * Represents a page in the rearrangement UI
 */
interface PageItem {
  index: number;
  displayIndex: number;
  isDuplicate?: boolean;
}

/**
 * Component for PDF page rearrangement and page-level editing
 *
 * Features:
 * - Upload single PDF file
 * - View all pages with index badges
 * - Drag-drop reordering
 * - Delete individual pages
 * - Duplicate pages
 * - Clear all pages to reset
 * - Apply all changes and download modified PDF
 */
@Component({
  selector: 'app-pdf-rearrange',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, DragDropZoneComponent],
  templateUrl: './pdf-rearrange.component.html',
  styleUrl: './pdf-rearrange.component.scss'
})
export class PdfRearrangeComponent implements OnInit {
  /**
   * Currently uploaded PDF file
   */
  uploadedPdf: FileObject | null = null;

  /**
   * Total pages in the uploaded PDF
   */
  pageCount: number = 0;

  /**
   * Pages in current rearrangement order
   */
  pages: PageItem[] = [];

  /**
   * Custom output filename
   */
  outputFileName: string = '';

  /**
   * Whether a rearrange operation is in progress
   */
  isRearranging: boolean = false;

  /**
   * Whether user is dragging over the upload zone
   */
  isDragging: boolean = false;

  /**
   * File validation errors
   */
  validationErrors: FileValidationError[] = [];

  /**
   * General operation error message
   */
  generalError: string | null = null;

  /**
   * Tool definition for registration
   */
  toolDefinition: ToolDefinition = {
    id: 'pdf-rearrange',
    name: 'Rearrange PDF',
    description: 'Reorder, delete, or duplicate pages in a PDF',
    icon: 'fa-solid fa-copy',
    path: 'rearrange',
    category: 'rearrange',
    enabled: true,
    priority: 70
  };

  constructor(
    private fileService: FileService,
    private pdfRearrangeService: PdfRearrangeService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Component initialization complete
  }

  /**
   * Helper to convert FileList to File array for template binding
   */
  toFileArray(files: FileList | null | undefined): File[] {
    return files ? Array.from(files) : [];
  }

  /**
   * Handle file selection from input or drag-drop
   */
  async onFilesSelected(files: FileList | File[]): Promise<void> {
    try {
      this.generalError = null;
      this.validationErrors = [];

      // Process files and get results
      const results = await this.fileService.processFiles(files);
      const pdfFiles = results.successful.filter((f: FileObject) => f.type === 'application/pdf');

      if (pdfFiles.length === 0) {
        this.validationErrors = results.errors;
        this.cdr.markForCheck();
        return;
      }

      // Use first PDF file
      const uploadedPdf = pdfFiles[0];
      if (!uploadedPdf) {
        this.generalError = 'No PDF files provided';
        this.cdr.markForCheck();
        return;
      }

      this.uploadedPdf = uploadedPdf;

      // Get page count
      this.pageCount = await this.pdfRearrangeService.getPageCount(this.uploadedPdf);

      // Initialize pages array
      this.pages = this.createPageItems(this.pageCount);

      this.outputFileName = this.uploadedPdf ? (this.pdfRearrangeService.sanitizeFileName(this.uploadedPdf.name) || 'rearranged-pdf') : '';
      this.cdr.markForCheck();
    } catch (error) {
      this.uploadedPdf = null;
      this.pageCount = 0;
      this.pages = [];
      this.outputFileName = '';
      this.generalError = error instanceof Error ? error.message : 'Failed to load PDF';
      this.cdr.markForCheck();
    }
  }

  /**
   * Handle PDF removal
   */
  onPdfRemoved(): void {
    this.uploadedPdf = null;
    this.pageCount = 0;
    this.pages = [];
    this.outputFileName = '';
    this.validationErrors = [];
    this.generalError = null;
    this.cdr.markForCheck();
  }

  /**
   * Delete a page from the rearrangement list
   */
  deletePage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this.pages.length || this.pages.length <= 1) {
      return;
    }

    this.pages = this.pages.filter((_, i) => i !== pageIndex);
    this.updateDisplayIndices();
    this.cdr.markForCheck();
  }

  /**
   * Duplicate a page in the rearrangement list
   */
  duplicatePage(pageIndex: number): void {
    const pageToDuplicate = this.pages[pageIndex];
    if (!pageToDuplicate) {
      return;
    }

    const duplicatedPage: PageItem = {
      ...pageToDuplicate,
      isDuplicate: true
    };
    this.pages.splice(pageIndex + 1, 0, duplicatedPage);
    this.updateDisplayIndices();
    this.cdr.markForCheck();
  }

  /**
   * Update display indices after rearrangement
   */
  private updateDisplayIndices(): void {
    this.pages.forEach((page, i) => {
      page.displayIndex = i + 1;
    });
  }

  /**
   * Handle drag-drop reordering
   */
  onDragDrop(event: CdkDragDrop<PageItem[]>): void {
    if (event.previousIndex !== event.currentIndex) {
      const reordered = [...this.pages];
      moveItemInArray(reordered, event.previousIndex, event.currentIndex);
      this.pages = reordered;
      this.updateDisplayIndices();
      this.cdr.markForCheck();
    }
  }

  /**
   * Reset page edits while keeping the uploaded PDF loaded
   */
  resetPageOrder(): void {
    if (!this.uploadedPdf || this.pageCount <= 0) {
      return;
    }

    this.pages = this.createPageItems(this.pageCount);
    this.generalError = null;
    this.cdr.markForCheck();
  }

  /**
   * Whether the current page list differs from the original PDF order
   */
  hasPageChanges(): boolean {
    if (!this.uploadedPdf || this.pages.length !== this.pageCount) {
      return !!this.uploadedPdf;
    }

    return this.pages.some((page, index) => page.index !== index || page.isDuplicate);
  }

  /**
   * Check if rearrange button should be disabled
   */
  isRearrangeDisabled(): boolean {
    return !this.uploadedPdf || this.pages.length === 0 || this.isRearranging;
  }

  /**
   * Get dynamic button label
   */
  getRearrangeButtonLabel(): string {
    if (this.isRearranging) {
      return 'Applying changes...';
    }
    if (!this.uploadedPdf) {
      return 'Upload PDF to start';
    }
    return `Apply Changes (${this.pages.length} pages)`;
  }

  /**
   * Apply rearrangement and download
   */
  async onApplyChanges(): Promise<void> {
    if (!this.uploadedPdf || this.pages.length === 0) {
      this.generalError = 'Please upload a PDF first';
      return;
    }

    this.isRearranging = true;
    this.generalError = null;

    try {
      // Build page index order
      const pageIndices = this.pages.map(p => p.index);

      // Get the modified PDF
      const modifiedPdf = await this.pdfRearrangeService.rearrangePages(this.uploadedPdf, pageIndices);

      // Download
      const fileName = this.outputFileName || 'rearranged-document';
      this.pdfRearrangeService.downloadPDF(modifiedPdf, fileName);
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Failed to apply changes';
    } finally {
      this.isRearranging = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Clear all pages and reset form
   */
  clearAll(): void {
    this.onPdfRemoved();
    this.cdr.markForCheck();
  }

  /**
   * Get info text based on state
   */
  getInfoText(): string {
    if (!this.uploadedPdf) {
      return 'Upload a PDF to begin';
    }
    if (this.pages.length === 0) {
      return 'No pages selected';
    }
    const duplicates = this.pages.filter(p => p.isDuplicate).length;
    if (duplicates > 0) {
      return `${this.pages.length} pages total (${duplicates} duplicates)`;
    }
    return `${this.pages.length} pages in current order`;
  }

  /**
   * Describe the original source page for a page tile
   */
  getPageSourceLabel(page: PageItem): string {
    const sourcePage = page.index + 1;
    return page.isDuplicate ? `Source page ${sourcePage} copy` : `Source page ${sourcePage}`;
  }

  /**
   * Handle drag-over for visual feedback
   */
  onDragOverZone(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  /**
   * Handle drag-leave for visual feedback
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
   * Handle PDF files dropped on the upload zone
   */
  onDropZone(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    void this.onFilesSelected(this.toFileArray(event.dataTransfer?.files));
  }

  private createPageItems(pageCount: number): PageItem[] {
    return Array.from({ length: pageCount }, (_, i) => ({
      index: i,
      displayIndex: i + 1,
      isDuplicate: false
    }));
  }
}
