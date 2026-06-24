import { Component, inject } from '@angular/core';
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

  file: FileObject | null = null;
  isProcessing = false;
  error: string | null = null;

  progress: { current: number; total: number; status: string } | null = null;

  result: { blob: Blob; name: string } | null = null;

  language = 'eng';
  preserveLayout = true;

  constructor() {
    this.ocrService.getProgress().subscribe((p) => {
      this.progress = p;
    });
  }

  onFilesSelected(files: File[]): void {
    if (files.length === 0) return;
    const selected = files[0];
    this.file = {
      name: selected.name,
      url: URL.createObjectURL(selected),
      size: selected.size,
      type: selected.type
    };
    this.result = null;
    this.error = null;
  }

  clear(): void {
    this.file = null;
    this.result = null;
    this.error = null;
    this.progress = null;
  }

  async createSearchablePdf(): Promise<void> {
    if (!this.file) return;

    this.isProcessing = true;
    this.error = null;
    this.result = null;

    try {
      const ocrResult = await this.ocrService.recognize(this.file, {
        language: this.language,
        preserveLayout: this.preserveLayout
      });

      const blob = await this.buildSearchablePdf(this.file, ocrResult);
      const baseName = this.file.name.replace(/\.[^/.]+$/, '') || 'ocr';
      this.result = { blob, name: `${baseName}_searchable.pdf` };
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to create searchable PDF';
    } finally {
      this.isProcessing = false;
      this.progress = null;
    }
  }

  cancel(): void {
    this.ocrService.cancel();
    this.isProcessing = false;
    this.progress = null;
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
    const cleanText = this.toWinAnsiSafeText(text).trim();
    if (!cleanText) {
      return;
    }

    const { width, height } = page.getSize();
    const margin = Math.max(24, Math.min(width, height) * 0.05);
    const fontSize = Math.max(8, Math.min(12, width / 70));
    const lineHeight = fontSize * 1.25;
    const maxWidth = Math.max(fontSize * 8, width - margin * 2);
    const lines = this.wrapText(cleanText, font, fontSize, maxWidth);
    let y = height - margin - fontSize;

    for (const line of lines) {
      if (y < margin) {
        break;
      }

      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        lineHeight,
        maxWidth,
        font,
        color: pdf.rgb(1, 1, 1),
        opacity: 0.01
      });
      y -= lineHeight;
    }
  }

  private wrapText(text: string, font: import('pdf-lib').PDFFont, fontSize: number, maxWidth: number): string[] {
    const lines: string[] = [];

    for (const sourceLine of text.split(/\r?\n/)) {
      const words = sourceLine.trim().split(/\s+/).filter(Boolean);
      let current = '';

      for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
          current = next;
          continue;
        }

        if (current) {
          lines.push(current);
        }
        current = word;
      }

      if (current) {
        lines.push(current);
      }
    }

    return lines;
  }

  private toWinAnsiSafeText(text: string): string {
    return text.replace(/[^\u0009\u000a\u000d\u0020-\u00ff]/g, ' ');
  }

  private async readFileAsBytes(file: FileObject): Promise<Uint8Array> {
    const response = await fetch(file.url);
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  }

}
