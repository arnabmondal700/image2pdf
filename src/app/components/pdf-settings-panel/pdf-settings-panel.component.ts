import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeneratePDFButtonComponent } from '../generate-pdf-button/generate-pdf-button.component';
import { PDFImagesPerPage, PDFSettings, HeaderFooterConfig, HeaderFooterSettings } from '../../services/pdf.service';
import { HeaderFooterService } from '../../services/header-footer.service';
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
    imagesPerPage: 1,
    headerFooter: {
      header: { enabled: false, text: '', fontSize: 10, fontColor: '#000000' },
      footer: { enabled: false, text: '', fontSize: 10, fontColor: '#000000' }
    }
  };
  @Input() uploadedFiles: FileObject[] = [];
  @Input() isGenerating: boolean = false;
  @Input() generationProgress: GenerationProgress | null = null;
  @Output() settingsChanged = new EventEmitter<PDFSettings>();
  @Output() generateClicked = new EventEmitter<void>();
  @Output() cancelClicked = new EventEmitter<void>();

  showAdvancedSettings = false;
  showHeaderFooterSettings = false;
  templateVariables: Record<string, string>;

  constructor(private headerFooterService: HeaderFooterService) {
    this.templateVariables = this.headerFooterService.getTemplateVariables();
  }

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

  toggleHeaderFooterSettings() {
    this.showHeaderFooterSettings = !this.showHeaderFooterSettings;
  }

  onHeaderFooterChange() {
    // Validate and sanitize header/footer settings
    if (!this.pdfSettings.headerFooter) {
      this.pdfSettings.headerFooter = {
        header: this.headerFooterService.getDefaultConfig(),
        footer: this.headerFooterService.getDefaultConfig()
      };
    }

    if (this.pdfSettings.headerFooter.header) {
      this.pdfSettings.headerFooter.header.fontSize = this.headerFooterService.coerceFontSize(
        this.pdfSettings.headerFooter.header.fontSize
      );
      this.pdfSettings.headerFooter.header.fontColor = this.headerFooterService.coerceFontColor(
        this.pdfSettings.headerFooter.header.fontColor
      );
    }

    if (this.pdfSettings.headerFooter.footer) {
      this.pdfSettings.headerFooter.footer.fontSize = this.headerFooterService.coerceFontSize(
        this.pdfSettings.headerFooter.footer.fontSize
      );
      this.pdfSettings.headerFooter.footer.fontColor = this.headerFooterService.coerceFontColor(
        this.pdfSettings.headerFooter.footer.fontColor
      );
    }

    this.onSettingsChange();
  }

  private sanitizeSettings(settings: PDFSettings): PDFSettings {
    return {
      ...settings,
      marginTop: this.coerceMargin(settings.marginTop),
      marginBottom: this.coerceMargin(settings.marginBottom),
      marginLeft: this.coerceMargin(settings.marginLeft),
      marginRight: this.coerceMargin(settings.marginRight),
      backgroundColor: this.coerceBackgroundColor(settings.backgroundColor),
      imagesPerPage: this.coerceImagesPerPage(settings.imagesPerPage),
      headerFooter: this.headerFooterService.resolveHeaderFooterSettings(settings.headerFooter)
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
