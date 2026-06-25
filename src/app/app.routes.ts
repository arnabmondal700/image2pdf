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
    data: {
      title: 'Image to PDF - Convert JPG, PNG to PDF Online Free',
      description: 'Convert images JPG, PNG, WEBP to PDF online for free. Fast, secure client-side processing. No uploads required.',
      keywords: 'image to pdf, jpg to pdf, png to pdf, convert images to pdf, online image converter',
      toolId: 'image-to-pdf'
    }
  },
  {
    path: 'pdf-preview',
    loadComponent: () =>
      import('./tools/pdf-preview/pdf-preview.component').then(
        m => m.PdfPreviewComponent
      ),
    data: {
      title: 'PDF Preview - View PDF Files Online',
      description: 'Preview PDF files online quickly and securely. No software installation required.',
      keywords: 'pdf preview, view pdf online, pdf reader',
      toolId: 'pdf-preview'
    }
  },
  {
    path: 'merge',
    loadComponent: () =>
      import('./tools/pdf-merge/pdf-merge.component').then(
        m => m.PdfMergeComponent
      ),
    data: {
      title: 'Merge PDF Online Free - Combine Multiple PDFs',
      description: 'Merge multiple PDF files into one document online for free. Fast, secure and works completely in your browser.',
      keywords: 'merge pdf, combine pdf, join pdf, online pdf merger, merge pdf files',
      toolId: 'pdf-merge'
    }
  },
  {
    path: 'split',
    loadComponent: () =>
      import('./tools/pdf-split/pdf-split.component').then(
        m => m.PdfSplitComponent
      ),
    data: {
      title: 'Split PDF Online Free - Extract Pages from PDF',
      description: 'Split PDF files and extract specific pages online for free. Easy-to-use browser-based tool.',
      keywords: 'split pdf, extract pdf pages, divide pdf, pdf splitter online',
      toolId: 'pdf-split'
    }
  },
  {
    path: 'rearrange',
    loadComponent: () =>
      import('./tools/pdf-rearrange/pdf-rearrange.component').then(
        m => m.PdfRearrangeComponent
      ),
    data: {
      title: 'Rearrange PDF Pages - Reorder PDF Online',
      description: 'Rearrange PDF pages online for free. Change page order and organize your PDF documents.',
      keywords: 'rearrange pdf, reorder pdf pages, organize pdf, change pdf page order',
      toolId: 'pdf-rearrange'
    }
  },
  {
    path: 'compress',
    loadComponent: () =>
      import('./tools/pdf-compress/pdf-compress.component').then(
        m => m.PdfCompressComponent
      ),
    data: {
      title: 'Compress PDF Online Free - Reduce PDF File Size',
      description: 'Compress PDF files and reduce file size online for free. Maintain quality while shrinking your PDF documents.',
      keywords: 'compress pdf, reduce pdf size, pdf compressor, shrink pdf file',
      toolId: 'pdf-compress'
    }
  },
  {
    path: 'protect',
    loadComponent: () =>
      import('./tools/pdf-protect/pdf-protect.component').then(
        m => m.PdfProtectComponent
      ),
    data: {
      title: 'Protect PDF Online Free - Password Protect PDF',
      description: 'Password protect PDF files online for free. Secure your PDF documents with encryption.',
      keywords: 'protect pdf, password protect pdf, secure pdf, pdf encryption',
      toolId: 'pdf-protect'
    }
  },
  {
    path: 'mixed-builder',
    loadComponent: () =>
      import('./tools/mixed-builder/mixed-builder.component').then(
        m => m.MixedBuilderComponent
      ),
    data: {
      title: 'Mixed PDF Builder - Combine Images and PDFs',
      description: 'Build mixed PDF documents by combining images and PDF files online for free.',
      keywords: 'mixed pdf builder, combine images and pdf, create mixed pdf',
      toolId: 'mixed-builder'
    }
  },
  {
    path: 'pdf-to-image',
    loadComponent: () =>
      import('./tools/pdf-to-image/pdf-to-image.component').then(
        m => m.PdfToImageComponent
      ),
    data: {
      title: 'PDF to Image - Convert PDF to JPG, PNG Online',
      description: 'Convert PDF files to JPG, PNG images online for free. Extract images from PDF documents.',
      keywords: 'pdf to image, pdf to jpg, pdf to png, convert pdf to image',
      toolId: 'pdf-to-image'
    }
  },
  {
    path: 'ocr-to-searchable-pdf',
    loadComponent: () =>
      import('./tools/image-to-searchable-pdf/image-to-searchable-pdf.component').then(
        m => m.ImageToSearchablePdfComponent
      ),
    data: {
      title: 'OCR to Searchable PDF - Make PDF Searchable Online',
      description: 'Convert scanned PDF or images to searchable PDF using OCR technology. Free online OCR tool.',
      keywords: 'ocr, searchable pdf, ocr to pdf, scanned pdf, ocr online',
      toolId: 'image-to-searchable-pdf'
    }
  },
  {
    path: 'ocr-text-export',
    loadComponent: () =>
      import('./tools/ocr-text-export/ocr-text-export.component').then(
        m => m.OcrTextExportComponent
      ),
    data: {
      title: 'OCR Text Export - Extract Text from Images',
      description: 'Extract text from images using OCR technology. Export scanned text to TXT, DOCX or copy to clipboard.',
      keywords: 'ocr text export, extract text from image, ocr scanner, image to text',
      toolId: 'ocr-text-export'
    }
  },
  // Catch-all redirect
  {
    path: '**',
    redirectTo: '/image-to-pdf'
  }
];
