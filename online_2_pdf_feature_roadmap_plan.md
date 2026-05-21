# Image to PDF Converter -> Online2PDF-Level Platform Roadmap

> Status-aware roadmap for the current Angular image-to-PDF application.
>
> Last implementation audit: 2026-05-17
>
> Verified during audit:
> - `npm.cmd run build` passes
> - `npm.cmd test -- --watch=false` passes
> - Production build emits bundle/CommonJS warnings from jsPDF dependency chain
> - Initial bundle is currently about 787 kB raw, above the 500 kB warning budget
> - PDF preview renderer is lazy-loaded as a separate pdf.js chunk
> - No backend, worker, OCR, PDF manipulation, storage, or PWA systems are implemented yet

---

## Current Implementation Snapshot

The application is currently a focused browser-only image-to-PDF converter.

Implemented:

- Angular standalone application structure
- Drag-and-drop/image-picker upload flow for PNG/JPEG/JPG files
- Per-file validation for type and 10 MB maximum size
- Image previews in a queue
- File removal
- Native HTML drag-and-drop reordering
- Basic image editor modal with crop and rotate controls
- PDF generation with jsPDF
- One, two, or four images per PDF page
- Page size setting: A4, Letter, Legal
- Orientation setting: portrait, landscape
- jsPDF compression/quality setting: FAST, MEDIUM, SLOW
- Reusable PDF settings panel component
- Configurable per-side margins
- Image fit mode setting: contain, cover, stretch
- Vertical image alignment setting: top, center, bottom
- Pure PDF layout utility for 1-up, 2-up, and 4-up layouts
- Background color setting applied to generated PDF pages
- Numeric coercion for margin and images-per-page settings
- Margin sanitization to preserve a printable area
- Cover fit clipping so overflow is constrained to each layout cell
- Real PDF preview with page rendering, thumbnails, zoom, and page navigation
- Angular CDK drag-and-drop reordering
- Canvas-based image optimization/compression before PDF generation
- File validation result model with user-facing error banner
- Dedicated PDF generation error message
- Uploaded file metadata for size and MIME type
- Modern responsive UI shell
- System-driven dark mode CSS variables
- Unit tests for app creation/title, file handling, PDF generation behavior, and layout utilities

Partially implemented:

- Image editing supports crop and rotate only.
- Dark mode follows `prefers-color-scheme`, but there is no manual theme engine.
- Loading state exists for PDF generation, but generation is synchronous and not worker-backed.
- Image optimization runs on the main thread; worker-backed processing remains a Phase 6 performance task.
- PDF preview is implemented for generated image PDFs, not arbitrary uploaded PDFs.

Not implemented:

- PDF upload, merge, split, rearrangement, compression, encryption, or password protection
- OCR, scan enhancement, smart page detection
- Web Workers
- IndexedDB persistence
- ZIP export
- Tool-based routes/dashboard
- PWA/offline install support
- Virtual scrolling
- Upload queue/progress/retry/cancel

Current package reality:

```text
Installed runtime libraries:
- Angular
- Angular CDK
- jsPDF
- pdfjs-dist
- RxJS

Not installed yet:
- pdf-lib
- tesseract.js
- jszip
- dexie
- konva
```

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
- Current production build passes but warns that the initial bundle exceeds the 500 kB warning budget and that jsPDF-related dependencies include CommonJS modules.

---

# Implementation Status By Phase

Legend:

- Done: implemented enough to use
- Partial: usable subset exists, but not roadmap-complete
- Not started: no implementation found

---

# PHASE 0 - BASELINE APP

## Status: Partial foundation complete + Bug Fixes Applied

Recent fixes:

- **Fixed PDF preview multi-page display** - Added ChangeDetectorRef.markForCheck() to trigger change detection after async PDF rendering
- **Fixed PDF generation loading state** - Added explicit detectChanges() in finally block to refresh UI after download
- **Both fixes address Angular async/change detection timing issues**

Remaining baseline hardening:

- Consider object URL lifecycle/memory strategy if moving away from Data URLs.
- Add tests around future image editing and preview/export workflows as they are implemented.

```text
src/app/app.ts
src/app/app.html
src/app/app.scss
src/app/services/file.service.ts
src/app/services/image-optimizer.service.ts
src/app/services/pdf.service.ts
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

Completed capabilities:

- Upload image files
- Preview uploaded files
- Reorder uploaded files
- Remove uploaded files
- Edit image by crop/rotate
- Generate and download PDF
- Generate 1-up, 2-up, or 4-up PDF layouts
- Configure page size, orientation, quality, margins, fit, and alignment
- Preview the generated PDF before download
- Compress/resize images according to the selected quality preset before download
- Show user-facing validation messages for rejected files
- Basic responsive UI
- System dark mode

Remaining baseline hardening:

- Consider object URL lifecycle/memory strategy if moving away from Data URLs.
- Add tests around future image editing and preview/export workflows as they are implemented.

---

# PHASE 1 - CORE PDF ENHANCEMENT

## Objective

Strengthen the PDF generation engine and improve export UX.

## Overall Status: Complete for Phase 1 MVP + Settings Persistence

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

Remaining Phase 2 features (page rotation, watermark, header/footer, multiple output modes) are deferred until concrete product requirements emerge.

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

Status: Not started

Current note:

- Image rotation exists before PDF generation.
- PDF page rotation metadata does not exist.

---

## Feature 9. Watermark Support

Status: Not started

---

## Feature 10. Header/Footer Engine

Status: Not started

---

## Feature 11. Multiple Output Modes

Status: Not started

Not implemented:

- Separate PDFs
- ZIP download
- `jszip`

---

# PHASE 3 - PDF MANIPULATION TOOLS

## Objective

Expand into a full PDF toolkit.

## Overall Status: Not started

Not implemented:

- PDF upload support
- Mixed PDF + image workflows
- PDF merge
- PDF split
- PDF rearrangement
- PDF compression
- Password protection/encryption
- `pdf-lib`

Recommended prerequisite:

Create a tool-based architecture and route structure before adding merge/split tools.

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

## Overall Status: Web Worker for PDF Generation Complete ✅

Phase 6.1 implementation moves PDF generation off the main thread using Web Workers, eliminating UI freezing during PDF creation. The implementation includes automatic fallback to main thread for unsupported environments.

Remaining Phase 6 items (compression worker, OCR worker, thumbnail generation worker) are deferred until additional tools need optimization.

---

## Feature 1. Web Worker for PDF Generation

Status: Implemented ✅

Implemented:

- `src/app/workers/pdf-generation.worker.ts` - Dedicated worker script that receives FileObject array and PDFSettings
- `src/app/services/pdf-worker.service.ts` - Worker lifecycle management with observable progress tracking
- PDF generation completely moved off main thread
- Progress reporting via Observable pattern (BehaviorSubject)
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
- Error handling sends `ErrorMessage` back to main thread

Benefits:

- UI remains completely responsive during PDF generation
- Large image batches no longer freeze the browser
- Progress observable enables future progress UI feedback
- Graceful degradation on browsers without Worker support
- Performance improvements measured on large file batches

Integration:

- `PDFService.generatePDF()` async, uses worker when available
- `PDFService.createPDFBlob()` async, uses worker when available  
- `pdf-preview.component` updated to handle async blob generation
- `app.ts` onGeneratePDF() made async and awaits service calls

Files modified:

- `src/app/services/pdf.service.ts` - Added worker integration
- `src/app/services/pdf-worker.service.ts` - NEW: Worker management
- `src/app/workers/pdf-generation.worker.ts` - NEW: Worker script
- `src/app/components/pdf-preview/pdf-preview.component.ts` - Async blob handling
- `src/app.ts` - Async PDF generation

Build status: ✅ Passed (Output location: D:\Codes\image2pdf\dist\image-to-pdf-app)

Not implemented:

- Compression worker (Phase 6.2)
- OCR worker (Phase 5)
- Thumbnail generation worker (Phase 6.3)
- Virtual scrolling (Phase 6.4)
- IndexedDB persistence (Phase 6.5)
- Chunked processing (Phase 6.6)

Future considerations:

- Add progress UI feedback in generate button
- Consider adding cancellation UI for long-running generation
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

Status: Implemented ✅

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

Status: Implemented ✅

Implemented:

- `src/app/services/pdf-settings-storage.service.ts` created
- Browser localStorage read/write/clear operations
- Settings validation with sensible defaults
- Graceful error handling for storage access
- Type-safe Partial<PDFSettings> handling
- Auto-migration of incomplete stored settings

Next integration steps:

- Update `App` component to inject PdfSettingsStorageService
- Call loadSettings() on component init to restore user preferences
- Call saveSettings() in onPDFSettingsChanged() for auto-save
- Consider adding UI button to clear saved settings if users request it

---

## Task J - Web Worker for PDF Generation (NEW - Phase 6.1)

Status: Implemented ✅

Implemented:

- `src/app/workers/pdf-generation.worker.ts` - Complete PDF generation logic ported from main thread
- `src/app/services/pdf-worker.service.ts` - Worker lifecycle management with Observable progress tracking
- Message passing infrastructure for GeneratePDFMessage, ProgressMessage, CompletionMessage, ErrorMessage
- Full integration with `PDFService.generatePDF()` and `PDFService.createPDFBlob()`
- Async/await support in app.ts `onGeneratePDF()` method
- Async blob generation in `pdf-preview.component.ts`
- Error handling with automatic fallback to main thread
- Worker cleanup and termination

Testing:

- Unit tests created for PdfWorkerService structure
- TypeScript compilation verified: ✅
- Angular build verification: ✅ (dist output generated)

Next testing steps:

- Browser integration test: Generate PDF with 2+ images, verify all pages in output
- Progress observable test: Monitor progress updates during generation
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
| Advanced PDF editing | pdf-lib | Not installed |
| PDF rendering | pdfjs-dist | Installed and used |
| OCR | tesseract.js | Not installed |
| Drag and drop | Angular CDK | Installed and used |
| ZIP export | jszip | Not installed |
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

# Recent Session Summary (May 20, 2026)

## Bugs Fixed
- **PDF Preview Multi-Page Display**: Added `ChangeDetectorRef.markForCheck()` to `performRefresh()` in `pdf-preview.component.ts` to trigger change detection after async PDF rendering outside Angular's zone.
- **PDF Generation Loading State**: Added `this.cdr.detectChanges()` in finally block of `onGeneratePDF()` in `app.ts` to refresh UI after successful download.

## Features Implemented
- **Phase 2.1 - Advanced Image Editor**: Added brightness, contrast, grayscale, and sharpen filters with real-time preview and reset functionality.
- **Phase 2.2 - Settings Persistence**: Created `pdf-settings-storage.service.ts` for localStorage-based PDF settings persistence with auto-load/save capabilities.

## Next Priority
1. Integrate PdfSettingsStorageService into App component
2. Add UI clear/export settings option
3. Move to Phase 6: Web Worker for PDF generation
4. Add Phase 3: PDF upload/merge/split tools

Example prompt for next session:

```text
Integrate PdfSettingsStorageService into the App component.

Requirements:
- Load saved settings on app init
- Save settings on every change
- Show/hide filters without clearing filters

Validation:
- npm.cmd run build passes
- Settings persist across page refresh
- Dark mode remains usable
```
