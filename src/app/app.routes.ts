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
      toolId: 'image-to-pdf',
      ogTitle: 'Image to PDF - Convert JPG, PNG to PDF Online Free',
      ogDescription: 'Convert images JPG, PNG, WEBP to PDF online for free. Fast, secure client-side processing. No uploads required.',
      ogImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg',
      ogUrl: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/image-to-pdf',
      twitterTitle: 'Image to PDF - Convert JPG, PNG to PDF Online Free',
      twitterDescription: 'Convert images JPG, PNG, WEBP to PDF online for free. Fast, secure client-side processing. No uploads required.',
      twitterImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg'
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
      toolId: 'pdf-preview',
      ogTitle: 'PDF Preview - View PDF Files Online',
      ogDescription: 'Preview PDF files online quickly and securely. No software installation required.',
      ogImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg',
      ogUrl: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/pdf-preview',
      twitterTitle: 'PDF Preview - View PDF Files Online',
      twitterDescription: 'Preview PDF files online quickly and securely. No software installation required.',
      twitterImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg'
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
      toolId: 'pdf-merge',
      ogTitle: 'Merge PDF Online Free - Combine Multiple PDFs',
      ogDescription: 'Merge multiple PDF files into one document online for free. Fast, secure and works completely in your browser.',
      ogImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg',
      ogUrl: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/merge',
      twitterTitle: 'Merge PDF Online Free - Combine Multiple PDFs',
      twitterDescription: 'Merge multiple PDF files into one document online for free. Fast, secure and works completely in your browser.',
      twitterImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg'
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
      toolId: 'pdf-split',
      ogTitle: 'Split PDF Online Free - Extract Pages from PDF',
      ogDescription: 'Split PDF files and extract specific pages online for free. Easy-to-use browser-based tool.',
      ogImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg',
      ogUrl: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/split',
      twitterTitle: 'Split PDF Online Free - Extract Pages from PDF',
      twitterDescription: 'Split PDF files and extract specific pages online for free. Easy-to-use browser-based tool.',
      twitterImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg'
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
      toolId: 'pdf-rearrange',
      ogTitle: 'Rearrange PDF Pages - Reorder PDF Online',
      ogDescription: 'Rearrange PDF pages online for free. Change page order and organize your PDF documents.',
      ogImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg',
      ogUrl: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/rearrange',
      twitterTitle: 'Rearrange PDF Pages - Reorder PDF Online',
      twitterDescription: 'Rearrange PDF pages online for free. Change page order and organize your PDF documents.',
      twitterImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg'
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
      toolId: 'pdf-compress',
      ogTitle: 'Compress PDF Online Free - Reduce PDF File Size',
      ogDescription: 'Compress PDF files and reduce file size online for free. Maintain quality while shrinking your PDF documents.',
      ogImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg',
      ogUrl: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/compress',
      twitterTitle: 'Compress PDF Online Free - Reduce PDF File Size',
      twitterDescription: 'Compress PDF files and reduce file size online for free. Maintain quality while shrinking your PDF documents.',
      twitterImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg'
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
      toolId: 'pdf-protect',
      ogTitle: 'Protect PDF Online Free - Password Protect PDF',
      ogDescription: 'Password protect PDF files online for free. Secure your PDF documents with encryption.',
      ogImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg',
      ogUrl: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/protect',
      twitterTitle: 'Protect PDF Online Free - Password Protect PDF',
      twitterDescription: 'Password protect PDF files online for free. Secure your PDF documents with encryption.',
      twitterImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg'
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
      toolId: 'mixed-builder',
      ogTitle: 'Mixed PDF Builder - Combine Images and PDFs',
      ogDescription: 'Build mixed PDF documents by combining images and PDF files online for free.',
      ogImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg',
      ogUrl: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/mixed-builder',
      twitterTitle: 'Mixed PDF Builder - Combine Images and PDFs',
      twitterDescription: 'Build mixed PDF documents by combining images and PDF files online for free.',
      twitterImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg'
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
      toolId: 'pdf-to-image',
      ogTitle: 'PDF to Image - Convert PDF to JPG, PNG Online',
      ogDescription: 'Convert PDF files to JPG, PNG images online for free. Extract images from PDF documents.',
      ogImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg',
      ogUrl: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/pdf-to-image',
      twitterTitle: 'PDF to Image - Convert PDF to JPG, PNG Online',
      twitterDescription: 'Convert PDF files to JPG, PNG images online for free. Extract images from PDF documents.',
      twitterImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg'
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
      toolId: 'image-to-searchable-pdf',
      ogTitle: 'OCR to Searchable PDF - Make PDF Searchable Online',
      ogDescription: 'Convert scanned PDF or images to searchable PDF using OCR technology. Free online OCR tool.',
      ogImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg',
      ogUrl: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/ocr-to-searchable-pdf',
      twitterTitle: 'OCR to Searchable PDF - Make PDF Searchable Online',
      twitterDescription: 'Convert scanned PDF or images to searchable PDF using OCR technology. Free online OCR tool.',
      twitterImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg'
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
      toolId: 'ocr-text-export',
      ogTitle: 'OCR Text Export - Extract Text from Images',
      ogDescription: 'Extract text from images using OCR technology. Export scanned text to TXT, DOCX or copy to clipboard.',
      ogImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg',
      ogUrl: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/ocr-text-export',
      twitterTitle: 'OCR Text Export - Extract Text from Images',
      twitterDescription: 'Extract text from images using OCR technology. Export scanned text to TXT, DOCX or copy to clipboard.',
      twitterImage: 'https://image-to-pdf-47b6.arnabmondal700.workers.dev/image-to-pdf/assets/seo/og-image.jpg'
    }
  },
  // Catch-all redirect
  {
    path: '**',
    redirectTo: '/image-to-pdf'
  }
];
