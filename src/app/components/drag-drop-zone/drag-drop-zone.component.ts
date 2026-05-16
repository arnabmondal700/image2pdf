import { Component, EventEmitter, Input, Output, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'drag-drop-zone',
  templateUrl: './drag-drop-zone.component.html',
  styleUrls: ['./drag-drop-zone.component.scss'],
  standalone: true
})
export class DragDropZoneComponent {
  @ViewChild('fileInput', { read: ElementRef }) fileInput?: ElementRef<HTMLInputElement>;
  @Input() isDragging: boolean = false;
  @Output() filesSelected = new EventEmitter<File[]>();
  @Output() openFileDialog = new EventEmitter<void>();

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.filesSelected.emit(Array.from(files));
    }
  }

  triggerFileInput() {
    if (this.fileInput?.nativeElement) {
      this.fileInput.nativeElement.click();
    } else {
      const fileInputElement = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInputElement) {
        fileInputElement.click();
      }
    }
    this.openFileDialog.emit();
  }

  onFilesSelected(event: any) {
    const files = event.target.files;
    if (files) {
      this.filesSelected.emit(Array.from(files));
      // Reset the input value so the same file can be selected again
      event.target.value = '';
    }
  }
}
