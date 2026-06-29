import { Injectable, signal, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/**
 * Wraps Angular's SwUpdate to provide a clean signal-based API.
 * Emits when a new app version is available.
 */
@Injectable({ providedIn: 'root' })
export class UpdateService {
  private readonly swUpdate = inject(SwUpdate);

  /** True when the app has detected a newer version waiting to be activated. */
  readonly updateAvailable = signal<boolean>(false);

  constructor() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_DETECTED' || event.type === 'VERSION_READY') {
          this.updateAvailable.set(true);
        }
      });
    }
  }

  /** Ask the SW to skip waiting and activate immediately, then reload. */
  activateUpdate(): void {
    this.swUpdate
      .activateUpdate()
      .then(() => {
        if ('caches' in window) {
          caches.open('image2pdf-manifest-cache-v1').then((cache) => cache.delete('/manifest.json'));
        }
        return Promise.resolve();
      })
      .then(() => window.location.reload())
      .catch(() => window.location.reload());
  }
}
