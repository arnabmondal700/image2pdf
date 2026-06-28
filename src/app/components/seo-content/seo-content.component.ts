import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

export interface RelatedTool {
  title: string;
  path: string;
  description: string;
  icon: string;
}

export interface SeoContentConfig {
  toolId: string;
  howToTitle: string;
  howToSteps: string[];
  features: string[];
  faqs: { q: string; a: string }[];
  relatedTools: RelatedTool[];
}

/**
 * Shared SEO content component for internal linking and rich content sections.
 * Provides How-to guides, Features, FAQ, and Related Tools links per tool page.
 * Improves SEO by adding ~500-800 words of relevant content per tool.
 */
@Component({
  selector: 'seo-content',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="seo-content" *ngIf="config">
      <!-- How-to Guide -->
      <article class="seo-block">
        <h2>{{ config.howToTitle }}</h2>
        <ol class="seo-steps">
          <li *ngFor="let step of config.howToSteps">{{ step }}</li>
        </ol>
      </article>

      <!-- Features -->
      <article class="seo-block">
        <h2>Features</h2>
        <ul class="seo-features">
          <li *ngFor="let feature of config.features">
            <span class="feature-check">✓</span>
            {{ feature }}
          </li>
        </ul>
      </article>

      <!-- FAQ -->
      <article class="seo-block" *ngIf="config.faqs.length > 0">
        <h2>Frequently Asked Questions</h2>
        <div class="seo-faq" *ngFor="let faq of config.faqs">
          <h3>{{ faq.q }}</h3>
          <p>{{ faq.a }}</p>
        </div>
      </article>

      <!-- Related Tools (Internal Linking) -->
      <nav class="seo-related" *ngIf="config.relatedTools.length > 0">
        <h2>Related Tools</h2>
        <div class="related-links">
          <a *ngFor="let tool of config.relatedTools"
             class="related-link"
             [routerLink]="tool.path"
             [attr.aria-label]="'Go to ' + tool.title">
            <span class="related-icon">
              <i [class]="tool.icon"></i>
            </span>
            <span class="related-info">
              <span class="related-name">{{ tool.title }}</span>
              <span class="related-desc">{{ tool.description }}</span>
            </span>
          </a>
        </div>
      </nav>
    </section>
  `,
  styleUrls: ['./seo-content.component.scss']
})
export class SeoContentComponent {
  @Input() config: SeoContentConfig | null = null;
}