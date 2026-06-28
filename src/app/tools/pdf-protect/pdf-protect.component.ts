import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PdfProtectionService } from '../../services/pdf-protection.service';
import { ToolDefinition } from '../tool.interface';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';
import { SeoContentComponent } from '../../components/seo-content/seo-content.component';
import { SeoContentConfigService } from '../../services/seo-content-config.service';
import type { SeoContentConfig } from '../../components/seo-content/seo-content.component';

@Component({
  selector: 'app-pdf-protect',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropZoneComponent, SeoContentComponent],
  templateUrl: './pdf-protect.component.html',
  styleUrls: ['./pdf-protect.component.scss']
})
export class PdfProtectComponent {
  uploadedPdf: FileObject | null = null;
  validationErrors: FileValidationError[] = [];
  generalError: string | null = null;
  successMessage: string | null = null;
  isProcessing = false;
  isDragging = false;
  mode: 'add' | 'remove' = 'add';

  // Password fields
  userPassword = '';
  confirmPassword = '';
  ownerPassword = '';
  outputFileName = '';

  // Password visibility
  showUserPassword = false;
  showConfirmPassword = false;
  showOwnerPassword = false;

  // Permissions
  permissions = {
    canPrint: true,
    canPrintHighRes: true,
    canCopy: true,
    canModify: true,
    canAnnotate: true,
    canFillForms: true,
    canExtract: true,
    canAssemble: true
  };

  seoContentConfig: SeoContentConfig | null = null;

  toolDefinition: ToolDefinition = {
    id: 'pdf-protect',
    name: 'Protect PDF',
    description: 'Add or remove password protection',
    icon: 'fa-solid fa-lock',
    path: 'pdf-protect',
    category: 'secure',
    enabled: true,
    priority: 55
  };

  constructor(
    private fileService: FileService,
    private protectionService: PdfProtectionService,
    private seoContentConfigService: SeoContentConfigService,
    private cdr: ChangeDetectorRef
  ) {
    this.seoContentConfig = this.seoContentConfigService.getConfig('pdf-protect') ?? null;
  }

  getPasswordInputType(show: boolean): string {
    return show ? 'text' : 'password';
  }

  togglePasswordVisibility(field: 'user' | 'confirm' | 'owner'): void {
    if (field === 'user') this.showUserPassword = !this.showUserPassword;
    else if (field === 'confirm') this.showConfirmPassword = !this.showConfirmPassword;
    else if (field === 'owner') this.showOwnerPassword = !this.showOwnerPassword;
  }

  toggleMode(mode: 'add' | 'remove'): void {
    this.mode = mode;
    this.generalError = null;
    this.successMessage = null;
    this.userPassword = '';
    this.confirmPassword = '';
    this.ownerPassword = '';
  }

  updatePermission(key: keyof typeof this.permissions, value: boolean): void {
    this.permissions[key] = value;
  }

  async onFilesSelected(files: FileList | File[]): Promise<void> {
    try {
      this.generalError = null;
      this.successMessage = null;
      const result = await this.fileService.processFiles(files);
      const pdfs = result.successful.filter(f => f.fileType === 'pdf');
      if (pdfs.length > 0) {
        this.uploadedPdf = pdfs[0];
        this.outputFileName = pdfs[0].name.replace(/\.pdf$/i, '') + (this.mode === 'add' ? '-protected' : '-unprotected');
        this.validationErrors = [];
      }
      if (result.errors.length > 0) {
        this.validationErrors = result.errors;
      }
      this.cdr.detectChanges();
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Error processing file';
      this.cdr.detectChanges();
    }
  }

  onPdfRemoved(): void {
    this.uploadedPdf = null;
    this.validationErrors = [];
    this.generalError = null;
    this.successMessage = null;
    this.userPassword = '';
    this.confirmPassword = '';
    this.ownerPassword = '';
    this.outputFileName = '';
    this.cdr.detectChanges();
  }

  onDragOverZone(): void {
    this.isDragging = true;
  }

  onDragLeaveZone(): void {
    this.isDragging = false;
  }

  onFileDialogOpen(): void {
    this.isDragging = false;
  }

  isApplyDisabled(): boolean {
    if (!this.uploadedPdf || this.isProcessing) return true;
    if (this.mode === 'add') {
      if (!this.userPassword) return true;
      if (this.userPassword !== this.confirmPassword) return true;
    }
    if (this.mode === 'remove') {
      if (!this.userPassword) return true;
    }
    return false;
  }

  getApplyButtonLabel(): string {
    if (this.isProcessing) return this.mode === 'add' ? 'Adding Protection...' : 'Removing Protection...';
    return this.mode === 'add' ? 'Apply Protection' : 'Remove Protection';
  }

  async onApply(): Promise<void> {
    if (!this.uploadedPdf) return;

    this.isProcessing = true;
    this.generalError = null;
    this.successMessage = null;

    try {
      const fileName = this.outputFileName || (this.mode === 'add' ? 'protected-document' : 'unprotected-document');
      if (this.mode === 'add') {
        const result = await this.protectionService.addPassword(
          this.uploadedPdf,
          { userPassword: this.userPassword, ownerPassword: this.ownerPassword || undefined, permissions: this.permissions },
          fileName
        );
        this.protectionService.downloadPDF(result.blob, `${fileName}.pdf`);
        this.successMessage = 'PDF protected successfully!';
      } else {
        const result = await this.protectionService.removePassword(
          this.uploadedPdf,
          this.userPassword,
          fileName
        );
        this.protectionService.downloadPDF(result.blob, `${fileName}.pdf`);
        this.successMessage = 'Protection removed successfully!';
      }
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Failed to process PDF';
    } finally {
      this.isProcessing = false;
      this.cdr.detectChanges();
    }
  }

  clearAll(): void {
    this.uploadedPdf = null;
    this.validationErrors = [];
    this.generalError = null;
    this.successMessage = null;
    this.userPassword = '';
    this.confirmPassword = '';
    this.ownerPassword = '';
    this.outputFileName = '';
    this.mode = 'add';
    this.isProcessing = false;
    this.isDragging = false;
    this.permissions = {
      canPrint: true,
      canPrintHighRes: true,
      canCopy: true,
      canModify: true,
      canAnnotate: true,
      canFillForms: true,
      canExtract: true,
      canAssemble: true
    };
    this.cdr.detectChanges();
  }
}