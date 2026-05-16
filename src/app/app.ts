import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { DragDropZoneComponent } from './components/drag-drop-zone/drag-drop-zone.component';
import { FileListComponent } from './components/file-list/file-list.component';
import { GeneratePDFButtonComponent } from './components/generate-pdf-button/generate-pdf-button.component';
import { FileService, FileObject } from './services/file.service';
import { PDFService } from './services/pdf.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrls: ['./app.scss'],
  standalone: true,
  imports: [
    CommonModule,
    AppHeaderComponent,
    DragDropZoneComponent,
    FileListComponent,
    GeneratePDFButtonComponent
  ]
})
export class App {
  private fileService = inject(FileService);
  private pdfService = inject(PDFService);
  private cdr = inject(ChangeDetectorRef);

  uploadedFiles: FileObject[] = [];
  isGenerating: boolean = false;
  isDragging: boolean = false;

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
      this.pdfService.generatePDF(this.uploadedFiles);
      this.uploadedFiles = [];
    } catch (error) {
      console.error('Failed to generate PDF:', error);
    } finally {
      this.isGenerating = false;
    }
  }
}
