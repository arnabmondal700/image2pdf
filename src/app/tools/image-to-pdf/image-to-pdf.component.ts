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
import { ToolDefinition } from '../tool.interface';
import { Subscription } from 'rxjs';

// Import shared components
import { AppHeaderComponent } from '../../components/app-header/app-header.component';
import { DragDropZoneComponent } from '../../components/drag-drop-zone/drag-drop-zone.component';
import { FileListComponent } from '../../components/file-list/file-list.component';
import { PdfSettingsPanelComponent } from '../../components/pdf-settings-panel/pdf-settings-panel.component';
import { PdfPreviewComponent } from '../../components/pdf-preview/pdf-preview.component';
import { ImageEditorModalComponent } from '../../components/image-editor-modal/image-editor-modal.component';

@Component({
  selector: 'app-image-to-pdf',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    AppHeaderComponent,
    DragDropZoneComponent,
    FileListComponent,
    PdfSettingsPanelComponent,
    PdfPreviewComponent,
    ImageEditorModalComponent
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
  private progressSubscription?: Subscription;

  // Tool metadata for integration
  toolDefinition: ToolDefinition = {
    id: 'image-to-pdf',
    name: 'Image to PDF',
    description: 'Convert images to PDF',
    icon: '🖼️',
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
    private cdr: ChangeDetectorRef
  ) {
    // Load saved PDF settings or use defaults
    this.pdfSettings = this.settingsStorage.loadSettings() || {
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
  }

  ngOnInit(): void {
    this.progressSubscription = this.pdfWorkerService.getProgress().subscribe((progress) => {
      this.generationProgress = progress;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.progressSubscription?.unsubscribe();
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
  onFileRemoved(index: number): void {
    this.uploadedFiles = this.uploadedFiles.filter((_, i) => i !== index);
    this.cdr.detectChanges();
  }

  /**
   * Handle file reordering via drag-drop
   */
  onFileReordered(event: { from: number; to: number }): void {
    if (event.from !== event.to) {
      moveItemInArray(this.uploadedFiles, event.from, event.to);
      this.cdr.detectChanges();
    }
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
  onImageEditApplied(event: { index: number; url: string }): void {
    if (!this.uploadedFiles[event.index]) return;

    this.uploadedFiles = this.uploadedFiles.map((item, index) =>
      index === event.index ? { ...item, url: event.url } : item
    );
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
   * Handle PDF settings changes and auto-save to localStorage
   */
  onPDFSettingsChanged(settings: PDFSettings): void {
    this.pdfSettings = settings;
    this.settingsStorage.saveSettings(settings);
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
      await this.pdfService.generatePDF(this.uploadedFiles, 'image-to-pdf.pdf', this.pdfSettings);
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
