import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OcrService } from '../../services/ocr.service';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';

@Component({
  selector: 'app-ocr-text-export',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropZoneComponent],
  templateUrl: './ocr-text-export.component.html',
  styleUrl: './ocr-text-export.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OcrTextExportComponent {
  private readonly ocrService = inject(OcrService);
  private readonly cdr = inject(ChangeDetectorRef);

  file: { name: string; url: string; size: number; type: string } | null = null;
  isProcessing = false;
  error: string | null = null;

  progress: { current: number; total: number; status: string } | null = null;

  result: { text: string; durationMs: number } | null = null;

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
    this.ocrService.getProgress().subscribe((p) => {
      this.progress = p;
      this.cdr.markForCheck();
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