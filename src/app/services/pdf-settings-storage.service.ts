import { Injectable } from '@angular/core';
import { PDFSettings } from './pdf.service';

const STORAGE_KEY = 'pdf_settings';

@Injectable({
  providedIn: 'root'
})
export class PdfSettingsStorageService {
  /**
   * Load saved PDF settings from browser storage
   * Returns null if no saved settings exist
   */
  loadSettings(): PDFSettings | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;

      const parsed = JSON.parse(stored) as Partial<PDFSettings>;
      // Ensure all required fields exist
      return this.validateSettings(parsed);
    } catch (error) {
      console.error('Error loading PDF settings from storage:', error);
      return null;
    }
  }

  /**
   * Save PDF settings to browser storage
   */
  saveSettings(settings: PDFSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving PDF settings to storage:', error);
    }
  }

  /**
   * Clear saved PDF settings from browser storage
   */
  clearSettings(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing PDF settings from storage:', error);
    }
  }

  /**
   * Validate and fill in missing settings with defaults
   */
  private validateSettings(partial: Partial<PDFSettings>): PDFSettings {
    const defaults: PDFSettings = {
      pageSize: 'a4',
      orientation: 'portrait',
      quality: 'MEDIUM',
      dpi: 300,
      marginTop: 8,
      marginBottom: 8,
      marginLeft: 8,
      marginRight: 8,
      imageFit: 'contain',
      imageAlignment: 'center',
      backgroundColor: '#ffffff',
      imagesPerPage: 1
    };

    return {
      pageSize: (partial.pageSize || defaults.pageSize) as 'a4' | 'letter' | 'legal',
      orientation: (partial.orientation || defaults.orientation) as 'portrait' | 'landscape',
      quality: (partial.quality || defaults.quality) as 'FAST' | 'MEDIUM' | 'SLOW',
      dpi: this.coerceDpi(partial.dpi),
      marginTop: Number.isFinite(partial.marginTop) ? partial.marginTop! : defaults.marginTop,
      marginBottom: Number.isFinite(partial.marginBottom) ? partial.marginBottom! : defaults.marginBottom,
      marginLeft: Number.isFinite(partial.marginLeft) ? partial.marginLeft! : defaults.marginLeft,
      marginRight: Number.isFinite(partial.marginRight) ? partial.marginRight! : defaults.marginRight,
      imageFit: (partial.imageFit || defaults.imageFit) as 'contain' | 'cover' | 'stretch',
      imageAlignment: (partial.imageAlignment || defaults.imageAlignment) as 'center' | 'top' | 'bottom',
      backgroundColor: partial.backgroundColor || defaults.backgroundColor,
      imagesPerPage: ([1, 2, 4].includes(partial.imagesPerPage as number) ? partial.imagesPerPage : defaults.imagesPerPage) as 1 | 2 | 4
    };
  }

  /**
   * Coerce DPI to a valid number between 72 and 600.
   * Returns 300 (standard print resolution) as the default.
   */
  private coerceDpi(value: unknown): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? Math.min(600, Math.max(72, numericValue)) : 300;
  }
}
