import { Injectable, inject } from '@angular/core';
import { jsPDF } from 'jspdf';
import { FileObject } from './file.service';
import { PDFGenerationCancelledError, PdfWorkerService } from './pdf-worker.service';
import { PdfProtectionService } from './pdf-protection.service';
import {
  calculatePageLayout,
  calculateImageDimensions,
  calculateImagePosition,
  coerceImagesPerPage,
  getOrientedPageDimensions,
  sanitizeMargins
} from '../utils/pdf-layout-engine';

export type PDFPageSize = 'a4' | 'letter' | 'legal';
export type PDFOrientation = 'portrait' | 'landscape';
export type PDFQuality = 'FAST' | 'MEDIUM' | 'SLOW';
export type PDFImageFit = 'contain' | 'cover' | 'stretch';
export type PDFImageAlignment = 'center' | 'top' | 'bottom';
export type PDFImagesPerPage = 1 | 2 | 4;
export type ExportMode = 'single-pdf' | 'separate-pdfs' | 'zip';

export interface HeaderFooterConfig {
  enabled: boolean;
  text: string;
  fontSize?: number;
  fontColor?: string;
}

export interface HeaderFooterSettings {
  header?: HeaderFooterConfig;
  footer?: HeaderFooterConfig;
}

export interface PDFSettings {
  pageSize: PDFPageSize;
  orientation: PDFOrientation;
  quality: PDFQuality;
  dpi?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  imageFit?: PDFImageFit;
  imageAlignment?: PDFImageAlignment;
  backgroundColor?: string;
  imagesPerPage?: PDFImagesPerPage;
  headerFooter?: HeaderFooterSettings;
  exportMode?: ExportMode;
  /** Optional password protection applied after PDF generation */
  passwordProtection?: {
    userPassword: string;
    ownerPassword?: string;
  };
}

interface ResolvedPDFSettings {
  pageSize: PDFPageSize;
  orientation: PDFOrientation;
  quality: PDFQuality;
  dpi: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  imageFit: PDFImageFit;
  imageAlignment: PDFImageAlignment;
  backgroundColor: string;
  imagesPerPage: PDFImagesPerPage;
  headerFooter: HeaderFooterSettings;
  exportMode: ExportMode;
}

@Injectable({
  providedIn: 'root'
})
export class PDFService {
  constructor(
    private workerService: PdfWorkerService,
    private protectionService: PdfProtectionService
  ) {}
  /**
   * Generate PDF from uploaded images and trigger download
   * Uses Web Worker if available for better performance, falls back to main thread
   */
  async generatePDF(
    uploadedFiles: FileObject[],
    fileName: string = 'My_Converted_Images.pdf',
    settings: PDFSettings = { 
      pageSize: 'a4', 
      orientation: 'portrait', 
      quality: 'MEDIUM',
      dpi: 300,
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 8,
      marginRight: 8,
      imageFit: 'contain',
      imageAlignment: 'center',
      backgroundColor: '#ffffff',
      imagesPerPage: 1,
      headerFooter: {
        header: {
          enabled: false,
          text: '',
          fontSize: 10,
          fontColor: '#000000'
        },
        footer: {
          enabled: false,
          text: '',
          fontSize: 10,
          fontColor: '#000000'
        }
      },
      exportMode: 'single-pdf'
    }
  ): Promise<void> {
    console.log('[PDF-Service] generatePDF() — ENTERED');
    console.log('[PDF-Service] generatePDF() — files count:', uploadedFiles.length);
    console.log('[PDF-Service] generatePDF() — fileName:', fileName);
    console.log('[PDF-Service] generatePDF() — passwordProtection:', settings.passwordProtection ? {
      hasUserPassword: !!settings.passwordProtection.userPassword,
      userPasswordLen: settings.passwordProtection.userPassword?.length,
      hasOwnerPassword: !!settings.passwordProtection.ownerPassword
    } : 'NOT SET');

    if (uploadedFiles.length === 0) {
      console.log('[PDF-Service] generatePDF() — no files, returning');
      return;
    }

    // Generate the PDF blob (worker or main thread)
    console.log('[PDF-Service] generatePDF() — calling createPDFBlob...');
    const pdfBlob = await this.createPDFBlob(uploadedFiles, settings);
    console.log('[PDF-Service] generatePDF() — pdfBlob size:', pdfBlob.size);

    // Apply password protection if configured
    let finalBlob = pdfBlob;
    if (settings.passwordProtection?.userPassword) {
      console.log('[PDF-Service] generatePDF() — password protection ENABLED, calling addPassword...');
      try {
        const tempUrl = URL.createObjectURL(pdfBlob);
        const fileObj = { 
          name: fileName, 
          type: 'application/pdf', 
          size: pdfBlob.size, 
          url: tempUrl 
        } as FileObject;
        console.log('[PDF-Service] generatePDF() — constructed FileObject:', { name: fileObj.name, size: fileObj.size, urlPrefix: fileObj.url?.slice(0, 60) });
        
        const protectedResult = await this.protectionService.addPassword(
          fileObj,
          {
            userPassword: settings.passwordProtection.userPassword,
            ownerPassword: settings.passwordProtection.ownerPassword
          }
        );
        console.log('[PDF-Service] generatePDF() — addPassword succeeded, protected blob size:', protectedResult.blob.size);
        finalBlob = protectedResult.blob;
        URL.revokeObjectURL(tempUrl);
      } catch (error) {
        console.error('[PDF-Service] generatePDF() — addPassword FAILED, downloading unprotected PDF:', error);
      }
    } else {
      console.log('[PDF-Service] generatePDF() — password protection NOT enabled, skipping encryption');
    }

    // Download the final blob
    console.log('[PDF-Service] generatePDF() — downloading final blob, size:', finalBlob.size, 'name:', fileName);
    this.downloadBlob(finalBlob, fileName);
    console.log('[PDF-Service] generatePDF() — download complete');
  }

  /**
   * Create a PDF blob from uploaded images (raw, unencrypted).
   * Used for preview and ZIP export. Password protection is applied
   * separately in generatePDF() for the final download.
   */
  async createPDFBlob(uploadedFiles: FileObject[], settings: PDFSettings): Promise<Blob> {
    if (uploadedFiles.length === 0) {
      return new Blob([], { type: 'application/pdf' });
    }

    // Try to use Web Worker if available
    if (this.workerService.isWorkerSupported()) {
      try {
        return await this.workerService.generatePDFBlob(
          uploadedFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            url: f.url
          })),
          settings
        );
      } catch (error) {
        if (error instanceof PDFGenerationCancelledError) {
          throw error;
        }
        console.error('Worker blob generation failed, falling back to main thread:', error);
        // Fall through to main thread generation
      }
    }

    return this.createPDF(uploadedFiles, settings).output('blob');
  }

  /**
   * Download a blob as a file
   */
  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private createPDF(uploadedFiles: FileObject[], settings: PDFSettings): jsPDF {
    const finalSettings = this.resolveSettings(settings);

    try {
      const pdf = new jsPDF({
        orientation: finalSettings.orientation,
        unit: 'mm',
        format: finalSettings.pageSize
      });

      const pageDims = getOrientedPageDimensions(finalSettings.pageSize, finalSettings.orientation);
      const safeMargins = sanitizeMargins(
        {
          top: finalSettings.marginTop,
          bottom: finalSettings.marginBottom,
          left: finalSettings.marginLeft,
          right: finalSettings.marginRight
        },
        pageDims.width,
        pageDims.height
      );
      const pageLayout = calculatePageLayout(
        finalSettings.imagesPerPage,
        pageDims.width,
        pageDims.height,
        safeMargins,
        4
      );

      let currentFileIndex = 0;
      let isFirstPage = true;

      while (currentFileIndex < uploadedFiles.length) {
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;
        this.fillPageBackground(pdf, pageDims.width, pageDims.height, finalSettings.backgroundColor);

        for (let cellIndex = 0; cellIndex < pageLayout.length && currentFileIndex < uploadedFiles.length; cellIndex++) {
          const cell = pageLayout[cellIndex];
          const fileData = uploadedFiles[currentFileIndex];
          const imgProps = pdf.getImageProperties(fileData.url);

          const imageDims = calculateImageDimensions(
            cell.width,
            cell.height,
            imgProps.width,
            imgProps.height,
            finalSettings.imageFit
          );

          const position = calculateImagePosition(
            cell.x,
            cell.y,
            cell.width,
            cell.height,
            imageDims.width,
            imageDims.height,
            finalSettings.imageAlignment
          );

          this.addImageToCell(
            pdf,
            fileData.url,
            imgProps.fileType,
            position,
            imageDims,
            cell,
            finalSettings
          );

          currentFileIndex++;
        }
      }

      return pdf;
    } catch (error) {
      throw error;
    }
  }

  private resolveSettings(settings: PDFSettings): ResolvedPDFSettings {
    return {
      pageSize: settings.pageSize,
      orientation: settings.orientation,
      quality: settings.quality,
      dpi: this.coerceDpi(settings.dpi),
      marginTop: this.coerceMargin(settings.marginTop, 8),
      marginBottom: this.coerceMargin(settings.marginBottom, 8),
      marginLeft: this.coerceMargin(settings.marginLeft, 8),
      marginRight: this.coerceMargin(settings.marginRight, 8),
      imageFit: settings.imageFit ?? 'contain',
      imageAlignment: settings.imageAlignment ?? 'center',
      backgroundColor: this.coerceHexColor(settings.backgroundColor),
      imagesPerPage: coerceImagesPerPage(settings.imagesPerPage),
      headerFooter: {
        header: settings.headerFooter?.header || { enabled: false, text: '', fontSize: 10, fontColor: '#000000' },
        footer: settings.headerFooter?.footer || { enabled: false, text: '', fontSize: 10, fontColor: '#000000' }
      },
      exportMode: settings.exportMode ?? 'single-pdf'
    };
  }

  private coerceMargin(value: unknown, fallback: number): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.max(0, numericValue) : fallback;
  }

  /**
   * Coerce DPI to a valid number between 72 and 600.
   * Returns 300 (standard print resolution) as the default.
   */
  private coerceDpi(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.min(600, Math.max(72, numericValue)) : 300;
  }

  private coerceHexColor(value: unknown): string {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff';
  }

  private fillPageBackground(pdf: jsPDF, pageWidth: number, pageHeight: number, color: string): void {
    pdf.setFillColor(color);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  }

  private addImageToCell(
    pdf: jsPDF,
    imageData: string,
    imageType: string,
    position: { x: number; y: number },
    imageDims: { width: number; height: number },
    cell: { x: number; y: number; width: number; height: number },
    settings: ResolvedPDFSettings
  ): void {
    const addImage = (url: string) => {
      pdf.addImage(
        url,
        imageType,
        position.x,
        position.y,
        imageDims.width,
        imageDims.height,
        undefined,
        settings.quality
      );
    };

    // Resize the image to the target DPI before embedding.
    // A4 page width = 210 mm ≈ 8.27 inches; at the given DPI
    // that means max image width = 8.27 × DPI pixels.
    const maxDimPx = Math.round(8.27 * settings.dpi);
    const finalUrl = this.resizeImageForDPI(imageData, maxDimPx);

    if (settings.imageFit !== 'cover') {
      addImage(finalUrl);
      return;
    }

    pdf.saveGraphicsState();
    pdf.rect(cell.x, cell.y, cell.width, cell.height);
    pdf.clip();
    pdf.discardPath();
    addImage(finalUrl);
    pdf.restoreGraphicsState();
  }

  /**
   * Resize an image (data URL) so its longest dimension does not exceed
   * `maxDimensionPx`.  If the image is already smaller, it is returned
   * unchanged.  Uses an off-screen canvas for the downscale.
   */
  private resizeImageForDPI(dataUrl: string, maxDimensionPx: number): string {
    // If the URL is not a data URL we can't resize it easily
    if (!dataUrl.startsWith('data:')) {
      return dataUrl;
    }

    try {
      // Create a synchronous-ish image resize via an off-screen canvas.
      // This is a best-effort optimization; if anything fails we fall
      // back to the original image data.
      const img = new Image();
      img.src = dataUrl;

      // When the image is already decoded (cached data URLs resolve
      // almost immediately) we can proceed.
      if (!img.complete || img.naturalWidth === 0) {
        return dataUrl;
      }

      const longest = Math.max(img.naturalWidth, img.naturalHeight);
      if (longest <= maxDimensionPx) {
        return dataUrl;
      }

      const scale = maxDimensionPx / longest;
      const targetW = Math.max(1, Math.round(img.naturalWidth * scale));
      const targetH = Math.max(1, Math.round(img.naturalHeight * scale));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return dataUrl;

      ctx.drawImage(img, 0, 0, targetW, targetH);
      return canvas.toDataURL('image/jpeg', 0.92);
    } catch {
      return dataUrl;
    }
  }
}
