# Image2PDF - Project Brief

## Core Purpose
A free, browser-based PDF toolkit built with Angular 21. Convert, merge, split, compress, protect, and manipulate PDFs — entirely client-side. No file uploads, no servers, no sign-up required.

## Primary Goals
1. **Zero Server Dependency** — All PDF operations run in the browser using Web Workers. Files never leave the user's device.
2. **Comprehensive PDF Toolkit** — Provide a suite of PDF manipulation tools covering the most common use cases.
3. **Performance & Responsiveness** — Keep the UI responsive during heavy processing via Web Workers and Signals.
4. **PWA Ready** — Offline-capable with service worker support and automatic install prompts.
5. **SEO Optimized** — Server-rendered SEO content, sitemap, robots.txt, and Open Graph / Twitter Card metadata.

## Key Features
| Tool | Description |
|------|-------------|
| **Image to PDF** | Convert JPG, PNG, WEBP images to PDF documents |
| **PDF Merge** | Combine multiple PDF files into a single document |
| **PDF Split** | Extract specific pages or split a PDF into multiple files |
| **PDF Rearrange** | Reorder, rotate, and reorganize PDF pages |
| **PDF Compress** | Reduce PDF file size while maintaining quality |
| **PDF Protect** | Password-protect and encrypt PDF files |
| **PDF to Image** | Convert PDF pages to JPG or PNG images |
| **Mixed PDF Builder** | Build custom PDFs by combining images and existing PDFs |
| **OCR to Searchable PDF** | Convert scanned documents and images to searchable PDFs |
| **OCR Text Export** | Extract text from images; export to TXT, DOCX, or clipboard |

## Target Users
- Anyone needing quick PDF conversions without uploading sensitive documents to third-party servers
- Privacy-conscious users who want client-side-only processing
- Users looking for a free alternative to paid PDF tools

## Constraints
- 100% client-side processing (no backend API)
- Client-side file size limits (~50MB per file due to memory constraints)
- Browser compatibility: Chrome 120+, Edge 120+, Firefox 115+, Safari 17+
- Mobile-responsive design
