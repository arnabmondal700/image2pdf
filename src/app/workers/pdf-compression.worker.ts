/// <reference lib="webworker" />

import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

type CompressionLevel = 'low' | 'medium' | 'high';

interface CompressMessage {
  type: 'compress';
  pdfBytes: Uint8Array;
  level: CompressionLevel;
  jpegQuality: number;
  pageCount: number;
}

interface AbortMessage {
  type: 'abort';
}

type WorkerInputMessage = CompressMessage | AbortMessage;

interface ProgressMessage {
  type: 'progress';
  current: number;
  total: number;
  status: string;
}

interface CompleteMessage {
  type: 'complete';
  compressedBytes: Uint8Array;
}

interface ErrorMessage {
  type: 'error';
  error: string;
}

type WorkerOutputMessage = ProgressMessage | CompleteMessage | ErrorMessage;

let aborted = false;

addEventListener('message', ({ data }: MessageEvent<WorkerInputMessage>) => {
  if (data.type === 'abort') {
    aborted = true;
    return;
  }

  aborted = false;

  compressInWorker(data.pdfBytes, data.level, data.jpegQuality, data.pageCount).catch((error) => {
    const errorMessage: ErrorMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Compression failed'
    };
    postMessage(errorMessage);
  });
});

async function compressInWorker(
  pdfBytes: Uint8Array,
  level: CompressionLevel,
  jpegQuality: number,
  pageCount: number
): Promise<void> {
  try {
    if (aborted) return;

    if (level === 'low') {
      await compressLow(pdfBytes, pageCount);
    } else {
      await compressByRendering(pdfBytes, jpegQuality, pageCount);
    }
  } catch (error) {
    if (aborted) return;
    const errorMessage: ErrorMessage = {
      type: 'error',
      error: error instanceof Error ? error.message : 'Compression failed'
    };
    postMessage(errorMessage);
  }
}

/**
 * LOW compression: re-save with pdf-lib (strips metadata, normalizes structure)
 */
async function compressLow(pdfBytes: Uint8Array, pageCount: number): Promise<void> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  // Remove metadata to reduce size
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');

  postMessage({ type: 'progress', current: 1, total: 1, status: 'Re-saving PDF structure' } satisfies ProgressMessage);

  const compressedBytes = await pdfDoc.save();

  const completeMessage: CompleteMessage = {
    type: 'complete',
    compressedBytes: new Uint8Array(compressedBytes)
  };
  postMessage(completeMessage);
}

/**
 * MEDIUM/HIGH compression: render each page to OffscreenCanvas, convert to JPEG,
 * then build a new PDF with pdf-lib.
 */
async function compressByRendering(
  pdfBytes: Uint8Array,
  jpegQuality: number,
  pageCount: number
): Promise<void> {
  const pdf = await pdfjsLib.getDocument({ data: pdfBytes.slice(0) }).promise;
  const newPdf = await PDFDocument.create();

  const totalPages = pdf.numPages;

  for (let i = 1; i <= totalPages; i++) {
    if (aborted) return;

    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1.5 });

    // Render page to offscreen canvas
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not create 2D offscreen canvas context');
    }

    await page.render({ canvasContext: ctx as unknown as any, viewport } as any).promise;

    // Convert canvas to JPEG blob
    const jpegBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality: jpegQuality });

    // Convert blob to Uint8Array
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());

    // Embed JPEG image into new PDF
    const embeddedImage = await newPdf.embedJpg(jpegBytes);

    // Add page with same dimensions as the rendered viewport
    const pdfPage = newPdf.addPage([viewport.width, viewport.height]);
    pdfPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: viewport.width,
      height: viewport.height
    });

    // Clean up canvas
    canvas.width = 0;
    canvas.height = 0;

    postMessage({
      type: 'progress',
      current: i,
      total: totalPages,
      status: `Compressed page ${i} of ${totalPages}`
    } satisfies ProgressMessage);

    // Yield to allow abort message to be received
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  if (aborted) return;

  const compressedBytes = await newPdf.save();

  const completeMessage: CompleteMessage = {
    type: 'complete',
    compressedBytes: new Uint8Array(compressedBytes)
  };
  postMessage(completeMessage);
}