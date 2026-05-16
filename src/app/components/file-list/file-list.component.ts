import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileItemComponent } from '../file-item/file-item.component';
import { FileObject } from '../../services/file.service';

@Component({
  selector: 'file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FileItemComponent]
})
export class FileListComponent {
  @Input() uploadedFiles: FileObject[] = [];
  @Output() fileRemoved = new EventEmitter<number>();
  @Output() fileReordered = new EventEmitter<{ from: number; to: number }>();

  draggedIndex: number | null = null;
  dragoverIndex: number | null = null;

  onFileRemove(index: number) {
    this.fileRemoved.emit(index);
  }

  onDragStart(index: number) {
    this.draggedIndex = index;
  }

  onDragOver(index: number) {
    this.dragoverIndex = index;
  }

  onDragLeave() {
    this.dragoverIndex = null;
  }

  onDrop(toIndex: number) {
    if (this.draggedIndex !== null && this.draggedIndex !== toIndex) {
      this.fileReordered.emit({ from: this.draggedIndex, to: toIndex });
    }
    this.draggedIndex = null;
    this.dragoverIndex = null;
  }

  onDragEnd() {
    this.draggedIndex = null;
    this.dragoverIndex = null;
  }
}
