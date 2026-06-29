import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface FileObject {
  name: string;
  type: string;
  size: number;
  url: string;
  rotation?: number; // Rotation angle in degrees (0, 90, 180, 270)
}

export interface PDFSettings {
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  quality: 'FAST' | 'MEDIUM' | 'SLOW';
  dpi?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  imageFit?: 'contain' | 'cover' | 'stretch';
  imageAlignment?: 'center' | 'top' | 'bottom';
  backgroundColor?: string;
  imagesPerPage?: 1 | 2 | 4;
}

export interface GenerationProgress {
  current: number;
  total: number;
  status: string;
}

export class PDFGenerationCancelledError extends Error {
  constructor() {
    super('PDF generation cancelled');
    this.name = 'PDFGenerationCancelledError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class PdfWorkerService {
  private worker: Worker | null = null;
  private progress$ = new BehaviorSubject<GenerationProgress | null>(null);
  private isSupported = typeof Worker !== 'undefined';
  private activeReject: ((reason?: unknown) => void) | null = null;

  /**
   * Check if Web Workers are supported in this browser
   */
  isWorkerSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get progress updates as an Observable
   */
  getProgress(): Observable<GenerationProgress | null> {
    return this.progress$.asObservable();
  }

  /**
   * Generate PDF using a Web Worker
   * Returns a Promise that resolves with the PDF as a Blob
   */
  generatePDF(
    uploadedFiles: FileObject[],
    settings: PDFSettings,
    fileName: string = 'My_Converted_Images.pdf'
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Web Workers are not supported in this browser'));
        return;
      }

      try {
        // Terminate previous worker if it exists
        if (this.worker) {
          this.worker.terminate();
        }
        this.activeReject = reject;
        this.progress$.next({ current: 0, total: uploadedFiles.length, status: 'Starting PDF generation' });

        // Create new worker
        this.worker = new Worker(new URL('../workers/pdf-generation.worker.ts', import.meta.url), {
          type: 'module'
        });

        // Handle messages from worker
        this.worker.onmessage = (event) => {
          const data = event.data;

          if (data.type === 'progress') {
            // Update progress
            this.progress$.next({
              current: data.current,
              total: data.total,
              status: data.status
            });
          } else if (data.type === 'complete') {
            // PDF generation complete
            try {
              // Convert base64 to Blob
              const binaryString = atob(data.pdfData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'application/pdf' });

              // Trigger download
              this.downloadBlob(blob, fileName);

              // Clean up
              this.cleanup();
              this.progress$.next(null);

              resolve(blob);
            } catch (error) {
              reject(new Error('Failed to process PDF data'));
              this.cleanup();
              this.progress$.next(null);
            }
          } else if (data.type === 'error') {
            reject(new Error(data.error));
            this.cleanup();
            this.progress$.next(null);
          }
        };

        // Handle worker errors
        this.worker.onerror = (error) => {
          reject(new Error(`Worker error: ${error.message}`));
          this.cleanup();
          this.progress$.next(null);
        };

        // Send generation request to worker
        this.worker.postMessage({
          files: uploadedFiles,
          settings,
          fileName
        });
      } catch (error) {
        reject(error);
        this.cleanup();
        this.progress$.next(null);
      }
    });
  }

  /**
   * Generate PDF blob without automatic download (for preview)
   */
  generatePDFBlob(uploadedFiles: FileObject[], settings: PDFSettings): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Web Workers are not supported in this browser'));
        return;
      }

      try {
        if (this.worker) {
          this.worker.terminate();
        }
        this.activeReject = reject;
        this.progress$.next({ current: 0, total: uploadedFiles.length, status: 'Starting PDF generation' });

        this.worker = new Worker(new URL('../workers/pdf-generation.worker.ts', import.meta.url), {
          type: 'module'
        });

        this.worker.onmessage = (event) => {
          const data = event.data;

          if (data.type === 'progress') {
            this.progress$.next({
              current: data.current,
              total: data.total,
              status: data.status
            });
          } else if (data.type === 'complete') {
            try {
              const binaryString = atob(data.pdfData);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const blob = new Blob([bytes], { type: 'application/pdf' });
              this.cleanup();
              this.progress$.next(null);
              resolve(blob);
            } catch (error) {
              reject(new Error('Failed to process PDF data'));
              this.cleanup();
              this.progress$.next(null);
            }
          } else if (data.type === 'error') {
            reject(new Error(data.error));
            this.cleanup();
            this.progress$.next(null);
          }
        };

        this.worker.onerror = (error) => {
          reject(new Error(`Worker error: ${error.message}`));
          this.cleanup();
          this.progress$.next(null);
        };

        this.worker.postMessage({
          files: uploadedFiles,
          settings,
          fileName: 'temp.pdf'
        });
      } catch (error) {
        reject(error);
        this.cleanup();
        this.progress$.next(null);
      }
    });
  }

  /**
   * Cancel ongoing PDF generation
   */
  cancel(): void {
    const reject = this.activeReject;
    this.cleanup();
    this.progress$.next(null);
    if (reject) {
      reject(new PDFGenerationCancelledError());
    }
  }

  /**
   * Clean up worker resources
   */
  private cleanup(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.activeReject = null;
  }

  /**
   * Trigger browser download of blob (browser-only)
   */
  private downloadBlob(blob: Blob, fileName: string): void {
    if (typeof window === 'undefined') {
      return;
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.cleanup();
  }
}
