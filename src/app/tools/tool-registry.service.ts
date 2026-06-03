import { Injectable } from '@angular/core';
import { ToolDefinition } from './tool.interface';

/**
 * Central registry for all available PDF tools
 * Manages tool discovery, enabling/disabling, and routing
 */
@Injectable({
  providedIn: 'root'
})
export class ToolRegistryService {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  /**
   * Register all default tools
   */
  private registerDefaultTools(): void {
    // Image to PDF - Primary tool
    this.registerTool({
      id: 'image-to-pdf',
      name: 'Image to PDF',
      description: 'Convert images to PDF with customizable layout and settings',
      icon: '🖼️',
      path: 'image-to-pdf',
      category: 'convert',
      enabled: true,
      priority: 100
    });

    // PDF Preview & Merge - Phase 3+
    this.registerTool({
      id: 'pdf-preview',
      name: 'PDF Preview',
      description: 'View and preview PDF files',
      icon: '👁️',
      path: 'pdf-preview',
      category: 'edit',
      enabled: true,
      priority: 90
    });

    // Future tools (disabled for now)
    this.registerTool({
      id: 'pdf-merge',
      name: 'Merge PDFs',
      description: 'Combine multiple PDFs into one',
      icon: '📎',
      path: 'merge',
      category: 'merge',
      enabled: true,
      priority: 80
    });

    this.registerTool({
      id: 'pdf-split',
      name: 'Split PDF',
      description: 'Split a PDF into separate pages or sections',
      icon: '✂️',
      path: 'split',
      category: 'extract',
      enabled: true,
      priority: 75
    });

    this.registerTool({
      id: 'pdf-rearrange',
      name: 'Rearrange PDF',
      description: 'Reorder, delete, or duplicate pages in a PDF',
      icon: '📑',
      path: 'rearrange',
      category: 'rearrange',
      enabled: true,
      priority: 70
    });

    this.registerTool({
      id: 'pdf-compress',
      name: 'Compress PDF',
      description: 'Reduce PDF file size while maintaining quality',
      icon: '🗜️',
      path: 'compress',
      category: 'compress',
      enabled: false,
      priority: 60
    });
  }

  /**
   * Register a new tool
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  /**
   * Get tool by ID
   */
  getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get only enabled tools, sorted by priority
   */
  getEnabledTools(): ToolDefinition[] {
    return this.getAllTools()
      .filter(tool => tool.enabled)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get tools by category
   */
  getToolsByCategory(category: string): ToolDefinition[] {
    return this.getEnabledTools().filter(tool => tool.category === category);
  }

  /**
   * Enable/disable a tool
   */
  setToolEnabled(id: string, enabled: boolean): void {
    const tool = this.tools.get(id);
    if (tool) {
      tool.enabled = enabled;
    }
  }

  /**
   * Get primary tool (highest priority)
   */
  getPrimaryTool(): ToolDefinition | undefined {
    const enabled = this.getEnabledTools();
    return enabled.length > 0 ? enabled[0] : undefined;
  }
}
