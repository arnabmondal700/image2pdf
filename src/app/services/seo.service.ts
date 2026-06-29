import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Meta } from '@angular/platform-browser';

export interface SeoConfig {
  title: string;
  description: string;
  keywords?: string;
  overrideDefault?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly defaults: SeoConfig = {
    title: 'Image2PDF - Free Online PDF Tools',
    description: 'Convert images to PDF, merge, split, compress and edit PDF files entirely in your browser',
    keywords:
      'image to pdf, merge pdf, split pdf, compress pdf, pdf converter, online pdf tools'
  };

  constructor(private title: Title, private meta: Meta) {}

  update(config: SeoConfig): void {
    this.title.setTitle(config.title);

    this.meta.updateTag({
      name: 'description',
      content: config.description
    });

    if (config.keywords) {
      this.meta.updateTag({
        name: 'keywords',
        content: config.keywords
      });
    }
  }

  updateSocialTags(config: {
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    ogUrl?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
  }): void {
    if (config.ogTitle) {
      this.meta.updateTag({ property: 'og:title', content: config.ogTitle });
    }
    if (config.ogDescription) {
      this.meta.updateTag({ property: 'og:description', content: config.ogDescription });
    }
    if (config.ogImage) {
      this.meta.updateTag({ property: 'og:image', content: config.ogImage });
    }
    if (config.ogUrl) {
      this.meta.updateTag({ property: 'og:url', content: config.ogUrl });
    }
    if (config.twitterTitle) {
      this.meta.updateTag({ name: 'twitter:title', content: config.twitterTitle });
    }
    if (config.twitterDescription) {
      this.meta.updateTag({ name: 'twitter:description', content: config.twitterDescription });
    }
    if (config.twitterImage) {
      this.meta.updateTag({ name: 'twitter:image', content: config.twitterImage });
    }
  }

  restoreDefaults(): void {
    this.update(this.defaults);
  }
}
