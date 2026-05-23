import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeneratePDFButtonComponent } from '../generate-pdf-button/generate-pdf-button.component';
import { PDFImagesPerPage, PDFSettings } from '../../services/pdf.service';
import { FileObject } from '../../services/file.service';
import { GenerationProgress } from '../../services/pdf-worker.service';

@Component({
  selector: 'pdf-settings-panel',
  templateUrl: './pdf-settings-panel.component.html',
  styleUrls: ['./pdf-settings-panel.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, GeneratePDFButtonComponent]
})
export class PdfSettingsPanelComponent {
  @Input() pdfSettings: PDFSettings = {
    pageSize: 'a4',
    orientation: 'portrait',
    quality: 'MEDIUM',
    marginTop: 8,
    marginBottom: 8,
    marginLeft: 8,
    marginRight: 8,
    imageFit: 'contain',
    imageAlignment: 'center',
    backgroundColor: '#ffffff',
    imagesPerPage: 1
  };
  @Input() uploadedFiles: FileObject[] = [];
  @Input() isGenerating: boolean = false;
  @Input() generationProgress: GenerationProgress | null = null;
  @Output() settingsChanged = new EventEmitter<PDFSettings>();
  @Output() generateClicked = new EventEmitter<void>();
  @Output() cancelClicked = new EventEmitter<void>();

  showAdvancedSettings = false;

  onSettingsChange() {
    this.pdfSettings = this.sanitizeSettings(this.pdfSettings);
    this.settingsChanged.emit({ ...this.pdfSettings });
  }

  onGenerateClick() {
    this.generateClicked.emit();
  }

  onCancelClick() {
    this.cancelClicked.emit();
  }

  toggleAdvancedSettings() {
    this.showAdvancedSettings = !this.showAdvancedSettings;
  }

  private sanitizeSettings(settings: PDFSettings): PDFSettings {
    return {
      ...settings,
      marginTop: this.coerceMargin(settings.marginTop),
      marginBottom: this.coerceMargin(settings.marginBottom),
      marginLeft: this.coerceMargin(settings.marginLeft),
      marginRight: this.coerceMargin(settings.marginRight),
      backgroundColor: this.coerceBackgroundColor(settings.backgroundColor),
      imagesPerPage: this.coerceImagesPerPage(settings.imagesPerPage)
    };
  }

  private coerceMargin(value: unknown): number {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      return 8;
    }

    return Math.min(50, Math.max(0, numericValue));
  }

  private coerceBackgroundColor(value: unknown): string {
    return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#ffffff';
  }

  private coerceImagesPerPage(value: unknown): PDFImagesPerPage {
    const numericValue = Number(value);
    return numericValue === 2 || numericValue === 4 ? numericValue : 1;
  }
}
