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
  @Output() removeFile = new EventEmitter<number>();
  @Output() editFile = new EventEmitter<number>();

  onRemove() {
    this.removeFile.emit(this.index);
  }

  onEdit() {
    this.editFile.emit(this.index);
  }
}
