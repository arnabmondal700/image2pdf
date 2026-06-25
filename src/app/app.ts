import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AppHeaderComponent } from './components/app-header/app-header.component';
import { OfflineBannerComponent } from './components/offline-banner/offline-banner.component';
import { UpdateNotificationComponent } from './components/update-notification/update-notification.component';
import { SeoService } from './services/seo.service';

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
    UpdateNotificationComponent
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
    </main>
  `,
  styleUrls: ['./app.scss']
})
export class App {
  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private seoService: SeoService
  ) {
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
        }
      });
  }
}
