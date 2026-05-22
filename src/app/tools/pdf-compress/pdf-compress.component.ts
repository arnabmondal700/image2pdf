import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pdf-compress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="tool-placeholder">
      <h1>Compress PDF</h1>
      <p>Reduce PDF file size while maintaining quality - Coming soon in Phase 6</p>
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
export class PdfCompressComponent {}
