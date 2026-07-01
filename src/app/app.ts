import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { OfflineBannerComponent } from './components/offline-banner/offline-banner.component';
import { UpdateNotificationComponent } from './components/update-notification/update-notification.component';
import { SeoService } from './services/seo.service';
import { ImageEditorModalComponent } from './components/image-editor-modal/image-editor-modal.component';
import { ImageEditorStateService } from './services/image-editor-state.service';

/**
 * Root application component - Shell for tool-based architecture
 * Provides the ambient background, glass card container, and header navigation
 * that wraps all routed tool components.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    AppHeaderComponent,
    OfflineBannerComponent,
    UpdateNotificationComponent,
    ImageEditorModalComponent
  ],
  template: `
    <main class="app-shell">
      <div class="ambient ambient-one"></div>
      <div class="ambient ambient-two"></div>

      <section class="app-card">
        <app-offline-banner></app-offline-banner>
        <app-header></app-header>
        <app-update-notification></app-update-notification>

        <router-outlet></router-outlet>
      </section>

      @if (imageEditorState.editingFile() && imageEditorState.editingFileIndex() !== null) {
        <image-editor-modal
          [file]="imageEditorState.editingFile()"
          [index]="imageEditorState.editingFileIndex()"
          (editApplied)="onImageEdited($event)"
          (closed)="imageEditorState.close()"
        ></image-editor-modal>
      }
    </main>
  `,
  styleUrls: ['./app.scss']
})
export class App {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService,
    public imageEditorState: ImageEditorStateService
  ) {
    this.lockOrientation();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const route = this.activatedRoute.firstChild;
        const data = route?.snapshot.data;
        if (data && data['title']) {
          this.seoService.update({
            title: data['title'],
            description: data['description'] || 'Convert images to PDF, merge, split, compress and edit PDF files entirely in your browser',
            keywords: data['keywords']
          });

          this.seoService.updateSocialTags({
            ogTitle: data['ogTitle'] || data['title'],
            ogDescription: data['ogDescription'] || data['description'],
            ogImage: data['ogImage'],
            ogUrl: data['ogUrl'] || this.buildCurrentUrl(),
            twitterTitle: data['twitterTitle'] || data['title'],
            twitterDescription: data['twitterDescription'] || data['description'],
            twitterImage: data['twitterImage'] || data['ogImage']
          });
        }
      });
  }

  private buildCurrentUrl(): string {
    return this.router.url.startsWith('http') ? this.router.url : `https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf${this.router.url}`;
  }

  onImageEdited(event: { index: number; url: string }): void {
    this.imageEditorState.close();
  }

  private lockOrientation(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (!isStandalone) {
      return;
    }

    const screenOrientation = (screen as any).orientation;
    if (!screenOrientation || typeof screenOrientation.lock !== 'function') {
      return;
    }

    screenOrientation.lock('portrait').catch(() => {
      // Orientation lock is not supported or was denied.
      // The manifest orientation setting provides the primary control.
    });
  }
}
