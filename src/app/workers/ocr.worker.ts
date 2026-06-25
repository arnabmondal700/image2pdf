/// <reference lib="webworker" />

export interface OcrImageInput {
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface OcrStartMessage {
  type: 'start';
  images: OcrImageInput[];
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
  console.log('[ocr.worker] Received message:', data.type);

  if (data.type === 'cancel') {
    console.log('[ocr.worker] Cancel requested');
    cancelRequested = true;
    await terminateActiveTesseractWorker();
    postMessage({ type: 'error', message: 'OCR cancelled' } satisfies OcrErrorMessage);
    return;
  }

  cancelRequested = false;

  try {
    const startTime = performance.now();
    const imageFiles = data.images;
    const total = imageFiles.length;
    console.log('[ocr.worker] Starting processing', total, 'images');
    console.log('[ocr.worker] Requested language:', data.options.language);

    sendProgress(0, total, 'Starting OCR...');

    const pages: Array<{ pageNumber: number; text: string; confidence: number }> = [];

    for (let i = 0; i < total; i++) {
      console.log('[ocr.worker] Processing image', i + 1, 'of', total, '-', imageFiles[i].name);
      throwIfCancelled();
      const imageFile = imageFiles[i];
      sendProgress(i, total, `Recognizing page ${i + 1} of ${total}...`);

      const result = await recognizeImageFile(
        imageFile,
        data.options.language || 'eng',
        data.options.preserveLayout ?? true
      );
      console.log('[ocr.worker] After recognizeImageFile, text length:', result.text.length, 'confidence:', result.confidence);
      pages.push({
        pageNumber: i + 1,
        ...result
      });
      console.log('[ocr.worker] Image', i + 1, 'done, text length:', result.text.length, 'confidence:', result.confidence);
    }

    const durationMs = performance.now() - startTime;
    console.log('[ocr.worker] All done, sending complete. Pages:', pages.length, 'Duration:', durationMs, 'ms');

    postMessage({
      type: 'complete',
      pages,
      totalPages: pages.length,
      durationMs
    } satisfies OcrCompleteMessage);
  } catch (error) {
    console.log('[ocr.worker] Error caught:', error);
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

async function recognizeImageFile(
  file: OcrImageInput,
  language: string,
  preserveLayout: boolean
): Promise<OcrPageResult> {
  console.log('[ocr.worker] recognizeImageFile:', file.name, 'lang:', language);
  const tesseract = await import('tesseract.js');
  console.log('[ocr.worker] tesseract.js loaded, creating worker with lang:', language);

  const langPath = 'https://cdn.jsdelivr.net/gh/tesseract-ocr/tessdata_fast';
  console.log('[ocr.worker] Using tessdata CDN:', langPath);

  const createWorker = ((tesseract as any).default || tesseract).createWorker;
  const worker = await createWorker(language, {
    langPath
  });
  activeTesseractWorker = worker;
  console.log('[ocr.worker] tesseract worker created');

  try {
    throwIfCancelled();
    if (preserveLayout) {
      await worker.setParameters({ preserve_interword_spaces: '1' });
    }

    const imageUrl = file.url.startsWith('data:') ? file.url : await fileUrlToDataUrl(file.url);
    console.log('[ocr.worker] Starting recognition on image...');
    const result = await worker.recognize(imageUrl);
    const text = (result.data.text || '').trim();
    const confidence = typeof result.data.confidence === 'number' ? result.data.confidence : 0;
    console.log('[ocr.worker] Recognition result: text length=' + text.length + ' confidence=' + confidence);
    if (!text) {
      console.warn('[ocr.worker] Empty OCR result for language:', language, '- check if traineddata is available at', langPath);
    }
    return { text, confidence };
  } finally {
    activeTesseractWorker = null;
    console.log('[ocr.worker] Terminating tesseract worker');
    await worker.terminate();
  }
}

async function fileUrlToDataUrl(url: string): Promise<string> {
  console.log('[ocr.worker] Converting URL to data URL:', url.substring(0, 50) + '...');
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('[ocr.worker] Data URL conversion done, length:', (reader.result as string).length);
      resolve(reader.result as string);
    };
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
  console.log('[ocr.worker] Terminating active tesseract worker');
  await worker.terminate();
}