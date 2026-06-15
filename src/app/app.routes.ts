import { Routes } from '@angular/router';

/**
 * Application routes with tool-based structure
 * Each tool is a separate lazy-loaded route
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: '/image-to-pdf',
    pathMatch: 'full'
  },
  {
    path: 'image-to-pdf',
    loadComponent: () =>
      import('./tools/image-to-pdf/image-to-pdf.component').then(
        m => m.ImageToPdfComponent
      ),
    data: { title: 'Image to PDF', toolId: 'image-to-pdf' }
  },
  {
    path: 'pdf-preview',
    loadComponent: () =>
      import('./tools/pdf-preview/pdf-preview.component').then(
        m => m.PdfPreviewComponent
      ),
    data: { title: 'PDF Preview', toolId: 'pdf-preview' }
  },
  {
    path: 'merge',
    loadComponent: () =>
      import('./tools/pdf-merge/pdf-merge.component').then(
        m => m.PdfMergeComponent
      ),
    data: { title: 'Merge PDFs', toolId: 'pdf-merge' }
  },
  {
    path: 'split',
    loadComponent: () =>
      import('./tools/pdf-split/pdf-split.component').then(
        m => m.PdfSplitComponent
      ),
    data: { title: 'Split PDF', toolId: 'pdf-split' }
  },
  {
    path: 'rearrange',
    loadComponent: () =>
      import('./tools/pdf-rearrange/pdf-rearrange.component').then(
        m => m.PdfRearrangeComponent
      ),
    data: { title: 'Rearrange PDF', toolId: 'pdf-rearrange' }
  },
  {
    path: 'compress',
    loadComponent: () =>
      import('./tools/pdf-compress/pdf-compress.component').then(
        m => m.PdfCompressComponent
      ),
    data: { title: 'Compress PDF', toolId: 'pdf-compress' }
  },
  {
    path: 'protect',
    loadComponent: () =>
      import('./tools/pdf-protect/pdf-protect.component').then(
        m => m.PdfProtectComponent
      ),
    data: { title: 'Protect PDF', toolId: 'pdf-protect' }
  },
  {
    path: 'mixed-builder',
    loadComponent: () =>
      import('./tools/mixed-builder/mixed-builder.component').then(
        m => m.MixedBuilderComponent
      ),
    data: { title: 'Mixed PDF Builder', toolId: 'mixed-builder' }
  },
  {
    path: 'pdf-to-image',
    loadComponent: () =>
      import('./tools/pdf-to-image/pdf-to-image.component').then(
        m => m.PdfToImageComponent
      ),
    data: { title: 'PDF to Image', toolId: 'pdf-to-image' }
  },
  // Catch-all redirect
  {
    path: '**',
    redirectTo: '/image-to-pdf'
  }
];
