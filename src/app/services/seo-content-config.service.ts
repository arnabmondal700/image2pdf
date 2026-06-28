import { Injectable } from '@angular/core';
import type { SeoContentConfig } from '../components/seo-content/seo-content.component';

/**
 * Provides per-tool SEO content configs for the SeoContentComponent.
 * Each tool page gets ~500-800 words of How-to, Features, FAQ, and Related Tools.
 */
@Injectable({ providedIn: 'root' })
export class SeoContentConfigService {
  private readonly configs = new Map<string, SeoContentConfig>([
    ['image-to-pdf', {
      toolId: 'image-to-pdf',
      howToTitle: 'How to Convert Images to PDF',
      howToSteps: [
        'Click the upload area or drag and drop your images (JPG, PNG, WEBP) onto the page.',
        'Arrange the images in your desired order using drag-and-drop. You can also rotate or edit individual images.',
        'Adjust PDF settings like page size (A4, Letter), orientation (portrait/landscape), and image fit mode.',
        'Choose between "Single PDF" or "Images as separate PDFs" export mode.',
        'Click the "Generate PDF" button to create your PDF. All processing happens in your browser.',
        'Download your converted PDF file instantly — no uploads to any server required.'
      ],
      features: [
        '100% free and open source — no hidden charges or premium tiers',
        'All processing runs entirely in your browser using WebAssembly — nothing is uploaded to any server',
        'Supports JPG, PNG, WEBP, and even PDF extraction (you can extract pages from an existing PDF as images)',
        'Customizable page size, orientation, margins, image fit (contain, cover, stretch), and alignment',
        'Drag-and-drop image reordering with live preview',
        'Built-in image editor for cropping, rotating, and adjusting images before conversion',
        'Works offline as a Progressive Web App (PWA)',
        'No file size limits — convert as many images as you want'
      ],
      faqs: [
        {
          q: 'Is it safe to upload my images?',
          a: 'Your images never leave your device. All processing is done locally using JavaScript and WebAssembly. There are no server uploads, making this tool completely private and secure.'
        },
        {
          q: 'What image formats are supported?',
          a: 'We support JPG/JPEG, PNG, and WEBP formats. You can also upload an existing PDF, and its pages will be extracted as images for inclusion in your new PDF.'
        },
        {
          q: 'Are there any limits on file size or number of images?',
          a: 'No. Since everything runs in your browser, the only limit is your device\'s memory. For very large files (50 MB+), ensure you have enough RAM.'
        },
        {
          q: 'Can I adjust the page layout?',
          a: 'Yes. You can customize page size (A4, Letter, Legal), orientation, margins, and choose how images fit on each page (contain, cover, or stretch).'
        }
      ],
      relatedTools: [
        { title: 'Merge PDF', path: '/merge', description: 'Combine multiple PDFs into one', icon: 'fa-solid fa-paperclip' },
        { title: 'Split PDF', path: '/split', description: 'Extract specific pages from a PDF', icon: 'fa-solid fa-scissors' },
        { title: 'Compress PDF', path: '/compress', description: 'Reduce PDF file size', icon: 'fa-solid fa-compress' },
        { title: 'PDF to Image', path: '/pdf-to-image', description: 'Convert PDF pages to images', icon: 'fa-solid fa-image' }
      ]
    }],
    ['pdf-merge', {
      toolId: 'pdf-merge',
      howToTitle: 'How to Merge PDF Files',
      howToSteps: [
        'Upload two or more PDF files by clicking the upload area or dragging and dropping them.',
        'Drag and drop the PDFs to rearrange them in your desired order.',
        'Enter a name for your merged output file.',
        'Click the "Merge PDFs" button to combine all PDFs into a single document.',
        'Download the merged PDF instantly.'
      ],
      features: [
        'Merge any number of PDFs into a single document',
        'Drag-and-drop reordering of PDFs before merging',
        'All processing is client-side — no uploads to any server',
        'Works completely offline as a Progressive Web App',
        'No file size limits',
        'Preview each PDF before merging'
      ],
      faqs: [
        {
          q: 'How many PDFs can I merge at once?',
          a: 'There is no hard limit. The only restriction is your browser\'s available memory. For very large merges (50+ PDFs with hundreds of pages), ensure you have sufficient RAM.'
        },
        {
          q: 'Does the merging preserve my original PDF quality?',
          a: 'Yes. PDF merging preserves the original quality of each page. There is no quality loss or recompression during the merge process.'
        },
        {
          q: 'Can I reorder PDFs before merging?',
          a: 'Yes. Simply drag any PDF up or down in the list to change its position in the final merged document.'
        }
      ],
      relatedTools: [
        { title: 'Split PDF', path: '/split', description: 'Extract specific pages from a PDF', icon: 'fa-solid fa-scissors' },
        { title: 'Compress PDF', path: '/compress', description: 'Reduce PDF file size', icon: 'fa-solid fa-compress' },
        { title: 'Image to PDF', path: '/image-to-pdf', description: 'Convert images to PDF', icon: 'fa-solid fa-image' },
        { title: 'Rearrange PDF', path: '/rearrange', description: 'Reorder pages in a PDF', icon: 'fa-solid fa-arrows-alt' }
      ]
    }],
    ['pdf-split', {
      toolId: 'pdf-split',
      howToTitle: 'How to Split a PDF',
      howToSteps: [
        'Upload a PDF file by clicking the upload area or dragging it onto the page.',
        'Enter the page range you want to extract (e.g., "1-3, 5, 7-10"). Supports individual pages, ranges, or a mix of both.',
        'Choose your output mode: "Combine in One PDF" to merge selected pages into a single file, or "Separate PDFs" to get one file per page.',
        'Set the output filename and click the "Extract Pages" button.',
        'Download your extracted PDF(s) instantly.'
      ],
      features: [
        'Extract specific pages from any PDF document',
        'Flexible page range input supports individual pages (1,3,5), ranges (1-10), and mixed formats (1-3, 5, 7-10)',
        'Two output modes: combine selected pages into one PDF or download each page separately',
        'Client-side processing — nothing is uploaded to any server',
        'Preview individual pages before extraction',
        'Works offline as a PWA'
      ],
      faqs: [
        {
          q: 'What page range formats are supported?',
          a: 'You can use individual pages like "1,3,5", ranges like "1-10", or mixed formats like "1-3, 5, 7-10". Leave empty to extract all pages.'
        },
        {
          q: 'Can I extract pages as separate PDFs?',
          a: 'Yes. Select "Separate PDFs" output mode to download each selected page as its own PDF file. Each file will be named with the page number.'
        },
        {
          q: 'Does splitting affect the original quality?',
          a: 'No. The extracted pages retain their original quality. There is no recompression or quality loss during the split process.'
        }
      ],
      relatedTools: [
        { title: 'Merge PDF', path: '/merge', description: 'Combine multiple PDFs into one', icon: 'fa-solid fa-paperclip' },
        { title: 'Rearrange PDF', path: '/rearrange', description: 'Reorder pages in a PDF', icon: 'fa-solid fa-arrows-alt' },
        { title: 'Compress PDF', path: '/compress', description: 'Reduce PDF file size', icon: 'fa-solid fa-compress' },
        { title: 'Protect PDF', path: '/protect', description: 'Password protect your PDF', icon: 'fa-solid fa-lock' }
      ]
    }],
    ['pdf-compress', {
      toolId: 'pdf-compress',
      howToTitle: 'How to Compress a PDF',
      howToSteps: [
        'Upload a PDF file by clicking the upload area or dragging it onto the page.',
        'Choose a compression level: Low (re-save only), Medium (moderate compression), or High (maximum compression).',
        'Set the output filename for your compressed PDF.',
        'Click the "Compress PDF" button to start compression.',
        'Download your compressed PDF. The result shows original vs. compressed file size.'
      ],
      features: [
        'Three compression levels: Low (metadata strip), Medium (65% JPEG), High (40% JPEG)',
        'Client-side processing — your files never leave your device',
        'Shows live compression progress with percentage',
        'Displays original vs. compressed size comparison',
        'Works offline as a PWA',
        'No server uploads required'
      ],
      faqs: [
        {
          q: 'How much can I compress my PDF?',
          a: 'Compression depends on the content. Image-heavy PDFs typically compress 40-80% with Medium or High settings. Text-only PDFs may compress less.'
        },
        {
          q: 'Does compression affect quality?',
          a: 'Low compression simply re-saves the PDF with no quality loss. Medium and High use JPEG recompression on pages, which may reduce image quality. Always preview the result before using.'
        },
        {
          q: 'Why is my compressed file larger than the original?',
          a: 'This can happen with already-optimized PDFs or documents with mixed content. If this occurs, try the "Low" compression level.'
        }
      ],
      relatedTools: [
        { title: 'Image to PDF', path: '/image-to-pdf', description: 'Convert images to PDF', icon: 'fa-solid fa-image' },
        { title: 'Merge PDF', path: '/merge', description: 'Combine multiple PDFs into one', icon: 'fa-solid fa-paperclip' },
        { title: 'Split PDF', path: '/split', description: 'Extract specific pages from a PDF', icon: 'fa-solid fa-scissors' },
        { title: 'PDF to Image', path: '/pdf-to-image', description: 'Convert PDF pages to images', icon: 'fa-solid fa-image' }
      ]
    }],
    ['pdf-to-image', {
      toolId: 'pdf-to-image',
      howToTitle: 'How to Convert PDF to Image',
      howToSteps: [
        'Upload a PDF file by clicking the upload area or dragging it onto the page.',
        'Choose your output format: PNG (lossless, larger files) or JPEG (smaller files, adjustable quality).',
        'Set the resolution/DPI for your output images (72 DPI for web, 150/300 for print).',
        'Choose output mode: Individual Images or ZIP bundle.',
        'Click the "Export Images" button. Download your images individually or as a ZIP file.'
      ],
      features: [
        'Export PDF pages as high-quality PNG or JPEG images',
        'Adjustable JPEG quality from 10% to 100%',
        'Multiple resolution options: 72 DPI (web), 150 DPI, 300 DPI (print quality)',
        'Download individual images or all pages as a ZIP bundle',
        'Specify custom page ranges for selective export',
        'Client-side processing — no server uploads'
      ],
      faqs: [
        {
          q: 'What image formats are supported for export?',
          a: 'You can export PDF pages as PNG (lossless, supports transparency) or JPEG (smaller file size, adjustable quality).'
        },
        {
          q: 'Can I export only specific pages?',
          a: 'Yes. Enter a page range like "1-3, 5, 7-10" to export only selected pages. Leave blank to export all pages.'
        },
        {
          q: 'What resolution should I use?',
          a: '72 DPI is suitable for web use, 150 DPI for standard quality, and 300 DPI for print-quality images. Higher DPI produces larger files but better quality.'
        }
      ],
      relatedTools: [
        { title: 'Image to PDF', path: '/image-to-pdf', description: 'Convert images to PDF', icon: 'fa-solid fa-image' },
        { title: 'Compress PDF', path: '/compress', description: 'Reduce PDF file size', icon: 'fa-solid fa-compress' },
        { title: 'OCR to Searchable PDF', path: '/ocr-to-searchable-pdf', description: 'Make scanned PDFs searchable', icon: 'fa-solid fa-search' },
        { title: 'OCR Text Export', path: '/ocr-text-export', description: 'Extract text from images', icon: 'fa-solid fa-file-export' }
      ]
    }],
    ['pdf-protect', {
      toolId: 'pdf-protect',
      howToTitle: 'How to Password Protect a PDF',
      howToSteps: [
        'Upload a PDF file by clicking the upload area or dragging it onto the page.',
        'Choose "Add Password" mode to protect your PDF, or "Remove Password" to remove existing protection.',
        'Set a user password (required) that must be entered to open the PDF.',
        'Optionally set an owner password with permission restrictions to control printing, copying, and editing.',
        'Click "Apply Protection" to create your protected PDF and download it.'
      ],
      features: [
        'Add user password protection to prevent unauthorized access',
        'Optional owner password with granular permission controls',
        'Permission controls: printing, copying, modification, annotations, form filling, and more',
        'Remove existing password protection from PDFs',
        '100% client-side — your files never leave your browser',
        'Works offline as a PWA'
      ],
      faqs: [
        {
          q: 'What is the difference between user and owner password?',
          a: 'The user password is required to open the PDF. The owner password controls what users can do with the document (print, copy, edit, etc.) after opening it.'
        },
        {
          q: 'Can I remove password protection?',
          a: 'Yes. Upload a password-protected PDF, switch to "Remove Password" mode, enter the current password, and click "Apply". A new unprotected PDF will be downloaded.'
        },
        {
          q: 'Is my PDF data secure during processing?',
          a: 'Absolutely. All processing is done entirely in your browser. Your PDF and passwords never leave your device.'
        }
      ],
      relatedTools: [
        { title: 'Merge PDF', path: '/merge', description: 'Combine multiple PDFs into one', icon: 'fa-solid fa-paperclip' },
        { title: 'Split PDF', path: '/split', description: 'Extract specific pages from a PDF', icon: 'fa-solid fa-scissors' },
        { title: 'Compress PDF', path: '/compress', description: 'Reduce PDF file size', icon: 'fa-solid fa-compress' },
        { title: 'PDF to Image', path: '/pdf-to-image', description: 'Convert PDF pages to images', icon: 'fa-solid fa-image' }
      ]
    }],
    ['pdf-rearrange', {
      toolId: 'pdf-rearrange',
      howToTitle: 'How to Rearrange PDF Pages',
      howToSteps: [
        'Upload a PDF file by clicking the upload area or dragging it onto the page.',
        'View all pages as thumbnails in the page grid.',
        'Drag and drop pages to reorder them as needed.',
        'Optionally rotate or delete individual pages.',
        'Click "Apply Changes" to create the reorganized PDF.'
      ],
      features: [
        'Visual drag-and-drop page reordering with live thumbnail preview',
        'Rotate individual pages to correct orientation',
        'Delete unwanted pages from the document',
        'All processing is client-side and private',
        'Works offline as a PWA',
        'No server uploads required'
      ],
      faqs: [
        {
          q: 'Can I see previews of pages while rearranging?',
          a: 'Yes. Each page is displayed as a thumbnail, making it easy to identify and reorder pages visually.'
        },
        {
          q: 'Can I delete pages while rearranging?',
          a: 'Yes. You can delete unwanted pages before generating the final reorganized PDF.'
        },
        {
          q: 'Does rearranging preserve the original quality?',
          a: 'Yes. Page rearrangement does not affect the quality of your PDF. Pages are moved, not re-encoded.'
        }
      ],
      relatedTools: [
        { title: 'Merge PDF', path: '/merge', description: 'Combine multiple PDFs into one', icon: 'fa-solid fa-paperclip' },
        { title: 'Split PDF', path: '/split', description: 'Extract specific pages from a PDF', icon: 'fa-solid fa-scissors' },
        { title: 'Compress PDF', path: '/compress', description: 'Reduce PDF file size', icon: 'fa-solid fa-compress' },
        { title: 'Image to PDF', path: '/image-to-pdf', description: 'Convert images to PDF', icon: 'fa-solid fa-image' }
      ]
    }],
    ['mixed-builder', {
      toolId: 'mixed-builder',
      howToTitle: 'How to Build a Mixed PDF',
      howToSteps: [
        'Upload images (JPG, PNG, WEBP) and PDF files using the upload area.',
        'Arrange all items in your desired order using drag-and-drop.',
        'Adjust individual PDF settings such as page size and orientation.',
        'Click "Generate PDF" to combine all items into a single document.',
        'Download your mixed PDF instantly.'
      ],
      features: [
        'Combine images and PDFs into a single document',
        'Drag-and-drop reordering of all items',
        'Custom page size and orientation settings',
        'All processing is client-side — no uploads to any server',
        'Works offline as a PWA',
        'No file size limits'
      ],
      faqs: [
        {
          q: 'Can I mix images and PDFs in any order?',
          a: 'Yes. You can interleave images and PDFs in any order. Simply drag them to arrange as needed.'
        },
        {
          q: 'Do PDFs maintain their quality when combined?',
          a: 'Yes. PDF pages are preserved at their original quality. Images can be adjusted using the PDF settings panel.'
        },
        {
          q: 'Are there limits on the number of items?',
          a: 'The only limit is your browser\'s available memory. For very large documents with hundreds of pages, ensure you have sufficient RAM.'
        }
      ],
      relatedTools: [
        { title: 'Image to PDF', path: '/image-to-pdf', description: 'Convert images to PDF', icon: 'fa-solid fa-image' },
        { title: 'Merge PDF', path: '/merge', description: 'Combine multiple PDFs into one', icon: 'fa-solid fa-paperclip' },
        { title: 'Compress PDF', path: '/compress', description: 'Reduce PDF file size', icon: 'fa-solid fa-compress' },
        { title: 'PDF to Image', path: '/pdf-to-image', description: 'Convert PDF pages to images', icon: 'fa-solid fa-image' }
      ]
    }],
    ['image-to-searchable-pdf', {
      toolId: 'image-to-searchable-pdf',
      howToTitle: 'How to Make a Searchable PDF with OCR',
      howToSteps: [
        'Upload a scanned PDF or image containing text by clicking the upload area.',
        'Select the language of the text in your document for optimal OCR accuracy.',
        'Click "Convert to Searchable PDF" to start the OCR processing.',
        'Wait for the OCR engine to process your document in your browser.',
        'Download your searchable PDF with selectable and searchable text.'
      ],
      features: [
        'Convert scanned PDFs and images into searchable PDF documents',
        'Uses Tesseract.js OCR engine — runs entirely in your browser',
        'Supports multiple languages for text recognition',
        'Preserves original document appearance while adding hidden text layer',
        'No server uploads — completely private',
        'Works offline as a PWA'
      ],
      faqs: [
        {
          q: 'How accurate is the OCR?',
          a: 'Accuracy depends on image quality and text clarity. High-resolution clean scans typically achieve 95%+ accuracy. Blurry or handwritten text may have lower accuracy.'
        },
        {
          q: 'Which languages are supported?',
          a: 'Tesseract.js supports over 100 languages including English, Spanish, French, German, Chinese, Japanese, Arabic, and more. Select your language before processing.'
        },
        {
          q: 'Is my document data private?',
          a: 'Yes. All OCR processing is done locally in your browser using Tesseract.js WebAssembly. Your documents never leave your device.'
        }
      ],
      relatedTools: [
        { title: 'OCR Text Export', path: '/ocr-text-export', description: 'Extract text from images', icon: 'fa-solid fa-file-export' },
        { title: 'Image to PDF', path: '/image-to-pdf', description: 'Convert images to PDF', icon: 'fa-solid fa-image' },
        { title: 'Compress PDF', path: '/compress', description: 'Reduce PDF file size', icon: 'fa-solid fa-compress' },
        { title: 'PDF to Image', path: '/pdf-to-image', description: 'Convert PDF pages to images', icon: 'fa-solid fa-image' }
      ]
    }],
    ['ocr-text-export', {
      toolId: 'ocr-text-export',
      howToTitle: 'How to Extract Text from Images',
      howToSteps: [
        'Upload an image or scanned PDF containing text by clicking the upload area.',
        'Select the language of the text for accurate OCR processing.',
        'Click "Extract Text" to start the OCR process.',
        'Review the extracted text once processing completes.',
        'Copy the text to your clipboard, download as TXT, or download as DOCX.'
      ],
      features: [
        'Extract text from images and scanned documents using OCR',
        'Export extracted text to TXT, DOCX, or copy to clipboard',
        'Supports over 100 languages',
        'All processing is client-side — no data leaves your device',
        'Works offline as a PWA',
        'No server uploads required'
      ],
      faqs: [
        {
          q: 'What image formats are supported for OCR?',
          a: 'We support JPG, PNG, WEBP images and PDF files. For best results, use high-resolution images with clear, well-lit text.'
        },
        {
          q: 'Can I export the extracted text?',
          a: 'Yes. You can copy the text to clipboard with one click, download as a plain TXT file, or download as a DOCX (Word) document with formatting.'
        },
        {
          q: 'Is the OCR accurate for handwritten text?',
          a: 'Tesseract.js is optimized for printed text. Handwritten text recognition has lower accuracy and may require manual correction.'
        }
      ],
      relatedTools: [
        { title: 'OCR to Searchable PDF', path: '/ocr-to-searchable-pdf', description: 'Make scanned PDFs searchable', icon: 'fa-solid fa-search' },
        { title: 'Image to PDF', path: '/image-to-pdf', description: 'Convert images to PDF', icon: 'fa-solid fa-image' },
        { title: 'PDF to Image', path: '/pdf-to-image', description: 'Convert PDF pages to images', icon: 'fa-solid fa-image' },
        { title: 'Compress PDF', path: '/compress', description: 'Reduce PDF file size', icon: 'fa-solid fa-compress' }
      ]
    }]
  ]);

  getConfig(toolId: string): SeoContentConfig | undefined {
    return this.configs.get(toolId);
  }
}