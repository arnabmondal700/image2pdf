import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileObject } from '../../services/file.service';

@Component({
  selector: 'file-item',
  templateUrl: './file-item.component.html',
  styleUrls: ['./file-item.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class FileItemComponent {
  @Input() file: FileObject | null = null;
  @Input() index: number = 0;
  @Output() removeFile = new EventEmitter<number>();
  @Output() editFile = new EventEmitter<number>();
  @Output() rotateFile = new EventEmitter<{ index: number; rotation: number }>();

  onRemove() {
    this.removeFile.emit(this.index);
  }

  onEdit() {
    this.editFile.emit(this.index);
  }

  onRotateLeft() {
    const currentRotation = this.file?.rotation || 0;
    const newRotation = (currentRotation + 270) % 360;
    this.rotateFile.emit({ index: this.index, rotation: newRotation });
  }

  onRotateRight() {
    const currentRotation = this.file?.rotation || 0;
    const newRotation = (currentRotation + 90) % 360;
    this.rotateFile.emit({ index: this.index, rotation: newRotation });
  }

  getRotationStyle(): { transform: string } {
    const rotation = this.file?.rotation || 0;
    return { transform: `rotate(${rotation}deg)` };
  }
}
