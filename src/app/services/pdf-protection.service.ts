import { Injectable } from '@angular/core';
import { FileObject } from './file.service';
import { createQpdfRunner, toUint8Array } from 'qpdf-run';

/**
 * Permission flags for PDF protection
 */
export interface ProtectionPermissions {
  /** Allow printing (low resolution) */
  canPrint?: boolean;
  /** Allow copying text and images */
  canCopy?: boolean;
  /** Allow modifying the document */
  canModify?: boolean;
  /** Allow adding/modifying annotations */
  canAnnotate?: boolean;
  /** Allow filling in form fields */
  canFillForms?: boolean;
  /** Allow content extraction for accessibility */
  canExtract?: boolean;
  /** Allow document assembly */
  canAssemble?: boolean;
  /** Allow high-resolution printing */
  canPrintHighRes?: boolean;
}

/**
 * Options for adding password protection to a PDF
 */
export interface ProtectionOptions {
  /** User (open) password — required to view the document */
  userPassword?: string;
  /** Owner (permissions) password — required to modify permissions */
  ownerPassword?: string;
  /** Permission restrictions (only applies when ownerPassword is set) */
  permissions?: ProtectionPermissions;
}

/**
 * Result of a protection operation
 */
export interface ProtectionResult {
  blob: Blob;
  originalName: string;
  protectedName: string;
}

/**
 * Service for PDF password protection and encryption
 *
 * Uses qpdf-run (WASM-based QPDF) to add and remove password protection
 * from PDF files entirely in the browser, with no backend dependency.
 *
 * Features:
 * - Add user (open) password to restrict viewing
 * - Add owner password to restrict permissions (printing, copying, editing)
 * - Remove password protection from encrypted PDFs
 * - Fine-grained permission controls
 * - AES-256 encryption for maximum compatibility and security
 */
@Injectable({
  providedIn: 'root'
})
export class PdfProtectionService {
  private runner: Awaited<ReturnType<typeof createQpdfRunner>> | null = null;
  private runnerInitializing: Promise<void> | null = null;

  constructor() {}

  /**
   * Ensure the QPDF WASM runner is initialized
   * The runner is lazily created on first use
   */
  private async ensureRunner(): Promise<void> {
    if (this.runner) {
      console.log('[PDF-Protect] ensureRunner() — runner already exists, reusing cached instance');
      return;
    }

    if (this.runnerInitializing) {
      console.log('[PDF-Protect] ensureRunner() — initialization already in progress, waiting...');
      await this.runnerInitializing;
      console.log('[PDF-Protect] ensureRunner() — waited for concurrent init, runner ready');
      return;
    }

    console.log('[PDF-Protect] ensureRunner() — no runner found, starting fresh initialization');
    this.runnerInitializing = this.initializeRunner();
    await this.runnerInitializing;
    this.runnerInitializing = null;
    console.log('[PDF-Protect] ensureRunner() — initialization complete, runner ready');
  }

  /**
   * Initialize the QPDF WASM runner
   * In Angular CLI, the WASM and JS assets from qpdf-run need to be
   * accessible. We configure the assetBaseUrl to point to node_modules
   * via assets configuration, or use the default bundled location.
   */
  private async initializeRunner(): Promise<void> {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const qpdfJsUrl = new URL('/qpdf-lib/qpdf.js', origin).href;
      const wasmUrl = new URL('/qpdf-lib/qpdf.wasm', origin).href;
      const workerUrl = new URL('/qpdf-lib/worker.js', origin).href;
      console.log('[PDF-Protect] initializeRunner() — URLs:', { qpdfJsUrl, wasmUrl, workerUrl });
      console.log('[PDF-Protect] initializeRunner() — calling createQpdfRunner...');
      this.runner = await createQpdfRunner({
        env: 'browser',
        timeoutMs: 60000,
        qpdfJsUrl,
        wasmUrl,
        workerUrl
      });
      console.log('[PDF-Protect] initializeRunner() — runner created SUCCESSFULLY');
    } catch (error) {
      console.error('[PDF-Protect] initializeRunner() — FAILED:', error);
      throw new Error('PDF encryption is not available. The download will proceed without password protection.');
    }
  }

  /**
   * Add password protection to a PDF file
   *
   * @param pdfFile - The PDF file to protect
   * @param options - Protection options including passwords and permissions
   * @param fileName - Optional output filename (defaults to sanitized original name)
   * @returns Promise resolving to ProtectionResult with the encrypted PDF blob
   * @throws Error if no password is provided or QPDF processing fails
   */
  async addPassword(
    pdfFile: FileObject,
    options: ProtectionOptions,
    fileName?: string
  ): Promise<ProtectionResult> {
    console.log('[PDF-Protect] addPassword() — ENTERED');

    if (!pdfFile) {
      console.error('[PDF-Protect] addPassword() — No PDF file provided');
      throw new Error('No PDF file provided');
    }

    if (!options.userPassword && !options.ownerPassword) {
      console.error('[PDF-Protect] addPassword() — No password provided');
      throw new Error('At least one password (user or owner) must be provided');
    }

    console.log('[PDF-Protect] addPassword() — pdfFile:', { name: pdfFile.name, type: pdfFile.type, size: pdfFile.size, url: pdfFile.url?.slice(0, 80) });
    console.log('[PDF-Protect] addPassword() — options:', {
      hasUserPassword: !!options.userPassword,
      userPasswordLen: options.userPassword?.length,
      hasOwnerPassword: !!options.ownerPassword,
      ownerPasswordLen: options.ownerPassword?.length,
      permissions: options.permissions
    });
    console.log('[PDF-Protect] addPassword() — fileName:', fileName);

    console.log('[PDF-Protect] addPassword() — calling ensureRunner...');
    await this.ensureRunner();
    if (!this.runner) {
      console.error('[PDF-Protect] addPassword() — runner is null after ensureRunner!');
      throw new Error('PDF encryption engine is not available');
    }

    try {
      const pdfBytes = await this.fileToBytes(pdfFile);
      console.log('[PDF-Protect] addPassword() — PDF bytes loaded, length:', pdfBytes.length);

      // Build qpdf encryption arguments
      const userPw = options.userPassword || '';
      const ownerPw = options.ownerPassword || options.userPassword || '';
      console.log('[PDF-Protect] addPassword() — passwords prepared', { userPwLen: userPw.length, ownerPwLen: ownerPw.length });

      const args: string[] = [
        '--encrypt',
        userPw,
        ownerPw,
        '256' // AES-256 for maximum security
      ];

      // Add permission flags if owner password is set
      if (options.ownerPassword && options.permissions) {
        const perms = options.permissions;
        args.push(
          `--print=${perms.canPrintHighRes ? 'full' : perms.canPrint ? 'low' : 'none'}`,
          `--copy=${perms.canCopy ? 'y' : 'n'}`,
          `--modify=${perms.canModify ? 'y' : 'n'}`,
          `--annotate=${perms.canAnnotate ? 'y' : 'n'}`,
          `--form=${perms.canFillForms ? 'y' : 'n'}`,
          `--extract=${perms.canExtract ? 'y' : 'n'}`,
          `--assemble=${perms.canAssemble ? 'y' : 'n'}`
        );
      }

      // Input and output specification
      args.push('--', pdfFile.name, 'protected.pdf');
      console.log('[PDF-Protect] addPassword() — qpdf args:', args);
      console.log('[PDF-Protect] addPassword() — calling runner.runOne...');

      const result = await this.runner.runOne({
        input: pdfBytes,
        inputName: pdfFile.name,
        outputName: 'protected.pdf',
        args
      });

      console.log('[PDF-Protect] addPassword() — runOne completed, result length (from byteLength):', (result as unknown as { byteLength?: number }).byteLength ?? 'N/A');
      const resultArray = result as unknown as Uint8Array;
      console.log('[PDF-Protect] addPassword() — result length:', resultArray.length ?? 'unknown');

      const originalName = pdfFile.name.replace(/\.[^/.]+$/, '');
      const protectedName = this.sanitizeFileName(fileName || `${originalName}-protected`);
      const resultBytes = resultArray;
      const blob = new Blob([resultBytes as unknown as Blob], { type: 'application/pdf' });
      console.log('[PDF-Protect] addPassword() — blob created, size:', blob.size);
      console.log('[PDF-Protect] addPassword() — protectedName:', protectedName);

      return {
        blob,
        originalName,
        protectedName
      };
    } catch (error) {
      console.error('[PDF-Protect] addPassword() — CAUGHT ERROR:', error);
      if (error instanceof Error && error.message.includes('QPDF')) {
        throw new Error(`Failed to encrypt PDF: ${error.message}`);
      }
      throw new Error(
        `Failed to encrypt PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Remove password protection from an encrypted PDF
   *
   * @param pdfFile - The password-protected PDF file
   * @param currentPassword - The current password to decrypt the PDF
   * @param fileName - Optional output filename
   * @returns Promise resolving to ProtectionResult with the decrypted PDF blob
   * @throws Error if password is wrong or PDF cannot be decrypted
   */
  async removePassword(
    pdfFile: FileObject,
    currentPassword: string,
    fileName?: string
  ): Promise<ProtectionResult> {
    console.log('[PDF-Protect] removePassword() — ENTERED');

    if (!pdfFile) {
      console.error('[PDF-Protect] removePassword() — No PDF file provided');
      throw new Error('No PDF file provided');
    }

    if (!currentPassword) {
      console.error('[PDF-Protect] removePassword() — No password provided');
      throw new Error('Current password is required to decrypt the PDF');
    }

    console.log('[PDF-Protect] removePassword() — pdfFile:', { name: pdfFile.name, size: pdfFile.size });
    console.log('[PDF-Protect] removePassword() — password length:', currentPassword?.length);

    console.log('[PDF-Protect] removePassword() — calling ensureRunner...');
    await this.ensureRunner();
    if (!this.runner) {
      console.error('[PDF-Protect] removePassword() — runner is null');
      throw new Error('PDF encryption engine is not available');
    }

    try {
      const pdfBytes = await this.fileToBytes(pdfFile);
      console.log('[PDF-Protect] removePassword() — PDF bytes loaded, length:', pdfBytes.length);

      const args: string[] = [
        '--decrypt',
        `--password=${currentPassword}`,
        '--',
        pdfFile.name,
        'decrypted.pdf'
      ];
      console.log('[PDF-Protect] removePassword() — qpdf args:', args);

      const result = await this.runner.runOne({
        input: pdfBytes,
        inputName: pdfFile.name,
        outputName: 'decrypted.pdf',
        args
      });

      console.log('[PDF-Protect] removePassword() — runOne completed, result length:', result?.byteLength || result?.length || 'unknown');

      const originalName = pdfFile.name.replace(/\.[^/.]+$/, '');
      const protectedName = this.sanitizeFileName(fileName || `${originalName}-decrypted`);
      const blob = new Blob([new Uint8Array(result)], { type: 'application/pdf' });
      console.log('[PDF-Protect] removePassword() — blob size:', blob.size);

      return {
        blob,
        originalName,
        protectedName
      };
    } catch (error) {
      console.error('[PDF-Protect] removePassword() — CAUGHT ERROR:', error);
      if (error instanceof Error) {
        if (error.message.includes('password') || error.message.includes('invalid')) {
          throw new Error('Incorrect password. Please try again.');
        }
        throw new Error(`Failed to decrypt PDF: ${error.message}`);
      }
      throw new Error(
        `Failed to decrypt PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a PDF file is password protected
   *
   * @param pdfFile - The PDF file to check
   * @returns Promise resolving to true if the PDF is encrypted
   */
  async isPasswordProtected(pdfFile: FileObject): Promise<boolean> {
    console.log('[PDF-Protect] isPasswordProtected() — ENTERED', { name: pdfFile?.name });
    if (!pdfFile) {
      console.log('[PDF-Protect] isPasswordProtected() — no file, returning false');
      return false;
    }

    try {
      const pdfBytes = await this.fileToBytes(pdfFile);
      console.log('[PDF-Protect] isPasswordProtected() — bytes loaded:', pdfBytes.length);

      await this.ensureRunner();
      if (!this.runner) {
        console.log('[PDF-Protect] isPasswordProtected() — runner unavailable, returning false');
        return false;
      }

      const args: string[] = ['--check', '--', pdfFile.name];
      console.log('[PDF-Protect] isPasswordProtected() — args:', args);
      const result = await this.runner.runOne({
        input: pdfBytes,
        inputName: pdfFile.name,
        outputName: 'checked.pdf',
        args
      });
      console.log('[PDF-Protect] isPasswordProtected() — check completed, result length:', result?.length);
      return false;
    } catch (error) {
      console.log('[PDF-Protect] isPasswordProtected() — CAUGHT (likely encrypted):', error);
      return true;
    }
  }

  /**
   * Download a PDF blob as a file
   *
   * @param pdfBlob - The PDF Blob to download
   * @param fileName - Name for the downloaded file (will append .pdf if needed)
   */
  downloadPDF(pdfBlob: Blob, fileName: string): void {
    console.log('[PDF-Protect] downloadPDF() — blob size:', pdfBlob.size, 'fileName:', fileName);
    const sanitized = this.sanitizeFileName(fileName) || 'protected-document';
    const finalName = sanitized.endsWith('.pdf') ? sanitized : `${sanitized}.pdf`;
    console.log('[PDF-Protect] downloadPDF() — final download name:', finalName);

    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('[PDF-Protect] downloadPDF() — download triggered');
  }

  /**
   * Sanitize filename for safe download
   *
   * Removes path separators, special characters, and multiple extensions
   *
   * @param fileName - The filename to sanitize
   * @returns Sanitized filename
   */
  sanitizeFileName(fileName: string): string {
    if (!fileName || typeof fileName !== 'string') {
      return '';
    }

    // Remove path separators
    let sanitized = fileName.replace(/[/\\]/g, '');

    // Remove file extension if present (will be added back as .pdf)
    sanitized = sanitized.replace(/\.[^.]*$/, '');

    // Remove special characters, keep only alphanumeric, hyphens, underscores
    sanitized = sanitized.replace(/[^a-zA-Z0-9_-]/g, '');

    // Remove leading/trailing underscores
    sanitized = sanitized.replace(/^_+|_+$/g, '');

    return sanitized;
  }

  /**
   * Convert FileObject to Uint8Array for PDF processing
   *
   * @private
   * @param file - FileObject to convert
   * @returns Promise resolving to Uint8Array
   */
  private async fileToBytes(file: FileObject | Blob): Promise<Uint8Array> {
    console.log('[PDF-Protect] fileToBytes() — file type:', file?.constructor?.name, 'file keys:', Object.keys(file));

    if (file instanceof Blob && typeof file.arrayBuffer === 'function') {
      const bytes = new Uint8Array(await file.arrayBuffer());
      console.log('[PDF-Protect] fileToBytes() — via Blob.arrayBuffer, length:', bytes.length);
      return bytes;
    }

    const fileObject = file as FileObject;
    if (typeof fileObject.url === 'string' && fileObject.url.length > 0) {
      console.log('[PDF-Protect] fileToBytes() — via fetchPDFAsBytes, url starts with:', fileObject.url.slice(0, 60));
      return this.fetchPDFAsBytes(fileObject.url);
    }

    const arrayBufferReader = (file as unknown as { arrayBuffer?: () => Promise<ArrayBuffer> }).arrayBuffer;
    if (typeof arrayBufferReader === 'function') {
      const bytes = new Uint8Array(await arrayBufferReader.call(file));
      console.log('[PDF-Protect] fileToBytes() — via arrayBuffer() method, length:', bytes.length);
      return bytes;
    }

    console.error('[PDF-Protect] fileToBytes() — no usable data source found');
    throw new Error('PDF file data is unavailable');
  }

  /**
   * Fetch PDF file from URL and convert to Uint8Array
   *
   * @private
   * @param url - The URL to fetch (can be data URL or blob URL)
   * @returns Promise resolving to Uint8Array
   */
  private async fetchPDFAsBytes(url: string): Promise<Uint8Array> {
    if (url.startsWith('data:')) {
      return this.dataURLToBytes(url);
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      throw new Error(`Failed to fetch PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert a data URL to Uint8Array
   *
   * @private
   * @param dataUrl - The data URL to convert
   * @returns Uint8Array of the decoded data
   */
  private dataURLToBytes(dataUrl: string): Uint8Array {
    const base64 = dataUrl.split(',')[1];
    if (!base64) {
      throw new Error('Invalid data URL format');
    }

    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    return bytes;
  }
}