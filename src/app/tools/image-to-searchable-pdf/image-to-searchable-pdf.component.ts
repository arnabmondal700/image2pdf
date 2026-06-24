import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OcrResult, OcrService } from '../../services/ocr.service';
import { FileObject } from '../../services/file.service';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';

@Component({
  selector: 'app-image-to-searchable-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropZoneComponent],
  templateUrl: './image-to-searchable-pdf.component.html',
  styleUrl: './image-to-searchable-pdf.component.scss'
})
export class ImageToSearchablePdfComponent {
  private readonly ocrService = inject(OcrService);
  private readonly cdr = inject(ChangeDetectorRef);

  file: FileObject | null = null;
  isProcessing = false;
  error: string | null = null;

  progress: { current: number; total: number; status: string } | null = null;

  result: { blob: Blob; name: string } | null = null;

  language = 'eng';
  preserveLayout = true;

  readonly availableLanguages: { code: string; label: string }[] = [
    { code: 'eng', label: 'English' },
    { code: 'hin', label: 'Hindi' },
    { code: 'ben', label: 'Bengali' },
    { code: 'ara', label: 'Arabic' },
    { code: 'spa', label: 'Spanish' },
    { code: 'fra', label: 'French' },
    { code: 'deu', label: 'German' },
    { code: 'ita', label: 'Italian' },
    { code: 'por', label: 'Portuguese' },
    { code: 'rus', label: 'Russian' },
    { code: 'jpn', label: 'Japanese' },
    { code: 'kor', label: 'Korean' },
    { code: 'chi_sim', label: 'Chinese (Simplified)' },
    { code: 'chi_tra', label: 'Chinese (Traditional)' },
    { code: 'tur', label: 'Turkish' },
    { code: 'nld', label: 'Dutch' },
    { code: 'pol', label: 'Polish' },
    { code: 'swe', label: 'Swedish' },
    { code: 'dan', label: 'Danish' },
    { code: 'fin', label: 'Finnish' },
    { code: 'ces', label: 'Czech' },
    { code: 'ron', label: 'Romanian' },
    { code: 'hun', label: 'Hungarian' },
    { code: 'tha', label: 'Thai' },
    { code: 'vie', label: 'Vietnamese' },
    { code: 'ukr', label: 'Ukrainian' },
    { code: 'ell', label: 'Greek' },
    { code: 'heb', label: 'Hebrew' },
  ];

  constructor() {
    console.log('[ocr.component] Constructor - subscribing to progress');
    this.ocrService.getProgress().subscribe((p) => {
      console.log('[ocr.component] Progress received:', p);
      this.progress = p;
      this.cdr.markForCheck();
    });
  }

  onFilesSelected(files: File[]): void {
    console.log('[ocr.component] onFilesSelected:', files.length, 'files');
    if (files.length === 0) return;
    if (this.isProcessing) {
      console.log('[ocr.component] Already processing, cancelling first');
      this.ocrService.cancel();
    }
    const selected = files[0];
    console.log('[ocr.component] Selected file:', selected.name, selected.type, selected.size);
    this.file = {
      name: selected.name,
      url: URL.createObjectURL(selected),
      size: selected.size,
      type: selected.type
    };
    this.isProcessing = false;
    this.result = null;
    this.error = null;
    this.progress = null;
    this.cdr.markForCheck();
  }

  clear(): void {
    console.log('[ocr.component] clear() called');
    if (this.isProcessing) {
      console.log('[ocr.component] Processing in progress, cancelling');
      this.ocrService.cancel();
    }
    this.file = null;
    this.isProcessing = false;
    this.result = null;
    this.error = null;
    this.progress = null;
    this.cdr.markForCheck();
  }

  async createSearchablePdf(): Promise<void> {
    console.log('[ocr.component] createSearchablePdf() started');
    if (!this.file) {
      console.log('[ocr.component] No file selected, aborting');
      return;
    }

    this.isProcessing = true;
    this.error = null;
    this.result = null;

    try {
      console.log('[ocr.component] Calling ocrService.recognize()...');
      const ocrResult = await this.ocrService.recognize(this.file, {
        language: this.language,
        preserveLayout: this.preserveLayout
      });
      console.log('[ocr.component] ocrService.recognize() returned:', ocrResult.pages.length, 'pages');

      console.log('[ocr.component] Calling buildSearchablePdf()...');
      const blob = await this.buildSearchablePdf(this.file, ocrResult);
      const baseName = this.file.name.replace(/\.[^/.]+$/, '') || 'ocr';
      this.result = { blob, name: `${baseName}_searchable.pdf` };
      this.cdr.markForCheck();
      console.log('[ocr.component] Searchable PDF ready:', this.result.name);
    } catch (e) {
      console.log('[ocr.component] Error caught:', e);
      if (e instanceof Error && e.name === 'OcrCancelledError') {
        console.log('[ocr.component] OCR was cancelled - not showing error');
        // Don't show error for cancellation
        return;
      }
      this.error = e instanceof Error ? e.message : 'Failed to create searchable PDF';
      this.cdr.markForCheck();
    } finally {
      this.isProcessing = false;
      this.progress = null;
      this.cdr.markForCheck();
      console.log('[ocr.component] createSearchablePdf() finally - isProcessing=false');
    }
  }

  cancel(): void {
    console.log('[ocr.component] cancel() called');
    this.ocrService.cancel();
    this.isProcessing = false;
    this.progress = null;
    this.result = null;
    this.cdr.markForCheck();
  }

  download(): void {
    if (!this.result) return;
    const url = URL.createObjectURL(this.result.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = this.result.name;
    link.click();
    URL.revokeObjectURL(url);
  }

  private async buildSearchablePdf(file: FileObject, ocrResult: OcrResult): Promise<Blob> {
    const pdf = await import('pdf-lib');
    const doc = await pdf.PDFDocument.create();
    const font = await doc.embedFont(pdf.StandardFonts.Helvetica);

    if (file.type && file.type.includes('pdf')) {
      const existingBytes = await this.readFileAsBytes(file);
      const loaded = await pdf.PDFDocument.load(existingBytes);
      const copied = await doc.copyPages(loaded, loaded.getPageIndices());

        for (let i = 0; i < copied.length; i++) {
        const page = doc.addPage(copied[i]);
        this.drawInvisibleTextLayer(pdf, page, font, ocrResult.pages[i]?.text || '');
      }
    } else {
      const imageBytes = await this.readFileAsBytes(file);
      const embeddedImage = await this.embedImage(pdf, doc, file, imageBytes);
      const page = doc.addPage([embeddedImage.width, embeddedImage.height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: embeddedImage.width,
        height: embeddedImage.height
      });
      this.drawInvisibleTextLayer(pdf, page, font, ocrResult.pages[0]?.text || '');
    }

    const bytes = await doc.save();
    return new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
  }

  private async embedImage(pdf: typeof import('pdf-lib'), doc: import('pdf-lib').PDFDocument, file: FileObject, imageBytes: Uint8Array) {
    const type = (file.type || '').toLowerCase();
    if (type.includes('png')) {
      return doc.embedPng(imageBytes);
    }
    return doc.embedJpg(imageBytes);
  }

  private drawInvisibleTextLayer(
    pdf: typeof import('pdf-lib'),
    page: import('pdf-lib').PDFPage,
    font: import('pdf-lib').PDFFont,
    text: string
  ): void {
    const cleanText = text.trim();
    if (!cleanText) {
      return;
    }

    const { width, height } = page.getSize();
    const margin = Math.max(24, Math.min(width, height) * 0.05);
    const fontSize = Math.max(8, Math.min(12, width / 70));

    // Draw each line of text directly without width-based wrapping.
    // For standard Helvetica, drawText throws on non-WinAnsi characters.
    // Since the text layer is invisible (opacity 0.01), exact positioning doesn't matter —
    // the important thing is that the Unicode text bytes are in the PDF content stream
    // for search/copy purposes.
    const lines = cleanText.split(/\r?\n/);
    const lineHeight = fontSize * 1.25;
    let y = height - margin - fontSize;

    for (const line of lines) {
      if (y < margin) {
        break;
      }

      // Attempt to draw each line; if encoding fails (non-WinAnsi char with standard font),
      // silently skip that line so the rest of the PDF is still generated.
      try {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          y -= lineHeight;
          continue;
        }
        page.drawText(trimmedLine, {
          x: margin,
          y,
          size: fontSize,
          lineHeight,
          font,
          color: pdf.rgb(1, 1, 1),
          opacity: 0.01
        });
      } catch {
        // Character encoding failed — skip this line. The text is invisible anyway.
      }
      y -= lineHeight;
    }
  }

  private async readFileAsBytes(file: FileObject): Promise<Uint8Array> {
    const response = await fetch(file.url);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

}