import { Injectable, inject } from '@angular/core';
import { PDFSettings } from './pdf.service';
import { IndexedDbService } from './storage/indexed-db.service';

const STORAGE_KEY = 'pdf_settings';
const DEFAULT_TOOL_ID = 'image-to-pdf';

@Injectable({
  providedIn: 'root'
})
export class PdfSettingsStorageService {
  private readonly db = inject(IndexedDbService);
  private readonly dbAvailable = IndexedDbService.isAvailable();
  private settingsCache = new Map<string, PDFSettings>();

  // ─── Public API ─────────────────────────────────────────────────────

  /**
   * Load saved PDF settings for a specific tool.
   * - Tries IndexedDB first (primary storage).
   * - Falls back to localStorage (legacy storage).
   * - Returns null if no saved settings exist in any layer.
   */
  async loadSettings(toolId: string = DEFAULT_TOOL_ID): Promise<PDFSettings | null> {
    // 1. In-memory cache
    const cached = this.settingsCache.get(toolId);
    if (cached) return cached;

    // 2. IndexedDB (primary)
    if (this.dbAvailable) {
      try {
        const row = await this.db.pdfSettings.get(toolId);
        if (row) {
          const settings = this.validateSettings(row.settings as Partial<PDFSettings>);
          this.settingsCache.set(toolId, settings);
          return settings;
        }
      } catch {
        // Fall through to localStorage
      }
    }

    // 3. localStorage (legacy) — migrate to IndexedDB
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<PDFSettings>;
        const settings = this.validateSettings(parsed);
        this.settingsCache.set(toolId, settings);

        // Migrate to IndexedDB and clean up localStorage
        this.saveSettings(settings, toolId).then(() => {
          try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
        });

        return settings;
      }
    } catch {
      // Not available
    }

    return null;
  }

  /**
   * Save PDF settings to IndexedDB (with in-memory cache).
   */
  async saveSettings(settings: PDFSettings, toolId: string = DEFAULT_TOOL_ID): Promise<void> {
    this.settingsCache.set(toolId, { ...settings });

    if (this.dbAvailable) {
      try {
        await this.db.pdfSettings.put({
          toolId,
          settings: { ...settings } as unknown as Record<string, unknown>,
          updatedAt: Date.now(),
        });
      } catch (error) {
        console.error('Error saving PDF settings to IndexedDB:', error);
        // Fallback to localStorage
        this.fallbackToLocalStorage(settings);
      }
    } else {
      this.fallbackToLocalStorage(settings);
    }
  }

  /**
   * Clear saved PDF settings for a tool from all storage layers.
   */
  async clearSettings(toolId: string = DEFAULT_TOOL_ID): Promise<void> {
    this.settingsCache.delete(toolId);

    if (this.dbAvailable) {
      try {
        await this.db.pdfSettings.delete(toolId);
      } catch (error) {
        console.error('Error clearing PDF settings from IndexedDB:', error);
      }
    }

    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  // ─── Legacy sync helper (used by existing sync callers) ─────────────

  /**
   * Synchronous settings save for backward compatibility with existing
   * components that cannot await.  This stores to localStorage immediately
   * and fires-and-forgets the IndexedDB write.
   */
  saveSettingsSync(settings: PDFSettings, toolId: string = DEFAULT_TOOL_ID): void {
    this.settingsCache.set(toolId, { ...settings });

    // Immediate localStorage write for synchronous readers
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* ignore */ }

    // Async IndexedDB write (fire-and-forget)
    if (this.dbAvailable) {
      this.db.pdfSettings.put({
        toolId,
        settings: { ...settings } as unknown as Record<string, unknown>,
        updatedAt: Date.now(),
      }).catch(() => { /* fallback already provided */ });
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────

  /**
   * Fallback to localStorage when IndexedDB is unavailable.
   */
  private fallbackToLocalStorage(settings: PDFSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving PDF settings to localStorage:', error);
    }
  }

  /**
   * Validate and fill in missing settings with defaults.
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
