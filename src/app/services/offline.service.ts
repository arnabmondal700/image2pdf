import { Injectable, signal, effect, inject } from '@angular/core';

/**
 * Tracks online/offline state and exposes reactive signals.
 * Listens to native browser connectivity events.
 */
@Injectable({ providedIn: 'root' })
export class OfflineService {
  /** True when the browser currently reports being offline. */
  readonly isOnline = signal<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  /** Whether the user ever went offline during this session. */
  readonly wasEverOffline = signal<boolean>(false);

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('online', () => {
      this.isOnline.set(true);
    });

    window.addEventListener('offline', () => {
      this.isOnline.set(false);
      this.wasEverOffline.set(true);
    });

    effect(() => {
      // Touch the signal so the effect tracks it; side effect is just the signal itself
      void this.isOnline();
    });
  }
}