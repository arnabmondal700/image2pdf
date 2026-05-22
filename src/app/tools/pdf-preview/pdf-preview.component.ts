import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tool-placeholder">
      <h1>PDF Preview</h1>
      <p>View and preview PDF files - Coming soon in Phase 3</p>
    </div>
  `,
  styles: [`
    .tool-placeholder {
      padding: 2rem;
      text-align: center;
      color: var(--text-secondary);
    }
  `]
})
export class PdfPreviewComponent {}
