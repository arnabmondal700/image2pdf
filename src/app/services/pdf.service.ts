import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import { FileObject } from './file.service';
import { PDFGenerationCancelledError, PdfWorkerService } from './pdf-worker.service';
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
}

interface ResolvedPDFSettings {
  pageSize: PDFPageSize;
  orientation: PDFOrientation;
  quality: PDFQuality;
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
  constructor(private workerService: PdfWorkerService) {}
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
    if (uploadedFiles.length === 0) {
      return;
    }

    // Try to use Web Worker if available
    if (this.workerService.isWorkerSupported()) {
      try {
        await this.workerService.generatePDF(
          uploadedFiles.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            url: f.url
          })),
          settings,
          fileName
        );
        return;
      } catch (error) {
        if (error instanceof PDFGenerationCancelledError) {
          throw error;
        }
        console.error('Worker generation failed, falling back to main thread:', error);
        // Fall through to main thread generation
      }
    }

    // Fallback to main thread generation
    const pdf = this.createPDF(uploadedFiles, settings);
    pdf.save(fileName);
  }

  /**
   * Create a PDF blob from uploaded images
   * Uses Web Worker if available for better performance
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

    // Fallback to main thread generation
    return this.createPDF(uploadedFiles, settings).output('blob');
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
    const addImage = () => {
      pdf.addImage(
        imageData,
        imageType,
        position.x,
        position.y,
        imageDims.width,
        imageDims.height,
        undefined,
        settings.quality
      );
    };

    if (settings.imageFit !== 'cover') {
      addImage();
      return;
    }

    pdf.saveGraphicsState();
    pdf.rect(cell.x, cell.y, cell.width, cell.height);
    pdf.clip();
    pdf.discardPath();
    addImage();
    pdf.restoreGraphicsState();
  }
}
