# Image to PDF Converter -> Online2PDF-Level Platform Roadmap

> Status-aware roadmap for the current Angular image-to-PDF application.
>
> Last implementation audit: 2026-05-17
>
> Verified during audit:
> - `npm.cmd run build` passes
> - `npm.cmd test -- --watch=false` passes
> - Production build emits bundle/CommonJS warnings from jsPDF dependency chain
> - Initial bundle is currently about 711 kB raw, above the 500 kB warning budget
> - No backend, worker, OCR, preview, PDF manipulation, storage, or PWA systems are implemented yet

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
- File validation result model with user-facing error banner
- Dedicated PDF generation error message
- Uploaded file metadata for size and MIME type
- Modern responsive UI shell
- System-driven dark mode CSS variables
- Unit tests for app creation/title, file handling, PDF generation behavior, and layout utilities

Partially implemented:

- Reordering exists, but it uses native drag events instead of Angular CDK.
- Image editing supports crop and rotate only.
- Dark mode follows `prefers-color-scheme`, but there is no manual theme engine.
- Loading state exists for PDF generation, but generation is synchronous and not worker-backed.

Not implemented:

- Real PDF preview/page thumbnails/zoom/navigation
- Image compression/optimizer service
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
- jsPDF
- RxJS

Not installed yet:
- @angular/cdk
- pdf-lib
- pdfjs-dist
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

## Status: Partial foundation complete

Implemented files include:

```text
src/app/app.ts
src/app/app.html
src/app/app.scss
src/app/services/file.service.ts
src/app/services/pdf.service.ts
src/app/utils/pdf-layout-engine.ts
src/app/components/app-header/
src/app/components/drag-drop-zone/
src/app/components/file-list/
src/app/components/file-item/
src/app/components/generate-pdf-button/
src/app/components/image-editor-modal/
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

## Overall Status: Mostly partial, with several core pieces now implemented

The app now has a reusable settings panel, configurable margins/fit/alignment/background color, a pure layout utility for 1-up, 2-up, and 4-up image placement, and focused unit coverage. Preview, compression, CDK drag-and-drop, and worker-backed processing remain.

---

## Feature 1. Advanced PDF Settings Panel

Status: Implemented for current Phase 1 scope

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

Not implemented:

- Settings persistence

Recommended next task:

Add optional local persistence for settings after IndexedDB/local workspace strategy is chosen.

Suggested target model:

```ts
export interface PDFSettings {
  pageSize: 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  imageFit: 'contain' | 'cover' | 'stretch';
  imageAlignment: 'center' | 'top' | 'bottom';
  quality: 'FAST' | 'MEDIUM' | 'SLOW';
  backgroundColor: string;
  imagesPerPage: 1 | 2 | 4;
}
```

Note:

- Existing code uses `SLOW` for high quality because this is the jsPDF compression value.
- Previous roadmap drafts used `HIGH`; keep `SLOW` internally or map UI label "High quality" to `SLOW`.

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

Status: Not started

Not implemented:

- `pdfjs-dist`
- `components/pdf-preview/`
- Live preview
- Page thumbnails
- Zoom controls
- Page navigation

Recommended next task:

Implement after the PDF settings/layout model stabilizes, so preview and generation share the same settings.

---

## Feature 5. Drag-and-Drop Reordering

Status: Partial

Implemented:

- Native HTML drag-and-drop support in `file-list` and `file-item`
- Reordering through `FileService.reorderFiles()`

Not implemented:

- `@angular/cdk`
- `CdkDragDrop`
- `moveItemInArray()`
- Touch-friendly CDK drag behavior
- Smooth CDK animations

Recommendation:

Upgrade to Angular CDK when improving mobile/touch reordering. Current native implementation is usable on desktop but is not the final roadmap target.

---

## Feature 6. Compression Engine

Status: Not started

Current behavior:

- jsPDF receives a compression setting when adding images.
- There is no pre-PDF image resizing/compression pipeline.
- File metadata now tracks original size and type, which can support future compression UX.

Not implemented:

- `services/image-optimizer.service.ts`
- Canvas resizing
- JPEG quality presets before PDF generation
- DPI reduction
- Worker-backed compression
- Output size estimate

Recommended next task:

Add browser-side image optimization before PDF preview/export. This should be service-owned and later worker-backed.

---

# PHASE 2 - ADVANCED IMAGE/PDF CONTROLS

## Objective

Add advanced editing and document layout controls.

## Overall Status: Mostly not started

---

## Feature 7. Advanced Image Editor

Status: Partial

Implemented:

- Crop selection
- Rotate left/right
- Canvas-based output to JPEG Data URL

Not implemented:

- Brightness
- Contrast
- Grayscale
- Sharpen
- Filters
- Resize
- Flip horizontal/vertical
- Konva integration
- Non-destructive edit metadata

Recommendation:

Before adding filters, decide whether edits should mutate the image Data URL immediately or store an edit pipeline that can be reapplied during PDF generation.

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

## Overall Status: Not started

Partially related current behavior:

- File size is limited to 10 MB per image.
- PDF generation is synchronous on the main thread.
- Uploaded images are stored as Data URLs in memory.

Not implemented:

- Web Workers
- Chunked processing
- Virtual scrolling
- IndexedDB/Dexie persistence
- Autosave/session restore
- Thumbnail optimization
- Explicit canvas/object cleanup strategy

High-priority risks:

- Large image batches can freeze the UI during PDF generation.
- Data URLs increase memory pressure for large images.
- No recovery exists if the page refreshes.

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

1. Add image optimization/compression service.
2. Add real PDF preview using `pdfjs-dist`.
3. Replace native reordering with Angular CDK for better touch support.
4. Add Web Worker support for expensive image/PDF processing.
5. Add IndexedDB session persistence.
6. Add PDF upload/merge/split tools after the tool architecture exists.
7. Add ZIP/multiple output modes after export architecture exists.
8. Add OCR only after worker infrastructure is in place.

This order builds directly on what is already implemented and avoids introducing large PDF manipulation systems before the core image-to-PDF workflow is solid.

---

# Recommended Near-Term Tasks

## Task A - Clean Baseline UX

Status: Implemented for current scope

Implemented:

- Debug logs removed from `App` and `FileService`
- Visible validation messages for unsupported, oversized, and read-error files
- Dedicated PDF generation error message
- File metadata preserved as `size` and `type`
- Service tests cover validation and reordering

Remaining:

- Revisit object URL/Data URL memory strategy during performance work

## Task B - Extract PDF Settings Panel

Status: Implemented

Implemented:

- `src/app/components/pdf-settings-panel/` exists
- Page size, orientation, quality, advanced settings, summary, and generate button are inside the panel
- `App` receives settings via `settingsChanged`

Remaining:

- Optional settings persistence belongs with future local workspace work.

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
| PDF rendering | pdfjs-dist | Not installed |
| OCR | tesseract.js | Not installed |
| Drag and drop | Angular CDK | Not installed |
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

Example prompt:

```text
Implement Task B from online_2_pdf_feature_roadmap_plan.md.

Requirements:
- Create a standalone PDF settings panel component.
- Move the existing page size, orientation, and quality controls into it.
- Keep current behavior unchanged.
- Do not add new PDF settings yet.

Validation:
- npm.cmd run build passes.
```
