import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OcrService } from '../../services/ocr.service';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';
import { SeoContentComponent } from '../../components/seo-content/seo-content.component';
import { SeoContentConfigService } from '../../services/seo-content-config.service';
import type { SeoContentConfig } from '../../components/seo-content/seo-content.component';
import type { FileObject } from '../../services/file.service';

@Component({
  selector: 'app-ocr-text-export',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropZoneComponent, SeoContentComponent],
  templateUrl: './ocr-text-export.component.html',
  styleUrls: ['./ocr-text-export.component.scss']
})
export class OcrTextExportComponent {
  file: FileObject | null = null;
  text: string = '';
  isProcessing = false;
  error: string | null = null;
  fileName: string = '';
  language: string = 'eng';
  progress: { current: number; total: number; status: string } | null = null;
  seoContentConfig: SeoContentConfig | null = null;

  constructor(
    private ocrService: OcrService,
    private cdr: ChangeDetectorRef,
    private seoContentConfigService: SeoContentConfigService
  ) {
    this.ocrService.getProgress().subscribe((p) => {
      this.progress = p;
      this.cdr.markForCheck();
    });
    this.seoContentConfig = this.seoContentConfigService.getConfig('ocr-text-export') ?? null;
  }

  onFilesSelected(files: File[]): void {
    if (files.length > 0) {
      const selected = files[0];
      this.file = {
        name: selected.name,
        url: URL.createObjectURL(selected),
        size: selected.size,
        type: selected.type
      };
      this.fileName = selected.name.replace(/\.[^/.]+$/, '');
      this.text = '';
      this.error = null;
      this.cdr.markForCheck();
    }
  }

  async extractText(): Promise<void> {
    if (!this.file) return;

    this.isProcessing = true;
    this.error = null;
    this.cdr.markForCheck();

    try {
      const result = await this.ocrService.recognize(this.file, {
        language: this.language,
        preserveLayout: true
      });
      this.text = result.pages.map(p => p.text).join('\n\n');
    } catch (e) {
      this.error = e instanceof Error ? e.message : 'Failed to extract text';
    } finally {
      this.isProcessing = false;
      this.cdr.markForCheck();
    }
  }

  downloadTxt(): void {
    if (!this.text) return;
    const blob = new Blob([this.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.fileName || 'extracted'}_text.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  copyText(): void {
    if (!this.text) return;
    navigator.clipboard.writeText(this.text);
  }

  cancel(): void {
    this.ocrService.cancel();
    this.isProcessing = false;
    this.progress = null;
    this.cdr.markForCheck();
  }

  clearAll(): void {
    if (this.isProcessing) {
      this.ocrService.cancel();
    }
    if (this.file?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(this.file.url);
    }
    this.file = null;
    this.text = '';
    this.error = null;
    this.fileName = '';
    this.progress = null;
    this.cdr.markForCheck();
  }
}
