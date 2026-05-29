import { Injectable } from '@angular/core';

export interface HeaderFooterConfig {
  enabled: boolean;
  text: string;
  fontSize?: number;
  fontColor?: string;
}

export interface HeaderFooterSettings {
  header?: HeaderFooterConfig;
  footer?: HeaderFooterConfig;
}

@Injectable({
  providedIn: 'root'
})
export class HeaderFooterService {
  private readonly DEFAULT_FONT_SIZE = 10;
  private readonly DEFAULT_FONT_COLOR = '#000000';
  private readonly TEMPLATE_VARIABLES = {
    '{date}': 'current date (YYYY-MM-DD)',
    '{page}': 'current page number',
    '{totalPages}': 'total number of pages',
    '{filename}': 'PDF filename without extension'
  };

  getTemplateVariables(): Record<string, string> {
    return { ...this.TEMPLATE_VARIABLES };
  }

  /**
   * Replace template variables in header/footer text
   */
  replaceTemplateVariables(
    text: string,
    currentPage: number,
    totalPages: number,
    filename: string
  ): string {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    const filenameWithoutExt = filename.replace(/\.[^/.]+$/, '');

    return text
      .replace(/{date}/g, dateString)
      .replace(/{page}/g, String(currentPage))
      .replace(/{totalPages}/g, String(totalPages))
      .replace(/{filename}/g, filenameWithoutExt);
  }

  /**
   * Validate header/footer text
   */
  validateHeaderFooterText(text: string): { valid: boolean; error?: string } {
    if (!text) {
      return { valid: true }; // Empty text is valid (means disabled)
    }

    if (text.length > 200) {
      return {
        valid: false,
        error: 'Header/footer text cannot exceed 200 characters'
      };
    }

    return { valid: true };
  }

  /**
   * Get default header/footer config
   */
  getDefaultConfig(): HeaderFooterConfig {
    return {
      enabled: false,
      text: '',
      fontSize: this.DEFAULT_FONT_SIZE,
      fontColor: this.DEFAULT_FONT_COLOR
    };
  }

  /**
   * Coerce font size to valid range (8-14)
   */
  coerceFontSize(size: unknown): number {
    const numericSize = Number(size);
    if (!Number.isFinite(numericSize)) {
      return this.DEFAULT_FONT_SIZE;
    }
    return Math.max(8, Math.min(14, numericSize));
  }

  /**
   * Coerce font color to valid hex color
   */
  coerceFontColor(color: unknown): string {
    return typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)
      ? color
      : this.DEFAULT_FONT_COLOR;
  }

  /**
   * Ensure header/footer settings are valid
   */
  resolveHeaderFooterSettings(settings: Partial<HeaderFooterSettings> | undefined): HeaderFooterSettings {
    return {
      header: this.resolveConfig(settings?.header),
      footer: this.resolveConfig(settings?.footer)
    };
  }

  /**
   * Ensure individual config is valid
   */
  private resolveConfig(config: Partial<HeaderFooterConfig> | undefined): HeaderFooterConfig {
    if (!config) {
      return this.getDefaultConfig();
    }

    return {
      enabled: Boolean(config.enabled),
      text: String(config.text || ''),
      fontSize: this.coerceFontSize(config.fontSize),
      fontColor: this.coerceFontColor(config.fontColor)
    };
  }
}
