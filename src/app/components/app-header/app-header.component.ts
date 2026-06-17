import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ToolRegistryService } from '../../tools/tool-registry.service';
import type { ToolDefinition } from '../../tools/tool.interface';

@Component({
  selector: 'app-header',
  templateUrl: './app-header.component.html',
  styleUrls: ['./app-header.component.scss'],
  standalone: true,
  imports: [RouterLink, RouterLinkActive]
})
export class AppHeaderComponent {
  private readonly toolRegistry = inject(ToolRegistryService);
  readonly tools: ToolDefinition[] = this.toolRegistry.getEnabledTools();
  title = 'Image to PDF Converter';
  subtitle = 'Convert images to PDF with ease';

  /**
   * Returns the Font Awesome icon class for the given tool.
   */
  getToolIcon(tool: ToolDefinition): string {
    switch (tool.id) {
      case 'image-to-pdf': return 'fa-solid fa-image';
      case 'pdf-preview': return 'fa-solid fa-eye';
      case 'pdf-merge': return 'fa-solid fa-paperclip';
      case 'pdf-split': return 'fa-solid fa-scissors';
      case 'pdf-rearrange': return 'fa-solid fa-arrows-rotate';
      case 'pdf-compress': return 'fa-solid fa-compress';
      case 'pdf-protect': return 'fa-solid fa-lock';
      case 'pdf-to-image': return 'fa-solid fa-file-image';
      case 'mixed-builder': return 'fa-solid fa-cubes';
      default: return 'fa-solid fa-file-pdf';
    }
  }
}