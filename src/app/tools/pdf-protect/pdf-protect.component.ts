import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { PdfProtectionService, ProtectionOptions, ProtectionPermissions } from '../../services/pdf-protection.service';
import { ToolDefinition } from '../tool.interface';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';

/**
 * Component for PDF password protection and encryption
 *
 * Features:
 * - Single PDF upload via drag-drop
 * - Mode toggle: Add Password vs Remove Password
 * - Password input fields with show/hide toggle
 * - Owner password and permission controls
 * - Output filename input
 * - Apply/Clear actions with loading and error states
 */
@Component({
  selector: 'app-pdf-protect',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropZoneComponent],
  templateUrl: './pdf-protect.component.html',
  styleUrl: './pdf-protect.component.scss'
})
export class PdfProtectComponent {
  /**
   * Operation mode: 'add' for adding password, 'remove' for removing password
   */
  mode: 'add' | 'remove' = 'add';

  /**
   * Currently uploaded PDF file
   */
  uploadedPdf: FileObject | null = null;

  /**
   * User (open) password
   */
  userPassword: string = '';

  /**
   * Confirm user password (for validation in add mode)
   */
  confirmPassword: string = '';

  /**
   * Owner (permissions) password
   */
  ownerPassword: string = '';

  /**
   * Password visibility toggles
   */
  showUserPassword: boolean = false;
  showConfirmPassword: boolean = false;
  showOwnerPassword: boolean = false;

  /**
   * Permission flags (only used in add mode with owner password)
   */
  permissions: ProtectionPermissions = {
    canPrint: true,
    canCopy: true,
    canModify: true,
    canAnnotate: true,
    canFillForms: true,
    canExtract: true,
    canAssemble: true,
    canPrintHighRes: false
  };

  /**
   * Custom output filename
   */
  outputFileName: string = '';

  /**
   * Whether a protection operation is in progress
   */
  isProcessing: boolean = false;

  /**
   * Whether user is dragging over the upload zone
   */
  isDragging: boolean = false;

  /**
   * File validation errors
   */
  validationErrors: FileValidationError[] = [];

  /**
   * General operation error message
   */
  generalError: string | null = null;

  /**
   * Success message after operation
   */
  successMessage: string | null = null;

  /**
   * Tool definition for registration
   */
  toolDefinition: ToolDefinition = {
    id: 'pdf-protect',
    name: 'Protect PDF',
    description: 'Add or remove password protection and set permissions',
    icon: 'fa-solid fa-lock',
    path: 'protect',
    category: 'secure',
    enabled: true,
    priority: 60
  };

  constructor(
    private fileService: FileService,
    private pdfProtectionService: PdfProtectionService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Helper to convert FileList to File array for template binding
   */
  toFileArray(files: FileList | null | undefined): File[] {
    return files ? Array.from(files) : [];
  }

  /**
   * Handle file selection from input or drag-drop
   */
  async onFilesSelected(files: File[]): Promise<void> {
    try {
      this.generalError = null;
      this.validationErrors = [];
      this.successMessage = null;

      const results = await this.fileService.processFiles(files);
      const pdfFiles = results.successful.filter((f: FileObject) => f.type === 'application/pdf');

      if (pdfFiles.length === 0) {
        this.validationErrors = results.errors;
        this.cdr.markForCheck();
        return;
      }

      const uploadedPdf = pdfFiles[0];
      if (!uploadedPdf) {
        this.generalError = 'No PDF files provided';
        this.cdr.markForCheck();
        return;
      }

      this.uploadedPdf = uploadedPdf;

      // Set default output filename
      this.outputFileName = this.pdfProtectionService.sanitizeFileName(uploadedPdf.name) || 'protected-pdf';
      this.cdr.markForCheck();
    } catch (error) {
      this.uploadedPdf = null;
      this.outputFileName = '';
      this.generalError = error instanceof Error ? error.message : 'Failed to load PDF';
      this.cdr.markForCheck();
    }
  }

  /**
   * Handle PDF removal
   */
  onPdfRemoved(): void {
    this.uploadedPdf = null;
    this.outputFileName = '';
    this.validationErrors = [];
    this.generalError = null;
    this.successMessage = null;
    this.userPassword = '';
    this.confirmPassword = '';
    this.ownerPassword = '';
    this.cdr.markForCheck();
  }

  /**
   * Toggle operation mode between add and remove password
   */
  toggleMode(mode: 'add' | 'remove'): void {
    this.mode = mode;
    this.generalError = null;
    this.successMessage = null;
    this.userPassword = '';
    this.confirmPassword = '';
    this.ownerPassword = '';
    this.cdr.markForCheck();
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(field: 'user' | 'confirm' | 'owner'): void {
    if (field === 'user') {
      this.showUserPassword = !this.showUserPassword;
    } else if (field === 'confirm') {
      this.showConfirmPassword = !this.showConfirmPassword;
    } else if (field === 'owner') {
      this.showOwnerPassword = !this.showOwnerPassword;
    }
  }

  /**
   * Update a permission flag
   */
  updatePermission(key: keyof ProtectionPermissions, value: boolean): void {
    this.permissions = { ...this.permissions, [key]: value };
  }

  /**
   * Get password input type based on visibility toggle
   */
  getPasswordInputType(showPassword: boolean): string {
    return showPassword ? 'text' : 'password';
  }

  /**
   * Whether the apply button should be disabled
   */
  isApplyDisabled(): boolean {
    if (!this.uploadedPdf || this.isProcessing) {
      return true;
    }

    if (this.mode === 'add') {
      // Must have at least user password
      if (!this.userPassword) {
        return true;
      }
      // Password confirmation must match
      if (this.userPassword !== this.confirmPassword) {
        return true;
      }
      // Minimum password length
      if (this.userPassword.length < 4) {
        return true;
      }
    }

    if (this.mode === 'remove') {
      return !this.userPassword;
    }

    return false;
  }

  /**
   * Get dynamic button label based on state
   */
  getApplyButtonLabel(): string {
    if (this.isProcessing) {
      return this.mode === 'add' ? 'Applying protection...' : 'Removing password...';
    }
    if (!this.uploadedPdf) {
      return 'Upload PDF to start';
    }
    if (this.mode === 'add') {
      return 'Apply Password Protection';
    }
    return 'Remove Password';
  }

  /**
   * Check if passwords match
   */
  passwordsMatch(): boolean {
    if (!this.userPassword || !this.confirmPassword) {
      return false;
    }
    return this.userPassword === this.confirmPassword;
  }

  /**
   * Apply password protection or removal
   */
  async onApply(): Promise<void> {
    console.log('[PDF-Protect-Component] onApply() — ENTERED');
    console.log('[PDF-Protect-Component] onApply() — mode:', this.mode);
    console.log('[PDF-Protect-Component] onApply() — uploadedPdf:', this.uploadedPdf ? { name: this.uploadedPdf.name, size: this.uploadedPdf.size } : 'NULL');
    console.log('[PDF-Protect-Component] onApply() — userPassword length:', this.userPassword?.length);
    console.log('[PDF-Protect-Component] onApply() — ownerPassword length:', this.ownerPassword?.length);
    console.log('[PDF-Protect-Component] onApply() — outputFileName:', this.outputFileName);
    console.log('[PDF-Protect-Component] onApply() — isApplyDisabled:', this.isApplyDisabled());

    if (!this.uploadedPdf) {
      console.log('[PDF-Protect-Component] onApply() — no PDF uploaded, aborting');
      this.generalError = 'Please upload a PDF first';
      return;
    }

    if (this.isApplyDisabled()) {
      console.log('[PDF-Protect-Component] onApply() — apply disabled, aborting');
      return;
    }

    this.isProcessing = true;
    this.generalError = null;
    this.successMessage = null;

    try {
      if (this.mode === 'add') {
        console.log('[PDF-Protect-Component] onApply() — ADD mode');
        // Build protection options
        const options: ProtectionOptions = {
          userPassword: this.userPassword
        };
        console.log('[PDF-Protect-Component] onApply() — base options:', { userPasswordLen: options.userPassword?.length });

        // Add owner password if provided and different from user password
        if (this.ownerPassword) {
          options.ownerPassword = this.ownerPassword;
          options.permissions = { ...this.permissions };
          console.log('[PDF-Protect-Component] onApply() — owner password added, permissions:', options.permissions);
        } else {
          console.log('[PDF-Protect-Component] onApply() — no owner password, using user password as owner');
        }

        console.log('[PDF-Protect-Component] onApply() — calling addPassword...');
        const result = await this.pdfProtectionService.addPassword(
          this.uploadedPdf,
          options,
          this.outputFileName
        );
        console.log('[PDF-Protect-Component] onApply() — addPassword returned, blob size:', result.blob.size, 'protectedName:', result.protectedName);

        this.pdfProtectionService.downloadPDF(result.blob, result.protectedName);
        this.successMessage = `PDF protected successfully — ${result.protectedName}.pdf downloaded`;
        console.log('[PDF-Protect-Component] onApply() — download triggered, success message set');
      } else {
        console.log('[PDF-Protect-Component] onApply() — REMOVE mode');
        console.log('[PDF-Protect-Component] onApply() — calling removePassword...');
        const result = await this.pdfProtectionService.removePassword(
          this.uploadedPdf,
          this.userPassword,
          this.outputFileName
        );
        console.log('[PDF-Protect-Component] onApply() — removePassword returned, blob size:', result.blob.size);

        this.pdfProtectionService.downloadPDF(result.blob, result.protectedName);
        this.successMessage = `Password removed successfully — ${result.protectedName}.pdf downloaded`;
        console.log('[PDF-Protect-Component] onApply() — download triggered, success message set');
      }
    } catch (error) {
      console.error('[PDF-Protect-Component] onApply() — CAUGHT ERROR:', error);
      this.generalError = error instanceof Error ? error.message : 'Operation failed';
    } finally {
      this.isProcessing = false;
      console.log('[PDF-Protect-Component] onApply() — FINALLY, isProcessing set to false');
      this.cdr.markForCheck();
    }
  }

  /**
   * Clear all inputs and reset form
   */
  clearAll(): void {
    this.onPdfRemoved();
    this.mode = 'add';
    this.permissions = {
      canPrint: true,
      canCopy: true,
      canModify: true,
      canAnnotate: true,
      canFillForms: true,
      canExtract: true,
      canAssemble: true,
      canPrintHighRes: false
    };
    this.cdr.markForCheck();
  }

  /**
   * Handle drag-over for visual feedback
   */
  onDragOverZone(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  /**
   * Handle drag-leave for visual feedback
   */
  onDragLeaveZone(): void {
    this.isDragging = false;
  }

  /**
   * Handle file dialog open
   */
  onFileDialogOpen(): void {
    this.isDragging = false;
  }

  /**
   * Handle PDF files dropped on the upload zone
   */
  onDropZone(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    void this.onFilesSelected(this.toFileArray(event.dataTransfer?.files));
  }

  /**
   * Get info text based on state
   */
  getInfoText(): string {
    if (!this.uploadedPdf) {
      return 'Upload a PDF to begin';
    }
    const sizeKb = (this.uploadedPdf.size / 1024).toFixed(1);
    if (this.mode === 'add') {
      return `${this.uploadedPdf.name} (${sizeKb} KB) — Ready for encryption`;
    }
    return `${this.uploadedPdf.name} (${sizeKb} KB) — Ready for decryption`;
  }
}