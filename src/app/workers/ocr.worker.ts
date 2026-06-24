/// <reference lib="webworker" />

import { PdfToImageService } from '../services/pdf-to-image.service';

export interface OcrStartMessage {
  type: 'start';
  file: {
    name: string;
    type: string;
    size: number;
    url: string;
  };
  options: {
    language?: string;
    preserveLayout?: boolean;
  };
}

export interface OcrCancelMessage {
  type: 'cancel';
}

export interface OcrProgressMessage {
  type: 'progress';
  current: number;
  total: number;
  status: string;
}

export interface OcrCompleteMessage {
  type: 'complete';
  pages: Array<{
    pageNumber: number;
    text: string;
    confidence: number;
  }>;
  totalPages: number;
  durationMs: number;
}

export interface OcrErrorMessage {
  type: 'error';
  message: string;
}

export type OcrWorkerRequest = OcrStartMessage | OcrCancelMessage;
export type OcrWorkerMessage = OcrProgressMessage | OcrCompleteMessage | OcrErrorMessage;

let cancelRequested = false;
let activeTesseractWorker: { terminate: () => Promise<unknown> } | null = null;

addEventListener('message', async (event: MessageEvent<OcrWorkerRequest>) => {
  const data = event.data;

  if (data.type === 'cancel') {
    cancelRequested = true;
    await terminateActiveTesseractWorker();
    postMessage({ type: 'error', message: 'OCR cancelled' } satisfies OcrErrorMessage);
    return;
  }

  cancelRequested = false;

  try {
    const pdfToImageService = new PdfToImageService();
    const startTime = performance.now();

    const imageFiles = await renderInputToImageFiles(pdfToImageService, data.file);
    throwIfCancelled();

    const total = imageFiles.length;
    sendProgress(0, total, 'Starting OCR...');

    const pages: Array<{ pageNumber: number; text: string; confidence: number }> = [];

    for (let i = 0; i < total; i++) {
      throwIfCancelled();
      const imageFile = imageFiles[i];
      sendProgress(i, total, `Recognizing page ${i + 1} of ${total}...`);

      const result = await recognizeImageFile(
        imageFile,
        data.options.language || 'eng',
        data.options.preserveLayout ?? true,
        i,
        total
      );
      pages.push({
        pageNumber: i + 1,
        ...result
      });
    }

    const durationMs = performance.now() - startTime;

    postMessage({
      type: 'complete',
      pages,
      totalPages: pages.length,
      durationMs
    } satisfies OcrCompleteMessage);
  } catch (error) {
    postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unknown OCR error'
    } satisfies OcrErrorMessage);
  } finally {
    await terminateActiveTesseractWorker();
  }
});

interface OcrPageResult {
  text: string;
  confidence: number;
}

function sendProgress(current: number, total: number, status: string): void {
  postMessage({
    type: 'progress',
    current,
    total,
    status
  } satisfies OcrProgressMessage);
}

function throwIfCancelled(): void {
  if (cancelRequested) {
    throw new Error('OCR cancelled');
  }
}

async function renderInputToImageFiles(service: PdfToImageService, file: { name: string; type: string; size: number; url: string }) {
  const type = (file.type || '').toLowerCase();

  if (type.includes('pdf')) {
    const images = await service.convertToImages(
      {
        name: file.name,
        type: file.type,
        size: file.size,
        url: file.url
      },
      {
        pageRange: 'all',
        format: 'png',
        jpegQuality: 0.92,
        scale: 2,
        outputMode: 'individual'
      }
    );

    return images.map((img) => ({
      name: img.name,
      type: 'image/png',
      size: img.blob.size,
      url: img.dataUrl
    }));
  }

  return [file];
}

async function recognizeImageFile(
  file: { name: string; type: string; size: number; url: string },
  language: string,
  preserveLayout: boolean,
  pageIndex: number,
  totalPages: number
): Promise<OcrPageResult> {
  const tesseract = await import('tesseract.js');
  const worker = await (tesseract as any).createWorker(language, undefined, {
    logger: (message: { progress?: number; status?: string }) => {
      if (!message.status) {
        return;
      }
      const percent = typeof message.progress === 'number' ? ` ${Math.round(message.progress * 100)}%` : '';
      sendProgress(pageIndex, totalPages, `${message.status}${percent}`);
    }
  });
  activeTesseractWorker = worker;

  try {
    throwIfCancelled();
    if (preserveLayout) {
      await worker.setParameters({ preserve_interword_spaces: '1' });
    }

    const imageUrl = file.url.startsWith('data:') ? file.url : await fileUrlToDataUrl(file.url);
    const result = await worker.recognize(imageUrl);
    const text = (result.data.text || '').trim();
    const confidence = typeof result.data.confidence === 'number' ? result.data.confidence : 0;
    return { text, confidence };
  } finally {
    activeTesseractWorker = null;
    await worker.terminate();
  }
}

async function fileUrlToDataUrl(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function terminateActiveTesseractWorker(): Promise<void> {
  if (!activeTesseractWorker) {
    return;
  }

  const worker = activeTesseractWorker;
  activeTesseractWorker = null;
  await worker.terminate();
}
