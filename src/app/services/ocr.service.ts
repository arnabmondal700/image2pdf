import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { FileObject } from './file.service';
import { PdfToImageService } from './pdf-to-image.service';

export interface OcrPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
}

export interface OcrResult {
  pages: OcrPageResult[];
  totalPages: number;
  durationMs: number;
}

export interface OcrOptions {
  language?: string;
  preserveLayout?: boolean;
}

export interface OcrProgress {
  current: number;
  total: number;
  status: string;
}

interface OcrWorkerCompleteMessage {
  type: 'complete';
  pages: OcrPageResult[];
  totalPages: number;
  durationMs: number;
}

interface OcrWorkerErrorMessage {
  type: 'error';
  message: string;
}

interface OcrWorkerProgressMessage extends OcrProgress {
  type: 'progress';
}

type OcrWorkerResponse = OcrWorkerCompleteMessage | OcrWorkerErrorMessage | OcrWorkerProgressMessage;

export class OcrCancelledError extends Error {
  constructor() {
    super('OCR cancelled');
    this.name = 'OcrCancelledError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class OcrService {
  private progressSubject = new BehaviorSubject<OcrProgress | null>(null);
  private cancelRequested = false;
  private worker: Worker | null = null;
  private activeReject: ((reason?: unknown) => void) | null = null;
  private activeTesseractWorker: { terminate: () => Promise<unknown> } | null = null;

  constructor(private readonly pdfToImageService: PdfToImageService) {}

  getProgress(): Observable<OcrProgress | null> {
    return this.progressSubject.asObservable();
  }

  async recognize(file: FileObject, options: OcrOptions = {}): Promise<OcrResult> {
    const language = options.language || 'eng';
    const preserveLayout = options.preserveLayout ?? true;

    this.cancelRequested = false;

    console.log('[ocr.service] recognize() called', file.name, file.type, 'workerSupported:', this.isWorkerSupported());

    if (this.isWorkerSupported()) {
      return this.recognizeWithWorker(file, { language, preserveLayout });
    }

    return this.recognizeWithFallback(file, language, preserveLayout);
  }

  cancel(): void {
    console.log('[ocr.service] cancel() called');
    const reject = this.activeReject;
    this.cancelRequested = true;
    this.pdfToImageService.cancelExport();
    this.terminateWorker();
    void this.terminateActiveTesseractWorker();
    this.progressSubject.next(null);
    if (reject) {
      console.log('[ocr.service] Rejecting with OcrCancelledError');
      reject(new OcrCancelledError());
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && !!window.HTMLCanvasElement;
  }

  private isWorkerSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  private async renderInputToImageFiles(file: FileObject): Promise<FileObject[]> {
    const type = (file.type || '').toLowerCase();
    console.log('[ocr.service] renderInputToImageFiles:', file.name, 'type:', type);

    if (type.includes('pdf')) {
      console.log('[ocr.service] Converting PDF to images...');
      const images = await this.pdfToImageService.convertToImages(
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
      console.log('[ocr.service] PDF converted to', images.length, 'images');

      return images.map((img) => ({
        name: img.name,
        type: 'image/png',
        size: img.blob.size,
        url: img.dataUrl
      }));
    }

    console.log('[ocr.service] Not a PDF, returning file as-is');
    return [file];
  }

  private recognizeWithWorker(file: FileObject, options: Required<OcrOptions>): Promise<OcrResult> {
    console.log('[ocr.service] recognizeWithWorker() entered');
    return new Promise(async (resolve, reject) => {
      try {
        this.terminateWorker();
        this.activeReject = reject;
        this.cancelRequested = false;

        console.log('[ocr.service] Calling renderInputToImageFiles...');
        const images = this.cancelRequested
          ? []
          : await this.renderInputToImageFiles(file);
        console.log('[ocr.service] renderInputToImageFiles returned', images.length, 'images');

        if (this.cancelRequested) {
          console.log('[ocr.service] Cancelled after renderInputToImageFiles');
          throw new OcrCancelledError();
        }

        const total = images.length;
        console.log('[ocr.service] Setting progress: current=0 total=' + total + ' status="Starting OCR..."');
        this.progressSubject.next({ current: 0, total, status: 'Starting OCR...' });

        this.worker = new Worker(new URL('../workers/ocr.worker.ts', import.meta.url), {
          type: 'module'
        });
        console.log('[ocr.service] Worker created');

        this.worker.onmessage = (event: MessageEvent<OcrWorkerResponse>) => {
          const data = event.data;
          console.log('[ocr.service] Worker message received:', data.type);

          if (data.type === 'progress') {
            console.log('[ocr.service] PROGRESS UPDATE:', data.current, '/', data.total, data.status);
            this.progressSubject.next({
              current: data.current,
              total: data.total,
              status: data.status
            });
            return;
          }

          if (data.type === 'complete') {
            console.log('[ocr.service] COMPLETE received:', data.pages.length, 'pages,', data.durationMs, 'ms');
            this.terminateWorker();
            this.progressSubject.next(null);
            resolve({
              pages: data.pages,
              totalPages: data.totalPages,
              durationMs: data.durationMs
            });
            return;
          }

          console.log('[ocr.service] ERROR received:', data.message);
          this.terminateWorker();
          this.progressSubject.next(null);
          reject(new Error(data.message));
        };

        this.worker.onerror = (error) => {
          console.log('[ocr.service] Worker raw onerror:', error.message, error);
          this.terminateWorker();
          this.progressSubject.next(null);
          reject(new Error(`OCR worker error: ${error.message}`));
        };

        const messagePayload = {
          type: 'start',
          images: images.map((img) => ({
            name: img.name,
            type: img.type,
            size: img.size,
            url: img.url
          })),
          options
        };
        console.log('[ocr.service] Posting start to worker, images count:', messagePayload.images.length);
        this.worker.postMessage(messagePayload);
      } catch (error) {
        console.log('[ocr.service] recognizeWithWorker caught error:', error);
        this.terminateWorker();
        this.progressSubject.next(null);
        reject(error);
      }
    });
  }

  private recognizeWithFallback(file: FileObject, language: string, preserveLayout: boolean): Promise<OcrResult> {
    console.log('[ocr.service] Using fallback path (no worker)');
    return new Promise(async (resolve, reject) => {
      this.activeReject = reject;
      const startTime = performance.now();

      try {
        const pages = await this.processFile(file, language, preserveLayout);
        if (this.cancelRequested) {
          throw new OcrCancelledError();
        }
        const durationMs = performance.now() - startTime;
        resolve({ pages, totalPages: pages.length, durationMs });
      } catch (error) {
        reject(error);
      } finally {
        if (this.activeReject === reject) {
          this.activeReject = null;
        }
        await this.terminateActiveTesseractWorker();
        this.progressSubject.next(null);
      }
    });
  }

  private async processFile(file: FileObject, language: string, preserveLayout: boolean): Promise<OcrPageResult[]> {
    console.log('[ocr.service] processFile() started');
    const imageFiles = await this.renderInputToImageFiles(file);
    if (this.cancelRequested) {
      throw new OcrCancelledError();
    }

    const results: OcrPageResult[] = [];
    const total = imageFiles.length;

    this.progressSubject.next({ current: 0, total, status: 'Preparing OCR...' });

    for (let i = 0; i < total; i++) {
      if (this.cancelRequested) {
        throw new OcrCancelledError();
      }

      const imageFile = imageFiles[i];
      this.progressSubject.next({ current: i, total, status: `Recognizing page ${i + 1} of ${total}...` });

      const result = await this.recognizeImageFile(imageFile, language, preserveLayout);
      results.push({ pageNumber: i + 1, ...result });
    }

    console.log('[ocr.service] processFile() done, pages:', results.length);
    return results;
  }

  private async recognizeImageFile(file: FileObject, language: string, _preserveLayout: boolean): Promise<{ text: string; confidence: number }> {
    console.log('[ocr.service] recognizeImageFile:', file.name);
    const tesseract = await import('tesseract.js');
    const worker = await (tesseract as any).createWorker(language);
    this.activeTesseractWorker = worker;

    try {
      if (this.cancelRequested) {
        throw new OcrCancelledError();
      }

      const imageUrl = file.url.startsWith('data:') ? file.url : await this.fileUrlToDataUrl(file.url);
      console.log('[ocr.service] Calling worker.recognize()...');
      const result = await worker.recognize(imageUrl);
      const text = (result.data.text || '').trim();
      const confidence = typeof result.data.confidence === 'number' ? result.data.confidence : 0;
      console.log('[ocr.service] recognizeImageFile done, text length:', text.length, 'confidence:', confidence);
      return { text, confidence };
    } finally {
      this.activeTesseractWorker = null;
      await worker.terminate();
    }
  }

  private async fileUrlToDataUrl(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private terminateWorker(): void {
    if (this.worker) {
      console.log('[ocr.service] Terminating worker');
      this.worker.terminate();
      this.worker = null;
    }
    this.activeReject = null;
  }

  private async terminateActiveTesseractWorker(): Promise<void> {
    if (!this.activeTesseractWorker) {
      return;
    }

    const worker = this.activeTesseractWorker;
    this.activeTesseractWorker = null;
    await worker.terminate();
  }
}