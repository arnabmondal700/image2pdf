/**
 * Document Item Model - Shared data contract for Mixed PDF Builder
 * Represents a single item (image or PDF page) in the mixed document queue
 */

export type DocumentItemType = 'image' | 'pdf-page';

/**
 * A single item in the mixed document queue.
 * Supports both image files and individual PDF page references.
 */
export interface DocumentItem {
  /** Unique identifier for this queue item */
  readonly id: string;

  /** Type of document item */
  type: DocumentItemType;

  /** Display name shown in UI (e.g., "image1.jpg", "contract.pdf Page 3") */
  name: string;

  /** Display order in the queue (0-based) */
  order: number;

  /** Thumbnail data URL for UI preview */
  thumbnail?: string;

  /** Rotation angle in degrees (0, 90, 180, 270) */
  rotation?: number;

  /** Whether this item is currently selected for batch operations */
  selected?: boolean;

  /** Original image File object (for image-type items) */
  imageFile?: File;

  /** Original PDF File object reference (for pdf-page items) */
  pdfFile?: File;

  /** 0-based page index within the source PDF (for pdf-page items) */
  pdfPageIndex?: number;

  /** Display width of the page/document in points (for sizing thumbnails) */
  width?: number;

  /** Display height of the page/document in points (for sizing thumbnails) */
  height?: number;

  /** Original PDF filename (for display, e.g., "contract.pdf") */
  originalPdfName?: string;

  /** Object URL or data URL for rendering in the UI */
  url?: string;

  /** MIME type of the item */
  mimeType?: string;

  /** Number of total pages in source PDF (for pdf-page items) */
  sourcePdfPageCount?: number;
}