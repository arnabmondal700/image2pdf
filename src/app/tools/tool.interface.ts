/**
 * Tool Interface - Defines the contract for all PDF tools
 * Enables plugin-style architecture where tools can be added/removed
 */

export interface ToolDefinition {
  /**
   * Unique identifier for the tool (e.g., 'image-to-pdf', 'pdf-merge', 'pdf-split')
   */
  id: string;

  /**
   * Display name shown in UI/navigation
   */
  name: string;

  /**
   * Description shown in tool selector
   */
  description: string;

  /**
   * Icon name or emoji for UI display
   */
  icon: string;

  /**
   * Route path for this tool (e.g., 'image-to-pdf', 'merge', 'split')
   */
  path: string;

  /**
   * Category for grouping tools (e.g., 'convert', 'merge', 'compress', 'edit', 'rearrange')
   */
  category: 'convert' | 'merge' | 'compress' | 'edit' | 'extract' | 'secure' | 'rearrange';

  /**
   * Whether this tool is enabled in the current build
   */
  enabled: boolean;

  /**
   * Priority for display order (higher = shown first)
   */
  priority: number;
}

export interface ToolComponent {
  /**
   * Tool metadata
   */
  toolDefinition: ToolDefinition;
}

/**
 * Input/output file types supported by tools
 */
export type FileFormat = 'pdf' | 'image' | 'mixed';

export interface ToolCapabilities {
  input: FileFormat;
  output: FileFormat;
  maxFiles?: number;
  supportedImageTypes?: string[];
  supportedPdfFeatures?: ('pages' | 'text' | 'images' | 'metadata')[];
}
