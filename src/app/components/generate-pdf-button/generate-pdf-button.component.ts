import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileObject } from '../../services/file.service';

@Component({
  selector: 'generate-pdf-button',
  templateUrl: './generate-pdf-button.component.html',
  styleUrls: ['./generate-pdf-button.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class GeneratePDFButtonComponent {
  @Input() uploadedFiles: FileObject[] = [];
  @Input() isGenerating: boolean = false;
  @Output() generateClicked = new EventEmitter<void>();

  isDisabled(): boolean {
    return this.uploadedFiles.length === 0 || this.isGenerating;
  }

  onGenerateClick() {
    if (!this.isDisabled()) {
      this.generateClicked.emit();
    }
  }
}
