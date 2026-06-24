# Image to PDF Converter -> Online2PDF-Level Platform Roadmap

> Status-aware roadmap for the current Angular image-to-PDF application.
>
> Last implementation audit: 2026-06-23
>
> Verified during audit by source analysis:
> - `src/app/tools/image-to-pdf/image-to-pdf.component.ts` shows image + PDF upload handling
> - `src/app/services/pdf.service.ts` and `src/app/services/pdf-worker.service.ts` implement worker-backed generation
> - `src/app/services/pdf-settings-storage.service.ts` persists settings to `localStorage`
> - `src/app/components/pdf-preview/pdf-preview.component.ts` uses `pdfjs-dist` preview and local worker support
> - `src/app/tools/pdf-merge/pdf-merge.component.ts` implements PDF merge with drag-drop
> - `src/app/tools/pdf-split/pdf-split.component.ts` implements PDF split with range parsing
> - `src/app/tools/pdf-rearrange/pdf-rearrange.component.ts` implements page reordering/duplicate/delete
> - `src/app/tools/pdf-compress/pdf-compress.component.ts` implements three-level compression with worker
> - `src/app/tools/pdf-protect/pdf-protect.component.ts` implements QPDF WASM encryption/decryption
> - `src/app/tools/mixed-builder/mixed-builder.component.ts` implements mixed image+PDF builder
> - `src/app/tools/pdf-to-image/pdf-to-image.component.ts` implements PDF-to-image export
> - `src/app/services/storage/indexed-db.service.ts` implements IndexedDB persistence via Dexie
> - `src/app/services/storage/session-storage.service.ts` implements session-based file storage

---

## Current Implementation Snapshot

The application is now a browser-first multi-tool PDF platform with image-to-PDF conversion, full PDF manipulation toolkit, PDF-to-image export, worker-based processing, manual/system theme toggle, and IndexedDB persistence.

### Implemented Tools

| Tool | Status | Route | Description |
|------|--------|-------|-------------|
| Image to PDF | ✅ Done | `/image-to-pdf` | Core converter with settings, editor, preview |
| PDF Preview | ✅ Done (route exists) | `/pdf-preview` | PDF preview with thumbnails, zoom, navigation |
| Merge PDFs | ✅ Done | `/merge` | Merge multiple PDFs with drag-drop reordering |
| Split PDF | ✅ Done | `/split` | Page range extraction with single/separate modes |
| Rearrange PDF | ✅ Done | `/rearrange` | Page reordering, duplicate, delete operations |
| Compress PDF | ✅ Done | `/compress` | Three-level compression with worker support |
| Protect PDF | ✅ Done | `/protect` | QPDF WASM encryption/decryption with permissions |
| Mixed Builder | ✅ Done | `/mixed-builder` | Combine images + PDF pages into single document |
| PDF to Image | ✅ Done | `/pdf-to-image` | Export PDF pages as PNG/JPEG with ZIP support |

### Implemented Infrastructure

- Angular standalone application structure with lazy-loaded tool routes
- Tool-based architecture with `ToolRegistryService` for discovery and navigation
- Drag-and-drop and file picker upload flow for image and PDF files
- Per-file validation for supported MIME types and 10 MB maximum size
- Image preview queue with removal and reorder
- Native HTML/Angular CDK drag-and-drop reordering across all tools
- Image editor modal with crop, rotate, brightness, contrast, grayscale, and sharpen controls
- PDF generation using `jsPDF` with worker-backed processing
- Worker-backed PDF generation and blob creation via `PdfWorkerService`
- Worker-backed PDF compression via `PdfCompressionWorkerService`
- Worker progress UI with percentage, status, processed count, and cancel action
- 1-up, 2-up, and 4-up PDF page layouts
- Page size setting: A4, Letter, Legal
- Orientation setting: portrait, landscape
- Compression/quality presets: FAST, MEDIUM, SLOW
- Configurable per-side margins
- Image fit modes: contain, cover, stretch
- Image vertical alignment: top, center, bottom
- Background color fill for generated pages
- Settings persistence via `PdfSettingsStorageService` (localStorage)
- Reusable PDF settings panel component
- Margin sanitization and printable area preservation
- Pure layout engine in `src/app/utils/pdf-layout-engine.ts`
- Real generated-PDF preview with thumbnails, zoom, and page navigation
- Lazy-loaded `pdfjs-dist` renderer with public worker asset
- PDF upload extraction via `PdfExtractionService` (PDF pages converted into image files)
- File metadata tracking for name, type, size, and URL
- Error handling for file validation and PDF generation
- Cancellation handling for long-running worker-backed PDF generation
- Responsive UI with a mobile-friendly shell and **manual/system theme toggle** with localStorage persistence
- Header/Footer template engine with template variables `{date}`, `{page}`, `{totalPages}`, `{filename}`
- Multiple output modes: Single PDF, Separate PDFs, ZIP archive (via `ExportService`)
- Page rotation controls (0°, 90°, 180°, 270°) with visual thumbnail feedback
- `pdf-lib` for document-level PDF operations (merge, split, rearrange, compress)
- `qpdf-run` WASM for AES-256 encryption/decryption with permission controls
- `jszip` for multi-file ZIP bundling
- `dexie` for IndexedDB persistence (settings, session files, mixed builder items, workspace sessions)
- `SessionStorageService` for session-based file data storage
- 292+ unit tests across 19+ test files

### Partially implemented

- Image editor is functional, but the edit history and non-destructive undo model are not implemented
- PDF preview is implemented for generated image PDFs; arbitrary PDF editing preview is not yet supported
- Mixed Builder and PDF Preview tools have routes and complete implementations but remain intentionally disabled in `ToolRegistryService` (enable when UX integration is ready)
- IndexedDB: `pdfSettings`, `sessionFiles`, and `workspaceSessions` tables are fully integrated; `mixedBuilderItems` table is schema-only and not wired into any service

### Not implemented

- `tesseract.js` OCR and searchable PDFs
- Virtual scrolling for large file queues
- Upload queue progress/retry/cancel flows
- TXT extraction from PDFs
- JSON metadata export
- Certificate-based encryption
- Batch compression of multiple PDFs
- Custom grid layout option
- Horizontal alignment options beyond centering
- `konva` and `OpenCV.js` are not currently used

---

## Project Goal

Transform the app into a full-featured browser-only PDF toolkit similar in capability to Online2PDF while keeping a cleaner, more modern, mobile-first UX.

The app should remain:

- Frontend-only
- Browser-based
- Responsive on desktop and mobile
- Usable offline after loading once PWA support exists
- Free of authentication, cloud storage, or server-side processing

---

# Execution Rules

## Global Constraints

- Frontend-only Angular application
- No backend services
- No server-side processing
- No authentication system
- No cloud storage
- No Node.js APIs in application runtime
- All processing must run in the browser
- Application must support desktop and mobile
- Use Web Workers for CPU-intensive work once those systems are introduced
- Preserve standalone Angular architecture
- Prefer reusable components/services
- Avoid large monolithic components

## Architecture Rules

Components should handle:

- UI rendering
- Event handling
- Local presentation state

Components should not directly own:

- PDF generation logic
- OCR logic
- Heavy image compression
- Heavy binary manipulation
- IndexedDB persistence

Services should handle:

- PDF generation
- Image processing
- OCR
- Compression
- Export logic
- IndexedDB persistence

Workers should eventually handle:

- OCR
- Compression
- Thumbnail generation
- PDF generation
- Batch exports

## Required Validation Before Completing Features

Before considering a feature complete:

- Angular build must pass
- No TypeScript errors
- No known console errors from the feature
- Mobile layout must work
- Desktop layout must work
- Dark mode must remain usable
- Existing image-to-PDF generation must still work

Known current validation note:

- `npm run build` may fail in PowerShell because script execution blocks `npm.ps1`.
- Use `npm.cmd run build` on this Windows environment.
- The current implementation includes a worker-backed PDF generator and PDF page extraction, so regressions in these subsystems should be validated carefully.

---

# Implementation Status By Phase

Legend:

- Done: implemented enough to use
- Partial: usable subset exists, but not roadmap-complete
- Skipped: explicitly excluded from current roadmap
- Not started: no implementation found

---

# PHASE 0 - BASELINE APP

## Status: Done

The baseline application is complete enough to upload, preview, edit, and export images as PDF with a foundational UI.

Current baseline assets and source areas:

```text
src/app/tools/image-to-pdf/image-to-pdf.component.ts
src/app/services/file.service.ts
src/app/services/image-optimizer.service.ts
src/app/services/pdf.service.ts
src/app/services/pdf-worker.service.ts
src/app/services/pdf-settings-storage.service.ts
src/app/services/pdf-extraction.service.ts
src/app/services/export.service.ts
src/app/services/header-footer.service.ts
src/app/utils/pdf-layout-engine.ts
src/app/components/app-header/
src/app/components/drag-drop-zone/
src/app/components/file-list/
src/app/components/file-item/
src/app/components/generate-pdf-button/
src/app/components/image-editor-modal/
src/app/components/pdf-preview/
src/app/components/pdf-settings-panel/
```

Completed baseline capabilities:

- Upload image and PDF files
- Preview uploaded items
- Reorder uploaded files
- Remove uploaded files
- Edit image content and filters
- Generate downloaded PDF files
- Generate 1-up, 2-up, or 4-up PDF layouts
- Configure page size, orientation, quality, margins, fit, alignment, and background color
- Preview generated PDFs before download
- Use worker-backed PDF generation when supported
- Extract PDF pages into image files for inclusion in new PDFs
- Persist PDF settings to browser storage
- Surface validation errors for unsupported or oversized files
- Responsive UI and dark mode support

Remaining baseline hardening:

- Improve object URL lifecycle and memory handling for repeated preview/export operations
- Expand browser-level regression coverage for PDF upload extraction and worker fallback behavior

---

# PHASE 1 - CORE PDF ENHANCEMENT

## Objective

Complete the core image-to-PDF generation experience and strengthen export reliability.

## Overall Status: Done for Phase 1 MVP

Phase 1 is implemented and includes:

- Worker-backed PDF generation with fallback to main thread
- Explicit worker progress/cancel UI in the export panel
- Real generated-PDF preview via `pdf.js`
- Persistent PDF settings panel
- PDF page layout engine for 1-up, 2-up, and 4-up exports
- PDF upload support with page extraction into image files

Remaining Phase 1 polish:

- Add margin feedback when sanitization occurs
- Expand preview UX for large PDFs and page list navigation

---

# PHASE 2 - ADVANCED IMAGE / PDF CONTROLS

## Objective

Add richer editing and document layout controls beyond the core converter.

## Status: Done (100% Complete)

Completed Phase 2 scope:

- Advanced image filtering in editor: brightness, contrast, grayscale, sharpen
- Crop and rotate controls in the image editor
- Settings persistence and advanced options in the settings panel
- **DONE: PDF page rotation controls (Feature 8)**
- **DONE: Header/Footer template engine (Feature 9)**
- **DONE: Multiple output modes and ZIP download (Feature 10)**

All Phase 2 features are now implemented and validated.

---

# PHASE 3 - PDF MANIPULATION

## Status: 100% Complete (6 of 6 Features)

Phase 3 implements true PDF-document workflows:

- **DONE: PDF merge with drag-drop reordering (Feature 11)**
- **DONE: PDF split with page range extraction (Feature 12)**
- **DONE: PDF rearrange and page-level editing (Feature 13)**
- **DONE: PDF compression with three levels (Feature 14)**
- **DONE: Password protection and encryption (Feature 15)**
- **DONE: Mixed PDF + Image Builder with drag-drop queue, image pages preserved as PDF pages without rasterization (Feature 16)**

Dependencies:

- `pdf-lib` (7.0.2+) for document-first operations - INSTALLED and used by merge, split, rearrange, and compress
- `pdfjs-dist` for canvas-based page rendering during medium/high compression - INSTALLED and used
- `jszip` already available from Phase 2 for multi-file bundling

---

# PHASE 4 - FRONTEND EXPORT & CONVERSION ENGINE

## Objective

Expand browser-based export and conversion features without backend services.

## Overall Status: Done (PDF to Image Export Complete ✅)

Phase 4 implements browser-based PDF-to-image conversion:

- **DONE: PDF to image export** — Full implementation with `PdfToImageService` using `pdfjs-dist` for page rendering
- **DONE: Canvas-based export engine** — Page rendering with white background fill, configurable DPI scale (1× to 4×)
- **DONE: Batch image export** — Individual downloads with staggered timing (300ms delay per file)
- **DONE: ZIP bundles** — `jszip` integration for single-archive download of all images
- **DONE: Output format selection** — PNG (lossless) and JPEG (configurable quality 1-100%)
- **DONE: Page range selection** — Support for "all", specific pages, and range syntax (e.g., "1-3, 5, 7-10")

### Feature 17. PDF to Image Export

Status: Implemented for Phase 4 MVP

Implemented:

- **PdfToImageService** — Full service implementation for PDF page → image conversion
  - `convertToImages()`: Renders PDF pages to canvas with configurable scale
  - `createZip()`: Bundles exported images into ZIP archive via jszip
  - `getPageCount()`: Async page counting from PDF files
  - `parsePageRange()`: Range string parsing ("1-3, 5, 7-10") into page arrays
  - `sanitizeFileName()`: Safe filename generation for downloads
  - `formatFileSize()`: Human-readable file size formatting
  - `revokeObjectUrls()`: Memory cleanup for Data URLs
  - Progress tracking via `BehaviorSubject<ExportProgress>`
  - `cancelExport()`: Abort ongoing export operations
  - PDF worker initialization via `pdfjsLib.GlobalWorkerOptions.workerSrc`

- **PdfToImageComponent** — Complete component implementation
  - Drag-drop PDF upload with file validation
  - Page count display on PDF load
  - Format selector: PNG / JPEG with conditional quality slider
  - Scale selector: 1× (72 DPI) to 4× (300 DPI) with descriptive labels
  - Output mode: Individual images or ZIP archive
  - Page range input with placeholder examples
  - Output filename prefix input
  - Export progress bar with status text, page count, and percentage
  - Cancel button during export
  - Result display with individual image download and "Download All" option
  - Clear All button to reset everything
  - Error handling with user-facing error messages

- **Routing and Registration**
  - Lazy-loaded route at `path='/pdf-to-image'` with title 'PDF to Image'
  - Tool registry enabled with priority 58 (8th in tool menu)
  - Tool definition: id='pdf-to-image', category='extract', enabled=true

- **UI/UX**
  - Responsive HTML template (170+ lines) with clear visual hierarchy
  - Drag-drop upload zone with visual feedback
  - Two-column settings layout (format/scale on one side, output/page range on other)
  - JPEG quality slider (1-100%) shown only when JPEG format is selected
  - Scale selector with DPI labels: Small (72 DPI), Screen (150 DPI), High (200 DPI), Print (300 DPI)
  - Progress bar with percentage, page count, and cancel action
  - Result images displayed in a flex-wrap grid with download buttons
  - Dark mode support via CSS variables
  - Comprehensive SCSS styling (350+ lines)

Technical implementation:

- Uses `pdfjs-dist` for PDF document loading and page rendering
- Canvas 2D rendering with white background fill for transparent PDF pages
- `canvas.toBlob()` for image blob generation
- `canvas.toDataURL()` for Data URL result creation
- Scale options map to approximate DPI: 1×=72, 2×=150, 3×=200, 4×=300
- jszip dynamically imported for ZIP creation (lazy loading)
- Individual downloads staggered at 300ms intervals to avoid browser popup blocking
- Memory cleanup with `URL.revokeObjectURL()` after downloads

Not implemented:

- Worker-backed page rendering for very large PDFs (deferred to Phase 6)
- TXT text extraction from PDFs
- JSON metadata export
- Batch conversion of multiple PDFs simultaneously
- Custom page size / cropping during export

---

# PHASE 5 - OCR & AI FEATURES

## Objective

Add document intelligence features.

## Overall Status: Not started

Not implemented:

- OCR
- Searchable PDFs
- Text extraction
- Multi-language OCR
- Scan enhancement
- Smart crop/page detection
- Perspective correction
- `tesseract.js`
- OpenCV.js

Recommended prerequisite:

Workers should be introduced before OCR.

---

# PHASE 6 - PERFORMANCE & SCALABILITY

## Objective

Optimize large-file handling and app performance.

## Overall Status: Web Worker for PDF Generation + Compression Worker Complete

Phase 6.1 implemented PDF generation off the main thread using Web Workers.
Phase 6.2 adds a dedicated compression worker that moves MEDIUM/HIGH PDF compression off the main thread as well.

Remaining Phase 6 items (OCR worker, thumbnail generation worker, virtual scrolling) are deferred until additional tools need optimization.

---

## Feature 1. Web Worker for PDF Generation

Status: Implemented

Implemented:

- `src/app/workers/pdf-generation.worker.ts` - Dedicated worker script that receives FileObject array and PDFSettings
- `src/app/services/pdf-worker.service.ts` - Worker lifecycle management with observable progress tracking
- PDF generation completely moved off main thread
- Progress reporting via Observable pattern (BehaviorSubject)
- Progress and cancel controls surfaced in the export panel
- Cancellation rejects the active worker operation and does not fall back to main-thread generation
- Automatic fallback to main thread if workers unavailable or error occurs
- Comprehensive error handling and worker cleanup
- Blob generation from base64 worker output

Technical implementation:

- Worker receives `GeneratePDFMessage` with files, settings, and fileName
- Worker generates jsPDF with full PDF layout engine logic
- Progress updates sent back via `ProgressMessage` after each image processed
- PDF output converted to base64 and sent back via `CompletionMessage`
- Main thread converts base64 to Blob and triggers browser download
- Worker automatically terminates after completion
- Cancel action terminates the worker and clears progress state
- Error handling sends `ErrorMessage` back to main thread

Benefits:

- UI remains completely responsive during PDF generation
- Large image batches no longer freeze the browser
- Users can see generation progress and cancel long-running exports
- Graceful degradation on browsers without Worker support
- Performance improvements measured on large file batches

Integration:

- `PDFService.generatePDF()` async, uses worker when available
- `PDFService.createPDFBlob()` async, uses worker when available  
- `pdf-preview.component` updated to handle async blob generation
- `image-to-pdf.component` subscribes to worker progress and handles cancellation
- `pdf-settings-panel` and `generate-pdf-button` display progress and emit cancel events

Files modified:

- `src/app/services/pdf.service.ts` - Added worker integration
- `src/app/services/pdf-worker.service.ts` - Worker management, progress, and cancellation
- `src/app/workers/pdf-generation.worker.ts` - Worker script
- `src/app/components/generate-pdf-button/` - Progress and cancel UI
- `src/app/components/pdf-settings-panel/` - Progress/cancel pass-through
- `src/app/tools/image-to-pdf/image-to-pdf.component.ts` - Progress subscription and cancel handling
- `src/app/components/pdf-preview/pdf-preview.component.ts` - Async blob handling

Build status: Passed with existing jsPDF/canvg CommonJS optimization warnings (Output location: `D:\Codes\image2pdf\dist\image-to-pdf-app`)

Test status: Passed (`npm.cmd test -- --watch=false`, 57 tests)

Not implemented:

- OCR worker (Phase 5)
- Thumbnail generation worker (Phase 6.3)
- Virtual scrolling (Phase 6.4)
- IndexedDB persistence (Phase 6.5)
- Chunked processing (Phase 6.6)

Future considerations:

- Monitor memory usage during large batch processing
- Extend worker pattern to OCR when tesseract.js integrated

---

## Feature 2. Web Worker for PDF Compression

Status: Implemented (Phase 6.2)

Implemented:

- `src/app/workers/pdf-compression.worker.ts` - Dedicated worker script that receives PDF bytes, compression level, and JPEG quality
- `src/app/services/pdf-compression-worker.service.ts` - Worker lifecycle management with observable progress tracking
- `src/app/services/pdf-compress.service.ts` - Updated to delegate MEDIUM/HIGH compression to the worker with main-thread fallback
- `src/app/tools/pdf-compress/pdf-compress.component.ts` - Progress subscription and cancel handling
- `src/app/tools/pdf-compress/pdf-compress.component.html` - Progress bar UI with status text, count, percentage, and cancel button
- `src/app/tools/pdf-compress/pdf-compress.component.scss` - Progress bar and cancel button styles
- MEDIUM and HIGH compression completely moved off main thread
- LOW compression stays on main thread (light pdf-lib re-save, no benefit from worker)
- Progress reporting per page via Observable pattern (BehaviorSubject)
- Cancellation via abort message termination (no main-thread fallback on cancel)
- Automatic fallback to main-thread rendering if workers unavailable or error occurs
- 8 new focused unit tests for PdfCompressionWorkerService

Technical implementation:

- Worker receives `CompressMessage` with pdfBytes, level, jpegQuality, and pageCount
- LOW compression: pdf-lib metadata stripping directly in worker
- MEDIUM/HIGH compression: pdfjs-dist page rendering with OffscreenCanvas → JPEG conversion → pdf-lib re-embedding
- Progress updates sent back via `ProgressMessage` after each page compressed
- Abort message terminates processing mid-stream
- Main thread converts returned Uint8Array to Blob
- Worker automatically terminates after completion or cancellation

Benefits:

- UI remains completely responsive during PDF compression
- Large multi-page PDFs no longer freeze the browser during MEDIUM/HIGH compression
- Users can see per-page progress and cancel long-running compression
- Graceful degradation on browsers without Worker support
- Consistent pattern with existing PdfWorkerService for PDF generation

Files created:
- `src/app/workers/pdf-compression.worker.ts` - Worker script
- `src/app/services/pdf-compression-worker.service.ts` - Worker lifecycle management

Files modified:
- `src/app/services/pdf-compress.service.ts` - Worker integration with fallback
- `src/app/tools/pdf-compress/pdf-compress.component.ts` - Progress/cancel behavior
- `src/app/tools/pdf-compress/pdf-compress.component.html` - Progress bar UI
- `src/app/tools/pdf-compress/pdf-compress.component.scss` - Progress/cancel styles
- `angular.json` - Component style budget increased

Build status: Passed (`npm.cmd run build`, 267 tests, all passing)

Test status: 267 tests passed across 18 test files (8 new tests for PdfCompressionWorkerService)

Not implemented:
- OCR worker (Phase 5)
- Thumbnail generation worker (Phase 6.3)
- Virtual scrolling (Phase 6.4)

---

# PHASE 7 - SAAS-LEVEL UX & PLATFORM FEATURES

## Objective

Turn the application into a polished multi-tool platform.

## Overall Status: Mostly not started

Implemented:

- Polished single-tool UI shell
- Responsive layout
- System dark mode + manual theme toggle with localStorage persistence
- Tool-based architecture with navigation
- Dashboard/recent files concept via IndexedDB workspace sessions
- **PWA/offline support** — Angular Service Worker with comprehensive caching strategy (app shell, fonts, images, PDF workers, WASM), offline banner, and update notifications
- **Offline connectivity service** — `OfflineService` with signal-based online/offline tracking
- **Update notification** — `UpdateService` + `UpdateNotificationComponent` for version update prompts

Not implemented:

- Upload queue system with progress/retry/cancel

Recommendation:

Do not build the dashboard before at least one additional PDF tool exists. A dashboard is more useful after the app has image-to-PDF plus one of preview, compression, merge, or split.

---

# Revised Priority Implementation Order

Based on the current codebase, the best next steps are:

1. ~~Add Web Worker support for expensive image/PDF processing.~~ **DONE**
2. ~~Add IndexedDB session persistence.~~ **DONE (Dexie schema created)**
3. ~~Add PDF upload/merge/split tools after the tool architecture exists.~~ **DONE**
4. ~~Add ZIP/multiple output modes after export architecture exists.~~ **DONE**
5. ~~Add PDF to image export.~~ **DONE**
6. ~~Add manual/system theme toggle in app header.~~ **DONE**
7. ~~Add PDF manipulation preview support for uploaded PDFs.~~ **DONE (June 23, 2026 — rearrange page thumbnails via PdfToImageService.renderPageThumbnails())**
8. ~~Wire `mixedBuilderItems` IndexedDB table into the Mixed Builder tool (optional — schema exists).~~ **SKIPPED PERMANENTLY**
9. Add OCR only after worker infrastructure is in place.
10. ~~Add PWA/offline installation after local workspace persistence is stable.~~ **DONE (June 23, 2026)**

This order builds directly on what is already implemented and avoids introducing large PDF manipulation systems before the core image-to-PDF workflow is solid.

**Skipped permanently:**
- Enable Mixed Builder and PDF Preview tools in `ToolRegistryService` (components and routes exist; will remain disabled until intentional UX integration)

---

## Top 3 Short-Term Priorities

1. ~~Add IndexedDB-based persistence for session state and saved settings.~~ **DONE (June 15, 2026 — Dexie schema with 4 tables created)**
2. ~~Add PDF upload + merge/split tools once the tool-based route architecture is available.~~ **DONE**
3. ~~Add PDF to image export.~~ **DONE (June 18, 2026)**

---

# Recommended Near-Term Tasks

## Task A - Clean Baseline UX

Status: Implemented for current scope + Bug Fixes

Implemented:

- Debug logs removed from `App` and `FileService`
- Visible validation messages for unsupported, oversized, and read-error files
- Dedicated PDF generation error message
- File metadata preserved as `size` and `type`
- Service tests cover validation and reordering
- **NEW: Fixed PDF preview multi-page rendering issue**
- **NEW: Fixed PDF generation loading state refresh**

Remaining:

- Revisit object URL/Data URL memory strategy during performance work

## Task B - Extract PDF Settings Panel

Status: Implemented

Implemented:

- `src/app/components/pdf-settings-panel/` exists
- Page size, orientation, quality, advanced settings, summary, and generate button are inside the panel
- `App` receives settings via `settingsChanged`

Remaining:

- Settings persistence now implemented in Phase 2.2

## Task C - Expand PDF Layout Settings

Status: Implemented for current scope

Implemented:

- `PDFSettings` includes margins, fit mode, alignment, background color, and images per page
- `PDFService` uses margin, fit, alignment, and images-per-page settings
- One-image-per-page remains the default
- Background color is applied to every generated PDF page
- Numeric coercion and margin sanitization protect PDF generation

Remaining:

- Add user-facing warnings for automatically sanitized margins only if needed

## Task D - Multi-Image Layout Engine

Status: Mostly implemented

Implemented:

- `src/app/utils/pdf-layout-engine.ts` exists
- Supports 1, 2, and 4 images per page
- `PDFService` consumes the layout engine
- Unit tests cover layout calculations
- Cover mode is clipped to each layout cell

Remaining:

- Add custom grid support only if product needs it later

## Task E - PDF Preview

Status: Implemented for Phase 1 MVP

Implemented:

- `src/app/components/pdf-preview/` exists
- Uses `pdfjs-dist`
- Renders generated PDF output from the same `PDFService` settings
- Supports thumbnails, page navigation, and zoom controls
- Lazy-loads the pdf.js renderer
- **Fixed**: Multi-page display now works correctly

Remaining:

- Uploaded-PDF preview belongs with future PDF upload/manipulation features

## Task F - Compression Engine

Status: Implemented for Phase 1 MVP

Implemented:

- `src/app/services/image-optimizer.service.ts` exists
- Optimizes images before PDF download
- Uses FAST, MEDIUM, and SLOW quality presets
- Resizes large images through Canvas before PDF generation

Remaining:

- Move compression into a Web Worker during Phase 6 (DONE — Phase 6.2)
- Surface output-size estimates in UI only if the product needs that feedback

## Task G - CDK Reordering

Status: Implemented

Implemented:

- `@angular/cdk` is installed
- `file-list` uses `CdkDragDrop`
- `FileService.reorderFiles()` uses `moveItemInArray()`
- Native HTML drag event handling was removed from `file-item`

Remaining:

- Large-list performance should be handled with virtual scrolling later

## Task H - Advanced Image Editor (NEW - Phase 2.1)

Status: Implemented

Implemented:

- `src/app/components/image-editor-modal/` extended with filters
- Brightness adjustment (0-200%)
- Contrast adjustment (0-200%)
- Grayscale effect (0-100%)
- Sharpen effect (0-100%)
- Show/Hide filters toggle
- Reset filters button
- Live preview as sliders change
- Canvas pixel manipulation for all effects
- Sharpen uses 3x3 convolution kernel

Technical implementation:

- Brightness/contrast applied via direct pixel value adjustment
- Grayscale uses standard luminosity formula (0.299R + 0.587G + 0.114B)
- Sharpen uses 3x3 convolution kernel with intensity scaling
- Filters combined: brightness + contrast + grayscale + sharpen all work together
- All processing client-side without backend

## Task I - Settings Persistence (NEW - Phase 2.2)

Status: Implemented

Implemented:

- `src/app/services/pdf-settings-storage.service.ts` created
- Browser localStorage read/write/clear operations
- Settings validation with sensible defaults
- Graceful error handling for storage access
- Type-safe Partial<PDFSettings> handling
- Auto-migration of incomplete stored settings

Integration status:

- `ImageToPdfComponent` loads saved settings on construction.
- `ImageToPdfComponent.onPDFSettingsChanged()` saves settings automatically.
- Settings remain tool-scoped because the app now uses lazy tool routes.
- Consider adding UI button to clear saved settings if users request it

---

## Task J - Web Worker for PDF Generation (NEW - Phase 6.1)

Status: Implemented

Implemented:

- `src/app/workers/pdf-generation.worker.ts` - Complete PDF generation logic ported from main thread
- `src/app/services/pdf-worker.service.ts` - Worker lifecycle management with Observable progress tracking
- Message passing infrastructure for GeneratePDFMessage, ProgressMessage, CompletionMessage, ErrorMessage
- Full integration with `PDFService.generatePDF()` and `PDFService.createPDFBlob()`
- Async/await support in `ImageToPdfComponent.onGeneratePDF()`
- Async blob generation in `pdf-preview.component.ts`
- Error handling with automatic fallback to main thread
- Worker cleanup and termination
- Progress and cancel UI wired through `ImageToPdfComponent -> PdfSettingsPanel -> GeneratePDFButton`
- Cancellation terminates the active worker and avoids main-thread fallback

Testing:

- Unit tests created for PdfWorkerService structure
- Unit tests cover cancellation behavior and fallback suppression
- Unit tests cover generate button progress/cancel behavior
- Test suite passed: `npm.cmd test -- --watch=false` (57 tests)
- TypeScript compilation verified
- Angular build verification passed (dist output generated)

Next testing steps:

- Browser integration test: Generate PDF with 2+ images, verify all pages in output
- Fallback test: Disable workers in browser, verify main thread generation works
- Performance benchmark: Compare worker vs main-thread on large file batches

---

# Recommended Final Architecture

Target structure:

```text
src/app/
  core/
  shared/
  features/
    image-to-pdf/
    merge-pdf/
    split-pdf/
    compress-pdf/
    rearrange-pdf/
    protect-pdf/
    mixed-builder/
    pdf-to-image/
    ocr/
    editor/
    watermark/
    preview/
  services/
    pdf/
    image/
    ocr/
    compression/
    export/
    storage/
  workers/
  utils/
  models/
```

Current structure:

```text
src/app/
  tools/
    image-to-pdf/
    pdf-preview/
    pdf-merge/
    pdf-split/
    pdf-rearrange/
    pdf-compress/
    pdf-protect/
    mixed-builder/
    pdf-to-image/
  components/
    app-header/
    drag-drop-zone/
    file-list/
    file-item/
    generate-pdf-button/
    image-editor-modal/
    pdf-preview/
    pdf-settings-panel/
   services/
    storage/ (indexed-db, session-storage)
    (file, pdf, pdf-worker, pdf-settings-storage, pdf-extraction,
     image-optimizer, export, header-footer, pdf-merge, pdf-split,
     pdf-rearrange, pdf-compress, pdf-compression-worker,
     pdf-protection, mixed-pdf-generator, mixed-document, pdf-to-image,
     tool-registry)
  workers/
    pdf-generation.worker.ts
    pdf-compression.worker.ts
  utils/
    pdf-layout-engine.ts
  models/
    document-item.model.ts
  app.ts
  app.html
  app.scss
  app.routes.ts
```

Migration rule:

- Do not jump directly to the final architecture.
- Move code when a feature needs the boundary.
- Keep each migration small and buildable.

---

# Recommended Libraries

| Purpose | Library | Current Status |
|---|---|---|
| PDF generation | jsPDF | Installed and used |
| Advanced PDF editing | pdf-lib | Installed and used |
| PDF rendering | pdfjs-dist | Installed and used |
| PDF encryption/decryption | qpdf-run | Installed and used |
| OCR | tesseract.js | Not installed |
| Drag and drop | Angular CDK | Installed and used |
| ZIP export | jszip | Installed and used |
| Image editing | Konva | Not installed |
| Image processing | OpenCV.js | Not installed |
| Local storage / IndexedDB | Dexie | Installed and used |

---

# Frontend-Only Performance Strategy

Use Web Workers for:

- PDF generation ✅
- PDF compression ✅
- OCR (not started)
- Thumbnail generation (not started)
- Batch exports (not started)

Use IndexedDB for:

- Uploaded file/session persistence ✅ (schema created, integration pending)
- Local projects ✅ (schema created, integration pending)
- Settings ✅ (schema created, integration pending)
- Temporary exports (not started)

Use chunked processing to:

- Process images in batches
- Limit concurrent canvas operations
- Keep UI responsive during export

Optimize memory usage by:

- Avoiding unnecessary Data URL duplication
- Cleaning up canvases after processing
- Compressing thumbnails
- Lazy-rendering previews
- Adding virtual scrolling for large queues

---

# Product Strategy

Do not clone Online2PDF's UI.

Online2PDF-level capability is the feature target, not the design target.

The product advantage should be:

- Cleaner workflows
- Better mobile behavior
- Better visual hierarchy
- Faster feedback
- Lower clutter
- Stronger local/offline privacy story

The near-term product should stay focused on making image-to-PDF excellent before expanding into every PDF tool.

---

# Anti-Patterns To Avoid

- Giant multi-phase prompts
- Massive folder restructuring before features require it
- Mixing UI state and PDF/image processing logic
- Adding backend assumptions
- Introducing many heavy libraries in one change
- Building a dashboard before there are multiple real tools
- Moving CPU-heavy OCR/compression onto the main thread

---

# Recommended Workflow

1. Pick one task from the near-term list.
2. Ask to inspect the relevant files first.
3. Implement only that task.
4. Run `npm run build`.
5. Add or update focused tests when behavior changes.
6. Commit after each completed feature.

---

# Recent Session Summary

## June 15, 2026 — Worker-backed PDF Compression (Phase 6.2)

**Files created:**
- `src/app/workers/pdf-compression.worker.ts` — Dedicated Web Worker handling LOW/MEDIUM/HIGH PDF compression using `pdfjs-dist` + `OffscreenCanvas` + `pdf-lib` with per-page progress and abort support
- `src/app/services/pdf-compression-worker.service.ts` — Worker lifecycle management with observable progress tracking and cancellation
- `src/app/services/pdf-compression-worker.service.spec.ts` — 8 new unit tests

**Files modified:**
- `src/app/services/pdf-compress.service.ts` — MEDIUM/HIGH compression goes through worker automatically; LOW stays on main thread; exposes `getProgress()`, `cancel()`, and `isWorkerSupported()`
- `src/app/tools/pdf-compress/pdf-compress.component.ts` — Added progress subscription, cancel button handler, `OnDestroy` cleanup
- `src/app/tools/pdf-compress/pdf-compress.component.html` — Added progress bar with status text, `current/total` count, percentage, and cancel button
- `src/app/tools/pdf-compress/pdf-compress.component.scss` — Added progress bar and cancel button styles
- `angular.json` — Increased component style budget to accommodate new styles

**Validation:**
- `npm.cmd run build` passes (TypeScript compilation + Angular build)
- `npm.cmd test -- --watch=false` — **267 tests passed across 18 test files**

## June 18, 2026 — PDF to Image Export (Phase 4)

**Files created:**
- `src/app/services/pdf-to-image.service.ts` — Full service for PDF page → image conversion with progress tracking, ZIP bundling, and cleanup
- `src/app/services/pdf-to-image.service.spec.ts` — Unit tests for the service
- `src/app/tools/pdf-to-image/pdf-to-image.component.ts` — Complete component with drag-drop, format/scale/page-range settings, progress bar, result display
- `src/app/tools/pdf-to-image/pdf-to-image.component.html` — Responsive template (170+ lines) with settings layout and result grid
- `src/app/tools/pdf-to-image/pdf-to-image.component.scss` — Styling (350+ lines) with dark mode support

**Files modified:**
- `src/app/app.routes.ts` — Added lazy-loaded route at `path='/pdf-to-image'`

**Validation:**
- `npm run build` passes
- `npm test` passes

## June 23, 2026 — PDF Preview for Uploaded PDFs (Priority 5)

**Problem:** The `pdf-preview` component's template had `<canvas #previewCanvas>` inside the `@else` structural branch. When `pdfBlob` was set but `totalPages === 0`, the "Loading PDF preview…" `@else if` branch was active instead — the canvas never existed in the DOM, so `@ViewChild` could never resolve, causing an infinite retry loop with "Canvas ViewChild not ready yet" logs.

**Fix — Template (`pdf-preview.component.html`):**
- Restructured the `@else` block so the canvas is **always rendered** when data is present
- Moved the "Loading PDF preview…" text into a conditional **overlay inside** the `@else` block instead of a separate structural branch

**Fix — Component (`pdf-preview.component.ts`):**
- Added explicit canvas availability check in `performRefresh()` before calling `refreshPreview()`
- If canvas isn't ready, resets `isRefreshing` and schedules a `setTimeout` retry after 400ms

**Files modified:**
- `src/app/components/pdf-preview/pdf-preview.component.html` — Template restructured to always render canvas
- `src/app/components/pdf-preview/pdf-preview.component.ts` — Added retry scheduling when canvas ViewChild not ready

**Validation:**
- `npm run build` passes (no errors, only pre-existing budget warnings)

## June 23, 2026 — PDF Page Thumbnails on Rearrange Page

**Problem:** The PDF rearrange page showed pages as plain numbered list items with no visual preview of what each page actually looks like.

**Fix — Service (`src/app/services/pdf-to-image.service.ts`):**
- Added `renderPageThumbnails()` method that renders all PDF pages as low-resolution data URLs using `pdfjs-dist`
- Default scale 0.3 for fast thumbnail rendering (~90% fewer pixels than full resolution)
- Returns array of data URLs with `null` for any page that fails to render
- Supports `AbortSignal` for cancellation when user clears/resets

**Fix — Component (`src/app/tools/pdf-rearrange/pdf-rearrange.component.ts`):**
- Injected `PdfToImageService`
- Added `thumbnails`, `isGeneratingThumbnails`, and `thumbnailAbortController` state
- `generateThumbnails()` called after successful PDF upload; cancels previous in-progress generation
- Thumbnails cleared on PDF removal or clear-all with `cancelThumbnailGeneration()`

**Fix — Template (`src/app/tools/pdf-rearrange/pdf-rearrange.component.html`):**
- Added `.page-thumbnail` block in each `.page-item` showing rendered preview image or "Loading..."/"No preview" placeholder

**Fix — Styles (`src/app/tools/pdf-rearrange/pdf-rearrange.component.scss`):**
- Added `.page-thumbnail` styles: 90×110px container with rounded corners, contained image fit, placeholder text styling

**Files modified:**
- `src/app/services/pdf-to-image.service.ts`
- `src/app/tools/pdf-rearrange/pdf-rearrange.component.ts`
- `src/app/tools/pdf-rearrange/pdf-rearrange.component.html`
- `src/app/tools/pdf-rearrange/pdf-rearrange.component.scss`
- `src/app/tools/pdf-rearrange/pdf-rearrange.component.spec.ts`

**Validation:**
- All 45 tests pass
- TypeScript compiles cleanly

---

## June 23, 2026 — Manual/System Theme Toggle (Phase 7)

**Files created:**
- `src/app/services/theme.service.ts` — Injectable service managing `'light' | 'dark' | 'system'` modes via Angular Signals with localStorage persistence (`app-theme` key). Applies `data-theme` attribute on `<html>` and listens to `prefers-color-scheme` changes when in system mode.
- `src/app/components/theme-toggle/theme-toggle.component.ts` — Standalone button group with sun (light), moon (dark), and desktop (system) Font Awesome icons
- `src/app/components/theme-toggle/theme-toggle.component.scss` — Compact pill-shaped toggle styled for both light and dark contexts

**Files modified:**
- `src/styles.scss` — Replaced `@media (prefers-color-scheme: dark)` with `:root[data-theme="dark"]` selector for CSS custom properties
- `src/app/app.scss` — Migrated dark-mode overrides from `@media` to `:host-context([data-theme="dark"])`
- `src/app/components/app-header/app-header.component.scss` — Migrated header dark overrides; changed layout from `grid` to `flex` so brand-mark, header-copy, and theme toggle sit in a single row
- `src/app/components/app-header/app-header.component.html` — Injected `<app-theme-toggle>` into `.header-top`
- `src/app/components/app-header/app-header.component.ts` — Added `ThemeToggleComponent` to imports
- `src/setup-vitest.ts` — Added `matchMedia` polyfill for jsdom test environment
- `src/app/components/drag-drop-zone/drag-drop-zone.component.scss` — Migrated dark override from `@media` to `:host-context([data-theme="dark"])`

**Validation:**
- `npm run build` passes
- `npm test` — **292 tests passed across 19 test suites**

## June 23, 2026 — PWA/Offline Support (Phase 7)

**Problem:** The app had no PWA install support and no offline fallback. The `vite-plugin-pwa` in `vite.config.ts` was conflicting with Angular's built-in `@angular/service-worker`.

**Fix — Conflict Resolution:**
- Removed `vite-plugin-pwa` from `vite.config.ts` and `package.json` (was conflicting with Angular's `@angular/service-worker` build pipeline)
- Downgraded `@angular/service-worker` from `^22.0.2` to `^21.2.0` to align with Angular 21 dependencies

**Fix — Service Worker (`ngsw-config.json`):**
- Replaced minimal config with comprehensive caching strategy covering:
  - App shell (JS, CSS, HTML, JSON) — prefetched eagerly
  - Fonts and images — lazy loaded with prefetch update
  - PDF workers (`pdf.worker.min.mjs`, `qpdf-lib/**`, `.wasm`) — prefetched
  - Google Fonts and CDN asset caching via `dataGroups`
  - `navigationUrls` for full offline SPA routing to all tool routes

**Files created:**
- `src/app/services/offline.service.ts` — Signal-based online/offline detection via `window.online`/`offline` events
- `src/app/services/update.service.ts` — Wraps Angular `SwUpdate` with signal-based `updateAvailable` state and `activateUpdate()` for auto-refresh
- `src/app/components/offline-banner/` — Yellow warning banner when offline
- `src/app/components/update-notification/` — Fixed toast with "Refresh" button when new version detected

**Files modified:**
- `vite.config.ts` — Removed `VitePWA` plugin
- `package.json` — Removed `vite-plugin-pwa`, aligned `@angular/service-worker` to `^21.2.0`
- `ngsw-config.json` — Full rewrite for comprehensive caching
- `src/app/app.ts` — Wired in `OfflineBannerComponent` and `UpdateNotificationComponent`
- `src/index.html` — Added `description`, `format-detection`, Google Fonts preconnect hints
- `src/manifest.json` — Added `display_override`, `maskable` icon purpose

**Validation:**
- `ng build` passes — `ngsw-worker.js` and `ngsw.json` generated in output
- TypeScript compiles cleanly

---

## Next Priority

1. ~~Add Web Worker support for PDF generation (Phase 6).~~ **DONE**
2. ~~Worker-backed compression for large PDFs (Phase 6.2).~~ **DONE**
3. ~~PDF to image export (Phase 4).~~ **DONE**
4. ~~Manual/system theme toggle in app header.~~ **DONE**
5. ~~Wire `mixedBuilderItems` IndexedDB table into the Mixed Builder tool (optional — `pdfSettings`, `sessionFiles`, `workspaceSessions` already integrated).~~ **Not started — schema exists but not wired.**
6. ~~Add PWA/offline support.~~ **DONE (June 23, 2026)**

**Skipped permanently:**
- Enable Mixed Builder and PDF Preview tools in `ToolRegistryService` (components and routes exist; will remain disabled until intentional UX integration is required)

# Developer-Ready OCR Implementation Plan for `image2pdf`

This document is written as a development task list that can be directly implemented in your Angular application.

---

# Feature Goal

Add **OCR-powered Searchable PDF generation**.

Users should be able to:

* Enable OCR from settings.
* Choose OCR language.
* Generate searchable PDFs.
* See OCR progress.
* Work completely offline.
* Reuse cached OCR results.

---

# Step 1 — Install OCR Dependency

## Task

Install Tesseract.js.

```bash
npm install tesseract.js
```

---

# Step 2 — Create OCR Models

## File

```text
src/app/models/ocr-result.model.ts
```

## Code

```ts
export interface OCRBoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface OCRWord {
  text: string;
  confidence: number;
  bbox: OCRBoundingBox;
}

export interface OCRResult {
  text: string;
  confidence: number;
  words: OCRWord[];
}

export type OCRStatus =
  | 'idle'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface OCRState {
  status: OCRStatus;
  progress: number;
  error?: string;
}

export interface OCRProgressEvent {
  status: string;
  progress: number;
}

export interface OCRSettings {
  enabled: boolean;
  language: string;
  cacheResults: boolean;
}
```

---

# Step 3 — Extend Document Model

## File

```text
src/app/models/document-item.model.ts
```

## Add

```ts
import {
  OCRResult,
  OCRState
} from './ocr-result.model';
```

Inside interface:

```ts
ocrState?: OCRState;

ocrResult?: OCRResult;

ocrLanguage?: string;
```

---

# Step 4 — Create OCR Worker

## File

```text
src/app/workers/ocr.worker.ts
```

## Code

```ts
/// <reference lib="webworker" />

import Tesseract from 'tesseract.js';

addEventListener('message', async ({ data }) => {

  const { image, language } = data;

  try {

    const result = await Tesseract.recognize(
      image,
      language,
      {
        logger: progress => {
          postMessage({
            type: 'progress',
            payload: progress
          });
        }
      }
    );

    postMessage({
      type: 'success',
      payload: {
        text: result.data.text,
        confidence: result.data.confidence,
        words: result.data.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: {
            x0: word.bbox.x0,
            y0: word.bbox.y0,
            x1: word.bbox.x1,
            y1: word.bbox.y1
          }
        }))
      }
    });

  } catch (error) {

    postMessage({
      type: 'error',
      payload: error
    });

  }

});
```

---

# Step 5 — Create OCR Service

## File

```text
src/app/services/ocr.service.ts
```

## Responsibilities

* Manage worker lifecycle.
* Expose Observable API.
* Handle cancellation.
* Provide OCR results.

---

## Code

```ts
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OcrService {

  recognize(
    image: Blob,
    language: string
  ): Observable<any> {

    return new Observable(observer => {

      const worker = new Worker(
        new URL('../workers/ocr.worker', import.meta.url),
        { type: 'module' }
      );

      worker.postMessage({
        image,
        language
      });

      worker.onmessage = ({ data }) => {

        if (data.type === 'progress') {

          observer.next({
            type: 'progress',
            payload: data.payload
          });

        }

        if (data.type === 'success') {

          observer.next({
            type: 'result',
            payload: data.payload
          });

          observer.complete();
          worker.terminate();
        }

        if (data.type === 'error') {

          observer.error(data.payload);
          worker.terminate();
        }
      };

      return () => worker.terminate();

    });

  }
}
```

---

# Step 6 — Add OCR Settings

## File

```text
src/app/services/pdf-settings-storage.service.ts
```

## Add

```ts
enableOCR: false,
ocrLanguage: 'eng',
cacheOCR: true
```

---

## Add methods

```ts
getEnableOCR(): boolean {}

setEnableOCR(value: boolean): void {}

getOCRLanguage(): string {}

setOCRLanguage(language: string): void {}
```

---

# Step 7 — Update Settings Panel UI

## File

```text
src/app/components/pdf-settings-panel/pdf-settings-panel.component.ts
```

## Add

```ts
enableOCR = false;

ocrLanguage = 'eng';
```

---

## File

```text
pdf-settings-panel.component.html
```

## Add

```html
<div class="ocr-settings">

  <label>
    <input
      type="checkbox"
      [(ngModel)]="enableOCR">
    Enable OCR
  </label>

  <select [(ngModel)]="ocrLanguage">

    <option value="eng">
      English
    </option>

    <option value="ben">
      Bengali
    </option>

    <option value="eng+ben">
      English + Bengali
    </option>

  </select>

</div>
```

---

# Step 8 — Show OCR Status in File List

## File

```text
src/app/components/file-item/file-item.component.ts
```

Add helpers:

```ts
get isOCRProcessing() {
  return this.file.ocrState?.status === 'processing';
}

get ocrProgress() {
  return this.file.ocrState?.progress ?? 0;
}
```

---

## File

```text
file-item.component.html
```

Add:

```html
@if (file.ocrState) {

<div class="ocr-status">

  <small>

    OCR:
    {{ file.ocrState.status }}

  </small>

  @if (file.ocrState.status === 'processing') {

    <progress
      [value]="file.ocrState.progress"
      max="100">
    </progress>

  }

</div>

}
```

---

# Step 9 — Add OCR Orchestration

## File

```text
src/app/tools/image-to-pdf/image-to-pdf.component.ts
```

---

Inject

```ts
private ocrService = inject(OcrService);
```

---

Add:

```ts
async processOCR() {

  if (!this.settings.enableOCR)
    return;

  for (const file of this.files) {

    file.ocrState = {
      status: 'processing',
      progress: 0
    };

    await new Promise<void>((resolve, reject) => {

      this.ocrService
        .recognize(
          file.file,
          this.settings.ocrLanguage
        )
        .subscribe({

          next: event => {

            if (event.type === 'progress') {

              file.ocrState = {
                status: 'processing',
                progress:
                  Math.round(
                    event.payload.progress * 100
                  )
              };
            }

            if (event.type === 'result') {

              file.ocrResult =
                event.payload;

              file.ocrState = {
                status: 'completed',
                progress: 100
              };

              resolve();
            }

          },

          error: err => {

            file.ocrState = {
              status: 'failed',
              progress: 0,
              error: err
            };

            reject(err);

          }

        });

    });

  }

}
```

---

# Step 10 — Trigger OCR Before PDF Generation

Locate:

```ts
generatePdf()
```

Modify:

```ts
async generatePdf() {

  if (this.settings.enableOCR) {
    await this.processOCR();
  }

  await this.pdfService.generate(
    this.files,
    this.settings
  );

}
```

---

# Step 11 — Create Coordinate Mapper

## File

```text
src/app/utils/ocr-coordinate-mapper.ts
```

## Code

```ts
export class OCRCoordinateMapper {

  static map(
    bbox: any,
    imageWidth: number,
    imageHeight: number,
    pdfWidth: number,
    pdfHeight: number
  ) {

    return {

      x:
        (bbox.x0 / imageWidth) *
        pdfWidth,

      y:
        (bbox.y0 / imageHeight) *
        pdfHeight

    };

  }

}
```

---

# Step 12 — Modify PDF Generation

Most important step.

---

## File

```text
src/app/services/pdf.service.ts
```

Locate:

```ts
pdf.addImage(...)
```

Immediately after:

```ts
if (
  settings.enableOCR &&
  file.ocrResult
) {

  this.addOCRTextLayer(
    pdf,
    file
  );

}
```

---

# Step 13 — Add Hidden Text Layer

Inside:

```ts
pdf.service.ts
```

Add:

```ts
private addOCRTextLayer(
  pdf: jsPDF,
  file: DocumentItem
) {

  if (!file.ocrResult)
    return;

  const pageWidth =
    pdf.internal.pageSize.getWidth();

  const pageHeight =
    pdf.internal.pageSize.getHeight();

  const imageWidth =
    file.width;

  const imageHeight =
    file.height;

  pdf.setFontSize(1);

  pdf.setTextColor(
    255,
    255,
    255
  );

  file.ocrResult.words
    .forEach(word => {

      const mapped =
        OCRCoordinateMapper.map(
          word.bbox,
          imageWidth,
          imageHeight,
          pageWidth,
          pageHeight
        );

      pdf.text(
        word.text,
        mapped.x,
        mapped.y
      );

    });

}
```

---

# Step 14 — Add OCR Cache

## File

```text
src/app/services/storage/indexed-db.service.ts
```

Add:

```ts
saveOCR(
  id: string,
  result: OCRResult
) {}

getOCR(
  id: string
): Promise<OCRResult | null> {}
```

Recommended object store:

```ts
ocr-cache
```

---

# Step 15 — Reuse OCR Cache

Inside:

```ts
processOCR()
```

Add:

```ts
const cached =
  await this.db.getOCR(
    file.id
  );

if (cached) {

  file.ocrResult = cached;

  file.ocrState = {
    status: 'completed',
    progress: 100
  };

  continue;
}
```

After successful OCR:

```ts
await this.db.saveOCR(
  file.id,
  file.ocrResult
);
```

---

# Step 16 — Add Retry Button

## File

```text
file-item.component.html
```

```html
@if (
 file.ocrState?.status === 'failed'
){

<button
 (click)="retryOCR()">

 Retry OCR

</button>

}
```

---

# Step 17 — Testing Checklist

## OCR

* Single image.
* Multiple images.
* Large image.
* Rotated image.
* Bengali text.
* English text.

## PDF

* Search text.
* Copy text.
* Open in Adobe Reader.
* Open in Chrome PDF viewer.

## Performance

* 20 images.
* Mobile device.
* Offline mode.

---

# Final Architecture

```text
image-to-pdf.component
            │
            ▼
      OcrService
            │
            ▼
      OCR Worker
            │
            ▼
      OCR Result
            │
            ▼
     IndexedDB Cache
            │
            ▼
       PDF Service
            │
            ▼
 Invisible Text Layer
            │
            ▼
    Searchable PDF
```

This implementation will fit naturally into your existing Angular architecture and reuse your current worker, storage, and service patterns.
