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

  ngAfterViewInit() {
    void this.performRefresh();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['uploadedFiles'] || changes['pdfSettings']) {
      this.pendingRefresh = true;
      if (!this.isRefreshing) {
        void this.performRefresh();
      }
    }
  }

  private async performRefresh(): Promise<void> {
    if (this.isRefreshing) {
      this.pendingRefresh = true;
      return;
    }

    this.isRefreshing = true;
    await this.refreshPreview();
    this.isRefreshing = false;

    // Notify Angular that the component has changed after async refresh
    this.cdr.markForCheck();

    // If inputs changed while we were refreshing, refresh again
    if (this.pendingRefresh) {
      this.pendingRefresh = false;
      void this.performRefresh();
    }
  }

  ngOnDestroy() {
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

  private async refreshPreview(): Promise<void> {
    if (!this.previewCanvas || !this.pdfSettings || this.uploadedFiles.length === 0) {
      this.clearPreview();
      return;
    }

    const token = ++this.renderToken;
    this.isRendering = true;

    try {
      await this.ngZone.runOutsideAngular(async () => {
        this.pdfDocument?.destroy?.();
        const blob = await this.pdfService.createPDFBlob(this.uploadedFiles, this.pdfSettings!);
        const data = await blob.arrayBuffer();
        const pdfjsLib = await this.loadPdfjs();
        const loadingTask = pdfjsLib.getDocument({ data });
        const pdfDocument = await loadingTask.promise;

        if (token !== this.renderToken) {
          pdfDocument.destroy();
          return;
        }

        this.pdfDocument = pdfDocument;
        this.totalPages = pdfDocument.numPages;
        this.selectedPage = Math.min(this.selectedPage, this.totalPages) || 1;
        this.thumbnails = await this.renderThumbnails(pdfDocument, token);
        await this.renderCurrentPage(token);
      });
    } catch (error) {
      console.error('PDF preview error:', error);
      this.clearPreview();
    } finally {
      if (token === this.renderToken) {
        this.isRendering = false;
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
        console.error('Could not get 2d context from canvas');
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
        // Use local worker file from public folder
        lib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
        this.pdfjsLib = lib;
      } catch (error) {
        console.error('Error loading PDF.js or worker:', error);
        throw error;
      }
    }

    return this.pdfjsLib;
  }
}
