# Image2PDF

[![Angular](https://img.shields.io/badge/Angular-21-red)](https://angular.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org)
[![Vitest](https://img.shields.io/badge/Vitest-4.0-purple)](https://vitest.dev)
[![License](https://img.shields.io/badge/License-ISC-green)](LICENSE)

A free, browser-based PDF toolkit built with Angular 21. Convert, merge, split, compress, protect, and manipulate PDFs — entirely client-side. No file uploads, no servers, no sign-up required.

Live site: [https://image2pdf.app](https://image2pdf.app)

---

## Features

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

### Key Highlights

- **100% Client-Side Processing** — All PDF operations run in your browser using Web Workers. Your files never leave your device.
- **PWA Ready** — Offline-capable with service worker support and automatic install prompts.
- **Dark Mode** — Built-in light/dark theme toggle with system preference detection.
- **Image Optimization** — Automatic image compression and optimization before PDF generation to reduce file size without quality loss.
- **SEO Optimized** — Server-rendered SEO content, sitemap, robots.txt, and Open Graph / Twitter Card metadata.
- **Responsive Design** — Works on desktop, tablet, and mobile devices.
- **Web Workers** — Heavy PDF processing runs off the main UI thread to keep the interface responsive.

---

## Tech Stack

- **Framework:** Angular 21 (Standalone Components)
- **Language:** TypeScript 5.9 (strict mode)
- **State Management:** Angular Signals
- **PDF Libraries:** jsPDF, pdf-lib, pdfjs-dist
- **OCR:** Tesseract.js (with Web Worker)
- **Database:** Dexie (IndexedDB wrapper)
- **Testing:** Vitest
- **Deployment:** Cloudflare Pages (via Wrangler)
- **Build Tool:** Vite (via @analogjs/vite-plugin-angular)

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 10+
- Angular CLI 21 (optional, for `ng` commands)

### Installation

```bash
git clone https://github.com/arnabmondal700/image2pdf.git
cd image2pdf
npm install
```

### Development Server

```bash
ng serve
```

Navigate to [http://localhost:4200/image-to-pdf](http://localhost:4200/image-to-pdf). The app reloads automatically on file changes.

### Unit Tests

```bash
ng test
```

Runs Vitest in single-run mode. For watch mode:

```bash
ng test -- --watch
```

### Build for Production

```bash
ng build
```

Outputs optimized production artifacts to the `dist/` directory.

### Deploy to Cloudflare Pages

```bash
npm run deploy
```

Builds the project and deploys to Cloudflare Pages using Wrangler.

### Preview Locally (Cloudflare)

```bash
npm run preview
```

Runs a local Cloudflare Pages dev server with the production build.

---

## Project Structure

```
src/
├── app/
│   ├── components/          # Shared/reusable UI components
│   │   ├── app-header/      # Top navigation bar
│   │   ├── drag-drop-zone/  # File upload zone
│   │   ├── offline-banner/  # Offline detection banner
│   │   ├── pdf-preview/     # PDF preview component
│   │   ├── pdf-settings-panel/ # Page size, DPI, quality controls
│   │   ├── seo-content/     # SSR/SEO content component
│   │   └── ...
│   ├── workers/             # Web Worker entry points
│   │   ├── pdf-generation.worker.ts
│   │   ├── pdf-compression.worker.ts
│   │   └── ocr.worker.ts
│   ├── services/            # Core business logic
│   │   ├── pdf.service.ts
│   │   ├── pdf-compress.service.ts
│   │   ├── pdf-protection.service.ts
│   │   ├── ocr.service.ts
│   │   ├── pdf-to-image.service.ts
│   │   ├── image-optimizer.service.ts
│   │   ├── tool-registry.service.ts
│   │   └── storage/         # IndexedDB / session storage wrappers
│   ├── tools/               # Feature modules (each is a lazy-loaded route)
│   │   ├── image-to-pdf/
│   │   ├── pdf-merge/
│   │   ├── pdf-split/
│   │   ├── pdf-rearrange/
│   │   ├── pdf-compress/
│   │   ├── pdf-protect/
│   │   ├── pdf-to-image/
│   │   ├── mixed-builder/
│   │   ├── image-to-searchable-pdf/  (OCR)
│   │   └── ocr-text-export/
│   ├── models/              # TypeScript interfaces / data models
│   └── app.routes.ts        # Route definitions with SEO metadata
├── public/                  # Static assets
│   ├── robots.txt
│   └── sitemap.xml
├── index.html
└── main.ts
```

---

## Browser Support

- Chrome 120+
- Edge 120+
- Firefox 115+
- Safari 17+

---

## License

[ISC](LICENSE)