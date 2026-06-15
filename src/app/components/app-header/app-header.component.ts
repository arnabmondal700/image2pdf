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
}