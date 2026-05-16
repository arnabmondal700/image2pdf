import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { DragDropZoneComponent } from './components/drag-drop-zone/drag-drop-zone.component';
import { FileListComponent } from './components/file-list/file-list.component';
import { GeneratePDFButtonComponent } from './components/generate-pdf-button/generate-pdf-button.component';
import { ImageEditorModalComponent } from './components/image-editor-modal/image-editor-modal.component';
import { FileService, FileObject } from './services/file.service';
import { PDFService, PDFSettings } from './services/pdf.service';

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
    GeneratePDFButtonComponent,
    ImageEditorModalComponent
  ]
})
export class App {
  private fileService = inject(FileService);
  private pdfService = inject(PDFService);
  private cdr = inject(ChangeDetectorRef);

  uploadedFiles: FileObject[] = [];
  isGenerating: boolean = false;
  isDragging: boolean = false;
  editingFileIndex: number | null = null;
  pdfSettings: PDFSettings = {
    pageSize: 'a4',
    orientation: 'portrait',
    quality: 'MEDIUM'
  };

  get editingFile(): FileObject | null {
    if (this.editingFileIndex === null) return null;
    return this.uploadedFiles[this.editingFileIndex] ?? null;
  }

  // Handle files from drag-drop or file input
  onFilesSelected(files: FileList | File[]) {
    console.log('onFilesSelected called with', files.length, 'files');
    this.fileService.processFiles(files).then((newFiles) => {
      console.log('processFiles resolved with', newFiles.length, 'new files');
      this.uploadedFiles = [...this.uploadedFiles, ...newFiles];
      console.log('uploadedFiles updated, total:', this.uploadedFiles.length);
      this.cdr.detectChanges();
    }).catch((error) => {
      console.error('Error processing files:', error);
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

  // Update dragging state for drop zone
  onDragOverZone() {
    this.isDragging = true;
  }

  onDragLeaveZone() {
    this.isDragging = false;
  }

  // Generate PDF
  onGeneratePDF() {
    if (this.uploadedFiles.length === 0) return;

    this.isGenerating = true;
    try {
      this.pdfService.generatePDF(this.uploadedFiles, 'My_Converted_Images.pdf', this.pdfSettings);
      this.uploadedFiles = [];
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      this.isGenerating = false;
    }
  }
}
