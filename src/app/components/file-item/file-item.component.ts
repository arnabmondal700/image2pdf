import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'file-item',
  templateUrl: './file-item.component.html',
  styleUrls: ['./file-item.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class FileItemComponent {
  @Input() file: { name: string; url: string } | null = null;
  @Input() index: number = 0;
  @Input() isDragging: boolean = false;
  @Input() isDragOver: boolean = false;
  @Output() removeFile = new EventEmitter<number>();
  @Output() editFile = new EventEmitter<number>();
  @Output() dragStart = new EventEmitter<number>();
  @Output() dragOver = new EventEmitter<number>();
  @Output() dragLeave = new EventEmitter<void>();
  @Output() drop = new EventEmitter<number>();
  @Output() dragEnd = new EventEmitter<void>();

  onDragStart(event: DragEvent) {
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/html', '');
    }
    this.dragStart.emit(this.index);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOver.emit(this.index);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.dragLeave.emit();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.drop.emit(this.index);
  }

  onDragEnd(event: DragEvent) {
    event.preventDefault();
    this.dragEnd.emit();
  }

  onRemove() {
    this.removeFile.emit(this.index);
  }

  onEdit() {
    this.editFile.emit(this.index);
  }
}
