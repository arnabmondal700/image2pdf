import { Injectable, inject } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
import { DocumentItem } from '../models/document-item.model';
import { PdfExtractionService } from './pdf-extraction.service';
import { FileService } from './file.service';

/**
 * Result of adding files to the mixed document queue
 */
export interface AddFilesResult {
  successful: DocumentItem[];
  errors: { fileName: string; reason: string }[];
}

/**
 * Service for managing the mixed document queue.
 * Handles importing images and PDFs, generating thumbnails,
 * and performing queue operations (add, remove, reorder, rotate, duplicate).
 *
 * Uses pdfjs-dist for thumbnail generation and pdf-lib for PDF metadata extraction.
 */
@Injectable({
  providedIn: 'root'
})
export class MixedDocumentService {
  private readonly pdfExtraction = inject(PdfExtractionService);
  private readonly fileService = inject(FileService);
  private thumbnailCache = new Map<string, string>();
  private itemIdCounter = 0;
  private readonly MAX_THUMBNAIL_CACHE_SIZE = 500;

  /**
   * Generate a unique ID for document items
   */
  generateId(): string {
    this.itemIdCounter++;
    return `doc-item-${this.itemIdCounter}-${Date.now()}`;
  }

  /**
   * Reset the ID counter (useful for testing)
   */
  resetIdCounter(): void {
    this.itemIdCounter = 0;
    this.thumbnailCache.clear();
  }

  /**
   * Add files (images and/or PDFs) to the document queue.
   * Images become single items; PDFs are split into individual page items.
   * Thumbnails are generated asynchronously for each item.
   */
  async addFilesToQueue(
    files: FileList | File[],
    existingItems: DocumentItem[]
  ): Promise<AddFilesResult> {
    const items: DocumentItem[] = [...existingItems];
    const errors: { fileName: string; reason: string }[] = [];
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      const fileType = this.fileService.detectFileType(file.type);

      if (!fileType) {
        errors.push({ fileName: file.name, reason: 'Unsupported file type' });
        continue;
      }

      if (fileType === 'image') {
        const item = await this.createImageItem(file, items.length);
        if (item) {
          items.push(item);
          // Generate thumbnail asynchronously (non-blocking)
          this.generateImageThumbnailAsync(item);
        } else {
          errors.push({ fileName: file.name, reason: 'Failed to read image file' });
        }
      } else if (fileType === 'pdf') {
        await this.importPdfPages(file, items, errors);
      }
    }

    // Reindex order numbers
    this.reindexItems(items);

    return { successful: items, errors };
  }

  /**
   * Create a DocumentItem for an image file
   */
  private createImageItem(file: File, orderIndex: number): Promise<DocumentItem | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const item: DocumentItem = {
          id: this.generateId(),
          type: 'image',
          name: file.name,
          order: orderIndex,
          rotation: 0,
          selected: false,
          imageFile: file,
          url: reader.result as string,
          mimeType: file.type,
        };
        resolve(item);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Import a PDF file and create separate DocumentItems for each page.
   * Each page becomes an independent queue item with its own thumbnail.
   */
  private async importPdfPages(
    file: File,
    items: DocumentItem[],
    errors: { fileName: string; reason: string }[]
  ): Promise<void> {
    try {
      const url = URL.createObjectURL(file);
      const metadata = await this.pdfExtraction.getPdfMetadata(url);

      for (let i = 0; i < metadata.pageCount; i++) {
        const pageDims = metadata.pageDimensions[i];
        const item: DocumentItem = {
          id: this.generateId(),
          type: 'pdf-page',
          name: `${file.name} — Page ${i + 1}`,
          order: items.length + i,
          rotation: 0,
          selected: false,
          pdfFile: file,
          pdfPageIndex: i,
          originalPdfName: file.name,
          url: url,
          mimeType: 'application/pdf',
          width: pageDims?.width,
          height: pageDims?.height,
          sourcePdfPageCount: metadata.pageCount,
        };
        items.push(item);

        // Generate thumbnail asynchronously (non-blocking)
        this.generatePdfPageThumbnailAsync(item, url, i);
      }
    } catch (error) {
      errors.push({
        fileName: file.name,
        reason: error instanceof Error ? error.message : 'Failed to process PDF',
      });
    }
  }

  /**
   * Generate thumbnail for an image item asynchronously.
   * Uses a small canvas to create a thumbnail preview.
   */
  private generateImageThumbnailAsync(item: DocumentItem): void {
    if (!item.url) return;

    try {
      const img = new Image();
      img.onload = () => {
        const maxSize = 120;
        let w = img.naturalWidth;
        let h = img.naturalHeight;
        const scale = Math.min(maxSize / w, maxSize / h, 1);
        w = Math.round(w * scale);
        h = Math.round(h * scale);

        item.width = img.naturalWidth;
        item.height = img.naturalHeight;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          item.thumbnail = canvas.toDataURL('image/jpeg', 0.7);
          this.addToThumbnailCache(item.id, item.thumbnail);
        }
      };
      img.src = item.url;
    } catch {
      // Silent fail for thumbnail generation
    }
  }

  /**
   * Generate thumbnail for a PDF page item asynchronously.
   * Uses pdfjs-dist to render a single page to canvas.
   * This is for UI preview only - NOT used for final PDF generation.
   */
  private generatePdfPageThumbnailAsync(
    item: DocumentItem,
    pdfUrl: string,
    pageIndex: number
  ): void {
    // Check cache first
    const cached = this.thumbnailCache.get(item.id);
    if (cached) {
      item.thumbnail = cached;
      return;
    }

    if (!this.pdfExtraction.isPdfSupported()) return;

    // Use requestIdleCallback or setTimeout to avoid blocking UI
    setTimeout(async () => {
      try {
        const scale = 0.5;
        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        const page = await pdf.getPage(pageIndex + 1);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport } as any).promise;
        item.thumbnail = canvas.toDataURL('image/jpeg', 0.7);
        this.addToThumbnailCache(item.id, item.thumbnail);
      } catch {
        // Silent fail for thumbnail generation
      }
    }, 0);
  }

  /**
   * Add an item to the thumbnail cache with size management
   */
  private addToThumbnailCache(id: string, thumbnail: string): void {
    if (this.thumbnailCache.size >= this.MAX_THUMBNAIL_CACHE_SIZE) {
      // Evict oldest entry
      const firstKey = this.thumbnailCache.keys().next().value;
      if (firstKey) this.thumbnailCache.delete(firstKey);
    }
    this.thumbnailCache.set(id, thumbnail);
  }

  /**
   * Remove items from the queue by their indices
   */
  removeItems(items: DocumentItem[], indices: number[]): DocumentItem[] {
    const indexSet = new Set(indices);
    const newItems = items.filter((_, i) => !indexSet.has(i));

    // Clean up object URLs for removed items
    for (const index of indices) {
      const item = items[index];
      if (item && item.url && item.type === 'pdf-page' && item.url.startsWith('blob:')) {
        // Only revoke blob URLs that are unique to this item
        // (image URLs are data URLs, not blob URLs)
      }
    }

    this.reindexItems(newItems);
    return newItems;
  }

  /**
   * Reorder items using CDK moveItemInArray
   */
  reorderItems(items: DocumentItem[], fromIndex: number, toIndex: number): DocumentItem[] {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return items;

    const reordered = [...items];
    const [movedItem] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedItem);
    this.reindexItems(reordered);
    return reordered;
  }

  /**
   * Rotate an item by 90 degrees clockwise
   */
  rotateItem(items: DocumentItem[], index: number): DocumentItem[] {
    const item = items[index];
    if (!item) return items;

    const newRotation = ((item.rotation ?? 0) + 90) % 360;
    return items.map((it, i) =>
      i === index ? { ...it, rotation: newRotation } : it
    );
  }

  /**
   * Duplicate items (add copies after the originals)
   */
  duplicateItems(items: DocumentItem[], indices: number[]): DocumentItem[] {
    const indexSet = new Set(indices);
    const newItems: DocumentItem[] = [];

    for (let i = 0; i < items.length; i++) {
      newItems.push(items[i]);
      if (indexSet.has(i)) {
        const item = items[i];
        const clone: DocumentItem = {
          ...item,
          id: this.generateId(),
          name: `${item.name} (Copy)`,
          rotation: item.rotation,
          selected: false,
        };
        newItems.push(clone);
      }
    }

    this.reindexItems(newItems);
    return newItems;
  }

  /**
   * Toggle selection for a single item (used for Ctrl+Click)
   */
  toggleSelection(items: DocumentItem[], index: number): DocumentItem[] {
    return items.map((item, i) =>
      i === index ? { ...item, selected: !item.selected } : item
    );
  }

  /**
   * Select range of items (used for Shift+Click)
   */
  selectRange(items: DocumentItem[], anchorIndex: number, toIndex: number): DocumentItem[] {
    const start = Math.min(anchorIndex, toIndex);
    const end = Math.max(anchorIndex, toIndex);
    return items.map((item, i) => ({
      ...item,
      selected: i >= start && i <= end,
    }));
  }

  /**
   * Toggle select all items
   */
  selectAll(items: DocumentItem[]): DocumentItem[] {
    const allSelected = items.every((item) => item.selected);
    return items.map((item) => ({ ...item, selected: !allSelected }));
  }

  /**
   * Select or deselect all items
   */
  setSelectionAll(items: DocumentItem[], selected: boolean): DocumentItem[] {
    return items.map((item) => ({ ...item, selected }));
  }

  /**
   * Get selected items
   */
  getSelectedIndices(items: DocumentItem[]): number[] {
    return items.map((item, i) => (item.selected ? i : -1)).filter((i) => i >= 0);
  }

  /**
   * Clear all selections
   */
  clearSelection(items: DocumentItem[]): DocumentItem[] {
    return items.map((item) => ({ ...item, selected: false }));
  }

  /**
   * Delete selected items
   */
  deleteSelected(items: DocumentItem[]): DocumentItem[] {
    const indices = this.getSelectedIndices(items);
    return this.removeItems(items, indices);
  }

  /**
   * Rotate selected items
   */
  rotateSelected(items: DocumentItem[]): DocumentItem[] {
    const indices = this.getSelectedIndices(items);
    let result = [...items];
    for (const index of indices) {
      result = this.rotateItem(result, index);
    }
    return result;
  }

  /**
   * Duplicate selected items
   */
  duplicateSelected(items: DocumentItem[]): DocumentItem[] {
    return this.duplicateItems(items, this.getSelectedIndices(items));
  }

  /**
   * Move an item up by one position
   */
  moveUp(items: DocumentItem[], index: number): DocumentItem[] {
    if (index <= 0) return items;
    return this.reorderItems(items, index, index - 1);
  }

  /**
   * Move an item down by one position
   */
  moveDown(items: DocumentItem[], index: number): DocumentItem[] {
    if (index >= items.length - 1) return items;
    return this.reorderItems(items, index, index + 1);
  }

  /**
   * Validate a queue for generation readiness
   */
  validateQueue(items: DocumentItem[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (items.length === 0) {
      errors.push('Queue is empty. Add at least one item.');
    }

    for (const item of items) {
      if (item.type === 'pdf-page') {
        if (item.pdfPageIndex === undefined) {
          errors.push(`${item.name}: Missing page index.`);
        }
        if (item.sourcePdfPageCount !== undefined && item.pdfPageIndex !== undefined) {
          if (item.pdfPageIndex >= item.sourcePdfPageCount) {
            errors.push(
              `${item.name}: Page index ${item.pdfPageIndex} is out of range (max: ${item.sourcePdfPageCount - 1}).`
            );
          }
        }
      }
      if (!item.url) {
        errors.push(`${item.name}: File data is unavailable.`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Reindex items to ensure order numbers are sequential from 0
   */
  private reindexItems(items: DocumentItem[]): void {
    for (let i = 0; i < items.length; i++) {
      items[i].order = i;
    }
  }

  /**
   * Release thumbnail cache entries
   */
  cleanup(): void {
    this.thumbnailCache.clear();
    this.itemIdCounter = 0;
  }
}