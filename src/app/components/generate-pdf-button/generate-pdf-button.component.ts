import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FileObject } from '../../services/file.service';
import { GenerationProgress } from '../../services/pdf-worker.service';

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
  @Input() generationProgress: GenerationProgress | null = null;
  @Output() generateClicked = new EventEmitter<void>();
  @Output() cancelClicked = new EventEmitter<void>();

  isDisabled(): boolean {
    return this.uploadedFiles.length === 0 || this.isGenerating;
  }

  onGenerateClick() {
    if (!this.isDisabled()) {
      this.generateClicked.emit();
    }
  }

  onCancelClick(event: Event) {
    event.stopPropagation();
    if (this.isGenerating) {
      this.cancelClicked.emit();
    }
  }

  getProgressPercent(): number {
    if (!this.generationProgress || this.generationProgress.total <= 0) {
      return 0;
    }

    return Math.min(
      100,
      Math.max(0, Math.round((this.generationProgress.current / this.generationProgress.total) * 100))
    );
  }

  getProgressLabel(): string {
    return this.generationProgress?.status ?? 'Preparing PDF';
  }
}
