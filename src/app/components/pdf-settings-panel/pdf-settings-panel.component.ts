import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeneratePDFButtonComponent } from '../generate-pdf-button/generate-pdf-button.component';
import { PDFImagesPerPage, PDFSettings, HeaderFooterConfig, HeaderFooterSettings, ExportMode } from '../../services/pdf.service';
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
    exportMode: 'single-pdf',
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
  showPasswordSettings = false;
  showPasswordInput: boolean = false;
  showConfirmPasswordInput: boolean = false;
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

  togglePasswordSettings() {
    console.log('[Settings-Panel] togglePasswordSettings() — toggling, new showPasswordSettings:', !this.showPasswordSettings);
    this.showPasswordSettings = !this.showPasswordSettings;
    if (!this.showPasswordSettings) {
      console.log('[Settings-Panel] togglePasswordSettings() — collapsing, clearing password');
      this.pdfSettings.passwordProtection = undefined;
      this.onSettingsChange();
    } else {
      console.log('[Settings-Panel] togglePasswordSettings() — expanding password section');
    }
  }

  /**
   * Handle ngModelChange for the password input.
   * Initializes passwordProtection if needed before setting the value.
   */
  onPasswordModelChange(value: string): void {
    console.log('[Settings-Panel] onPasswordModelChange() — value length:', value?.length);
    if (!this.pdfSettings.passwordProtection) {
      this.pdfSettings.passwordProtection = { userPassword: '' };
    }
    this.pdfSettings.passwordProtection.userPassword = value;
    this.onPasswordChange();
  }

  onPasswordChange() {
    const pp = this.pdfSettings.passwordProtection;
    console.log('[Settings-Panel] onPasswordChange() — current passwordProtection:', pp ? {
      hasUserPassword: !!pp.userPassword,
      userPasswordLen: pp.userPassword?.length
    } : 'UNDEFINED');

    if (pp && pp.userPassword && pp.userPassword.trim().length >= 4) {
      console.log('[Settings-Panel] onPasswordChange() — password valid (>=4 chars), setting in settings');
      this.pdfSettings.passwordProtection = {
        userPassword: pp.userPassword.trim()
      };
    } else if (pp && pp.userPassword && pp.userPassword.trim().length > 0 && pp.userPassword.trim().length < 4) {
      console.log('[Settings-Panel] onPasswordChange() — password too short (<4 chars), not emitting yet');
      // Keep it but show error - don't emit yet
      return;
    } else {
      console.log('[Settings-Panel] onPasswordChange() — password empty, removing protection');
      this.pdfSettings.passwordProtection = undefined;
    }
    this.onSettingsChange();
  }

  /** Whether the password is set and valid (minimum 4 chars) */
  hasValidPassword(): boolean {
    const result = !!(
      this.pdfSettings.passwordProtection?.userPassword &&
      this.pdfSettings.passwordProtection.userPassword.trim().length >= 4
    );
    return result;
  }

  /** Whether to show the minimum-length hint */
  showPasswordHint(): boolean {
    const pp = this.pdfSettings.passwordProtection;
    return !!(
      pp?.userPassword &&
      pp.userPassword.length > 0 &&
      pp.userPassword.length < 4
    );
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
