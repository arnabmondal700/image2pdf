import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-split',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tool-placeholder">
      <h1>Split PDF</h1>
      <p>Split a PDF into separate pages or sections - Coming soon in Phase 4</p>
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
export class PdfSplitComponent {}
