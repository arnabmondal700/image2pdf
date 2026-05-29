/// <reference lib="webworker" />

import { jsPDF } from 'jspdf';
import {
  calculatePageLayout,
  calculateImageDimensions,
  calculateImagePosition,
  coerceImagesPerPage,
  getOrientedPageDimensions,
  sanitizeMargins
} from '../utils/pdf-layout-engine';

interface FileObject {
  name: string;
  type: string;
  size: number;
  url: string;
  rotation?: number; // Rotation angle in degrees (0, 90, 180, 270)
}

interface HeaderFooterConfig {
  enabled: boolean;
  text: string;
  fontSize?: number;
  fontColor?: string;
}

interface HeaderFooterSettings {
  header?: HeaderFooterConfig;
  footer?: HeaderFooterConfig;
}

interface PDFSettings {
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  quality: 'FAST' | 'MEDIUM' | 'SLOW';
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  imageFit?: 'contain' | 'cover' | 'stretch';
  imageAlignment?: 'center' | 'top' | 'bottom';
  backgroundColor?: string;
  imagesPerPage?: 1 | 2 | 4;
  headerFooter?: HeaderFooterSettings;
}

interface ResolvedPDFSettings {
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  quality: 'FAST' | 'MEDIUM' | 'SLOW';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  imageFit: 'contain' | 'cover' | 'stretch';
  imageAlignment: 'center' | 'top' | 'bottom';
  backgroundColor: string;
  imagesPerPage: 1 | 2 | 4;
  headerFooter: HeaderFooterSettings;
}

interface GeneratePDFMessage {
  files: FileObject[];
  settings: PDFSettings;
  fileName: string;
}

interface ProgressMessage {
  type: 'progress';
  current: number;
  total: number;
  status: string;
}

interface CompletionMessage {
  type: 'complete';
  pdfData: string; // base64 encoded
}

interface ErrorMessage {
  type: 'error';
  error: string;
}

type WorkerMessage = ProgressMessage | CompletionMessage | ErrorMessage;

addEventListener('message', async ({ data }: MessageEvent<GeneratePDFMessage>) => {
  try {
    const { files, settings, fileName } = data;
    await generatePDFInWorker(files, settings, fileName);
  } catch (error) {
    const errorMessage: ErrorMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    postMessage(errorMessage);
  }
});

async function generatePDFInWorker(
  uploadedFiles: FileObject[],
  settings: PDFSettings,
  fileName: string
): Promise<void> {
  if (uploadedFiles.length === 0) {
    const errorMessage: ErrorMessage = {
      type: 'error',
      error: 'No files provided'
    };
    postMessage(errorMessage);
    return;
  }

  try {
    const finalSettings = resolveSettings(settings);
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
    let currentPage = 1;

    // Calculate total pages upfront for header/footer {totalPages} variable
    const totalPages = Math.ceil(uploadedFiles.length / finalSettings.imagesPerPage);

    while (currentFileIndex < uploadedFiles.length) {
      if (!isFirstPage) {
        pdf.addPage();
      }
      isFirstPage = false;

      fillPageBackground(pdf, pageDims.width, pageDims.height, finalSettings.backgroundColor);

      // Render header and footer after background but before images
      renderHeaderFooter(
        pdf,
        pageDims.width,
        pageDims.height,
        safeMargins,
        currentPage,
        totalPages,
        fileName,
        finalSettings.headerFooter
      );

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

        addImageToCell(pdf, fileData.url, imgProps.fileType, position, imageDims, cell, finalSettings, fileData.rotation || 0);

        currentFileIndex++;

        const progressMessage: ProgressMessage = {
          type: 'progress',
          current: currentFileIndex,
          total: uploadedFiles.length,
          status:
            currentFileIndex === uploadedFiles.length
              ? 'Finalizing PDF'
              : `Processed ${currentFileIndex} of ${uploadedFiles.length} images`
        };
        postMessage(progressMessage);
      }

      // Increment page counter for next iteration
      currentPage++;

      // Allow other tasks to run
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Convert PDF to base64
    const pdfOutput = pdf.output('datauristring');
    const base64Data = pdfOutput.split(',')[1];

    const completionMessage: CompletionMessage = {
      type: 'complete',
      pdfData: base64Data
    };
    postMessage(completionMessage);
  } catch (error) {
    const errorMessage: ErrorMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'PDF generation failed'
    };
    postMessage(errorMessage);
  }
}

function resolveSettings(settings: PDFSettings): ResolvedPDFSettings {
  return {
    pageSize: settings.pageSize,
    orientation: settings.orientation,
    quality: settings.quality,
    marginTop: coerceMargin(settings.marginTop, 8),
    marginBottom: coerceMargin(settings.marginBottom, 8),
    marginLeft: coerceMargin(settings.marginLeft, 8),
    marginRight: coerceMargin(settings.marginRight, 8),
    imageFit: settings.imageFit ?? 'contain',
    imageAlignment: settings.imageAlignment ?? 'center',
    backgroundColor: coerceHexColor(settings.backgroundColor),
    imagesPerPage: coerceImagesPerPage(settings.imagesPerPage),
    headerFooter: resolveHeaderFooterSettings(settings.headerFooter)
  };
}

function coerceMargin(value: unknown, fallback: number): number {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : fallback;
}

function coerceHexColor(value: unknown): string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff';
}

function resolveHeaderFooterSettings(settings: Partial<HeaderFooterSettings> | undefined): HeaderFooterSettings {
  const defaultConfig: HeaderFooterConfig = {
    enabled: false,
    text: '',
    fontSize: 10,
    fontColor: '#000000'
  };

  return {
    header: settings?.header ? resolveHeaderFooterConfig(settings.header) : defaultConfig,
    footer: settings?.footer ? resolveHeaderFooterConfig(settings.footer) : defaultConfig
  };
}

function resolveHeaderFooterConfig(config: Partial<HeaderFooterConfig> | undefined): HeaderFooterConfig {
  if (!config) {
    return { enabled: false, text: '', fontSize: 10, fontColor: '#000000' };
  }

  const fontSize = Number(config.fontSize);
  const size = Number.isFinite(fontSize) ? Math.max(8, Math.min(14, fontSize)) : 10;

  return {
    enabled: Boolean(config.enabled),
    text: String(config.text || ''),
    fontSize: size,
    fontColor: coerceHexColor(config.fontColor)
  };
}

function replaceHeaderFooterVariables(
  text: string,
  currentPage: number,
  totalPages: number,
  fileName: string
): string {
  const today = new Date();
  const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  const filenameWithoutExt = fileName.replace(/\.[^/.]+$/, '');

  return text
    .replace(/{date}/g, dateString)
    .replace(/{page}/g, String(currentPage))
    .replace(/{totalPages}/g, String(totalPages))
    .replace(/{filename}/g, filenameWithoutExt);
}

function fillPageBackground(pdf: jsPDF, pageWidth: number, pageHeight: number, color: string): void {
  pdf.setFillColor(color);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');
}

function renderHeaderFooter(
  pdf: jsPDF,
  pageWidth: number,
  pageHeight: number,
  margins: { top: number; bottom: number; left: number; right: number },
  currentPage: number,
  totalPages: number,
  fileName: string,
  headerFooterSettings: HeaderFooterSettings
): void {
  const { header, footer } = headerFooterSettings;

  // Render header
  if (header?.enabled && header.text) {
    const headerText = replaceHeaderFooterVariables(header.text, currentPage, totalPages, fileName);
    pdf.setFontSize(header.fontSize || 10);
    const [r, g, b] = hexToRgb(header.fontColor || '#000000');
    pdf.setTextColor(r, g, b);
    pdf.text(headerText, margins.left + 5, margins.top - 2, { maxWidth: pageWidth - margins.left - margins.right - 10 });
  }

  // Render footer
  if (footer?.enabled && footer.text) {
    const footerText = replaceHeaderFooterVariables(footer.text, currentPage, totalPages, fileName);
    pdf.setFontSize(footer.fontSize || 10);
    const [r, g, b] = hexToRgb(footer.fontColor || '#000000');
    pdf.setTextColor(r, g, b);
    pdf.text(footerText, margins.left + 5, pageHeight - margins.bottom + 2, { maxWidth: pageWidth - margins.left - margins.right - 10 });
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    return [0, 0, 0];
  }
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}

function addImageToCell(
  pdf: jsPDF,
  imageData: string,
  imageType: string,
  position: { x: number; y: number },
  imageDims: { width: number; height: number },
  cell: { x: number; y: number; width: number; height: number },
  settings: ResolvedPDFSettings,
  rotation: number = 0
): void {
  const addImage = (imageUrl: string) => {
    pdf.addImage(imageUrl, imageType, position.x, position.y, imageDims.width, imageDims.height, undefined, settings.quality);
  };

  if (settings.imageFit !== 'cover') {
    // For non-cover mode, add image normally (rotation handled via canvas preprocessing if needed)
    addImage(imageData);
    return;
  }

  pdf.saveGraphicsState();
  pdf.rect(cell.x, cell.y, cell.width, cell.height);
  pdf.clip();
  pdf.discardPath();
  addImage(imageData);
  pdf.restoreGraphicsState();
}
