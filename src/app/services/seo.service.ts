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

  restoreDefaults(): void {
    this.update(this.defaults);
  }
}