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

    if (this.isWorkerSupported()) {
      return this.recognizeWithWorker(file, { language, preserveLayout });
    }

    return this.recognizeWithFallback(file, language, preserveLayout);
  }

  cancel(): void {
    const reject = this.activeReject;
    this.cancelRequested = true;
    this.pdfToImageService.cancelExport();
    this.terminateWorker();
    void this.terminateActiveTesseractWorker();
    this.progressSubject.next(null);
    if (reject) {
      reject(new OcrCancelledError());
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && !!window.HTMLCanvasElement;
  }

  private isWorkerSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  private recognizeWithFallback(file: FileObject, language: string, preserveLayout: boolean): Promise<OcrResult> {
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

  private recognizeWithWorker(file: FileObject, options: Required<OcrOptions>): Promise<OcrResult> {
    return new Promise((resolve, reject) => {
      try {
        this.terminateWorker();
        this.activeReject = reject;
        this.progressSubject.next({ current: 0, total: 0, status: 'Starting OCR...' });

        this.worker = new Worker(new URL('../workers/ocr.worker.ts', import.meta.url), {
          type: 'module'
        });

        this.worker.onmessage = (event: MessageEvent<OcrWorkerResponse>) => {
          const data = event.data;

          if (data.type === 'progress') {
            this.progressSubject.next({
              current: data.current,
              total: data.total,
              status: data.status
            });
            return;
          }

          if (data.type === 'complete') {
            this.terminateWorker();
            this.progressSubject.next(null);
            resolve({
              pages: data.pages,
              totalPages: data.totalPages,
              durationMs: data.durationMs
            });
            return;
          }

          this.terminateWorker();
          this.progressSubject.next(null);
          reject(new Error(data.message));
        };

        this.worker.onerror = (error) => {
          this.terminateWorker();
          this.progressSubject.next(null);
          reject(new Error(`OCR worker error: ${error.message}`));
        };

        this.worker.postMessage({
          type: 'start',
          file: {
            name: file.name,
            type: file.type,
            size: file.size,
            url: file.url
          },
          options
        });
      } catch (error) {
        this.terminateWorker();
        this.progressSubject.next(null);
        reject(error);
      }
    });
  }

  private async processFile(file: FileObject, language: string, preserveLayout: boolean): Promise<OcrPageResult[]> {
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

    return results;
  }

  private async renderInputToImageFiles(file: FileObject): Promise<FileObject[]> {
    const type = (file.type || '').toLowerCase();

    if (type.includes('pdf')) {
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

      return images.map((img) => ({
        name: img.name,
        type: 'image/png',
        size: img.blob.size,
        url: img.dataUrl
      }));
    }

    return [file];
  }

  private async recognizeImageFile(file: FileObject, language: string, _preserveLayout: boolean): Promise<{ text: string; confidence: number }> {
    const tesseract = await import('tesseract.js');
    const worker = await (tesseract as any).createWorker(language);
    this.activeTesseractWorker = worker;

    try {
      if (this.cancelRequested) {
        throw new OcrCancelledError();
      }

      const imageUrl = file.url.startsWith('data:') ? file.url : await this.fileUrlToDataUrl(file.url);
      const result = await worker.recognize(imageUrl);
      const text = (result.data.text || '').trim();
      const confidence = typeof result.data.confidence === 'number' ? result.data.confidence : 0;
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
