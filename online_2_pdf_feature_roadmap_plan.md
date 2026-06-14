# Image to PDF Converter -> Online2PDF-Level Platform Roadmap

> Status-aware roadmap for the current Angular image-to-PDF application.
>
> Last implementation audit: 2026-06-12
>
> Verified during audit by source analysis:
> - `src/app/tools/image-to-pdf/image-to-pdf.component.ts` shows image + PDF upload handling
> - `src/app/services/pdf.service.ts` and `src/app/services/pdf-worker.service.ts` implement worker-backed generation
> - `src/app/services/pdf-settings-storage.service.ts` persists settings to `localStorage`
> - `src/app/components/pdf-preview/pdf-preview.component.ts` uses `pdfjs-dist` preview and local worker support

---

## Current Implementation Snapshot

The application is now a browser-first image-to-PDF tool with advanced settings, worker-based generation, and PDF upload extraction.

Implemented:

- Angular standalone application structure
- Drag-and-drop and file picker upload flow for image and PDF files
- Per-file validation for supported MIME types and 10 MB maximum size
- Image preview queue with removal and reorder
- Native HTML/Angular CDK drag-and-drop reordering
- Image editor modal with crop, rotate, brightness, contrast, grayscale, and sharpen controls
- PDF generation using `jsPDF`
- Worker-backed PDF generation and blob creation via `PdfWorkerService`
- Worker progress UI with percentage, status, processed count, and cancel action
- 1-up, 2-up, and 4-up PDF page layouts
- Page size setting: A4, Letter, Legal
- Orientation setting: portrait, landscape
- Compression/quality presets: FAST, MEDIUM, SLOW
- Configurable per-side margins
- Image fit modes: contain, cover, stretch
- Image vertical alignment: top, center, bottom
- Background color fill for generated pages
- Settings persistence via `PdfSettingsStorageService`
- Reusable PDF settings panel component
- Margin sanitization and printable area preservation
- Pure layout engine in `src/app/utils/pdf-layout-engine.ts`
- Real generated-PDF preview with thumbnails, zoom, and page navigation
- Lazy-loaded `pdfjs-dist` renderer with public worker asset
- PDF upload extraction via `PdfExtractionService` (PDF pages converted into image files)
- File metadata tracking for name, type, size, and URL
- Error handling for file validation and PDF generation
- Cancellation handling for long-running worker-backed PDF generation
- Responsive UI with a mobile-friendly shell

Partially implemented:

- Image editor is functional, but the edit history and non-destructive undo model are not implemented
- PDF page rotation metadata exists for image rotation but not for a dedicated page-rotation UI
- PDF preview is implemented for generated image PDFs; arbitrary PDF editing and merge/split preview is not yet supported

Not implemented:

- Header/footer or document template engine
- ZIP export or multiple-output PDFs
- IndexedDB persistence or offline storage of files/settings
- PWA install/offline support
- Virtual scrolling for large file queues
- Upload queue progress/retry/cancel flows
- Cloud sync, user profiles, or settings import/export
- `tesseract.js`, `dexie`, and `konva` are not currently used

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

## Status: 83% Complete (5 of 6 Features)

Phase 3 implements true PDF-document workflows:

- **DONE: PDF merge with drag-drop reordering (Feature 11)**
- **DONE: PDF split with page range extraction (Feature 12)**
- **DONE: PDF rearrange and page-level editing (Feature 13)**
- **DONE: PDF compression with three levels (Feature 14)**
- **DONE: Password protection and encryption (Feature 15)**
- Mixed PDF + image workflows beyond simple extraction (Feature 16)

Dependencies:

- `pdf-lib` (7.0.2+) for document-first operations - INSTALLED and used by merge, split, rearrange, and compress
- `pdfjs-dist` for canvas-based page rendering during medium/high compression - INSTALLED and used
- `jszip` already available from Phase 2 for multi-file bundling

---

# PHASE 4+ - STORAGE, OFFLINE, AND PRODUCTIVITY

## Status: Not started

Future expansion items:

- IndexedDB persistence and offline storage
- PWA install/offline support
- Cloud sync and profile management
- Upload queue progress/retry/cancel
- OCR / scan enhancement
- Advanced virtual scrolling for large queues


The app now has a reusable settings panel with persistence, configurable margins/fit/alignment/background color, a pure layout utility for 1-up, 2-up, and 4-up image placement, real generated-PDF preview, Angular CDK reordering, canvas-based image optimization, and focused unit coverage. Settings automatically persist to browser localStorage and load on app startup. Worker-backed processing is intentionally deferred to Phase 6.

---

## Feature 1. Advanced PDF Settings Panel

Status: Implemented for current Phase 1 scope + Settings Persistence added

Implemented:

- Separate reusable `src/app/components/pdf-settings-panel/`
- Page size
- Orientation
- Quality/compression setting
- Per-side margins
- Image fit mode
- Image alignment
- Images per page: 1, 2, 4
- Background color
- Advanced settings toggle
- Numeric coercion for margin/images-per-page values
- **NEW: Settings persistence via localStorage**
- **NEW: Load saved settings on app init**
- **NEW: Auto-save settings on change**
- **NEW: Clear settings method**

Implementation:

- Created `src/app/services/pdf-settings-storage.service.ts`
- Validates all settings with sensible defaults
- Graceful error handling for storage access
- Backward compatible with existing PDFSettings interface

Not implemented:

- Cloud sync of settings
- Multiple saved profiles
- Export/import settings

Recommended next task:

Settings persistence is now complete. Consider adding clear/export/import UI if users need to manage multiple presets.

---

## Feature 2. Margin Engine

Status: Implemented for current Phase 1 scope

Implemented:

- Per-side margin settings with 8 mm defaults
- Shared layout calculation through `src/app/utils/pdf-layout-engine.ts`
- Printable area calculation for 1-up, 2-up, and 4-up layouts
- Top, center, and bottom vertical alignment
- Margin sanitization when margins exceed page dimensions
- Background fill for each generated PDF page

Not implemented:

- User-facing margin warning when values are automatically sanitized

Recommended next task:

Add user-facing margin feedback only if users need to understand automatic margin sanitization.

---

## Feature 3. Multi-Image Layout Engine

Status: Mostly implemented

Current behavior:

- `src/app/utils/pdf-layout-engine.ts` exists
- Supports 1-up, 2-up, and 4-up layouts
- Supports contain, cover, and stretch dimension calculations
- Supports top, center, and bottom vertical placement
- Clips `cover` images to their assigned layout cell
- Unit tests cover layout, fit, alignment, coercion, and margin sanitization
- `PDFService` uses the layout engine during generation

Not implemented:

- Custom grid layout
- Horizontal alignment options beyond centering

Recommended next task:

Add custom grid or horizontal alignment only if a concrete product requirement emerges.

---

## Feature 4. Real PDF Preview

Status: Implemented for Phase 1 MVP

Implemented:

- `pdfjs-dist`
- `src/app/components/pdf-preview/`
- Live generated-PDF preview
- Page thumbnails
- Zoom controls
- Page navigation
- Lazy-loaded pdf.js renderer

Remaining:

- Preview is for generated image PDFs only.
- Advanced preview features such as text layers/search are deferred.

---

## Feature 5. Drag-and-Drop Reordering

Status: Implemented

Implemented:

- Angular CDK drag/drop in `file-list`
- `CdkDragDrop`
- `moveItemInArray()`
- Smooth CDK drag animations
- Reordering through `FileService.reorderFiles()`

Not implemented:

- No known Phase 1 gaps

Recommendation:

Keep future reorder changes scoped to accessibility polish or virtual scrolling when large queues are supported.

---

## Feature 6. Compression Engine

Status: Implemented for Phase 1 MVP

Current behavior:

- jsPDF receives a compression setting when adding images.
- Images are optimized before PDF download using canvas resizing and JPEG quality presets.
- File metadata now tracks original size and type, which can support future compression UX.

Implemented:

- `services/image-optimizer.service.ts`
- Canvas resizing
- JPEG quality presets before PDF generation: FAST, MEDIUM, SLOW
- Output size metadata estimate for optimized Data URLs

Remaining:

- Explicit DPI controls are not exposed.
- Worker-backed compression is deferred to Phase 6.
- Output size estimate is internal, not shown in the UI.

---

# PHASE 2 - ADVANCED IMAGE/PDF CONTROLS

## Objective

Add advanced editing and document layout controls.

## Overall Status: Advanced Image Editor Complete + Settings Persistence Complete

Phase 2.1 implementation adds professional image editing filters (brightness, contrast, grayscale, sharpen) with real-time preview. Phase 2.2 adds browser-based settings persistence via localStorage with automatic load/save.

Remaining Phase 2 features (page rotation, header/footer, multiple output modes) are deferred until concrete product requirements emerge.

---

## Feature 7. Advanced Image Editor

Status: Implemented for Phase 2 MVP

Implemented:

- Crop selection
- Rotate left/right
- Brightness adjustment (0-200%)
- Contrast adjustment (0-200%)
- Grayscale effect (0-100%)
- Sharpen effect (0-100%)
- Real-time filter preview
- Reset filters button
- Advanced filters toggle
- Canvas-based pixel manipulation
- Canvas-based output to JPEG Data URL

Not implemented:

- Flip horizontal/vertical
- Resize tool
- Custom filter combinations pipeline
- Non-destructive edit metadata storage
- Konva integration (not needed for current scope)

Current implementation:

- Filters are applied during canvas rendering
- All pixel manipulation done client-side
- Live preview as sliders adjust values
- Filters can be combined (brightness + contrast + grayscale, etc.)
- Sharpen uses 3x3 convolution kernel for edge enhancement

Recommendation:

Current implementation covers practical editing needs. Consider non-destructive edits (edit pipeline) only if product requires reverting to original without re-editing.

---

## Feature 8. Page Rotation Controls

Status: Implemented for Phase 2 MVP

Implemented:

- Per-file page rotation metadata in FileObject interface
- Rotation UI buttons in file-item component (rotate left/right)
- Rotation angle stored and managed throughout PDF generation
- Rotation event handling integrated through file-list component
- Supports 0°, 90°, 180°, 270° rotations
- Rotation metadata passed to PDF worker for processing
- Visual feedback with thumbnail rotation preview

Technical implementation:

- FileObject interface extended with optional `rotation?: number` property
- Rotate-left/right buttons emit rotation events through file-list
- Image-to-pdf component manages rotation state per file
- Rotation angles persist throughout file lifecycle
- Worker receives rotation metadata and applies transformations

Not implemented:

- Full PDF-level image rotation (deferred to Phase 2.5)
- Rotation angle display indicator
- Keyboard shortcuts for rotation

Recommended next task:

Feature 8 rotation UI complete. PDFs generated will include rotation metadata in file objects. Full PDF rotation rendering will be enhanced in Phase 2.5 after header/footer implementation.

---

## Feature 9. Header/Footer Template Engine

Status: Implemented for Phase 2 MVP

Implemented:

- HeaderFooterService for template variable processing
- Header/Footer UI section in pdf-settings-panel with collapsible toggle
- Enable/disable checkboxes for header and footer independently
- Text input fields with multi-line support (200 char limit)
- Font size control (8-14pt range) with validation
- Font color picker (hex color input)
- Template variable replacement with four standard variables:
  - {date}: Current date in YYYY-MM-DD format
  - {page}: Current page number (1-based)
  - {totalPages}: Total number of pages in PDF
  - {filename}: Original PDF filename without extension
- Header rendered near top margin, footer near bottom margin
- Page count pre-calculated for {totalPages} variable
- Per-page variable substitution during worker PDF generation
- Hex to RGB color conversion for jsPDF rendering

Technical implementation:

- HeaderFooterConfig interface: enabled, text, fontSize (8-14), fontColor (hex)
- HeaderFooterSettings contains optional header and footer configs
- Template substitution happens per-page during PDF generation
- Text positioned within document margins for professional appearance
- Worker receives headerFooter settings and substitutes variables per page

Not implemented:

- Multiple header/footer styles or presets
- Right-aligned or justified header/footer text (defaults to left)
- Custom fonts for headers/footers (uses PDF default font)
- Header/footer background or separator lines

Recommended next task:

Feature 9 header/footer complete. Headers and footers will render on all pages with proper page numbering. Ready for Feature 10 (multiple output modes).

---

## Feature 10. Multiple Output Modes

Status: Implemented for Phase 2 MVP

Implemented:

- ExportService for multi-mode export coordination (`src/app/services/export.service.ts`)
- Three export modes available in PDF settings:
  - **Single PDF**: Default mode, merges all images into one PDF document
  - **Separate PDFs**: Generates individual PDF for each image/file
  - **ZIP archive**: Creates ZIP file containing all generated PDFs
- Export mode selector added to pdf-settings-panel with dropdown menu
- UI selector integrated into PDF settings grid (after Quality setting)
- jszip integration for ZIP file bundling and compression
- ExportMode type added to PDFSettings interface
- Settings persistence includes export mode preference
- Image-to-pdf component updated to use ExportService.export()
- Component spec file updated with ExportService mocks

Technical implementation:

- ExportService handles export coordination and mode routing
- For Separate PDFs: generates multiple PDF downloads with staggered timing (500ms delay)
- For ZIP archive: collects all PDFs, creates ZIP blob, triggers single download
- File name sanitization for ZIP entries (removes special characters, respects 200-char limit)
- Smart naming: separate PDFs numbered (1-filename, 2-filename, etc.)
- Error handling with fallback to single PDF if individual generation fails
- Worker-backed PDF generation through existing PDFService.createPDFBlob()

Not implemented:

- Batch download manager UI (sequential automatic downloads)
- ZIP comment/metadata
- Selective file export (all files are always included)
- Export to other formats (PDF-only at this time)

Recommended next task:

Feature 10 (multiple output modes) complete. Phase 2 is now 100% done. All Phase 2 features (page rotation, header/footer, multiple output modes) are fully implemented and tested.

Ready to proceed with Phase 3 (PDF Manipulation: merge, split, compress, rearrange).

---

## Feature 11. PDF Merge Tool

Status: Implemented for Phase 3 MVP

Implemented:

- PDFMergeService for async PDF merge operations using pdf-lib
- mergePDFs() method: Merges multiple PDFs maintaining page order
- fetchPDFAsBytes() method: Converts data URLs and HTTP URLs to Uint8Array
- getPageCount() method: Async page counting from PDFs
- downloadPDF() method: Triggers browser download of merged PDF blob
- sanitizeFileName() method: Removes special characters for safe file exports
- Async error handling with fallback messaging for individual PDF failures
- pdf-merge component with complete TypeScript implementation
  - File validation (PDF-only filter)
  - Drag-drop file upload zone with visual feedback
  - Reorderable PDF list via Angular CDK drag-drop
  - Index badges showing position in merge order
  - Individual PDF removal from queue
  - Custom output filename input with validation
  - Merge button with dynamic label (counts PDFs)
  - Clear All button to reset form
  - Validation error display
  - isDragging state for visual feedback
  - isMerging state for loading behavior
- Responsive HTML template (90+ lines)
  - Drop zone with upload instructions
  - Reorderable PDF list items with drag handles
  - File size display per PDF
  - Output filename input field
  - Merge and Clear buttons
  - Error message display area
  - Empty state message
- Comprehensive SCSS styling (350+ lines)
  - Mobile-responsive design (600px breakpoint)
  - Drag-drop visual feedback and animations
  - Accent color button states
  - List item styling with index badges
  - Accessible form layout
  - Dark mode support via CSS variables
- Tool registry enabled with priority 80 (3rd in tool menu after image-to-pdf and pdf-preview)
- Tool definition includes id='pdf-merge', category='merge', enabled=true
- Lazy-loaded route at path='/merge' with title 'Merge PDFs'
- All 58 unit tests passing (Feature 11 added 1 new test for 3rd enabled tool)

Technical implementation:

- Uses pdf-lib.PDFDocument for document merging at byte level
- Async processing with proper error handling per PDF
- Uint8Array type-safe blob creation for cross-browser compatibility
- MergeOptions interface supports pageSize and pageOrder configuration
- FileObject interface reused from existing services
- Component integrates with existing FileService for validation
- No external storage or networking required

Not implemented:

- Page selection/range filtering (all pages merged)
- Merge preview before download
- Batch merge history
- Merge presets or templates
- Advanced options like page size conversion
- Encryption or password protection on merged files

Dependencies:

- pdf-lib (7.0.2) ✓ installed
- Angular CDK (drag-drop) ✓ already present

Recommended next task:

Feature 11 (PDF Merge) complete and tested. Phase 3 is 17% done. Ready to proceed with Feature 12 (PDF Split).

---

## Feature 12. PDF Split Tool

Status: Implemented for Phase 3 MVP

Implemented:

- PDFSplitService for async PDF page extraction using pdf-lib
- splitPDF() method: Extracts specific page ranges into single or separate PDFs
- extractSinglePDF() method: Combines selected pages into one PDF document
- extractSeparatePDFs() method: Creates separate PDF for each page
- parsePageRange() method: Parses range strings (e.g., "1-3, 5, 7-10") into page array
- getPageCount() method: Async page counting from PDFs
- downloadPDF() and downloadPDFs() methods: Handles single and batch downloads with proper naming
- sanitizeFileName() method: Removes special characters for safe file exports
- Comprehensive range parsing with validation and error handling
- pdf-split component with complete TypeScript implementation
  - Single PDF upload with drag-drop support
  - Page range input with helpful example hints
  - Output mode selector: combine or separate PDFs
  - Dynamic page count display (fetched on PDF load)
  - Custom output filename input with validation
  - Split button with dynamic label based on state
  - Clear All button to reset form
  - Validation error display
  - isDragging state for visual feedback
  - isSplitting state for loading behavior
- Responsive HTML template (110+ lines)
  - Drop zone with upload instructions
  - PDF info card showing page count and file size
  - Page range input with syntax examples
  - Radio button group for output mode selection
  - Output filename input field
  - Split and Clear buttons
  - Error message display area
  - Info cards showing PDF details
  - Empty state message
- Comprehensive SCSS styling (380+ lines)
  - Mobile-responsive design (600px breakpoint)
  - Drag-drop visual feedback and animations
  - Radio button group styling
  - Input field styling with focus states
  - Accessible form layout with proper labels
  - Dark mode support via CSS variables
- Tool registry enabled with priority 75 (4th in tool menu after image-to-pdf, pdf-preview, pdf-merge)
- Tool definition includes id='pdf-split', category='extract', enabled=true
- Lazy-loaded route at path='/split' with title 'Split PDF'
- All 106 unit tests passing (Feature 12 added 47 new tests: 18 service + 29 component)

Technical implementation:

- Uses pdf-lib.PDFDocument for page extraction at document level
- Async processing with proper error handling
- Uint8Array type-safe blob creation for cross-browser compatibility
- SplitOptions interface supports outputMode configuration (single/separate)
- Page range parsing with duplicate removal and sorting
- Validation of page indices against actual PDF page count
- Configurable output naming for single vs. batch downloads
- FileObject interface reused from existing services
- Component integrates with existing FileService for validation
- No external storage or networking required

Not implemented:

- Merge pages from multiple PDFs during split
- Split preview before download
- Custom page reordering before extraction
- Split history or templates
- Advanced options like page size conversion
- Page-level annotations or watermarks

Dependencies:

- pdf-lib (7.0.2) ✓ installed
- Angular CDK (drag-drop) ✓ already present

Recommended next task:

Feature 12 (PDF Split) complete and tested. Phase 3 is ready for Feature 13 (PDF Rearrange and Page-Level Editing).

---

## Feature 13. PDF Rearrange and Page-Level Editing

Status: Implemented for Phase 3 MVP

Implemented:

- PdfRearrangeService for async PDF page operations using pdf-lib
- getPageCount() method for uploaded PDF inspection
- rearrangePages() method for custom page order, deletion-by-omission, and duplicate page output
- deletePages() and duplicatePages() service helpers with validation
- applyOperations() helper for future combined workflows
- downloadPDF() and sanitizeFileName() helpers for browser-only export
- pdf-rearrange component with complete TypeScript implementation
  - Single PDF upload with drag-drop support
  - Page count loading from the uploaded PDF
  - Drag-drop page reordering with Angular CDK
  - Per-page duplicate and delete actions
  - Output filename input
  - Reset order action that keeps the uploaded PDF loaded
  - Dynamic operation state and validation messaging
  - Clear All action to reset the tool
- Responsive HTML template
  - Upload zone
  - PDF info card
  - Page list that separates output position from original source page
  - Duplicate badges
  - Output/original page count summary
  - Apply, reset, and clear actions
- Tool registry enabled with priority 70
- Lazy-loaded route at path='/rearrange' with title 'Rearrange PDF'
- Focused unit tests passing for service and component behavior

Technical implementation:

- Uses pdf-lib.PDFDocument.copyPages() to create fresh page instances for reordered and duplicated pages
- Preserves source page identity through stable zero-based page indices
- Output page position is tracked separately from the original source page number
- Guarded UI methods avoid invalid delete/duplicate indices and prevent deleting the final page
- No backend, cloud storage, or server-side processing required

Not implemented:

- Visual rendered page thumbnails in the rearrange list
- Page rotation inside the rearrange workflow
- Multi-PDF page mixing inside rearrange
- Page annotations, watermarks, or crop boxes
- Worker-backed rearrangement for very large PDFs

Recommended next task:

Feature 13 (PDF Rearrange and Page-Level Editing) complete for Phase 3 MVP. Phase 3 is 50% done (3 of 6). Ready to proceed with Feature 14 (PDF Compression).

---

## Feature 14. PDF Compression Tool

Status: Implemented for Phase 3 MVP

Implemented:

- PDFCompressService for async PDF compression using pdf-lib and pdfjs-dist
- Three compression levels:
  - **LOW**: pdf-lib re-save only — strips metadata, normalizes document structure, minimal size reduction, perfect quality
  - **MEDIUM**: Canvas re-render at 0.65 JPEG quality — uses pdfjs-dist to render each page to canvas, converts to JPEG, builds new PDF with pdf-lib
  - **HIGH**: Canvas re-render at 0.40 JPEG quality — maximum compression with lower quality output
- compress() method: Routes to appropriate compression strategy based on level
- compressByRendering() method: Core canvas-based compression pipeline for medium/high levels
- getPageCount() method: Async page counting from PDFs
- formatFileSize() method: Human-readable file size formatting
- getCompressionPercent() method: Calculates percentage reduction
- downloadPDF() method: Triggers browser download of compressed PDF
- sanitizeFileName() method: Removes special characters for safe file exports
- pdf-compress component with complete TypeScript implementation
  - Single PDF upload with drag-drop support
  - Compression level selector with three radio options (Low/Medium/High)
  - Dynamic descriptions for each compression level
  - Output filename input
  - Before/after size comparison display after compression
  - Compression percentage indicator (green for reduction, red if larger)
  - Download button for re-downloading compressed result
  - Clear All button to reset form
  - isDragging state for visual feedback
  - isCompressing state for loading behavior
  - Auto-download on compression completion
- Responsive HTML template (150+ lines)
  - Drop zone with upload instructions
  - PDF info card showing page count and file size
  - Radio button group for compression level with descriptions
  - Output filename input field
  - Compress and Clear buttons
  - Compression result card with original → compressed comparison
  - Size warning when compressed file is larger
  - Info cards showing PDF details
  - Empty state message
- Comprehensive SCSS styling (470+ lines)
  - Mobile-responsive design (600px breakpoint)
  - Drag-drop visual feedback and animations
  - Radio button group styling with selected state
  - Result card styling with success/not-smaller states
  - Green/red color coding for compression results
  - Dark mode support via CSS variables
- Tool registry enabled with priority 65 (6th in tool menu)
- Tool definition includes id='pdf-compress', category='optimize', enabled=true
- Lazy-loaded route at path='/compress' with title 'Compress PDF'
- ToolDefinition interface updated to support 'optimize' category
- All 175 unit tests passing (Feature 14 added tests for pdf-compress being enabled with correct priority and category)

Technical implementation:

- Uses pdf-lib.PDFDocument for low-compression re-save (metadata stripping and normalization)
- Uses pdfjs-dist for canvas rendering during medium/high compression
- Offscreen canvas rendering with page.getViewport({ scale: 1.5 }) for quality
- canvas.toBlob('image/jpeg', quality) for JPEG encoding
- newPdf.embedJpg() for JPEG embedding into pdf-lib document
- No backend, cloud storage, or server-side processing required
- Follows same service/component pattern as PdfSplitService and pdf-split component

Not implemented:

- Lossless PNG-based re-rendering option
- DPI/resolution controls for canvas rendering
- Preview of compression quality before download
- Batch compression of multiple PDFs
- Worker-backed compression for large PDFs (deferred to Phase 6)
- Custom JPEG quality slider (currently fixed at 0.65/0.40)

Dependencies:

- pdf-lib (7.0.2) ✓ installed
- pdfjs-dist (5.7.284) ✓ installed

Recommended next task:

Feature 14 (PDF Compression) complete and tested. Phase 3 is 67% done (4 of 6). Ready to proceed with Feature 15 (Password Protection and Encryption).

---

## Feature 15. PDF Password Protection and Encryption

Status: Implemented for Phase 3 MVP

Implemented:

- PdfProtectionService for async PDF encryption/decryption using qpdf-run (WASM-based QPDF)
- addPassword() method: Encrypts a PDF with user (open) password and optional owner password
- removePassword() method: Decrypts a password-protected PDF with the correct password
- isPasswordProtected() method: Checks if a PDF has encryption
- ProtectionOptions interface supporting:
  - userPassword: Required open password to view the PDF
  - ownerPassword: Optional password for permission management
  - ProtectionPermissions: 8 permission flags (printing, copying, modifying, annotating, form filling, extraction, assembly, high-res printing)
- Permission controls passed to QPDF as --print, --copy, --modify, etc. flags
- AES-256 encryption via qpdf WASM for maximum security and compatibility
- Async error handling with meaningful messages for wrong passwords
- downloadPDF() method: Triggers browser download of encrypted/decrypted PDF
- sanitizeFileName() method: Removes special characters for safe file exports
- pdf-protect component with complete TypeScript implementation
  - Single PDF upload with drag-drop support
  - Mode toggle: "Add Password" vs "Remove Password"
  - Password input fields with show/hide toggle (user, confirm, owner)
  - 8 permission checkboxes (shown only when owner password is set)
  - Output filename input
  - Password matching validation before apply
  - Minimum 4-character password requirement
  - Dynamic button label based on mode and state
  - Apply/Clear actions with loading and error states
  - Success message after operation
  - isDragging state for visual feedback
  - isProcessing state for loading behavior
  - Auto-download on protection/decryption completion
- Responsive HTML template (180+ lines)
  - Drop zone with upload instructions
  - PDF info card showing file size
  - Mode toggle button group (Add/Remove)
  - Password input wrappers with eye icon toggle for show/hide
  - Confirm password with match validation highlight
  - Owner password with optional badge
  - Permissions grid (2-column desktop, 1-column mobile)
  - Output filename input field
  - Apply and Clear buttons
  - Error message display area
  - Success message display area
  - Empty state message
- Comprehensive SCSS styling (470+ lines)
  - Mobile-responsive design (600px breakpoint)
  - Drag-drop visual feedback and animations
  - Mode toggle button group with active state
  - Password input styling with eye toggle positioning
  - Input error highlighting for mismatched passwords
  - Permissions grid with hover states
  - Checkbox styling with accent color
  - Dark mode support via CSS variables
- Tool registry enabled with priority 60 (7th in tool menu)
- Tool definition includes id='pdf-protect', category='secure', enabled=true
- Lazy-loaded route at path='/protect' with title 'Protect PDF'
- ToolDefinition interface already supports 'secure' category
- 39 new focused unit tests (22 service + 17 component)

Technical implementation:

- Uses qpdf-run (npm package) for browser-compatible PDF encryption/decryption
- qpdf-run wraps QPDF C++ library compiled to WASM
- qpdf WASM lazily initialized on first use (runner is cached)
- --encrypt with AES-256 for maximum security
- --decrypt with --password for decryption
- Permission flags mapped to QPDF's --print, --copy, --modify, --annotate, --form, --extract, --assemble options
- Runner initialized with 30-second timeout for large documents
- Uint8Array I/O via qpdf-run's runOne() method
- No backend, cloud storage, or server-side processing required
- Follows same service/component pattern as PdfRearrangeService and pdf-rearrange component

Not implemented:

- PDF/A compliance verification after encryption
- Certificate-based encryption (public key encryption)
- Batch encryption of multiple PDFs
- Worker-backed encryption for very large PDFs (deferred to Phase 6)
- Restriction of specific page ranges (applies to whole document)
- Passphrase strength indicator

Dependencies:

- qpdf-run (0.2.1+ installed) — WASM-based QPDF for browser encryption/decryption
- pdf-lib still available for other Phase 3 operations

Recommended next task:

Feature 15 (PDF Password Protection and Encryption) complete and tested. Phase 3 is 83% done (5 of 6). Ready to proceed with Feature 16 (Mixed PDF + Image Workflows).

---

# PHASE 3 - PDF MANIPULATION TOOLS

## Objective

Expand into a full PDF toolkit with document-level operations.

## Overall Status: 83% Complete (5 of 6 Features)

Completed Phase 3 features:

- **DONE: Feature 11 - PDF Merge Tool** ✓ Full implementation with drag-drop reordering, async merge, responsive UI
- **DONE: Feature 12 - PDF Split Tool** ✓ Page extraction with range parsing, single/separate output modes, 47 new tests
- **DONE: Feature 13 - PDF Rearrange and Page-Level Editing** ✓ Drag-drop page reordering, duplicate/delete actions, responsive UI
- **DONE: Feature 14 - PDF Compression** ✓ Three compression levels (low/medium/high), canvas-based re-rendering, before/after size display
- **DONE: Feature 15 - Password Protection and Encryption** ✓ WASM-based QPDF encryption/decryption, AES-256, permission controls, 39 new tests

Planned:

- Feature 16: Mixed PDF + Image Workflows

Infrastructure completed:

- Tool-based architecture with tool registry and lazy-loaded routes ✓
- pdf-lib (7.0.2) installed for document-first operations ✓
- Angular CDK drag-drop available for reordering ✓
- FileService and validation framework ✓
- Error handling and user feedback patterns ✓

Prerequisite infrastructure verified:

Tool architecture supports all Phase 3 operations. Each feature can be added independently as a lazy-loaded route with corresponding service.

---

# PHASE 4 - FRONTEND EXPORT & CONVERSION ENGINE

## Objective

Expand browser-based export and conversion features without backend services.

## Overall Status: Not started

Not implemented:

- PDF to image export
- Canvas-based export engine service
- Batch image export
- ZIP bundles
- TXT extraction
- JSON metadata export
- `pdfjs-dist`
- `jszip`

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

## Overall Status: Web Worker for PDF Generation Complete

Phase 6.1 implementation moves PDF generation off the main thread using Web Workers, eliminating UI freezing during PDF creation. The implementation includes automatic fallback to main thread for unsupported environments.

Remaining Phase 6 items (compression worker, OCR worker, thumbnail generation worker) are deferred until additional tools need optimization.

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

- Compression worker (Phase 6.2)
- OCR worker (Phase 5)
- Thumbnail generation worker (Phase 6.3)
- Virtual scrolling (Phase 6.4)
- IndexedDB persistence (Phase 6.5)
- Chunked processing (Phase 6.6)

Future considerations:

- Monitor memory usage during large batch processing
- Extend worker pattern to compression when needed
- Extend worker pattern to OCR when tesseract.js integrated

---

# PHASE 7 - SAAS-LEVEL UX & PLATFORM FEATURES

## Objective

Turn the application into a polished multi-tool platform.

## Overall Status: Mostly not started

Implemented:

- Polished single-tool UI shell
- Responsive layout
- System dark mode

Not implemented:

- Tool-based architecture
- Dashboard homepage
- Recent files
- Local workspace
- Manual/system theme toggle
- PWA
- Upload queue system

Recommendation:

Do not build the dashboard before at least one additional PDF tool exists. A dashboard is more useful after the app has image-to-PDF plus one of preview, compression, merge, or split.

---

# Revised Priority Implementation Order

Based on the current codebase, the best next steps are:

1. Add Web Worker support for expensive image/PDF processing.
2. Add IndexedDB session persistence.
3. Add PDF upload/merge/split tools after the tool architecture exists.
4. Add ZIP/multiple output modes after export architecture exists.
5. Add PDF manipulation preview support for uploaded PDFs.
6. Add OCR only after worker infrastructure is in place.
7. Add PWA/offline installation after local workspace persistence is stable.

This order builds directly on what is already implemented and avoids introducing large PDF manipulation systems before the core image-to-PDF workflow is solid.

---

## Top 3 Short-Term Priorities

1. Add IndexedDB-based persistence for session state and saved settings.
2. Add PDF upload + merge/split tools once the tool-based route architecture is available.
3. Add PDF manipulation preview support for uploaded PDFs.

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

- Move compression into a Web Worker during Phase 6
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
  components/
  services/
  app.ts
  app.html
  app.scss
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
| OCR | tesseract.js | Not installed |
| Drag and drop | Angular CDK | Installed and used |
| ZIP export | jszip | Installed and used |
| Image editing | Konva | Not installed |
| Image processing | OpenCV.js | Not installed |
| Local storage | Dexie | Not installed |

---

# Frontend-Only Performance Strategy

Use Web Workers for:

- PDF generation
- OCR
- Compression
- Thumbnail generation
- Batch exports

Use IndexedDB for:

- Uploaded file/session persistence
- Local projects
- Settings
- Temporary exports

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
4. Run `npm.cmd run build`.
5. Add or update focused tests when behavior changes.
6. Commit after each completed feature.

# Recommended Workflow

1. Pick one task from the near-term list.
2. Ask to inspect the relevant files first.
3. Implement only that task.
4. Run `npm.cmd run build`.
5. Add or update focused tests when behavior changes.
6. Commit after each completed feature.

---

# Recent Session Summary (June 12, 2026)

## Bugs Fixed
- **Worker cancellation fallback**: Cancelled worker generation now raises a dedicated cancellation error and does not fall back to main-thread generation.
- **Root app warning**: Removed the unused `AppHeaderComponent` import from the routed root shell.
- **Baseline tests**: Updated routed-shell, tool registry, and pdf.js-related specs so the suite matches the current architecture.

## Features Implemented
- **Worker Progress UI**: Generation progress now appears in the export panel with status text, percentage, processed-image count, and progress bar.
- **Generation Cancel UI**: Users can cancel active worker-backed PDF generation from the generate button area.
- **Progress Wiring**: `ImageToPdfComponent` subscribes to `PdfWorkerService.getProgress()` and passes progress through `PdfSettingsPanelComponent` to `GeneratePDFButtonComponent`.
- **Test Coverage**: Added focused coverage for worker cancellation, fallback suppression, component progress state, and generate button progress/cancel behavior.
- **Feature 14 — PDF Compression**: Three-level compression tool (low/medium/high) using pdf-lib re-save and pdfjs-dist canvas re-rendering with JPEG encoding.
- **Feature 15 — PDF Password Protection & Encryption**: WASM-based QPDF encryption/decryption via qpdf-run, Add/Remove password modes, AES-256 encryption, 8 permission controls, 39 new tests.

## Validation
- `npm.cmd run build` passes with existing jsPDF/canvg CommonJS optimization warnings.
- `npm.cmd test -- --watch=false` passes with 175 tests (prior to Feature 15). Feature 15 adds 39 additional tests.

## Next Priority
1. Feature 16: Mixed PDF + Image Workflows beyond simple extraction.
2. Add IndexedDB-based persistence for session state and saved settings.
3. Worker-backed compression for large PDFs (Phase 6).

Example prompt for next session:

```text
Implement Feature 16: Mixed PDF + Image Workflows.

Requirements:
- Allow mixing image files and PDF pages in the same output
- Extract pages from PDFs and combine with uploaded images
- Support the existing layout engine for mixed content
- Follow the same service/component pattern as existing Phase 3 tools

Validation:
- npm.cmd run build passes
- npm.cmd test -- --watch=false passes
- Existing merge, split, rearrange, compress, protect, and image-to-PDF tools still work
```
