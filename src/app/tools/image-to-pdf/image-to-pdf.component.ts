import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';

import { FileService, FileObject, FileValidationError } from '../../services/file.service';
import { ImageOptimizerService } from '../../services/image-optimizer.service';
import { PDFService } from '../../services/pdf.service';
import type { PDFSettings } from '../../services/pdf.service';
import { GenerationProgress, PDFGenerationCancelledError, PdfWorkerService } from '../../services/pdf-worker.service';
import { PdfSettingsStorageService } from '../../services/pdf-settings-storage.service';
import { PdfExtractionService } from '../../services/pdf-extraction.service';
import { ExportService } from '../../services/export.service';
import { SessionStorageService } from '../../services/storage/session-storage.service';
import { ToolDefinition } from '../tool.interface';
import { Subscription } from 'rxjs';

// Import shared components
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';
import { FileListComponent } from '../../components/file-list/file-list.component';
import { PdfSettingsPanelComponent } from '../../components/pdf-settings-panel/pdf-settings-panel.component';
import { PdfPreviewComponent } from '../../components/pdf-preview/pdf-preview.component';
import { ImageEditorModalComponent } from '../../components/image-editor-modal/image-editor-modal.component';
import { SeoContentComponent } from '../../components/seo-content/seo-content.component';
import { SeoContentConfigService } from '../../services/seo-content-config.service';
import type { SeoContentConfig } from '../../components/seo-content/seo-content.component';

@Component({
  selector: 'app-image-to-pdf',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    DragDropZoneComponent,
    FileListComponent,
    PdfSettingsPanelComponent,
    PdfPreviewComponent,
    ImageEditorModalComponent,
    SeoContentComponent
  ],
  templateUrl: '../../app.html',
  styleUrls: ['../../app.scss']
})
export class ImageToPdfComponent implements OnInit, OnDestroy {
  uploadedFiles: FileObject[] = [];
  pdfSettings: PDFSettings;
  isGenerating = false;
  isDragging = false;
  isProcessingPdf = false;
  processingPdfFileName = '';
  editingFileIndex: number | null = null;
  validationErrors: FileValidationError[] = [];
  generalError: string | null = null;
  generationProgress: GenerationProgress | null = null;
  seoContentConfig: SeoContentConfig | null = null;
  private progressSubscription?: Subscription;

  // Tool metadata for integration
  toolDefinition: ToolDefinition = {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Convert images to PDF',
    icon: 'fa-solid fa-image',
    path: 'image-to-pdf',
    category: 'convert',
    enabled: true,
    priority: 100
  };

  constructor(
    private fileService: FileService,
    private imageOptimizer: ImageOptimizerService,
    private pdfService: PDFService,
    private pdfWorkerService: PdfWorkerService,
    private settingsStorage: PdfSettingsStorageService,
    private pdfExtraction: PdfExtractionService,
    private exportService: ExportService,
    private sessionStorage: SessionStorageService,
    private cdr: ChangeDetectorRef,
    private seoContentConfigService: SeoContentConfigService
  ) {
    // Start with defaults; load persisted settings asynchronously
    this.pdfSettings = {
      pageSize: 'a4',
      orientation: 'portrait',
      quality: 'MEDIUM',
      dpi: 300,
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 8,
      marginRight: 8,
      imageFit: 'contain',
      imageAlignment: 'center',
      backgroundColor: '#ffffff',
      imagesPerPage: 1,
      exportMode: 'single-pdf'
    };
    this.restoreSettings();
  }

  ngOnInit(): void {
    this.progressSubscription = this.pdfWorkerService.getProgress().subscribe((progress) => {
      this.generationProgress = progress;
      this.cdr.detectChanges();
    });
    // Restore persisted files after component is visible
    this.restoreSessionFiles();
    this.seoContentConfig = this.seoContentConfigService.getConfig('image-to-pdf') ?? null;
  }

  ngOnDestroy(): void {
    this.progressSubscription?.unsubscribe();
  }

  /**
   * Restore persisted PDF settings asynchronously from IndexedDB/localStorage.
   * Uses defaults set in the constructor as a placeholder until storage is loaded.
   */
  private async restoreSettings(): Promise<void> {
    try {
      const saved = await this.settingsStorage.loadSettings(this.toolDefinition.id);
      if (saved) {
        this.pdfSettings = saved;
        this.cdr.detectChanges();
      }
    } catch {
      // Keep defaults silently
    }
  }

  /**
   * Restore persisted session files from IndexedDB.
   * Returns true if files were restored.
   */
  private async restoreSessionFiles(): Promise<boolean> {
    try {
      const restored = await this.sessionStorage.loadSession(this.toolDefinition.id);
      if (restored && restored.length > 0) {
        this.uploadedFiles = restored;
        this.cdr.detectChanges();
        return true;
      }
    } catch {
      // Ignore — keep empty queue
    }
    return false;
  }

  /**
   * Persist the current file list to IndexedDB in the background.
   * Best-effort: does not block the UI on failure.
   */
  private async persistSessionFiles(): Promise<void> {
    try {
      await this.sessionStorage.createSession(
        this.toolDefinition.id,
        this.toolDefinition.id,
        this.toolDefinition.name,
        this.uploadedFiles,
      );
    } catch {
      // Best-effort — storage failure should not block the user
    }
  }

  /**
   * Getter for editing file (required by template)
   */
  get editingFile(): FileObject | null {
    if (this.editingFileIndex === null) return null;
    return this.uploadedFiles[this.editingFileIndex] ?? null;
  }

  /**
   * Handle files from drag-drop or file picker
   */
  async onFilesSelected(files: FileList | File[]): Promise<void> {
    try {
      this.generalError = null;
      const result = await this.fileService.processFiles(files);
      
      // Separate images and PDFs
      const images = result.successful.filter(f => f.fileType === 'image');
      const pdfs = result.successful.filter(f => f.fileType === 'pdf');
      
      // Add images directly
      if (images.length > 0) {
        this.uploadedFiles = [...this.uploadedFiles, ...images];
      }
      
      // Process PDFs and extract pages as images
      for (const pdfFile of pdfs) {
        await this.processPdfFile(pdfFile);
      }
      
      // Persist to IndexedDB
      await this.persistSessionFiles();
      
      // Show validation errors if any
      if (result.errors.length > 0) {
        this.validationErrors = result.errors;
      }

      this.cdr.detectChanges();
    } catch (error) {
      this.generalError = error instanceof Error ? error.message : 'Error processing files';
      this.cdr.detectChanges();
    }
  }

  /**
   * Process a PDF file and extract its pages as images
   */
  private async processPdfFile(pdfFile: FileObject): Promise<void> {
    try {
      this.isProcessingPdf = true;
      this.processingPdfFileName = pdfFile.name;
      this.cdr.detectChanges();
      
      // Extract pages as canvas elements
      const canvases = await this.pdfExtraction.extractPdfAsImages(pdfFile.url, {
        scale: 1.5,
        maxPages: 50 // Limit to 50 pages max
      });
      
      // Convert each canvas to a FileObject
      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        const pageFile = new File([blob], `${pdfFile.name}-page-${i + 1}.png`, {
          type: 'image/png'
        });
        
        const reader = new FileReader();
        reader.onload = () => {
          const fileObj: FileObject = {
            name: `${pdfFile.name} - Page ${i + 1}`,
            url: reader.result as string,
            size: blob.size,
            type: 'image/png',
            fileType: 'image'
          };
          this.uploadedFiles = [...this.uploadedFiles, fileObj];
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(pageFile);
      }
    } catch (error) {
      console.error('Error processing PDF:', error);
      this.validationErrors.push({
        fileName: pdfFile.name,
        reason: 'pdf-generation-error'
      });
    } finally {
      this.isProcessingPdf = false;
      this.processingPdfFileName = '';
      this.cdr.detectChanges();
    }
  }

  /**
   * Remove file from upload queue
   */
  async onFileRemoved(index: number): Promise<void> {
    this.uploadedFiles = this.uploadedFiles.filter((_, i) => i !== index);
    await this.persistSessionFiles();
    this.cdr.detectChanges();
  }

  /**
   * Handle file reordering via drag-drop
   */
  async onFileReordered(event: { from: number; to: number }): Promise<void> {
    if (event.from !== event.to) {
      const reordered = [...this.uploadedFiles];
      moveItemInArray(reordered, event.from, event.to);
      this.uploadedFiles = reordered;
      await this.persistSessionFiles();
      this.cdr.detectChanges();
    }
  }

  /**
   * Handle file rotation
   */
  async onFileRotated(event: { index: number; rotation: number }): Promise<void> {
    if (!this.uploadedFiles[event.index]) return;

    this.uploadedFiles = this.uploadedFiles.map((item, index) =>
      index === event.index ? { ...item, rotation: event.rotation } : item
    );
    await this.persistSessionFiles();
    this.cdr.detectChanges();
  }

  /**
   * Handle file edit request
   */
  onFileEditRequested(index: number): void {
    this.editingFileIndex = index;
    this.cdr.detectChanges();
  }

  /**
   * Handle image edit completion
   */
  async onImageEditApplied(event: { index: number; url: string }): Promise<void> {
    if (!this.uploadedFiles[event.index]) return;

    this.uploadedFiles = this.uploadedFiles.map((item, index) =>
      index === event.index ? { ...item, url: event.url } : item
    );
    await this.persistSessionFiles();
    this.closeImageEditor();
  }

  /**
   * Close image editor modal
   */
  closeImageEditor(): void {
    this.editingFileIndex = null;
    this.cdr.detectChanges();
  }

  /**
   * Handle PDF settings changes and auto-save to IndexedDB (with localStorage fallback)
   */
  onPDFSettingsChanged(settings: PDFSettings): void {
    this.pdfSettings = settings;
    // Use sync save for immediate feedback; IndexedDB writes in the background
    this.settingsStorage.saveSettingsSync(settings, this.toolDefinition.id);
    this.cdr.detectChanges();
  }

  /**
   * Handle drag over zone
   */
  onDragOverZone(): void {
    this.isDragging = true;
  }

  /**
   * Handle drag leave zone
   */
  onDragLeaveZone(): void {
    this.isDragging = false;
  }

  /**
   * Generate PDF and trigger download
   */
  async onGeneratePDF(): Promise<void> {
    if (this.uploadedFiles.length === 0) {
      return;
    }

    this.isGenerating = true;
    try {
      const exportMode = this.pdfSettings.exportMode || 'single-pdf';
      await this.exportService.export(
        this.uploadedFiles,
        exportMode,
        this.pdfSettings,
        'image-to-pdf'
      );
    } catch (error) {
      if (error instanceof PDFGenerationCancelledError) {
        return;
      }

      this.validationErrors = [
        { fileName: 'pdf-generation', reason: 'pdf-generation-error' }
      ];
      console.error('PDF generation failed:', error);
    } finally {
      this.isGenerating = false;
      this.cdr.detectChanges();
    }
  }

  /**
   * Cancel the current worker-backed PDF generation.
   */
  onCancelGeneration(): void {
    this.pdfWorkerService.cancel();
    this.isGenerating = false;
    this.generationProgress = null;
    this.cdr.detectChanges();
  }
}