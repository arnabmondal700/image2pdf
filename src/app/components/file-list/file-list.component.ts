import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { FileItemComponent } from '../file-item/file-item.component';
import { FileObject } from '../../services/file.service';

@Component({
  selector: 'file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'],
  standalone: true,
  imports: [CommonModule, DragDropModule, FileItemComponent]
})
export class FileListComponent {
  @Input() uploadedFiles: FileObject[] = [];
  @Output() fileRemoved = new EventEmitter<number>();
  @Output() fileEditRequested = new EventEmitter<number>();
  @Output() fileReordered = new EventEmitter<{ from: number; to: number }>();

  onFileRemove(index: number) {
    this.fileRemoved.emit(index);
  }

  onFileEdit(index: number) {
    this.fileEditRequested.emit(index);
  }

  onDrop(event: CdkDragDrop<FileObject[]>) {
    if (event.previousIndex !== event.currentIndex) {
      this.fileReordered.emit({ from: event.previousIndex, to: event.currentIndex });
    }
  }
}
