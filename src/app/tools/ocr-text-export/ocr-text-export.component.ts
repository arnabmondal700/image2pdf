import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OcrService } from '../../services/ocr.service';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';

@Component({
  selector: 'app-ocr-text-export',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropZoneComponent],
  templateUrl: './ocr-text-export.component.html',
  styleUrl: './ocr-text-export.component.scss'
})
export class OcrTextExportComponent {
  private readonly ocrService = inject(OcrService);

  file: { name: string; url: string; size: number; type: string } | null = null;
  isProcessing = false;
  error: string | null = null;

  progress: { current: number; total: number; status: string } | null = null;

  result: { text: string; durationMs: number } | null = null;

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

  async extractText(): Promise<void> {
    if (!this.file) return;

    this.isProcessing = true;
    this.error = null;
    this.result = null;

    try {
      const ocrResult = await this.ocrService.recognize(this.file, {
        language: this.language,
        preserveLayout: this.preserveLayout
      });

      const combined = ocrResult.pages.map((p) => p.text).join('\n\n');
      this.result = { text: combined, durationMs: ocrResult.durationMs };
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to extract text';
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

  downloadTxt(): void {
    if (!this.result) return;
    const blob = new Blob([this.result.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = (this.file?.name.replace(/\.[^/.]+$/, '') || 'ocr') + '.txt';
    link.click();
    URL.revokeObjectURL(url);
  }

  async copyToClipboard(): Promise<void> {
    if (!this.result) return;
    try {
      await navigator.clipboard.writeText(this.result.text);
    } catch {
      this.error = 'Failed to copy text to clipboard';
    }
  }
}