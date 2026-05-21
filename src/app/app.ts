import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { DragDropZoneComponent } from './components/drag-drop-zone/drag-drop-zone.component';
import { FileListComponent } from './components/file-list/file-list.component';
import { ImageEditorModalComponent } from './components/image-editor-modal/image-editor-modal.component';
import { PdfSettingsPanelComponent } from './components/pdf-settings-panel/pdf-settings-panel.component';
import { PdfPreviewComponent } from './components/pdf-preview/pdf-preview.component';
import { FileService, FileObject, FileValidationError } from './services/file.service';
import { ImageOptimizerService } from './services/image-optimizer.service';
import { PDFService, PDFSettings } from './services/pdf.service';
import { PdfSettingsStorageService } from './services/pdf-settings-storage.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AppHeaderComponent,
    DragDropZoneComponent,
    FileListComponent,
    ImageEditorModalComponent,
    PdfPreviewComponent,
    PdfSettingsPanelComponent
  ]
})
export class App {
  private fileService = inject(FileService);
  private imageOptimizer = inject(ImageOptimizerService);
  private pdfService = inject(PDFService);
  private settingsStorage = inject(PdfSettingsStorageService);
  private cdr = inject(ChangeDetectorRef);

  uploadedFiles: FileObject[] = [];
  isGenerating: boolean = false;
  isDragging: boolean = false;
  editingFileIndex: number | null = null;
  validationErrors: FileValidationError[] = [];
  pdfSettings: PDFSettings;

  constructor() {
    // Load saved settings or use defaults
    const savedSettings = this.settingsStorage.loadSettings();
    this.pdfSettings = savedSettings || {
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

  get editingFile(): FileObject | null {
    if (this.editingFileIndex === null) return null;
    return this.uploadedFiles[this.editingFileIndex] ?? null;
  }

  // Handle files from drag-drop or file input
  onFilesSelected(files: FileList | File[]) {
    this.fileService.processFiles(files).then((result) => {
      this.uploadedFiles = [...this.uploadedFiles, ...result.successful];
      this.validationErrors = result.errors;
      
      // Clear validation errors after 5 seconds
      if (this.validationErrors.length > 0) {
        setTimeout(() => {
          this.validationErrors = [];
          this.cdr.detectChanges();
        }, 5000);
      }
      
      this.cdr.detectChanges();
    });
  }

  // Remove a file from the list
  onFileRemoved(index: number) {
    this.uploadedFiles = this.fileService.removeFile(this.uploadedFiles, index);
    if (this.editingFileIndex === index) {
      this.closeImageEditor();
    }
  }

  onFileEditRequested(index: number) {
    this.editingFileIndex = index;
  }

  onImageEditApplied(event: { index: number; url: string }) {
    if (!this.uploadedFiles[event.index]) return;

    this.uploadedFiles = this.uploadedFiles.map((item, index) =>
      index === event.index ? { ...item, url: event.url } : item
    );
    this.closeImageEditor();
  }

  closeImageEditor() {
    this.editingFileIndex = null;
  }

  // Handle file reordering
  onFileReordered(event: { from: number; to: number }) {
    this.uploadedFiles = this.fileService.reorderFiles(
      this.uploadedFiles,
      event.from,
      event.to
    );
  }

  // Handle PDF settings changes
  onPDFSettingsChanged(settings: PDFSettings) {
    this.pdfSettings = settings;
    // Auto-save settings to browser storage
    this.settingsStorage.saveSettings(settings);
  }

  // Update dragging state for drop zone
  onDragOverZone() {
    this.isDragging = true;
  }

  onDragLeaveZone() {
    this.isDragging = false;
  }

  // Generate PDF
  async onGeneratePDF() {
    if (this.uploadedFiles.length === 0) return;

    this.isGenerating = true;
    try {
      const optimizedFiles = await this.imageOptimizer.optimizeFiles(this.uploadedFiles, this.pdfSettings.quality);
      await this.pdfService.generatePDF(optimizedFiles, 'My_Converted_Images.pdf', this.pdfSettings);
      this.uploadedFiles = [];
    } catch (error) {
      this.validationErrors = [{
        fileName: 'PDF',
        reason: 'pdf-generation-error'
      }];
      
      setTimeout(() => {
        this.validationErrors = [];
        this.cdr.detectChanges();
      }, 5000);
    } finally {
      this.isGenerating = false;
      this.cdr.detectChanges();
    }
  }
}
