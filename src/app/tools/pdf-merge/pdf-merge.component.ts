import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-merge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tool-placeholder">
      <h1>Merge PDFs</h1>
      <p>Combine multiple PDFs into one - Coming soon in Phase 4</p>
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
export class PdfMergeComponent {}
