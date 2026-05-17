/**
 * PDF Layout Engine - Pure utility for calculating image placement on PDF pages
 * No Angular dependencies - can be unit tested independently
 */

export interface PageSize {
  width: number;
  height: number;
}

export interface Margins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface LayoutCell {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageLayout {
  cells: LayoutCell[];
}

const SUPPORTED_IMAGES_PER_PAGE = [1, 2, 4] as const;

/**
 * Get dimensions for common page sizes in millimeters
 */
export function getPageDimensions(pageSize: 'a4' | 'letter' | 'legal'): PageSize {
  const sizes: Record<string, PageSize> = {
    'a4': { width: 210, height: 297 },
    'letter': { width: 215.9, height: 279.4 },
    'legal': { width: 215.9, height: 355.6 }
  };
  return sizes[pageSize];
}

/**
 * Adjust page dimensions based on orientation
 */
export function getOrientedPageDimensions(
  pageSize: 'a4' | 'letter' | 'legal',
  orientation: 'portrait' | 'landscape'
): PageSize {
  const dims = getPageDimensions(pageSize);
  if (orientation === 'landscape') {
    return { width: dims.height, height: dims.width };
  }
  return dims;
}

/**
 * Calculate layout for images on a page
 */
export function calculatePageLayout(
  imagesPerPage: number,
  pageWidth: number,
  pageHeight: number,
  margins: Margins,
  gutterSize: number = 4
): LayoutCell[] {
  const safeImagesPerPage = coerceImagesPerPage(imagesPerPage);
  const safeMargins = sanitizeMargins(margins, pageWidth, pageHeight);
  const availableWidth = pageWidth - safeMargins.left - safeMargins.right;
  const availableHeight = pageHeight - safeMargins.top - safeMargins.bottom;

  if (safeImagesPerPage === 1) {
    return [{
      x: safeMargins.left,
      y: safeMargins.top,
      width: availableWidth,
      height: availableHeight
    }];
  }

  if (safeImagesPerPage === 2) {
    // 2-up layout: 2 columns, 1 row
    const cellWidth = (availableWidth - gutterSize) / 2;
    const cellHeight = availableHeight;

    return [
      {
        x: safeMargins.left,
        y: safeMargins.top,
        width: cellWidth,
        height: cellHeight
      },
      {
        x: safeMargins.left + cellWidth + gutterSize,
        y: safeMargins.top,
        width: cellWidth,
        height: cellHeight
      }
    ];
  }

  if (safeImagesPerPage === 4) {
    // 4-up layout: 2x2 grid
    const cellWidth = (availableWidth - gutterSize) / 2;
    const cellHeight = (availableHeight - gutterSize) / 2;

    return [
      // Row 1
      {
        x: safeMargins.left,
        y: safeMargins.top,
        width: cellWidth,
        height: cellHeight
      },
      {
        x: safeMargins.left + cellWidth + gutterSize,
        y: safeMargins.top,
        width: cellWidth,
        height: cellHeight
      },
      // Row 2
      {
        x: safeMargins.left,
        y: safeMargins.top + cellHeight + gutterSize,
        width: cellWidth,
        height: cellHeight
      },
      {
        x: safeMargins.left + cellWidth + gutterSize,
        y: safeMargins.top + cellHeight + gutterSize,
        width: cellWidth,
        height: cellHeight
      }
    ];
  }

  // Default to 1-up if imagesPerPage is not supported
  return [{
    x: safeMargins.left,
    y: safeMargins.top,
    width: availableWidth,
    height: availableHeight
  }];
}

export function coerceImagesPerPage(value: unknown): 1 | 2 | 4 {
  const numericValue = Number(value);
  return SUPPORTED_IMAGES_PER_PAGE.includes(numericValue as 1 | 2 | 4)
    ? numericValue as 1 | 2 | 4
    : 1;
}

export function sanitizeMargins(
  margins: Partial<Margins>,
  pageWidth: number,
  pageHeight: number,
  minPrintableSize: number = 10
): Margins {
  const safeMargins: Margins = {
    top: coerceNonNegativeNumber(margins.top),
    bottom: coerceNonNegativeNumber(margins.bottom),
    left: coerceNonNegativeNumber(margins.left),
    right: coerceNonNegativeNumber(margins.right)
  };

  scaleMarginPair(safeMargins, 'left', 'right', Math.max(0, pageWidth - minPrintableSize));
  scaleMarginPair(safeMargins, 'top', 'bottom', Math.max(0, pageHeight - minPrintableSize));

  return safeMargins;
}

function coerceNonNegativeNumber(value: unknown): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
}

function scaleMarginPair(
  margins: Margins,
  firstKey: keyof Margins,
  secondKey: keyof Margins,
  maxCombinedValue: number
): void {
  const combinedValue = margins[firstKey] + margins[secondKey];

  if (combinedValue <= maxCombinedValue || combinedValue === 0) {
    return;
  }

  const scale = maxCombinedValue / combinedValue;
  margins[firstKey] *= scale;
  margins[secondKey] *= scale;
}

/**
 * Calculate image dimensions within a cell, maintaining aspect ratio
 */
export function calculateImageDimensions(
  cellWidth: number,
  cellHeight: number,
  imageWidth: number,
  imageHeight: number,
  fitMode: 'contain' | 'cover' | 'stretch' = 'contain'
): { width: number; height: number; scale: number } {
  if (fitMode === 'stretch') {
    return { width: cellWidth, height: cellHeight, scale: 1 };
  }

  const imageAspectRatio = imageWidth / imageHeight;
  const cellAspectRatio = cellWidth / cellHeight;

  if (fitMode === 'cover') {
    // Image fills the cell, may be cropped
    if (imageAspectRatio > cellAspectRatio) {
      const scale = cellHeight / imageHeight;
      return { width: imageWidth * scale, height: cellHeight, scale };
    } else {
      const scale = cellWidth / imageWidth;
      return { width: cellWidth, height: imageHeight * scale, scale };
    }
  }

  // Contain mode (default)
  const scale = Math.min(cellWidth / imageWidth, cellHeight / imageHeight);
  return { width: imageWidth * scale, height: imageHeight * scale, scale };
}

/**
 * Calculate position within a cell based on alignment
 */
export function calculateImagePosition(
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  imageWidth: number,
  imageHeight: number,
  alignment: 'center' | 'top' | 'bottom' = 'center'
): { x: number; y: number } {
  const x = cellX + (cellWidth - imageWidth) / 2;

  let y: number;
  if (alignment === 'bottom') {
    y = cellY + (cellHeight - imageHeight);
  } else if (alignment === 'top') {
    y = cellY;
  } else {
    // center
    y = cellY + (cellHeight - imageHeight) / 2;
  }

  return { x, y };
}
