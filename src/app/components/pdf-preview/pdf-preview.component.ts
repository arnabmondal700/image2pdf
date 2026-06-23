import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileObject } from '../../services/file.service';
import { PDFService, PDFSettings } from '../../services/pdf.service';

interface PreviewThumbnail {
  pageNumber: number;
  url: string;
}

@Component({
  selector: 'pdf-preview',
  templateUrl: './pdf-preview.component.html',
  styleUrls: ['./pdf-preview.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class PdfPreviewComponent implements AfterViewInit, OnChanges, OnDestroy {
  private pdfService = inject(PDFService);
  private ngZone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  @Input() uploadedFiles: FileObject[] = [];
  @Input() pdfSettings: PDFSettings | null = null;
  @Input() pdfBlob: Blob | null = null;
  @ViewChild('previewCanvas') private previewCanvas?: ElementRef<HTMLCanvasElement>;

  isRendering = false;
  selectedPage = 1;
  totalPages = 0;
  zoom = 0.8;
  thumbnails: PreviewThumbnail[] = [];

  private pdfDocument: any = null;
  private pdfjsLib: any = null;
  private renderToken = 0;
  private isRefreshing = false;
  private pendingRefresh = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly DEBOUNCE_MS = 400;

  ngAfterViewInit() {
    this.scheduleRefresh();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['uploadedFiles'] || changes['pdfSettings'] || changes['pdfBlob']) {
      console.log('[PdfPreview] ngOnChanges', {
        hasUploadedFiles: (changes['uploadedFiles']?.currentValue?.length ?? 0) > 0,
        hasPdfSettings: !!changes['pdfSettings']?.currentValue,
        hasPdfBlob: !!changes['pdfBlob']?.currentValue,
        pdfBlobSize: changes['pdfBlob']?.currentValue?.size ?? 'N/A'
      });
      this.scheduleRefresh();
    }
  }

  /**
   * Debounce refreshes: coalesce rapid input changes into a single refresh cycle.
   */
  private scheduleRefresh(): void {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.performRefresh();
    }, this.DEBOUNCE_MS);
  }

  private async performRefresh(): Promise<void> {
    if (this.isRefreshing) {
      this.pendingRefresh = true;
      return;
    }

    this.isRefreshing = true;

    // If canvas ViewChild isn't resolved yet, schedule a retry
    if (!this.previewCanvas) {
      console.log('[PdfPreview] Canvas ViewChild not ready yet, scheduling retry...');
      this.isRefreshing = false;
      setTimeout(() => void this.performRefresh(), this.DEBOUNCE_MS);
      return;
    }

    await this.refreshPreview();
    this.isRefreshing = false;
    this.cdr.markForCheck();

    if (this.pendingRefresh) {
      this.pendingRefresh = false;
      void this.performRefresh();
    }
  }

  ngOnDestroy() {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.renderToken++;
    this.pdfDocument?.destroy?.();
  }

  selectPage(pageNumber: number) {
    if (pageNumber < 1 || pageNumber > this.totalPages || pageNumber === this.selectedPage) {
      return;
    }
    this.selectedPage = pageNumber;
    void this.renderCurrentPage();
  }

  zoomIn() {
    this.zoom = Math.min(1.6, Number((this.zoom + 0.2).toFixed(1)));
    void this.renderCurrentPage();
  }

  zoomOut() {
    this.zoom = Math.max(0.4, Number((this.zoom - 0.2).toFixed(1)));
    void this.renderCurrentPage();
  }

  nextPage() {
    this.selectPage(this.selectedPage + 1);
  }

  previousPage() {
    this.selectPage(this.selectedPage - 1);
  }

  private isBlobMode(): boolean {
    return this.pdfBlob !== null;
  }

  private async refreshPreview(): Promise<void> {
    if (!this.previewCanvas) {
      // Canvas not yet available (ViewChild timing race); let the next debounce retry.
      return;
    }

    const hasFiles = this.uploadedFiles.length > 0 && !!this.pdfSettings;
    const hasBlob = this.pdfBlob !== null;

    if (!hasFiles && !hasBlob) {
      this.clearPreview();
      return;
    }

    const token = ++this.renderToken;
    this.isRendering = true;

    try {
      await this.ngZone.runOutsideAngular(async () => {
        this.pdfDocument?.destroy?.();

        let data: ArrayBuffer;

        if (this.isBlobMode()) {
          console.log('[PdfPreview] Blob mode: reading arrayBuffer, size=', this.pdfBlob!.size);
          data = await this.pdfBlob!.arrayBuffer();
          console.log('[PdfPreview] Blob arrayBuffer read, byteLength=', data.byteLength);
        } else {
          console.log('[PdfPreview] Generation mode: creating PDF from files');
          const blob = await this.pdfService.createPDFBlob(this.uploadedFiles, this.pdfSettings!);
          data = await blob.arrayBuffer();
          console.log('[PdfPreview] Generated PDF arrayBuffer, byteLength=', data.byteLength);
        }

        const pdfjsLib = await this.loadPdfjs();
        console.log('[PdfPreview] pdfjs loaded, getting document...');
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdfDocument = await loadingTask.promise;
        console.log('[PdfPreview] pdfjs document loaded, numPages=', pdfDocument.numPages);

        if (token !== this.renderToken) {
          pdfDocument.destroy();
          return;
        }

        this.pdfDocument = pdfDocument;
        this.totalPages = pdfDocument.numPages;
        this.selectedPage = Math.min(this.selectedPage, this.totalPages) || 1;
        console.log('[PdfPreview] totalPages set to', this.totalPages, 'selectedPage=', this.selectedPage);
        this.thumbnails = await this.renderThumbnails(pdfDocument, token);
        console.log('[PdfPreview] thumbnails rendered, count=', this.thumbnails.length);
        await this.renderCurrentPage(token);
        console.log('[PdfPreview] currentPage rendered');
      });
    } catch (error) {
      console.error('[PdfPreview] PDF preview error:', error);
      this.clearPreview();
    } finally {
      if (token === this.renderToken) {
        this.isRendering = false;
        this.cdr.markForCheck();
      }
    }
  }

  private async renderCurrentPage(token = this.renderToken): Promise<void> {
    const canvas = this.previewCanvas?.nativeElement;
    if (!canvas || !this.pdfDocument || token !== this.renderToken) {
      return;
    }

    await this.ngZone.runOutsideAngular(async () => {
      const page = await this.pdfDocument.getPage(this.selectedPage);
      if (token !== this.renderToken) {
        return;
      }

      const viewport = page.getViewport({ scale: this.zoom });
      const context = canvas.getContext('2d');
      if (!context) {
        console.error('[PdfPreview] Could not get 2d context from canvas');
        return;
      }

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvasContext: context, viewport }).promise;
    });
  }

  private async renderThumbnails(pdfDocument: any, token: number): Promise<PreviewThumbnail[]> {
    return this.ngZone.runOutsideAngular(async () => {
      const thumbnails: PreviewThumbnail[] = [];

      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber++) {
        if (token !== this.renderToken) {
          return thumbnails;
        }

        const page = await pdfDocument.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.16 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          continue;
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        await page.render({ canvasContext: context, viewport }).promise;
        thumbnails.push({ pageNumber, url: canvas.toDataURL('image/png') });
      }

      return thumbnails;
    });
  }

  private clearPreview() {
    this.pdfDocument?.destroy?.();
    this.pdfDocument = null;
    this.totalPages = 0;
    this.selectedPage = 1;
    this.thumbnails = [];

    const canvas = this.previewCanvas?.nativeElement;
    const context = canvas?.getContext('2d');
    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  private async loadPdfjs(): Promise<any> {
    if (!this.pdfjsLib) {
      try {
        const lib = await import('pdfjs-dist');
        lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        this.pdfjsLib = lib;
      } catch (error) {
        console.error('[PdfPreview] Error loading PDF.js or worker:', error);
        throw error;
      }
    }

    return this.pdfjsLib;
  }
}