import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

/**
 * Manages application theme (light / dark / system) with localStorage persistence.
 * Applies a data-theme attribute on the <html> element so CSS can respond.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly htmlEl = this.document.documentElement;

  /** User's explicit selection: 'light' | 'dark' | 'system' */
  private readonly _mode = signal<ThemeMode>(this.readStoredMode());

  /** The currently active mode signal */
  readonly mode = this._mode.asReadonly();

  /** The effective theme actually applied ('light' or 'dark'), computed from mode + system preference */
  readonly effectiveTheme = computed<'light' | 'dark'>(() => {
    const m = this._mode();
    if (m === 'system') {
      return this.systemPrefersDark() ? 'dark' : 'light';
    }
    return m;
  });

  /** Whether the icon should show a checkmark / active state */
  readonly isSystem = computed(() => this._mode() === 'system');
  readonly isDark = computed(() => this._mode() === 'dark');
  readonly isLight = computed(() => this._mode() === 'light');

  private systemPrefersDark = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  constructor() {
    // Immediately apply the stored/elected theme on service init
    this.applyTheme(this.effectiveTheme());

    // Watch for system preference changes when in 'system' mode
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', () => {
      if (this._mode() === 'system') {
        this.applyTheme(this.effectiveTheme());
      }
    });

    // React when the user changes the mode
    effect(() => {
      const m = this._mode();
      this.persistMode(m);
      this.applyTheme(this.effectiveTheme());
    });
  }

  /** Set the theme mode */
  setTheme(mode: ThemeMode): void {
    this._mode.set(mode);
  }

  /** Cycle through modes: system → light → dark → system */
  toggleTheme(): void {
    const current = this._mode();
    const order: ThemeMode[] = ['system', 'light', 'dark'];
    const idx = order.indexOf(current);
    this._mode.set(order[(idx + 1) % order.length]);
  }

  private applyTheme(effective: 'light' | 'dark'): void {
    this.htmlEl.setAttribute('data-theme', effective);
  }

  private persistMode(mode: ThemeMode): void {
    try {
      localStorage.setItem('app-theme', mode);
    } catch {
      // silently ignore if localStorage is unavailable
    }
  }

  private readStoredMode(): ThemeMode {
    try {
      const stored = localStorage.getItem('app-theme');
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        return stored;
      }
    } catch {
      // ignore
    }
    return 'system';
  }
}