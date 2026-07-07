# Technology Context

## Core Stack
| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 21.2 | Framework (Standalone Components) |
| TypeScript | 5.9 | Language (strict mode) |
| Vite (via AnalogJS) | — | Build tool |
| Vitest | 4.0 | Unit testing |
| Wrangler | 4.98 | Cloudflare Pages deployment |

## Key Libraries

### PDF Manipulation
- **jsPDF** (^4.2.1) — PDF generation from images
- **pdf-lib** (^1.17.1) — PDF merge, split, rearrange, compression
- **pdfjs-dist** (^5.7.284) — PDF rendering for preview and PDF-to-image
- **qpdf-run** (^0.2.1) — PDF encryption/protection

### Image Processing
- **Client-side Canvas API** — Image resizing, rotation, optimization
- No server-side image processing

### OCR
- **Tesseract.js** (^7.0.0) — Optical character recognition
- Tessdata CDN for language data (https://cdn.jsdelivr.net/gh/tesseract-ocr/tessdata_fast)

### Storage / Persistence
- **Dexie** (^4.4.3) — IndexedDB wrapper for settings and sessions persistence
- **localStorage** — Theme preference

### UI / UX
- **@angular/cdk** (^21.2.11) — Drag-and-drop for file reordering
- **@fortawesome/fontawesome-free** (^7.2.0) — Icons
- **Angular Service Worker** — PWA offline support

### Tooling
- **Prettier** (^3.8.1) — Code formatting
- **jsdom** (^28.0.0) — DOM simulation for tests
- **canvas** (^3.2.3) — Canvas API polyfill for tests (DOMMatrix, DOMPoint, ImageData)

## Testing Strategy
- **Framework**: Vitest (configured via `vitest.config.ts`)
- **Setup**: `setup-vitest.ts` registers Angular JIT compiler, zone.js, and TestBed
- **Test files**: Co-located `*.spec.ts` files next to source files
- **Coverage**: Targeting service layer tests; component tests where practical
- **Key tested services**: PDFService, PdfWorkerService, OcrService, FileService, PDFMerge, PDFSplit, PDFRearrange, PdfExtraction, MixedDocumentService, MixedPdfGeneratorService, etc.

## Deployment
- **Platform**: Cloudflare Pages
- **Build command**: `ng build` (outputs to `dist/`)
- **Deploy command**: `npm run deploy` (build + wrangler deploy)
- **Preview**: `npm run preview` (local Cloudflare dev server)
- **Base path**: `/image-to-pdf`

## Environment Setup
```bash
# Prerequisites
Node.js 18+, npm 10+

# Installation
npm install

# Development
ng serve        # http://localhost:4200/image-to-pdf

# Testing
ng test         # Vitest single-run
ng test -- --watch  # Vitest watch mode

# Production
ng build        # Outputs to dist/

# Deployment
npm run deploy  # Build + Cloudflare deploy
```

## Browser Support
- Chrome 120+
- Edge 120+
- Firefox 115+
- Safari 17+

## Architecture Decisions

### Why Web Workers?
PDF generation and OCR involve heavy computation (image encoding, base64, layout calculation). Running these off the main thread keeps the UI responsive and prevents browser "page unresponsive" dialogs.

### Why jsPDF + pdf-lib?
- jsPDF is used for generating new PDFs from images (lightweight, good A4 support)
- pdf-lib is used for manipulating existing PDFs (merge, split, rearrange, annotate)
- Together they cover the full spectrum of PDF operations

### Why Dexie (IndexedDB)?
- Settings need to persist across browser sessions
- Dexie provides a clean Promise-based API over IndexedDB
- Allows storing large data (file references, workspace state) that exceeds localStorage limits

### Why Angular SSR?
- PDF toolkit needs SEO visibility for organic traffic
- Each tool page needs unique title, description, and social meta tags
- SSR renders this content for crawlers while the app hydrates client-side
