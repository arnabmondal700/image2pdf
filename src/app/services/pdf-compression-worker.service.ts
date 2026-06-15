import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface CompressionProgress {
  current: number;
  total: number;
  status: string;
}

export class CompressionCancelledError extends Error {
  constructor() {
    super('Compression cancelled');
    this.name = 'CompressionCancelledError';
  }
}

@Injectable({
  providedIn: 'root'
})
export class PdfCompressionWorkerService {
  private worker: Worker | null = null;
  private progress$ = new BehaviorSubject<CompressionProgress | null>(null);
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
  getProgress(): Observable<CompressionProgress | null> {
    return this.progress$.asObservable();
  }

  /**
   * Compress PDF using a Web Worker
   * Returns a Promise that resolves with the compressed PDF as a Blob
   */
  compress(
    pdfBytes: Uint8Array,
    level: 'low' | 'medium' | 'high',
    jpegQuality: number,
    pageCount: number
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
        this.progress$.next({ current: 0, total: pageCount, status: 'Starting compression' });

        // Create new worker
        this.worker = new Worker(new URL('../workers/pdf-compression.worker.ts', import.meta.url), {
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
            // Compression complete
            try {
              const blob = new Blob([data.compressedBytes], { type: 'application/pdf' });

              // Clean up
              this.cleanup();
              this.progress$.next(null);

              resolve(blob);
            } catch (error) {
              reject(new Error('Failed to process compressed PDF data'));
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

        // Send compression request to worker
        this.worker.postMessage({
          type: 'compress',
          pdfBytes: pdfBytes.buffer as ArrayBuffer,
          level,
          jpegQuality,
          pageCount
        });
      } catch (error) {
        reject(error);
        this.cleanup();
        this.progress$.next(null);
      }
    });
  }

  /**
   * Cancel ongoing compression
   */
  cancel(): void {
    const reject = this.activeReject;
    if (this.worker) {
      try {
        this.worker.postMessage({ type: 'abort' });
      } catch {
        // Worker might be terminated already
      }
    }
    this.cleanup();
    this.progress$.next(null);
    if (reject) {
      reject(new CompressionCancelledError());
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
   * Cleanup on service destroy
   */
  ngOnDestroy(): void {
    this.cleanup();
  }
}